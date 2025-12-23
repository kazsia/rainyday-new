-- Modify claim_stock to NOT raise exception on insufficient stock
-- This allows "best effort" delivery. If stock is missing, we deliver 0 items but don't crash.
drop function if exists public.claim_stock(uuid, integer, uuid, uuid);

create or replace function public.claim_stock(
    p_product_id uuid,
    p_quantity integer,
    p_order_id uuid,
    p_variant_id uuid default null
)
returns table (content text, type text)
language plpgsql
security definer
as $$
declare
    v_ids uuid[];
    v_count integer;
begin
    -- Select available asset IDs with locking
    select array_agg(id) into v_ids
    from (
        select id 
        from public.delivery_assets
        where product_id = p_product_id 
          and (
              -- Match specific variant if requested
              (p_variant_id is not null and variant_id = p_variant_id)
              OR
              -- If no variant requested, match generic stock (variant_id is null) or any stock? 
              -- Usually if item has no variant, we look for variant_id is null.
              (p_variant_id is null and variant_id is null)
              OR 
              -- Fallback: If we requested a variant but NONE found, SHOULD we check generic? 
              -- For now let's strict match but Fallback logic could go here.
              -- Let's stick to strict match but REMOVE EXCEPTION.
              1=0
          )
          and is_used = false
        limit p_quantity
        for update skip locked
    ) sub;
    
    -- Correction on the query logic above - simpler standard logic:
    -- where product_id = p_product_id 
    --  and (
    --      (p_variant_id is null and variant_id is null) OR
    --      (p_variant_id is not null and variant_id = p_variant_id)
    --  )
    --  and is_used = false
    
    -- Let's re-run the simpler query logic but without exception
    select array_agg(id) into v_ids
    from (
        select id 
        from public.delivery_assets
        where product_id = p_product_id 
          and (
            (p_variant_id is null and variant_id is null)
            or 
            (p_variant_id is not null and variant_id = p_variant_id)
          )
          and is_used = false
        limit p_quantity
        for update skip locked
    ) sub;

    v_count := coalesce(array_length(v_ids, 1), 0);

    -- REMOVED EXCEPTION RAISING
    -- if v_count < p_quantity or v_ids is null then
    --     raise exception 'Insufficient stock available (Requested: %, Found: %)', p_quantity, v_count;
    -- end if;

    -- Only update if we found something
    if v_count > 0 then
        -- Update product stock count
        update public.products
        set stock_count = stock_count - v_count
        where id = p_product_id;

        -- Update variant stock count if applicable
        if p_variant_id is not null then
            update public.product_variants
            set stock_count = stock_count - v_count
            where id = p_variant_id;
        end if;

        -- Update assets and return them
        return query
        update public.delivery_assets
        set is_used = true, 
            order_id = p_order_id
        where id = any(v_ids)
        returning delivery_assets.content, delivery_assets.type::text;
    end if;
    
    -- If nothing found, return empty result (process continues gracefully)
    return;
end;
$$;

NOTIFY pgrst, 'reload config';

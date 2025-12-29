-- Fix claim_stock to only decrement product stock when no variant is used
-- When using variant stock, only decrement variant stock_count

drop function if exists public.claim_stock(uuid, integer, uuid, uuid, text);

create or replace function public.claim_stock(
    p_product_id uuid,
    p_quantity integer,
    p_order_id uuid,
    p_variant_id uuid default null,
    p_selection_method text default 'last'
)
returns table (
    content text, 
    type text, 
    product_id uuid, 
    variant_id uuid
)
language plpgsql
security definer
as $$
declare
    v_ids uuid[];
    v_count integer;
begin
    -- Select available asset IDs
    select array_agg(sub.id) into v_ids
    from (
        select da.id 
        from public.delivery_assets da
        where da.product_id = p_product_id 
          and (
            (p_variant_id is null and da.variant_id is null)
            or 
            (p_variant_id is not null and da.variant_id = p_variant_id)
          )
          and da.is_used = false
        order by 
            case when p_selection_method = 'first' then da.created_at end asc,
            case when p_selection_method = 'last' then da.created_at end desc,
            case when p_selection_method = 'random' then random() end
        limit p_quantity
        for update skip locked
    ) sub;

    v_count := coalesce(array_length(v_ids, 1), 0);

    if v_count > 0 then
        -- FIXED: Only decrement ONE of product or variant, not both
        if p_variant_id is not null then
            -- Variant stock claim: only decrement variant stock
            update public.product_variants
            set stock_count = stock_count - v_count
            where id = p_variant_id;
        else
            -- Product-level stock claim: only decrement product stock
            update public.products
            set stock_count = stock_count - v_count
            where id = p_product_id;
        end if;

        return query
        update public.delivery_assets da
        set is_used = true, 
            order_id = p_order_id
        where da.id = any(v_ids)
        returning da.content, da.type::text, da.product_id, da.variant_id;
    end if;
end;
$$;

NOTIFY pgrst, 'reload config';

-- 010_add_delivery_logic.sql

-- 1. Add delivery_assets column to deliveries table to store multiple items
alter table public.deliveries add column if not exists delivery_assets jsonb;
-- Make 'content' nullable since we might use delivery_assets instead
alter table public.deliveries alter column content drop not null;

-- 2. RPC function for atomic stock claiming
-- Usage: supabase.rpc('claim_stock', { p_product_id: '...', p_variant_id: '...', p_quantity: 1, p_order_id: '...' })
create or replace function claim_stock(
    p_product_id uuid,
    p_quantity integer,
    p_order_id uuid,
    p_variant_id uuid default null
)
returns table (content text, type text)
language plpgsql
security definer -- Run as superuser
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
          and (p_variant_id is null or variant_id = p_variant_id)
          and is_used = false
        limit p_quantity
        for update skip locked
    ) sub;

    v_count := coalesce(array_length(v_ids, 1), 0);

    -- Check sufficiency
    if v_count < p_quantity or v_ids is null then
        raise exception 'Insufficient stock available (Requested: %, Found: %)', p_quantity, v_count;
    end if;

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
end;
$$;

-- 3. RPC for incrementing stock count (used by Admin Add/Delete Stock)
create or replace function increment_stock(
    p_product_id uuid,
    p_amount integer
)
returns void
language plpgsql
security definer
as $$
begin
    update public.products
    set stock_count = stock_count + p_amount
    where id = p_product_id;
end;
$$;

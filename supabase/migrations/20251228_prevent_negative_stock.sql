-- Prevent stock from going negative by using GREATEST(0, ...)
-- Update increment_variant_stock to prevent negative stock
create or replace function public.increment_variant_stock(
    p_variant_id uuid,
    p_amount integer
)
returns void
language plpgsql
security definer
as $$
declare
    v_product_id uuid;
    v_is_unlimited_variant boolean;
    v_is_unlimited_product boolean;
begin
    -- Get product_id and check unlimited status
    select product_id, is_unlimited into v_product_id, v_is_unlimited_variant 
    from public.product_variants 
    where id = p_variant_id;

    select is_unlimited into v_is_unlimited_product
    from public.products
    where id = v_product_id;
    
    -- Update variant stock ONLY if not unlimited, and prevent going below 0
    if not v_is_unlimited_variant then
        update public.product_variants
        set stock_count = greatest(0, stock_count + p_amount)
        where id = p_variant_id;
    end if;
    
    -- Sync product stock (sum of all variants, but only those not unlimited)
    if not v_is_unlimited_product then
        update public.products
        set stock_count = (
            select coalesce(sum(stock_count), 0) 
            from public.product_variants 
            where product_id = v_product_id 
              and is_unlimited = false
        )
        where id = v_product_id;
    end if;
end;
$$;

-- Also update increment_stock for products without variants
create or replace function public.increment_stock(
    p_product_id uuid,
    p_amount integer
)
returns void
language plpgsql
security definer
as $$
begin
    update public.products
    set stock_count = greatest(0, stock_count + p_amount)
    where id = p_product_id
      and is_unlimited = false;
end;
$$;

-- Fix any existing negative stock values
update public.products set stock_count = 0 where stock_count < 0;
update public.product_variants set stock_count = 0 where stock_count < 0;

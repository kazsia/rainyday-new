-- 029_product_variants.sql
-- 1. Add webhook_url column to products table
alter table public.products add column if not exists webhook_url text;

-- 2. Create product_variants table
create table if not exists public.product_variants (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    name text not null,
    price decimal(12, 2) not null default 0,
    slashed_price decimal(12, 2),
    stock_count integer not null default 0,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Link delivery_assets to variants
alter table public.delivery_assets add column if not exists variant_id uuid references public.product_variants(id) on delete cascade;

-- 4. Enable RLS
alter table public.product_variants enable row level security;

-- 5. Policies
create policy "Allow public read for variants" on public.product_variants
    for select using (true);

create policy "Allow all for admin on variants" on public.product_variants
    for all using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- 6. Realtime
do $$ begin
    alter publication supabase_realtime add table public.product_variants;
exception when others then null; end $$;

-- 7. RPC for incrementing variant stock count
create or replace function increment_variant_stock(
    p_variant_id uuid,
    p_amount integer
)
returns void
language plpgsql
security definer
as $$
declare
    v_product_id uuid;
begin
    -- Get product_id
    select product_id into v_product_id from public.product_variants where id = p_variant_id;
    
    -- Update variant stock
    update public.product_variants
    set stock_count = stock_count + p_amount
    where id = p_variant_id;
    
    -- Sync product stock (sum of all variants)
    update public.products
    set stock_count = (select coalesce(sum(stock_count), 0) from public.product_variants where product_id = v_product_id)
    where id = v_product_id;
end;
$$;

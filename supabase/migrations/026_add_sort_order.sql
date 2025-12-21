-- 026_add_sort_order.sql
alter table public.product_categories add column if not exists sort_order integer default 0;
alter table public.products add column if not exists sort_order integer default 0;

-- Index for sort_order
create index if not exists idx_product_categories_sort_order on public.product_categories(sort_order);
create index if not exists idx_products_sort_order on public.products(sort_order);

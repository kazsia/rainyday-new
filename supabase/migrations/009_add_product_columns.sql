-- 009_add_product_columns.sql
-- Add missing columns to products table to support full product editing features

alter table public.products add column if not exists slug text unique;
alter table public.products add column if not exists instructions text;
alter table public.products add column if not exists delivery_type text default 'serials';
alter table public.products add column if not exists status_label text default 'In Stock!';
alter table public.products add column if not exists status_color text default 'green';
alter table public.products add column if not exists show_view_count boolean default false;
alter table public.products add column if not exists show_sales_count boolean default true;
alter table public.products add column if not exists show_sales_notifications boolean default true;
alter table public.products add column if not exists slashed_price decimal(12, 2);
alter table public.products add column if not exists min_quantity integer default 1;
alter table public.products add column if not exists max_quantity integer default 10;

-- Index for slug for faster lookups
create index if not exists idx_products_slug on public.products(slug);

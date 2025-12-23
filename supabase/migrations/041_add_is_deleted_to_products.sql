-- 041_add_is_deleted_to_products.sql
alter table public.products add column if not exists is_deleted boolean not null default false;

-- Disable RLS on this column for now (or strictly, modify policies if needed, but 'products' RLS is usually permissive for reads or handled by admin roles)
-- Ensure existing policies don't break. Usually admin sees all.

-- Optional: Index for performance if table grows large
create index if not exists idx_products_is_deleted on public.products(is_deleted);

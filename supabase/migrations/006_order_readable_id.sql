-- 006_order_readable_id.sql
alter table public.orders add column if not exists readable_id text unique;
create index if not exists idx_orders_readable_id on public.orders(readable_id);

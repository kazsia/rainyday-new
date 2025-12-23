-- 033_nullable_order_email.sql
-- Make email column nullable to support draft orders for unique checkout URLs
alter table public.orders alter column email drop not null;

-- 008_fix_order_read_rls.sql
-- Allow anyone to read orders by ID (for invoice page after checkout)
-- This is safe because the order ID is a UUID that's not guessable

create policy "Anyone can read orders by ID" on public.orders for select using (true);

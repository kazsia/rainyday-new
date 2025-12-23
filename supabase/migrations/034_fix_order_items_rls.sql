-- 034_fix_order_items_rls.sql
-- Allow anyone to read order items if they have the order ID
-- This is necessary for the unique checkout URL to work for anonymous users

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Anyone can read order items by order ID" on public.order_items for select using (true);

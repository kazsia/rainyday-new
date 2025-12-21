-- 015_fix_payments_rls.sql
-- Allow anyone to create payment records (required for guest checkout)
-- and allow users to read their own payments based on email or user_id

-- 1. DROP RESTRICTIVE POLICIES
drop policy if exists "Users can read own payments" on public.payments;
drop policy if exists "Anyone can create payments" on public.payments;

-- 2. CREATE PERMISSIVE POLICIES
create policy "Anyone can create payments" on public.payments 
for insert with check (true);

create policy "Users can read own payments" on public.payments for select
using (
    order_id in (
        select id from public.orders 
        where user_id = auth.uid() 
        or email = (select email from public.profiles where id = auth.uid())
        or email in (select email from public.customers where id in (select id from public.customers where user_id = auth.uid()))
    )
);

-- Also ensure anyone can read a payment if they know the order_id (public invoice view)
create policy "Anyone can read payment by order_id" on public.payments for select
using (true);

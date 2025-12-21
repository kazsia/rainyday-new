-- 007_fix_payment_rls.sql
-- Fix RLS policies to allow payment creation during checkout

-- Allow anyone to create payments (for checkout flow)
create policy "Anyone can create payments" on public.payments for insert with check (true);

-- Allow users to create invoices
create policy "Anyone can create invoices" on public.invoices for insert with check (true);

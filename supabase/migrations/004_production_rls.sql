-- 004_production_rls.sql
-- Migration to implement strict production-grade RLS policies

-- 1. ENABLE RLS ON ALL TABLES
alter table public.profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_assets enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.deliveries enable row level security;
alter table public.invoices enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.feedbacks enable row level security;
alter table public.site_settings enable row level security;
alter table public.blacklist enable row level security;
alter table public.audit_logs enable row level security;
alter table public.roles enable row level security;

-- 2. HELPER FUNCTIONS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and (role::text = 'admin')
  );
end;
$$ language plpgsql security definer;

-- 3. DROP EXISTING POLICIES (Safety for re-runs)
do $$
declare
    r record;
begin
    for r in (
        select policyname, tablename 
        from pg_policies 
        where schemaname = 'public' 
        and tablename in (
            'profiles', 'product_categories', 'products', 'delivery_assets', 
            'orders', 'order_items', 'payments', 'payment_transactions', 
            'deliveries', 'invoices', 'tickets', 'ticket_replies', 
            'feedbacks', 'site_settings', 'blacklist', 'audit_logs', 'roles'
        )
    ) loop
        execute 'drop policy if exists ' || quote_ident(r.policyname) || ' on public.' || quote_ident(r.tablename);
    end loop;
end $$;

-- 4. POLICIES

-- PROFILES
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can manage profiles" on public.profiles for all using (public.is_admin());

-- PRODUCT CATEGORIES
create policy "Anyone can read categories" on public.product_categories for select using (true);
create policy "Admins can manage categories" on public.product_categories for all using (public.is_admin());

-- PRODUCTS
create policy "Anyone can read active products" on public.products for select using (is_active = true);
create policy "Admins can manage products" on public.products for all using (public.is_admin());

-- DELIVERY ASSETS
create policy "Admins can manage assets" on public.delivery_assets for all using (public.is_admin());

-- ORDERS
create policy "Users can read own orders" on public.orders for select 
using (auth.uid() = user_id or email = (select email from public.profiles where id = auth.uid()));
create policy "Anyone can create orders" on public.orders for insert with check (true);
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

-- ORDER ITEMS
create policy "Users can read own order items" on public.order_items for select
using (order_id in (select id from public.orders where user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid())));
create policy "Anyone can create order items" on public.order_items for insert with check (true);
create policy "Admins can manage order items" on public.order_items for all using (public.is_admin());

-- PAYMENTS
create policy "Users can read own payments" on public.payments for select
using (order_id in (select id from public.orders where user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid())));
create policy "Admins can manage payments" on public.payments for all using (public.is_admin());

-- PAYMENT TRANSACTIONS
create policy "Admins can manage transactions" on public.payment_transactions for all using (public.is_admin());

-- DELIVERIES
create policy "Users can read own deliveries" on public.deliveries for select
using (order_id in (select id from public.orders where user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid())));
create policy "Admins can manage deliveries" on public.deliveries for all using (public.is_admin());

-- INVOICES
create policy "Users can read own invoices" on public.invoices for select
using (order_id in (select id from public.orders where user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid())));
create policy "Admins can manage invoices" on public.invoices for all using (public.is_admin());

-- TICKETS
create policy "Users can read own tickets" on public.tickets for select
using (user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid()));
create policy "Anyone can create tickets" on public.tickets for insert with check (true);
create policy "Admins can manage tickets" on public.tickets for all using (public.is_admin());

-- TICKET REPLIES
create policy "Users can read own ticket replies" on public.ticket_replies for select
using (ticket_id in (select id from public.tickets where user_id = auth.uid() or email = (select email from public.profiles where id = auth.uid())));
create policy "Users can create replies" on public.ticket_replies for insert with check (auth.uid() = user_id);
create policy "Admins can manage replies" on public.ticket_replies for all using (public.is_admin());

-- FEEDBACKS
create policy "Anyone can read approved feedback" on public.feedbacks for select using (is_approved = true);
create policy "Users can create feedback" on public.feedbacks for insert with check (auth.uid() = user_id);
create policy "Admins can manage feedback" on public.feedbacks for all using (public.is_admin());

-- SITE SETTINGS
create policy "Anyone can read settings" on public.site_settings for select using (true);
create policy "Admins can manage settings" on public.site_settings for all using (public.is_admin());

-- BLACKLIST
create policy "Admins can manage blacklist" on public.blacklist for all using (public.is_admin());

-- AUDIT LOGS
create policy "Admins can read audit logs" on public.audit_logs for select using (public.is_admin());

-- ROLES
create policy "Anyone can read roles" on public.roles for select using (true);
create policy "Admins can manage roles" on public.roles for all using (public.is_admin());

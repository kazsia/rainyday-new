-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.invoices enable row level security;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- PROFILES POLICIES
-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- PRODUCTS POLICIES
-- Anyone can read active products
create policy "Anyone can read active products"
  on public.products for select
  using (is_active = true);

-- Admins can do everything with products
create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin());

-- ORDERS POLICIES
-- Users can read their own orders (by user_id or email)
create policy "Users can read own orders"
  on public.orders for select
  using (
    auth.uid() = user_id 
    or email = (select email from public.profiles where id = auth.uid())
  );

-- Authenticated users can create orders
create policy "Authenticated users can create orders"
  on public.orders for insert
  with check (auth.role() = 'authenticated');

-- Admins can do everything with orders
create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_admin());

-- ORDER ITEMS POLICIES
-- Users can read their own order items
create policy "Users can read own order items"
  on public.order_items for select
  using (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        or email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Admins can do everything with order items
create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_admin());

-- PAYMENTS POLICIES
-- Users can read their own payments
create policy "Users can read own payments"
  on public.payments for select
  using (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        or email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Admins can do everything with payments
create policy "Admins can manage payments"
  on public.payments for all
  using (public.is_admin());

-- DELIVERIES POLICIES
-- Users can read their own deliveries
create policy "Users can read own deliveries"
  on public.deliveries for select
  using (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        or email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Users can update their own deliveries (reveal)
create policy "Users can update own deliveries"
  on public.deliveries for update
  using (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        or email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Admins can do everything with deliveries
create policy "Admins can manage deliveries"
  on public.deliveries for all
  using (public.is_admin());

-- INVOICES POLICIES
-- Users can read their own invoices
create policy "Users can read own invoices"
  on public.invoices for select
  using (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        or email = (select email from public.profiles where id = auth.uid())
    )
  );

-- Admins can do everything with invoices
create policy "Admins can manage invoices"
  on public.invoices for all
  using (public.is_admin());

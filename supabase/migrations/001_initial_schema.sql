-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10, 2) not null,
  currency text not null default 'USD',
  image_url text,
  file_path text, -- Path in storage bucket
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'delivered', 'cancelled', 'refunded')),
  total decimal(10, 2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items (junction table)
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null default 1,
  price decimal(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Payments table
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  provider text not null, -- 'stripe', 'crypto', 'paypal'
  provider_payment_id text,
  amount decimal(10, 2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deliveries table
create table public.deliveries (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  delivery_type text not null default 'instant' check (delivery_type in ('instant', 'manual')),
  content text, -- Product key, download link, etc.
  is_revealed boolean not null default false,
  revealed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Invoices table
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  invoice_number text unique not null,
  pdf_path text, -- Path in storage bucket
  created_at timestamptz not null default now()
);

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_email on public.orders(email);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_payments_order_id on public.payments(order_id);
create index idx_deliveries_order_id on public.deliveries(order_id);
create index idx_invoices_order_id on public.invoices(order_id);

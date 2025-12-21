-- 003_full_backend_schema.sql
-- Production-grade schema implementation with safety checks

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
    create type public.order_status as enum ('pending', 'paid', 'delivered', 'completed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.payment_status as enum ('pending', 'processing', 'completed', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.delivery_type as enum ('instant', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.asset_type as enum ('serial', 'file', 'key', 'text', 'url');
exception when duplicate_object then null; end $$;

-- 3. CORE TABLES (Ensuring they exist before modifications)
create table if not exists public.roles (
    name text primary key
);
insert into public.roles (name) values ('user'), ('admin') on conflict do nothing;

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    role text not null default 'user',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    slug text unique not null,
    description text,
    created_at timestamptz not null default now()
);

create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    price decimal(12, 2) not null default 0,
    created_at timestamptz not null default now()
);

-- 4. MODIFY TABLES (Defensive Alterations)

-- A. Profiles Role fix
alter table public.profiles alter column role drop default;
alter table public.profiles alter column role type text using role::text;
update public.profiles set role = 'user' where role not in (select name from public.roles);
do $$ begin
    alter table public.profiles add constraint fk_profiles_role foreign key (role) references public.roles(name);
exception when others then null; end $$;
alter table public.profiles alter column role set default 'user';

-- B. Products enhancement
alter table public.products add column if not exists category_id uuid references public.product_categories(id);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists stock_count integer not null default 0;
alter table public.products add column if not exists currency text not null default 'USD';
alter table public.products add column if not exists description text;
alter table public.products add column if not exists updated_at timestamptz not null default now();

-- C. Orders (Status Enum Conversion)
-- Drop existing constraints that might conflict with the new type
do $$
declare
    r record;
begin
    for r in (select constraint_name from information_schema.constraint_column_usage 
              where table_name = 'orders' and column_name = 'status') loop
        execute 'alter table public.orders drop constraint if exists ' || quote_ident(r.constraint_name);
    end loop;
end $$;

-- If orders table doesn't exist, create it. If it does, alter it.
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id),
    email text not null,
    total decimal(12, 2) not null,
    created_at timestamptz not null default now()
);

alter table public.orders add column if not exists status_new public.order_status default 'pending';
-- If an old status column exists, try to migrate data
do $$ begin
    update public.orders set status_new = status::text::public.order_status;
exception when others then null; end $$;

-- finalize status column
alter table public.orders drop column if exists status;
alter table public.orders rename column status_new to status;
alter table public.orders alter column status set not null;
alter table public.orders alter column status set default 'pending';
alter table public.orders add column if not exists currency text not null default 'USD';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

-- 5. NEW PRODUCTION TABLES

create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) not null,
    quantity integer not null default 1 check (quantity > 0),
    price decimal(12, 2) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    provider text not null,
    provider_payment_id text,
    track_id text,
    amount decimal(12, 2) not null,
    currency text not null default 'USD',
    status public.payment_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) not null,
    type public.delivery_type not null default 'instant',
    content text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.invoices (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    status text not null default 'unpaid',
    created_at timestamptz not null default now()
);

create table if not exists public.delivery_assets (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    type public.asset_type not null default 'text',
    content text not null,
    is_used boolean not null default false,
    order_id uuid,
    created_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
    id uuid primary key default uuid_generate_v4(),
    payment_id uuid references public.payments(id) on delete cascade not null,
    event_type text not null,
    raw_payload jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    admin_id uuid references public.profiles(id),
    action text not null,
    target_table text,
    target_id uuid,
    details jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.tickets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id),
    email text not null,
    subject text not null,
    status public.ticket_status not null default 'open',
    priority public.ticket_priority not null default 'medium',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.ticket_replies (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    user_id uuid references public.profiles(id) not null,
    message text not null,
    is_admin_reply boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.feedbacks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id),
    product_id uuid references public.products(id) on delete cascade,
    rating integer not null check (rating between 1 and 5),
    content text,
    is_approved boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

create table if not exists public.blacklist (
    id uuid primary key default uuid_generate_v4(),
    type text not null check (type in ('ip', 'email')),
    value text not null unique,
    reason text,
    created_at timestamptz not null default now()
);

-- 6. REALTIME ENABLEMENT
do $$ begin
    alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.payments;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.deliveries;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.tickets;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.ticket_replies;
exception when others then null; end $$;

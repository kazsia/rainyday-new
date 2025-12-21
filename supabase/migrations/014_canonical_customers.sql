-- 014_canonical_customers.sql

-- 1. DEFENSIVE TYPE CREATION
do $$ 
begin 
    if not exists (select 1 from pg_type where typname = 'user_status') then
        create type user_status as enum ('active', 'suspended', 'banned');
    end if;
end $$;

-- 2. FIX ADMIN_ACTIONS CONSTRAINTS (Allow logging for guests/customers)
do $$ begin
    alter table public.admin_actions drop constraint if exists admin_actions_target_id_fkey;
    -- Also ensure admin_id references profiles for consistency
    alter table public.admin_actions drop constraint if exists admin_actions_admin_id_fkey;
    alter table public.admin_actions add constraint admin_actions_admin_id_fkey foreign key (admin_id) references public.profiles(id);
exception when others then null; end $$;

-- 3. CREATE TABLES
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    user_id uuid, -- Reference added later via constraint
    is_registered boolean not null default false,
    status user_status not null default 'active',
    newsletter_subscribed boolean not null default false,
    balance numeric not null default 0,
    referrer text,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    created_at timestamptz not null default now()
);

-- 3. CLEANUP EXISTING TRIGGERS
drop trigger if exists on_customer_upsert_orders on public.orders;
drop trigger if exists on_customer_upsert_payments on public.payments;
drop trigger if exists on_customer_upsert_profiles on public.profiles;
drop trigger if exists on_customer_upsert_tickets on public.tickets;
drop trigger if exists on_customer_upsert_newsletter on public.newsletter_subscriptions;

-- 4. INGESTION FUNCTION
create or replace function public.handle_customer_ingestion()
returns trigger as $$
declare
    target_email text;
    target_user_id uuid;
    is_reg boolean := false;
begin
    if tg_table_name = 'profiles' then
        target_email := new.email;
        target_user_id := new.id;
        is_reg := true;
    elsif tg_table_name = 'orders' then
        target_email := new.email;
        target_user_id := new.user_id;
    elsif tg_table_name = 'payments' then
        select email, user_id into target_email, target_user_id from public.orders where id = new.order_id;
    elsif tg_table_name = 'tickets' then
        target_email := new.email;
        target_user_id := new.user_id;
    elsif tg_table_name = 'newsletter_subscriptions' then
        target_email := new.email;
    end if;

    if target_email is null then
        return new;
    end if;

    insert into public.customers (email, user_id, is_registered, last_seen_at)
    values (target_email, target_user_id, is_reg, now())
    on conflict (email) do update
    set 
        user_id = coalesce(public.customers.user_id, excluded.user_id),
        is_registered = case when excluded.is_registered then true else public.customers.is_registered end,
        last_seen_at = excluded.last_seen_at,
        updated_at = now();

    return new;
end;
$$ language plpgsql security definer;

-- 5. TRIGGERS
create trigger on_customer_upsert_orders
    before insert or update of email, user_id on public.orders
    for each row execute procedure public.handle_customer_ingestion();

create trigger on_customer_upsert_payments
    after insert on public.payments
    for each row execute procedure public.handle_customer_ingestion();

create trigger on_customer_upsert_profiles
    after insert or update of email on public.profiles
    for each row execute procedure public.handle_customer_ingestion();

create trigger on_customer_upsert_tickets
    after insert or update of email, user_id on public.tickets
    for each row execute procedure public.handle_customer_ingestion();

create trigger on_customer_upsert_newsletter
    after insert on public.newsletter_subscriptions
    for each row execute procedure public.handle_customer_ingestion();

-- 6. BACKFILL DATA (Ensures all existing records have a customer)
insert into public.customers (email, user_id, is_registered, first_seen_at, last_seen_at)
select email, id as user_id, true as is_registered, created_at as first_seen_at, created_at as last_seen_at
from public.profiles
on conflict (email) do update set user_id = excluded.user_id, is_registered = true;

insert into public.customers (email, user_id, first_seen_at, last_seen_at)
select email, user_id, min(created_at) as first_seen_at, max(created_at) as last_seen_at
from public.orders
group by email, user_id
on conflict (email) do update set 
    user_id = coalesce(public.customers.user_id, excluded.user_id),
    first_seen_at = least(public.customers.first_seen_at, excluded.first_seen_at),
    last_seen_at = greatest(public.customers.last_seen_at, excluded.last_seen_at);

insert into public.customers (email, newsletter_subscribed, first_seen_at)
select email, true, created_at from public.newsletter_subscriptions
on conflict (email) do update set newsletter_subscribed = true;

-- 7. ESTABLISH RELATIONSHIPS (Post-Backfill)
-- Ensure user_id relationship is established for existing table
alter table public.customers drop constraint if exists customers_user_id_fkey;
alter table public.customers 
add constraint customers_user_id_fkey 
foreign key (user_id) references public.profiles(id) 
on delete set null;

do $$ begin
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'orders_customer_email_fkey' and table_name = 'orders') then
        alter table public.orders add constraint orders_customer_email_fkey foreign key (email) references public.customers(email) on delete cascade on update cascade;
    end if;
end $$;

do $$ begin
    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'tickets_customer_email_fkey' and table_name = 'tickets') then
        alter table public.tickets add constraint tickets_customer_email_fkey foreign key (email) references public.customers(email) on delete cascade on update cascade;
    end if;
end $$;

-- 8. SECURITY, INDEXES & REALTIME
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_user_id on public.customers(user_id);
create index if not exists idx_customers_status on public.customers(status);

alter table public.customers enable row level security;
do $$ begin
    create policy "Admins can manage customers" on public.customers for all using (public.is_admin());
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.customers;
exception when others then null; end $$;

-- 9. UPDATED_AT TRIGGER
create or replace function public.handle_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers for each row execute procedure public.handle_updated_at();

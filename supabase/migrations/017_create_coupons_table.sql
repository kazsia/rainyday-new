-- 017_create_coupons_table.sql

create type public.discount_type as enum ('percentage', 'fixed');

create table if not exists public.coupons (
    id uuid primary key default uuid_generate_v4(),
    code text unique not null,
    discount_type public.discount_type not null default 'percentage',
    discount_value decimal(12, 2) not null check (discount_value > 0),
    max_uses integer,
    used_count integer not null default 0,
    expires_at timestamptz,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS
alter table public.coupons enable row level security;

-- Policies
create policy "Admins can manage coupons"
    on public.coupons
    for all
    using (public.is_admin());

create policy "Public can read active coupons"
    on public.coupons
    for select
    using (is_active = true and (expires_at is null or expires_at > now()));
-- Add to logic (trigger to update used_count would be in order processing, skipping for now)

-- Realtime
alter publication supabase_realtime add table public.coupons;

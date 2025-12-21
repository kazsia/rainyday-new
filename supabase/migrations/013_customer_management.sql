-- 013_customer_management.sql

-- 1. PROFILE ENHANCEMENTS
do $$ 
begin 
    if not exists (select 1 from pg_type where typname = 'user_status') then
        create type user_status as enum ('active', 'suspended', 'banned');
    end if;
end $$;

alter table public.profiles add column if not exists status user_status not null default 'active';

-- 2. AUDIT LOG ENHANCEMENT
alter table public.audit_logs add column if not exists ip_address text;

-- 3. RLS REFINEMENT (Ensure admins have full control)
alter table public.profiles force row level security;

-- Extra policies for admin operations if not fully covered by 004
create policy "Admins can update user status and roles"
    on public.profiles for update
    using ( public.is_admin() )
    with check ( public.is_admin() );

-- 4. REALTIME ENABLEMENT
do $$ begin
    alter publication supabase_realtime add table public.profiles;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.payments;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.audit_logs;
exception when others then null; end $$;

-- 5. ADMIN ACTIONS TABLE
create table if not exists public.admin_actions (
    id uuid primary key default uuid_generate_v4(),
    admin_id uuid references auth.users not null,
    target_id uuid references auth.users not null,
    action text not null,
    details jsonb,
    ip_address text,
    created_at timestamptz not null default now()
);

alter table public.admin_actions enable row level security;
create policy "Admins can manage admin_actions" on public.admin_actions for all using (public.is_admin());
create policy "Users can read own actions" on public.admin_actions for select using (auth.uid() = target_id);

do $$ begin
    alter publication supabase_realtime add table public.admin_actions;
exception when others then null; end $$;

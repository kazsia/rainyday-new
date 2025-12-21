-- 011_admin_account_tables.sql

-- 0. PROFILE ENHANCEMENTS
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;

-- 1. ADMIN PREFERENCES
create table if not exists public.admin_preferences (
    admin_id uuid references public.profiles(id) on delete cascade primary key,
    settings jsonb not null default '{
        "default_view": "dashboard",
        "realtime_notifications": true,
        "dark_mode_lock": true
    }'::jsonb,
    updated_at timestamptz not null default now()
);

-- 2. ADMIN API KEYS
create table if not exists public.admin_api_keys (
    id uuid primary key default uuid_generate_v4(),
    admin_id uuid references public.profiles(id) on delete cascade not null,
    key_hash text not null unique,
    prefix text not null, -- First 7 chars for display
    label text not null,
    scopes text[] not null default '{ "read", "write" }'::text[],
    last_used_at timestamptz,
    created_at timestamptz not null default now(),
    expires_at timestamptz
);

-- 3. RLS POLICIES

-- Admin Preferences: Admins can only see/edit their own preferences
alter table public.admin_preferences enable row level security;

create policy "Admins can view their own preferences"
    on public.admin_preferences for select
    using (auth.uid() = admin_id);

create policy "Admins can update their own preferences"
    on public.admin_preferences for update
    using (auth.uid() = admin_id);

create policy "Admins can insert their own preferences"
    on public.admin_preferences for insert
    with check (auth.uid() = admin_id);

-- Admin API Keys: Admins can only see/manage their own keys
alter table public.admin_api_keys enable row level security;

create policy "Admins can view their own api keys"
    on public.admin_api_keys for select
    using (auth.uid() = admin_id);

create policy "Admins can manage their own api keys"
    on public.admin_api_keys for all
    using (auth.uid() = admin_id);

-- Audit Logs update: Admins can view logs where they are the admin_id
alter table public.audit_logs enable row level security;

create policy "Admins can view their own audit logs"
    on public.audit_logs for select
    using (auth.uid() = admin_id);

-- 4. REALTIME ENABLEMENT
do $$ begin
    alter publication supabase_realtime add table public.admin_preferences;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.admin_api_keys;
exception when others then null; end $$;

do $$ begin
    alter publication supabase_realtime add table public.audit_logs;
exception when others then null; end $$;

-- 5. TRIGGER FOR UPDATED_AT
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_admin_preferences_updated_at
    before update on public.admin_preferences
    for each row execute function public.handle_updated_at();

-- 6. STORAGE BUCKETS
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
    on storage.objects for select
    using ( bucket_id = 'avatars' );

create policy "Admins can upload their own avatar"
    on storage.objects for insert
    with check ( bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1] );

create policy "Admins can update their own avatar"
    on storage.objects for update
    using ( bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1] );

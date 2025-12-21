-- Create blacklist table if not exists
create table if not exists public.blacklist (
    id uuid primary key default uuid_generate_v4(),
    type text not null check (type in ('email', 'ip', 'user_agent', 'discord', 'asn', 'country')),
    value text not null,
    match_type text not null default 'exact' check (match_type in ('exact', 'regex')),
    reason text,
    created_at timestamptz not null default now()
);

-- RLS
alter table public.blacklist enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Admins can view blacklist" on public.blacklist;
drop policy if exists "Admins can insert blacklist" on public.blacklist;
drop policy if exists "Admins can delete blacklist" on public.blacklist;

create policy "Admins can view blacklist"
    on public.blacklist for select
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can insert blacklist"
    on public.blacklist for insert
    with check ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can delete blacklist"
    on public.blacklist for delete
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Create domains table if not exists
create table if not exists public.domains (
    id uuid primary key default uuid_generate_v4(),
    domain text not null unique,
    status text not null default 'pending',
    ssl_status text not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS
alter table public.domains enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Admins can view domains" on public.domains;
drop policy if exists "Admins can insert domains" on public.domains;
drop policy if exists "Admins can delete domains" on public.domains;
drop policy if exists "Admins can update domains" on public.domains;

create policy "Admins can view domains"
    on public.domains for select
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can insert domains"
    on public.domains for insert
    with check ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can delete domains"
    on public.domains for delete
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

create policy "Admins can update domains"
    on public.domains for update
    using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

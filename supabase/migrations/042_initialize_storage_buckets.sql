-- 042_initialize_storage_buckets.sql

-- 1. Create product-files bucket
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- 2. Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Create invoices bucket
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Policies for product-files (Private)
drop policy if exists "Admins can manage product files" on storage.objects;
create policy "Admins can manage product files"
    on storage.objects for all
    using ( bucket_id = 'product-files' and public.is_admin() );

-- Policies for avatars (Public)
drop policy if exists "Avatars are public" on storage.objects;
create policy "Avatars are public"
    on storage.objects for select
    using ( bucket_id = 'avatars' );

drop policy if exists "Admins can manage avatars" on storage.objects;
create policy "Admins can manage avatars"
    on storage.objects for all
    using ( bucket_id = 'avatars' and public.is_admin() );

-- Policies for invoices (Private)
drop policy if exists "Admins can manage invoices" on storage.objects;
create policy "Admins can manage invoices"
    on storage.objects for all
    using ( bucket_id = 'invoices' and public.is_admin() );

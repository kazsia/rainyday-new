-- 042_initialize_storage_buckets.sql

-- 1. Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do update set public = false;

-- 2. Storage Policies

-- ASSETS (Public)
drop policy if exists "Assets are publicly accessible" on storage.objects;
create policy "Assets are publicly accessible"
    on storage.objects for select
    using ( bucket_id = 'assets' );

drop policy if exists "Admins can manage assets" on storage.objects;
create policy "Admins can manage assets"
    on storage.objects for all
    using ( bucket_id = 'assets' and public.is_admin() )
    with check ( bucket_id = 'assets' and public.is_admin() );

-- PRODUCT-FILES (Private)
drop policy if exists "Admins can manage product files" on storage.objects;
create policy "Admins can manage product files"
    on storage.objects for all
    using ( bucket_id = 'product-files' and public.is_admin() )
    with check ( bucket_id = 'product-files' and public.is_admin() );

-- AVATARS (Public)
drop policy if exists "Avatars are public" on storage.objects;
create policy "Avatars are public"
    on storage.objects for select
    using ( bucket_id = 'avatars' );

drop policy if exists "Admins can manage avatars" on storage.objects;
create policy "Admins can manage avatars"
    on storage.objects for all
    using ( bucket_id = 'avatars' and public.is_admin() )
    with check ( bucket_id = 'avatars' and public.is_admin() );

-- INVOICES (Private)
drop policy if exists "Admins can manage invoices" on storage.objects;
create policy "Admins can manage invoices"
    on storage.objects for all
    using ( bucket_id = 'invoices' and public.is_admin() )
    with check ( bucket_id = 'invoices' and public.is_admin() );

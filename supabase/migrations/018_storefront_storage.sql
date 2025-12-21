-- 018_storefront_storage.sql

-- 1. Create assets bucket
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- 2. Storage Policies
drop policy if exists "Assets are publicly accessible" on storage.objects;
create policy "Assets are publicly accessible"
    on storage.objects for select
    using ( bucket_id = 'assets' );

drop policy if exists "Admins can manage assets" on storage.objects;
create policy "Admins can manage assets"
    on storage.objects for all
    using ( bucket_id = 'assets' and public.is_admin() );

-- 3. Pre-seed default settings if not exists
insert into public.site_settings (key, value)
values 
    ('general', '{"name": "Rainyday", "description": "Premium Digital Marketplace"}'::jsonb),
    ('branding', '{"logo_url": "", "footer_logo_url": "", "favicon_url": ""}'::jsonb),
    ('seo', '{"title_template": "%s | Rainyday", "og_image": ""}'::jsonb)
on conflict (key) do nothing;

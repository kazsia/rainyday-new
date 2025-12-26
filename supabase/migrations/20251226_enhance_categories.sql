-- 20251226_enhance_categories.sql
alter table public.product_categories add column if not exists image_url text;
alter table public.product_categories add column if not exists is_active boolean not null default true;
alter table public.product_categories add column if not exists badge_text text;
alter table public.product_categories add column if not exists badge_bg_color text;

-- Add advanced product features columns
alter table public.products add column if not exists instructions text;
alter table public.products add column if not exists delivery_type text not null default 'serials';
alter table public.products add column if not exists status_label text not null default 'In Stock!';
alter table public.products add column if not exists status_color text not null default 'green';
alter table public.products add column if not exists show_view_count boolean not null default false;
alter table public.products add column if not exists show_sales_count boolean not null default true;
alter table public.products add column if not exists show_sales_notifications boolean not null default true;
alter table public.products add column if not exists slashed_price decimal(12, 2);
alter table public.products add column if not exists min_quantity integer not null default 1;
alter table public.products add column if not exists max_quantity integer not null default 10;
alter table public.products add column if not exists custom_slug text;
alter table public.products add column if not exists hide_stock boolean not null default false;

-- Add delivery_type to product_variants
alter table public.product_variants
add column if not exists delivery_type text not null default 'serials';

-- Add check constraint
alter table public.product_variants
add constraint check_variant_delivery_type
check (delivery_type in ('serials', 'service', 'dynamic'));

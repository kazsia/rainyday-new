-- 031_variant_orders.sql
-- Add variant_id to order_items and deliveries to track which specific variation was purchased

-- 1. Update order_items
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id);

-- 2. Update deliveries
alter table public.deliveries add column if not exists variant_id uuid references public.product_variants(id);

-- 3. Add column to product_variants for Stock Management if not already present (it should be)
-- The variant_id link in delivery_assets already exists from migration 029.

-- 4. Enable RLS if needed (already enabled for product_variants)

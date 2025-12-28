-- 20251227_refine_variant_schema.sql
-- Add description, min_quantity, and max_quantity to product_variants

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT 10;

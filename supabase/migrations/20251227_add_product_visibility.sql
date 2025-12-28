-- Add visibility column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- Sync existing data
UPDATE public.products SET visibility = 'public' WHERE is_active = true;
UPDATE public.products SET visibility = 'hidden' WHERE is_active = false;

-- Add check constraint constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_product_visibility;
ALTER TABLE public.products ADD CONSTRAINT check_product_visibility 
    CHECK (visibility IN ('public', 'hidden', 'on_hold'));

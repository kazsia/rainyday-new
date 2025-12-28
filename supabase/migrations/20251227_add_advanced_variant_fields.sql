-- 20251227_add_advanced_variant_fields.sql

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS volume_discounts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS disable_volume_discounts_on_coupon BOOLEAN DEFAULT false;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS deliverable_selection_method TEXT DEFAULT 'last'; -- 'last', 'first', 'random'
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS disabled_payment_methods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS discord_group_id TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS discord_role_id TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- Add checking constraint for deliverable_selection_method
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS check_variant_deliverable_selection_method;
ALTER TABLE public.product_variants ADD CONSTRAINT check_variant_deliverable_selection_method 
    CHECK (deliverable_selection_method IN ('last', 'first', 'random'));

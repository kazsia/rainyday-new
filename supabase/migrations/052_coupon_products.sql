-- 052_coupon_products.sql
-- Add support for product-specific coupons

-- 1. Add applies_to column to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applies_to text NOT NULL DEFAULT 'all';
-- Values: 'all' = applies to all products, 'specific' = only specific products

-- 2. Create junction table for coupon-product relationships
CREATE TABLE IF NOT EXISTS public.coupon_products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, product_id)
);

-- 3. Enable RLS
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can manage coupon_products"
    ON public.coupon_products
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read coupon_products for active coupons"
    ON public.coupon_products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coupons
            WHERE coupons.id = coupon_products.coupon_id
            AND coupons.is_active = true
            AND (coupons.expires_at IS NULL OR coupons.expires_at > now())
        )
    );

-- 5. Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_products;

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id ON public.coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_product_id ON public.coupon_products(product_id);

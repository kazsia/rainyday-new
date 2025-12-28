-- Allow variant deletion by setting foreign keys to SET NULL on delete
-- This way, historical order_items and deliveries keep their records but lose the variant reference
-- (The variant name/info should already be stored in order item data for history)

-- Update order_items foreign key to SET NULL on delete
ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- Update deliveries foreign key to SET NULL on delete
ALTER TABLE public.deliveries 
DROP CONSTRAINT IF EXISTS deliveries_variant_id_fkey;

ALTER TABLE public.deliveries 
ADD CONSTRAINT deliveries_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- delivery_assets already has ON DELETE CASCADE from migration 029

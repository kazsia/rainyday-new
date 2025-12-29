-- Allow category deletion by setting products.category_id to NULL when category is deleted
-- First drop the existing constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Re-add the constraint with ON DELETE SET NULL
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;

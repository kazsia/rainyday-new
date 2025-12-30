-- 20251230_relax_status_constraints.sql
-- Relax NOT NULL constraints on status_label and status_color columns

ALTER TABLE public.products ALTER COLUMN status_label DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN status_color DROP NOT NULL;

-- Set default to NULL to explicitly allow nulls
ALTER TABLE public.products ALTER COLUMN status_label SET DEFAULT NULL;
ALTER TABLE public.products ALTER COLUMN status_color SET DEFAULT NULL;

-- Clean up any existing records that might have 'In Stock!' which we want to move away from
-- (This was partially done in a previous migration, but ensuring consistency)
UPDATE public.products 
SET status_label = NULL, status_color = NULL 
WHERE status_label = 'In Stock!' OR status_label = 'In Stock';

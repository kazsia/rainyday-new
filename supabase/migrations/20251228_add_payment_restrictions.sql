-- Add payment_restrictions_enabled column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS payment_restrictions_enabled BOOLEAN DEFAULT false;

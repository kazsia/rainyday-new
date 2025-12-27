-- Add webhook_url to product_variants for dynamic delivery
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS webhook_url TEXT;

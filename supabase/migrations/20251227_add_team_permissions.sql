-- Add permissions column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '["products", "orders", "customers", "settings", "team", "payments"]'::jsonb;

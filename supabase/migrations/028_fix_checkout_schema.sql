-- 028_fix_checkout_schema.sql
-- Add missing columns for checkout flow

-- Add track_id to payments table for tracking external payment IDs
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS track_id text;

-- Add delivery_url to orders table for instant delivery access
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_url text;

-- Create index for track_id for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_payments_track_id ON public.payments(track_id);

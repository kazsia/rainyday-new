-- Add pay_url column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pay_url TEXT;

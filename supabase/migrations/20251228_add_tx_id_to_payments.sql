-- Add tx_id column to payments table for storing blockchain transaction IDs
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tx_id text;

-- Add crypto_address column to payments table for active blockchain tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS crypto_address TEXT;

-- Add index for faster lookups when tracking active payments
CREATE INDEX IF NOT EXISTS idx_payments_crypto_address ON payments(crypto_address) WHERE crypto_address IS NOT NULL;

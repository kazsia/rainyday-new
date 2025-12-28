-- Add 'expired' to order_status enum
-- PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in a transaction
-- So we use this safe approach
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'expired') THEN
        ALTER TYPE public.order_status ADD VALUE 'expired';
    END IF;
END $$;

-- Also ensure payment_status has 'expired' if needed
-- Actually payments are usually 'failed' or stay 'pending', 
-- but 'failed' is sufficient for the payment record itself.
-- The order status 'expired' is the primary indicator.

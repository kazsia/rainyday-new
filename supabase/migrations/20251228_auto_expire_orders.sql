-- Function to expire unpaid orders older than 1 hour
CREATE OR REPLACE FUNCTION public.expire_old_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count integer;
BEGIN
    UPDATE public.orders
    SET status = 'expired'
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.expire_old_pending_orders() TO service_role;

-- Optional: Create a trigger to check expiration on access
-- This ensures orders are marked expired when queried
CREATE OR REPLACE FUNCTION public.check_order_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark as expired if pending and older than 1 hour
    IF NEW.status = 'pending' AND NEW.created_at < NOW() - INTERVAL '1 hour' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$;

-- Note: Triggers on SELECT are not supported in PostgreSQL
-- The expiration check will be done in the application layer instead

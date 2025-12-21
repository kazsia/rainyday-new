-- 024_admin_notifications.sql
-- Real-time admin notification system for sales and revenue events

-- ================================
-- NOTIFICATION TYPES
-- ================================
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        -- Primary (High Priority)
        'new_order',
        'payment_confirmed',
        'high_value_sale',
        'refund_issued',
        'chargeback',
        -- Secondary (Medium Priority)
        'new_customer',
        'repeat_buyer',
        'large_quantity',
        -- System (Low Priority)
        'webhook_failure',
        'payment_retry',
        'delivery_resend'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================
-- NOTIFICATIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type notification_type NOT NULL,
    severity notification_severity NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    related_user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- ================================
-- INDEXES
-- ================================
CREATE INDEX IF NOT EXISTS idx_notifications_created 
    ON admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
    ON admin_notifications(read_at) 
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON admin_notifications(type);

-- ================================
-- ROW LEVEL SECURITY
-- ================================
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can read all notifications
DROP POLICY IF EXISTS "Admins can read notifications" ON admin_notifications;
CREATE POLICY "Admins can read notifications" ON admin_notifications
    FOR SELECT USING (public.is_admin());

-- Admins can update notifications (for marking as read)
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications" ON admin_notifications
    FOR UPDATE USING (public.is_admin());

-- Service role can insert (server-side only)
DROP POLICY IF EXISTS "Service can insert notifications" ON admin_notifications;
CREATE POLICY "Service can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

-- ================================
-- REALTIME
-- ================================
-- Enable realtime for this table (requires Supabase dashboard or this command)
-- Note: You may need to run this in Supabase dashboard if not supported via migration
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- ================================
-- SPAM CONTROL: Rate limiting function
-- ================================
CREATE OR REPLACE FUNCTION should_create_notification(
    p_type notification_type,
    p_related_order_id UUID DEFAULT NULL,
    p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Check for duplicate notification in recent window
    SELECT COUNT(*) INTO recent_count
    FROM admin_notifications
    WHERE type = p_type
      AND (p_related_order_id IS NULL OR related_order_id = p_related_order_id)
      AND created_at > now() - (p_window_seconds || ' seconds')::interval;
    
    RETURN recent_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- HELPER: Create notification with spam check
-- ================================
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_severity notification_severity DEFAULT 'info',
    p_related_order_id UUID DEFAULT NULL,
    p_related_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_window_seconds INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    -- Skip if duplicate exists in time window (spam control)
    IF NOT should_create_notification(p_type, p_related_order_id, p_window_seconds) THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO admin_notifications (type, title, message, severity, related_order_id, related_user_id, metadata)
    VALUES (p_type, p_title, p_message, p_severity, p_related_order_id, p_related_user_id, p_metadata)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

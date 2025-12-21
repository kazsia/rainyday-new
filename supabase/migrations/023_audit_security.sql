-- 023_audit_security.sql
-- Enhance audit logging security and add delivery_url to orders

-- ========================
-- ADD DELIVERY URL TO ORDERS
-- ========================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_url text;

COMMENT ON COLUMN public.orders.delivery_url IS 'Secure signed URL for accessing delivery content';

-- ========================
-- AUDIT LOGS SECURITY - APPEND ONLY
-- ========================
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins read only audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Admins can only READ audit logs
CREATE POLICY "Admins read only audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (public.is_admin());

-- System (service role) can INSERT audit logs
-- This works because service role bypasses RLS, but we add this for documentation
CREATE POLICY "System can insert audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (true);

-- NO UPDATE POLICY = Updates are denied by default (RLS enabled)
-- NO DELETE POLICY = Deletes are denied by default (RLS enabled)
-- This makes audit logs append-only and immutable

-- ========================
-- ADD INDEX FOR AUDIT LOG QUERIES
-- ========================
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
    ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target 
    ON public.audit_logs(target_table, target_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
    ON public.audit_logs(created_at DESC);

-- ========================
-- SECURITY EVENTS TABLE (optional extension)
-- ========================
CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL, -- 'failed_login', 'suspicious_activity', 'rate_limit_exceeded', etc.
    ip_address text,
    user_agent text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read security events
CREATE POLICY "Admins read security events" 
    ON public.security_events FOR SELECT 
    USING (public.is_admin());

-- System can insert security events
CREATE POLICY "System insert security events" 
    ON public.security_events FOR INSERT 
    WITH CHECK (true);

-- NO UPDATE/DELETE = append-only

CREATE INDEX IF NOT EXISTS idx_security_events_type 
    ON public.security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_ip 
    ON public.security_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_security_events_created 
    ON public.security_events(created_at DESC);

COMMENT ON TABLE public.security_events IS 'Immutable log of security-related events for incident response and forensics';

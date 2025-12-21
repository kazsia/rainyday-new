-- 022_delivery_tokens.sql
-- Track delivery token usage for single-use enforcement and audit trail

-- Create delivery access logs table
CREATE TABLE IF NOT EXISTS public.delivery_access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    accessed_at timestamptz DEFAULT now(),
    ip_address text,
    user_agent text,
    revealed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Prevent token reuse with unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_token_hash 
    ON public.delivery_access_logs(token_hash);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_delivery_access_order 
    ON public.delivery_access_logs(order_id);

-- Enable RLS
ALTER TABLE public.delivery_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read access logs (for audit)
CREATE POLICY "Admins can read delivery access logs"
    ON public.delivery_access_logs FOR SELECT
    USING (public.is_admin());

-- System can insert (via service role key)
CREATE POLICY "System can insert delivery access logs"
    ON public.delivery_access_logs FOR INSERT
    WITH CHECK (true);

-- System can update (to mark as revealed)
CREATE POLICY "System can update delivery access logs"
    ON public.delivery_access_logs FOR UPDATE
    USING (true);

-- No delete policy = no deletes allowed (append-only for audit trail)

COMMENT ON TABLE public.delivery_access_logs IS 'Tracks delivery token usage for single-use enforcement and security audit';
COMMENT ON COLUMN public.delivery_access_logs.token_hash IS 'SHA-256 hash of the token (never store raw tokens)';
COMMENT ON COLUMN public.delivery_access_logs.revealed IS 'Whether the delivery content was actually revealed to the user';

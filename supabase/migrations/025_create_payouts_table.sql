-- 025_create_payouts_table.sql
CREATE TABLE IF NOT EXISTS public.crypto_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES public.profiles(id) DEFAULT auth.uid(),
    amount decimal NOT NULL,
    currency text NOT NULL, -- 'BTC', 'LTC', etc.
    usd_value decimal,
    destination_address text NOT NULL,
    tx_hash text,
    status text NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_payouts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payouts
CREATE POLICY "Admins can manage payouts" 
    ON public.crypto_payouts FOR ALL 
    USING (public.is_admin());

-- Indexing
CREATE INDEX idx_crypto_payouts_created ON public.crypto_payouts(created_at DESC);

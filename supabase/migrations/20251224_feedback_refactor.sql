-- Refactor feedbacks table for production requirements
DROP TABLE IF EXISTS public.feedbacks CASCADE;

CREATE TABLE public.feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    message TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_admin_added BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure invoice/order are present for organic customer feedback
    CONSTRAINT check_linkage_if_not_admin CHECK (
        (is_admin_added = true) OR (invoice_id IS NOT NULL AND order_id IS NOT NULL)
    )
);

-- Ensure one feedback per invoice (only for real invoices)
CREATE UNIQUE INDEX unique_invoice_feedback ON public.feedbacks (invoice_id) WHERE invoice_id IS NOT NULL;

-- Indexing for performance
CREATE INDEX idx_feedbacks_invoice_id ON public.feedbacks(invoice_id);
CREATE INDEX idx_feedbacks_email ON public.feedbacks(email);
CREATE INDEX idx_feedbacks_is_approved_is_public ON public.feedbacks(is_approved, is_public);

-- RLS Policies
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read approved and public feedbacks
CREATE POLICY "Public can view approved feedbacks" ON public.feedbacks
    FOR SELECT USING (is_approved = true AND is_public = true);

-- 2. Authenticated users can view their own feedback (even if not approved)
CREATE POLICY "Users can view own feedback" ON public.feedbacks
    FOR SELECT TO authenticated USING (
        auth.uid() = customer_id OR 
        email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

-- 3. Admins have full control
CREATE POLICY "Admins have full control" ON public.feedbacks
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_feedbacks_updated_at
    BEFORE UPDATE ON public.feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

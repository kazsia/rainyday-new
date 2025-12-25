-- Add missing columns to invoices table to satisfy both 001 and 003 schemas
DO $$ 
BEGIN
    -- Add invoice_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE public.invoices ADD COLUMN invoice_number TEXT;
        -- Generate some default values if needed, but since it's UNIQUE NOT NULL usually, 
        -- we might need to be careful. However, existing rows might not exist.
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
        ALTER TABLE public.invoices ADD COLUMN status TEXT DEFAULT 'unpaid';
    END IF;

    -- Add pdf_path if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'pdf_path') THEN
        ALTER TABLE public.invoices ADD COLUMN pdf_path TEXT;
    END IF;
END $$;

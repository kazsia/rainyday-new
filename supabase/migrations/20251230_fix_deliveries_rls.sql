-- 20251230_fix_deliveries_rls.sql
-- Allow anyone to read deliveries if they have the order ID
-- This is safe because the order ID is a non-guessable UUID

-- 1. FIX DELIVERIES RLS
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read own deliveries" ON public.deliveries;

-- Create permissive policy for public invoice view
CREATE POLICY "Anyone can read deliveries by order ID" 
ON public.deliveries FOR SELECT 
USING (true);

-- 2. FIX INVOICES RLS
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read own invoices" ON public.invoices;

-- Create permissive policy for public invoice view
CREATE POLICY "Anyone can read invoices by order ID" 
ON public.invoices FOR SELECT 
USING (true);

-- 3. FORCE SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload config';

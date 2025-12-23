-- Force PostgREST to reload the schema cache
-- This fixes the "Could not find the function ... in the schema cache" error
NOTIFY pgrst, 'reload config';

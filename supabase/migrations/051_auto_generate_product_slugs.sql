-- Automatically generate slugs for all existing products that don't have one
-- Uses the product name to generate a URL-friendly slug

DO $$
DECLARE
    r RECORD;
    new_slug TEXT;
    slug_counter INTEGER;
BEGIN
    FOR r IN SELECT id, name, slug FROM public.products WHERE slug IS NULL OR slug = ''
    LOOP
        -- Generate base slug from name
        new_slug := lower(trim(r.name));
        new_slug := regexp_replace(new_slug, '\s+', '-', 'g');           -- Replace spaces with hyphens
        new_slug := regexp_replace(new_slug, '[^a-z0-9-]', '', 'g');     -- Remove special characters
        new_slug := regexp_replace(new_slug, '-+', '-', 'g');            -- Replace multiple hyphens with single
        new_slug := regexp_replace(new_slug, '^-|-$', '', 'g');          -- Remove leading/trailing hyphens
        
        -- Check for duplicates and add a suffix if needed
        slug_counter := 1;
        WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = new_slug AND id != r.id) LOOP
            new_slug := regexp_replace(new_slug, '-[0-9]+$', '', 'g') || '-' || slug_counter;
            slug_counter := slug_counter + 1;
        END LOOP;
        
        -- Update the product with the generated slug
        UPDATE public.products SET slug = new_slug WHERE id = r.id;
        
        RAISE NOTICE 'Generated slug "%" for product "%"', new_slug, r.name;
    END LOOP;
END $$;

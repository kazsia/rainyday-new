-- Insert default DNS settings
insert into public.site_settings (key, value)
values (
    'dns',
    '{
        "records": [
            { "type": "A", "name": "@", "value": "76.76.21.21" },
            { "type": "CNAME", "name": "_verification", "value": "cname.vercel-dns.com" }
        ]
    }'::jsonb
)
on conflict (key) do nothing;

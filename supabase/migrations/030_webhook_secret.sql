-- 030_webhook_secret.sql
-- Add a global webhook secret for dynamic delivery fulfillment signing

-- Initialize integrations setting with a random secret if it doesn't exist
do $$
declare
    v_secret text;
    v_integrations jsonb;
begin
    -- Generate a random 32-character secret
    v_secret := encode(gen_random_bytes(16), 'hex');

    -- Get existing integrations or default to empty object
    select value into v_integrations
    from public.site_settings
    where key = 'integrations';

    if v_integrations is null then
        insert into public.site_settings (key, value)
        values ('integrations', jsonb_build_object('webhook_secret', v_secret));
    elsif not (v_integrations ? 'webhook_secret') then
        update public.site_settings
        set value = v_integrations || jsonb_build_object('webhook_secret', v_secret)
        where key = 'integrations';
    end if;
end $$;

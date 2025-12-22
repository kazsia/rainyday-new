-- 027_promote_parv_admin.sql
-- Promote parv.owns@gmail.com to admin role

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'parv.owns@gmail.com';

-- Ensure the user exists in the admin_preferences table too
INSERT INTO public.admin_preferences (admin_id, settings)
SELECT id, '{"default_view": "dashboard", "realtime_notifications": true, "dark_mode_lock": true}'::jsonb
FROM public.profiles
WHERE email = 'parv.owns@gmail.com'
ON CONFLICT (admin_id) DO NOTHING;

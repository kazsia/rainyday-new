-- 012_promote_admin.sql
-- Promote user to admin role

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'eggplcer@gmail.com';

-- Ensure the user exists in the admin_preferences table too
INSERT INTO public.admin_preferences (admin_id, settings)
SELECT id, '{"default_view": "dashboard", "realtime_notifications": true, "dark_mode_lock": true}'::jsonb
FROM public.profiles
WHERE email = 'eggplcer@gmail.com'
ON CONFLICT (admin_id) DO NOTHING;

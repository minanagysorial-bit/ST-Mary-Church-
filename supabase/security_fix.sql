-- ===================================================================
-- SECURITY HARDENING SCRIPT FOR ST. MARY DIGITAL HUB
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- ===================================================================

-- 1. Clean up any rogue test/hacker accounts
DELETE FROM public.profiles 
WHERE email ILIKE '%hacker%' 
   OR email ILIKE '%fakeadmin%' 
   OR email ILIKE '%@test.com' 
   OR email ILIKE '%@example.com';

DELETE FROM auth.users 
WHERE email ILIKE '%hacker%' 
   OR email ILIKE '%fakeadmin%' 
   OR email ILIKE '%@test.com' 
   OR email ILIKE '%@example.com';

-- 2. Update the new user trigger to NEVER grant 'servant' or 'admin' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    -- ONLY the official admin email gets admin upon creation; all others get 'pending'
    CASE 
      WHEN NEW.email = 'admin@stmary.church' THEN 'admin'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        role = CASE 
          WHEN EXCLUDED.email = 'admin@stmary.church' THEN 'admin'
          ELSE public.profiles.role -- keep existing approved role
        END;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify current active profiles
SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at DESC;

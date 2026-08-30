-- ===================================================================
-- Fix profiles_role_check constraint for 'service_leader' & 'membership'
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ===================================================================

-- 1. Update the check constraint on profiles to include all roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'priest', 'service_leader', 'servant', 'board', 'membership'));

-- 2. Update the handle_new_user trigger to recognize all roles properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE
      WHEN NEW.email = 'admin@stmary.church' THEN 'super_admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'servant')
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- STEP 1: FULL CLEANUP — Run this FIRST to remove all problematic objects
-- ===================================================================

-- 1. Dynamically drop ALL triggers on auth.users (regardless of their names)
DO $$
DECLARE
  trg RECORD;
BEGIN
  FOR trg IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'auth' 
      AND event_object_table = 'users'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trg.trigger_name);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Dynamically drop ANY custom user function created inside the auth schema
DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN 
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'auth' 
      AND routine_name NOT IN ('uid', 'role', 'email', 'jwt')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS auth.%I CASCADE', func.routine_name);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. Drop known public schema functions
DROP FUNCTION IF EXISTS public.user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.increment_play_count(UUID) CASCADE;

-- 4. Drop all public tables (CASCADE removes policies, triggers, indexes)
DROP TABLE IF EXISTS public.membership_comments CASCADE;
DROP TABLE IF EXISTS public.prayer_requests CASCADE;
DROP TABLE IF EXISTS public.financial_records CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;
DROP TABLE IF EXISTS public.service_areas CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.sermons CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 5. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

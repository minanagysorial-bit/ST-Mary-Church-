-- ===================================================================
-- DEEP DIAGNOSTIC — Run ALL of these queries one by one
-- Copy results and share them
-- ===================================================================

-- 1. Check leftover functions in public/auth schema (should NOT have auth.user_role)
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('user_role', 'handle_new_user', 'update_updated_at')
ORDER BY routine_schema;

-- 2. Check if admin user exists in auth.users
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@stmary.church';

-- 3. Check if profiles table exists and its row count
SELECT count(*) as profile_count FROM public.profiles;

-- 4. Check all existing RLS policies on profiles
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Check for any functions in the auth schema that shouldn't be there
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name NOT IN ('uid', 'role', 'email', 'jwt');

-- 6. Reload PostgREST schema cache (this alone might fix the issue!)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ===================================================================
-- Migration: Full CRUD Admin Permissions for All Tables (Secure & Non-Recursive)
-- Grant users with 'admin' role in JWT metadata complete access (FOR ALL)
-- ===================================================================

-- First clean up any older temporary policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_permissive_profiles" ON public.profiles;

-- 1. profiles (Must NOT query profiles subtable to avoid Postgres RLS recursion)
DROP POLICY IF EXISTS "admins_all_on_profiles" ON public.profiles;
CREATE POLICY "admins_all_on_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 2. sermons
DROP POLICY IF EXISTS "admins_all_on_sermons" ON public.sermons;
DROP POLICY IF EXISTS "admins_permissive_sermons" ON public.sermons;
CREATE POLICY "admins_all_on_sermons" ON public.sermons
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 3. members
DROP POLICY IF EXISTS "admins_all_on_members" ON public.members;
DROP POLICY IF EXISTS "admins_permissive_members" ON public.members;
CREATE POLICY "admins_all_on_members" ON public.members
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 4. families
DROP POLICY IF EXISTS "admins_all_on_families" ON public.families;
DROP POLICY IF EXISTS "admins_permissive_families" ON public.families;
CREATE POLICY "admins_all_on_families" ON public.families
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 5. service_areas
DROP POLICY IF EXISTS "admins_all_on_service_areas" ON public.service_areas;
DROP POLICY IF EXISTS "admins_permissive_service_areas" ON public.service_areas;
CREATE POLICY "admins_all_on_service_areas" ON public.service_areas
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 6. meetings
DROP POLICY IF EXISTS "admins_all_on_meetings" ON public.meetings;
DROP POLICY IF EXISTS "admins_permissive_meetings" ON public.meetings;
CREATE POLICY "admins_all_on_meetings" ON public.meetings
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 7. projects
DROP POLICY IF EXISTS "admins_all_on_projects" ON public.projects;
DROP POLICY IF EXISTS "admins_permissive_projects" ON public.projects;
CREATE POLICY "admins_all_on_projects" ON public.projects
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 8. financial_records
DROP POLICY IF EXISTS "admins_all_on_financial_records" ON public.financial_records;
DROP POLICY IF EXISTS "admins_permissive_financial_records" ON public.financial_records;
CREATE POLICY "admins_all_on_financial_records" ON public.financial_records
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 9. prayer_requests
DROP POLICY IF EXISTS "admins_all_on_prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "admins_permissive_prayer_requests" ON public.prayer_requests;
CREATE POLICY "admins_all_on_prayer_requests" ON public.prayer_requests
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- 10. membership_comments
DROP POLICY IF EXISTS "admins_all_on_membership_comments" ON public.membership_comments;
DROP POLICY IF EXISTS "admins_permissive_membership_comments" ON public.membership_comments;
CREATE POLICY "admins_all_on_membership_comments" ON public.membership_comments
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- Force PostgREST schema cache and config refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

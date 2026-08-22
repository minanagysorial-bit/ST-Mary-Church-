-- ===================================================================
-- HOTFIX: RLS Policies — Support JWT metadata + Profiles table checks
-- Run this in the Supabase SQL Editor if you experience "violates row-level security policy"
-- ===================================================================

-- 1. SERMONS RLS Policies
DROP POLICY IF EXISTS "sermons_select" ON public.sermons;
DROP POLICY IF EXISTS "sermons_insert" ON public.sermons;
DROP POLICY IF EXISTS "sermons_update" ON public.sermons;
DROP POLICY IF EXISTS "sermons_delete" ON public.sermons;

CREATE POLICY "sermons_select" ON public.sermons FOR SELECT USING (true);

CREATE POLICY "sermons_insert" ON public.sermons FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "sermons_update" ON public.sermons FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "sermons_delete" ON public.sermons FOR DELETE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);


-- 2. MEMBERS RLS Policies
DROP POLICY IF EXISTS "members_select" ON public.members;
DROP POLICY IF EXISTS "members_insert" ON public.members;
DROP POLICY IF EXISTS "members_update" ON public.members;
DROP POLICY IF EXISTS "members_delete" ON public.members;

CREATE POLICY "members_select" ON public.members FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

CREATE POLICY "members_insert" ON public.members FOR INSERT WITH CHECK (true);

CREATE POLICY "members_update" ON public.members FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "members_delete" ON public.members FOR DELETE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);


-- 3. FAMILIES RLS Policies
DROP POLICY IF EXISTS "families_select" ON public.families;
DROP POLICY IF EXISTS "families_insert" ON public.families;
DROP POLICY IF EXISTS "families_update" ON public.families;

CREATE POLICY "families_select" ON public.families FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

CREATE POLICY "families_update" ON public.families FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);


-- 4. SERVICE AREAS RLS Policies
DROP POLICY IF EXISTS "areas_select" ON public.service_areas;
DROP POLICY IF EXISTS "areas_insert" ON public.service_areas;

CREATE POLICY "areas_select" ON public.service_areas FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

CREATE POLICY "areas_insert" ON public.service_areas FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);


-- 5. MEETINGS RLS Policies
DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update" ON public.meetings;

CREATE POLICY "meetings_select" ON public.meetings FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board', 'priest')
);

CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);


-- 6. PROJECTS RLS Policies
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;

CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);


-- 7. FINANCIAL RECORDS RLS Policies
DROP POLICY IF EXISTS "financials_select" ON public.financial_records;
DROP POLICY IF EXISTS "financials_insert" ON public.financial_records;

CREATE POLICY "financials_select" ON public.financial_records FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

CREATE POLICY "financials_insert" ON public.financial_records FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);


-- 8. PRAYER REQUESTS RLS Policies
DROP POLICY IF EXISTS "prayers_insert" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayers_select" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayers_update" ON public.prayer_requests;

CREATE POLICY "prayers_insert" ON public.prayer_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "prayers_select" ON public.prayer_requests FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "prayers_update" ON public.prayer_requests FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);


-- 9. MEMBERSHIP COMMENTS RLS Policies
DROP POLICY IF EXISTS "comments_select" ON public.membership_comments;
DROP POLICY IF EXISTS "comments_insert" ON public.membership_comments;
DROP POLICY IF EXISTS "comments_update" ON public.membership_comments;

CREATE POLICY "comments_select" ON public.membership_comments FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "comments_insert" ON public.membership_comments FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

CREATE POLICY "comments_update" ON public.membership_comments FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- Force PostgREST schema cache and config refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

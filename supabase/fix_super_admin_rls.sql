-- ===================================================================
-- SQL HOTFIX: Grant Table-level Privileges & Define RLS Policies
-- Run this in the Supabase SQL Editor to resolve all "permission denied" errors.
-- ===================================================================

-- Ensure event_date is TEXT to allow any custom dates (like 'عام ١٩٢٦م')
ALTER TABLE public.memory_albums ALTER COLUMN event_date TYPE TEXT;

-- 1. Grant explicit table-level privileges to authenticated and service_role
GRANT ALL PRIVILEGES ON public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON public.profiles TO service_role;
GRANT ALL PRIVILEGES ON public.user_permissions TO authenticated;
GRANT ALL PRIVILEGES ON public.user_permissions TO service_role;

GRANT ALL PRIVILEGES ON public.sermons TO authenticated;
GRANT ALL PRIVILEGES ON public.sermons TO service_role;
GRANT ALL PRIVILEGES ON public.members TO authenticated;
GRANT ALL PRIVILEGES ON public.members TO service_role;

GRANT ALL PRIVILEGES ON public.membership_requests TO authenticated;
GRANT ALL PRIVILEGES ON public.membership_requests TO service_role;
GRANT INSERT ON public.membership_requests TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT ALL PRIVILEGES ON public.church_members TO authenticated;
GRANT ALL PRIVILEGES ON public.church_members TO service_role;
GRANT ALL PRIVILEGES ON public.member_visitations TO authenticated;
GRANT ALL PRIVILEGES ON public.member_visitations TO service_role;

-- 2. Grant privileges for Public Submission Tables (allow anonymous inserts)
GRANT ALL PRIVILEGES ON public.contact_messages TO authenticated;
GRANT ALL PRIVILEGES ON public.contact_messages TO service_role;
GRANT INSERT ON public.contact_messages TO anon;

GRANT ALL PRIVILEGES ON public.prayer_requests TO authenticated;
GRANT ALL PRIVILEGES ON public.prayer_requests TO service_role;
GRANT INSERT ON public.prayer_requests TO anon;

-- 3. Grant privileges for Content Tables (read-only for anon, manage for admin/priest)
GRANT ALL PRIVILEGES ON public.announcements TO authenticated;
GRANT ALL PRIVILEGES ON public.announcements TO service_role;
GRANT SELECT ON public.announcements TO anon;

GRANT ALL PRIVILEGES ON public.verses TO authenticated;
GRANT ALL PRIVILEGES ON public.verses TO service_role;
GRANT SELECT ON public.verses TO anon;

GRANT ALL PRIVILEGES ON public.memory_albums TO authenticated;
GRANT ALL PRIVILEGES ON public.memory_albums TO service_role;
GRANT SELECT ON public.memory_albums TO anon;

GRANT ALL PRIVILEGES ON public.custom_pages TO authenticated;
GRANT ALL PRIVILEGES ON public.custom_pages TO service_role;
GRANT SELECT ON public.custom_pages TO anon;

GRANT ALL PRIVILEGES ON public.page_sections TO authenticated;
GRANT ALL PRIVILEGES ON public.page_sections TO service_role;
GRANT SELECT ON public.page_sections TO anon;

GRANT ALL PRIVILEGES ON public.priests TO authenticated;
GRANT ALL PRIVILEGES ON public.priests TO service_role;
GRANT SELECT ON public.priests TO anon;

GRANT ALL PRIVILEGES ON public.site_settings TO authenticated;
GRANT ALL PRIVILEGES ON public.site_settings TO service_role;
GRANT SELECT ON public.site_settings TO anon;

GRANT ALL PRIVILEGES ON public.liturgies TO authenticated;
GRANT ALL PRIVILEGES ON public.liturgies TO service_role;
GRANT SELECT ON public.liturgies TO anon;

-- 4. Create has_role SECURITY DEFINER helper function (bypasses RLS cache and recursion)
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Get email from auth.users table
  SELECT email INTO user_email FROM auth.users WHERE id = uid;
  
  -- Hardcoded lowercased email bypass for super admin fallback (case-insensitive)
  IF lower(user_email) IN ('admin@stmary.church', 'admin@stmarychurch') THEN
    RETURN TRUE;
  END IF;

  -- Check role in profiles table
  SELECT role INTO user_role FROM public.profiles WHERE id = uid;
  RETURN user_role = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Create is_admin_or_super_admin legacy compatibility function
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role(uid, ARRAY['super_admin', 'admin']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Force update the existing admin profile role in the database directly (case-insensitive)
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE lower(email) IN ('admin@stmary.church', 'admin@stmarychurch');

-- 7. Update profiles policies
DROP POLICY IF EXISTS "admins_all_on_profiles" ON public.profiles;
CREATE POLICY "admins_all_on_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin_or_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_super_admin(auth.uid())
  );

-- 8. Update user_permissions policies
DROP POLICY IF EXISTS "admins_all_on_user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins read user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins insert user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins update user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Admins delete user_permissions" ON public.user_permissions;

CREATE POLICY "admins_all_on_user_permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (
    public.is_admin_or_super_admin(auth.uid()) OR user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin_or_super_admin(auth.uid())
  );

-- 9. Update sermons policies
DROP POLICY IF EXISTS "admins_all_on_sermons" ON public.sermons;
CREATE POLICY "admins_all_on_sermons" ON public.sermons
  FOR ALL TO authenticated
  USING (
    public.is_admin_or_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_super_admin(auth.uid())
  );

-- 10. Update members policies
DROP POLICY IF EXISTS "admins_all_on_members" ON public.members;
CREATE POLICY "admins_all_on_members" ON public.members
  FOR ALL TO authenticated
  USING (
    public.is_admin_or_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_super_admin(auth.uid())
  );

-- 11. Update membership_requests policies
DROP POLICY IF EXISTS "membership_requests_select" ON public.membership_requests;
DROP POLICY IF EXISTS "membership_requests_update" ON public.membership_requests;
DROP POLICY IF EXISTS "membership_requests_insert" ON public.membership_requests;

CREATE POLICY "membership_requests_insert" ON public.membership_requests 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "membership_requests_select" ON public.membership_requests 
  FOR SELECT USING (
    public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest', 'membership'])
  );

CREATE POLICY "membership_requests_update" ON public.membership_requests 
  FOR UPDATE USING (
    public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest'])
  );

-- 12. Update church_members policies
DROP POLICY IF EXISTS "church_members_select" ON public.church_members;
DROP POLICY IF EXISTS "church_members_insert" ON public.church_members;

CREATE POLICY "church_members_select" ON public.church_members 
  FOR SELECT USING (
    public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest', 'membership'])
  );

CREATE POLICY "church_members_insert" ON public.church_members 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest'])
  );

-- 13. Update contact_messages policies (Enable public inserts, restrict reads to admins)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view and manage contact messages" ON public.contact_messages 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

-- 14. Update prayer_requests policies (Enable public inserts, restrict reads to admins/priests)
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert prayer requests" ON public.prayer_requests;
CREATE POLICY "Anyone can insert prayer requests" ON public.prayer_requests 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage prayer requests" ON public.prayer_requests;
CREATE POLICY "Admins can manage prayer requests" ON public.prayer_requests 
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']))
  WITH CHECK (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']));

-- 15. Update announcements policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Anyone can view active announcements" ON public.announcements 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements 
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']))
  WITH CHECK (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']));

-- 16. Update verses policies
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view verses" ON public.verses;
CREATE POLICY "Anyone can view verses" ON public.verses 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage verses" ON public.verses;
CREATE POLICY "Admins can manage verses" ON public.verses 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

-- 17. Update custom_pages & page_sections policies
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view custom_pages" ON public.custom_pages;
CREATE POLICY "Anyone can view custom_pages" ON public.custom_pages 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage custom_pages" ON public.custom_pages;
CREATE POLICY "Admins can manage custom_pages" ON public.custom_pages 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view page_sections" ON public.page_sections;
CREATE POLICY "Anyone can view page_sections" ON public.page_sections 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage page_sections" ON public.page_sections;
CREATE POLICY "Admins can manage page_sections" ON public.page_sections 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

-- 18. Update priests policies
ALTER TABLE public.priests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view priests" ON public.priests;
CREATE POLICY "Anyone can view priests" ON public.priests 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage priests" ON public.priests;
CREATE POLICY "Admins can manage priests" ON public.priests 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

-- 19. Update site_settings policies (Enable public reads, restrict writes to admins/priests)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site_settings" ON public.site_settings;
CREATE POLICY "Anyone can view site_settings" ON public.site_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
CREATE POLICY "Admins can manage site_settings" ON public.site_settings 
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']))
  WITH CHECK (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']));

-- 20. Update liturgies policies (Enable public reads, restrict writes to admins/priests)
ALTER TABLE public.liturgies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view liturgies" ON public.liturgies;
CREATE POLICY "Anyone can view liturgies" ON public.liturgies 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage liturgies" ON public.liturgies;
CREATE POLICY "Admins can manage liturgies" ON public.liturgies 
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']))
  WITH CHECK (public.has_role(auth.uid(), ARRAY['super_admin', 'admin', 'priest']));

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ===================================================================
-- RBAC Migration — Roles, Per-User Permissions & Verses
-- Run this in Supabase SQL Editor
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. ADD super_admin TO PROFILES ROLE CHECK
-- -------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'priest', 'servant', 'board'));

-- Update the handle_new_user trigger to recognise super_admin
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

-- -------------------------------------------------------------------
-- 2. USER PERMISSIONS TABLE (per-user, primarily for priests)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage user_permissions
DROP POLICY IF EXISTS "Admins read user_permissions" ON public.user_permissions;
CREATE POLICY "Admins read user_permissions" ON public.user_permissions FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins insert user_permissions" ON public.user_permissions;
CREATE POLICY "Admins insert user_permissions" ON public.user_permissions FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Admins update user_permissions" ON public.user_permissions;
CREATE POLICY "Admins update user_permissions" ON public.user_permissions FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Admins delete user_permissions" ON public.user_permissions;
CREATE POLICY "Admins delete user_permissions" ON public.user_permissions FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- -------------------------------------------------------------------
-- 3. HELPER FUNCTION: Check if user has a specific permission
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_permission(uid UUID, perm TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = uid;

  -- Super Admin and Admin have ALL permissions
  IF user_role IN ('super_admin', 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Check per-user permissions table
  RETURN EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = uid AND permission = perm
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -------------------------------------------------------------------
-- 4. VERSES TABLE
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text       TEXT NOT NULL,
  reference  TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto updated_at trigger for verses
DROP TRIGGER IF EXISTS set_updated_at ON public.verses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.verses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

-- Anyone can read verses (public page)
DROP POLICY IF EXISTS "Anyone can read verses" ON public.verses;
CREATE POLICY "Anyone can read verses" ON public.verses FOR SELECT USING (true);

-- Only admins can manage verses
DROP POLICY IF EXISTS "Admins insert verses" ON public.verses;
CREATE POLICY "Admins insert verses" ON public.verses FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Admins update verses" ON public.verses;
CREATE POLICY "Admins update verses" ON public.verses FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Admins delete verses" ON public.verses;
CREATE POLICY "Admins delete verses" ON public.verses FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- -------------------------------------------------------------------
-- 5. UPDATE EXISTING RLS POLICIES — replace 'admin' with ('super_admin','admin')
-- -------------------------------------------------------------------

-- PROFILES: allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  id = auth.uid()
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- Update the original "Users can update own profile" to drop it (replaced above)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- PROFILES: allow admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- SERMONS: include super_admin
DROP POLICY IF EXISTS "Admin/Priest can insert sermons" ON public.sermons;
CREATE POLICY "Admin/Priest can insert sermons" ON public.sermons FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Admin/Priest can update sermons" ON public.sermons;
CREATE POLICY "Admin/Priest can update sermons" ON public.sermons FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Admin can delete sermons" ON public.sermons;
CREATE POLICY "Admin can delete sermons" ON public.sermons FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- MEMBERS: include super_admin
DROP POLICY IF EXISTS "Staff can read members" ON public.members;
CREATE POLICY "Staff can read members" ON public.members FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest', 'servant')
);
DROP POLICY IF EXISTS "Admin can update members" ON public.members;
CREATE POLICY "Admin can update members" ON public.members FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Admin can delete members" ON public.members;
CREATE POLICY "Admin can delete members" ON public.members FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- FAMILIES: include super_admin
DROP POLICY IF EXISTS "Staff can read families" ON public.families;
CREATE POLICY "Staff can read families" ON public.families FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest', 'servant')
);
DROP POLICY IF EXISTS "Staff can manage families" ON public.families;
CREATE POLICY "Staff can manage families" ON public.families FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest', 'servant')
);
DROP POLICY IF EXISTS "Staff can update families" ON public.families;
CREATE POLICY "Staff can update families" ON public.families FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest', 'servant')
);

-- SERVICE AREAS: include super_admin
DROP POLICY IF EXISTS "Staff can read service areas" ON public.service_areas;
CREATE POLICY "Staff can read service areas" ON public.service_areas FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest', 'servant')
);
DROP POLICY IF EXISTS "Admin/Priest can manage areas" ON public.service_areas;
CREATE POLICY "Admin/Priest can manage areas" ON public.service_areas FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

-- MEETINGS: include super_admin
DROP POLICY IF EXISTS "Board/Admin can read meetings" ON public.meetings;
CREATE POLICY "Board/Admin can read meetings" ON public.meetings FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board', 'priest')
);
DROP POLICY IF EXISTS "Board/Admin can insert meetings" ON public.meetings;
CREATE POLICY "Board/Admin can insert meetings" ON public.meetings FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);
DROP POLICY IF EXISTS "Board/Admin can update meetings" ON public.meetings;
CREATE POLICY "Board/Admin can update meetings" ON public.meetings FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);

-- PROJECTS: include super_admin
DROP POLICY IF EXISTS "Board/Admin can read projects" ON public.projects;
CREATE POLICY "Board/Admin can read projects" ON public.projects FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);
DROP POLICY IF EXISTS "Admin can manage projects" ON public.projects;
CREATE POLICY "Admin can manage projects" ON public.projects FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects" ON public.projects FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);

-- FINANCIAL RECORDS: include super_admin
DROP POLICY IF EXISTS "Board/Admin read financials" ON public.financial_records;
CREATE POLICY "Board/Admin read financials" ON public.financial_records FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);
DROP POLICY IF EXISTS "Board/Admin create financials" ON public.financial_records;
CREATE POLICY "Board/Admin create financials" ON public.financial_records FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'board')
);

-- PRAYER REQUESTS: include super_admin
DROP POLICY IF EXISTS "Admin/Priest read prayers" ON public.prayer_requests;
CREATE POLICY "Admin/Priest read prayers" ON public.prayer_requests FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Admin can update prayer requests" ON public.prayer_requests;
CREATE POLICY "Admin can update prayer requests" ON public.prayer_requests FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

-- MEMBERSHIP COMMENTS: include super_admin
DROP POLICY IF EXISTS "Priest/Admin read comments" ON public.membership_comments;
CREATE POLICY "Priest/Admin read comments" ON public.membership_comments FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Staff can create comments" ON public.membership_comments;
CREATE POLICY "Staff can create comments" ON public.membership_comments FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);
DROP POLICY IF EXISTS "Priest/Admin update comments" ON public.membership_comments;
CREATE POLICY "Priest/Admin update comments" ON public.membership_comments FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

-- -------------------------------------------------------------------
-- 6. SEED DEFAULT VERSES
-- -------------------------------------------------------------------
INSERT INTO public.verses (text, reference) VALUES
  ('تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ، وَأَنَا أُرِيحُكُمْ.', 'إنجيل متى ١١ : ٢٨'),
  ('لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.', 'إنجيل يوحنا ٣ : ١٦'),
  ('الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.', 'مزمور ٢٣ : ١'),
  ('أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي.', 'فيلبي ٤ : ١٣'),
  ('سِرَاجٌ لِرِجْلِي كَلاَمُكَ وَنُورٌ لِسَبِيلِي.', 'مزمور ١١٩ : ١٠٥'),
  ('لاَ تَخَفْ لأَنِّي مَعَكَ. لاَ تَتَلَفَّتْ لأَنِّي إِلهُكَ. قَدْ أَيَّدْتُكَ وَأَعَنْتُكَ وَعَضَدْتُكَ بِيَمِينِ بِرِّي.', 'إشعياء ٤١ : ١٠'),
  ('اَللهُ مَحَبَّةٌ، وَمَنْ يَثْبُتْ فِي الْمَحَبَّةِ يَثْبُتْ فِي اللهِ وَاللهُ فِيهِ.', 'رسالة يوحنا الأولى ٤ : ١٦'),
  ('ثِقُوا: أَنَا قَدْ غَلَبْتُ الْعَالَمَ.', 'إنجيل يوحنا ١٦ : ٣٣')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------
-- 7. UPGRADE ADMIN TO SUPER_ADMIN (if already exists)
-- -------------------------------------------------------------------
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'admin@stmary.church';

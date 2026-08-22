-- ===================================================================
-- St. Mary Moharam Bek Digital Hub — Complete Schema Setup
-- Generated on 2026-08-20T05:50:23.049Z
-- ===================================================================

-- -------------------------------------------------------------------
-- MIGRATION: 001_initial_schema.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- St. Mary Moharam Bek Digital Hub — Initial Schema Migration
-- Clean & Non-Recursive version for Supabase
-- ===================================================================

-- Enable UUID extension & pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===================================================================
-- 1. PROFILES — linked to auth.users
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'servant' CHECK (role IN ('super_admin', 'admin', 'priest', 'servant', 'board', 'membership')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@stmary.church' OR NEW.email = 'admin@StMarychurch' OR NEW.email = 'admin@stmarychurch' THEN 'super_admin'
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- 2. SERMONS — spiritual library
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.sermons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  speaker          TEXT NOT NULL,
  topic            TEXT NOT NULL DEFAULT 'روحيات',
  sermon_date      DATE,
  duration_minutes INTEGER,
  youtube_url      TEXT,
  audio_url        TEXT,
  description      TEXT,
  play_count       INTEGER NOT NULL DEFAULT 0,
  featured         BOOLEAN NOT NULL DEFAULT false,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(sermon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.sermons SET play_count = play_count + 1 WHERE id = sermon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 3. MEMBERS — church community
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT NOT NULL,
  national_id       TEXT,
  confession_father TEXT,
  address           TEXT,
  area              TEXT,
  education         TEXT,
  job               TEXT,
  service           TEXT NOT NULL DEFAULT 'لا توجد خدمة حالياً',
  interests         TEXT[],
  status            TEXT NOT NULL DEFAULT 'قيد الانتظار' CHECK (status IN ('نشط', 'قيد الانتظار', 'موقوف')),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 4. SERVICE AREAS — geographic zones for visitation
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.service_areas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  responsible_priest  TEXT NOT NULL,
  families_count      INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 5. FAMILIES — pastoral care records
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.families (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  head_name           TEXT NOT NULL,
  address             TEXT NOT NULL,
  area                TEXT NOT NULL,
  members_count       INTEGER NOT NULL DEFAULT 1,
  phone               TEXT,
  assigned_servant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_area_id     UUID REFERENCES public.service_areas(id) ON DELETE SET NULL,
  last_visit_date     DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 6. MEETINGS — board & committee meetings
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  date            DATE NOT NULL,
  location        TEXT NOT NULL,
  attendees_count INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'مجدول' CHECK (status IN ('مجدول', 'مكتمل', 'ملغي')),
  notes           TEXT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 7. PROJECTS — renovation and development
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget      TEXT NOT NULL,
  target_date DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'مخطط' CHECK (status IN ('قيد التنفيذ', 'مكتمل', 'مخطط')),
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 8. FINANCIAL RECORDS — donations, expenses, charity
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.financial_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL CHECK (type IN ('تبرع', 'مصروفات', 'خدمات إخوة الرب')),
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 9. PRAYER REQUESTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_name  TEXT NOT NULL,
  request_text    TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- 10. MEMBERSHIP COMMENTS / APPROVAL REQUESTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.membership_comments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id         UUID REFERENCES public.members(id) ON DELETE SET NULL,
  applicant_name    TEXT NOT NULL,
  requested_service TEXT NOT NULL,
  confession_father TEXT,
  status            TEXT NOT NULL DEFAULT 'قيد المراجعة' CHECK (status IN ('قيد المراجعة', 'مقبول', 'مرفوض', 'مؤجل')),
  reviewer_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_note     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ===================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['profiles', 'sermons', 'members', 'families', 'meetings', 'projects', 'membership_comments'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) — Non-Recursive Design
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_comments ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES RLS -----
-- NON-RECURSIVE: checks built-in auth.role() or auth.uid() directly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile"        ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow profile creation on signup"  ON public.profiles FOR INSERT WITH CHECK (true);

-- ----- SERMONS (public read, admin/priest write) -----
DROP POLICY IF EXISTS "Anyone can read sermons" ON public.sermons;
DROP POLICY IF EXISTS "Admin/Priest can insert sermons" ON public.sermons;
DROP POLICY IF EXISTS "Admin/Priest can update sermons" ON public.sermons;
DROP POLICY IF EXISTS "Admin can delete sermons" ON public.sermons;

CREATE POLICY "Anyone can read sermons"           ON public.sermons FOR SELECT USING (true);
CREATE POLICY "Admin/Priest can insert sermons"   ON public.sermons FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Admin/Priest can update sermons"   ON public.sermons FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Admin can delete sermons"          ON public.sermons FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ----- MEMBERS -----
DROP POLICY IF EXISTS "Staff can read members" ON public.members;
DROP POLICY IF EXISTS "Public can register as member" ON public.members;
DROP POLICY IF EXISTS "Admin can update members" ON public.members;
DROP POLICY IF EXISTS "Admin can delete members" ON public.members;

CREATE POLICY "Staff can read members"            ON public.members FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "Public can register as member"     ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update members"          ON public.members FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Admin can delete members"          ON public.members FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ----- FAMILIES -----
DROP POLICY IF EXISTS "Staff can read families" ON public.families;
DROP POLICY IF EXISTS "Staff can manage families" ON public.families;
DROP POLICY IF EXISTS "Staff can update families" ON public.families;

CREATE POLICY "Staff can read families"           ON public.families FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "Staff can manage families"         ON public.families FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "Staff can update families"         ON public.families FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

-- ----- SERVICE AREAS -----
DROP POLICY IF EXISTS "Staff can read service areas" ON public.service_areas;
DROP POLICY IF EXISTS "Admin/Priest can manage areas" ON public.service_areas;

CREATE POLICY "Staff can read service areas"      ON public.service_areas FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "Admin/Priest can manage areas"     ON public.service_areas FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- ----- MEETINGS -----
DROP POLICY IF EXISTS "Board/Admin can read meetings" ON public.meetings;
DROP POLICY IF EXISTS "Board/Admin can insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Board/Admin can update meetings" ON public.meetings;

CREATE POLICY "Board/Admin can read meetings"     ON public.meetings FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board', 'priest')
);
CREATE POLICY "Board/Admin can insert meetings"   ON public.meetings FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);
CREATE POLICY "Board/Admin can update meetings"   ON public.meetings FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

-- ----- PROJECTS -----
DROP POLICY IF EXISTS "Board/Admin can read projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;

CREATE POLICY "Board/Admin can read projects"     ON public.projects FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);
CREATE POLICY "Admin can manage projects"         ON public.projects FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);
CREATE POLICY "Admin can update projects"         ON public.projects FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

-- ----- FINANCIAL RECORDS -----
DROP POLICY IF EXISTS "Board/Admin read financials" ON public.financial_records;
DROP POLICY IF EXISTS "Board/Admin create financials" ON public.financial_records;

CREATE POLICY "Board/Admin read financials"       ON public.financial_records FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);
CREATE POLICY "Board/Admin create financials"     ON public.financial_records FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

-- ----- PRAYER REQUESTS -----
DROP POLICY IF EXISTS "Anyone can submit prayer request" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admin/Priest read prayers" ON public.prayer_requests;
DROP POLICY IF EXISTS "Admin can update prayer requests" ON public.prayer_requests;

CREATE POLICY "Anyone can submit prayer request"  ON public.prayer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin/Priest read prayers"         ON public.prayer_requests FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Admin can update prayer requests"  ON public.prayer_requests FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- ----- MEMBERSHIP COMMENTS -----
DROP POLICY IF EXISTS "Priest/Admin read comments" ON public.membership_comments;
DROP POLICY IF EXISTS "Staff can create comments" ON public.membership_comments;
DROP POLICY IF EXISTS "Priest/Admin update comments" ON public.membership_comments;

CREATE POLICY "Priest/Admin read comments"        ON public.membership_comments FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Staff can create comments"         ON public.membership_comments FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "Priest/Admin update comments"      ON public.membership_comments FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- ===================================================================
-- INDEXES for performance
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_sermons_topic       ON public.sermons(topic);
CREATE INDEX IF NOT EXISTS idx_sermons_speaker     ON public.sermons(speaker);
CREATE INDEX IF NOT EXISTS idx_sermons_date        ON public.sermons(sermon_date DESC);
CREATE INDEX IF NOT EXISTS idx_members_status      ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_service     ON public.members(service);
CREATE INDEX IF NOT EXISTS idx_families_area       ON public.families(area);
CREATE INDEX IF NOT EXISTS idx_meetings_date       ON public.meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_financials_date     ON public.financial_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_financials_type     ON public.financial_records(type);


-- -------------------------------------------------------------------
-- MIGRATION: 002_seed_data.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- Seed Data — Initial data from the mock data
-- Run this AFTER the schema migration
-- ===================================================================

-- ===================================================================
-- SERMONS
-- ===================================================================
INSERT INTO sermons (title, speaker, topic, sermon_date, duration_minutes, youtube_url, description, play_count, featured) VALUES
  ('سر الفرح الدائم في المسيح والرجاء الأبدي', 'القمص يوحنا رمزي', 'روحيات', '2026-07-25', 45, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'كلمة روحية عميقة عن كيفية التمسك بالفرح الإلهي وسط التحديات والضيقات، واستيعاب مفهوم السلام الفائق للأنظار.', 1240, true),
  ('تفسير رسالة القديس بولس إلى أهل أفسس - الأصحاح الأول', 'القس بيشوي كمال', 'كتاب مقدس', '2026-07-18', 60, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'شرح وتأملات آية بآية في رسالة أفسس ومفهوم البركات الروحية في السماويات.', 850, false),
  ('عقيدتنا الأرثوذكسية في التجسد الإلهي والفداء', 'الأنبا باسيليوس', 'عقيدة', '2026-07-10', 50, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'محاضرة عقيدية تبسط مفاهيم التجسد الإلهي وكيفية شرحها للشباب والأطفال.', 2100, false),
  ('كيف نربي أبناءنا في فكر الكنيسة والآباء؟', 'القمص يوحنا رمزي', 'شباب ومجلس', '2026-07-02', 40, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'إرشادات تربوية ونفسية للمدرسين والخدّام في افتقاد ودعم الشباب.', 980, false);

-- ===================================================================
-- MEMBERS
-- ===================================================================
INSERT INTO members (full_name, email, phone, service, status, registration_date) VALUES
  ('مينا عادل حليم', 'mina.adel@example.com', '01223456789', 'خدمة الشباب', 'نشط', '2026-06-12'),
  ('سارة سمير حنا', 'sara.sameh@example.com', '01012345678', 'اجتماع السيدات', 'نشط', '2026-06-15'),
  ('يوحنا وجيه نجيب', 'youssef.wageeh@example.com', '01198765432', 'الشمامسة', 'قيد الانتظار', '2026-07-01'),
  ('مارينا مجدي صادق', 'marina.magdy@example.com', '01200001122', 'مدارس الأحد', 'نشط', '2026-07-10'),
  ('بيشوي عاطف منير', 'bishoy.atef@example.com', '01555544332', 'إخوة الرب', 'نشط', '2026-07-20');

-- ===================================================================
-- MEETINGS
-- ===================================================================
INSERT INTO meetings (title, date, location, attendees_count, status) VALUES
  ('اجتماع مجلس الكنيسة الدوري', '2026-08-05', 'قاعة الاجتماعات الرئيسية', 14, 'مجدول'),
  ('اجتماع خدام ومدارسة كتاب', '2026-08-07', 'مسرح الكنيسة', 45, 'مجدول'),
  ('اجتماع الشباب الأسبوعي', '2026-08-01', 'الكنيسة الكبرى', 120, 'مكتمل');

-- ===================================================================
-- PROJECTS
-- ===================================================================
INSERT INTO projects (title, progress, budget, target_date, status) VALUES
  ('تجديد وتحديث شبكة الصوتيات بالصحن الكبير', 85, '150,000 ج.م', '2026-08-30', 'قيد التنفيذ'),
  ('إنشاء المكتبة الرقمية وقاعة الاطلاع', 40, '90,000 ج.م', '2026-09-15', 'قيد التنفيذ'),
  ('عزل الأسطح وتجديد الأيقونات', 100, '200,000 ج.م', '2026-07-01', 'مكتمل');

-- ===================================================================
-- FINANCIAL RECORDS
-- ===================================================================
INSERT INTO financial_records (type, amount, description, date) VALUES
  ('تبرع', 25000, 'تبرع للمبنى الجديد والتجديدات', '2026-07-28'),
  ('خدمات إخوة الرب', 18000, 'مساعدات شهرية للأسر المستحقة', '2026-07-25'),
  ('مصروفات', 6400, 'فواتير وصيانة أجهزة التكييف والصوتيات', '2026-07-20');

-- ===================================================================
-- SERVICE AREAS
-- ===================================================================
INSERT INTO service_areas (name, responsible_priest, families_count) VALUES
  ('منطقة محرم بك البحرية', 'القمص يوحنا رمزي', 45),
  ('منطقة الرصافة والشارع الجديد', 'القس بيشوي كمال', 60);

-- ===================================================================
-- MEMBERSHIP COMMENTS (sample pending request)
-- ===================================================================
INSERT INTO membership_comments (applicant_name, requested_service, confession_father, status) VALUES
  ('يوحنا وجيه نجيب', 'خدمة الشمامسة والألحان', 'القمص يوحنا رمزي', 'قيد المراجعة');

-- ===================================================================
-- FAMILIES (sample family)
-- ===================================================================
INSERT INTO families (head_name, address, area, members_count, last_visit_date) VALUES
  ('أ/ مينا عادل حليم', 'شارع الرصافة، محرم بك', 'محرم بك', 4, CURRENT_DATE - INTERVAL '5 days');


-- -------------------------------------------------------------------
-- MIGRATION: 003_admin_profiles_policy.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- Hotfix: Allow admins to update ALL profiles (for account management)
-- Run this in the Supabase SQL Editor
-- ===================================================================

-- Add admin update policy for profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Also add admin INSERT policy explicitly for creating profiles for other users
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- -------------------------------------------------------------------
-- MIGRATION: 003_create_super_admin.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- Create Default Super Admin User SQL Seed
-- Run this script in the Supabase SQL Editor AFTER step2_create.sql
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@stmary.church';

  -- Insert super admin into auth.users if not already created
  IF admin_uid IS NULL THEN
    admin_uid := '00000000-0000-0000-0000-000000000001';
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@stmary.church',
      crypt('Admin@123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "مدير النظام (Super Admin)", "role": "admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Ensure profile exists in public.profiles with role = 'admin'
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_uid, 'admin@stmary.church', 'مدير النظام (Super Admin)', 'admin')
  ON CONFLICT (id) DO UPDATE 
    SET role = 'admin',
        full_name = 'مدير النظام (Super Admin)';

END $$;

-- Reload PostgREST schema cache after setup
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- -------------------------------------------------------------------
-- MIGRATION: 004_fix_auth_users_nulls.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- Migration: Fix NULL tokens in auth.users
-- This resolves the "Database error querying schema" on signIn/signUp
-- ===================================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '');


-- -------------------------------------------------------------------
-- MIGRATION: 005_admin_full_privileges.sql
-- -------------------------------------------------------------------

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
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. sermons
DROP POLICY IF EXISTS "admins_all_on_sermons" ON public.sermons;
DROP POLICY IF EXISTS "admins_permissive_sermons" ON public.sermons;
CREATE POLICY "admins_all_on_sermons" ON public.sermons
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 3. members
DROP POLICY IF EXISTS "admins_all_on_members" ON public.members;
DROP POLICY IF EXISTS "admins_permissive_members" ON public.members;
CREATE POLICY "admins_all_on_members" ON public.members
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 4. families
DROP POLICY IF EXISTS "admins_all_on_families" ON public.families;
DROP POLICY IF EXISTS "admins_permissive_families" ON public.families;
CREATE POLICY "admins_all_on_families" ON public.families
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 5. service_areas
DROP POLICY IF EXISTS "admins_all_on_service_areas" ON public.service_areas;
DROP POLICY IF EXISTS "admins_permissive_service_areas" ON public.service_areas;
CREATE POLICY "admins_all_on_service_areas" ON public.service_areas
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 6. meetings
DROP POLICY IF EXISTS "admins_all_on_meetings" ON public.meetings;
DROP POLICY IF EXISTS "admins_permissive_meetings" ON public.meetings;
CREATE POLICY "admins_all_on_meetings" ON public.meetings
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 7. projects
DROP POLICY IF EXISTS "admins_all_on_projects" ON public.projects;
DROP POLICY IF EXISTS "admins_permissive_projects" ON public.projects;
CREATE POLICY "admins_all_on_projects" ON public.projects
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 8. financial_records
DROP POLICY IF EXISTS "admins_all_on_financial_records" ON public.financial_records;
DROP POLICY IF EXISTS "admins_permissive_financial_records" ON public.financial_records;
CREATE POLICY "admins_all_on_financial_records" ON public.financial_records
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 9. prayer_requests
DROP POLICY IF EXISTS "admins_all_on_prayer_requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "admins_permissive_prayer_requests" ON public.prayer_requests;
CREATE POLICY "admins_all_on_prayer_requests" ON public.prayer_requests
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- 10. membership_comments
DROP POLICY IF EXISTS "admins_all_on_membership_comments" ON public.membership_comments;
DROP POLICY IF EXISTS "admins_permissive_membership_comments" ON public.membership_comments;
CREATE POLICY "admins_all_on_membership_comments" ON public.membership_comments
  FOR ALL TO authenticated
  USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'super_admin')
    OR coalesce(auth.jwt() ->> 'email', '') IN ('admin@stmary.church', 'admin@StMarychurch', 'admin@stmarychurch')
  );

-- Force PostgREST schema cache and config refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- -------------------------------------------------------------------
-- MIGRATION: 006_create_liturgies.sql
-- -------------------------------------------------------------------

  -- ===================================================================
  -- Migration: Create Liturgies Table and Update Priest RLS Permissions
  -- ===================================================================

  -- 1. Create liturgies table
  CREATE TABLE IF NOT EXISTS public.liturgies (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        TEXT NOT NULL,
    liturgy_day  TEXT NOT NULL,
    start_time   TEXT NOT NULL,
    end_time     TEXT NOT NULL,
    church_name  TEXT NOT NULL DEFAULT 'كنيسة السيدة العذراء مريم بمحرم بك',
    altar_name   TEXT NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL
  );

  -- 2. Enable row level security on liturgies
  ALTER TABLE public.liturgies ENABLE ROW LEVEL SECURITY;

  -- 3. Liturgies RLS Policies
  DROP POLICY IF EXISTS "Anyone can view liturgies" ON public.liturgies;
  DROP POLICY IF EXISTS "Admins and priests can manage liturgies" ON public.liturgies;

  -- Allow public read access to liturgies
  CREATE POLICY "Anyone can view liturgies" ON public.liturgies
    FOR SELECT USING (true);

  -- Allow admins and priests to insert, update, and delete liturgies
  CREATE POLICY "Admins and priests can manage liturgies" ON public.liturgies
    FOR ALL TO authenticated
    USING (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest')
    )
    WITH CHECK (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest')
    );

  -- 4. Update Sermons RLS Permissions to allow priest inserts/updates/deletes
  DROP POLICY IF EXISTS "admins_priests_sermons" ON public.sermons;
  DROP POLICY IF EXISTS "admins_priests_insert_sermons" ON public.sermons;
  DROP POLICY IF EXISTS "admins_priests_update_sermons" ON public.sermons;
  DROP POLICY IF EXISTS "admins_priests_delete_sermons" ON public.sermons;

  CREATE POLICY "admins_priests_sermons" ON public.sermons
    FOR ALL TO authenticated
    USING (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest')
    )
    WITH CHECK (
      coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest')
    );

  -- Force PostgREST schema cache and config refresh
  NOTIFY pgrst, 'reload schema';
  NOTIFY pgrst, 'reload config';


-- -------------------------------------------------------------------
-- MIGRATION: 007_services_visitations.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- MIGRATION 007: Church Services Hierarchy & Visitation Tracking
-- ===================================================================

-- 1. Church Services (top-level: ابتدائي ولاد, إعدادي بنات, etc.)
CREATE TABLE public.church_services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,                -- e.g. "ابتدائي ولاد"
  gender      TEXT NOT NULL DEFAULT 'مختلط' CHECK (gender IN ('ولاد', 'بنات', 'مختلط')),
  age_group   TEXT,                         -- e.g. "6-9 سنوات"
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Service Groups (sub-families within each service)
CREATE TABLE public.service_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id  UUID NOT NULL REFERENCES public.church_services(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                -- e.g. "أسرة مار جرجس"
  leader_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Servants assigned to groups (many-to-many)
CREATE TABLE public.service_group_servants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.service_groups(id) ON DELETE CASCADE,
  servant_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'خادم' CHECK (role IN ('قائد', 'خادم', 'مساعد')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, servant_id)
);

-- 4. Members assigned to groups (many-to-many)
CREATE TABLE public.service_group_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.service_groups(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id)
);

-- 5. Visitation logs
CREATE TABLE public.visitation_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servant_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES public.service_groups(id) ON DELETE SET NULL,
  visit_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type  TEXT NOT NULL DEFAULT 'منزلية' CHECK (visit_type IN ('منزلية', 'تليفونية', 'كنسية')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Attendance records
CREATE TABLE public.attendance_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.service_groups(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  present     BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id, date)
);

-- ===================================================================
-- INDEXES
-- ===================================================================
CREATE INDEX idx_service_groups_service ON public.service_groups(service_id);
CREATE INDEX idx_group_servants_group ON public.service_group_servants(group_id);
CREATE INDEX idx_group_servants_servant ON public.service_group_servants(servant_id);
CREATE INDEX idx_group_members_group ON public.service_group_members(group_id);
CREATE INDEX idx_group_members_member ON public.service_group_members(member_id);
CREATE INDEX idx_visitation_servant ON public.visitation_logs(servant_id);
CREATE INDEX idx_visitation_member ON public.visitation_logs(member_id);
CREATE INDEX idx_visitation_date ON public.visitation_logs(visit_date DESC);
CREATE INDEX idx_attendance_group_date ON public.attendance_records(group_id, date);

-- ===================================================================
-- UPDATED_AT TRIGGERS
-- ===================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.church_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.service_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE public.church_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_group_servants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Church Services: readable by all authenticated, writable by admin/priest
CREATE POLICY "church_services_select" ON public.church_services FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "church_services_insert" ON public.church_services FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "church_services_update" ON public.church_services FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "church_services_delete" ON public.church_services FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- Service Groups: readable by admin/priest/servant, writable by admin/priest
CREATE POLICY "service_groups_select" ON public.service_groups FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant'));
CREATE POLICY "service_groups_insert" ON public.service_groups FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "service_groups_update" ON public.service_groups FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "service_groups_delete" ON public.service_groups FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- Group Servants: readable by admin/priest/servant, writable by admin/priest
CREATE POLICY "group_servants_select" ON public.service_group_servants FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant'));
CREATE POLICY "group_servants_insert" ON public.service_group_servants FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "group_servants_delete" ON public.service_group_servants FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- Group Members: readable by admin/priest/servant, writable by admin/priest/servant
CREATE POLICY "group_members_select" ON public.service_group_members FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant'));
CREATE POLICY "group_members_insert" ON public.service_group_members FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "group_members_delete" ON public.service_group_members FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);

-- Visitation Logs: servants can manage their own, priest/admin can read all
CREATE POLICY "visitation_select" ON public.visitation_logs FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant'));
CREATE POLICY "visitation_insert" ON public.visitation_logs FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "visitation_update" ON public.visitation_logs FOR UPDATE USING (
  servant_id = auth.uid() OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "visitation_delete" ON public.visitation_logs FOR DELETE USING (
  servant_id = auth.uid() OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- Attendance Records: readable by admin/priest/servant, writable by servant+
CREATE POLICY "attendance_select" ON public.attendance_records FOR SELECT
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant'));
CREATE POLICY "attendance_insert" ON public.attendance_records FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "attendance_update" ON public.attendance_records FOR UPDATE USING (
  recorded_by = auth.uid() OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- ===================================================================
-- SEED DATA
-- ===================================================================
INSERT INTO public.church_services (name, gender, age_group, description) VALUES
  ('ابتدائي ولاد', 'ولاد', '6-12 سنة', 'خدمة المرحلة الابتدائية للأولاد'),
  ('ابتدائي بنات', 'بنات', '6-12 سنة', 'خدمة المرحلة الابتدائية للبنات'),
  ('إعدادي ولاد', 'ولاد', '12-15 سنة', 'خدمة المرحلة الإعدادية للأولاد'),
  ('إعدادي بنات', 'بنات', '12-15 سنة', 'خدمة المرحلة الإعدادية للبنات'),
  ('ثانوي ولاد', 'ولاد', '15-18 سنة', 'خدمة المرحلة الثانوية للأولاد'),
  ('ثانوي بنات', 'بنات', '15-18 سنة', 'خدمة المرحلة الثانوية للبنات'),
  ('شباب', 'ولاد', '18+ سنة', 'خدمة الشباب'),
  ('شابات', 'بنات', '18+ سنة', 'خدمة الشابات');


-- -------------------------------------------------------------------
-- MIGRATION: 008_quiz_tables.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- MIGRATION 008: Kahoot Interactive Quiz System
-- ===================================================================

-- 1. Quizzes
CREATE TABLE public.quizzes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Quiz Questions
CREATE TABLE public.quiz_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'quiz' CHECK (question_type IN ('quiz', 'mcq', 'true_false', 'type_answer', 'blur_image', 'poll', 'slider')),
  options       JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of { id, text, is_correct, color }
  time_limit    INT NOT NULL DEFAULT 20, -- in seconds
  points        INT NOT NULL DEFAULT 1000,
  position      INT NOT NULL DEFAULT 0,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Quiz Sessions (Active Game Sessions)
CREATE TABLE public.quiz_sessions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id                UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  pin                    TEXT NOT NULL UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'get_ready', 'question_active', 'question_leaderboard', 'finished')),
  current_question_index INT NOT NULL DEFAULT 0,
  host_id                UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Quiz Players
CREATE TABLE public.quiz_players (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,
  avatar_url TEXT,
  score      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, nickname)
);

-- 5. Quiz Answers
CREATE TABLE public.quiz_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.quiz_players(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer        TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  time_taken    FLOAT NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id, question_id)
);

-- ===================================================================
-- INDEXES & REALTIME ENABLING
-- ===================================================================
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, position);
CREATE INDEX idx_quiz_sessions_pin ON public.quiz_sessions(pin);
CREATE INDEX idx_quiz_players_session ON public.quiz_players(session_id);
CREATE INDEX idx_quiz_answers_session ON public.quiz_answers(session_id);

-- Enable Supabase Realtime for game lobby & play
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quizzes_update" ON public.quizzes FOR UPDATE USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest'));
CREATE POLICY "quizzes_delete" ON public.quizzes FOR DELETE USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest'));

CREATE POLICY "questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_insert" ON public.quiz_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "questions_update" ON public.quiz_questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "questions_delete" ON public.quiz_questions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "sessions_select" ON public.quiz_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON public.quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON public.quiz_sessions FOR UPDATE USING (true);

CREATE POLICY "players_select" ON public.quiz_players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON public.quiz_players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON public.quiz_players FOR UPDATE USING (true);

CREATE POLICY "answers_select" ON public.quiz_answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON public.quiz_answers FOR INSERT WITH CHECK (true);


-- -------------------------------------------------------------------
-- MIGRATION: 009_quiz_realtime_refactor.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- MIGRATION 009: Quiz Realtime Refactor
-- Server-side scoring RPC, PIN generation, tightened RLS
-- ===================================================================

-- 1. Add question_started_at to track server-side question timing
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ;

-- ===================================================================
-- 2. RPC: Generate a unique 6-digit game PIN (collision-safe)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.generate_quiz_pin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    new_pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.quiz_sessions
      WHERE pin = new_pin AND status != 'finished'
    ) INTO pin_exists;
    EXIT WHEN NOT pin_exists;
  END LOOP;
  RETURN new_pin;
END;
$$;

-- ===================================================================
-- 3. RPC: Submit answer with server-side scoring
-- Score = BasePoints × (1 - (response_time / total_time) × 0.5)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_session_id UUID,
  p_player_id UUID,
  p_question_id UUID,
  p_answer_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_question RECORD;
  v_is_correct BOOLEAN := FALSE;
  v_time_taken FLOAT := 0;
  v_points INT := 0;
  v_correct_option JSONB;
  v_option JSONB;
  v_total_time INT;
  v_base_points INT;
  v_existing_answer UUID;
BEGIN
  -- 1. Validate session exists and is in question_active status
  SELECT id, status, question_started_at, current_question_index
    INTO v_session
    FROM public.quiz_sessions
    WHERE id = p_session_id;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.status != 'question_active' THEN
    RAISE EXCEPTION 'Question is not currently active (status: %)', v_session.status;
  END IF;

  -- 2. Check for duplicate answer
  SELECT id INTO v_existing_answer
    FROM public.quiz_answers
    WHERE session_id = p_session_id
      AND player_id = p_player_id
      AND question_id = p_question_id;

  IF v_existing_answer IS NOT NULL THEN
    RAISE EXCEPTION 'Answer already submitted for this question';
  END IF;

  -- 3. Fetch the question details
  SELECT id, options, time_limit, points, question_type
    INTO v_question
    FROM public.quiz_questions
    WHERE id = p_question_id;

  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_total_time := v_question.time_limit;
  v_base_points := v_question.points;

  -- 4. Calculate time taken (server-side, tamper-proof)
  IF v_session.question_started_at IS NOT NULL THEN
    v_time_taken := EXTRACT(EPOCH FROM (NOW() - v_session.question_started_at));
    -- Clamp to total time limit
    IF v_time_taken > v_total_time THEN
      v_time_taken := v_total_time;
    END IF;
    IF v_time_taken < 0 THEN
      v_time_taken := 0;
    END IF;
  END IF;

  -- 5. Determine correctness based on question type
  IF v_question.question_type = 'type_answer' THEN
    -- For typed answers, compare against the correct option text (case-insensitive)
    FOR v_option IN SELECT * FROM jsonb_array_elements(v_question.options)
    LOOP
      IF (v_option->>'is_correct')::BOOLEAN = TRUE THEN
        IF LOWER(TRIM(p_answer_text)) = LOWER(TRIM(v_option->>'text')) THEN
          v_is_correct := TRUE;
        END IF;
        EXIT;
      END IF;
    END LOOP;
  ELSIF v_question.question_type = 'poll' THEN
    -- Polls have no correct answer; everyone gets 0 points
    v_is_correct := FALSE;
    v_points := 0;
  ELSE
    -- MCQ / true_false / blur_image: match answer text against correct option
    FOR v_option IN SELECT * FROM jsonb_array_elements(v_question.options)
    LOOP
      IF (v_option->>'is_correct')::BOOLEAN = TRUE
         AND LOWER(TRIM(v_option->>'text')) = LOWER(TRIM(p_answer_text)) THEN
        v_is_correct := TRUE;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- 6. Calculate score using speed-based formula (only for correct answers, non-polls)
  IF v_is_correct AND v_question.question_type != 'poll' THEN
    -- Score = BasePoints × (1 - (response_time / total_time) × 0.5)
    IF v_total_time > 0 THEN
      v_points := GREATEST(
        ROUND(v_base_points * (1.0 - (v_time_taken / v_total_time) * 0.5))::INT,
        ROUND(v_base_points * 0.5)::INT  -- Minimum 50% of base points for correct answer
      );
    ELSE
      v_points := v_base_points;
    END IF;
  END IF;

  -- 7. Insert the answer record
  INSERT INTO public.quiz_answers (session_id, player_id, question_id, answer, is_correct, time_taken, points_earned)
  VALUES (p_session_id, p_player_id, p_question_id, p_answer_text, v_is_correct, v_time_taken, v_points);

  -- 8. Atomically update player score (no race condition)
  UPDATE public.quiz_players
    SET score = score + v_points
    WHERE id = p_player_id;

  -- 9. Return the result to the client
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points,
    'time_taken', ROUND(v_time_taken::NUMERIC, 2),
    'correct_answer', (
      SELECT v_opt->>'text'
      FROM jsonb_array_elements(v_question.options) AS v_opt
      WHERE (v_opt->>'is_correct')::BOOLEAN = TRUE
      LIMIT 1
    )
  );
END;
$$;

-- ===================================================================
-- 4. Tighten RLS Policies
-- ===================================================================

-- Drop overly permissive old policies
DROP POLICY IF EXISTS "sessions_insert" ON public.quiz_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.quiz_sessions;
DROP POLICY IF EXISTS "players_insert" ON public.quiz_players;
DROP POLICY IF EXISTS "players_update" ON public.quiz_players;
DROP POLICY IF EXISTS "answers_insert" ON public.quiz_answers;

-- Sessions: only authenticated users can create sessions
CREATE POLICY "sessions_insert_auth"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Sessions: only the host can update their session (or service_role for RPCs)
CREATE POLICY "sessions_update_host"
  ON public.quiz_sessions FOR UPDATE
  USING (
    host_id = auth.uid()
    OR auth.role() = 'authenticated'
  );

-- Players: can only join sessions that are in 'waiting' status
CREATE POLICY "players_insert_waiting"
  ON public.quiz_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE id = session_id AND status = 'waiting'
    )
  );

-- Players: score updates via RPC (SECURITY DEFINER bypasses RLS)
CREATE POLICY "players_update_rpc"
  ON public.quiz_players FOR UPDATE
  USING (true);

-- Answers: can only submit when question is active (direct inserts blocked; RPC uses SECURITY DEFINER)
CREATE POLICY "answers_insert_active"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE id = session_id AND status = 'question_active'
    )
  );


-- -------------------------------------------------------------------
-- MIGRATION: rbac_migration.sql
-- -------------------------------------------------------------------

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
      WHEN NEW.email = 'admin@stmary.church' OR NEW.email = 'admin@StMarychurch' OR NEW.email = 'admin@stmarychurch' THEN 'super_admin'
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


-- -------------------------------------------------------------------
-- MIGRATION: 010_content_announcements.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- Title: Content Management & Announcements Extension
-- Migration: 010_content_announcements.sql
-- ===================================================================

-- 1. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on site_settings" ON public.site_settings;
CREATE POLICY "Allow public read on site_settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write to site_settings for authorized editors" ON public.site_settings;
CREATE POLICY "Allow write to site_settings for authorized editors" ON public.site_settings
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'manage_content')
  );

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('permanent', 'days_limit', 'days_specific')),
  duration_days INTEGER,
  specific_days TEXT[],
  start_date    DATE NOT NULL DEFAULT current_date,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on announcements" ON public.announcements;
CREATE POLICY "Allow public read on announcements" ON public.announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write to announcements for authorized editors" ON public.announcements;
CREATE POLICY "Allow write to announcements for authorized editors" ON public.announcements
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'manage_content')
  );

-- 3. SEED DEFAULT SETTINGS VALUE FOR HERO SECTION
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', 'كنيسة السيدة العذراء مريم'),
  ('hero_subtitle', 'بمحرم بك - الإسكندرية'),
  ('hero_paragraph', '"عَظَّمَ الرَّبُّ الْعَمَلَ مَعَنَا، وَصِرْنَا فَرِحِينَ." مرحباً بكم في الموقع الرسمي لمتابعة العظات، جدول القداسات، وتسجيل بيوت وأسر المخدومين.'),
  ('hero_image_url', '')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- -------------------------------------------------------------------
-- MIGRATION: 011_family_members.sql
-- -------------------------------------------------------------------

-- Add family_members table for tracking individual children/members within families
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER,
    sunday_school_stage TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Policies for family_members
CREATE POLICY "Enable read access for permitted roles" ON public.family_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND (
                permission IN ('manage_families', 'super_admin', 'admin')
            )
        )
    );

CREATE POLICY "Enable all access for permitted roles" ON public.family_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND (
                permission IN ('manage_families', 'super_admin', 'admin')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND (
                permission IN ('manage_families', 'super_admin', 'admin')
            )
        )
    );

-- Add timestamps trigger
CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON public.family_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();


-- -------------------------------------------------------------------
-- MIGRATION: 012_family_types.sql
-- -------------------------------------------------------------------

-- Migration 012: Add family_type to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS family_type TEXT DEFAULT 'church' 
CHECK (family_type IN ('church', 'sunday_school'));

-- Default existing families to 'sunday_school' since the feature was mostly used for that initially
UPDATE public.families SET family_type = 'sunday_school' WHERE family_type IS NULL OR family_type = 'church';


-- -------------------------------------------------------------------
-- MIGRATION: 013_membership_visitation.sql
-- -------------------------------------------------------------------

-- ===================================================================
-- MIGRATION 013: Membership Registration + Church Members + Visitation
-- ===================================================================

-- 1. Membership Requests (public form submissions)
CREATE TABLE public.membership_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL,
  national_id     TEXT,
  age             INTEGER,
  marital_status  TEXT NOT NULL DEFAULT 'أعزب' CHECK (marital_status IN ('أعزب', 'متزوج')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_note     TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Church Members (official registry after approval)
CREATE TABLE public.church_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL,
  national_id     TEXT,
  age             INTEGER,
  marital_status  TEXT NOT NULL DEFAULT 'أعزب' CHECK (marital_status IN ('أعزب', 'متزوج')),
  request_id      UUID REFERENCES public.membership_requests(id) ON DELETE SET NULL,
  approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Member Visitations (priest-only tracking for church members)
CREATE TABLE public.member_visitations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_member_id  UUID NOT NULL REFERENCES public.church_members(id) ON DELETE CASCADE,
  visited_by        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visit_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type        TEXT NOT NULL DEFAULT 'منزلية' CHECK (visit_type IN ('منزلية', 'تليفونية', 'كنسية')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add "خارجيين (خريجين)" to church_services if missing
INSERT INTO public.church_services (name, gender, age_group, description)
SELECT 'خارجيين (خريجين)', 'مختلط', 'خريجين', 'خدمة الخارجيين والخريجين'
WHERE NOT EXISTS (
  SELECT 1 FROM public.church_services WHERE name LIKE '%خارجيين%'
);

-- ===================================================================
-- INDEXES
-- ===================================================================
CREATE INDEX idx_membership_requests_status ON public.membership_requests(status);
CREATE INDEX idx_church_members_name ON public.church_members(full_name);
CREATE INDEX idx_member_visitations_member ON public.member_visitations(church_member_id);
CREATE INDEX idx_member_visitations_date ON public.member_visitations(visit_date DESC);

-- ===================================================================
-- UPDATED_AT TRIGGERS
-- ===================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.membership_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.church_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_visitations ENABLE ROW LEVEL SECURITY;

-- Membership Requests: anyone can INSERT (public form), admin/priest/membership can SELECT
CREATE POLICY "membership_requests_insert" ON public.membership_requests FOR INSERT
  WITH CHECK (true);
CREATE POLICY "membership_requests_select" ON public.membership_requests FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest', 'membership')
  );
CREATE POLICY "membership_requests_update" ON public.membership_requests FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);

-- Church Members: admin/priest/membership can read, admin/priest can insert
CREATE POLICY "church_members_select" ON public.church_members FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest', 'membership')
  );
CREATE POLICY "church_members_insert" ON public.church_members FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);
CREATE POLICY "church_members_update" ON public.church_members FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest', 'membership')
);
CREATE POLICY "church_members_delete" ON public.church_members FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);

-- Member Visitations: priest/admin ONLY (strict)
CREATE POLICY "member_visitations_select" ON public.member_visitations FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
  );
CREATE POLICY "member_visitations_insert" ON public.member_visitations FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);
CREATE POLICY "member_visitations_update" ON public.member_visitations FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);
CREATE POLICY "member_visitations_delete" ON public.member_visitations FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'priest')
);

-- -------------------------------------------------------------------
-- 8. MEMORY ALBUMS (for Days in Memory page, using external URLs)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memory_albums (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  event_date      TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_albums_select" ON public.memory_albums;
CREATE POLICY "memory_albums_select" ON public.memory_albums FOR SELECT USING (true);

DROP POLICY IF EXISTS "memory_albums_insert" ON public.memory_albums;
CREATE POLICY "memory_albums_insert" ON public.memory_albums FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "memory_albums_update" ON public.memory_albums;
CREATE POLICY "memory_albums_update" ON public.memory_albums FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "memory_albums_delete" ON public.memory_albums;
CREATE POLICY "memory_albums_delete" ON public.memory_albums FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- Trigger updated_at automatically
DROP TRIGGER IF EXISTS set_updated_at ON public.memory_albums;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.memory_albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ===================================================================
-- 9. DYNAMIC PAGES & SECTIONS (Page Builder Schema)
-- ===================================================================

-- 1. Custom Pages Table
CREATE TABLE IF NOT EXISTS public.custom_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,         -- e.g. 'الصفحة الرئيسية', 'عن الكنيسة'
  slug        TEXT UNIQUE NOT NULL,  -- e.g. 'home', 'about', 'priests'
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for custom_pages
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_pages_select" ON public.custom_pages;
CREATE POLICY "custom_pages_select" ON public.custom_pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "custom_pages_manage" ON public.custom_pages;
CREATE POLICY "custom_pages_manage" ON public.custom_pages FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- 2. Page Sections Table (ordered grid blocks or texts)
CREATE TABLE IF NOT EXISTS public.page_sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id       UUID NOT NULL REFERENCES public.custom_pages(id) ON DELETE CASCADE,
  section_type  TEXT NOT NULL,         -- 'hero' | 'text_block' | 'cards_grid' | 'gallery' | 'contact'
  title         TEXT,
  subtitle      TEXT,
  content       TEXT,                  -- Large text block or Markdown
  image_url     TEXT,                  -- Background image or single feature image
  items         JSONB NOT NULL DEFAULT '[]', -- Grid items/nested data (e.g. [{title, desc, image, link}])
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for page_sections
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_sections_select" ON public.page_sections;
CREATE POLICY "page_sections_select" ON public.page_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "page_sections_manage" ON public.page_sections;
CREATE POLICY "page_sections_manage" ON public.page_sections FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- Auto updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON public.custom_pages;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.page_sections;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ===================================================================
-- SEED DATA: Migrate existing static pages to dynamic tables
-- ===================================================================

-- 1. Insert Custom Pages
INSERT INTO public.custom_pages (id, title, slug) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'الصفحة الرئيسية', 'home'),
  ('c0000000-0000-0000-0000-000000000002', 'عن الكنيسة', 'about')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Home Page Sections
-- Hero Section
INSERT INTO public.page_sections (page_id, section_type, title, subtitle, image_url, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'hero', 'كنيسة السيدة العذراء مريم', 'بمحرم بك', '/church.jpeg', 0)
ON CONFLICT DO NOTHING;

-- About Navigation Cards Section
INSERT INTO public.page_sections (page_id, section_type, title, subtitle, items, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'cards_grid', 'تعرف على كنيستنا', 'اختر أحد الأقسام التالية لاستكشاف تاريخ كنيستنا ورعاتها',
   '[
     {"title": "تاريخ الكنيسة", "desc": "رحلة تاريخية ملهمة منذ وضع حجر الأساس عام ١٩٣٤م.", "image": "/history_1.jpg", "link": "/about/history"},
     {"title": "الآباء كهنة الكنيسة", "desc": "تعرف على مجمع الآباء الكهنة الذين خدموا ويخدمون شعب الكنيسة بكل أمانة.", "image": "/history_15.jpg", "link": "/about/priests"},
     {"title": "أيام فى ذاكرة الكنيسة", "desc": "أرشيف تفاعلي للمحطات التاريخية الهامة وألبومات الصور التذكارية.", "image": "/history_6.jpg", "link": "/about/memory"}
   ]'::jsonb, 0)
ON CONFLICT DO NOTHING;


-- ===================================================================
-- 10. PRIESTS SCHEMA & SEED DATA
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.priests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,          -- Priest Name
  title         TEXT,                   -- Ordination detail/notes
  image_url     TEXT,                   -- Profile Image path/URL
  status        TEXT NOT NULL DEFAULT 'reposed', -- active | reposed | martyr
  ordained_date TEXT,                   -- Ordination date
  reposed_date  TEXT,                   -- Reposed date if reposed/martyred
  bio           TEXT,                   -- Short biography notes
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.priests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "priests_select" ON public.priests;
CREATE POLICY "priests_select" ON public.priests FOR SELECT USING (true);

DROP POLICY IF EXISTS "priests_manage" ON public.priests;
CREATE POLICY "priests_manage" ON public.priests FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.priests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.priests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed Default 20 Priests List
INSERT INTO public.priests (name, status, bio, ordained_date, reposed_date, image_url, sort_order) VALUES
  ('القمص يوسف مجلى', 'reposed', 'من الرعاة الأوائل الذين خدموا الكنيسة في البدايات.', NULL, NULL, NULL, 0),
  ('القمص فيلبس بطرس', 'reposed', 'أحد الآباء الرعاة الأفاضل الذين تركوا بصمة روحية في الحي.', NULL, NULL, NULL, 1),
  ('القمص أنطوان عبد الملك', 'reposed', 'نُقل لاحقاً إلى القاهرة راعياً لكنيسة مار يوحنا بحلمية الزيتون.', NULL, NULL, NULL, 2),
  ('القمص أرمانيوس البراموسى', 'reposed', 'تنيح لاحقاً باسم "نيافة الحبر الجليل الأنبا مكاريوس أسقف دير البراموس".', NULL, NULL, NULL, 3),
  ('القمص غبريال البراموسى', 'reposed', 'من الخدام والآباء الأجلاء الذين خدموا مذبح الكنيسة بكل تقوى.', NULL, NULL, NULL, 4),
  ('القمص مرقس باسيليوس', 'reposed', 'أول كاهن رُسم على مذبح الكنيسة. رُقي قمصاً عام ١٩٤٦م، ورقد في الرب في ٧ مارس ١٩٨٢م وبُني له مزار خاص بالكنيسة يُزار حتى اليوم.', '٧ مارس ١٩٤٣م', '٧ مارس ١٩٨٢م', '/history_15.jpg', 5),
  ('القمص أسحق إبراهيم', 'reposed', 'نُقل للخدمة في كنيستنا قادماً من كنيسة الشهيد العظيم مارجرجس بغيط العنب.', NULL, NULL, NULL, 6),
  ('القمص عبد المسيح مقار', 'reposed', 'نُقل للخدمة في كنيستنا قادماً من كنيسة السيدة العذراء مريم بغيط العنب.', NULL, NULL, NULL, 7),
  ('القمص ميخائيل سعد', 'reposed', 'خدم مذبح الكنيسة بأمانة، ثم خدم كراعي كنيسة السيدة العذراء والقديس يوسف بسموحة.', NULL, NULL, NULL, 8),
  ('القس صموئيل عبده', 'reposed', 'خدم بالكنيسة ونُقل قادماً من كنيسة العذراء مريم بالمستشفى القبطي.', NULL, NULL, NULL, 9),
  ('القمص مكسيموس وصفى', 'reposed', 'راعٍ جليل خدم الكنيسة لعقود طويلة بغيرة رسولية تنيح في ٢٣ ديسمبر ٢٠٢٣م.', '١ أكتوبر ١٩٧١م', '٢٣ ديسمبر ٢٠٢٣م', NULL, 10),
  ('القس دوماديوس حنا', 'reposed', 'كاهن تقي خدم مذبح الكنيسة والتعليم بكل محبة وتفانٍ حتى رقد في الرب.', '٢٧ يناير ١٩٧٤م', '٤ نوفمبر ٢٠٢١م', NULL, 11),
  ('القس موسى شنودة', 'reposed', 'رُسم على مذبح الكنيسة وتنيح في ٢٣ أغسطس ٢٠٠٦م بعد مسيرة حافلة بالخدمة.', '١ مارس ١٩٨٧م', '٢٣ أغسطس ٢٠٠٦م', NULL, 12),
  ('القس مرقس ميلاد', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ١٦ يونيو ١٩٩٥م.', '١٦ يونيو ١٩٩٥م', NULL, NULL, 13),
  ('القس أرسانيوس وديد', 'martyr', 'رُسم لخدمة منطقة كرموز في ١٦ يونيو ١٩٩٥م، ونال إكليل الشهادة المبارك في ٧ أبريل ٢٠٢٢م.', '١٦ يونيو ١٩٩٥م', '٧ أبريل ٢٠٢٢م', NULL, 14),
  ('القس بيشوى ثابت', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٦ مايو ٢٠٠٧م.', '٦ مايو ٢٠٠٧م', NULL, NULL, 15),
  ('القس مينا نادر', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٩ نوفمبر ٢٠١٣م.', '٩ نوفمبر ٢٠١٣م', NULL, NULL, 16),
  ('القس ميخائيل ميخائيل', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ يوليو ٢٠١٥م.', '٤ يوليو ٢٠١٥م', NULL, NULL, 17),
  ('القس كيرلس ميلاد', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ يوليو ٢٠٢٤م.', '٤ يوليو ٢٠٢٤م', NULL, NULL, 18),
  ('القس موسى وجيه', 'active', 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ نوفمبر ٢٠٢٥م.', '٤ نوفمبر ٢٠٢٥م', NULL, NULL, 19)
ON CONFLICT DO NOTHING;

-- ── Contact Messages Table ──
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_insert" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_select" ON public.contact_messages;
CREATE POLICY "contact_messages_select" ON public.contact_messages FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

DROP POLICY IF EXISTS "contact_messages_update" ON public.contact_messages;
CREATE POLICY "contact_messages_update" ON public.contact_messages FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

DROP POLICY IF EXISTS "contact_messages_delete" ON public.contact_messages;
CREATE POLICY "contact_messages_delete" ON public.contact_messages FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);





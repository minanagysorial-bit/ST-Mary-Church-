-- ===================================================================
-- STEP 2: CREATE EVERYTHING — Run this AFTER step1_cleanup.sql
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------
-- TABLES
-- -------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'servant' CHECK (role IN ('admin', 'priest', 'servant', 'board')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sermons (
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

CREATE TABLE public.members (
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

CREATE TABLE public.service_areas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  responsible_priest  TEXT NOT NULL,
  families_count      INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.families (
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

CREATE TABLE public.meetings (
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

CREATE TABLE public.projects (
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

CREATE TABLE public.financial_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL CHECK (type IN ('تبرع', 'مصروفات', 'خدمات إخوة الرب')),
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prayer_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_name  TEXT NOT NULL,
  request_text    TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.membership_comments (
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

-- -------------------------------------------------------------------
-- HELPER FUNCTIONS (NO auth schema functions!)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@stmary.church' THEN 'admin'
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

CREATE OR REPLACE FUNCTION public.increment_play_count(sermon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.sermons SET play_count = play_count + 1 WHERE id = sermon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['profiles','sermons','members','families','meetings','projects','membership_comments'])
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- -------------------------------------------------------------------
-- ROW LEVEL SECURITY — Non-Recursive Direct Subquery Policies
-- NO user_role() function — use direct subquery instead
-- -------------------------------------------------------------------
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

-- PROFILES: Simple non-recursive policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- SERMONS: Public read, admin/priest write
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

-- MEMBERS
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

-- FAMILIES
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

-- SERVICE AREAS
CREATE POLICY "areas_select" ON public.service_areas FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest', 'servant') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest', 'servant')
);
CREATE POLICY "areas_insert" ON public.service_areas FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- MEETINGS
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

-- PROJECTS
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

-- FINANCIAL RECORDS
CREATE POLICY "financials_select" ON public.financial_records FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);
CREATE POLICY "financials_insert" ON public.financial_records FOR INSERT WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'board') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'board')
);

-- PRAYER REQUESTS
CREATE POLICY "prayers_insert" ON public.prayer_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "prayers_select" ON public.prayer_requests FOR SELECT USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);
CREATE POLICY "prayers_update" ON public.prayer_requests FOR UPDATE USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('admin', 'priest') OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest')
);

-- MEMBERSHIP COMMENTS
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

-- INDEXES
CREATE INDEX idx_sermons_topic ON public.sermons(topic);
CREATE INDEX idx_sermons_speaker ON public.sermons(speaker);
CREATE INDEX idx_sermons_date ON public.sermons(sermon_date DESC);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_members_service ON public.members(service);
CREATE INDEX idx_families_area ON public.families(area);
CREATE INDEX idx_meetings_date ON public.meetings(date DESC);
CREATE INDEX idx_financials_date ON public.financial_records(date DESC);
CREATE INDEX idx_financials_type ON public.financial_records(type);

-- -------------------------------------------------------------------
-- SEED DATA
-- -------------------------------------------------------------------
INSERT INTO public.sermons (title, speaker, topic, sermon_date, duration_minutes, youtube_url, description, play_count, featured) VALUES
  ('سر الفرح الدائم في المسيح والرجاء الأبدي', 'القمص يوحنا رمزي', 'روحيات', '2026-07-25', 45, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'كلمة روحية عميقة عن كيفية التمسك بالفرح الإلهي وسط التحديات والضيقات.', 1240, true),
  ('تفسير رسالة القديس بولس إلى أهل أفسس', 'القس بيشوي كمال', 'كتاب مقدس', '2026-07-18', 60, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'شرح وتأملات آية بآية في رسالة أفسس.', 850, false),
  ('عقيدتنا الأرثوذكسية في التجسد الإلهي', 'الأنبا باسيليوس', 'عقيدة', '2026-07-10', 50, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'محاضرة عقيدية تبسط مفاهيم التجسد الإلهي.', 2100, false),
  ('كيف نربي أبناءنا في فكر الكنيسة؟', 'القمص يوحنا رمزي', 'شباب ومجلس', '2026-07-02', 40, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'إرشادات تربوية ونفسية للمدرسين والخدّام.', 980, false);

INSERT INTO public.members (full_name, email, phone, service, status, registration_date) VALUES
  ('مينا عادل حليم', 'mina.adel@example.com', '01223456789', 'خدمة الشباب', 'نشط', '2026-06-12'),
  ('سارة سمير حنا', 'sara.sameh@example.com', '01012345678', 'اجتماع السيدات', 'نشط', '2026-06-15'),
  ('يوحنا وجيه نجيب', 'youssef.wageeh@example.com', '01198765432', 'الشمامسة', 'قيد الانتظار', '2026-07-01'),
  ('مارينا مجدي صادق', 'marina.magdy@example.com', '01200001122', 'مدارس الأحد', 'نشط', '2026-07-10'),
  ('بيشوي عاطف منير', 'bishoy.atef@example.com', '01555544332', 'إخوة الرب', 'نشط', '2026-07-20');

INSERT INTO public.meetings (title, date, location, attendees_count, status) VALUES
  ('اجتماع مجلس الكنيسة الدوري', '2026-08-05', 'قاعة الاجتماعات الرئيسية', 14, 'مجدول'),
  ('اجتماع خدام ومدارسة كتاب', '2026-08-07', 'مسرح الكنيسة', 45, 'مجدول'),
  ('اجتماع الشباب الأسبوعي', '2026-08-01', 'الكنيسة الكبرى', 120, 'مكتمل');

INSERT INTO public.projects (title, progress, budget, target_date, status) VALUES
  ('تجديد وتحديث شبكة الصوتيات', 85, '150,000 ج.م', '2026-08-30', 'قيد التنفيذ'),
  ('إنشاء المكتبة الرقمية', 40, '90,000 ج.م', '2026-09-15', 'قيد التنفيذ'),
  ('عزل الأسطح وتجديد الأيقونات', 100, '200,000 ج.م', '2026-07-01', 'مكتمل');

INSERT INTO public.financial_records (type, amount, description, date) VALUES
  ('تبرع', 25000, 'تبرع للمبنى الجديد والتجديدات', '2026-07-28'),
  ('خدمات إخوة الرب', 18000, 'مساعدات شهرية للأسر المستحقة', '2026-07-25'),
  ('مصروفات', 6400, 'فواتير وصيانة أجهزة التكييف', '2026-07-20');

INSERT INTO public.service_areas (name, responsible_priest, families_count) VALUES
  ('منطقة محرم بك البحرية', 'القمص يوحنا رمزي', 45),
  ('منطقة الرصافة والشارع الجديد', 'القس بيشوي كمال', 60);

INSERT INTO public.membership_comments (applicant_name, requested_service, confession_father, status) VALUES
  ('يوحنا وجيه نجيب', 'خدمة الشمامسة والألحان', 'القمص يوحنا رمزي', 'قيد المراجعة');

INSERT INTO public.families (head_name, address, area, members_count, last_visit_date) VALUES
  ('أ/ مينا عادل حليم', 'شارع الرصافة، محرم بك', 'محرم بك', 4, CURRENT_DATE - INTERVAL '5 days');

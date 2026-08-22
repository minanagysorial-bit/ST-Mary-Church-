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

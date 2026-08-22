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

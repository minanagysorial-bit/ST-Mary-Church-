-- ===================================================================
-- SQL Migration: Add missing columns to family_members, Create family_servants,
-- Create family_attendance_records, Fix visitation_logs & RLS
-- ===================================================================

-- 1. Add missing columns to family_members table (Makhdoum)
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_2 TEXT;

-- 2. Create family_servants table for mapping multiple servants to a family
CREATE TABLE IF NOT EXISTS public.family_servants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    servant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(family_id, servant_id)
);

-- 3. Create family_attendance_records table for Sunday school families
CREATE TABLE IF NOT EXISTS public.family_attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present BOOLEAN NOT NULL DEFAULT false,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(family_id, member_id, date)
);

-- 4. Fix visitation_logs table permissions and link to family_members instead of members
ALTER TABLE public.visitation_logs DROP CONSTRAINT IF EXISTS visitation_logs_member_id_fkey;

ALTER TABLE public.visitation_logs 
ADD CONSTRAINT visitation_logs_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.family_members(id) ON DELETE CASCADE;

-- 5. Explicitly GRANT table ownership and permissions to resolve PostgreSQL "permission denied"
ALTER TABLE public.family_members OWNER TO postgres;
ALTER TABLE public.families OWNER TO postgres;
ALTER TABLE public.family_servants OWNER TO postgres;
ALTER TABLE public.family_attendance_records OWNER TO postgres;
ALTER TABLE public.visitation_logs OWNER TO postgres;

GRANT ALL ON TABLE public.family_members TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.families TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.family_servants TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.family_attendance_records TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.visitation_logs TO postgres, service_role, authenticated, anon;

-- Enable RLS on tables
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_servants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitation_logs ENABLE ROW LEVEL SECURITY;

-- 6. Recreate bulletproof RLS policies for family_members (authenticated users only)
DROP POLICY IF EXISTS "Enable read access for permitted roles" ON public.family_members;
DROP POLICY IF EXISTS "Enable all access for permitted roles" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete" ON public.family_members;

CREATE POLICY "family_members_select" ON public.family_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Recreate bulletproof RLS policies for family_servants (authenticated users only)
DROP POLICY IF EXISTS "family_servants_select" ON public.family_servants;
DROP POLICY IF EXISTS "family_servants_insert" ON public.family_servants;
DROP POLICY IF EXISTS "family_servants_delete" ON public.family_servants;

CREATE POLICY "family_servants_select" ON public.family_servants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "family_servants_insert" ON public.family_servants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "family_servants_delete" ON public.family_servants FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Recreate bulletproof RLS policies for family_attendance_records (authenticated users only)
DROP POLICY IF EXISTS "family_attendance_select" ON public.family_attendance_records;
DROP POLICY IF EXISTS "family_attendance_insert" ON public.family_attendance_records;
DROP POLICY IF EXISTS "family_attendance_update" ON public.family_attendance_records;
DROP POLICY IF EXISTS "family_attendance_delete" ON public.family_attendance_records;

CREATE POLICY "family_attendance_select" ON public.family_attendance_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "family_attendance_insert" ON public.family_attendance_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "family_attendance_update" ON public.family_attendance_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "family_attendance_delete" ON public.family_attendance_records FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Recreate bulletproof RLS policies for families (authenticated users only)
DROP POLICY IF EXISTS "families_select" ON public.families;
DROP POLICY IF EXISTS "families_insert" ON public.families;
DROP POLICY IF EXISTS "families_update" ON public.families;
DROP POLICY IF EXISTS "families_delete" ON public.families;

CREATE POLICY "families_select" ON public.families FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "families_update" ON public.families FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "families_delete" ON public.families FOR DELETE USING (auth.role() = 'authenticated');

-- 10. Recreate bulletproof RLS policies for visitation_logs (authenticated users only)
DROP POLICY IF EXISTS "visitation_select" ON public.visitation_logs;
DROP POLICY IF EXISTS "visitation_insert" ON public.visitation_logs;
DROP POLICY IF EXISTS "visitation_update" ON public.visitation_logs;
DROP POLICY IF EXISTS "visitation_delete" ON public.visitation_logs;

CREATE POLICY "visitation_select" ON public.visitation_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "visitation_insert" ON public.visitation_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "visitation_update" ON public.visitation_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "visitation_delete" ON public.visitation_logs FOR DELETE USING (auth.role() = 'authenticated');

-- 11. Migrate existing single servant assignments from families to family_servants
INSERT INTO public.family_servants (family_id, servant_id)
SELECT id, assigned_servant_id FROM public.families
WHERE assigned_servant_id IS NOT NULL
ON CONFLICT (family_id, servant_id) DO NOTHING;

-- 12. Force schema cache reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

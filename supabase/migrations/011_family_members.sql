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

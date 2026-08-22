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

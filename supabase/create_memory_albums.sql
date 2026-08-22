-- ===================================================================
-- SQL SCRIPT: Create Missing memory_albums Table & RLS Policies
-- Run this in the Supabase SQL Editor to resolve the schema cache error.
-- ===================================================================

-- 1. Create memory_albums table if it does not exist
CREATE TABLE IF NOT EXISTS public.memory_albums (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  event_date      DATE NOT NULL,
  cover_image_url TEXT NOT NULL,
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.memory_albums ENABLE ROW LEVEL SECURITY;

-- 3. Create SELECT policy (Allow everyone to view albums)
DROP POLICY IF EXISTS "Anyone can select memory_albums" ON public.memory_albums;
CREATE POLICY "Anyone can select memory_albums" ON public.memory_albums 
  FOR SELECT USING (true);

-- 4. Create ALL policy (Allow admin and super_admin to perform all operations)
DROP POLICY IF EXISTS "Admins can manage memory_albums" ON public.memory_albums;
CREATE POLICY "Admins can manage memory_albums" ON public.memory_albums 
  FOR ALL TO authenticated
  USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

-- 5. Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

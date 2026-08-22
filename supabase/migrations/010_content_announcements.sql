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

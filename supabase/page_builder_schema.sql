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

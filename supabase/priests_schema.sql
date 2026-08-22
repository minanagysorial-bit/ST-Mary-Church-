-- ===================================================================
-- 10. PRIESTS SCHEMA & SEED DATA
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.priests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,          -- Priest Name (e.g. القمص يوسف مجلى)
  title         TEXT,                   -- Ordination detail/notes
  image_url     TEXT,                   -- Profile Image path/URL
  status        TEXT NOT NULL DEFAULT 'reposed', -- active | reposed | martyr
  ordained_date TEXT,                   -- Ordination date (e.g. ٧ مارس ١٩٤٣م)
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

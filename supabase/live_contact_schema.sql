-- 1. Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_insert" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_select" ON public.contact_messages;
CREATE POLICY "contact_messages_select" ON public.contact_messages FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

DROP POLICY IF EXISTS "contact_messages_update" ON public.contact_messages;
CREATE POLICY "contact_messages_update" ON public.contact_messages FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

DROP POLICY IF EXISTS "contact_messages_delete" ON public.contact_messages;
CREATE POLICY "contact_messages_delete" ON public.contact_messages FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'admin', 'priest')
);

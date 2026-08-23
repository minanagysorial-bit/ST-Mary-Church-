-- Run this in Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/pcyektzremkilvpfqtll/sql

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  subscription_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anonymous inserts (so browsers can register)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_insert" ON push_subscriptions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "allow_anon_select" ON push_subscriptions
  FOR SELECT TO anon USING (true);

CREATE POLICY "allow_anon_delete" ON push_subscriptions
  FOR DELETE TO anon USING (true);

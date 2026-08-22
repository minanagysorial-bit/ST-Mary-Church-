-- ===================================================================
-- SQL SEED SCRIPT FOR SUPER ADMIN ACCOUNT
-- Run this script inside your Supabase SQL Editor to initialize the account
-- ===================================================================

-- 1. Create the Super Admin user in auth.users if it doesn't already exist
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -- Deterministic UUID for the super admin
  'authenticated',
  'authenticated',
  'admin@StMarychurch',
  extensions.crypt('mina199824nagy', extensions.gen_salt('bf')), -- bcrypt hashing via pgcrypto
  now(),
  NULL,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"المشرف العام (Super Admin)", "role":"super_admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- 2. Verify that the profile exists and has the super_admin role
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'admin@StMarychurch',
  'المشرف العام (Super Admin)',
  'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    full_name = 'المشرف العام (Super Admin)';

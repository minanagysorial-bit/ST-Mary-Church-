-- ===================================================================
-- Create Default Super Admin User SQL Seed
-- Run this script in the Supabase SQL Editor AFTER step2_create.sql
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@stmary.church';

  -- Insert super admin into auth.users if not already created
  IF admin_uid IS NULL THEN
    admin_uid := '00000000-0000-0000-0000-000000000001';
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@stmary.church',
      crypt('Admin@123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "مدير النظام (Super Admin)", "role": "admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Ensure profile exists in public.profiles with role = 'admin'
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_uid, 'admin@stmary.church', 'مدير النظام (Super Admin)', 'admin')
  ON CONFLICT (id) DO UPDATE 
    SET role = 'admin',
        full_name = 'مدير النظام (Super Admin)';

END $$;

-- Reload PostgREST schema cache after setup
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

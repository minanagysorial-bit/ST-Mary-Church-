-- ===================================================================
-- Migration: Fix NULL tokens in auth.users
-- This resolves the "Database error querying schema" on signIn/signUp
-- ===================================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '');

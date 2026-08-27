import { supabase } from './supabase';
import type { Profile, UserRole } from './database.types';

// ── Sign In ──────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) throw error;
  return data;
}

// ── Sign Up ──────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'servant'
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });
  if (error) throw error;
  return data;
}

// ── Sign Out ─────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Get Current Session ──────────────────────────────────
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ── Get Profile for Current User ─────────────────────────
export async function getProfile(): Promise<Profile | null> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile from database:', error.message);
      return null;
    }

    return (data as Profile) || null;
  } catch (e: any) {
    console.error('Failed to get user profile:', e);
    return null;
  }
}

// ── Update Profile ───────────────────────────────────────
export async function updateProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('غير مصرح لك بتعديل الملف الشخصي');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ── Admin Create User (Secondary Client for Super Admin) ──
export async function adminCreateUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  // Instantiate client with non-persisted state to protect admin's current session
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await tempClient.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) throw error;

  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email.trim(),
        full_name: fullName,
        role,
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert after signup returned error:', profileError);
    }
  }

  return data;
}

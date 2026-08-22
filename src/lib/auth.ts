import { supabase } from './supabase';
import type { Profile, UserRole } from './database.types';

// ── Sign In ──────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
    email,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isSuperAdmin = user.email === 'admin@stmary.church';
  const fallbackProfile: Profile = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || (isSuperAdmin ? 'مدير النظام (Super Admin)' : user.email || ''),
    role: (isSuperAdmin ? 'super_admin' : user.user_metadata?.role || 'servant') as UserRole,
    phone: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Profile;

  let data: any = null;
  let error: any = null;

  try {
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    data = result.data;
    error = result.error;
  } catch (e: any) {
    console.warn('Profile fetch failed (possible schema error), using fallback:', e.message);
    return fallbackProfile;
  }

  // Handle "Database error querying schema" or other PostgREST errors
  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('schema') || msg.includes('pgrst') || error.code === 'PGRST116') {
      console.warn('Schema/PostgREST error fetching profile, using fallback:', error.message);
      // Try to create the profile anyway
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          full_name: fallbackProfile.full_name,
          role: fallbackProfile.role,
        });
      } catch { /* ignore upsert failure */ }
      return fallbackProfile;
    }
    throw error;
  }

  if (!data) {
    // Auto-create missing profile
    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: fallbackProfile.full_name,
        role: fallbackProfile.role,
      })
      .select()
      .maybeSingle();

    if (createErr) {
      console.error('Error creating profile:', createErr);
      return fallbackProfile;
    }
    return (created || fallbackProfile) as Profile;
  }

  if (isSuperAdmin && data) {
    data.role = 'super_admin';
  }
  return data as Profile;
}

// ── Update Profile ───────────────────────────────────────
export async function updateProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ── Admin Create User (Secondary Client fallback) ──
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
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) throw error;

  // The database trigger may silently fail due to RLS or email confirmation state.
  // Explicitly upsert the profile using the main (admin-authenticated) client
  // to guarantee the profile row exists and appears in the accounts list.
  const userId = data.user?.id;
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role,
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert after signup returned error (profile might already be created by database trigger):', profileError);
    }
  }

  return data;
}

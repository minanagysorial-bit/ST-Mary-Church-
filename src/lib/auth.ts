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

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  // Instantiate client with non-persisted state to protect admin's current session
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await tempClient.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        role
      }
    }
  });

  if (error) {
    // If user already registered in auth, try to sync profile anyway
    console.warn('Auth signup warning:', error.message);
    if (!error.message.includes('already registered')) {
      throw error;
    }
  }

  const userId = data?.user?.id;
  
  if (userId) {
    // 1. Upsert to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        role,
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert after signup returned error:', profileError);
    }
  } else {
    // Fallback search profile by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({ full_name: cleanName, role })
        .eq('id', existingProfile.id);
    }
  }

  // 2. Cross-sync to Priests directory if role is priest
  if (role === 'priest') {
    try {
      await supabase
        .from('priests')
        .insert({
          name: cleanName.startsWith('القمص') || cleanName.startsWith('القس') || cleanName.startsWith('أبونا') 
            ? cleanName 
            : `أبونا ${cleanName}`,
          title: 'كاهن بكنيسة السيدة العذراء بمحرم بك',
          status: 'active',
          bio: 'كاهن موقر بكنيسة السيدة العذراء بمحرم بك بالإسكندرية.'
        });
    } catch (priestErr) {
      console.warn('Priest table auto-sync notice:', priestErr);
    }
  }

  // 3. Cross-sync to Members & Servants directory if role is servant or service_leader
  if (role === 'servant' || role === 'service_leader') {
    try {
      await supabase
        .from('members')
        .insert({
          full_name: cleanName,
          email: cleanEmail,
          status: 'نشط',
          service: role === 'service_leader' ? 'أمين خدمة' : 'خادم تربية كنسية',
        });
    } catch (memberErr) {
      console.warn('Members table auto-sync notice:', memberErr);
    }
  }

  return data;
}

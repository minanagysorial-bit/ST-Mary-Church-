import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../lib/auth';
import type { Profile, UserRole } from '../lib/database.types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (userId: string) => {
    try {
      const { data, error: permError } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', userId);
      if (permError) {
        setPermissions([]);
        return;
      }
      setPermissions((data || []).map((p: any) => p.permission));
    } catch {
      setPermissions([]);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
      if (p) {
        await fetchPermissions(p.id);
      } else {
        setPermissions([]);
      }
    } catch {
      setProfile(null);
      setPermissions([]);
    }
  }, [fetchPermissions]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        refreshProfile().finally(() => setLoading(false));
      } else {
        setProfile(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s) {
          await refreshProfile();
        } else {
          setProfile(null);
          setPermissions([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await authSignIn(email, password);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'خطأ في تسجيل الدخول');
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role?: UserRole) => {
    setError(null);
    try {
      await authSignUp(email, password, fullName, role);
    } catch (err: any) {
      setError(err.message || 'خطأ في إنشاء الحساب');
      throw err;
    }
  };

  const signOut = async () => {
    await authSignOut();
    setProfile(null);
    setPermissions([]);
    setSession(null);
  };

  const hasPermission = (key: string): boolean => {
    if (!profile) return false;
    // Super Admin and Admin have full access
    if (profile.role === 'super_admin' || profile.role === 'admin') return true;
    
    // Check user dynamic permissions
    if (permissions.length > 0) {
      return permissions.includes(key);
    }
    
    // Default role permissions
    if (profile.role === 'priest') {
      return [
        'manage_liturgies',
        'manage_priest_sermons',
        'manage_announcements',
        'view_services',
        'monitor_servants',
        'manage_membership_comments',
        'review_membership_requests',
        'view_member_visitations'
      ].includes(key);
    }
    if (profile.role === 'servant') {
      return [
        'manage_families',
        'manage_visitation',
        'manage_attendance',
        'manage_servant_tools',
        'manage_quizzes'
      ].includes(key);
    }
    if (profile.role === 'board') {
      return [
        'view_financials',
        'manage_projects',
        'manage_meetings'
      ].includes(key);
    }
    if (profile.role === 'membership') {
      return [
        'manage_church_members',
        'review_membership_requests',
        'view_member_visitations',
        'manage_membership_comments'
      ].includes(key);
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ session, profile, permissions, loading, error, signIn, signUp, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

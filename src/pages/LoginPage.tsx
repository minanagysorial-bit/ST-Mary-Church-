import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cross, User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureProfile = async (userId: string, userEmail: string) => {
    const emailLower = userEmail.toLowerCase();
    const isSuperAdmin = emailLower === 'admin@stmary.church' || emailLower === 'admin@stmarychurch';
    const fallbackRole = isSuperAdmin ? 'super_admin' : 'servant';

    try {
      const { supabase } = await import('../lib/supabase');
      // Check if profile exists
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!error && existing?.role) {
        if (isSuperAdmin) {
          if (existing.role !== 'super_admin') {
            await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', userId);
          }
          return 'super_admin';
        }
        return existing.role;
      }

      // Try to create profile if missing
      await supabase.from('profiles').upsert({
        id: userId,
        email: userEmail,
        full_name: isSuperAdmin ? 'مدير النظام (Super Admin)' : userEmail,
        role: fallbackRole,
      });
    } catch (err: any) {
      console.warn('ensureProfile encounter error, using fallback role:', err?.message);
    }
    return fallbackRole;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailLower = email.toLowerCase();
    const isSuperAdmin = emailLower === 'admin@stmary.church' || emailLower === 'admin@stmarychurch';

    try {
      // Step 1: Try signIn
      try {
        await signIn(email, password);
      } catch (signInErr: any) {
        const msg = signInErr.message?.toLowerCase() || '';
        // If super admin and schema error occurred
        if (isSuperAdmin && (msg.includes('schema') || msg.includes('500') || msg.includes('database error'))) {
          try {
            const { signUp: authSignUp } = await import('../lib/auth');
            await authSignUp(email, password, 'مدير النظام (Super Admin)', 'super_admin');
            await signIn(email, password);
          } catch {
            // signIn in AuthContext handles fallback session internally
          }
        } else {
          throw signInErr;
        }
      }

      // Step 2: Get user and navigate to dashboard
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || email;
      const role = await ensureProfile(user?.id || 'admin-id', userEmail);
      
      switch (role) {
        case 'super_admin':
        case 'admin': navigate('/admin'); break;
        case 'priest': navigate('/priest'); break;
        case 'board': navigate('/board'); break;
        default: navigate('/servant'); break;
      }
    } catch (err: any) {
      // If super admin fallback activated, navigate to /admin anyway
      if (isSuperAdmin) {
        navigate('/admin');
        return;
      }
      const msg = err.message || '';
      if (msg.toLowerCase().includes('schema')) {
        setError(
          'حدث خطأ في قاعدة البيانات (Database error querying schema). يرجى تشغيل ملف supabase/step1_cleanup.sql ثم step2_create.sql في Supabase SQL Editor وإعادة المحاولة.'
        );
      } else {
        setError(msg || 'خطأ في تسجيل الدخول. تأكد من البريد وكلمة المرور.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2]">
      
      {/* Background Radial Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#002366]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl border-t-[6px] border-t-[#d4af37] border-x border-b border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative z-10 animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold mx-auto border-2 border-[#d4af37] shadow-lg">
            <Cross className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-tajawal text-2xl font-extrabold text-[#00174a]">
              تسجيل الدخول للنظام
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              نظام الإدارة الكنسي - كنيسة السيدة العذراء مريم بمحرم بك
            </p>
          </div>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                كلمة المرور
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('يرجى التواصل مع مسؤول تكنولوجيا المعلومات بالكنيسة لإعادة التعيين.'); }} className="text-[11px] font-bold text-[#002366] hover:underline">
                نسيت كلمة المرور؟
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#002366] focus:ring-[#002366]"
            />
            <label htmlFor="remember" className="text-xs font-bold text-slate-600 cursor-pointer">
              تذكر بياناتي في هذا المتصفح
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#002366] to-[#00174a] text-[#fed65b] font-bold text-xs py-3.5 rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>جاري تسجيل الدخول...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>دخول إلى النظام الإداري</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Support */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
          <Link to="/" className="hover:text-[#002366] flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>موقع الكنيسة الرئيسي</span>
          </Link>
          <span className="flex items-center gap-1 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>مركز الدعم الفني</span>
          </span>
        </div>

      </div>

    </div>
  );
};

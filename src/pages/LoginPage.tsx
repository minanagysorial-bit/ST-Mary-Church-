import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cross, User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Strict Authentication via Supabase Auth (Checks actual hashed password)
      await signIn(cleanEmail, password);

      // 2. Fetch authenticated user details from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('لم يتم التحقق من الحساب. يرجى المحاولة مرة أخرى.');
      }

      // 3. Verify user profile and role in database
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr || !profile || !profile.role) {
        await supabase.auth.signOut();
        throw new Error('هذا الحساب ليس لديه صلاحيات مسجلة للوصول إلى لوحة التحكم. يرجى التواصل مع مسؤول النظام.');
      }

      const role = profile.role;

      // 4. Role-based routing to verified dashboard
      switch (role) {
        case 'super_admin':
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'priest':
          navigate('/priest', { replace: true });
          break;
        case 'board':
          navigate('/board', { replace: true });
          break;
        case 'membership':
          navigate('/membership', { replace: true });
          break;
        case 'servant':
          navigate('/servant', { replace: true });
          break;
        default:
          await supabase.auth.signOut();
          throw new Error('نوع الحساب غير مصرح له بالدخول للنظام الإداري.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid_grant') ||
        msg.toLowerCase().includes('invalid credentials')
      ) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('يرجى تأكيد البريد الإلكتروني أولاً قبل تسجيل الدخول.');
      } else {
        setError(msg || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات والمحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2]" dir="rtl">
      
      {/* Background Radial Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#002366]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl border-t-[6px] border-t-[#d4af37] border-x border-b border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative z-10 animate-fade-in text-right">
        
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
              نظام الإدارة الكنسي الموحد - كنيسة السيدة العذراء مريم بمحرم بك
            </p>
          </div>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
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
                placeholder="admin@stmary.church"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] transition-all text-right"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                كلمة المرور
              </label>
              <button
                type="button"
                onClick={() => alert('يرجى التواصل مع مسؤول تكنولوجيا المعلومات بالكنيسة لإعادة تعيين كلمة المرور.')}
                className="text-[11px] font-bold text-[#002366] hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] transition-all text-right"
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
              className="w-4 h-4 rounded text-[#002366] focus:ring-[#002366] accent-[#002366]"
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
              <span>جاري التحقق وتسجيل الدخول...</span>
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

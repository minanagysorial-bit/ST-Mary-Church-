import React from 'react';
import { Menu, LogOut, Home, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface DashboardTopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({ onToggleMobileSidebar }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <header
      className="bg-[#fbf9f8]/95 backdrop-blur-md border-b border-[#c5c6d2]/50 flex justify-between items-center h-16 px-4 sm:px-6 md:px-8 sticky top-0 z-30 w-full font-cairo shadow-sm"
      dir="rtl"
    >
      {/* Right side: Mobile Menu Trigger + Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-white border border-[#c5c6d2]/60 text-[#00113a] hover:bg-[#00113a]/5 shadow-sm transition-all flex items-center justify-center"
            title="فتح القائمة الجانبية"
            type="button"
          >
            <Menu className="w-5 h-5 text-[#00113a]" />
          </button>
        )}
        <div className="font-tajawal text-sm sm:text-lg font-extrabold text-[#00113a] tracking-wide truncate">
          لوحة التحكم المركزية
        </div>
      </div>

      {/* Left side: Profile Name + View Site + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Info Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#00174a]">
          <div className="w-6 h-6 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="truncate max-w-[140px]">{profile?.full_name || 'مستخدم النظام'}</span>
        </div>

        {/* View Public Website */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          title="العودة للموقع الرئيسي"
        >
          <Home className="w-3.5 h-3.5 text-[#00174a]" />
          <span>الموقع</span>
        </Link>

        {/* Prominent Log Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          title="تسجيل الخروج من الحساب"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-extrabold">تسجيل الخروج</span>
        </button>
      </div>
    </header>
  );
};

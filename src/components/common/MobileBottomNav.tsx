import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, Mic, HeartHandshake, User, LayoutDashboard, 
  CheckSquare, MapPin, Sparkles, LogIn
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileBottomNavProps {
  onOpenPrayerModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenPrayerModal }) => {
  const location = useLocation();
  const { profile } = useAuth();
  const path = location.pathname;

  const isDashboard = 
    path.startsWith('/admin') ||
    path.startsWith('/priest') ||
    path.startsWith('/service-leader') ||
    path.startsWith('/servant') ||
    path.startsWith('/membership') ||
    path.startsWith('/board');

  const getDashboardPath = () => {
    if (!profile) return '/login';
    switch (profile.role) {
      case 'super_admin':
      case 'admin':
        return '/admin';
      case 'priest':
        return '/priest';
      case 'service_leader':
        return '/service-leader';
      case 'servant':
        return '/servant';
      case 'membership':
        return '/membership';
      case 'board':
        return '/board';
      default:
        return '/login';
    }
  };

  const getRoleQuickAction = () => {
    if (!profile) return null;
    if (profile.role === 'servant') {
      return {
        label: 'تسجيل الغياب',
        icon: CheckSquare,
        to: '/servant/attendance'
      };
    }
    if (profile.role === 'service_leader') {
      return {
        label: 'بنك الدروس',
        icon: Sparkles,
        to: '/servant/lesson-bank'
      };
    }
    if (profile.role === 'priest') {
      return {
        label: 'الافتقاد',
        icon: MapPin,
        to: '/priest/visitation'
      };
    }
    return {
      label: 'الرئيسية',
      icon: Home,
      to: '/'
    };
  };

  const quickAction = getRoleQuickAction();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#00174a]/95 backdrop-blur-lg border-t border-[#d4af37]/40 shadow-2xl text-white select-none font-cairo"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
      dir="rtl"
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-0.5">
        
        {/* Tab 1: Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            path === '/' ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            path === '/' ? 'bg-[#d4af37]/20 shadow-xs' : ''
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
            path === '/' ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
          }`}>
            الرئيسية
          </span>
        </Link>

        {/* Tab 2: Readings / Synaxarium */}
        <Link
          to="/readings"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            path.startsWith('/readings') ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            path.startsWith('/readings') ? 'bg-[#d4af37]/20 shadow-xs' : ''
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
            path.startsWith('/readings') ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
          }`}>
            السنكسار
          </span>
        </Link>

        {/* Tab 3 (Center Action): Prayer Request */}
        <button
          onClick={onOpenPrayerModal}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-300 hover:text-[#fed65b] transition-all active:scale-90 group"
        >
          <div className="p-1 rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-md group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-extrabold text-[#fed65b] tracking-tight">
            طلب صلاة
          </span>
        </button>

        {/* Tab 4: Sermons or Quick Action */}
        {isDashboard && quickAction ? (
          <Link
            to={quickAction.to}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              path === quickAction.to ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              path === quickAction.to ? 'bg-[#d4af37]/20 shadow-xs' : ''
            }`}>
              <quickAction.icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              path === quickAction.to ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
            }`}>
              {quickAction.label}
            </span>
          </Link>
        ) : (
          <Link
            to="/sermons"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              path.startsWith('/sermons') ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              path.startsWith('/sermons') ? 'bg-[#d4af37]/20 shadow-xs' : ''
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              path.startsWith('/sermons') ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
            }`}>
              العظات
            </span>
          </Link>
        )}

        {/* Tab 5: User Dashboard / Login */}
        {profile ? (
          <Link
            to={getDashboardPath()}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              isDashboard ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isDashboard ? 'bg-[#d4af37]/20 shadow-xs' : ''
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              isDashboard ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
            }`}>
              لوحتي
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
              path === '/login' ? 'text-[#fed65b]' : 'text-slate-300 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              path === '/login' ? 'bg-[#d4af37]/20 shadow-xs' : ''
            }`}>
              <LogIn className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              path === '/login' ? 'text-[#fed65b] font-extrabold' : 'text-slate-300'
            }`}>
              دخول
            </span>
          </Link>
        )}

      </div>
    </nav>
  );
};

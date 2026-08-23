import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../lib/permissions';
import type { UserRole } from '../../lib/database.types';
import { Menu, ChevronRight, X } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (val: boolean) => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ 
  role, 
  isCollapsed = false, 
  setIsCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const location = useLocation();
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();

  const getLinks = () => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return [
          { label: 'نظرة عامة', path: '/admin', icon: 'dashboard' },
          { label: 'إدارة الأعضاء', path: '/admin/members', icon: 'group', permission: PERMISSIONS.MANAGE_MEMBERS },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'سجل الافتقاد', path: '/priest/member-visitation', icon: 'volunteer_activism', permission: PERMISSIONS.VIEW_MEMBER_VISITATIONS },
          { label: 'طلبات الصلاة والرسائل', path: '/admin/communications', icon: 'chat', permission: PERMISSIONS.VIEW_PRAYERS_AND_CONTACT },
          { label: 'ملاحظات العضوية', path: '/priest/comments', icon: 'rate_review', permission: PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS },
          { label: 'إدارة العظات', path: '/admin/content?tab=sermons', icon: 'settings_voice', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'إدارة الإعلانات', path: '/admin/content?tab=announcements', icon: 'campaign', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'البث المباشر', path: '/admin/content?tab=stream', icon: 'sensors', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'باني الصفحات', path: '/admin/site-builder', icon: 'design_services', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'إدارة الكهنة', path: '/admin/priests', icon: 'supervisor_account', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'جدول القداسات', path: '/priest/liturgies', icon: 'calendar_month', permission: PERMISSIONS.MANAGE_LITURGIES },
          { label: 'ألبومات الذاكرة', path: '/admin/albums', icon: 'images', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'الإشعارات الفورية', path: '/admin/notifications', icon: 'notifications_active' },
          { label: 'إعدادات المسؤول', path: '/admin/permissions', icon: 'admin_panel_settings', permission: PERMISSIONS.MANAGE_PERMISSIONS },
          { label: 'إدارة الآيات', path: '/admin/verses', icon: 'menu_book', permission: PERMISSIONS.MANAGE_VERSES },
        ];
      case 'priest':
        return [
          { label: 'نظرة عامة', path: '/priest', icon: 'dashboard' },
          { label: 'جدول القداسات', path: '/priest/liturgies', icon: 'calendar_month', permission: PERMISSIONS.MANAGE_LITURGIES },
          { label: 'إدارة العظات', path: '/priest/sermons', icon: 'settings_voice', permission: PERMISSIONS.MANAGE_PRIEST_SERMONS },
          { label: 'إدارة الإعلانات', path: '/priest/announcements', icon: 'campaign', permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
          { label: 'متابعة الخدمات', path: '/priest/services', icon: 'favorite', permission: PERMISSIONS.VIEW_SERVICES },
          { label: 'مراقبة الخدام', path: '/priest/monitoring', icon: 'shield', permission: PERMISSIONS.MONITOR_SERVANTS },
          { label: 'مسابقات تفاعلية', path: '/quiz', icon: 'sports_esports', permission: PERMISSIONS.MANAGE_QUIZZES },
          { label: 'العضوية والتعليقات', path: '/priest/comments', icon: 'people', permission: PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS },
        ];
      case 'servant':
        return [
          { label: 'نظرة عامة', path: '/servant', icon: 'dashboard' },
          { label: 'إدارة الأسر', path: '/servant/families', icon: 'family_restroom', permission: PERMISSIONS.MANAGE_FAMILIES },
          { label: 'سجل الافتقاد', path: '/servant/visitation', icon: 'volunteer_activism', permission: PERMISSIONS.MANAGE_VISITATION },
          { label: 'تفقد الحضور', path: '/servant/attendance', icon: 'checklist', permission: PERMISSIONS.MANAGE_ATTENDANCE },
          { label: 'طلبات الصلاة والرسائل', path: '/servant/communications', icon: 'chat', permission: PERMISSIONS.VIEW_PRAYERS_AND_CONTACT },
          { label: 'مسابقات تفاعلية', path: '/quiz', icon: 'sports_esports', permission: PERMISSIONS.MANAGE_QUIZZES },
          { label: 'أدوات الخادم', path: '/servant/tools', icon: 'build', permission: PERMISSIONS.MANAGE_SERVANT_TOOLS },
        ];
      case 'membership':
        return [
          { label: 'نظرة عامة', path: '/membership', icon: 'dashboard' },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'سجل الافتقاد', path: '/priest/member-visitation', icon: 'volunteer_activism', permission: PERMISSIONS.VIEW_MEMBER_VISITATIONS },
          { label: 'ملاحظات العضوية', path: '/priest/comments', icon: 'rate_review', permission: PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS }
        ];
      case 'board':
        return [
          { label: 'لوحة المجلس', path: '/board', icon: 'dashboard' },
          { label: 'الحسابات المالية', path: '/board/financials', icon: 'payments', permission: PERMISSIONS.VIEW_FINANCIALS },
          { label: 'خطط التنفيذ', path: '/board/projects', icon: 'layers', permission: PERMISSIONS.MANAGE_PROJECTS },
          { label: 'أجندة الاجتماعات', path: '/board/agenda', icon: 'event', permission: PERMISSIONS.MANAGE_MEETINGS },
        ];
      default:
        return [];
    }
  };

  const rawLinks = getLinks();
  const links = rawLinks.filter(link => !link.permission || hasPermission(link.permission));

  const handleLinkClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-[#00113a] h-screen fixed right-0 top-0 border-l border-[#c5c6d2]/20 shadow-2xl z-50 flex flex-col p-4 gap-2 transition-all duration-300 font-cairo
          ${/* Mobile drawer positioning */ ''}
          ${mobileOpen ? 'translate-x-0 w-72 max-w-[85vw]' : 'translate-x-full md:translate-x-0'}
          ${/* Desktop width */ ''}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
        dir="rtl"
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden absolute left-4 top-4 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Toggle Button */}
        {setIsCollapsed && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -left-3 top-6 w-6 h-6 bg-[#fed65b] rounded-full items-center justify-center shadow-md z-30 text-[#00113a] hover:scale-110 transition-transform"
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {isCollapsed ? <Menu className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Logo + Title */}
        <div className={`flex items-center gap-3.5 mb-3 mt-1 px-1 transition-all ${isCollapsed ? 'md:justify-center' : ''}`}>
          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#fed65b] to-[#d4af37] p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-[#00113a] flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#fed65b] text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                church
              </span>
            </div>
          </div>
          <div className={`overflow-hidden whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
            <h1 className="font-tajawal text-base font-bold text-white leading-tight">العذراء محرم بك</h1>
            <p className="font-cairo text-[10px] text-[#fed65b] opacity-90 font-semibold">المنصة الرقمية الموحدة</p>
          </div>
        </div>

        {/* User Profile Card (Sidebar User Info) */}
        {profile && (
          <div className={`mx-0.5 mb-3 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 overflow-hidden text-right ${isCollapsed ? 'md:hidden' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-[#fed65b] text-[#00113a] flex items-center justify-center font-bold text-sm shrink-0 shadow">
              {profile.full_name?.charAt(0) || 'م'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-tajawal text-xs font-bold text-white truncate leading-tight">
                {profile.full_name || 'مستخدم الكنيسة'}
              </h4>
              <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-[#fed65b]/20 text-[#fed65b] border border-[#fed65b]/35">
                {profile.role === 'super_admin' ? 'سوبر أدمن' :
                 profile.role === 'admin' ? 'أدمن النظام' :
                 profile.role === 'priest' ? 'الآب الكاهن' :
                 profile.role === 'servant' ? 'خادم الكنيسة' :
                 profile.role === 'board' ? 'عضو مجلس' : 'مسؤول العضوية'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto overflow-x-hidden mt-1 pr-0.5 pl-0.5 no-scrollbar">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`sidebar-item flex items-center shrink-0 h-11 transition-all duration-200 active:scale-95 font-cairo text-xs sm:text-sm rounded-xl
                  ${active ? 'bg-[#fed65b] text-[#00113a] font-bold shadow-md' : 'text-slate-300 hover:bg-white/10'}
                  ${isCollapsed ? 'md:justify-center md:w-11 md:mx-auto px-4 gap-3' : 'px-4 gap-3'}`
                }
                title={isCollapsed ? link.label : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? 'filled text-[#00113a]' : 'text-slate-300'}`}>
                  {link.icon || 'link'}
                </span>
                <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Return Button */}
        <div className={`pt-3 border-t border-white/10 flex transition-all ${isCollapsed ? 'md:justify-center' : ''}`}>
          <Link
            to="/"
            onClick={handleLinkClick}
            className={`flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all border border-white/5 hover:border-[#fed65b]/20 font-cairo h-11 shrink-0
              ${isCollapsed ? 'md:w-11 w-full' : 'w-full'}`}
            title={isCollapsed ? 'العودة للموقع الرئيسي' : undefined}
          >
            <span className="material-symbols-outlined text-[#fed65b] text-[20px]">logout</span>
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>العودة للموقع الرئيسي</span>
          </Link>
        </div>
      </aside>
    </>
  );
};


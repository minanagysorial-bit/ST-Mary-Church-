import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../lib/permissions';
import type { UserRole } from '../../lib/database.types';
import { Menu, ChevronRight, X, LogOut, Home, ExternalLink } from 'lucide-react';

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
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { hasPermission } = usePermissions();

  const handleSignOut = async () => {
    try {
      await signOut();
      if (setMobileOpen) setMobileOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const getLinks = () => {
    switch (role) {
      case 'super_admin':
        return [
          { label: 'نظرة عامة', path: '/admin', icon: 'dashboard' },
          { label: 'إعدادات وصلاحيات المستخدمين', path: '/admin/permissions', icon: 'admin_panel_settings', permission: PERMISSIONS.MANAGE_PERMISSIONS },
          { label: 'تعيين كهنة وأمناء الخدمات', path: '/admin/services', icon: 'shield_person', permission: PERMISSIONS.MANAGE_PERMISSIONS },
          { label: 'إدارة الأعضاء والخدام', path: '/admin/members', icon: 'badge', permission: PERMISSIONS.MANAGE_MEMBERS },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'فصول وأسر الخدمات', path: '/service-leader/families', icon: 'family_restroom', permission: PERMISSIONS.MANAGE_SERVICES },
          { label: 'إدارة الخدمات وتوزيع الخدام', path: '/service-leader', icon: 'diversity_3', permission: PERMISSIONS.MANAGE_SERVICES },
          { label: 'جدول القداسات', path: '/priest/liturgies', icon: 'calendar_month', permission: PERMISSIONS.MANAGE_LITURGIES },
          { label: 'إدارة الإعلانات', path: '/admin/content?tab=announcements', icon: 'campaign', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'إدارة الآيات', path: '/admin/verses', icon: 'menu_book', permission: PERMISSIONS.MANAGE_VERSES },
          { label: 'الإشعارات الفورية', path: '/admin/notifications', icon: 'notifications_active', permission: PERMISSIONS.MANAGE_NOTIFICATIONS },
          { label: 'طلبات الصلاة والرسائل', path: '/admin/communications', icon: 'chat', permission: PERMISSIONS.VIEW_PRAYERS_AND_CONTACT },
          { label: 'سجل الافتقاد', path: '/priest/member-visitation', icon: 'volunteer_activism', permission: PERMISSIONS.VIEW_MEMBER_VISITATIONS },
          { label: 'إدارة الكهنة', path: '/admin/priests', icon: 'supervisor_account', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'إدارة العظات', path: '/admin/content?tab=sermons', icon: 'settings_voice', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'مناهج التربية الكنسية ودرايف', path: '/admin/curriculums', icon: 'menu_book', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'باني الصفحات', path: '/admin/site-builder', icon: 'design_services', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'ألبومات الذاكرة', path: '/admin/albums', icon: 'images', permission: PERMISSIONS.MANAGE_CONTENT },
        ];

      case 'admin':
        return [
          { label: 'نظرة عامة', path: '/admin', icon: 'dashboard' },
          { label: 'جدول القداسات', path: '/priest/liturgies', icon: 'calendar_month', permission: PERMISSIONS.MANAGE_LITURGIES },
          { label: 'إدارة الآيات اليومية', path: '/admin/verses', icon: 'menu_book', permission: PERMISSIONS.MANAGE_VERSES },
          { label: 'الإشعارات الفورية', path: '/admin/notifications', icon: 'notifications_active', permission: PERMISSIONS.MANAGE_NOTIFICATIONS },
          { label: 'إدارة الإعلانات', path: '/admin/content?tab=announcements', icon: 'campaign', permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'مناهج التربية الكنسية ودرايف', path: '/admin/curriculums', icon: 'menu_book', permission: PERMISSIONS.MANAGE_CONTENT },
          { label: 'طلبات الصلاة والرسائل', path: '/admin/communications', icon: 'chat', permission: PERMISSIONS.VIEW_PRAYERS_AND_CONTACT },
        ];

      case 'priest':
        return [
          { label: 'لوحة التحكم الرعوية', path: '/priest', icon: 'dashboard' },
          { label: 'طلبات الصلاة والرسائل', path: '/admin/communications', icon: 'chat', permission: PERMISSIONS.VIEW_PRAYERS_AND_CONTACT },
          { label: 'سجل الافتقاد ومتابعة الحالات', path: '/priest/member-visitation', icon: 'volunteer_activism', permission: PERMISSIONS.VIEW_MEMBER_VISITATIONS },
          { label: 'متابعة الخدمات وفصول الأسر', path: '/priest/services', icon: 'diversity_3', permission: PERMISSIONS.VIEW_SERVICES },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'إدارة الإعلانات', path: '/priest/announcements', icon: 'campaign', permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
          { label: 'جدول القداسات', path: '/priest/liturgies', icon: 'calendar_month', permission: PERMISSIONS.MANAGE_LITURGIES },
          { label: 'إدارة العظات', path: '/priest/sermons', icon: 'settings_voice', permission: PERMISSIONS.MANAGE_PRIEST_SERMONS },
          { label: 'ملاحظات العضوية', path: '/priest/comments', icon: 'rate_review', permission: PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS },
        ];

      case 'service_leader':
        return [
          { label: 'لوحة أمين الخدمة', path: '/service-leader', icon: 'dashboard' },
          { label: 'فصول وأسر التربية الكنسية', path: '/service-leader/families', icon: 'family_restroom', permission: PERMISSIONS.CREATE_FAMILIES },
          { label: 'تعيين وتوزيع الخدام', path: '/service-leader/servants', icon: 'badge', permission: PERMISSIONS.ASSIGN_SERVANTS },
          { label: 'تفقد الحضور والغياب', path: '/servant/attendance', icon: 'checklist', permission: PERMISSIONS.MANAGE_ATTENDANCE },
          { label: 'مناهج التربية الكنسية ودرايف 📚', path: '/admin/curriculums', icon: 'menu_book' },
          { label: 'بنك تحضير الدروس 📖', path: '/servant/lesson-bank', icon: 'menu_book' },
          { label: 'نقاط مدارس الأحد 🌟', path: '/servant/points', icon: 'stars' },
          { label: 'لوحة الشرف والأبطال 🏆', path: '/leaderboard', icon: 'military_tech' },
          { label: 'سجل الافتقاد', path: '/servant/visitations', icon: 'volunteer_activism', permission: PERMISSIONS.MANAGE_VISITATION },
          { label: 'خريطة الافتقاد 🗺️', path: '/servant/visitation-map', icon: 'map' },
          { label: 'مسابقات تفاعلية', path: '/quiz', icon: 'sports_esports', permission: PERMISSIONS.MANAGE_QUIZZES },
          { label: 'أدوات الخادم', path: '/servant/tools', icon: 'build', permission: PERMISSIONS.MANAGE_SERVANT_TOOLS },
        ];

      case 'servant':
        return [
          { label: 'نظرة عامة', path: '/servant', icon: 'dashboard' },
          { label: 'أسرتي وفصلي ومخدومي', path: '/servant/families', icon: 'family_restroom', permission: PERMISSIONS.MANAGE_FAMILIES },
          { label: 'بنك تحضير الدروس 📖', path: '/servant/lesson-bank', icon: 'menu_book' },
          { label: 'نقاط مدارس الأحد 🌟', path: '/servant/points', icon: 'stars' },
          { label: 'لوحة الشرف والأبطال 🏆', path: '/leaderboard', icon: 'military_tech' },
          { label: 'تفقد الحضور', path: '/servant/attendance', icon: 'checklist', permission: PERMISSIONS.MANAGE_ATTENDANCE },
          { label: 'سجل الافتقاد', path: '/servant/visitations', icon: 'volunteer_activism', permission: PERMISSIONS.MANAGE_VISITATION },
          { label: 'خريطة الافتقاد 🗺️', path: '/servant/visitation-map', icon: 'map' },
          { label: 'مسابقات تفاعلية', path: '/quiz', icon: 'sports_esports', permission: PERMISSIONS.MANAGE_QUIZZES },
          { label: 'أدوات الخادم', path: '/servant/tools', icon: 'build', permission: PERMISSIONS.MANAGE_SERVANT_TOOLS },
        ];

      case 'membership':
        return [
          { label: 'نظرة عامة', path: '/membership', icon: 'dashboard' },
          { label: 'شعب الكنيسة', path: '/membership/members', icon: 'group', permission: PERMISSIONS.MANAGE_CHURCH_MEMBERS },
          { label: 'طلبات العضوية', path: '/priest/membership-requests', icon: 'app_registration', permission: PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS },
          { label: 'سجل الافتقاد الكنسي', path: '/priest/member-visitation', icon: 'volunteer_activism', permission: PERMISSIONS.VIEW_MEMBER_VISITATIONS },
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

        {/* Brand / Role Header */}
        <div className="flex items-center gap-3 px-2 py-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#aa8c2c] flex items-center justify-center shadow-lg shadow-[#d4af37]/20 flex-shrink-0">
            <span className="material-symbols-outlined text-[#00113a] text-xl font-bold">church</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="font-tajawal text-white font-extrabold text-sm tracking-wide truncate">
                {role === 'super_admin' && 'لوحة السوبر أدمن'}
                {role === 'admin' && 'لوحة الإدارة'}
                {role === 'priest' && 'لوحة الأب الكاهن'}
                {role === 'service_leader' && 'لوحة أمين الخدمة'}
                {role === 'servant' && 'لوحة الخادم'}
                {role === 'membership' && 'مسؤول العضوية'}
                {role === 'board' && 'مجلس الكنيسة'}
              </h2>
              <p className="text-[#fed65b] text-[11px] font-bold truncate">
                {profile?.full_name || 'كنيسة السيدة العذراء'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links with custom golden scrollbar */}
        <nav className="flex-1 overflow-y-auto space-y-1.5 py-4 dashboard-sidebar-scroll">
          {links.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/admin' && link.path !== '/priest' && link.path !== '/servant' && link.path !== '/service-leader' && link.path !== '/membership' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path + link.label}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-xs font-bold ${
                  isActive
                    ? 'bg-[#fed65b] text-[#00113a] shadow-lg shadow-[#fed65b]/20 font-extrabold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={isCollapsed ? link.label : undefined}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'text-[#00113a]' : 'text-[#fed65b] group-hover:scale-110 transition-transform'}`}>
                  {link.icon}
                </span>
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions: View Site & Log Out */}
        <div className="pt-3 border-t border-white/10 space-y-1.5">
          {/* Link to public homepage */}
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs font-bold group"
            title={isCollapsed ? "العودة للموقع الرئيسي" : undefined}
          >
            <Home className="w-4 h-4 text-[#fed65b] group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && <span className="truncate">العودة للموقع الرئيسي</span>}
          </Link>

          {/* Direct Red Logout Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition-all text-xs font-bold group border border-rose-500/20 active:scale-95"
            title={isCollapsed ? "تسجيل الخروج من النظام" : undefined}
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && <span className="truncate font-extrabold">تسجيل الخروج</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          <div className="hidden md:block pt-1">
            <button
              onClick={() => setIsCollapsed && setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

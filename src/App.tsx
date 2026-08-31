import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PrayerModal } from './components/common/PrayerModal';
import { SermonVideoModal } from './components/sermons/SermonVideoModal';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { NotificationPermissionModal } from './components/common/NotificationPermissionModal';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import type { Sermon, UserRole } from './lib/api';
import { PERMISSIONS } from './lib/permissions';

// Public Core Pages (Eagerly loaded for instant load)
import { HomePage } from './pages/HomePage';
import { SermonsPage } from './pages/SermonsPage';
import { SermonDetailPage } from './pages/SermonDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { HistoryPage } from './pages/about/HistoryPage';
import { PriestsPage } from './pages/about/PriestsPage';
import { MemoryPage } from './pages/about/MemoryPage';
import { LiveStreamPage } from './pages/LiveStreamPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { LiturgiesSchedulePage } from './pages/LiturgiesSchedulePage';
import { ReadingsPage } from './pages/ReadingsPage';
import { MembershipRegistrationPage } from './pages/MembershipRegistrationPage';

// Admin Dashboards (Lazy Loaded for Speed & Code Splitting)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const SermonManagementPage = lazy(() => import('./pages/admin/SermonManagementPage').then(m => ({ default: m.SermonManagementPage })));
const MembersManagementPage = lazy(() => import('./pages/admin/MembersManagementPage').then(m => ({ default: m.MembersManagementPage })));
const ContentManagementPage = lazy(() => import('./pages/admin/ContentManagementPage').then(m => ({ default: m.ContentManagementPage })));
const PermissionsPage = lazy(() => import('./pages/super-admin/PermissionsPage').then(m => ({ default: m.PermissionsPage })));
const VersesManagementPage = lazy(() => import('./pages/admin/VersesManagementPage').then(m => ({ default: m.VersesManagementPage })));
const AlbumsManagementPage = lazy(() => import('./pages/admin/AlbumsManagementPage').then(m => ({ default: m.AlbumsManagementPage })));
const PriestsManagementPage = lazy(() => import('./pages/admin/PriestsManagementPage').then(m => ({ default: m.PriestsManagementPage })));
const SiteBuilderPage = lazy(() => import('./pages/super-admin/SiteBuilderPage').then(m => ({ default: m.SiteBuilderPage })));
const ServicesAssignmentPage = lazy(() => import('./pages/super-admin/ServicesAssignmentPage').then(m => ({ default: m.ServicesAssignmentPage })));
const CommunicationsPage = lazy(() => import('./pages/admin/CommunicationsPage').then(m => ({ default: m.CommunicationsPage })));
const PushNotificationsPage = lazy(() => import('./pages/admin/PushNotificationsPage').then(m => ({ default: m.PushNotificationsPage })));
const CurriculumManagementPage = lazy(() => import('./pages/super-admin/CurriculumManagementPage').then(m => ({ default: m.CurriculumManagementPage })));
const DynamicPage = lazy(() => import('./pages/DynamicPage').then(m => ({ default: m.DynamicPage })));

// Priest Dashboards (Lazy Loaded)
const PriestDashboardPage = lazy(() => import('./pages/priest/PriestDashboardPage').then(m => ({ default: m.PriestDashboardPage })));
const PriestLiturgiesPage = lazy(() => import('./pages/priest/PriestLiturgiesPage').then(m => ({ default: m.PriestLiturgiesPage })));
const PriestSermonPage = lazy(() => import('./pages/priest/PriestSermonPage').then(m => ({ default: m.PriestSermonPage })));
const PriestAnnouncementsPage = lazy(() => import('./pages/priest/PriestAnnouncementsPage').then(m => ({ default: m.PriestAnnouncementsPage })));
const ServicesFamiliesPage = lazy(() => import('./pages/priest/ServicesFamiliesPage').then(m => ({ default: m.ServicesFamiliesPage })));
const PriestMonitoringPage = lazy(() => import('./pages/priest/PriestMonitoringPage').then(m => ({ default: m.PriestMonitoringPage })));
const MembershipCommentsPage = lazy(() => import('./pages/priest/MembershipCommentsPage').then(m => ({ default: m.MembershipCommentsPage })));
const MembershipRequestsPage = lazy(() => import('./pages/priest/MembershipRequestsPage').then(m => ({ default: m.MembershipRequestsPage })));
const MemberVisitationPage = lazy(() => import('./pages/priest/MemberVisitationPage').then(m => ({ default: m.MemberVisitationPage })));

// Membership Dashboard and Registry (Lazy Loaded)
const MembershipDashboardPage = lazy(() => import('./pages/membership/MembershipDashboardPage').then(m => ({ default: m.MembershipDashboardPage })));
const ChurchMembersPage = lazy(() => import('./pages/membership/ChurchMembersPage').then(m => ({ default: m.ChurchMembersPage })));

// Service Leader Dashboards (Lazy Loaded)
const ServiceLeaderDashboardPage = lazy(() => import('./pages/service-leader/ServiceLeaderDashboardPage').then(m => ({ default: m.ServiceLeaderDashboardPage })));
const ServiceFamiliesManagementPage = lazy(() => import('./pages/service-leader/ServiceFamiliesManagementPage').then(m => ({ default: m.ServiceFamiliesManagementPage })));

// Servant Dashboards (Lazy Loaded)
const ServantDashboardPage = lazy(() => import('./pages/servant/ServantDashboardPage').then(m => ({ default: m.ServantDashboardPage })));
const FamilyManagementPage = lazy(() => import('./pages/servant/FamilyManagementPage').then(m => ({ default: m.FamilyManagementPage })));
const VisitationPage = lazy(() => import('./pages/servant/VisitationPage').then(m => ({ default: m.VisitationPage })));
const AttendancePage = lazy(() => import('./pages/servant/AttendancePage').then(m => ({ default: m.AttendancePage })));
const ServantToolsPage = lazy(() => import('./pages/servant/ServantToolsPage').then(m => ({ default: m.ServantToolsPage })));
const SundaySchoolPointsPage = lazy(() => import('./pages/servant/SundaySchoolPointsPage').then(m => ({ default: m.SundaySchoolPointsPage })));
const SmartVisitationMapPage = lazy(() => import('./pages/servant/SmartVisitationMapPage').then(m => ({ default: m.SmartVisitationMapPage })));
const LessonBankPage = lazy(() => import('./pages/servant/LessonBankPage').then(m => ({ default: m.LessonBankPage })));

// Board Dashboards (Lazy Loaded)
const BoardDashboardPage = lazy(() => import('./pages/board/BoardDashboardPage').then(m => ({ default: m.BoardDashboardPage })));
const FinancialAccountsPage = lazy(() => import('./pages/board/FinancialAccountsPage').then(m => ({ default: m.FinancialAccountsPage })));
const ImplementationPlansPage = lazy(() => import('./pages/board/ImplementationPlansPage').then(m => ({ default: m.ImplementationPlansPage })));
const MeetingAgendaPage = lazy(() => import('./pages/board/MeetingAgendaPage').then(m => ({ default: m.MeetingAgendaPage })));

// Kahoot Gamification Quizzes (Lazy Loaded)
const QuizListPage = lazy(() => import('./pages/quiz/QuizListPage').then(m => ({ default: m.QuizListPage })));
const QuizHostPage = lazy(() => import('./pages/quiz/QuizHostPage').then(m => ({ default: m.QuizHostPage })));
const QuizPlayerPage = lazy(() => import('./pages/quiz/QuizPlayerPage').then(m => ({ default: m.QuizPlayerPage })));

// Honor Board / Leaderboard (Lazy Loaded)
const HonorBoardPage = lazy(() => import('./pages/public/HonorBoardPage').then(m => ({ default: m.HonorBoardPage })));

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: UserRole[];
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
  const { session, profile, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9]" dir="rtl">
        <div className="text-center space-y-3 font-cairo">
          <div className="w-12 h-12 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-[#002366] font-bold">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Security gate: block test/hacker accounts
  const emailLower = (profile.email || '').toLowerCase();
  if (
    emailLower.includes('hacker') ||
    emailLower.includes('fakeadmin') ||
    emailLower.includes('@test.com') ||
    (profile.role as string) === 'pending' ||
    (profile.role as string) === 'unauthorized'
  ) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = profile?.role === 'super_admin';
  if (!allowedRoles.includes(profile.role) && !isSuperAdmin) {
    const userRole = profile?.role;
    switch (userRole) {
      case 'priest':
        return <Navigate to="/priest" replace />;
      case 'service_leader':
        return <Navigate to="/service-leader" replace />;
      case 'board':
        return <Navigate to="/board" replace />;
      case 'servant':
        return <Navigate to="/servant" replace />;
      case 'membership':
        return <Navigate to="/membership" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    const userRole = profile.role;
    switch (userRole) {
      case 'priest':
        return <Navigate to="/priest" replace />;
      case 'board':
        return <Navigate to="/board" replace />;
      case 'servant':
        return <Navigate to="/servant" replace />;
      case 'membership':
        return <Navigate to="/membership" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

const LoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#fcfbf9]" dir="rtl">
    <div className="text-center space-y-3 font-cairo">
      <div className="w-10 h-10 border-4 border-[#002366] border-t-[#d4af37] rounded-full animate-spin mx-auto"></div>
      <p className="text-xs text-slate-500 font-bold">جاري تحميل الصفحة...</p>
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [modalSermon, setModalSermon] = useState<Sermon | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setBackgroundColor({ color: '#00174a' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      SplashScreen.hide().catch(() => {});
    }
  }, []);

  const isDashboard =
    (location.pathname.startsWith('/admin') ||
     location.pathname.startsWith('/priest') ||
     location.pathname.startsWith('/servant') ||
     location.pathname.startsWith('/board') ||
     location.pathname.startsWith('/membership')) &&
    location.pathname !== '/membership/register';

  const isStandaloneApp =
    location.pathname.startsWith('/leaderboard') ||
    location.pathname.startsWith('/honor-board') ||
    location.pathname.startsWith('/quiz/play');

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f8] text-[#1b1c1c] font-cairo">
      {!isDashboard && !isStandaloneApp && <Navbar onOpenPrayerModal={() => setIsPrayerModalOpen(true)} />}

      <div className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<HomePage onOpenPrayerModal={() => setIsPrayerModalOpen(true)} />} />
            <Route path="/readings" element={<ReadingsPage onOpenPrayerModal={() => setIsPrayerModalOpen(true)} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/about/history" element={<HistoryPage />} />
            <Route path="/about/priests" element={<PriestsPage />} />
            <Route path="/about/memory" element={<MemoryPage />} />
            <Route path="/sermons" element={<SermonsPage onSelectSermonForModal={(s) => setModalSermon(s)} />} />
            <Route path="/sermons/:id" element={<SermonDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/membership/register" element={<MembershipRegistrationPage />} />
            <Route path="/live" element={<LiveStreamPage />} />
            <Route path="/live-stream" element={<LiveStreamPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/contact-us" element={<ContactUsPage />} />
            <Route path="/schedule" element={<LiturgiesSchedulePage />} />
            <Route path="/liturgies-schedule" element={<LiturgiesSchedulePage />} />
            <Route path="/pages/*" element={<DynamicPage />} />

            {/* Membership Clerk Routes */}
            <Route path="/membership" element={<ProtectedRoute allowedRoles={['membership', 'super_admin', 'admin']}><MembershipDashboardPage /></ProtectedRoute>} />
            <Route path="/membership/members" element={<ProtectedRoute allowedRoles={['membership', 'super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CHURCH_MEMBERS}><ChurchMembersPage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/sermons" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_SERMONS}><SermonManagementPage /></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_MEMBERS}><MembersManagementPage /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><ContentManagementPage /></ProtectedRoute>} />
            <Route path="/admin/permissions" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_PERMISSIONS}><PermissionsPage /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_PERMISSIONS}><ServicesAssignmentPage /></ProtectedRoute>} />
            <Route path="/admin/verses" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_VERSES}><VersesManagementPage /></ProtectedRoute>} />
            <Route path="/admin/albums" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AlbumsManagementPage /></ProtectedRoute>} />
            <Route path="/admin/priests" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><PriestsManagementPage /></ProtectedRoute>} />
            <Route path="/admin/site-builder" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><SiteBuilderPage /></ProtectedRoute>} />
            <Route path="/admin/communications" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><CommunicationsPage /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><PushNotificationsPage /></ProtectedRoute>} />
            <Route path="/admin/curriculums" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'service_leader']}><CurriculumManagementPage /></ProtectedRoute>} />

            {/* Priest Routes */}
            <Route path="/priest" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><PriestDashboardPage /></ProtectedRoute>} />
            <Route path="/priest/liturgies" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><PriestLiturgiesPage /></ProtectedRoute>} />
            <Route path="/priest/sermons" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><PriestSermonPage /></ProtectedRoute>} />
            <Route path="/priest/announcements" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><PriestAnnouncementsPage /></ProtectedRoute>} />
            <Route path="/priest/services" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><ServicesFamiliesPage /></ProtectedRoute>} />
            <Route path="/priest/services-families" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><ServicesFamiliesPage /></ProtectedRoute>} />
            <Route path="/priest/monitoring" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin']}><PriestMonitoringPage /></ProtectedRoute>} />
            <Route path="/priest/membership-requests" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin', 'membership']}><MembershipRequestsPage /></ProtectedRoute>} />
            <Route path="/priest/membership-comments" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin', 'membership']}><MembershipCommentsPage /></ProtectedRoute>} />
            <Route path="/priest/comments" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin', 'membership']}><MembershipCommentsPage /></ProtectedRoute>} />
            <Route path="/priest/member-visitation" element={<ProtectedRoute allowedRoles={['priest', 'super_admin', 'admin', 'membership']}><MemberVisitationPage /></ProtectedRoute>} />

            {/* Service Leader Routes */}
            <Route path="/service-leader" element={<ProtectedRoute allowedRoles={['service_leader', 'super_admin', 'admin', 'priest']}><ServiceLeaderDashboardPage /></ProtectedRoute>} />
            <Route path="/service-leader/families" element={<ProtectedRoute allowedRoles={['service_leader', 'super_admin', 'admin', 'priest']}><ServiceFamiliesManagementPage /></ProtectedRoute>} />
            <Route path="/service-leader/servants" element={<ProtectedRoute allowedRoles={['service_leader', 'super_admin', 'admin', 'priest']}><ServiceFamiliesManagementPage /></ProtectedRoute>} />

            {/* Servant Routes */}
            <Route path="/servant" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><ServantDashboardPage /></ProtectedRoute>} />
            <Route path="/servant/families" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><FamilyManagementPage /></ProtectedRoute>} />
            <Route path="/servant/visitations" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><VisitationPage /></ProtectedRoute>} />
            <Route path="/servant/attendance" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><AttendancePage /></ProtectedRoute>} />
            <Route path="/servant/tools" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><ServantToolsPage /></ProtectedRoute>} />
            <Route path="/servant/points" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><SundaySchoolPointsPage /></ProtectedRoute>} />
            <Route path="/servant/sunday-school" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin']}><SundaySchoolPointsPage /></ProtectedRoute>} />
            <Route path="/servant/visitation-map" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin', 'service_leader', 'priest']}><SmartVisitationMapPage /></ProtectedRoute>} />
            <Route path="/servant/map" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin', 'service_leader', 'priest']}><SmartVisitationMapPage /></ProtectedRoute>} />
            <Route path="/servant/lesson-bank" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin', 'service_leader', 'priest']}><LessonBankPage /></ProtectedRoute>} />
            <Route path="/servant/lessons" element={<ProtectedRoute allowedRoles={['servant', 'super_admin', 'admin', 'service_leader', 'priest']}><LessonBankPage /></ProtectedRoute>} />

            {/* Board Routes */}
            <Route path="/board" element={<ProtectedRoute allowedRoles={['board', 'super_admin', 'admin']}><BoardDashboardPage /></ProtectedRoute>} />
            <Route path="/board/accounts" element={<ProtectedRoute allowedRoles={['board', 'super_admin', 'admin']}><FinancialAccountsPage /></ProtectedRoute>} />
            <Route path="/board/plans" element={<ProtectedRoute allowedRoles={['board', 'super_admin', 'admin']}><ImplementationPlansPage /></ProtectedRoute>} />
            <Route path="/board/agenda" element={<ProtectedRoute allowedRoles={['board', 'super_admin', 'admin']}><MeetingAgendaPage /></ProtectedRoute>} />

            {/* Public Honor Board & Leaderboard */}
            <Route path="/leaderboard" element={<HonorBoardPage />} />
            <Route path="/honor-board" element={<HonorBoardPage />} />

            {/* Kahoot Quizzes */}
            <Route path="/quiz" element={<QuizListPage />} />
            <Route path="/quiz/host/:id" element={<QuizHostPage />} />
            <Route path="/quiz/play/:id" element={<QuizPlayerPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {!isDashboard && !isStandaloneApp && <Footer />}

      {/* Native Mobile Bottom Navigation Bar */}
      {!isStandaloneApp && <MobileBottomNav onOpenPrayerModal={() => setIsPrayerModalOpen(true)} />}

      {/* Floating PWA Installation Prompt on Mobile */}
      <PWAInstallPrompt />

      {/* Interactive Push Notification & App Enablement Modal */}
      <NotificationPermissionModal />

      {/* Global Prayer Requests Modal */}
      <PrayerModal isOpen={isPrayerModalOpen} onClose={() => setIsPrayerModalOpen(false)} />

      {/* Global Sermon Video Modal */}
      {modalSermon && (
        <SermonVideoModal
          sermon={modalSermon}
          onClose={() => setModalSermon(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppLayout />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

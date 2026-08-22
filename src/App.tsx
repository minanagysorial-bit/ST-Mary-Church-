import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { PrayerModal } from './components/common/PrayerModal';
import { SermonVideoModal } from './components/sermons/SermonVideoModal';
import type { Sermon } from './lib/api';

// Pages
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

// Admin Dashboards
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SermonManagementPage } from './pages/admin/SermonManagementPage';
import { MembersManagementPage } from './pages/admin/MembersManagementPage';
import { ContentManagementPage } from './pages/admin/ContentManagementPage';
import { PermissionsPage } from './pages/super-admin/PermissionsPage';
import { VersesManagementPage } from './pages/admin/VersesManagementPage';
import { AlbumsManagementPage } from './pages/admin/AlbumsManagementPage';
import { PriestsManagementPage } from './pages/admin/PriestsManagementPage';
import { SiteBuilderPage } from './pages/super-admin/SiteBuilderPage';
import { CommunicationsPage } from './pages/admin/CommunicationsPage';
import { DynamicPage } from './pages/DynamicPage';
import { PERMISSIONS } from './lib/permissions';

// Priest Dashboards
import { PriestDashboardPage } from './pages/priest/PriestDashboardPage';
import { PriestLiturgiesPage } from './pages/priest/PriestLiturgiesPage';
import { PriestSermonPage } from './pages/priest/PriestSermonPage';
import { PriestAnnouncementsPage } from './pages/priest/PriestAnnouncementsPage';
import { ServicesFamiliesPage } from './pages/priest/ServicesFamiliesPage';
import { PriestMonitoringPage } from './pages/priest/PriestMonitoringPage';
import { MembershipCommentsPage } from './pages/priest/MembershipCommentsPage';
import { MembershipRequestsPage } from './pages/priest/MembershipRequestsPage';
import { MemberVisitationPage } from './pages/priest/MemberVisitationPage';

// Membership Dashboard and Registry
import { MembershipRegistrationPage } from './pages/MembershipRegistrationPage';
import { MembershipDashboardPage } from './pages/membership/MembershipDashboardPage';
import { ChurchMembersPage } from './pages/membership/ChurchMembersPage';

// Servant Dashboards
import { ServantDashboardPage } from './pages/servant/ServantDashboardPage';
import { FamilyManagementPage } from './pages/servant/FamilyManagementPage';
import { VisitationPage } from './pages/servant/VisitationPage';
import { AttendancePage } from './pages/servant/AttendancePage';
import { ServantToolsPage } from './pages/servant/ServantToolsPage';

// Board Dashboards
import { BoardDashboardPage } from './pages/board/BoardDashboardPage';
import { FinancialAccountsPage } from './pages/board/FinancialAccountsPage';
import { ImplementationPlansPage } from './pages/board/ImplementationPlansPage';
import { MeetingAgendaPage } from './pages/board/MeetingAgendaPage';

// Kahoot Gamification Quizzes
import { QuizListPage } from './pages/quiz/QuizListPage';
import { QuizHostPage } from './pages/quiz/QuizHostPage';
import { QuizPlayerPage } from './pages/quiz/QuizPlayerPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: ('super_admin' | 'admin' | 'priest' | 'servant' | 'board' | 'membership')[];
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

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isSystemAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  if (!profile || (!allowedRoles.includes(profile.role) && !isSystemAdmin)) {
    const userRole = profile?.role;
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
        return <Navigate to="/" replace />;
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
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

const AppLayout: React.FC = () => {
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [modalSermon, setModalSermon] = useState<Sermon | null>(null);
  const location = useLocation();

  const isDashboard =
    (location.pathname.startsWith('/admin') ||
     location.pathname.startsWith('/priest') ||
     location.pathname.startsWith('/servant') ||
     location.pathname.startsWith('/board') ||
     location.pathname.startsWith('/membership')) &&
    location.pathname !== '/membership/register';

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f8] text-[#1b1c1c] font-cairo">
      {!isDashboard && <Navbar onOpenPrayerModal={() => setIsPrayerModalOpen(true)} />}

      <div className="flex-1">
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

          {/* Admin Routes (Only visible to admin / super_admin) */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/sermons" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_SERMONS}><SermonManagementPage /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_MEMBERS}><MembersManagementPage /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><ContentManagementPage /></ProtectedRoute>} />
          <Route path="/admin/permissions" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_PERMISSIONS}><PermissionsPage /></ProtectedRoute>} />
          <Route path="/admin/verses" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_VERSES}><VersesManagementPage /></ProtectedRoute>} />
          <Route path="/admin/albums" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><AlbumsManagementPage /></ProtectedRoute>} />
          <Route path="/admin/site-builder" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><SiteBuilderPage /></ProtectedRoute>} />
          <Route path="/admin/priests" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_CONTENT}><PriestsManagementPage /></ProtectedRoute>} />
          <Route path="/admin/communications" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredPermission={PERMISSIONS.VIEW_PRAYERS_AND_CONTACT}><CommunicationsPage /></ProtectedRoute>} />

          {/* Priest Routes (Only visible to priest) */}
          <Route path="/priest" element={<ProtectedRoute allowedRoles={['priest']}><PriestDashboardPage /></ProtectedRoute>} />
          <Route path="/priest/liturgies" element={<ProtectedRoute allowedRoles={['priest']} requiredPermission={PERMISSIONS.MANAGE_LITURGIES}><PriestLiturgiesPage /></ProtectedRoute>} />
          <Route path="/priest/sermons" element={<ProtectedRoute allowedRoles={['priest']} requiredPermission={PERMISSIONS.MANAGE_PRIEST_SERMONS}><PriestSermonPage /></ProtectedRoute>} />
          <Route path="/priest/announcements" element={<ProtectedRoute allowedRoles={['priest']} requiredPermission={PERMISSIONS.MANAGE_ANNOUNCEMENTS}><PriestAnnouncementsPage /></ProtectedRoute>} />
          <Route path="/priest/services" element={<ProtectedRoute allowedRoles={['priest']} requiredPermission={PERMISSIONS.VIEW_SERVICES}><ServicesFamiliesPage /></ProtectedRoute>} />
          <Route path="/priest/monitoring" element={<ProtectedRoute allowedRoles={['priest']} requiredPermission={PERMISSIONS.MONITOR_SERVANTS}><PriestMonitoringPage /></ProtectedRoute>} />
          <Route path="/priest/comments" element={<ProtectedRoute allowedRoles={['priest', 'membership', 'super_admin', 'admin']} requiredPermission={PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS}><MembershipCommentsPage /></ProtectedRoute>} />
          <Route path="/priest/membership-requests" element={<ProtectedRoute allowedRoles={['priest', 'membership', 'super_admin', 'admin']} requiredPermission={PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS}><MembershipRequestsPage /></ProtectedRoute>} />
          <Route path="/priest/member-visitation" element={<ProtectedRoute allowedRoles={['priest', 'membership', 'super_admin', 'admin']} requiredPermission={PERMISSIONS.VIEW_MEMBER_VISITATIONS}><MemberVisitationPage /></ProtectedRoute>} />

          {/* Servant Routes (Only visible to servant) */}
          <Route path="/servant" element={<ProtectedRoute allowedRoles={['servant']}><ServantDashboardPage /></ProtectedRoute>} />
          <Route path="/servant/families" element={<ProtectedRoute allowedRoles={['servant']} requiredPermission={PERMISSIONS.MANAGE_FAMILIES}><FamilyManagementPage /></ProtectedRoute>} />
          <Route path="/servant/visitation" element={<ProtectedRoute allowedRoles={['servant']} requiredPermission={PERMISSIONS.MANAGE_VISITATION}><VisitationPage /></ProtectedRoute>} />
          <Route path="/servant/attendance" element={<ProtectedRoute allowedRoles={['servant']} requiredPermission={PERMISSIONS.MANAGE_ATTENDANCE}><AttendancePage /></ProtectedRoute>} />
          <Route path="/servant/tools" element={<ProtectedRoute allowedRoles={['servant']} requiredPermission={PERMISSIONS.MANAGE_SERVANT_TOOLS}><ServantToolsPage /></ProtectedRoute>} />
          <Route path="/servant/communications" element={<ProtectedRoute allowedRoles={['servant']} requiredPermission={PERMISSIONS.VIEW_PRAYERS_AND_CONTACT}><CommunicationsPage /></ProtectedRoute>} />

          {/* Board Routes (Only visible to board members) */}
          <Route path="/board" element={<ProtectedRoute allowedRoles={['board']}><BoardDashboardPage /></ProtectedRoute>} />
          <Route path="/board/financials" element={<ProtectedRoute allowedRoles={['board']} requiredPermission={PERMISSIONS.VIEW_FINANCIALS}><FinancialAccountsPage /></ProtectedRoute>} />
          <Route path="/board/projects" element={<ProtectedRoute allowedRoles={['board']} requiredPermission={PERMISSIONS.MANAGE_PROJECTS}><ImplementationPlansPage /></ProtectedRoute>} />
          <Route path="/board/agenda" element={<ProtectedRoute allowedRoles={['board']} requiredPermission={PERMISSIONS.MANAGE_MEETINGS}><MeetingAgendaPage /></ProtectedRoute>} />

          {/* Kahoot Quiz Gamification Routes */}
          <Route path="/quiz" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'priest', 'servant', 'board']} requiredPermission={PERMISSIONS.MANAGE_QUIZZES}><QuizListPage /></ProtectedRoute>} />
          <Route path="/quiz/host/:sessionId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'priest', 'servant']} requiredPermission={PERMISSIONS.MANAGE_QUIZZES}><QuizHostPage /></ProtectedRoute>} />
          <Route path="/quiz/play" element={<QuizPlayerPage />} />
        </Routes>
      </div>

      {!isDashboard && <Footer />}

      <PrayerModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
      />

      <SermonVideoModal
        sermon={modalSermon}
        onClose={() => setModalSermon(null)}
      />
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

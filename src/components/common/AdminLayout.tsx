import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardFooter } from './DashboardFooter';
import { AdminDataProvider } from '../../contexts/AdminDataContext';
import type { UserRole } from '../../lib/database.types';

interface AdminLayoutProps {
  role: UserRole;
  requiredPermission?: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ role, requiredPermission, children }) => {
  const { profile, loading, hasPermission } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

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

  // Check authentication
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Strict Role Guarding: Verify if profile matches page requirement, allowing admins access to all pages
  const hasRoleAccess = 
    profile.role === role || 
    profile.role === 'super_admin' || 
    profile.role === 'admin';

  // Custom permission verification (if specified)
  const hasPermissionAccess = !requiredPermission || hasPermission(requiredPermission);

  if (!hasRoleAccess || !hasPermissionAccess) {
    // Redirect to the first role dashboard they are authorized to see
    const targetPath = profile.role === 'super_admin' || profile.role === 'admin' 
      ? '/admin' 
      : (profile.role === 'membership' ? '/membership' : `/${profile.role}`);
    return <Navigate to={targetPath} replace />;
  }

  return (
    <AdminDataProvider>
      <div className="min-h-screen flex bg-[#fbf9f8] text-[#1b1c1c] font-cairo overflow-x-hidden" dir="rtl">
        <DashboardSidebar 
          role={profile.role} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />
        
        <main className={`flex-grow flex flex-col min-h-screen transition-all duration-300 w-full ${isCollapsed ? 'md:mr-20' : 'md:mr-64'} mr-0`}>
          <DashboardTopBar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1200px] mx-auto w-full flex-grow">
            {children}
          </div>
          
          <DashboardFooter />
        </main>
      </div>
    </AdminDataProvider>
  );
};

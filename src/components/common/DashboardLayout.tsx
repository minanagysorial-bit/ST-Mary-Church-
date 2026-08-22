import React from 'react';
import { AdminLayout } from './AdminLayout';
import type { UserRole } from '../../lib/database.types';

interface DashboardLayoutProps {
  role: UserRole;
  requiredPermission?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, requiredPermission, children }) => {
  return (
    <AdminLayout role={role} requiredPermission={requiredPermission}>
      {children}
    </AdminLayout>
  );
};

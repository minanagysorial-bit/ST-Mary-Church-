import { useAuth } from '../contexts/AuthContext';
import {
  ADMIN_DEFAULT_PERMISSIONS,
  PRIEST_DEFAULT_PERMISSIONS,
  SERVICE_LEADER_DEFAULT_PERMISSIONS,
  SERVANT_DEFAULT_PERMISSIONS,
  BOARD_DEFAULT_PERMISSIONS,
  MEMBERSHIP_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS
} from '../lib/permissions';
import type { PermissionKey } from '../lib/permissions';

/**
 * Hook that provides permission-checking helpers for the current user.
 * 
 * - super_admin → ALL permissions without restrictions
 * - admin → ADMIN_DEFAULT_PERMISSIONS + any extra DB permissions
 * - priest → PRIEST_DEFAULT_PERMISSIONS + any extra DB permissions
 * - service_leader → SERVICE_LEADER_DEFAULT_PERMISSIONS + any extra DB permissions
 * - servant → SERVANT_DEFAULT_PERMISSIONS + any extra DB permissions
 * - membership → MEMBERSHIP_DEFAULT_PERMISSIONS + any extra DB permissions
 * - board → BOARD_DEFAULT_PERMISSIONS + any extra DB permissions
 */
export function usePermissions() {
  const { profile, permissions, loading } = useAuth();

  const hasPermission = (key: PermissionKey | string): boolean => {
    if (!profile) return false;

    // Super Admin always has full access to everything
    if (profile.role === 'super_admin') {
      return true;
    }

    // Check if the user has been granted this specific permission in DB
    if (permissions && permissions.includes(key)) {
      return true;
    }

    // Admin default set
    if (profile.role === 'admin') {
      return (ADMIN_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Priest default set
    if (profile.role === 'priest') {
      return (PRIEST_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Service Leader default set
    if (profile.role === 'service_leader') {
      return (SERVICE_LEADER_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Servant default set
    if (profile.role === 'servant') {
      return (SERVANT_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Membership default set
    if (profile.role === 'membership') {
      return (MEMBERSHIP_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Board default set
    if (profile.role === 'board') {
      return (BOARD_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    return false;
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  return {
    permissions,
    hasPermission,
    isSuperAdmin,
    isAdmin,
    loading,
    allPermissions: ALL_PERMISSIONS,
  };
}

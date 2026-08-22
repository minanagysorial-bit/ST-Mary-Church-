import { useAuth } from '../contexts/AuthContext';
import { SERVANT_DEFAULT_PERMISSIONS, BOARD_DEFAULT_PERMISSIONS, MEMBERSHIP_DEFAULT_PERMISSIONS, ALL_PERMISSIONS } from '../lib/permissions';
import type { PermissionKey } from '../lib/permissions';

/**
 * Hook that provides permission-checking helpers for the current user.
 * 
 * - super_admin / admin → ALL permissions
 * - servant → fixed default set (SERVANT_DEFAULT_PERMISSIONS)
 * - board → fixed default set (BOARD_DEFAULT_PERMISSIONS)
 * - membership → fixed default set (MEMBERSHIP_DEFAULT_PERMISSIONS)
 * - priest → per-user permissions loaded from the database
 */
export function usePermissions() {
  const { profile, permissions, loading } = useAuth();

  const hasPermission = (key: PermissionKey | string): boolean => {
    if (!profile) return false;

    // Super Admin and Admin always have full access
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      return true;
    }

    // Servant: check against default set
    if (profile.role === 'servant') {
      return (SERVANT_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Board: check against default set
    if (profile.role === 'board') {
      return (BOARD_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Membership: check against default set
    if (profile.role === 'membership') {
      return (MEMBERSHIP_DEFAULT_PERMISSIONS as readonly string[]).includes(key);
    }

    // Priest: check against per-user permissions from DB
    if (profile.role === 'priest') {
      return permissions.includes(key);
    }

    return false;
  };

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  return {
    permissions,
    hasPermission,
    isAdmin,
    loading,
    allPermissions: ALL_PERMISSIONS,
  };
}

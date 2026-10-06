import { api, type Family, type FamilyMember, type FamilyServant, type Profile, type ExpoOrder, type VisitationLog } from './api';

export interface ServantScopeResult {
  isServant: boolean;
  isAssigned: boolean;
  isUnassigned: boolean;
  assignedFamilies: Family[];
  assignedFamilyIds: string[];
  primaryFamily: Family | null;
  serviceCategory: string | null;
}

/**
 * Computes whether the current user is a servant and strictly checks their assigned Sunday school families.
 */
export function computeServantScope(
  profile: Profile | null,
  allFamilies: Family[],
  familyServantsRelations: FamilyServant[]
): ServantScopeResult {
  if (!profile) {
    return {
      isServant: false,
      isAssigned: false,
      isUnassigned: false,
      assignedFamilies: [],
      assignedFamilyIds: [],
      primaryFamily: null,
      serviceCategory: null
    };
  }

  const isServant = profile.role === 'servant';
  const isGlobalManager = ['super_admin', 'admin', 'priest', 'service_leader'].includes(profile.role);

  // Sunday School families
  const ssFamilies = allFamilies.filter(f => f.family_type === 'sunday_school');

  if (isGlobalManager) {
    return {
      isServant: false,
      isAssigned: true,
      isUnassigned: false,
      assignedFamilies: ssFamilies,
      assignedFamilyIds: ssFamilies.map(f => f.id),
      primaryFamily: ssFamilies[0] || null,
      serviceCategory: ssFamilies[0]?.area || ssFamilies[0]?.stage || null
    };
  }

  if (isServant) {
    // Collect all family IDs linked to this servant in family_servants or assigned_servant_id
    const myFamilyIds = new Set<string>();

    familyServantsRelations.forEach(rel => {
      if (rel.servant_id === profile.id) {
        myFamilyIds.add(rel.family_id);
      }
    });

    ssFamilies.forEach(fam => {
      if (fam.assigned_servant_id === profile.id) {
        myFamilyIds.add(fam.id);
      }
    });

    const myAssignedFamilies = ssFamilies.filter(f => myFamilyIds.has(f.id));

    if (myAssignedFamilies.length === 0) {
      return {
        isServant: true,
        isAssigned: false,
        isUnassigned: true,
        assignedFamilies: [],
        assignedFamilyIds: [],
        primaryFamily: null,
        serviceCategory: null
      };
    }

    const primary = myAssignedFamilies[0];
    const serviceCategory = primary.area || primary.stage || null;

    return {
      isServant: true,
      isAssigned: true,
      isUnassigned: false,
      assignedFamilies: myAssignedFamilies,
      assignedFamilyIds: myAssignedFamilies.map(f => f.id),
      primaryFamily: primary,
      serviceCategory
    };
  }

  return {
    isServant: false,
    isAssigned: false,
    isUnassigned: false,
    assignedFamilies: [],
    assignedFamilyIds: [],
    primaryFamily: null,
    serviceCategory: null
  };
}

/**
 * Filter family members strictly by assigned families for servants.
 */
export function filterMembersByAssignedFamilies(
  members: FamilyMember[],
  assignedFamilyIds: string[],
  isServant: boolean
): FamilyMember[] {
  if (!isServant) return members;
  if (assignedFamilyIds.length === 0) return [];
  return members.filter(m => assignedFamilyIds.includes(m.family_id));
}

/**
 * Filter expo orders strictly by assigned family members or family names.
 */
export function filterExpoOrdersForServant(
  orders: ExpoOrder[],
  assignedFamilyIds: string[],
  assignedFamilies: Family[],
  isServant: boolean
): ExpoOrder[] {
  if (!isServant) return orders;
  if (assignedFamilies.length === 0) return [];

  const familyNames = new Set(assignedFamilies.map(f => f.head_name.trim().toLowerCase()));

  return orders.filter(o => {
    if (o.family_name && familyNames.has(o.family_name.trim().toLowerCase())) {
      return true;
    }
    // Also check student_id if matching any family member
    return false;
  });
}

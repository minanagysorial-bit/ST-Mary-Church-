// ===================================================================
// Permission Keys — Single Source of Truth
// Used across frontend (hooks, sidebar, routes) and maps to DB values
// ===================================================================

/** All permission keys available in the system */
export const PERMISSIONS = {
  // Admin pages
  MANAGE_SERMONS: 'manage_sermons',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_CONTENT: 'manage_content',
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_VERSES: 'manage_verses',

  // Priest pages
  MANAGE_LITURGIES: 'manage_liturgies',
  MANAGE_PRIEST_SERMONS: 'manage_priest_sermons',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  VIEW_SERVICES: 'view_services',
  MONITOR_SERVANTS: 'monitor_servants',
  MANAGE_MEMBERSHIP_COMMENTS: 'manage_membership_comments',

  // Servant pages
  MANAGE_FAMILIES: 'manage_families',
  MANAGE_VISITATION: 'manage_visitation',
  MANAGE_ATTENDANCE: 'manage_attendance',
  MANAGE_SERVANT_TOOLS: 'manage_servant_tools',

  // Board pages
  VIEW_FINANCIALS: 'view_financials',
  MANAGE_PROJECTS: 'manage_projects',
  MANAGE_MEETINGS: 'manage_meetings',

  // Shared
  MANAGE_QUIZZES: 'manage_quizzes',

  // Membership & Church Members
  REVIEW_MEMBERSHIP_REQUESTS: 'review_membership_requests',
  MANAGE_CHURCH_MEMBERS: 'manage_church_members',
  VIEW_MEMBER_VISITATIONS: 'view_member_visitations',

  // Custom Admin Assigned Permissions
  CREATE_FAMILIES: 'create_families',
  VIEW_PRAYERS_AND_CONTACT: 'view_prayers_and_contact',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Arabic labels for each permission — used in the admin checkbox UI */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  [PERMISSIONS.MANAGE_SERMONS]: 'إدارة العظات والكلمات الروحية',
  [PERMISSIONS.MANAGE_MEMBERS]: 'إدارة الأعضاء والمخدومين',
  [PERMISSIONS.MANAGE_CONTENT]: 'إدارة محتوى الموقع',
  [PERMISSIONS.MANAGE_PERMISSIONS]: 'إعتماد الحسابات والصلاحيات',
  [PERMISSIONS.MANAGE_VERSES]: 'إدارة آيات الموقع اليومية',

  [PERMISSIONS.MANAGE_LITURGIES]: 'إدارة جدول القداسات',
  [PERMISSIONS.MANAGE_PRIEST_SERMONS]: 'إدارة عظات الكاهن',
  [PERMISSIONS.MANAGE_ANNOUNCEMENTS]: 'إدارة الإعلانات الكنسية',
  [PERMISSIONS.VIEW_SERVICES]: 'متابعة الخدمات والمجموعات',
  [PERMISSIONS.MONITOR_SERVANTS]: 'مراقبة أنشطة الخدام',
  [PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS]: 'اعتماد طلبات العضوية والتعليقات',

  [PERMISSIONS.MANAGE_FAMILIES]: 'إدارة بيانات الأسر',
  [PERMISSIONS.MANAGE_VISITATION]: 'تسجيل الافتقادات والزيارات',
  [PERMISSIONS.MANAGE_ATTENDANCE]: 'تسجيل حضور وغياب المخدومين',
  [PERMISSIONS.MANAGE_SERVANT_TOOLS]: 'أدوات الخادم المساعدة',

  [PERMISSIONS.VIEW_FINANCIALS]: 'الاطلاع على الحسابات المالية',
  [PERMISSIONS.MANAGE_PROJECTS]: 'إدارة خطط التنفيذ والمشاريع',
  [PERMISSIONS.MANAGE_MEETINGS]: 'إدارة اجتماعات المجلس',

  [PERMISSIONS.MANAGE_QUIZZES]: 'إدارة المسابقات التفاعلية',
  [PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS]: 'مراجعة واعتماد طلبات العضوية',
  [PERMISSIONS.MANAGE_CHURCH_MEMBERS]: 'إدارة بيانات أعضاء الكنيسة',
  [PERMISSIONS.VIEW_MEMBER_VISITATIONS]: 'متابعة افتقاد الشعب (للكاهن)',
  
  [PERMISSIONS.CREATE_FAMILIES]: 'إنشاء أسر مدارس الأحد وإضافة خدام بها',
  [PERMISSIONS.VIEW_PRAYERS_AND_CONTACT]: 'الاطلاع على طلبات الصلاة ورسائل تواصل معنا',
};

/** Group permissions by category for the admin UI */
export const PERMISSION_GROUPS: { label: string; permissions: PermissionKey[] }[] = [
  {
    label: 'صلاحيات الإدارة العامة',
    permissions: [
      PERMISSIONS.MANAGE_SERMONS,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.MANAGE_CONTENT,
      PERMISSIONS.MANAGE_PERMISSIONS,
      PERMISSIONS.MANAGE_VERSES,
    ],
  },
  {
    label: 'صلاحيات الكاهن',
    permissions: [
      PERMISSIONS.MANAGE_LITURGIES,
      PERMISSIONS.MANAGE_PRIEST_SERMONS,
      PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.MONITOR_SERVANTS,
      PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
    ],
  },
  {
    label: 'صلاحيات الخادم',
    permissions: [
      PERMISSIONS.MANAGE_FAMILIES,
      PERMISSIONS.MANAGE_VISITATION,
      PERMISSIONS.MANAGE_ATTENDANCE,
      PERMISSIONS.MANAGE_SERVANT_TOOLS,
    ],
  },
  {
    label: 'صلاحيات مجلس الكنيسة',
    permissions: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.MANAGE_MEETINGS,
    ],
  },
  {
    label: 'صلاحيات العضوية والافتقاد',
    permissions: [
      PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
      PERMISSIONS.MANAGE_CHURCH_MEMBERS,
      PERMISSIONS.VIEW_MEMBER_VISITATIONS,
    ],
  },
  {
    label: 'صلاحيات مخصصة (إضافية)',
    permissions: [
      PERMISSIONS.CREATE_FAMILIES,
      PERMISSIONS.VIEW_PRAYERS_AND_CONTACT,
    ],
  },
];

/** All permission keys as a flat array */
export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

/** Default permissions for servant role */
export const SERVANT_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_FAMILIES,
  PERMISSIONS.MANAGE_VISITATION,
  PERMISSIONS.MANAGE_ATTENDANCE,
  PERMISSIONS.MANAGE_SERVANT_TOOLS,
  PERMISSIONS.MANAGE_QUIZZES,
];

/** Default permissions for board role */
export const BOARD_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.VIEW_FINANCIALS,
  PERMISSIONS.MANAGE_PROJECTS,
  PERMISSIONS.MANAGE_MEETINGS,
];

/** Default permissions for membership role */
export const MEMBERSHIP_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_CHURCH_MEMBERS,
  PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
  PERMISSIONS.VIEW_MEMBER_VISITATIONS,
  PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
];

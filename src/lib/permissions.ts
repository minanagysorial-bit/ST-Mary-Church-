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
  MANAGE_NOTIFICATIONS: 'manage_notifications',

  // Priest & Pastoral pages
  MANAGE_LITURGIES: 'manage_liturgies',
  MANAGE_PRIEST_SERMONS: 'manage_priest_sermons',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  VIEW_SERVICES: 'view_services',
  MONITOR_SERVANTS: 'monitor_servants',
  MANAGE_MEMBERSHIP_COMMENTS: 'manage_membership_comments',
  VIEW_PRAYERS_AND_CONTACT: 'view_prayers_and_contact',
  VIEW_MEMBER_VISITATIONS: 'view_member_visitations',

  // Service Leader (أمين الخدمة) pages
  MANAGE_SERVICES: 'manage_services',
  CREATE_FAMILIES: 'create_families',
  ASSIGN_SERVANTS: 'assign_servants',

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
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Arabic labels for each permission — used in the admin checkbox UI */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  [PERMISSIONS.MANAGE_SERMONS]: 'إدارة العظات والكلمات الروحية',
  [PERMISSIONS.MANAGE_MEMBERS]: 'إدارة الأعضاء والمستخدمين',
  [PERMISSIONS.MANAGE_CONTENT]: 'إدارة محتوى وبناء صفحات الموقع',
  [PERMISSIONS.MANAGE_PERMISSIONS]: 'إعتماد الحسابات والصلاحيات (للسوبر أدمن)',
  [PERMISSIONS.MANAGE_VERSES]: 'إدارة آيات الموقع اليومية',
  [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'إرسال الإشعارات الفورية (Push Notifications)',

  [PERMISSIONS.MANAGE_LITURGIES]: 'إدارة وجدول القداسات',
  [PERMISSIONS.MANAGE_PRIEST_SERMONS]: 'إدارة عظات الكاهن',
  [PERMISSIONS.MANAGE_ANNOUNCEMENTS]: 'إدارة الإعلانات والأخبار الكنسية',
  [PERMISSIONS.VIEW_SERVICES]: 'متابعة وإشراف على الخدمات الرعوية (للكاهن)',
  [PERMISSIONS.MONITOR_SERVANTS]: 'مراقبة أنشطة الخدام',
  [PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS]: 'اعتماد وملاحظات العضوية',
  [PERMISSIONS.VIEW_PRAYERS_AND_CONTACT]: 'الاطلاع على طلبات الصلاة ورسائل الشعب',
  [PERMISSIONS.VIEW_MEMBER_VISITATIONS]: 'سجل ومتابعة افتقاد شعب الكنيسة',

  [PERMISSIONS.MANAGE_SERVICES]: 'إدارة وتنسيق الخدمات الكنسية',
  [PERMISSIONS.CREATE_FAMILIES]: 'إنشاء فصول وأسر التربية الكنسية وتحديد السن',
  [PERMISSIONS.ASSIGN_SERVANTS]: 'تعيين الخدام في فصول الأسر (لأمين الخدمة)',

  [PERMISSIONS.MANAGE_FAMILIES]: 'إدارة بيانات أولاد ومخدومي الأسرة',
  [PERMISSIONS.MANAGE_VISITATION]: 'تسجيل ومتابعة الافتقادات والزيارات',
  [PERMISSIONS.MANAGE_ATTENDANCE]: 'تسجيل حضور وغياب المخدومين',
  [PERMISSIONS.MANAGE_SERVANT_TOOLS]: 'أدوات الخادم المساعدة ومولد الأفكار',

  [PERMISSIONS.VIEW_FINANCIALS]: 'الاطلاع على الحسابات المالية',
  [PERMISSIONS.MANAGE_PROJECTS]: 'إدارة خطط التنفيذ والمشاريع',
  [PERMISSIONS.MANAGE_MEETINGS]: 'إدارة اجتماعات المجلس',

  [PERMISSIONS.MANAGE_QUIZZES]: 'إدارة المسابقات التفاعلية',
  [PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS]: 'مراجعة وقبول/رفض طلبات الانضمام للعضوية',
  [PERMISSIONS.MANAGE_CHURCH_MEMBERS]: 'إدارة وإضافة بيانات شعب الكنيسة',
};

/** Group permissions by category for the admin UI */
export const PERMISSION_GROUPS: { label: string; permissions: PermissionKey[] }[] = [
  {
    label: 'صلاحيات الإدارة (Admin)',
    permissions: [
      PERMISSIONS.MANAGE_LITURGIES,
      PERMISSIONS.MANAGE_VERSES,
      PERMISSIONS.MANAGE_NOTIFICATIONS,
      PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      PERMISSIONS.MANAGE_SERMONS,
      PERMISSIONS.MANAGE_CONTENT,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.MANAGE_PERMISSIONS,
    ],
  },
  {
    label: 'صلاحيات الكاهن (Priest)',
    permissions: [
      PERMISSIONS.VIEW_PRAYERS_AND_CONTACT,
      PERMISSIONS.VIEW_MEMBER_VISITATIONS,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.MANAGE_CHURCH_MEMBERS,
      PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
      PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
      PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      PERMISSIONS.MANAGE_LITURGIES,
      PERMISSIONS.MANAGE_PRIEST_SERMONS,
      PERMISSIONS.MONITOR_SERVANTS,
    ],
  },
  {
    label: 'صلاحيات أمين الخدمة (Service Leader)',
    permissions: [
      PERMISSIONS.MANAGE_SERVICES,
      PERMISSIONS.CREATE_FAMILIES,
      PERMISSIONS.ASSIGN_SERVANTS,
      PERMISSIONS.MANAGE_FAMILIES,
      PERMISSIONS.MANAGE_VISITATION,
      PERMISSIONS.MANAGE_ATTENDANCE,
      PERMISSIONS.MANAGE_SERVANT_TOOLS,
      PERMISSIONS.MANAGE_QUIZZES,
    ],
  },
  {
    label: 'صلاحيات الخادم (Servant)',
    permissions: [
      PERMISSIONS.MANAGE_FAMILIES,
      PERMISSIONS.MANAGE_VISITATION,
      PERMISSIONS.MANAGE_ATTENDANCE,
      PERMISSIONS.MANAGE_SERVANT_TOOLS,
      PERMISSIONS.MANAGE_QUIZZES,
    ],
  },
  {
    label: 'صلاحيات العضوية وشعب الكنيسة (Membership)',
    permissions: [
      PERMISSIONS.MANAGE_CHURCH_MEMBERS,
      PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
      PERMISSIONS.VIEW_MEMBER_VISITATIONS,
      PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
    ],
  },
  {
    label: 'صلاحيات مجلس الكنيسة (Board)',
    permissions: [
      PERMISSIONS.VIEW_FINANCIALS,
      PERMISSIONS.MANAGE_PROJECTS,
      PERMISSIONS.MANAGE_MEETINGS,
    ],
  },
];

/** All permission keys as a flat array */
export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

/** Default permissions for Admin role (القداسات، الآيات، الإشعارات، الإعلانات) */
export const ADMIN_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_LITURGIES,
  PERMISSIONS.MANAGE_VERSES,
  PERMISSIONS.MANAGE_NOTIFICATIONS,
  PERMISSIONS.MANAGE_ANNOUNCEMENTS,
];

/** Default permissions for Priest role (طلبات الصلاة، تواصل معنا، الافتقاد، الخدمات، العضوية، الإعلانات، القداسات) */
export const PRIEST_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.VIEW_PRAYERS_AND_CONTACT,
  PERMISSIONS.VIEW_MEMBER_VISITATIONS,
  PERMISSIONS.VIEW_SERVICES,
  PERMISSIONS.MANAGE_CHURCH_MEMBERS,
  PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
  PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
  PERMISSIONS.MANAGE_ANNOUNCEMENTS,
  PERMISSIONS.MANAGE_LITURGIES,
  PERMISSIONS.MANAGE_PRIEST_SERMONS,
];

/** Default permissions for Service Leader role (إدارة الخدمات، إنشاء الأسر، تعيين الخدام، متابعة الافتقاد والحضور) */
export const SERVICE_LEADER_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_SERVICES,
  PERMISSIONS.CREATE_FAMILIES,
  PERMISSIONS.ASSIGN_SERVANTS,
  PERMISSIONS.MANAGE_FAMILIES,
  PERMISSIONS.MANAGE_VISITATION,
  PERMISSIONS.MANAGE_ATTENDANCE,
  PERMISSIONS.MANAGE_SERVANT_TOOLS,
  PERMISSIONS.MANAGE_QUIZZES,
];

/** Default permissions for Servant role (فصله وأولاده، الافتقاد، الحضور والنقاط) */
export const SERVANT_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_FAMILIES,
  PERMISSIONS.MANAGE_VISITATION,
  PERMISSIONS.MANAGE_ATTENDANCE,
  PERMISSIONS.MANAGE_SERVANT_TOOLS,
  PERMISSIONS.MANAGE_QUIZZES,
];

/** Default permissions for Membership role (شعب الكنيسة، مراجعة طلبات الانضمام، الافتقاد، التعليقات) */
export const MEMBERSHIP_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_CHURCH_MEMBERS,
  PERMISSIONS.REVIEW_MEMBERSHIP_REQUESTS,
  PERMISSIONS.VIEW_MEMBER_VISITATIONS,
  PERMISSIONS.MANAGE_MEMBERSHIP_COMMENTS,
];

/** Default permissions for Board role */
export const BOARD_DEFAULT_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.VIEW_FINANCIALS,
  PERMISSIONS.MANAGE_PROJECTS,
  PERMISSIONS.MANAGE_MEETINGS,
];

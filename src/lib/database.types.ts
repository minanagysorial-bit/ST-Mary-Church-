// ===================================================================
// Database Types — matches the Supabase PostgreSQL schema
// ===================================================================

export type UserRole = 'super_admin' | 'admin' | 'priest' | 'service_leader' | 'servant' | 'board' | 'membership';
export type MemberStatus = 'نشط' | 'قيد الانتظار' | 'موقوف';
export type MeetingStatus = 'مجدول' | 'مكتمل' | 'ملغي';
export type ProjectStatus = 'قيد التنفيذ' | 'مكتمل' | 'مخطط';
export type FinancialType = 'تبرع' | 'مصروفات' | 'خدمات إخوة الرب';
export type MembershipRequestStatus = 'قيد المراجعة' | 'مقبول' | 'مرفوض' | 'مؤجل';

export interface MembershipRequest {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  national_id: string | null;
  age: number | null;
  marital_status: 'أعزب' | 'متزوج';
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchMember {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  national_id: string | null;
  age: number | null;
  marital_status: 'أعزب' | 'متزوج';
  request_id: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberVisitation {
  id: string;
  church_member_id: string;
  visited_by: string;
  visit_date: string;
  visit_type: 'منزلية' | 'تليفونية' | 'كنسية';
  notes: string | null;
  created_at: string;
  // Joined fields
  member_name?: string;
  priest_name?: string;
}

export type CommunityMemoryCategory = 
  | 'أكاليل ومناسبات'
  | 'معجزات وبركات'
  | 'ذكريات مع الآباء'
  | 'أنشطة وخدام زمان'
  | 'تاريخ وتراث';

export interface CommunityMemory {
  id: string;
  author_name: string;
  title: string;
  story_content: string;
  event_year: string; // e.g. "1978" or "السبعينات"
  category: CommunityMemoryCategory;
  image_urls: string[]; // max 3 images (supports Google Drive links & direct urls)
  contact_phone?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  likes_count: number;
  reviewed_by?: string | null;
  reviewer_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ----- Row types (what you get FROM the database) -----

export interface Profile {
  id: string;                // UUID — matches auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  sermon_date: string | null;
  duration_minutes: number | null;
  youtube_url: string | null;
  audio_url: string | null;
  description: string | null;
  play_count: number;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  national_id: string | null;
  confession_father: string | null;
  address: string | null;
  area: string | null;
  education: string | null;
  job: string | null;
  service: string;
  interests: string[] | null;
  status: MemberStatus;
  registration_date: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  full_name: string;
  age: number | null;
  sunday_school_stage: string | null;
  phone: string | null;
  phone_2: string | null;
  address: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ChurchServiceCategory =
  | 'ابتدائي بنين'
  | 'ابتدائي بنات'
  | 'فتيان إعدادي'
  | 'فتيات إعدادي'
  | 'شباب ثانوي'
  | 'شابات ثانوي'
  | 'خدمة شباب جامعة'
  | 'خدمة شابات جامعة'
  | 'خريجين'
  | 'عرس قانا الجليل';

export interface ChurchService {
  id: string;
  name: string;
  category: ChurchServiceCategory;
  priest_ids?: string[];
  leader_ids?: string[];
  priests_names?: string[];
  leaders_names?: string[];
  families_count?: number;
  servants_count?: number;
  makhdoumeen_count?: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  head_name: string;
  name?: string;
  service_id?: string | null;
  stage?: string | null;
  age_group?: string | null;
  address: string;
  area: string;
  members_count: number;
  phone: string | null;
  assigned_servant_id: string | null;
  service_area_id: string | null;
  last_visit_date: string | null;
  notes: string | null;
  family_type: 'church' | 'sunday_school';
  created_at: string;
  updated_at: string;
}

export interface FamilyServant {
  id: string;
  family_id: string;
  servant_id: string;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  responsible_priest: string;
  families_count: number;
  notes: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees_count: number;
  status: MeetingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  progress: number;
  budget: string;
  target_date: string;
  status: ProjectStatus;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialRecord {
  id: string;
  type: FinancialType;
  amount: number;
  description: string;
  date: string;
  created_by: string | null;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  requester_name: string;
  request_text: string;
  is_read: boolean;
  submitted_at: string;
}

export interface MembershipComment {
  id: string;
  member_id: string | null;
  applicant_name: string;
  requested_service: string;
  confession_father: string | null;
  status: MembershipRequestStatus;
  reviewer_id: string | null;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Liturgy {
  id: string;
  title: string;
  liturgy_day: string;
  start_time: string;
  end_time: string;
  church_name: string;
  altar_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Verse {
  id: string;
  text: string;
  reference: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  duration_type: 'permanent' | 'days_limit' | 'days_specific';
  duration_days: number | null;
  specific_days: string[] | null;
  start_date: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// ----- Services Hierarchy & Visitation Types -----

export interface ChurchService {
  id: string;
  name: string;
  gender: 'ولاد' | 'بنات' | 'مختلط';
  age_group: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceGroup {
  id: string;
  service_id: string;
  name: string;
  leader_id: string | null;
  created_at: string;
  updated_at: string;
  // Join properties optional
  service_name?: string;
  leader_name?: string;
  servants_count?: number;
  members_count?: number;
}

export interface ServiceGroupServant {
  id: string;
  group_id: string;
  servant_id: string;
  role: 'قائد' | 'خادم' | 'مساعد';
  created_at: string;
  // Joined profile
  servant?: Profile;
}

export interface ServiceGroupMember {
  id: string;
  group_id: string;
  member_id: string;
  created_at: string;
  // Joined member
  member?: Member;
}

export interface VisitationLog {
  id: string;
  servant_id: string;
  member_id: string;
  group_id: string | null;
  visit_date: string;
  visit_type: 'منزلية' | 'تليفونية' | 'كنسية';
  notes: string | null;
  created_at: string;
  // Joined data
  servant_name?: string;
  member_name?: string;
  group_name?: string;
}

export interface AttendanceRecord {
  id: string;
  group_id: string;
  member_id: string;
  date: string;
  present: boolean;
  recorded_by: string | null;
  created_at: string;
  member_name?: string;
}

export interface FamilyAttendanceRecord {
  id: string;
  family_id: string;
  member_id: string;
  date: string;
  present: boolean;
  recorded_by: string | null;
  created_at: string;
  member_name?: string;
}

// ----- Insert types (what you send TO the database) -----

export type SermonInsert = Omit<Sermon, 'id' | 'play_count' | 'created_at' | 'updated_at'> & {
  id?: string;
  play_count?: number;
};

export type MemberInsert = Omit<Member, 'id' | 'created_at' | 'updated_at' | 'registration_date' | 'national_id' | 'confession_father' | 'address' | 'area' | 'education' | 'job' | 'interests'> & {
  id?: string;
  registration_date?: string;
  national_id?: string | null;
  confession_father?: string | null;
  address?: string | null;
  area?: string | null;
  education?: string | null;
  job?: string | null;
  interests?: string[] | null;
};

export type FamilyInsert = Omit<Family, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type FamilyMemberInsert = Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type FamilyServantInsert = Omit<FamilyServant, 'id' | 'created_at'> & { id?: string };
export type MeetingInsert = Omit<Meeting, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type FinancialRecordInsert = Omit<FinancialRecord, 'id' | 'created_at'> & { id?: string };
export type MembershipCommentInsert = Omit<MembershipComment, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type LiturgyInsert = Omit<Liturgy, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export type ChurchServiceInsert = Omit<ChurchService, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ServiceGroupInsert = Omit<ServiceGroup, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type ServiceGroupServantInsert = Omit<ServiceGroupServant, 'id' | 'created_at'> & { id?: string };
export type ServiceGroupMemberInsert = Omit<ServiceGroupMember, 'id' | 'created_at'> & { id?: string };
export type VisitationLogInsert = Omit<VisitationLog, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type AttendanceRecordInsert = Omit<AttendanceRecord, 'id' | 'created_at'> & { id?: string };
export type FamilyAttendanceRecordInsert = Omit<FamilyAttendanceRecord, 'id' | 'created_at'> & { id?: string };

export type VerseInsert = Omit<Verse, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type UserPermissionInsert = Omit<UserPermission, 'id' | 'created_at'> & { id?: string };
export type AnnouncementInsert = Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type SiteSettingInsert = SiteSetting;

export interface QuizQuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  color?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'quiz' | 'mcq' | 'true_false' | 'type_answer' | 'blur_image' | 'poll' | 'slider';
  options: QuizQuestionOption[];
  time_limit: number;
  points: number;
  position: number;
  image_url: string | null;
  created_at: string;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  pin: string;
  status: 'waiting' | 'in_progress' | 'get_ready' | 'show_question' | 'question_active' | 'question_leaderboard' | 'finished';
  current_question_index: number;
  host_id: string | null;
  question_started_at: string | null;
  created_at: string;
}

export interface QuizPlayer {
  id: string;
  session_id: string;
  nickname: string;
  avatar_url: string | null;
  score: number;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
  created_at: string;
}

export type QuizInsert = Omit<Quiz, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type QuizQuestionInsert = Omit<QuizQuestion, 'id' | 'created_at'> & { id?: string };
export type QuizSessionInsert = Omit<QuizSession, 'id' | 'created_at'> & { id?: string };
export type QuizPlayerInsert = Omit<QuizPlayer, 'id' | 'created_at' | 'score'> & { id?: string; score?: number };
export type QuizAnswerInsert = Omit<QuizAnswer, 'id' | 'created_at'> & { id?: string };

export type MembershipRequestInsert = Omit<MembershipRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'reviewed_by' | 'review_note' | 'reviewed_at'> & { 
  id?: string; 
  status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
};
export type ChurchMemberInsert = Omit<ChurchMember, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type MemberVisitationInsert = Omit<MemberVisitation, 'id' | 'created_at'> & { id?: string };

export interface MemoryAlbum {
  id: string;
  title: string;
  event_date: string;
  cover_image_url: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}
export type MemoryAlbumInsert = Omit<MemoryAlbum, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CustomPageInsert = Omit<CustomPage, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export interface PageSection {
  id: string;
  page_id: string;
  section_type: string; // 'hero' | 'text_block' | 'cards_grid' | 'gallery' | 'contact'
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  items: any[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type PageSectionInsert = Omit<PageSection, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export interface Priest {
  id: string;
  name: string;
  title: string | null;
  image_url: string | null;
  status: 'active' | 'reposed' | 'martyr';
  ordained_date: string | null;
  reposed_date: string | null;
  bio: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type PriestInsert = Omit<Priest, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
}
export type ContactMessageInsert = Omit<ContactMessage, 'id' | 'created_at'> & { id?: string };

// ----- Database type for Supabase client generic -----

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile>; Relationships: [] };
      custom_pages: { Row: CustomPage; Insert: CustomPageInsert; Update: Partial<CustomPage>; Relationships: [] };
      page_sections: { Row: PageSection; Insert: PageSectionInsert; Update: Partial<PageSection>; Relationships: [] };
      priests: { Row: Priest; Insert: PriestInsert; Update: Partial<Priest>; Relationships: [] };
      memory_albums: { Row: MemoryAlbum; Insert: MemoryAlbumInsert; Update: Partial<MemoryAlbum>; Relationships: [] };
      sermons: { Row: Sermon; Insert: SermonInsert; Update: Partial<Sermon>; Relationships: [] };
      members: { Row: Member; Insert: MemberInsert; Update: Partial<Member>; Relationships: [] };
      families: { Row: Family; Insert: FamilyInsert; Update: Partial<Family>; Relationships: [] };
      family_members: { Row: FamilyMember; Insert: FamilyMemberInsert; Update: Partial<FamilyMember>; Relationships: [] };
      service_areas: { Row: ServiceArea; Insert: Omit<ServiceArea, 'id' | 'created_at'>; Update: Partial<ServiceArea>; Relationships: [] };
      meetings: { Row: Meeting; Insert: MeetingInsert; Update: Partial<Meeting>; Relationships: [] };
      projects: { Row: Project; Insert: ProjectInsert; Update: Partial<Project>; Relationships: [] };
      financial_records: { Row: FinancialRecord; Insert: FinancialRecordInsert; Update: Partial<FinancialRecord>; Relationships: [] };
      prayer_requests: { Row: PrayerRequest; Insert: Omit<PrayerRequest, 'id' | 'submitted_at'>; Update: Partial<PrayerRequest>; Relationships: [] };
      membership_comments: { Row: MembershipComment; Insert: MembershipCommentInsert; Update: Partial<MembershipComment>; Relationships: [] };
      liturgies: { Row: Liturgy; Insert: LiturgyInsert; Update: Partial<Liturgy>; Relationships: [] };
      church_services: { Row: ChurchService; Insert: ChurchServiceInsert; Update: Partial<ChurchService>; Relationships: [] };
      service_groups: { Row: ServiceGroup; Insert: ServiceGroupInsert; Update: Partial<ServiceGroup>; Relationships: [] };
      service_group_servants: { Row: ServiceGroupServant; Insert: ServiceGroupServantInsert; Update: Partial<ServiceGroupServant>; Relationships: [] };
      service_group_members: { Row: ServiceGroupMember; Insert: ServiceGroupMemberInsert; Update: Partial<ServiceGroupMember>; Relationships: [] };
      visitation_logs: { Row: VisitationLog; Insert: VisitationLogInsert; Update: Partial<VisitationLog>; Relationships: [] };
      attendance_records: { Row: AttendanceRecord; Insert: AttendanceRecordInsert; Update: Partial<AttendanceRecord>; Relationships: [] };
      membership_requests: { Row: MembershipRequest; Insert: MembershipRequestInsert; Update: Partial<MembershipRequest>; Relationships: [] };
      church_members: { Row: ChurchMember; Insert: ChurchMemberInsert; Update: Partial<ChurchMember>; Relationships: [] };
      member_visitations: { Row: MemberVisitation; Insert: MemberVisitationInsert; Update: Partial<MemberVisitation>; Relationships: [] };
      quizzes: { Row: Quiz; Insert: QuizInsert; Update: Partial<Quiz>; Relationships: [] };
      quiz_questions: { Row: QuizQuestion; Insert: QuizQuestionInsert; Update: Partial<QuizQuestion>; Relationships: [] };
      quiz_sessions: { Row: QuizSession; Insert: QuizSessionInsert; Update: Partial<QuizSession>; Relationships: [] };
      quiz_players: { Row: QuizPlayer; Insert: QuizPlayerInsert; Update: Partial<QuizPlayer>; Relationships: [] };
      quiz_answers: { Row: QuizAnswer; Insert: QuizAnswerInsert; Update: Partial<QuizAnswer>; Relationships: [] };
      verses: { Row: Verse; Insert: VerseInsert; Update: Partial<Verse>; Relationships: [] };
      user_permissions: { Row: UserPermission; Insert: UserPermissionInsert; Update: Partial<UserPermission>; Relationships: [] };
      announcements: { Row: Announcement; Insert: AnnouncementInsert; Update: Partial<Announcement>; Relationships: [] };
      site_settings: { Row: SiteSetting; Insert: SiteSettingInsert; Update: Partial<SiteSetting>; Relationships: [] };
      contact_messages: { Row: ContactMessage; Insert: ContactMessageInsert; Update: Partial<ContactMessage>; Relationships: [] };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_play_count: { Args: { sermon_id: string }; Returns: void };
      generate_quiz_pin: { Args: Record<string, never>; Returns: string };
      submit_quiz_answer: {
        Args: {
          p_session_id: string;
          p_player_id: string;
          p_question_id: string;
          p_answer_text: string;
        };
        Returns: {
          is_correct: boolean;
          points_earned: number;
          time_taken: number;
          correct_answer: string | null;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


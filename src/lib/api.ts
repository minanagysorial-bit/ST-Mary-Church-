import { supabase } from './supabase';
import type {
  Sermon, Member, Meeting, Project, FinancialRecord,
  Family, FamilyServant, FamilyAttendanceRecord, ServiceArea, PrayerRequest, MembershipComment, Liturgy,
  ChurchService, ChurchServiceCategory, ServiceGroup, ServiceGroupServant, ServiceGroupMember, VisitationLog, AttendanceRecord,
  Quiz, QuizQuestion, QuizSession, QuizPlayer, QuizAnswer, QuizQuestionOption,
  SermonInsert, MemberInsert, FinancialRecordInsert,
  MeetingInsert, ProjectInsert, FamilyInsert, FamilyMember, FamilyMemberInsert, FamilyServantInsert, FamilyAttendanceRecordInsert, MembershipCommentInsert, LiturgyInsert,
  ChurchServiceInsert, ServiceGroupInsert, ServiceGroupServantInsert, ServiceGroupMemberInsert, VisitationLogInsert, AttendanceRecordInsert,
  QuizInsert, QuizQuestionInsert, QuizSessionInsert, QuizPlayerInsert, QuizAnswerInsert,
  Profile, UserRole,
  Verse, VerseInsert, UserPermission, UserPermissionInsert,
  Announcement, AnnouncementInsert, SiteSetting, SiteSettingInsert,
  MembershipRequest, ChurchMember, MemberVisitation,
  MembershipRequestInsert, ChurchMemberInsert, MemberVisitationInsert,
  MemoryAlbum, MemoryAlbumInsert,
  CustomPage, CustomPageInsert, PageSection, PageSectionInsert,
  Priest, PriestInsert, ContactMessage, ContactMessageInsert,
  CommunityMemory, CommunityMemoryCategory
} from './database.types';

// Re-export types for backward compatibility
export type {
  Sermon, Member, Meeting, Project, FinancialRecord, Profile, UserRole, Liturgy,
  ChurchService, ChurchServiceCategory, ServiceGroup, ServiceGroupServant, ServiceGroupMember, VisitationLog, AttendanceRecord,
  Family, FamilyMember, FamilyServant, FamilyAttendanceRecord,
  Quiz, QuizQuestion, QuizSession, QuizPlayer, QuizAnswer, QuizQuestionOption,
  Verse, VerseInsert, UserPermission, UserPermissionInsert,
  Announcement, AnnouncementInsert, SiteSetting, SiteSettingInsert,
  MembershipRequest, ChurchMember, MemberVisitation, MemoryAlbum, MemoryAlbumInsert,
  CustomPage, CustomPageInsert, PageSection, PageSectionInsert,
  Priest, PriestInsert, ContactMessage, ContactMessageInsert,
  PrayerRequest, CommunityMemory, CommunityMemoryCategory
};

// ===================================================================
// IMAGE TRANSFORMS & DRIVE URL HELPERS
// ===================================================================

export const convertDriveUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const clean = url.trim();
  if (clean.includes('drive.google.com/file/d/')) {
    const fileId = clean.split('/file/d/')[1]?.split('/')[0]?.split('?')[0];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200` : clean;
  }
  if (clean.includes('drive.google.com/open?id=')) {
    const fileId = clean.split('id=')[1]?.split('&')[0];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200` : clean;
  }
  if (clean.includes('drive.google.com/uc?id=')) {
    const fileId = clean.split('id=')[1]?.split('&')[0];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200` : clean;
  }
  return clean;
};

export const parseImageTransform = (url: string | null | undefined) => {
  const defaultStyles: React.CSSProperties = {
    objectPosition: '50% 50%',
    transform: 'scale(1)',
  };

  if (!url) return { rawUrl: '', convertedUrl: '', styles: defaultStyles, offsetX: '50', offsetY: '50', zoom: '1' };

  const hashIndex = url.indexOf('#');
  let cleanUrl = url;
  let offsetX = '50';
  let offsetY = '50';
  let zoom = '1';

  if (hashIndex !== -1) {
    cleanUrl = url.substring(0, hashIndex);
    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);
    offsetX = params.get('x') || '50';
    offsetY = params.get('y') || '50';
    zoom = params.get('z') || '1';
  }

  const convertedUrl = convertDriveUrl(cleanUrl);

  return {
    rawUrl: cleanUrl,
    convertedUrl,
    styles: {
      objectPosition: `${offsetX}% ${offsetY}%`,
      transform: `scale(${zoom})`,
    },
    offsetX,
    offsetY,
    zoom
  };
};

// ===================================================================
// SERMONS
// ===================================================================

export const api = {
  // ── Sermons ──────────────────────────────────────────────
  getSermons: async (): Promise<Sermon[]> => {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false });
    if (error) throw error;
    return data as Sermon[];
  },

  getSermonById: async (id: string): Promise<Sermon | null> => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // 1. If valid UUID, check Supabase DB
    if (isUuid) {
      try {
        const { data, error } = await supabase
          .from('sermons')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as Sermon;
      } catch (err) {
        // Fall through to sync search
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('sermons')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data as Sermon;
      } catch (err) {
        // Fall through to sync search
      }
    }

    // 2. Search in /api/sync-sermons (the official channel catalog)
    try {
      const res = await fetch('/api/sync-sermons');
      if (res.ok) {
        const syncData = await res.json();
        if (syncData.sermons && Array.isArray(syncData.sermons)) {
          const cleanId = id.replace(/^yt_/, '');
          const found = syncData.sermons.find((s: any) =>
            s.id === id ||
            s.id === `yt_${cleanId}` ||
            s.id === cleanId ||
            s.videoId === cleanId ||
            s.videoId === id ||
            (s.youtube_url && s.youtube_url.includes(cleanId))
          );
          if (found) {
            return {
              id: found.id || id,
              title: found.title,
              speaker: found.speaker || 'كنيسة السيدة العذراء بمحرم بك',
              topic: found.topic || 'عظات وكلمات روحية',
              sermon_date: found.sermon_date || new Date().toISOString().split('T')[0],
              duration_minutes: found.duration_minutes || 45,
              youtube_url: found.youtube_url || `https://www.youtube.com/watch?v=${cleanId}`,
              audio_url: found.audio_url || null,
              description: found.description || 'عظة وكلمة روحية مباركة من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.',
              play_count: found.play_count || 0,
              featured: false,
              created_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        }
      }
    } catch (err) {
      console.warn('Sync API search in getSermonById failed:', err);
    }

    // 3. Fallback: If id is a valid YouTube video ID (11 chars) or starts with yt_
    const rawVideoId = id.replace(/^yt_/, '');
    if (rawVideoId && (rawVideoId.length === 11 || /^[a-zA-Z0-9_-]{11}$/.test(rawVideoId))) {
      return {
        id: id,
        title: 'عظة وكلمة روحية مباركة',
        speaker: 'كنيسة السيدة العذراء مريم بمحرم بك',
        topic: 'عظات وكلمات روحية',
        sermon_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        youtube_url: `https://www.youtube.com/watch?v=${rawVideoId}`,
        audio_url: null,
        description: 'تسجيل مبارك من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.',
        play_count: 0,
        featured: false,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return null;
  },

  incrementPlayCount: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_play_count', { sermon_id: id } as any);
    if (error) throw error;
  },

  createSermon: async (sermon: SermonInsert): Promise<Sermon> => {
    const { data, error } = await supabase
      .from('sermons')
      .insert(sermon)
      .select()
      .single();
    if (error) throw error;
    return data as Sermon;
  },

  updateSermon: async (id: string, updates: Partial<Sermon>): Promise<Sermon> => {
    const { data, error } = await supabase
      .from('sermons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Sermon;
  },

  deleteSermon: async (id: string): Promise<void> => {
    const { error } = await supabase.from('sermons').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Members ──────────────────────────────────────────────
  getMembers: async (): Promise<Member[]> => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('registration_date', { ascending: false });
    if (error) throw error;
    return data as Member[];
  },

  getSundaySchoolStudents: async (): Promise<Member[]> => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .in('service', ['حضانة', 'ابتدائي', 'إعدادي', 'ثانوي'])
      .order('registration_date', { ascending: false });
    if (error) throw error;
    return data as Member[];
  },

  createMember: async (member: MemberInsert): Promise<Member> => {
    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  },

  updateMember: async (id: string, updates: Partial<Member>): Promise<Member> => {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  },

  deleteMember: async (id: string): Promise<void> => {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Meetings ─────────────────────────────────────────────
  getMeetings: async (): Promise<Meeting[]> => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as Meeting[];
  },

  createMeeting: async (meeting: MeetingInsert): Promise<Meeting> => {
    const { data, error } = await supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single();
    if (error) throw error;
    return data as Meeting;
  },

  updateMeeting: async (id: string, updates: Partial<Meeting>): Promise<Meeting> => {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Meeting;
  },

  // ── Projects ─────────────────────────────────────────────
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Project[];
  },

  createProject: async (project: ProjectInsert): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Project;
  },

  // ── Financial Records ────────────────────────────────────
  getFinancials: async (): Promise<FinancialRecord[]> => {
    const { data, error } = await supabase
      .from('financial_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as FinancialRecord[];
  },

  createFinancial: async (record: FinancialRecordInsert): Promise<FinancialRecord> => {
    const { data, error } = await supabase
      .from('financial_records')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data as FinancialRecord;
  },

  // ── Families ─────────────────────────────────────────────
  getFamilies: async (type?: 'church' | 'sunday_school'): Promise<Family[]> => {
    let query = supabase
      .from('families')
      .select('*')
      .order('head_name', { ascending: true });
      
    if (type) {
      query = query.eq('family_type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Family[];
  },

  createFamily: async (family: FamilyInsert): Promise<Family> => {
    const { data, error } = await supabase
      .from('families')
      .insert(family)
      .select()
      .single();
    if (error) throw error;
    return data as Family;
  },

  updateFamily: async (id: string, updates: Partial<Family>): Promise<void> => {
    const { error } = await supabase.from('families').update(updates).eq('id', id);
    if (error) throw error;
  },

  deleteFamily: async (id: string): Promise<void> => {
    const { error } = await supabase.from('families').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Service Areas ────────────────────────────────────────
  getServiceAreas: async (): Promise<ServiceArea[]> => {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as ServiceArea[];
  },

  // ── Prayer Requests ──────────────────────────────────────
  getPrayerRequests: async (): Promise<PrayerRequest[]> => {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data as PrayerRequest[];
  },

  submitPrayerRequest: async (name: string, text: string): Promise<void> => {
    const { error } = await supabase
      .from('prayer_requests')
      .insert({ requester_name: name, request_text: text, is_read: false });
    if (error) throw error;
  },

  updatePrayerRequestStatus: async (id: string, is_read: boolean): Promise<void> => {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ is_read })
      .eq('id', id);
    if (error) throw error;
  },

  deletePrayerRequest: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Membership Comments ──────────────────────────────────
  getMembershipComments: async (): Promise<MembershipComment[]> => {
    const { data, error } = await supabase
      .from('membership_comments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MembershipComment[];
  },

  updateMembershipComment: async (id: string, updates: Partial<MembershipComment>): Promise<void> => {
    const { error } = await supabase
      .from('membership_comments')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  // ── Profiles Management ──────────────────────────────────
  getProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
  },

  getPriestProfiles: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'priest')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data as Profile[];
  },

  updateProfile: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  updateProfileRole: async (id: string, role: UserRole): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);
    if (error) throw error;
  },

  deleteProfile: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Liturgies ────────────────────────────────────────────
  getLiturgies: async (): Promise<Liturgy[]> => {
    const { data, error } = await supabase
      .from('liturgies')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Liturgy[];
  },

  createLiturgy: async (liturgy: LiturgyInsert): Promise<Liturgy> => {
    const { data, error } = await supabase
      .from('liturgies')
      .insert(liturgy)
      .select()
      .single();
    if (error) throw error;
    return data as Liturgy;
  },

  updateLiturgy: async (id: string, updates: Partial<Liturgy>): Promise<Liturgy> => {
    const { data, error } = await supabase
      .from('liturgies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Liturgy;
  },

  deleteLiturgy: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('liturgies')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Church Services & Groups ─────────────────────────────
  getChurchServices: async (): Promise<ChurchService[]> => {
    const { data, error } = await supabase
      .from('church_services')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as ChurchService[];
  },

  createChurchService: async (service: ChurchServiceInsert): Promise<ChurchService> => {
    const { data, error } = await supabase
      .from('church_services')
      .insert(service)
      .select()
      .single();
    if (error) throw error;
    return data as ChurchService;
  },

  getServiceGroups: async (serviceId?: string): Promise<ServiceGroup[]> => {
    let query = supabase
      .from('service_groups')
      .select(`
        *,
        church_services(name),
        profiles:leader_id(full_name)
      `)
      .order('name', { ascending: true });

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      service_name: row.church_services?.name,
      leader_name: row.profiles?.full_name
    })) as ServiceGroup[];
  },

  createServiceGroup: async (group: ServiceGroupInsert): Promise<ServiceGroup> => {
    const { data, error } = await supabase
      .from('service_groups')
      .insert(group)
      .select()
      .single();
    if (error) throw error;
    return data as ServiceGroup;
  },

  getGroupServants: async (groupId: string): Promise<ServiceGroupServant[]> => {
    const { data, error } = await supabase
      .from('service_group_servants')
      .select(`
        *,
        profiles:servant_id(*)
      `)
      .eq('group_id', groupId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      servant: row.profiles
    })) as ServiceGroupServant[];
  },

  assignServantToGroup: async (groupId: string, servantId: string, role: 'قائد' | 'خادم' | 'مساعد' = 'خادم'): Promise<void> => {
    const { error } = await supabase
      .from('service_group_servants')
      .insert({ group_id: groupId, servant_id: servantId, role });
    if (error) throw error;
  },

  // --- Families CRUD ---
  getFamilyMembers: async (familyId: string): Promise<FamilyMember[]> => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as FamilyMember[];
  },

  createFamilyMember: async (member: FamilyMemberInsert): Promise<FamilyMember> => {
    const { data, error } = await supabase
      .from('family_members')
      .insert(member)
      .select()
      .single();
    if (error) throw error;
    return data as FamilyMember;
  },

  updateFamilyMember: async (id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> => {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as FamilyMember;
  },

  deleteFamilyMember: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getFamilyServants: async (familyId: string): Promise<FamilyServant[]> => {
    const { data, error } = await supabase
      .from('family_servants')
      .select('*')
      .eq('family_id', familyId);
    if (error) throw error;
    return data as FamilyServant[];
  },

  assignServantToFamily: async (familyId: string, servantId: string): Promise<void> => {
    const { error } = await supabase
      .from('family_servants')
      .insert({ family_id: familyId, servant_id: servantId });
    if (error) throw error;
  },

  removeServantFromFamily: async (familyId: string, servantId: string): Promise<void> => {
    const { error } = await supabase
      .from('family_servants')
      .delete()
      .eq('family_id', familyId)
      .eq('servant_id', servantId);
    if (error) throw error;
  },

  getFamilyServantsForAll: async (): Promise<FamilyServant[]> => {
    const { data, error } = await supabase
      .from('family_servants')
      .select('*');
    if (error) throw error;
    return data as FamilyServant[];
  },

  removeServantFromGroup: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('service_group_servants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getGroupMembers: async (groupId: string): Promise<ServiceGroupMember[]> => {
    const { data, error } = await supabase
      .from('service_group_members')
      .select(`
        *,
        members:member_id(*)
      `)
      .eq('group_id', groupId);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ...row,
      member: row.members
    })) as ServiceGroupMember[];
  },

  assignMemberToGroup: async (groupId: string, memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('service_group_members')
      .insert({ group_id: groupId, member_id: memberId });
    if (error) throw error;
  },

  removeMemberFromGroup: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('service_group_members')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Visitation Logs ──────────────────────────────────────
  getVisitationLogs: async (servantId?: string): Promise<VisitationLog[]> => {
    let query = supabase
      .from('visitation_logs')
      .select(`
        *,
        profiles:servant_id(full_name),
        family_members:member_id(full_name)
      `)
      .order('visit_date', { ascending: false });

    if (servantId) {
      query = query.eq('servant_id', servantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      servant_name: row.profiles?.full_name,
      member_name: row.family_members?.full_name || row.member_name || ''
    })) as VisitationLog[];
  },

  createVisitationLog: async (log: VisitationLogInsert): Promise<VisitationLog> => {
    const { data, error } = await supabase
      .from('visitation_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data as VisitationLog;
  },

  deleteVisitationLog: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('visitation_logs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Attendance Records ───────────────────────────────────
  getAttendanceRecords: async (groupId: string, date?: string): Promise<AttendanceRecord[]> => {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        members:member_id(full_name)
      `)
      .eq('group_id', groupId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      member_name: row.members?.full_name
    })) as AttendanceRecord[];
  },

  upsertAttendanceRecord: async (record: AttendanceRecordInsert): Promise<void> => {
    const { error } = await supabase
      .from('attendance_records')
      .upsert(record, { onConflict: 'group_id,member_id,date' });
    if (error) throw error;
  },

  getFamilyAttendanceRecords: async (familyId: string, date?: string): Promise<FamilyAttendanceRecord[]> => {
    let query = supabase
      .from('family_attendance_records')
      .select(`
        *,
        members:member_id(full_name)
      `)
      .eq('family_id', familyId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      member_name: row.members?.full_name
    })) as FamilyAttendanceRecord[];
  },

  upsertFamilyAttendanceRecord: async (record: FamilyAttendanceRecordInsert): Promise<void> => {
    const { error } = await supabase
      .from('family_attendance_records')
      .upsert(record, { onConflict: 'family_id,member_id,date' });
    if (error) throw error;
  },

  getFamilyAttendanceStats: async (familyId: string): Promise<FamilyAttendanceRecord[]> => {
    const { data, error } = await supabase
      .from('family_attendance_records')
      .select('*')
      .eq('family_id', familyId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data as FamilyAttendanceRecord[];
  },

  getAllFamilyAttendanceRecords: async (): Promise<FamilyAttendanceRecord[]> => {
    const { data, error } = await supabase
      .from('family_attendance_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as FamilyAttendanceRecord[];
  },

  // ── Kahoot Interactive Quizzes ─────────────────────────────
  getQuizzes: async (): Promise<Quiz[]> => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getQuizWithQuestions: async (quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> => {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    if (quizError) throw quizError;

    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });
    if (qError) throw qError;

    return {
      quiz,
      questions: (questions || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
      }))
    };
  },

  createQuiz: async (
    quiz: QuizInsert,
    questions: Array<Omit<QuizQuestionInsert, 'quiz_id'>>
  ): Promise<Quiz> => {
    const { data: createdQuiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single();
    if (quizErr) throw quizErr;

    if (questions.length > 0) {
      const qInserts = questions.map((q, idx) => ({
        ...q,
        quiz_id: createdQuiz.id,
        position: idx
      }));
      const { error: qErr } = await supabase
        .from('quiz_questions')
        .insert(qInserts);
      if (qErr) throw qErr;
    }

    return createdQuiz;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Quiz Game Sessions
  createQuizSession: async (quizId: string, hostId?: string): Promise<QuizSession> => {
    // Generate a collision-safe unique PIN via server-side RPC
    const { data: pin, error: pinError } = await supabase.rpc('generate_quiz_pin');
    if (pinError || !pin) {
      // Fallback to client-side generation if RPC not yet deployed
      const fallbackPin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizId,
          pin: fallbackPin,
          status: 'waiting',
          current_question_index: 0,
          host_id: hostId || null
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        quiz_id: quizId,
        pin,
        status: 'waiting',
        current_question_index: 0,
        host_id: hostId || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getQuizSessionByPin: async (pin: string): Promise<QuizSession | null> => {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('pin', pin)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  getQuizSessionById: async (id: string): Promise<QuizSession | null> => {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  updateQuizSessionStatus: async (
    sessionId: string,
    status: QuizSession['status'],
    currentQuestionIndex?: number
  ): Promise<void> => {
    const updates: Record<string, any> = { status };
    if (typeof currentQuestionIndex === 'number') {
      updates.current_question_index = currentQuestionIndex;
    }
    // Set server-side timestamp when question becomes active
    if (status === 'question_active') {
      updates.question_started_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('quiz_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (!error) return;

    console.warn('First session status update attempt failed, using compatibility fallback:', error.message);

    // Retry without question_started_at (migration 009 may not be applied yet)
    const { question_started_at: _ignored, ...withoutTimestamp } = updates;
    const { error: noTsError } = await supabase
      .from('quiz_sessions')
      .update(withoutTimestamp)
      .eq('id', sessionId);

    if (!noTsError) return;

    // Last resort: older DBs may only allow waiting/in_progress/finished
    const legacyStatus =
      status === 'get_ready' || status === 'question_active' || status === 'question_leaderboard'
        ? 'in_progress'
        : status;
    const { error: legacyError } = await supabase
      .from('quiz_sessions')
      .update({ ...withoutTimestamp, status: legacyStatus })
      .eq('id', sessionId);

    if (legacyError) {
      console.error('Fallback session status update failed:', legacyError);
      throw legacyError;
    }
  },

  joinQuizSession: async (sessionId: string, nickname: string, avatarUrl?: string): Promise<QuizPlayer> => {
    const { data, error } = await supabase
      .from('quiz_players')
      .insert({
        session_id: sessionId,
        nickname: nickname.trim(),
        avatar_url: avatarUrl || null,
        score: 0
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSessionPlayers: async (sessionId: string): Promise<QuizPlayer[]> => {
    const { data, error } = await supabase
      .from('quiz_players')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Server-side scored answer submission via RPC
  submitAnswerRPC: async (
    sessionId: string,
    playerId: string,
    questionId: string,
    answerText: string
  ): Promise<{ is_correct: boolean; points_earned: number; time_taken: number; correct_answer: string | null }> => {
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_session_id: sessionId,
      p_player_id: playerId,
      p_question_id: questionId,
      p_answer_text: answerText
    });
    if (error) throw error;
    return data as any;
  },

  // Legacy direct-insert (kept as fallback if RPC migration not yet applied)
  submitQuizAnswer: async (
    sessionId: string,
    playerId: string,
    questionId: string,
    answer: string,
    isCorrect: boolean,
    timeTaken: number,
    pointsEarned: number
  ): Promise<void> => {
    const { error } = await supabase
      .from('quiz_answers')
      .insert({
        session_id: sessionId,
        player_id: playerId,
        question_id: questionId,
        answer,
        is_correct: isCorrect,
        time_taken: timeTaken,
        points_earned: pointsEarned
      });
    if (error) throw error;

    if (isCorrect && pointsEarned > 0) {
      // Atomic score update
      const { data: player } = await supabase
        .from('quiz_players')
        .select('score')
        .eq('id', playerId)
        .single();
      if (player) {
        await supabase
          .from('quiz_players')
          .update({ score: player.score + pointsEarned })
          .eq('id', playerId);
      }
    }
  },

  getSessionAnswers: async (sessionId: string, questionId?: string): Promise<QuizAnswer[]> => {
    let query = supabase
      .from('quiz_answers')
      .select('*')
      .eq('session_id', sessionId);
    if (questionId) {
      query = query.eq('question_id', questionId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ── Permissions management (Admin-only CRUD from client) ──
  getUserPermissions: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((p: any) => p.permission);
  },

  setUserPermissions: async (userId: string, permissions: string[]): Promise<void> => {
    // Delete existing
    const { error: delError } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    if (permissions.length > 0) {
      const inserts = permissions.map(p => ({ user_id: userId, permission: p }));
      const { error: insError } = await supabase
        .from('user_permissions')
        .insert(inserts);
      if (insError) throw insError;
    }
  },

  // ── Verses CRUD ──
  getVerses: async (): Promise<Verse[]> => {
    const { data, error } = await supabase
      .from('verses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Verse[];
  },

  getRandomVerse: async (): Promise<Verse | null> => {
    const { data, error } = await supabase
      .from('verses')
      .select('*');
    if (error) throw error;
    if (!data || data.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex] as Verse;
  },

  createVerse: async (verse: VerseInsert): Promise<Verse> => {
    const { data, error } = await supabase
      .from('verses')
      .insert(verse)
      .select()
      .single();
    if (error) throw error;
    return data as Verse;
  },

  updateVerse: async (id: string, updates: Partial<Verse>): Promise<Verse> => {
    const { data, error } = await supabase
      .from('verses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Verse;
  },

  deleteVerse: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('verses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Announcements CRUD ──
  getAnnouncements: async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Announcement[];
  },

  getActiveAnnouncements: async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    // Filter out announcements that have expired or don't match specific days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time
    const dayName = today.toLocaleDateString('ar-EG', { weekday: 'long' });

    return (data || []).filter(ann => {
      const startDate = new Date(ann.start_date);
      startDate.setHours(0, 0, 0, 0);

      // if start date is in the future, it's not active yet
      if (startDate > today) return false;

      if (ann.duration_type === 'permanent') return true;
      
      if (ann.duration_type === 'days_limit' && ann.duration_days) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + ann.duration_days);
        return today <= endDate;
      }
      
      if (ann.duration_type === 'days_specific' && ann.specific_days) {
        // e.g. "الجمعة", "الأحد"
        return ann.specific_days.includes(dayName);
      }

      return false;
    }) as Announcement[];
  },

  createAnnouncement: async (ann: AnnouncementInsert): Promise<Announcement> => {
    const { data, error } = await supabase
      .from('announcements')
      .insert(ann)
      .select()
      .single();
    if (error) throw error;
    return data as Announcement;
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Announcement;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  toggleAnnouncementActive: async (id: string, isActive: boolean): Promise<void> => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) throw error;
  },

  // ── Site Settings CRUD ──
  getSiteSettings: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');
    if (error) throw error;
    
    const settings: Record<string, string> = {};
    (data || []).forEach(s => {
      settings[s.key] = s.value;
    });
    return settings;
  },

  updateSiteSettings: async (settings: Record<string, string>): Promise<void> => {
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));
    
    // Upsert each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(update, { onConflict: 'key' });
      if (error) throw error;
    }
  },

  // ── Membership Requests ──
  submitMembershipRequest: async (data: MembershipRequestInsert): Promise<void> => {
    const { error } = await supabase
      .from('membership_requests')
      .insert(data);
    if (error) throw error;
  },

  getMembershipRequests: async (status?: 'pending' | 'approved' | 'rejected'): Promise<MembershipRequest[]> => {
    let query = supabase
      .from('membership_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as MembershipRequest[];
  },

  approveMembershipRequest: async (id: string, reviewerId: string): Promise<void> => {
    // 1. Update status in requests
    const { data: request, error: updateError } = await supabase
      .from('membership_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw updateError;
    if (!request) throw new Error('Request not found');

    // 2. Insert into official church_members
    const { error: insertError } = await supabase
      .from('church_members')
      .insert({
        full_name: request.full_name,
        phone: request.phone,
        address: request.address,
        national_id: request.national_id,
        age: request.age,
        marital_status: request.marital_status,
        request_id: request.id,
        approved_by: reviewerId
      });
    if (insertError) throw insertError;
  },

  rejectMembershipRequest: async (id: string, reviewerId: string, note?: string): Promise<void> => {
    const { error } = await supabase
      .from('membership_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_note: note || null
      })
      .eq('id', id);
    if (error) throw error;
  },

  // ── Church Members ──
  getChurchMembers: async (): Promise<ChurchMember[]> => {
    const { data, error } = await supabase
      .from('church_members')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data as ChurchMember[];
  },

  updateChurchMember: async (id: string, data: Partial<ChurchMember>): Promise<ChurchMember> => {
    const { data: member, error } = await supabase
      .from('church_members')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return member as ChurchMember;
  },

  // ── Priest-Only Member Visitations ──
  getMemberVisitations: async (memberId?: string): Promise<MemberVisitation[]> => {
    let query = supabase
      .from('member_visitations')
      .select(`
        *,
        church_members:church_member_id(full_name),
        profiles:visited_by(full_name)
      `)
      .order('visit_date', { ascending: false });
    
    if (memberId) {
      query = query.eq('church_member_id', memberId);
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      member_name: row.church_members?.full_name,
      priest_name: row.profiles?.full_name
    })) as MemberVisitation[];
  },

  createMemberVisitation: async (data: MemberVisitationInsert): Promise<MemberVisitation> => {
    const { data: visit, error } = await supabase
      .from('member_visitations')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return visit as MemberVisitation;
  },

  // ── Memory Albums CRUD ──
  getMemoryAlbums: async (): Promise<MemoryAlbum[]> => {
    const { data, error } = await supabase
      .from('memory_albums')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MemoryAlbum[];
  },

  createMemoryAlbum: async (album: MemoryAlbumInsert): Promise<MemoryAlbum> => {
    const { data, error } = await supabase
      .from('memory_albums')
      .insert(album)
      .select()
      .single();
    if (error) throw error;
    return data as MemoryAlbum;
  },

  updateMemoryAlbum: async (id: string, updates: Partial<MemoryAlbum>): Promise<MemoryAlbum> => {
    const { data, error } = await supabase
      .from('memory_albums')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MemoryAlbum;
  },

  deleteMemoryAlbum: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('memory_albums')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Custom Pages & Sections CRUD (Page Builder) ──
  getCustomPages: async (): Promise<CustomPage[]> => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as CustomPage[];
  },

  getCustomPageBySlug: async (slug: string): Promise<CustomPage | null> => {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data as CustomPage | null;
  },

  createCustomPage: async (page: CustomPageInsert): Promise<CustomPage> => {
    const { data, error } = await supabase
      .from('custom_pages')
      .insert(page)
      .select()
      .single();
    if (error) throw error;
    return data as CustomPage;
  },

  updateCustomPage: async (id: string, updates: Partial<CustomPage>): Promise<CustomPage> => {
    const { data, error } = await supabase
      .from('custom_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as CustomPage;
  },

  deleteCustomPage: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getPageSections: async (pageId: string): Promise<PageSection[]> => {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as PageSection[];
  },

  createPageSection: async (section: PageSectionInsert): Promise<PageSection> => {
    const { data, error } = await supabase
      .from('page_sections')
      .insert(section)
      .select()
      .single();
    if (error) throw error;
    return data as PageSection;
  },

  updatePageSection: async (id: string, updates: Partial<PageSection>): Promise<PageSection> => {
    const { data, error } = await supabase
      .from('page_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PageSection;
  },

  deletePageSection: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('page_sections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  savePageSections: async (pageId: string, sections: PageSectionInsert[]): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('page_sections')
      .delete()
      .eq('page_id', pageId);
    if (deleteError) throw deleteError;

    if (sections.length > 0) {
      const { error: insertError } = await supabase
        .from('page_sections')
        .insert(sections);
      if (insertError) throw insertError;
    }
  },

  // ── Priests CRUD (Dynamic Priests Management) ──
  getPriests: async (): Promise<Priest[]> => {
    const { data, error } = await supabase
      .from('priests')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data as Priest[];
  },

  createPriest: async (priest: PriestInsert): Promise<Priest> => {
    const { data, error } = await supabase
      .from('priests')
      .insert(priest)
      .select()
      .single();
    if (error) throw error;
    return data as Priest;
  },

  updatePriest: async (id: string, updates: Partial<Priest>): Promise<Priest> => {
    const { data, error } = await supabase
      .from('priests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Priest;
  },

  deletePriest: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('priests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Contact Messages CRUD ──
  getContactMessages: async (): Promise<ContactMessage[]> => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ContactMessage[];
  },

  submitContactMessage: async (name: string, phone: string, message: string): Promise<void> => {
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, phone, message, status: 'unread' });
    if (error) throw error;
  },

  updateContactMessageStatus: async (id: string, status: 'unread' | 'read' | 'replied'): Promise<void> => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  deleteContactMessage: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // COMMUNITY MEMORIES (حكايات من محرم بك)
  // ==========================================
  async getCommunityMemories(statusFilter?: 'approved' | 'pending' | 'all'): Promise<CommunityMemory[]> {
    try {
      let query = supabase.from('church_community_memories').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as CommunityMemory[];
      }
    } catch (e) {
      console.warn('DB table query failed, trying settings fallback', e);
    }

    // Fallback in site_settings
    try {
      const settings = await this.getSiteSettings();
      const raw = settings['church_community_memories_data'];
      if (raw) {
        const parsed: CommunityMemory[] = JSON.parse(raw);
        if (statusFilter && statusFilter !== 'all') {
          return parsed.filter(m => m.status === statusFilter);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Settings fallback failed:', e);
    }

    // Default Initial Seed Memories
    const initialSeed: CommunityMemory[] = [
      {
        id: 'mem_1',
        author_name: 'عائلة الشماس حنا يوسف',
        title: 'صورة إكليل والديّ بكنيسة العذراء بالسبعينات',
        story_content: 'صورة نادرة من صلاة الإكليل المبارك لوالديّ بكنيسة السيدة العذراء بمحرم بك، وكانت الخدمة برئاسة الآباء الكهنة الأبرار المتنيحين. الكنيسة دائماً هي بيت العائلة الكبير وبركة لكل أجيالنا وشبابنا.',
        event_year: '١٩٧٥م',
        category: 'أكاليل ومناسبات',
        image_urls: ['/history_19.jpg'],
        status: 'approved',
        likes_count: 28,
        created_at: new Date(1975, 5, 12).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mem_2',
        author_name: 'تاسوني مريم وخدام أسرة إعدادي',
        title: 'ذكريات يوم تدشين المعمودية وأيام مدارس الأحد الأولى',
        story_content: 'من أجمل الذكريات الراسخة في قلوبنا، أيام إقامة أول معرض لمدارس الأحد وحضور الأطفال والخدام من كل شوارع محرم بك، كانت الكنيسة عامرة بالحب والترانيم والتسبيح من الصباح للمساء وربنا يديم خدمتها المباركة.',
        event_year: '١٩٨٢م',
        category: 'أنشطة وخدام زمان',
        image_urls: ['/history_6.jpg'],
        status: 'approved',
        likes_count: 21,
        created_at: new Date(1982, 3, 20).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return statusFilter && statusFilter !== 'all' 
      ? initialSeed.filter(m => m.status === statusFilter) 
      : initialSeed;
  },

  async submitCommunityMemory(payload: {
    author_name: string;
    title: string;
    story_content: string;
    event_year: string;
    category: CommunityMemoryCategory;
    image_urls: string[];
    contact_phone?: string;
  }): Promise<CommunityMemory> {
    const newMemory: CommunityMemory = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      author_name: payload.author_name.trim(),
      title: payload.title.trim(),
      story_content: payload.story_content.trim(),
      event_year: payload.event_year.trim() || 'الماضي الجميل',
      category: payload.category,
      image_urls: payload.image_urls.slice(0, 3).map(convertDriveUrl),
      contact_phone: payload.contact_phone || null,
      status: 'pending',
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try DB Insert
    try {
      const { data, error } = await supabase.from('church_community_memories').insert(newMemory).select().single();
      if (!error && data) return data as CommunityMemory;
    } catch (e) {
      console.warn('DB insert failed, writing to site_settings fallback', e);
    }

    // Settings fallback
    const all = await this.getCommunityMemories('all');
    all.unshift(newMemory);
    await this.updateSiteSettings({ church_community_memories_data: JSON.stringify(all) });
    return newMemory;
  },

  async updateCommunityMemoryStatus(id: string, status: 'approved' | 'rejected', notes?: string, reviewerName?: string): Promise<boolean> {
    try {
      await supabase.from('church_community_memories').update({
        status,
        reviewer_notes: notes || null,
        reviewed_by: reviewerName || 'مشرف الكنيسة',
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.warn('DB status update failed, trying fallback', e);
    }

    const all = await this.getCommunityMemories('all');
    const idx = all.findIndex(m => m.id === id);
    if (idx !== -1) {
      all[idx].status = status;
      if (notes) all[idx].reviewer_notes = notes;
      all[idx].updated_at = new Date().toISOString();
      await this.updateSiteSettings({ church_community_memories_data: JSON.stringify(all) });
    }
    return true;
  },

  async updateCommunityMemory(id: string, payload: Partial<CommunityMemory>): Promise<boolean> {
    try {
      await supabase.from('church_community_memories').update({
        ...payload,
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.warn('DB update failed, fallback', e);
    }

    const all = await this.getCommunityMemories('all');
    const idx = all.findIndex(m => m.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...payload, updated_at: new Date().toISOString() };
      await this.updateSiteSettings({ church_community_memories_data: JSON.stringify(all) });
    }
    return true;
  },

  async deleteCommunityMemory(id: string): Promise<boolean> {
    try {
      await supabase.from('church_community_memories').delete().eq('id', id);
    } catch (e) {
      console.warn('DB delete failed, fallback', e);
    }

    const all = await this.getCommunityMemories('all');
    const filtered = all.filter(m => m.id !== id);
    await this.updateSiteSettings({ church_community_memories_data: JSON.stringify(filtered) });
    return true;
  },

  async likeCommunityMemory(id: string): Promise<number> {
    const all = await this.getCommunityMemories('all');
    const idx = all.findIndex(m => m.id === id);
    let newLikes = 1;
    if (idx !== -1) {
      all[idx].likes_count = (all[idx].likes_count || 0) + 1;
      newLikes = all[idx].likes_count;
      await this.updateSiteSettings({ church_community_memories_data: JSON.stringify(all) });
    }
    try {
      await (supabase.rpc as any)('increment_memory_likes', { memory_id: id });
    } catch (e) {}
    return newLikes;
  }
};

// ── Google Drive Album Parser Helper ──
export const extractGoogleDriveFolderImages = async (folderUrl: string, apiKey?: string): Promise<string[]> => {
  try {
    const match = folderUrl.match(/folders\/([a-zA-Z0-9-_]{25,45})/) || folderUrl.match(/id=([a-zA-Z0-9-_]{25,45})/);
    if (!match) throw new Error('رابط مجلد Google Drive غير صالح. يرجى التأكد من الرابط.');
    
    const folderId = match[1];

    // Method 1: Try official Google Drive API if apiKey is provided
    if (apiKey) {
      try {
        console.log('Attempting official Google Drive API...');
        const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&key=${apiKey}&fields=files(id,name)&pageSize=100`;
        const res = await fetch(driveApiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            console.log(`Successfully fetched ${data.files.length} images from official Google Drive API.`);
            return data.files.map((file: any) => `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn('Official Google Drive API failed with status:', res.status, errData);
        }
      } catch (driveErr) {
        console.warn('Official Google Drive API request failed, falling back to proxy scraper:', driveErr);
      }
    }

    // Method 2: Fallback Proxy Scraper
    console.log('Falling back to proxy scraper...');
    const targetUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
    
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
    ];

    let html = '';
    let success = false;
    let lastError: any = null;

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) continue;

        if (proxyUrl.includes('allorigins')) {
          const json = await res.json();
          html = json.contents;
        } else {
          html = await res.text();
        }

        if (html && (html.includes('drive-viewer') || html.includes('id="drive-contents"') || html.includes('drive-contents') || html.includes('folders/'))) {
          success = true;
          break;
        }
      } catch (e) {
        lastError = e;
        console.warn(`Proxy failed: ${proxyUrl}`, e);
      }
    }

    if (!success) {
      throw new Error(
        lastError?.message || 'فشل الاتصال بـ Google Drive عبر جميع الخوادم البديلة. يرجى التأكد من مشاركة المجلد للعامة أو تفعيل Google Drive API.'
      );
    }
    
    const idRegex = /"([a-zA-Z0-9-_]{28,40})"/g;
    const ids: string[] = [];
    let m;
    while ((m = idRegex.exec(html)) !== null) {
      const id = m[1];
      if (!ids.includes(id) && id !== folderId && id.length >= 28 && id.length <= 35) {
        ids.push(id);
      }
    }
    
    if (ids.length === 0) {
      throw new Error('لم يتم العثور على ملفات عامة بالمجلد. تأكد من جعل المجلد متاحاً للجميع (Anyone with link can view).');
    }
    
    return ids.map(id => `https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
  } catch (err: any) {
    console.error('Error extracting images:', err);
    throw err;
  }
};


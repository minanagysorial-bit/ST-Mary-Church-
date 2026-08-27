export type DayOfWeekArabic = 
  | 'الجمعة' 
  | 'الأحد' 
  | 'السبت' 
  | 'الخميس' 
  | 'الأربعاء' 
  | 'الثلاثاء' 
  | 'الإثنين';

export interface ServiceScheduleConfig {
  priest_ids: string[];
  leader_ids: string[];
  day_of_week?: DayOfWeekArabic;
  start_time?: string; // e.g. "09:00"
  end_time?: string;   // e.g. "11:30"
  notes?: string;
}

export type AttendanceStatusType = 'OVERDUE' | 'COMPLETED' | 'PENDING';

export interface AttendanceStatusResult {
  status: AttendanceStatusType;
  isOverdue: boolean;
  targetDate: string; // YYYY-MM-DD
  dayName: DayOfWeekArabic;
  formattedTargetDate: string;
  message: string;
}

export interface ConsecutiveAbsentee {
  member_id: string;
  member_name: string;
  family_id: string;
  family_name: string;
  phone?: string | null;
  parent_phone?: string | null;
  consecutive_count: number;
  last_present_date?: string | null;
  last_absent_dates: string[];
}

export interface BirthdayItem {
  id: string;
  name: string;
  type: 'member' | 'servant';
  phone?: string | null;
  birth_date: string; // YYYY-MM-DD or MM-DD
  age?: number;
  is_today: boolean;
  days_until: number;
  family_name?: string;
  service_role?: string;
}

const ARABIC_DAYS_MAP: Record<number, DayOfWeekArabic> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت'
};

const DAY_INDEX_MAP: Record<DayOfWeekArabic, number> = {
  'الأحد': 0,
  'الإثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6
};

// Default service schedules for church services
export const DEFAULT_SERVICE_SCHEDULES: Record<string, { day: DayOfWeekArabic; start: string; end: string }> = {
  'ابتدائي بنين': { day: 'الجمعة', start: '14:30', end: '17:00' },
  'ابتدائي بنات': { day: 'الجمعة', start: '10:30', end: '13:00' },
  'فتيان إعدادي': { day: 'الجمعة', start: '16:30', end: '19:00' },
  'فتيات إعدادي': { day: 'الجمعة', start: '11:00', end: '13:30' },
  'شباب ثانوي': { day: 'الجمعة', start: '09:00', end: '11:30' },
  'شابات ثانوي': { day: 'الخميس', start: '18:00', end: '20:30' },
  'خدمة شباب جامعة': { day: 'الثلاثاء', start: '19:00', end: '21:30' },
  'خدمة شابات جامعة': { day: 'الخميس', start: '19:00', end: '21:30' },
  'خريجين': { day: 'الأحد', start: '19:00', end: '21:30' },
  'عرس قانا الجليل': { day: 'الأربعاء', start: '19:00', end: '21:30' }
};

/**
 * Calculates the most recent target date for a service day of the week
 */
export function getMostRecentServiceDate(serviceDay: DayOfWeekArabic, now = new Date()): Date {
  const targetDayIndex = DAY_INDEX_MAP[serviceDay];
  const currentDayIndex = now.getDay();
  
  let daysDiff = currentDayIndex - targetDayIndex;
  if (daysDiff < 0) {
    daysDiff += 7;
  }
  
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - daysDiff);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Evaluates whether attendance is OVERDUE, COMPLETED, or PENDING for a given family
 */
export function checkFamilyAttendanceStatus(
  familyId: string,
  familyName: string,
  categoryName: string,
  scheduleConfig?: ServiceScheduleConfig,
  recordedDatesForFamily: string[] = [] // List of dates YYYY-MM-DD for which attendance was recorded
): AttendanceStatusResult {
  const defaultSched = DEFAULT_SERVICE_SCHEDULES[categoryName] || { day: 'الجمعة', start: '09:00', end: '11:30' };
  const serviceDay: DayOfWeekArabic = scheduleConfig?.day_of_week || defaultSched.day;
  const endTime = scheduleConfig?.end_time || defaultSched.end;

  const now = new Date();
  const targetServiceDate = getMostRecentServiceDate(serviceDay, now);
  const targetDateStr = formatDateToYYYYMMDD(targetServiceDate);

  const isRecorded = recordedDatesForFamily.includes(targetDateStr);
  const formattedDate = targetServiceDate.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (isRecorded) {
    return {
      status: 'COMPLETED',
      isOverdue: false,
      targetDate: targetDateStr,
      dayName: serviceDay,
      formattedTargetDate: formattedDate,
      message: `تم تسجيل الحضور والغياب لأسرة ${familyName} بنجاح ✅`
    };
  }

  // Check if current time has passed the deadline
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const deadlineDate = new Date(targetServiceDate);
  deadlineDate.setHours(endHours || 12, endMinutes || 0, 0, 0);

  const hasDeadlinePassed = now.getTime() > deadlineDate.getTime();

  if (hasDeadlinePassed) {
    return {
      status: 'OVERDUE',
      isOverdue: true,
      targetDate: targetDateStr,
      dayName: serviceDay,
      formattedTargetDate: formattedDate,
      message: `لم يتم تسجيل الغياب لأسرة ${familyName} يوم ${serviceDay} (${formattedDate})`
    };
  }

  return {
    status: 'PENDING',
    isOverdue: false,
    targetDate: targetDateStr,
    dayName: serviceDay,
    formattedTargetDate: formattedDate,
    message: `موعد خدمة أسرة ${familyName} القادم يوم ${serviceDay} (${formattedDate})`
  };
}

/**
 * Analyzes records and detects members with 2+ consecutive absences
 */
export function findConsecutiveAbsentees(
  members: Array<{ id: string; full_name: string; family_id?: string; phone?: string | null; notes?: string | null }>,
  attendanceRecords: Array<{ member_id: string; date: string; present: boolean; family_id: string }>,
  familyNamesMap: Record<string, string> = {},
  threshold = 2
): ConsecutiveAbsentee[] {
  // Get all unique dates sorted chronologically descending
  const dateSet = new Set(attendanceRecords.map(r => r.date));
  const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length < threshold) {
    return [];
  }

  const results: ConsecutiveAbsentee[] = [];

  members.forEach(member => {
    const memberRecords = attendanceRecords.filter(r => r.member_id === member.id);
    if (memberRecords.length === 0) return;

    // Find the dates this member has attendance records for
    const datesWithRecords = Array.from(new Set(memberRecords.map(r => r.date))).sort((a, b) => b.localeCompare(a));
    
    // Check recent meetings
    let consecutiveAbsences = 0;
    const absentDates: string[] = [];
    let lastPresentDate: string | null = null;

    for (const date of datesWithRecords) {
      const rec = memberRecords.find(r => r.date === date);
      if (rec && !rec.present) {
        consecutiveAbsences++;
        absentDates.push(date);
      } else if (rec && rec.present) {
        if (!lastPresentDate) lastPresentDate = date;
        break; // Streak broken
      }
    }

    if (consecutiveAbsences >= threshold) {
      const famId = member.family_id || memberRecords[0]?.family_id || '';
      results.push({
        member_id: member.id,
        member_name: member.full_name,
        family_id: famId,
        family_name: familyNamesMap[famId] || 'الأسرة الكنسية',
        phone: member.phone,
        parent_phone: member.notes?.match(/(?:01\d{9}|tel:[\d]+)/)?.[0] || member.phone,
        consecutive_count: consecutiveAbsences,
        last_present_date: lastPresentDate,
        last_absent_dates: absentDates
      });
    }
  });

  return results;
}

/**
 * Extracts and calculates upcoming birthdays (today or next 7 days)
 */
export function getUpcomingBirthdays(
  members: Array<{ id: string; full_name: string; birth_date?: string | null; phone?: string | null; family_name?: string }>,
  servants: Array<{ id: string; full_name: string; phone?: string | null; role?: string }> = []
): BirthdayItem[] {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();

  const list: BirthdayItem[] = [];

  const checkItem = (
    id: string,
    name: string,
    rawBirthDate: string | null | undefined,
    phone: string | null | undefined,
    type: 'member' | 'servant',
    extra?: { family_name?: string; service_role?: string }
  ) => {
    if (!rawBirthDate) return;

    // Support YYYY-MM-DD or MM-DD or DD/MM/YYYY
    let birthMonth = 0;
    let birthDay = 0;
    let birthYear: number | undefined;

    if (rawBirthDate.includes('-')) {
      const parts = rawBirthDate.split('-');
      if (parts.length === 3) {
        birthYear = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10);
        birthDay = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        birthMonth = parseInt(parts[0], 10);
        birthDay = parseInt(parts[1], 10);
      }
    } else if (rawBirthDate.includes('/')) {
      const parts = rawBirthDate.split('/');
      if (parts.length === 3) {
        birthDay = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10);
        birthYear = parseInt(parts[2], 10);
      }
    }

    if (!birthMonth || !birthDay) return;

    // Calculate this year's birthday date
    let targetBday = new Date(currentYear, birthMonth - 1, birthDay);
    
    // If passed by more than 7 days, check next year
    const diffTime = targetBday.getTime() - today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      const isToday = birthMonth === currentMonth && birthDay === currentDay;
      const age = birthYear ? currentYear - birthYear : undefined;

      list.push({
        id,
        name,
        type,
        phone: phone || null,
        birth_date: rawBirthDate,
        age,
        is_today: isToday,
        days_until: diffDays,
        family_name: extra?.family_name,
        service_role: extra?.service_role
      });
    }
  };

  members.forEach(m => checkItem(m.id, m.full_name, m.birth_date, m.phone, 'member', { family_name: m.family_name }));
  servants.forEach(s => checkItem(s.id, s.full_name, null, s.phone, 'servant', { service_role: s.role }));

  return list.sort((a, b) => a.days_until - b.days_until);
}

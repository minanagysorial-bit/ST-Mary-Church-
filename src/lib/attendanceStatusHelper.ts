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
  'ابتدائي بنين': { day: 'الجمعة', start: '08:30', end: '11:00' },
  'ابتدائي بنات': { day: 'الجمعة', start: '08:30', end: '11:00' },
  'فتيان إعدادي': { day: 'الجمعة', start: '09:00', end: '11:30' },
  'فتيات إعدادي': { day: 'الجمعة', start: '09:00', end: '11:30' },
  'شباب ثانوي': { day: 'الجمعة', start: '10:00', end: '12:30' },
  'شابات ثانوي': { day: 'الجمعة', start: '10:00', end: '12:30' },
  'خدمة شباب جامعة': { day: 'الأحد', start: '18:00', end: '20:30' },
  'خدمة شابات جامعة': { day: 'الأحد', start: '18:00', end: '20:30' },
  'خريجين': { day: 'الخميس', start: '19:00', end: '21:30' }
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
  const isToday = now.toDateString() === targetServiceDate.toDateString();
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
    message: `في انتظار موعد الخدمة وتفريغ الحضور لأسرة ${familyName}`
  };
}

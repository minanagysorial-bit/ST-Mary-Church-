// ===================================================================
// Priest Personal Agenda, Google Calendar & Notification Helper
// ===================================================================

import { Liturgy, Sermon, ChurchService } from './database.types';
import { parseLiturgyNotes, PRIEST_NAMES_LIST } from '../pages/priest/PriestLiturgiesPage';
import { getCopticDate } from './copticReadings';

export type PriestEventType = 
  | 'liturgy'     // قداس إلهي
  | 'vespers'     // عشية / تمجيد / تسبيحة
  | 'wedding'     // إكليل / فرح
  | 'baptism'     // معمودية
  | 'meeting'     // اجتماع خدمة / شباب / مدارس أحد
  | 'sermon'      // عظة / كلمة روحية
  | 'visitation'  // افتقاد خاص / رعاية
  | 'unction'     // صلاة قنديل / تبريك
  | 'other';      // موعد شخصي / مناسبة أخرى

export interface PriestPersonalEvent {
  id: string;
  priest_name: string;
  event_type: PriestEventType;
  title: string;
  date: string;         // YYYY-MM-DD
  day_name: string;     // السبت، الأحد...
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  location: string;     // الكنيسة / القاعة / العنوان
  notes?: string;
  created_at: string;
}

export interface UnifiedPriestDuty {
  id: string;
  sourceType: 'liturgy' | 'vespers' | 'sermon' | 'service' | 'custom_event';
  dutyType: PriestEventType;
  title: string;
  priestName: string;
  dayName: string;
  dateStr?: string;       // YYYY-MM-DD or e.g. "12 سبتمبر"
  copticDateStr?: string;
  dateObj?: Date;
  startTime: string;      // HH:MM
  endTime: string;        // HH:MM
  location: string;
  description: string;
  isToday: boolean;
  canEditOrDelete?: boolean;
}

const STORAGE_KEY_PREFIX = 'st_mary_priest_custom_events_';

// ── 1. Storage Helpers for Custom Priest Appointments ────────
export const getStoredPriestEvents = (priestName: string): PriestPersonalEvent[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${priestName}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading priest custom events', err);
    return [];
  }
};

export const savePriestCustomEvent = (event: Omit<PriestPersonalEvent, 'id' | 'created_at'> & { id?: string }): PriestPersonalEvent => {
  const events = getStoredPriestEvents(event.priest_name);
  const newEvent: PriestPersonalEvent = {
    ...event,
    id: event.id || `pe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const existingIndex = events.findIndex(e => e.id === newEvent.id);
  let updated: PriestPersonalEvent[];
  if (existingIndex >= 0) {
    updated = events.map(e => e.id === newEvent.id ? newEvent : e);
  } else {
    updated = [newEvent, ...events];
  }

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${event.priest_name}`, JSON.stringify(updated));
  return newEvent;
};

export const deletePriestCustomEvent = (priestName: string, eventId: string): void => {
  const events = getStoredPriestEvents(priestName);
  const filtered = events.filter(e => e.id !== eventId);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${priestName}`, JSON.stringify(filtered));
};

// ── 2. Unified Agenda Aggregator ──────────────────────────────
export const aggregatePriestSchedule = (
  priestName: string,
  liturgies: Liturgy[],
  sermons: Sermon[] = [],
  services: ChurchService[] = [],
  customEvents: PriestPersonalEvent[] = []
): {
  allDuties: UnifiedPriestDuty[];
  todayDuties: UnifiedPriestDuty[];
  weekDutiesByDay: Record<string, UnifiedPriestDuty[]>;
} => {
  const now = new Date();
  const currentDayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });
  const allDuties: UnifiedPriestDuty[] = [];

  const ALL_DAYS_ORDER = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // A. Filter Liturgies & Vespers where this priest is assigned
  for (const l of liturgies) {
    const parsed = parseLiturgyNotes(l.notes);
    const isAssigned = parsed.priests.some(p => p.includes(priestName) || priestName.includes(p));
    const isSermonPreacher = parsed.hasSermon && (parsed.sermonSpeaker.includes(priestName) || priestName.includes(parsed.sermonSpeaker));

    if (isAssigned || isSermonPreacher) {
      const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
      const isToday = l.liturgy_day === currentDayName;

      allDuties.push({
        id: `lit_${l.id}`,
        sourceType: isVesper ? 'vespers' : 'liturgy',
        dutyType: isVesper ? 'vespers' : 'liturgy',
        title: isSermonPreacher && !isAssigned ? `عظة وكلمة: ${l.title}` : l.title,
        priestName: priestName,
        dayName: l.liturgy_day,
        startTime: l.start_time,
        endTime: l.end_time,
        location: `${l.church_name} - ${l.altar_name}`,
        description: `الكهنة المصلون: ${parsed.priests.join(' • ')}${parsed.hasSermon ? ` | ملقي العظة: ${parsed.sermonSpeaker}` : ''}`,
        isToday,
        canEditOrDelete: false,
      });
    }
  }

  // B. Filter Sermons where this priest is speaker
  for (const s of sermons) {
    if (s.speaker && (s.speaker.includes(priestName) || priestName.includes(s.speaker))) {
      let dObj: Date | undefined;
      let dayName = 'الجمعة';
      let isToday = false;

      if (s.sermon_date) {
        dObj = new Date(s.sermon_date);
        dayName = dObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        isToday = dObj.toDateString() === now.toDateString();
      }

      allDuties.push({
        id: `sermon_${s.id}`,
        sourceType: 'sermon',
        dutyType: 'sermon',
        title: `عظة: ${s.title}`,
        priestName: priestName,
        dayName,
        dateStr: s.sermon_date || undefined,
        dateObj: dObj,
        startTime: '19:00',
        endTime: '20:30',
        location: 'كنيسة السيدة العذراء مريم بمحرم بك',
        description: `الموضوع: ${s.topic || s.title}`,
        isToday,
        canEditOrDelete: false,
      });
    }
  }

  // C. Filter Church Services assigned to this priest
  for (const srv of services) {
    const isResponsible = srv.description && (srv.description.includes(priestName) || priestName.includes(srv.description));
    if (isResponsible) {
      allDuties.push({
        id: `srv_${srv.id}`,
        sourceType: 'service',
        dutyType: 'meeting',
        title: `خدمة: ${srv.name}`,
        priestName: priestName,
        dayName: 'الجمعة',
        startTime: '17:00',
        endTime: '19:00',
        location: 'مبنى الخدمات والأنشطة',
        description: srv.description || `مسؤولية رعاية ${srv.name}`,
        isToday: currentDayName === 'الجمعة',
        canEditOrDelete: false,
      });
    }
  }

  // D. Custom Priest Events (Weddings, Baptisms, Meetings, Private appointments)
  for (const pe of customEvents) {
    let isToday = false;
    let dObj: Date | undefined;

    if (pe.date) {
      dObj = new Date(pe.date);
      isToday = dObj.toDateString() === now.toDateString();
    } else {
      isToday = pe.day_name === currentDayName;
    }

    allDuties.push({
      id: pe.id,
      sourceType: 'custom_event',
      dutyType: pe.event_type,
      title: pe.title,
      priestName: pe.priest_name,
      dayName: pe.day_name,
      dateStr: pe.date,
      dateObj: dObj,
      startTime: pe.start_time,
      endTime: pe.end_time,
      location: pe.location,
      description: pe.notes || '',
      isToday,
      canEditOrDelete: true,
    });
  }

  // Sort duties chronologically
  allDuties.sort((a, b) => {
    const dayDiff = ALL_DAYS_ORDER.indexOf(a.dayName) - ALL_DAYS_ORDER.indexOf(b.dayName);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const todayDuties = allDuties.filter(d => d.isToday);

  // Group by Day Name
  const weekDutiesByDay: Record<string, UnifiedPriestDuty[]> = {
    'السبت': [],
    'الأحد': [],
    'الاثنين': [],
    'الثلاثاء': [],
    'الأربعاء': [],
    'الخميس': [],
    'الجمعة': [],
  };

  for (const duty of allDuties) {
    if (weekDutiesByDay[duty.dayName]) {
      weekDutiesByDay[duty.dayName].push(duty);
    }
  }

  return {
    allDuties,
    todayDuties,
    weekDutiesByDay,
  };
};

// ── 3. Google Calendar URL Generator ───────────────────────────
export const createGoogleCalendarUrl = (duty: UnifiedPriestDuty): string => {
  // Determine date
  const now = new Date();
  let targetDate = new Date();

  if (duty.dateObj) {
    targetDate = new Date(duty.dateObj);
  } else {
    // calculate next occurrence of duty.dayName
    const dayMap: Record<string, number> = {
      'الأحد': 0,
      'الاثنين': 1,
      'الثلاثاء': 2,
      'الأربعاء': 3,
      'الخميس': 4,
      'الجمعة': 5,
      'السبت': 6,
    };
    const targetDayIdx = dayMap[duty.dayName] ?? now.getDay();
    const currentDayIdx = now.getDay();
    let daysAhead = targetDayIdx - currentDayIdx;
    if (daysAhead < 0) daysAhead += 7;
    targetDate.setDate(now.getDate() + daysAhead);
  }

  const [startHour, startMin] = (duty.startTime || '07:00').split(':').map(Number);
  const [endHour, endMin] = (duty.endTime || '09:00').split(':').map(Number);

  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), startHour || 7, startMin || 0);
  const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), endHour || 9, endMin || 0);

  const formatGDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `كنيسة السيدة العذراء - ${duty.title}`,
    dates: `${formatGDate(startDate)}/${formatGDate(endDate)}`,
    details: `${duty.description}\nالكاهن المسؤول: ${duty.priestName}\nالمكان: ${duty.location}`,
    location: duty.location || 'كنيسة السيدة العذراء مريم - محرم بك',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ── 4. Apple Calendar / Outlook / iCal (.ics) Generator ─────────
export const downloadIcsSchedule = (duties: UnifiedPriestDuty[], filename = 'جدول_الكاهن.ics') => {
  if (duties.length === 0) return;

  const now = new Date();
  const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//St Mary Moharam Bek//Priest Schedule//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:جدول الآباء الكهنة - كنيسة السيدة العذراء',
    'X-WR-TIMEZONE:Africa/Cairo',
  ];

  for (const duty of duties) {
    let targetDate = new Date();
    if (duty.dateObj) {
      targetDate = new Date(duty.dateObj);
    } else {
      const dayMap: Record<string, number> = {
        'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
      };
      const targetDayIdx = dayMap[duty.dayName] ?? now.getDay();
      let daysAhead = targetDayIdx - now.getDay();
      if (daysAhead < 0) daysAhead += 7;
      targetDate.setDate(now.getDate() + daysAhead);
    }

    const [startH, startM] = (duty.startTime || '07:00').split(':').map(Number);
    const [endH, endM] = (duty.endTime || '09:00').split(':').map(Number);

    const sDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), startH, startM);
    const eDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), endH, endM);

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${duty.id}-${Date.now()}@stmarymoharambek.com`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(sDate)}`,
      `DTEND:${formatIcsDate(eDate)}`,
      `SUMMARY:${duty.title}`,
      `DESCRIPTION:${duty.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${duty.location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:تذكير: ${duty.title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

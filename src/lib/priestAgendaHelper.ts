// ===================================================================
// Priest Personal Agenda, Google Calendar, Printing & Notification Helper
// ===================================================================

import { Liturgy, Sermon, ChurchService } from './database.types';
import { parseLiturgyNotes, PRIEST_NAMES_LIST } from '../pages/priest/PriestLiturgiesPage';
import { getCopticDate } from './copticReadings';

export type PriestEventType = 
  | 'liturgy'     // قداس إلهي ⛪
  | 'vespers'     // عشية / تمجيد / تسبيحة 🕯️
  | 'wedding'     // إكليل / فرح 💍
  | 'baptism'     // معمودية 🕊️
  | 'confession'  // جلسة اعتراف ✝️
  | 'visitation'  // افتقاد خاص / زيارة مريض 🏠
  | 'unction'     // صلاة قنديل / تبريك 🌿
  | 'meeting'     // اجتماع خدمة / شباب / مدارس أحد 👥
  | 'sermon'      // عظة / كلمة روحية 🎤
  | 'other';      // موعد شخصي / مناسبة كنسية 📅

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
  contact_phone?: string;
  created_at: string;
}

export interface UnifiedPriestDuty {
  id: string;
  sourceType: 'liturgy' | 'vespers' | 'sermon' | 'service' | 'custom_event';
  dutyType: PriestEventType;
  title: string;
  priestName: string;
  dayName: string;
  dateStr?: string;       // YYYY-MM-DD
  copticDateStr?: string;
  dateObj?: Date;
  startTime: string;      // HH:MM
  endTime: string;        // HH:MM
  location: string;
  description: string;
  isToday: boolean;
  canEditOrDelete?: boolean;
  contactPhone?: string;
}

const STORAGE_KEY_PREFIX = 'st_mary_priest_custom_events_';

// ── Fuzzy Priest Name Matching Helper ──────────────────────────
export const normalizePriestName = (name: string): string => {
  return (name || '')
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/^(القمص|القس|ابونا|أبونا)\s+/, '')
    .trim();
};

export const matchesPriest = (targetName: string, queryName: string): boolean => {
  if (!targetName || !queryName) return false;
  const n1 = normalizePriestName(targetName);
  const n2 = normalizePriestName(queryName);
  return n1.includes(n2) || n2.includes(n1);
};

// ── 1. Storage Helpers for Custom Priest Appointments ──────────
export const getStoredPriestEvents = (priestName: string): PriestPersonalEvent[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${normalizePriestName(priestName)}`);
    if (!raw) {
      // Check legacy exact key
      const legacyRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${priestName}`);
      if (legacyRaw) return JSON.parse(legacyRaw);
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading priest custom events', err);
    return [];
  }
};

export const savePriestCustomEvent = (event: Omit<PriestPersonalEvent, 'id' | 'created_at'> & { id?: string }): PriestPersonalEvent => {
  const norm = normalizePriestName(event.priest_name);
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

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${norm}`, JSON.stringify(updated));
  return newEvent;
};

export const deletePriestCustomEvent = (priestName: string, eventId: string): void => {
  const norm = normalizePriestName(priestName);
  const events = getStoredPriestEvents(priestName);
  const filtered = events.filter(e => e.id !== eventId);
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${norm}`, JSON.stringify(filtered));
};

// ── 2. Time & Date Formatting in Arabic ─────────────────────────
export const formatArabicTime = (time: string): string => {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const suffix = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${suffix}`;
};

export const ALL_DAYS_ORDER = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

// ── 3. Unified Agenda Aggregator ──────────────────────────────
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
  stats: {
    totalLiturgies: number;
    totalVespers: number;
    totalWeddings: number;
    totalBaptisms: number;
    totalMeetings: number;
    totalSermons: number;
    totalConfessions: number;
    totalVisitations: number;
  };
} => {
  const now = new Date();
  const currentDayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });
  const allDuties: UnifiedPriestDuty[] = [];

  // A. Filter Liturgies & Vespers
  for (const l of liturgies) {
    const parsed = parseLiturgyNotes(l.notes);
    const isAssigned = parsed.priests.some(p => matchesPriest(p, priestName) || p.includes('آباء الكنيسة'));
    const isSermonPreacher = parsed.hasSermon && matchesPriest(parsed.sermonSpeaker, priestName);

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

  // B. Filter Sermons
  for (const s of sermons) {
    if (s.speaker && matchesPriest(s.speaker, priestName)) {
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
        description: `موضوع العظة: ${s.topic || s.title}`,
        isToday,
        canEditOrDelete: false,
      });
    }
  }

  // C. Filter Church Services
  for (const srv of services) {
    const isResponsible = srv.description && matchesPriest(srv.description, priestName);
    if (isResponsible) {
      allDuties.push({
        id: `srv_${srv.id}`,
        sourceType: 'service',
        dutyType: 'meeting',
        title: `إشراف خدمة: ${srv.name}`,
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

  // D. Custom Priest Appointments (Weddings, Baptisms, Confessions, Visitations...)
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
      contactPhone: pe.contact_phone,
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

  let totalLiturgies = 0;
  let totalVespers = 0;
  let totalWeddings = 0;
  let totalBaptisms = 0;
  let totalMeetings = 0;
  let totalSermons = 0;
  let totalConfessions = 0;
  let totalVisitations = 0;

  for (const duty of allDuties) {
    if (weekDutiesByDay[duty.dayName]) {
      weekDutiesByDay[duty.dayName].push(duty);
    }

    switch (duty.dutyType) {
      case 'liturgy': totalLiturgies++; break;
      case 'vespers': totalVespers++; break;
      case 'wedding': totalWeddings++; break;
      case 'baptism': totalBaptisms++; break;
      case 'meeting': totalMeetings++; break;
      case 'sermon': totalSermons++; break;
      case 'confession': totalConfessions++; break;
      case 'visitation': case 'unction': totalVisitations++; break;
    }
  }

  return {
    allDuties,
    todayDuties,
    weekDutiesByDay,
    stats: {
      totalLiturgies,
      totalVespers,
      totalWeddings,
      totalBaptisms,
      totalMeetings,
      totalSermons,
      totalConfessions,
      totalVisitations,
    }
  };
};

// ── 4. Google Calendar URL Generator ───────────────────────────
export const createGoogleCalendarUrl = (duty: UnifiedPriestDuty): string => {
  const now = new Date();
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

  const [startHour, startMin] = (duty.startTime || '07:00').split(':').map(Number);
  const [endHour, endMin] = (duty.endTime || '09:00').split(':').map(Number);

  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), startHour || 7, startMin || 0);
  const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), endHour || 9, endMin || 0);

  const formatGDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `كنيسة العذراء محرم بك - ${duty.title}`,
    dates: `${formatGDate(startDate)}/${formatGDate(endDate)}`,
    details: `${duty.description ? `${duty.description}\n` : ''}الكاهن المسؤول: ${duty.priestName}\nالمكان: ${duty.location}${duty.contactPhone ? `\nهاتف التواصل: ${duty.contactPhone}` : ''}`,
    location: duty.location || 'كنيسة السيدة العذراء مريم - محرم بك',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// ── 5. Apple / Outlook / Android Calendar (.ics) Generator ─────
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
      `DESCRIPTION:${(duty.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${duty.location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:تذكير كنسي: ${duty.title}`,
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

// ── 6. Print Priest Schedule Sheet ─────────────────────────────
export const printPriestSchedule = (priestName: string, duties: UnifiedPriestDuty[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const coptic = getCopticDate(now);

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>جدول ومسؤوليات ${priestName} - كنيسة السيدة العذراء مريم بمحرم بك</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 20px;
          color: #00174a;
          direction: rtl;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #d4af37;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
          color: #002366;
        }
        .header h2 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #b8860b;
        }
        .header p {
          margin: 0;
          font-size: 13px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 14px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 10px 12px;
          text-align: right;
        }
        th {
          background-color: #002366;
          color: #fed65b;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 11px;
          background: #eef2ff;
          color: #002366;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>كنيسة السيدة العذراء مريم - محرم بك بالإسكندرية</h1>
        <h2>جدول ومسؤوليات قدس الأب الموقر: ${priestName}</h2>
        <p>التاريخ الميلادي: ${dateStr} | التاريخ القبطي: ${coptic.copticDay} ${coptic.copticMonthName} ${coptic.copticYear} ش</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 12%;">اليوم</th>
            <th style="width: 18%;">الموعد</th>
            <th style="width: 15%;">نوع الخدمة</th>
            <th style="width: 25%;">المكان / المذبح</th>
            <th style="width: 30%;">التفاصيل والملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${duties.map(d => `
            <tr>
              <td><strong>${d.dayName}</strong>${d.dateStr ? `<br><small style="color:#666">${d.dateStr}</small>` : ''}</td>
              <td>من ${formatArabicTime(d.startTime)} إلى ${formatArabicTime(d.endTime)}</td>
              <td><span class="badge">${d.title}</span></td>
              <td>${d.location}</td>
              <td>${d.description || '-'}${d.contactPhone ? `<br><small>هاتف: ${d.contactPhone}</small>` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        صلوا من أجل سلام الكنيسة والآباء الكهنة وجميع الخدام والشعب
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ── 7. Daily Spiritual & Duty Summary for Priest ────────────────
export const getPriestDailySummary = (priestName: string, todayDuties: UnifiedPriestDuty[]): string => {
  if (todayDuties.length === 0) {
    return `صباح الخير والبركة يا قدس أبونا .. لا توجد قداسات أو مواعيد مسجلة اليوم. يوم مبارك ومقدس. 🕊️`;
  }

  const titles = todayDuties.map(d => `«${d.title}» (${formatArabicTime(d.startTime)})`).join(' و ');
  return `بركة صلواتك يا قدس أبونا .. لديك اليوم (${todayDuties.length}) خدمات ومواعيد مقررة: ${titles}. ⛪`;
};

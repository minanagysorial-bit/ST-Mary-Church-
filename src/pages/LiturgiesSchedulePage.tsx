import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, Liturgy } from '../lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  User,
  ChevronRight,
  ChevronLeft,
  Sun,
  Layers,
  CalendarDays
} from 'lucide-react';
import { getCopticDate } from '../lib/copticReadings';

export const PRIEST_NAMES_LIST = [
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه'
];

export const LiturgiesSchedulePage: React.FC = () => {
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthName = useMemo(() => {
    return now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [now]);

  const todayFullDate = useMemo(() => {
    const coptic = getCopticDate(now);
    const gregorian = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return {
      gregorian,
      coptic: coptic.copticDateString,
      dayName: now.toLocaleDateString('ar-EG', { weekday: 'long' }),
      dayNumber: now.getDate()
    };
  }, [now]);

  // Generate Weeks strictly for Current Month
  const currentMonthWeeks = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeks = [];

    let currentDay = 1;
    let weekIndex = 1;

    while (currentDay <= totalDays) {
      const startDay = currentDay;
      const endDay = Math.min(currentDay + 6, totalDays);
      const days = [];

      for (let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        const matchedDayName = DAYS_OF_WEEK.find(x => dayName.includes(x)) || 'الأحد';
        const isToday = now.getDate() === d;
        const coptic = getCopticDate(dateObj);

        days.push({
          dayNumber: d,
          dateObj,
          dayName,
          matchedDayName,
          isToday,
          copticString: coptic.copticDateString
        });
      }

      const containsToday = now.getDate() >= startDay && now.getDate() <= endDay;

      weeks.push({
        weekIndex,
        label: `الأسبوع ${weekIndex === 1 ? 'الأول' : weekIndex === 2 ? 'الثاني' : weekIndex === 3 ? 'الثالث' : weekIndex === 4 ? 'الرابع' : 'الخامس'}`,
        rangeString: `${startDay} - ${endDay} ${now.toLocaleDateString('ar-EG', { month: 'long' })}`,
        startDay,
        endDay,
        containsToday,
        days
      });

      currentDay += 7;
      weekIndex++;
    }

    return weeks;
  }, [currentYear, currentMonth, now]);

  // Default active week is the week that contains today
  const initialWeekIndex = useMemo(() => {
    const found = currentMonthWeeks.findIndex(w => w.containsToday);
    return found !== -1 ? found : 0;
  }, [currentMonthWeeks]);

  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(initialWeekIndex);

  useEffect(() => {
    setActiveWeekIndex(initialWeekIndex);
  }, [initialWeekIndex]);

  const fetchLiturgies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLiturgies();
      setLiturgies(data);
    } catch (err: any) {
      console.error(err);
      setError('فشل تحميل جدول القداسات الكنسي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiturgies();
  }, []);

  const formatArabicTime = (time: string) => {
    if (!time) return '';
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const suffix = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutesStr} ${suffix}`;
  };

  // Helper to extract priest name from notes
  const extractPriestName = (liturgy: Liturgy): string => {
    if (!liturgy.notes) return 'آباء الكنيسة';
    const match = liturgy.notes.match(/(?:الكاهن(?:\s*المصلي)?[:\s]+)?(ابونا\s+[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)/);
    if (match) return match[1].trim();

    for (const p of PRIEST_NAMES_LIST) {
      if (liturgy.notes.includes(p)) return p;
    }
    return liturgy.notes.trim() || 'آباء الكنيسة';
  };

  // Grouped by Day of Week
  const groupedLiturgies = useMemo(() => {
    const groups: Record<string, Liturgy[]> = {};
    DAYS_OF_WEEK.forEach(d => {
      groups[d] = liturgies
        .filter(l => l.liturgy_day === d)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [liturgies]);

  const currentWeek = currentMonthWeeks[activeWeekIndex] || currentMonthWeeks[0];

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-10 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>{`جدول مواعيد القداسات لشهر ${currentMonthName}`} | كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content={`جدول مواعيد قداسات كنيسة السيدة العذراء بمحرم بك بالإسكندرية لشهر ${currentMonthName}. أسماء الآباء الكهنة المصلين، المذابح، والتوقيت.`} />
        <link rel="canonical" href="https://www.tibarthenos.com/schedule" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header Card (Month + Today's Date) */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-xl space-y-4 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
            <span>جدول القداسات الأسبوعية للشهر الحالي</span>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold text-[#fed65b] leading-tight">
            جدول قداسات شهر {currentMonthName}
          </h1>

          {/* Today Date Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-xs sm:text-sm font-bold">
            <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-slate-100 shadow-sm">
              <Sun className="w-4 h-4 text-[#fed65b]" />
              <span>تاريخ اليوم: {todayFullDate.gregorian}</span>
            </span>
            <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-[#fed65b] shadow-sm">
              <Calendar className="w-4 h-4" />
              <span>{todayFullDate.coptic}</span>
            </span>
          </div>
        </div>

        {/* Weekly Navigation Selector Bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveWeekIndex(prev => Math.max(0, prev - 1))}
              disabled={activeWeekIndex === 0}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الأسبوع السابق</span>
            </button>

            <div className="text-center">
              <span className="font-tajawal text-base font-extrabold text-[#002366] block">
                {currentWeek?.label} ({currentWeek?.rangeString})
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                شهر {currentMonthName} فقط
              </span>
            </div>

            <button
              onClick={() => setActiveWeekIndex(prev => Math.min(currentMonthWeeks.length - 1, prev + 1))}
              disabled={activeWeekIndex === currentMonthWeeks.length - 1}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 active:scale-95"
            >
              <span>الأسبوع التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Week Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
            {currentMonthWeeks.map((w, idx) => (
              <button
                key={w.weekIndex}
                onClick={() => setActiveWeekIndex(idx)}
                className={`py-2.5 px-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all text-xs font-bold border ${
                  activeWeekIndex === idx
                    ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md scale-[1.02]'
                    : w.containsToday
                    ? 'bg-amber-50/70 text-[#00174a] border-amber-300 hover:bg-amber-100/60'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{w.label}</span>
                  {w.containsToday && (
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]" title="الأسبوع الحالي" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold opacity-80">
                  {w.startDay} - {w.endDay}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Section: The Whole Week Displayed Together (الأسبوع على بعضه) */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-sm max-w-xl mx-auto">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل وتنسيق جدول القداسات...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 border border-rose-200 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button
              onClick={fetchLiturgies}
              className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          
          <div className="space-y-4 animate-fadeIn">
            {currentWeek?.days.map(dayItem => {
              const dayLiturgies = groupedLiturgies[dayItem.matchedDayName] || [];

              return (
                <div
                  key={dayItem.dayNumber}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm ${
                    dayItem.isToday
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    
                    {/* Day & Date Header Block */}
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-sm shrink-0 border ${
                        dayItem.isToday
                          ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        <span className="text-lg font-extrabold">{dayItem.dayNumber}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{dayItem.dayName}</span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-tajawal text-base font-extrabold text-[#002366]">
                            {dayItem.dayName} {dayItem.dayNumber} {now.toLocaleDateString('ar-EG', { month: 'long' })}
                          </h3>
                          {dayItem.isToday && (
                            <span className="text-[10px] bg-[#d4af37] text-[#00174a] px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                              اليوم ☀️
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-bold">
                          {dayItem.copticString}
                        </p>
                      </div>
                    </div>

                    {/* Liturgies for this Day */}
                    <div className="flex-1 w-full">
                      {dayLiturgies.length === 0 ? (
                        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-center">
                          <span className="text-xs text-slate-400 font-bold">لا توجد قداسات مقررة في هذا اليوم</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {dayLiturgies.map(l => {
                            const priestName = extractPriestName(l);

                            return (
                              <div
                                key={l.id}
                                className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-2.5 hover:bg-slate-50 transition-colors shadow-sm"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-tajawal text-sm font-extrabold text-[#002366]">
                                    {l.title}
                                  </span>
                                  <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                                    <span>{formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}</span>
                                  </span>
                                </div>

                                {/* Priest Name Badge */}
                                <div className="bg-white border border-amber-200/80 p-2 rounded-xl flex items-center gap-2 shadow-2xs">
                                  <div className="w-6 h-6 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold text-[10px] shrink-0">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold">الكاهن:</span>
                                    <span className="font-tajawal text-xs font-extrabold text-[#00174a]">
                                      {priestName}
                                    </span>
                                  </div>
                                </div>

                                {/* Location */}
                                <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                  <span>{l.church_name} • {l.altar_name}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        )}

      </div>
    </div>
  );
};

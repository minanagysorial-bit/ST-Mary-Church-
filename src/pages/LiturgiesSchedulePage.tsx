import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, Liturgy } from '../lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  Heart,
  List,
  Layers,
  CalendarDays,
  User,
  ChevronRight,
  ChevronLeft,
  Sun,
  ShieldCheck
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

  // View Mode: 'tabs' (focused day/week view) or 'month' (full month calendar schedule)
  const [viewMode, setViewMode] = useState<'tabs' | 'month'>('tabs');

  // Selected Month offset (0 = current month, +1 = next month, -1 = prev month)
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const now = useMemo(() => new Date(), []);
  
  // Current active month date object
  const currentViewDate = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return d;
  }, [now, monthOffset]);

  const currentMonthName = useMemo(() => {
    return currentViewDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [currentViewDate]);

  const todayFullDate = useMemo(() => {
    const coptic = getCopticDate(now);
    const gregorian = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return {
      gregorian,
      coptic: coptic.copticDateString,
      dayName: now.toLocaleDateString('ar-EG', { weekday: 'long' })
    };
  }, [now]);

  // Today's day name in Arabic
  const todayArabic = useMemo(() => {
    const found = DAYS_OF_WEEK.find(d => todayFullDate.dayName.includes(d));
    return found || 'الأحد';
  }, [todayFullDate]);

  const [activeDay, setActiveDay] = useState<string>('الأحد');

  useEffect(() => {
    setActiveDay(todayArabic);
  }, [todayArabic]);

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

  // Helper to extract priest name from notes or fallback
  const extractPriestName = (liturgy: Liturgy): string => {
    if (!liturgy.notes) return 'آباء الكنيسة';
    const match = liturgy.notes.match(/(?:الكاهن(?:\s*المصلي)?[:\s]+)?(ابونا\s+[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)/);
    if (match) return match[1].trim();

    // Check if any of our priests is directly mentioned
    for (const p of PRIEST_NAMES_LIST) {
      if (liturgy.notes.includes(p)) return p;
    }
    return liturgy.notes.trim() || 'آباء الكنيسة';
  };

  // Helper to extract clean notes without repeating priest name
  const extractCleanNotes = (notes: string | null): string | null => {
    if (!notes) return null;
    let clean = notes;
    PRIEST_NAMES_LIST.forEach(p => {
      clean = clean.replace(new RegExp(`(?:الكاهن(?:\\s*المصلي)?[:\\s]+)?${p}`, 'g'), '');
    });
    clean = clean.replace(/\|/g, '').trim();
    return clean.length > 0 ? clean : null;
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

  // Generate All Days of the Selected Month with their scheduled liturgies
  const monthDaysList = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const list = [];
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
      const matchedDayName = DAYS_OF_WEEK.find(d => dayName.includes(d)) || 'الأحد';
      const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
      const copticInfo = getCopticDate(dateObj);

      // Match liturgies for this day of week
      const dayLiturgies = (groupedLiturgies[matchedDayName] || []);

      list.push({
        dayNumber: day,
        dateObj,
        dayName,
        matchedDayName,
        isToday,
        copticString: copticInfo.copticDateString,
        liturgies: dayLiturgies
      });
    }
    return list;
  }, [currentViewDate, groupedLiturgies, now]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-12 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>{`جدول مواعيد القداسات لشهر ${currentMonthName}`} | كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content={`جدول مواعيد قداسات كنيسة السيدة العذراء بمحرم بك بالإسكندرية لشهر ${currentMonthName}. أسماء الآباء الكهنة المصلين، المذابح، والتوقيت.`} />
        <link rel="canonical" href="https://www.tibarthenos.com/schedule" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Month & Today Banner Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-xl space-y-4 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
            <span>جدول القداسات والخدمات الكنسية</span>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold text-[#fed65b] leading-tight">
            مواعيد قداسات شهر {currentMonthName}
          </h1>

          {/* Today Highlight Badge */}
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

        {/* View Mode & Month Navigation Toolbar */}
        <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Switch View Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('tabs')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'tabs'
                  ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>عرض الأيام واليوم الحالي</span>
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>عرض جدول الشهر كاملاً</span>
            </button>
          </div>

          {/* Month Switcher (When in Month View or General) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">الشهر السابق</span>
            </button>

            {monthOffset !== 0 && (
              <button
                onClick={() => setMonthOffset(0)}
                className="px-3 py-1.5 rounded-xl bg-[#002366] text-[#fed65b] text-xs font-bold"
              >
                الشهر الحالي
              </button>
            )}

            <button
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="الشهر التالي"
            >
              <span className="hidden sm:inline">الشهر التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={fetchLiturgies}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="تحديث الجدول"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-sm max-w-xl mx-auto">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل وتنسيق جدول القداسات الكنسي...</p>
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
        ) : viewMode === 'tabs' ? (
          
          /* ── 1. TABS VIEW (DAYS TABS WITH PRE-SELECTED TODAY) ── */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Days Horizontal Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(d => {
                const isTodayTab = d === todayArabic;
                const count = (groupedLiturgies[d] || []).length;

                return (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`relative p-3.5 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                      activeDay === d
                        ? 'bg-[#002366] text-white border-[#d4af37] shadow-lg scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isTodayTab && (
                      <span className="absolute -top-2.5 bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                        اليوم
                      </span>
                    )}
                    <span className="font-tajawal text-sm font-bold">{d}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeDay === d ? 'bg-white/20 text-[#fed65b]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count > 0 ? `${count} قداس` : 'لا يوجد'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Liturgies for Active Day */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#002366] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#d4af37]" />
                  <span>قداسات يوم {activeDay}</span>
                  {activeDay === todayArabic && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      قداسات اليوم الحالي ☀️
                    </span>
                  )}
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {(groupedLiturgies[activeDay] || []).length} قداسات مسجلة
                </span>
              </div>

              {(groupedLiturgies[activeDay] || []).length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm">لا توجد قداسات مقررة ليوم {activeDay} حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(groupedLiturgies[activeDay] || []).map(liturgy => {
                    const priestName = extractPriestName(liturgy);
                    const cleanNotes = extractCleanNotes(liturgy.notes);

                    return (
                      <div
                        key={liturgy.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366] group-hover:text-[#d4af37] transition-colors">
                              {liturgy.title}
                            </h3>
                            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{formatArabicTime(liturgy.start_time)} - {formatArabicTime(liturgy.end_time)}</span>
                            </span>
                          </div>

                          {/* Priest Name Tag (Prominent) */}
                          <div className="bg-gradient-to-r from-[#00174a]/5 to-[#d4af37]/10 p-3 rounded-2xl border border-[#d4af37]/30 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block">الكاهن المصلي</span>
                              <span className="font-tajawal text-sm font-extrabold text-[#00174a]">
                                {priestName}
                              </span>
                            </div>
                          </div>

                          {/* Church & Altar */}
                          <div className="text-xs text-slate-600 font-bold flex items-center gap-2 pt-1">
                            <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                            <span>{liturgy.church_name} • {liturgy.altar_name}</span>
                          </div>

                          {/* Extra Notes if any */}
                          {cleanNotes && (
                            <p className="text-xs text-slate-500 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              {cleanNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        ) : (

          /* ── 2. FULL MONTH SCHEDULE VIEW ── */
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#002366] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#d4af37]" />
                <span>جدول قداسات شهر {currentMonthName} كاملاً</span>
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {monthDaysList.length} يوماً في الشهر
              </span>
            </div>

            <div className="space-y-4">
              {monthDaysList.map(item => (
                <div
                  key={item.dayNumber}
                  className={`bg-white rounded-3xl p-5 border transition-all shadow-sm ${
                    item.isToday
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Day Date Block */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-sm shrink-0 border ${
                        item.isToday
                          ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        <span className="text-base font-extrabold">{item.dayNumber}</span>
                        <span className="text-[9px] text-slate-400">{item.dayName}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-tajawal text-sm font-extrabold text-[#002366]">
                            {item.dayName} {item.dayNumber} {currentMonthName}
                          </span>
                          {item.isToday && (
                            <span className="text-[10px] bg-[#d4af37] text-[#00174a] px-2 py-0.5 rounded-full font-bold">
                              اليوم
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                          {item.copticString}
                        </span>
                      </div>
                    </div>

                    {/* Liturgies for this Day */}
                    <div className="flex-1">
                      {item.liturgies.length === 0 ? (
                        <span className="text-xs text-slate-400 font-bold">لا يوجد قداس مسجل</span>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.liturgies.map(l => {
                            const priest = extractPriestName(l);

                            return (
                              <div
                                key={l.id}
                                className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-[#002366]">{l.title}</span>
                                  <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px]">
                                    <Clock className="w-3 h-3 text-[#d4af37]" />
                                    {formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-200">
                                  <span className="text-slate-700 flex items-center gap-1 font-bold text-[#00174a]">
                                    <User className="w-3 h-3 text-[#d4af37]" />
                                    {priest}
                                  </span>
                                  <span className="text-slate-400 truncate max-w-[120px]">
                                    {l.altar_name}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        )}

      </div>
    </div>
  );
};

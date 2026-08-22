import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, Liturgy } from '../lib/api';
import { Calendar, Clock, MapPin, Sparkles, RefreshCw, Heart, Eye, List, Layers } from 'lucide-react';

export const LiturgiesSchedulePage: React.FC = () => {
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View mode: 'tabs' (focused day view) or 'list' (full week stacked view)
  const [viewMode, setViewMode] = useState<'tabs' | 'list'>('tabs');

  const DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  // Get today's day name in Arabic
  const todayArabic = useMemo(() => {
    const dayName = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
    // Match against DAYS_OF_WEEK
    const found = DAYS_OF_WEEK.find(d => dayName.includes(d));
    return found || 'الأحد';
  }, []);

  const [activeDay, setActiveDay] = useState<string>('الأحد');

  // Set default active day to today once loaded
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

  const groupedLiturgies = useMemo(() => {
    const groups: Record<string, Liturgy[]> = {};
    DAYS_OF_WEEK.forEach(d => {
      groups[d] = liturgies
        .filter(l => l.liturgy_day === d)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [liturgies]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-12 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>مواعيد القداسات والخدمات الإلهية | كنيسة السيدة العذراء بمحرم بك بالإسكندرية</title>
        <meta name="description" content="جدول مواعيد القداسات الإلهية اليومية والأسبوعية، صلوات العشية والتسبحة بمذابح كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية." />
        <meta name="keywords" content="مواعيد قداسات كنيسة العذراء محرم بك, جدول قداسات محرم بك, قداس الجمعة كنيسة العذراء محرم بك, قداس الاحد كنيسة العذراء محرم بك, صلوات العشية محرم بك" />
        <link rel="canonical" href="https://stmary-moharambek-digitalhub.org/schedule" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-200/50 shadow-md">
            <Calendar className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="font-tajawal text-3xl sm:text-4xl font-extrabold text-[#00174a]">
            مواعيد القداسات والخدمات الروحية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            تابع مواعيد إقامة القداسات الإلهية، صلوات العشية، والتسبحة الأسبوعية بمذابح كنيستنا القبطية الأرثوذكسية
          </p>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {/* View Mode & Refresh Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/60 p-3.5 rounded-2xl shadow-sm">
          {/* Toggle Button Group */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('tabs')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tabs'
                  ? 'bg-white text-[#002366] shadow-sm'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <span>عرض اليوم المختار</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#002366] shadow-sm'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4 text-[#d4af37]" />
              <span>عرض الأسبوع بالكامل</span>
            </button>
          </div>

          <button
            onClick={fetchLiturgies}
            className="flex items-center gap-1.5 text-xs text-slate-500 font-bold hover:text-[#002366] transition-colors self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الجدول</span>
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-100 shadow-xl max-w-xl mx-auto">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل وتنسيق جدول القداسات الكنسي...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 border border-rose-200 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button
              onClick={fetchLiturgies}
              className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs py-2 px-4 rounded-xl transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : viewMode === 'tabs' ? (
          /* TABBED VIEW MODE (Focused, eye-friendly layout) */
          <div className="space-y-6">
            
            {/* Horizontal Day Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 justify-start md:justify-center no-scrollbar">
              {DAYS_OF_WEEK.map(dayName => {
                const isSelected = activeDay === dayName;
                const isToday = todayArabic === dayName;
                const count = (groupedLiturgies[dayName] || []).length;
                
                return (
                  <button
                    key={dayName}
                    onClick={() => setActiveDay(dayName)}
                    className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border transition-all text-center shrink-0 min-w-[90px] ${
                      isSelected
                        ? 'bg-[#002366] border-[#002366] text-[#fed65b] shadow-md scale-[1.03]'
                        : 'bg-white border-slate-200 text-[#002366] hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-extrabold font-tajawal">{dayName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-550'
                    }`}>
                      {count} خدمات
                    </span>
                    {isToday && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#fed65b]' : 'bg-[#002366]'} mt-0.5 animate-pulse`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#002366] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#d4af37]" />
                  <span>جدول خدمات يوم {activeDay}</span>
                </h2>
                {todayArabic === activeDay && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-150 px-3 py-1 rounded-full text-[10px] font-bold">
                    خدمات اليوم
                  </span>
                )}
              </div>

              {/* Day Services List */}
              <div className="space-y-4">
                {(groupedLiturgies[activeDay] || []).length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-tajawal text-slate-650 text-sm font-bold">لا يوجد قداسات أو اجتماعات مجدولة في هذا اليوم</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">نشكر محبتكم. يرجى تصفح باقي أيام الأسبوع من الشريط العلوي.</p>
                  </div>
                ) : (
                  (groupedLiturgies[activeDay] || []).map(liturgy => {
                    const isMainChurch = liturgy.church_name === 'الكنيسة الكبيرة';
                    const isVesper = liturgy.title.includes('عشية');
                    
                    return (
                      <div
                        key={liturgy.id}
                        className="bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/60 rounded-2xl p-5 sm:p-6 transition-all flex flex-col md:flex-row gap-5 justify-between items-start md:items-center text-right hover:shadow-sm"
                      >
                        {/* Title and Badge */}
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                              isVesper
                                ? 'bg-amber-50 border-amber-150 text-amber-800'
                                : 'bg-blue-50 border border-blue-150 text-blue-800'
                            }`}>
                              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{liturgy.title}</span>
                            </span>

                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                              isMainChurch
                                ? 'bg-[#002366]/5 border-[#002366]/10 text-[#002366]'
                                : 'bg-emerald-50 border-emerald-150 text-emerald-800'
                            }`}>
                              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{liturgy.church_name}</span>
                            </span>
                          </div>
                          <h3 className="font-tajawal text-base sm:text-lg font-bold text-[#002366]">
                            مذبح: {liturgy.altar_name}
                          </h3>
                          {liturgy.notes && (
                            <p className="text-[11px] text-slate-500 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/50 inline-block">
                              تنبيه: {liturgy.notes}
                            </p>
                          )}
                        </div>

                        {/* Timing Panel */}
                        <div className="bg-[#002366]/5 border border-[#002366]/10 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-center">
                          <Clock className="w-5 h-5 text-[#d4af37]" />
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold block">التوقيت الكنسي</span>
                            <span className="text-sm font-extrabold text-[#002366] font-mono leading-tight">
                              {formatArabicTime(liturgy.start_time)} - {formatArabicTime(liturgy.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          /* FULL WEEK LIST VIEW MODE (Stacked wide panels, spacious and extremely readable) */
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((dayName) => {
              const dayList = groupedLiturgies[dayName] || [];
              const isToday = todayArabic === dayName;
              
              return (
                <div
                  key={dayName}
                  className={`bg-white rounded-3xl border transition-all ${
                    isToday
                      ? 'border-amber-300 shadow-[0_4px_20px_rgba(212,175,55,0.06)]'
                      : 'border-slate-200/80 shadow-sm'
                  } p-6 sm:p-8 space-y-5 text-right`}
                >
                  {/* Day Header Panel */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#d4af37]" />
                      <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366]">
                        يوم {dayName}
                      </h2>
                      {isToday && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          اليوم الحالي
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {dayList.length} خدمات مجدولة
                    </span>
                  </div>

                  {/* Day's Services Stacks */}
                  <div className="space-y-3">
                    {dayList.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-4 text-center">لا توجد قداسات أو خدمات مجدولة لهذا اليوم الكنسي.</p>
                    ) : (
                      dayList.map(liturgy => {
                        const isMainChurch = liturgy.church_name === 'الكنيسة الكبيرة';
                        const isVesper = liturgy.title.includes('عشية');

                        return (
                          <div
                            key={liturgy.id}
                            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all"
                          >
                            <div className="space-y-1.5 text-right">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  isVesper ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-blue-50 text-blue-800 border border-blue-100'
                                }`}>
                                  {liturgy.title}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  isMainChurch ? 'bg-[#002366]/5 text-[#002366]' : 'bg-emerald-50 text-emerald-800'
                                }`}>
                                  {liturgy.church_name}
                                </span>
                              </div>
                              <h4 className="font-tajawal font-bold text-sm text-[#002366]">
                                مذبح: {liturgy.altar_name}
                              </h4>
                              {liturgy.notes && (
                                <p className="text-[10px] text-slate-400 font-bold">{liturgy.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 bg-[#002366]/5 px-4 py-2 rounded-xl text-xs font-bold text-[#002366] shrink-0 font-mono self-stretch sm:self-auto justify-center">
                              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{formatArabicTime(liturgy.start_time)} - {formatArabicTime(liturgy.end_time)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pastoral Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-lg max-w-4xl mx-auto">
          <div className="space-y-2 text-right">
            <h3 className="font-tajawal font-extrabold text-lg text-[#00174a] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
              <span>ملاحظة رعوية كنسية</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-bold leading-relaxed">
              قد يطرأ تعديل على مواعيد القداسات خلال فترات الأصوام والنهضات الروحية وأعياد الكنيسة القبطية الكبرى، نرجو المتابعة المستمرة لصفحة الإعلانات.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#002366]/5 text-[#002366] py-2.5 px-5 rounded-full border border-[#002366]/10 shrink-0 font-bold text-xs">
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
            <span>صلوا لأجل الخدمة</span>
          </div>
        </div>

      </div>
    </div>
  );
};

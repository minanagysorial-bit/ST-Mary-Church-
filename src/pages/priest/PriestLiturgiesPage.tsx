import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Plus, Trash2, Calendar, Clock, MapPin, Sparkles, AlertCircle, RefreshCw, X, Check, List, Layers } from 'lucide-react';
import { api, Liturgy } from '../../lib/api';

export const PriestLiturgiesPage: React.FC = () => {
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('القداس الإلهي');
  const [day, setDay] = useState('الأحد');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('08:30');
  const [churchName, setChurchName] = useState('الكنيسة الكبيرة');
  const [customChurchName, setCustomChurchName] = useState('');
  const [altarName, setAltarName] = useState('مذبح السيدة العذراء');
  const [customAltarName, setCustomAltarName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'tabs' (focused day view) or 'list' (full week stacked list)
  const [viewMode, setViewMode] = useState<'tabs' | 'list'>('tabs');

  const DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const todayArabic = useMemo(() => {
    const dayName = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
    const found = DAYS_OF_WEEK.find(d => dayName.includes(d));
    return found || 'الأحد';
  }, []);

  const [activeDay, setActiveDay] = useState<string>('الأحد');

  useEffect(() => {
    setActiveDay(todayArabic);
  }, [todayArabic]);

  const fetchLiturgies = async () => {
    setLoading(true);
    try {
      const data = await api.getLiturgies();
      setLiturgies(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل جدول القداسات.');
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalChurchName = churchName === 'أخرى' ? customChurchName.trim() : churchName;
    const finalAltarName = altarName === 'أخرى' ? customAltarName.trim() : altarName;

    if (!title.trim() || !day || !startTime || !endTime || !finalChurchName || !finalAltarName) {
      setError('يرجى تعبئة كافة الحقول المطلوبة وتحديد الكنيسة والمذبح.');
      return;
    }

    try {
      await api.createLiturgy({
        title: title.trim(),
        liturgy_day: day,
        start_time: startTime,
        end_time: endTime,
        church_name: finalChurchName,
        altar_name: finalAltarName,
        notes: notes.trim() || null,
        created_by: null,
      });

      // Reset form
      setTitle('القداس الإلهي');
      setDay('الأحد');
      setStartTime('06:00');
      setEndTime('08:30');
      setChurchName('الكنيسة الكبيرة');
      setCustomChurchName('');
      setAltarName('مذبح السيدة العذراء');
      setCustomAltarName('');
      setNotes('');
      setShowAddModal(false);
      fetchLiturgies();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إدراج القداس.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة من الجدول؟')) return;
    setError(null);
    try {
      await api.deleteLiturgy(id);
      setLiturgies(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف القداس.');
    }
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
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة جدول المواعيد والقداسات الإسبوِعي
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">إضافة، تعديل، ومتابعة مواعيد القداسات الإلهية على مذابح الكنيسة</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/10 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة خدمة جديدة</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-750 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* View mode switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('tabs')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tabs' ? 'bg-white text-[#002366] shadow-sm' : 'text-slate-550'
              }`}
            >
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <span>عرض اليوم المختار</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-[#002366] shadow-sm' : 'text-slate-550'
              }`}
            >
              <List className="w-4 h-4 text-[#d4af37]" />
              <span>عرض الأسبوع بالكامل</span>
            </button>
          </div>
          
          <button
            onClick={fetchLiturgies}
            className="text-xs text-slate-500 font-bold hover:text-[#002366] flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث الجدول</span>
          </button>
        </div>

        {/* Board content */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-md">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-bold">جاري تحميل وتنسيق جدول القداسات الأسبوعي...</p>
          </div>
        ) : viewMode === 'tabs' ? (
          /* Priest Tabs View Mode */
          <div className="space-y-6">
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

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3">
                جدول يوم {activeDay}
              </h2>
              
              <div className="space-y-4">
                {(groupedLiturgies[activeDay] || []).length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                    لا يوجد قداسات أو اجتماعات مجدولة في هذا اليوم
                  </div>
                ) : (
                  (groupedLiturgies[activeDay] || []).map(liturgy => {
                    const isMainChurch = liturgy.church_name === 'الكنيسة الكبيرة';
                    return (
                      <div
                        key={liturgy.id}
                        className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative group"
                      >
                        <div className="space-y-2 text-right">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="bg-blue-50 border border-blue-150 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#d4af37]" />
                              <span>{liturgy.title}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                              isMainChurch ? 'bg-[#002366]/5 text-[#002366]' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            }`}>
                              {liturgy.church_name}
                            </span>
                          </div>
                          <h4 className="font-tajawal font-bold text-sm text-[#002366]">
                            مذبح: {liturgy.altar_name}
                          </h4>
                          {liturgy.notes && (
                            <p className="text-[10px] text-slate-400 font-bold bg-white px-3 py-1 rounded-lg border border-slate-200/50 inline-block">{liturgy.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="bg-[#002366]/5 border border-[#002366]/10 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-[#002366] font-mono">
                            <Clock className="w-4 h-4 text-[#d4af37]" />
                            <span>{formatArabicTime(liturgy.start_time)} - {formatArabicTime(liturgy.end_time)}</span>
                          </div>
                          <button
                            onClick={() => handleDelete(liturgy.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="حذف الخدمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Priest Stacked Full Week View Mode */
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((dayName) => {
              const dayList = groupedLiturgies[dayName] || [];
              const isToday = todayArabic === dayName;
              
              return (
                <div
                  key={dayName}
                  className={`bg-white rounded-3xl border transition-all ${
                    isToday ? 'border-amber-300 shadow-md' : 'border-slate-200 shadow-sm'
                  } p-6 space-y-4 text-right`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#d4af37]" />
                      <h2 className="font-tajawal text-base font-extrabold text-[#002366]">
                        يوم {dayName}
                      </h2>
                      {isToday && (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          اليوم
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {dayList.length} خدمات
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayList.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-4 text-center">لا توجد خدمات مجدولة.</p>
                    ) : (
                      dayList.map(liturgy => {
                        const isMainChurch = liturgy.church_name === 'الكنيسة الكبيرة';

                        return (
                          <div
                            key={liturgy.id}
                            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all"
                          >
                            <div className="space-y-1 text-right">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="bg-blue-50 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  {liturgy.title}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  isMainChurch ? 'bg-[#002366]/5 text-[#002366]' : 'bg-emerald-50 text-emerald-800'
                                }`}>
                                  {liturgy.church_name}
                                </span>
                              </div>
                              <h4 className="font-tajawal font-bold text-xs text-[#002366]">
                                مذبح: {liturgy.altar_name}
                              </h4>
                              {liturgy.notes && (
                                <p className="text-[9px] text-slate-400 font-bold">{liturgy.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <div className="flex items-center gap-2 bg-[#002366]/5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#002366] font-mono">
                                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span>{formatArabicTime(liturgy.start_time)} - {formatArabicTime(liturgy.end_time)}</span>
                              </div>
                              <button
                                onClick={() => handleDelete(liturgy.id)}
                                className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

      </div>

      {/* --- ADD SERVICE MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh] text-right" dir="rtl">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-tajawal font-extrabold text-lg text-[#002366]">جدولة قداس أو عشية</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1">تحديد اليوم والتوقيت والمذبح بالتفصيل للخدمة</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">مسمى الخدمة / العنوان *</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                  >
                    <option value="القداس الإلهي">القداس الإلهي</option>
                    <option value="القداس الأول">القداس الأول</option>
                    <option value="القداس الثاني">القداس الثاني</option>
                    <option value="صلاة العشية">صلاة العشية</option>
                    <option value="تمجيد وتسبحة">تمجيد وتسبحة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">اليوم *</label>
                  <select
                    required
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">موعد البدء *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl text-center font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">موعد الانتهاء *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl text-center font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">الكنيسة *</label>
                  <select
                    required
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                  >
                    <option value="الكنيسة الكبيرة">الكنيسة الكبيرة</option>
                    <option value="كنيسة الأنبا أنطونيوس بالجنينة">كنيسة الأنبا أنطونيوس بالجنينة</option>
                    <option value="أخرى">أخرى (كتابة يدوية)</option>
                  </select>
                </div>

                {churchName === 'أخرى' && (
                  <div className="animate-fadeIn">
                    <label className="block text-slate-500 font-bold mb-1.5 text-[11px]">اكتب اسم الكنيسة بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      value={customChurchName}
                      onChange={(e) => setCustomChurchName(e.target.value)}
                      placeholder="مثال: كنيسة الشهيد مارجرجس"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5">المذبح المقدس *</label>
                  <select
                    required
                    value={altarName}
                    onChange={(e) => setAltarName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                  >
                    <option value="مذبح السيدة العذراء">مذبح السيدة العذراء</option>
                    <option value="مذبح رئيس الملائكة ميخائيل">مذبح رئيس الملائكة ميخائيل</option>
                    <option value="مذبح القديس مارمينا">مذبح القديس مارمينا</option>
                    <option value="مذبح الأنبا أنطونيوس">مذبح الأنبا أنطونيوس</option>
                    <option value="أخرى">أخرى (كتابة يدوية)</option>
                  </select>
                </div>

                {altarName === 'أخرى' && (
                  <div className="animate-fadeIn">
                    <label className="block text-slate-500 font-bold mb-1.5 text-[11px]">اكتب اسم المذبح بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      value={customAltarName}
                      onChange={(e) => setCustomAltarName(e.target.value)}
                      placeholder="مثال: مذبح الملاك سوريال"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl resize-none font-bold text-slate-700"
                  placeholder="مثال: قداس العيد / قداس للمرحلة الثانوية"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 font-bold text-slate-400 hover:text-slate-650 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>جدولة الخدمة الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

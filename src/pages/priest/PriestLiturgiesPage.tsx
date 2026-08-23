import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Edit,
  User,
  CheckCircle2,
  CalendarDays,
  Check
} from 'lucide-react';
import { api, Liturgy } from '../../lib/api';

export const PRIEST_NAMES_LIST = [
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه'
];

const CHURCH_NAMES = ['الكنيسة الكبيرة', 'الكنيسة الصغرى', 'كنيسة الآباء السواح'];
const ALTAR_NAMES = ['مذبح السيدة العذراء', 'مذبح مارجرجس', 'مذبح الملاك ميخائيل', 'مذبح الشهيد أبي سيفين'];

export const PriestLiturgiesPage: React.FC = () => {
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLiturgyId, setEditingLiturgyId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('القداس الإلهي');
  const [day, setDay] = useState('الأحد');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('08:30');
  const [churchName, setChurchName] = useState('الكنيسة الكبيرة');
  const [customChurchName, setCustomChurchName] = useState('');
  const [altarName, setAltarName] = useState('مذبح السيدة العذراء');
  const [customAltarName, setCustomAltarName] = useState('');
  
  // Multi-priest selection
  const [selectedPriests, setSelectedPriests] = useState<string[]>(['ابونا مرقس ميلاد']);
  const [customPriestName, setCustomPriestName] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, []);

  const fetchLiturgies = async () => {
    setLoading(true);
    setError(null);
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

  // Helper to extract priests array from notes
  const extractPriests = (l: Liturgy): string[] => {
    if (!l.notes) return ['غير محدد'];
    const matched: string[] = [];
    
    // Check known priests list
    for (const p of PRIEST_NAMES_LIST) {
      if (l.notes.includes(p) && !matched.includes(p)) {
        matched.push(p);
      }
    }

    if (matched.length > 0) return matched;

    // Regex check for custom names
    const match = l.notes.match(/(?:الكهنة|الكاهن)[:\s]+([^|]+)/);
    if (match) {
      const names = match[1].split(/[،,•]/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) return names;
    }

    return [l.notes.split('|')[0].trim() || 'غير محدد'];
  };

  const togglePriest = (name: string) => {
    if (selectedPriests.includes(name)) {
      if (selectedPriests.length === 1 && !customPriestName.trim()) {
        // keep at least one
        return;
      }
      setSelectedPriests(prev => prev.filter(p => p !== name));
    } else {
      setSelectedPriests(prev => [...prev, name]);
    }
  };

  const openAddModal = () => {
    setEditingLiturgyId(null);
    setTitle('القداس الإلهي');
    setDay('الأحد');
    setStartTime('06:00');
    setEndTime('08:30');
    setChurchName('الكنيسة الكبيرة');
    setCustomChurchName('');
    setAltarName('مذبح السيدة العذراء');
    setCustomAltarName('');
    setSelectedPriests(['ابونا مرقس ميلاد']);
    setCustomPriestName('');
    setExtraNotes('');
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (l: Liturgy) => {
    setEditingLiturgyId(l.id);
    setTitle(l.title);
    setDay(l.liturgy_day);
    setStartTime(l.start_time);
    setEndTime(l.end_time);

    if (CHURCH_NAMES.includes(l.church_name)) {
      setChurchName(l.church_name);
      setCustomChurchName('');
    } else {
      setChurchName('أخرى');
      setCustomChurchName(l.church_name);
    }

    if (ALTAR_NAMES.includes(l.altar_name)) {
      setAltarName(l.altar_name);
      setCustomAltarName('');
    } else {
      setAltarName('أخرى');
      setCustomAltarName(l.altar_name);
    }

    const currentPriests = extractPriests(l);
    const knownInList = currentPriests.filter(p => PRIEST_NAMES_LIST.includes(p));
    const customInList = currentPriests.filter(p => !PRIEST_NAMES_LIST.includes(p));

    setSelectedPriests(knownInList.length > 0 ? knownInList : []);
    setCustomPriestName(customInList.join('، '));

    let cleanNotes = l.notes || '';
    PRIEST_NAMES_LIST.forEach(p => {
      cleanNotes = cleanNotes.replace(new RegExp(`(?:الكهنة|الكاهن(?:\\s*المصلي)?[:\\s]+)?${p}`, 'g'), '');
    });
    setExtraNotes(cleanNotes.replace(/\|/g, '').replace(/الكهنة المصلون[:\s]*/g, '').trim());

    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalChurchName = churchName === 'أخرى' ? customChurchName.trim() : churchName;
    const finalAltarName = altarName === 'أخرى' ? customAltarName.trim() : altarName;

    // Combine all selected and custom priests
    const allPriests = [...selectedPriests];
    if (customPriestName.trim()) {
      allPriests.push(customPriestName.trim());
    }

    if (!title.trim() || !day || !startTime || !endTime || !finalChurchName || !finalAltarName) {
      setError('يرجى تعبئة كافة الحقول المطلوبة وتحديد الكنيسة والمذبح.');
      return;
    }

    if (allPriests.length === 0) {
      setError('يرجى اختيار أو كتابة كاهن واحد على الأقل للمشاركة في القداس.');
      return;
    }

    // Format combined notes with all priest names
    const priestPrefix = allPriests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
    let combinedNotes = `${priestPrefix}: ${allPriests.join(' • ')}`;
    if (extraNotes.trim()) {
      combinedNotes += ` | ${extraNotes.trim()}`;
    }

    try {
      if (editingLiturgyId) {
        await api.updateLiturgy(editingLiturgyId, {
          title: title.trim(),
          liturgy_day: day,
          start_time: startTime,
          end_time: endTime,
          church_name: finalChurchName,
          altar_name: finalAltarName,
          notes: combinedNotes,
        });
        setSuccessMessage('تم تحديث بيانات القداس والكهنة المشاركين بنجاح!');
      } else {
        await api.createLiturgy({
          title: title.trim(),
          liturgy_day: day,
          start_time: startTime,
          end_time: endTime,
          church_name: finalChurchName,
          altar_name: finalAltarName,
          notes: combinedNotes,
          created_by: null,
        });
        setSuccessMessage('تمت إضافة القداس للجدول بنجاح!');
      }

      setShowModal(false);
      fetchLiturgies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ القداس.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القداس من الجدول؟')) return;
    setError(null);
    try {
      await api.deleteLiturgy(id);
      setLiturgies(prev => prev.filter(l => l.id !== id));
      setSuccessMessage('تم حذف القداس من الجدول.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف القداس.');
    }
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة جدول قداسات شهر {currentMonthName}
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تحديد مواعيد القداسات، تعيين كاهن أو أكثر لكل قداس، وتحديث الجدول الكنسي شهرياً
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/10 transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قداس جديد للجدول</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Liturgies Table by Days of Week */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-tajawal text-base font-extrabold text-[#002366]">
              القداسات المسجلة بجدول الكنيسة ({liturgies.length})
            </h2>
            <span className="text-xs text-slate-500 font-bold">شهر {currentMonthName}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل القداسات...</div>
          ) : liturgies.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold">لا توجد قداسات مسجلة في الجدول حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold">
                    <th className="p-4">اليوم</th>
                    <th className="p-4">القداس / الخدمة</th>
                    <th className="p-4">الكهنة المصلون</th>
                    <th className="p-4">التوقيت</th>
                    <th className="p-4">الكنيسة والمذبح</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {liturgies.map(l => {
                    const priests = extractPriests(l);

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <span className="bg-[#002366]/10 text-[#002366] px-3 py-1 rounded-xl font-extrabold text-xs">
                            {l.liturgy_day}
                          </span>
                        </td>
                        <td className="p-4 text-[#002366] text-sm font-extrabold">{l.title}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {priests.map((p, idx) => (
                              <span
                                key={idx}
                                className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <User className="w-3 h-3 text-[#d4af37]" />
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-bold">
                          {formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">
                          {l.church_name} • {l.altar_name}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(l)}
                              className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 border border-blue-100 transition-colors"
                              title="تعديل القداس"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(l.id)}
                              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── ADD / EDIT MODAL ── */}
        {showModal && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
              
              {/* Modal Header */}
              <div className="bg-[#002366] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-tajawal text-lg font-extrabold text-[#fed65b]">
                    {editingLiturgyId ? 'تعديل بيانات القداس' : 'إضافة قداس جديد للجدول'}
                  </h3>
                  <p className="text-xs text-slate-200 font-semibold mt-0.5">
                    شهر {currentMonthName} • كنيسة السيدة العذراء بمحرم بك
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold max-h-[80vh] overflow-y-auto">
                
                {/* Title & Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">عنوان القداس / الخدمة *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: القداس الأول / القداس الإلهي"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">يوم الأسبوع *</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Multi-Priest Selection (Can select multiple priests!) */}
                <div className="space-y-2.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[#00174a] font-extrabold flex items-center gap-1.5 text-xs">
                      <User className="w-4 h-4 text-[#d4af37]" />
                      <span>الآباء الكهنة المصلون (يمكن اختيار أكثر من كاهن) *</span>
                    </label>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      تم تحديد ({selectedPriests.length + (customPriestName.trim() ? 1 : 0)})
                    </span>
                  </div>

                  {/* Checkbox chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {PRIEST_NAMES_LIST.map(p => {
                      const isSelected = selectedPriests.includes(p);

                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => togglePriest(p)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between text-right ${
                            isSelected
                              ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <span>{p}</span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-[#fed65b] border-[#fed65b] text-[#00174a]' : 'border-slate-300 bg-slate-50'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Priest Name */}
                  <div className="pt-2">
                    <label className="text-slate-600 text-[11px] font-bold block mb-1">
                      أو اكتب اسم كاهن آخر إضافي:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أبونا ضيف أو كاهن زائر..."
                      value={customPriestName}
                      onChange={(e) => setCustomPriestName(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2 outline-none font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">وقت البدء (ص/م) *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">وقت الانتهاء (ص/م) *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>
                </div>

                {/* Church & Altar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">الكنيسة *</label>
                    <select
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {CHURCH_NAMES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="أخرى">كنيسة أخرى...</option>
                    </select>

                    {churchName === 'أخرى' && (
                      <input
                        type="text"
                        placeholder="اسم الكنيسة..."
                        value={customChurchName}
                        onChange={(e) => setCustomChurchName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none font-bold text-xs mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">المذبح *</label>
                    <select
                      value={altarName}
                      onChange={(e) => setAltarName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {ALTAR_NAMES.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="أخرى">مذبح آخر...</option>
                    </select>

                    {altarName === 'أخرى' && (
                      <input
                        type="text"
                        placeholder="اسم المذبح..."
                        value={customAltarName}
                        onChange={(e) => setCustomAltarName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none font-bold text-xs mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Extra Notes */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: مخصص لأسرة المبتدئين أو مناسبة خاصة..."
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
                  >
                    {editingLiturgyId ? 'حفظ التعديلات' : 'إضافة للجدول'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

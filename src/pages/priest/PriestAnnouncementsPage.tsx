import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type Announcement } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Megaphone, Plus, Search, CalendarDays, Power, 
  Trash2, Edit2, X, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export const PriestAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editor Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [durationType, setDurationType] = useState<'permanent' | 'days_limit' | 'days_specific'>('days_limit');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [specificDays, setSpecificDays] = useState<string[]>(['الجمعة', 'الأحد']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);

  const WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل تحميل الإعلانات الكنسية.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ann?: Announcement) => {
    if (ann) {
      setEditId(ann.id);
      setTitle(ann.title);
      setContent(ann.content);
      setDurationType(ann.duration_type);
      setDurationDays(ann.duration_days || 7);
      setSpecificDays(ann.specific_days || []);
      setStartDate(ann.start_date);
      setIsActive(ann.is_active);
    } else {
      setEditId(null);
      setTitle('');
      setContent('');
      setDurationType('days_limit');
      setDurationDays(7);
      setSpecificDays(['الجمعة', 'الأحد']);
      setStartDate(new Date().toISOString().split('T')[0]);
      setIsActive(true);
    }
    setErrorMsg('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const toggleSpecificDay = (day: string) => {
    setSpecificDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('برجاء إدخال عنوان وتفاصيل الإعلان.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editId) {
        await api.updateAnnouncement(editId, {
          title,
          content,
          duration_type: durationType,
          duration_days: durationType === 'days_limit' ? durationDays : null,
          specific_days: durationType === 'days_specific' ? specificDays : null,
          start_date: startDate,
          is_active: isActive
        });
        setSuccessMsg('تم تحديث الإعلان بنجاح.');
      } else {
        await api.createAnnouncement({
          title,
          content,
          duration_type: durationType,
          duration_days: durationType === 'days_limit' ? durationDays : null,
          specific_days: durationType === 'days_specific' ? specificDays : null,
          start_date: startDate,
          is_active: isActive,
          created_by: profile?.id || null
        });
        setSuccessMsg('تم إضافة الإعلان بنجاح.');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الإعلان.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) return;
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert('فشل حذف الإعلان: ' + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.toggleAnnouncementActive(id, !currentStatus);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
    } catch (err: any) {
      alert('حدث خطأ أثناء تغيير حالة الإعلان: ' + err.message);
    }
  };

  const filteredAnnouncements = announcements.filter(a => 
    a.title.includes(searchTerm) || a.content.includes(searchTerm)
  );

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#00174a] p-6 rounded-3xl text-white shadow-xl border-b-4 border-[#fed65b]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#fed65b]">
                <Megaphone className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-2xl text-[#fed65b]">إدارة إعلانات الكنيسة</h1>
            </div>
            <p className="text-slate-300 text-sm">أضف ونظّم الإعلانات والمناسبات ليراها الشعب في الصفحة الرئيسية</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#fed65b] text-[#00174a] hover:bg-[#ffdf80] font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>إعلان جديد</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن إعلان..."
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#002366]"
            />
          </div>
        </div>

        {/* Global Messages */}
        {successMsg && !showModal && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && !showModal && (
          <div className="p-4 bg-rose-50 text-rose-800 text-sm font-bold rounded-xl flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold space-y-3">
            <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>جاري تحميل الإعلانات...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-[#c5c6d2] text-center text-slate-400 font-bold">
            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>لا يوجد إعلانات حالياً. أضف إعلاناً جديداً ليظهر لشعب الكنيسة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAnnouncements.map(ann => (
              <div key={ann.id} className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between h-full transition-all ${ann.is_active ? 'border-[#002366]/20' : 'border-slate-200 opacity-60'}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-tajawal font-bold text-lg text-[#00174a] leading-tight line-clamp-2">
                      {ann.title}
                    </h3>
                    <div className="shrink-0 flex items-center gap-1">
                      <button 
                        onClick={() => handleToggleActive(ann.id, ann.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${ann.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                        title={ann.is_active ? 'فصل الإعلان (إخفاء)' : 'تفعيل الإعلان (إظهار)'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                    {ann.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-bold pt-2">
                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      تبدأ: {ann.start_date}
                    </span>
                    <span className="bg-[#002366]/5 text-[#002366] px-2.5 py-1 rounded-md border border-[#002366]/10 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {ann.duration_type === 'permanent' ? 'دائم' :
                       ann.duration_type === 'days_limit' ? `لمدة ${ann.duration_days} يوم` :
                       'أيام محددة'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {ann.is_active ? (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      نشط مرئي
                    </span>
                  ) : (
                    <span className="text-slate-400 font-bold text-xs flex items-center gap-1">
                      <Power className="w-4 h-4" />
                      غير نشط (مخفي)
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(ann)}
                      className="p-2 text-slate-500 hover:text-[#002366] hover:bg-[#002366]/5 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden mt-10 mb-10">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#00174a] text-white">
                <h2 className="font-tajawal font-bold text-lg flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#fed65b]" />
                  {editId ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-full transition-colors hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {(errorMsg && showModal) && (
                  <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">عنوان الإعلان *</label>
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="مثال: نهضة القديسة العذراء مريم، اجتماع الشباب..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">تفاصيل الإعلان *</label>
                    <textarea 
                      required
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="اكتب تفاصيل الإعلان ليقرأها شعب الكنيسة..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none h-28"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">يبدأ العرض من (التاريخ)</label>
                      <input 
                        type="date"
                        required
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">نوع مدة العرض</label>
                      <select 
                        value={durationType}
                        onChange={e => setDurationType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-3 text-sm font-bold text-[#00174a] outline-none transition-all"
                      >
                        <option value="days_limit">لمدة محددة (بالأيام)</option>
                        <option value="days_specific">في أيام محددة فقط (كل أسبوع)</option>
                        <option value="permanent">دائم (حتى أفصله بنفسي)</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Duration Logic */}
                  {durationType === 'days_limit' && (
                    <div className="space-y-1.5 bg-[#002366]/5 p-4 rounded-xl border border-[#002366]/10 animate-fadeIn">
                      <label className="text-sm font-bold text-slate-700">عدد أيام العرض بعد تاريخ البدء</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          min="1"
                          max="365"
                          value={durationDays}
                          onChange={e => setDurationDays(Number(e.target.value))}
                          className="w-24 bg-white border border-slate-200 focus:border-[#002366] rounded-lg px-4 py-2 text-sm font-bold text-center outline-none"
                        />
                        <span className="text-slate-500 font-bold text-sm">أيام</span>
                      </div>
                    </div>
                  )}

                  {durationType === 'days_specific' && (
                    <div className="space-y-3 bg-[#002366]/5 p-4 rounded-xl border border-[#002366]/10 animate-fadeIn">
                      <label className="text-sm font-bold text-slate-700">الأيام المحددة (سيتكرر العرض في هذه الأيام فقط)</label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleSpecificDay(day)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                              specificDays.includes(day) 
                                ? 'bg-[#00174a] text-[#fed65b] border-[#00174a]' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="w-5 h-5 rounded text-[#fed65b] focus:ring-[#00174a]"
                      />
                      <span className="text-sm font-bold text-slate-700">تفعيل الإعلان فوراً ومرئي للشعب</span>
                    </label>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#00174a] text-[#fed65b] font-bold py-3.5 rounded-xl hover:bg-[#002366] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'جاري الحفظ...' : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          حفظ الإعلان
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      إلغاء التغييرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

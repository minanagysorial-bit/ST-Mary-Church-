import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { BookOpen, Plus, Trash2, Edit3, X, Check, HelpCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api, Verse } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export const VersesManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editReference, setEditReference] = useState('');

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const data = await api.getVerses();
      setVerses(data);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل قائمة الآيات اليومية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerses();
  }, []);

  const handleCreateVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !reference.trim()) return;

    setError(null);
    setSuccess(null);
    setSubmitLoading(true);

    try {
      const newVerse = await api.createVerse({
        text: text.trim(),
        reference: reference.trim(),
        created_by: profile?.id || null
      });

      setSuccess('تمت إضافة آية اليوم الجديدة بنجاح');
      setText('');
      setReference('');
      setVerses(prev => [newVerse, ...prev]);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل إدراج آية اليوم');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartEdit = (verse: Verse) => {
    setEditingId(verse.id);
    setEditText(verse.text);
    setEditReference(verse.reference);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim() || !editReference.trim()) return;

    setError(null);
    setSuccess(null);
    try {
      const updated = await api.updateVerse(id, {
        text: editText.trim(),
        reference: editReference.trim()
      });

      setSuccess('تم تعديل آية اليوم بنجاح');
      setVerses(prev => prev.map(v => v.id === id ? updated : v));
      setEditingId(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حفظ تعديل الآية');
    }
  };

  const handleDeleteVerse = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الآية؟')) return;

    setError(null);
    setSuccess(null);
    try {
      await api.deleteVerse(id);
      setSuccess('تم حذف الآية بنجاح');
      setVerses(prev => prev.filter(v => v.id !== id));
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حذف الآية');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة آية اليوم (Daily Verses)
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              إضافة وتعديل وحذف آيات الكتاب المقدس لتظهر بشكل عشوائي للمستخدمين كـ "آية اليوم" في الصفحة الرئيسية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm font-tajawal">
              <BookOpen className="w-4 h-4 text-[#d4af37]" />
              <span>مخزن الآيات الروحية</span>
            </span>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Verse Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#002366] text-white rounded-3xl p-6 border border-[#d4af37]/20 shadow-xl sticky top-24">
              <div className="space-y-2 mb-6">
                <h3 className="font-tajawal font-extrabold text-lg text-[#fed65b] flex items-center gap-2">
                  <Plus className="w-5 h-5 bg-[#fed65b] text-[#002366] rounded-lg p-0.5" />
                  إضافة آية جديدة
                </h3>
                <p className="text-[10px] text-slate-200 font-semibold leading-relaxed">
                  أدخل الشاهد والآية المباركة بدقة لتضاف إلى قائمة الآيات اليومية.
                </p>
              </div>

              <form onSubmit={handleCreateVerse} className="space-y-4 text-slate-700">
                <div className="space-y-1.5 font-cairo">
                  <label className="block text-xs font-bold text-slate-200">نص الآية</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="«أَنَا هُوَ الطَّرِيقُ وَالْحَقُّ وَالْحَيَاةُ. لَيْسَ أَحَدٌ يَأْتِي إِلَى الآبِ إِلاَّ بِي»"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full bg-slate-50/95 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] font-semibold resize-none"
                  />
                </div>

                <div className="space-y-1.5 font-cairo">
                  <label className="block text-xs font-bold text-slate-200">الشاهد (المرجع)</label>
                  <input
                    type="text"
                    required
                    placeholder="يوحنا ١٤: ٦"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full bg-slate-50/95 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] font-semibold"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-[#d4af37] hover:bg-[#fed65b] text-[#002366] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitLoading ? (
                      <span>جاري الحفظ والرفع...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>إضافة الآية الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Verses List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="border-b border-slate-50 pb-3 mb-5 flex items-center justify-between">
                <h3 className="font-tajawal font-extrabold text-base text-[#002366]">قائمة الآيات المسجلة</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                  العدد الكلي: {verses.length}
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 font-bold">جاري تحميل الآيات...</div>
              ) : verses.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <HelpCircle className="w-12 h-12 stroke-[1.5] text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">لا توجد آيات مسجلة حالياً</p>
                  <p className="text-[10px] text-slate-400">ابدأ بإضافة أول آية مباركة باستخدام النموذج الجانبي</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verses.map(v => (
                    <div
                      key={v.id}
                      className="border border-slate-100 rounded-2xl p-5 hover:border-[#d4af37]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all bg-slate-50/50"
                    >
                      {editingId === v.id ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400">نص الآية</label>
                            <textarea
                              rows={3}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d4af37] resize-none"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-400">الشاهد</label>
                              <input
                                type="text"
                                value={editReference}
                                onChange={e => setEditReference(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d4af37]"
                              />
                            </div>
                            
                            <div className="flex items-end justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(v.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 font-tajawal transition-colors flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>حفظ التعديل</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 font-tajawal transition-colors flex items-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>إلغاء</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#d4af37] shrink-0" />
                              <span className="text-xs bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 font-Tajawal font-bold px-2 py-0.5 rounded-md">
                                {v.reference}
                              </span>
                            </div>
                            <blockquote className="text-slate-800 text-xs font-bold leading-relaxed border-r-2 border-[#d4af37]/45 pr-3 mt-1.5 italic">
                              {v.text}
                            </blockquote>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEdit(v)}
                              className="p-2 text-slate-400 hover:text-[#002366] hover:bg-[#002366]/5 rounded-xl transition-all"
                              title="تعديل الآية"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteVerse(v.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="حذف الآية"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

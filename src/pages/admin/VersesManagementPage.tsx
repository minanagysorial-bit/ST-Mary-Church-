import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  BookOpen, Plus, Trash2, Edit3, X, Check, HelpCircle, FileText, CheckCircle2, 
  ShieldAlert, Sparkles, RefreshCw, Wand2, Star, Eye, Quote, Pin, Sliders
} from 'lucide-react';
import { api, Verse } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { COMFORT_VERSES_REGISTRY, getDailyAutoVerse, getRandomComfortVerse, type ComfortVerseItem } from '../../lib/comfortVerses';
import { useToast } from '../../components/common/Toast';

export const VersesManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings & Modes
  const [displayMode, setDisplayMode] = useState<'auto' | 'manual'>('auto');
  const [activeManualVerseId, setActiveManualVerseId] = useState<string>('');
  const [currentAutoVerse, setCurrentAutoVerse] = useState<ComfortVerseItem>(() => getDailyAutoVerse());

  // Form states (Manual)
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editReference, setEditReference] = useState('');

  // Comfort library search / filter
  const [comfortCategory, setComfortCategory] = useState<string>('الكل');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [versesData, settings] = await Promise.all([
        api.getVerses().catch(() => []),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);
      setVerses(versesData);
      
      if (settings['verse_display_mode']) {
        setDisplayMode(settings['verse_display_mode'] as 'auto' | 'manual');
      }
      if (settings['active_manual_verse_id']) {
        setActiveManualVerseId(settings['active_manual_verse_id']);
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل بيانات الآيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleModeChange = async (mode: 'auto' | 'manual') => {
    setDisplayMode(mode);
    try {
      await api.updateSiteSettings({
        verse_display_mode: mode
      });
      toast.success(
        mode === 'auto' 
          ? 'تم تفعيل الوضع التلقائي: تتجدد الآية المعزية المشكولة يومياً في الصفحة الرئيسية 🔄' 
          : 'تم تفعيل الوضع اليدوي: يتم عرض الآيات المخصصة التي تختارها ✍️'
      );
    } catch (err) {
      console.warn('Error saving verse mode:', err);
    }
  };

  const handleSelectActiveManualVerse = async (id: string) => {
    setActiveManualVerseId(id);
    try {
      await api.updateSiteSettings({
        active_manual_verse_id: id,
        verse_display_mode: 'manual'
      });
      setDisplayMode('manual');
      toast.success('تم تثبيت هذه الآية كآية حالية في الصفحة الرئيسية 📌');
    } catch (err) {
      console.warn('Error setting active verse:', err);
    }
  };

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
      toast.success('تمت إضافة الآية بنجاح ✅');
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
      toast.success('تم حفظ التعديلات بنجاح');
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
      toast.success('تم حذف الآية بنجاح');
      setVerses(prev => prev.filter(v => v.id !== id));
      if (activeManualVerseId === id) {
        setActiveManualVerseId('');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حذف الآية');
    }
  };

  const filteredComfortVerses = COMFORT_VERSES_REGISTRY.filter(v => 
    comfortCategory === 'الكل' || v.category === comfortCategory
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة آية اليوم (Daily Verses) 📜✨
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              التحكم في طريقة عرض آية اليوم بالصفحة الرئيسية (تلقائي مشكول ومعزي، أو يدوي مخصص).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm font-tajawal">
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

        {/* 🎛️ Mode Selector Switch (Auto vs Manual) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#002366] font-bold text-sm font-tajawal">
            <Sliders className="w-5 h-5 text-[#d4af37]" />
            <span>نظام عرض آية اليوم في الصفحة الرئيسية:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Mode 1: Automatic */}
            <div
              onClick={() => handleModeChange('auto')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                displayMode === 'auto'
                  ? 'bg-blue-50/70 border-[#002366] shadow-md ring-2 ring-[#002366]/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    displayMode === 'auto' ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-base font-extrabold text-[#002366]">
                      الوضع التلقائي الذكي (Auto Mode) 🌟
                    </h3>
                    <span className="text-[11px] text-slate-500 font-bold">يوصى به للموقع</span>
                  </div>
                </div>
                {displayMode === 'auto' && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>مفعّل حالياً</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                يقوم الموقع بتحديث الآية تلقائياً كل صباح بآية معزية ومشجعة جديدة ومشكولة بالكامل بالتشكيل الأصيل، مأخوذة من قاموس الكنيسة المعتمد.
              </p>
            </div>

            {/* Mode 2: Manual */}
            <div
              onClick={() => handleModeChange('manual')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                displayMode === 'manual'
                  ? 'bg-amber-50/70 border-[#d4af37] shadow-md ring-2 ring-[#d4af37]/20'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    displayMode === 'manual' ? 'bg-[#d4af37] text-[#00174a]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-base font-extrabold text-[#00174a]">
                      الوضع اليدوي المخصص (Manual Mode) ✍️
                    </h3>
                    <span className="text-[11px] text-slate-500 font-bold">تحديد آية خاصة</span>
                  </div>
                </div>
                {displayMode === 'manual' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>مفعّل حالياً</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                يتيح للأدمن أو الكاهن كتابة آية محددة يدوياً أو اختيار آية وتثبيتها بالصفحة الرئيسية للمناسبات الخاصة والنهضات.
              </p>
            </div>

          </div>
        </div>

        {/* 🌟 AUTO MODE PREVIEW & CONTROLS */}
        {displayMode === 'auto' && (
          <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00123a] text-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-[#d4af37]/40 space-y-6 animate-scale-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fed65b]/20 text-[#fed65b] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معاينة حية: آية اليوم المشكولة المعروضة تلقائياً في الصفحة الرئيسية</span>
                </div>
                <h3 className="font-tajawal text-lg font-extrabold text-[#fed65b]">
                  {currentAutoVerse.category} • {currentAutoVerse.reference}
                </h3>
              </div>

              <button
                onClick={() => {
                  const randomV = getRandomComfortVerse();
                  setCurrentAutoVerse(randomV);
                  toast.success('تم تجربة واقتراح آية معزية مشكولة أخرى! 🎲');
                }}
                className="bg-white/10 hover:bg-white/20 text-[#fed65b] border border-[#fed65b]/30 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto shadow-md"
              >
                <Wand2 className="w-4 h-4" />
                <span>🎲 اقتراح آية معزية أخرى</span>
              </button>
            </div>

            {/* Verse Card Mockup */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative space-y-3">
              <Quote className="w-8 h-8 text-[#fed65b]/40 absolute top-4 left-4" />
              <p className="font-tajawal text-base sm:text-xl font-extrabold text-white leading-loose max-w-3xl">
                {currentAutoVerse.text}
              </p>
              <span className="font-tajawal font-bold text-xs text-[#fed65b] block pt-1">
                — {currentAutoVerse.reference}
              </span>
            </div>
          </div>
        )}

        {/* 📚 COMFORT VERSES REGISTRY ACCORDION (Browse All 34+ Auto Verses) */}
        {displayMode === 'auto' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-tajawal text-lg font-extrabold text-[#002366]">
                  مكتبة الآيات المعزية والمشجعة المشكولة ({COMFORT_VERSES_REGISTRY.length} آية) 📖
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  تتغير وتدور هذه الآيات تلقائياً كل صباح لتعزية وتشجيع شعب الكنيسة.
                </p>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['الكل', 'تعزية وسلام', 'رجاء وقوة', 'محبة ورعاية', 'صلاة واستجابة', 'حماية وطمأنينة', 'بركة ونجاح'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setComfortCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      comfortCategory === cat
                        ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComfortVerses.map(v => (
                <div key={v.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-[#002366] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-lg text-[10px] font-extrabold">
                      {v.category}
                    </span>
                    <span className="text-xs font-bold text-[#002366]">{v.reference}</span>
                  </div>
                  <p className="text-xs text-slate-800 font-bold leading-relaxed pt-1">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✍️ MANUAL MODE: ADD & MANAGE CUSTOM VERSES */}
        {displayMode === 'manual' && (
          <>
            {/* Add Custom Verse Form */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-[#002366] border-b border-slate-100 pb-3">
                <Plus className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-tajawal text-base font-bold">إضافة آية مخصصة جديدة</h3>
              </div>

              <form onSubmit={handleCreateVerse} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نص الآية (يُفضَّل كتابتها بالتشكيل) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="مثال: «تَوَكَّلْ عَلَى الرَّبِّ بِكُلِّ قَلْبِكَ، وَعَلَى فَهْمِكَ لاَ تَعْتَمِدْ.»"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002366] transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الشاهد الكتابي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سفر الأمثال ٣ : ٥"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#002366] transition-all"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submitLoading ? 'جاري الحفظ...' : 'حفظ الآية المخصصة'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Custom Verses Table / List */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-tajawal text-base font-bold text-[#002366]">
                قائمة الآيات المضافة يدوياً ({verses.length})
              </h3>

              {verses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">لا توجد آيات مضافة يدوياً بعد.</p>
              ) : (
                <div className="space-y-3">
                  {verses.map(v => (
                    <div
                      key={v.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        activeManualVerseId === v.id
                          ? 'bg-amber-50/80 border-[#d4af37] shadow-xs'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#002366]">{v.reference}</span>
                          {activeManualVerseId === v.id && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9px] font-extrabold">
                              📌 الآية النشطة حالياً بالرئيسية
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-semibold">{v.text}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleSelectActiveManualVerse(v.id)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                          title="تثبيت كآية حالية بالصفحة الرئيسية"
                        >
                          <Pin className="w-3 h-3" />
                          <span>تثبيت</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVerse(v.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Plus,
  Trash2,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Play,
  X,
  Edit,
  FolderOpen,
  User,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { api, Sermon, Profile } from '../../lib/api';

const DEFAULT_TOPICS = [
  'تعليم وعظة',
  'روحيات',
  'عقيدة',
  'كتاب مقدس',
  'طقوس وألحان',
  'نهضات ومناسبات',
  'قداسات إلهية',
  'عشيات وتسابيح',
  'اجتماعات الشباب',
  'أسرة ومجتمع'
];

export const PriestSermonPage: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [priests, setPriests] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('تعليم وعظة');
  const [customTopic, setCustomTopic] = useState('');
  const [speaker, setSpeaker] = useState('آباء الكنيسة');
  const [customSpeaker, setCustomSpeaker] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [description, setDescription] = useState('');

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const data = await api.getSermons();
      setSermons(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل العظات الكنسية.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPriests = async () => {
    try {
      const data = await api.getPriestProfiles();
      setPriests(data);
    } catch (err: any) {
      console.error('Failed to fetch priest profiles:', err);
    }
  };

  useEffect(() => {
    fetchSermons();
    fetchPriests();
  }, []);

  const handleSyncFromYouTube = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/sync-sermons');
      if (res.ok) {
        const data = await res.json();
        setSyncMessage(`تمت المزامنة بنجاح! تم استيراد ${data.newlySyncedCount || 0} عظات جديدة من قناة اليوتيوب.`);
        await fetchSermons();
      } else {
        setError('تعذر إتمام المزامنة التلقائية حالياً.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء مزامنة يوتيوب.');
    } finally {
      setSyncing(false);
    }
  };

  const openAddModal = () => {
    setEditingSermonId(null);
    setTitle('');
    setTopic('تعليم وعظة');
    setCustomTopic('');
    setSpeaker('آباء الكنيسة');
    setCustomSpeaker('');
    setYoutubeUrl('');
    setSermonDate(new Date().toISOString().split('T')[0]);
    setDurationMinutes(45);
    setDescription('');
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (sermon: Sermon) => {
    setEditingSermonId(sermon.id);
    setTitle(sermon.title);
    if (DEFAULT_TOPICS.includes(sermon.topic)) {
      setTopic(sermon.topic);
      setCustomTopic('');
    } else {
      setTopic('مخصص');
      setCustomTopic(sermon.topic);
    }

    const priestNames = priests.map(p => p.full_name);
    if (sermon.speaker === 'آباء الكنيسة' || priestNames.includes(sermon.speaker)) {
      setSpeaker(sermon.speaker);
      setCustomSpeaker('');
    } else {
      setSpeaker('مخصص');
      setCustomSpeaker(sermon.speaker);
    }

    setYoutubeUrl(sermon.youtube_url || '');
    setSermonDate(sermon.sermon_date || new Date().toISOString().split('T')[0]);
    setDurationMinutes(sermon.duration_minutes || 45);
    setDescription(sermon.description || '');
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان العظة.');
      return;
    }
    setError(null);

    const finalTopic = topic === 'مخصص' ? (customTopic.trim() || 'تعليم وعظة') : topic;
    const finalSpeaker = speaker === 'مخصص' ? (customSpeaker.trim() || 'آباء الكنيسة') : speaker;

    try {
      if (editingSermonId) {
        await api.updateSermon(editingSermonId, {
          title: title.trim(),
          topic: finalTopic,
          speaker: finalSpeaker,
          youtube_url: youtubeUrl.trim() || null,
          sermon_date: sermonDate,
          duration_minutes: durationMinutes,
          description: description.trim() || 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك.',
        });
      } else {
        await api.createSermon({
          title: title.trim(),
          topic: finalTopic,
          speaker: finalSpeaker,
          youtube_url: youtubeUrl.trim() || null,
          sermon_date: sermonDate,
          duration_minutes: durationMinutes,
          audio_url: null,
          description: description.trim() || 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك.',
          featured: false,
          created_by: null,
        });
      }

      setShowModal(false);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ العظة.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العظة من المكتبة؟')) return;
    setError(null);
    try {
      await api.deleteSermon(id);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف العظة.');
    }
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة العظات والكلمات الروحية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              متابعة العظات المنشورة، تصنيف الأقسام، ونشر تسجيلات الدروس والقداسات
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleSyncFromYouTube}
              disabled={syncing}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-[#002366] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span>{syncing ? 'جاري المزامنة...' : 'مزامنة مع يوتيوب 🔄'}</span>
            </button>

            <button
              onClick={openAddModal}
              className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/10 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عظة جديدة</span>
            </button>
          </div>
        </div>

        {/* Sync Success Alert */}
        {syncMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sermons Table / List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-tajawal text-base font-extrabold text-[#002366]">
              العظات والقداسات المسجلة ({sermons.length})
            </h2>
            <span className="text-xs text-slate-500 font-bold">مزامنة مستمرة مع قناة الكنيسة</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل العظات...</div>
          ) : sermons.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold">لا توجد عظات مسجلة حالياً.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold">
                    <th className="p-4">العنوان</th>
                    <th className="p-4">القسم / التصنيف</th>
                    <th className="p-4">الملقي / الكاهن</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {sermons.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-[#002366] text-sm block font-extrabold">{s.title}</span>
                          {s.youtube_url && (
                            <a
                              href={s.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 text-[#d4af37]" />
                              <span>رابط يوتيوب</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
                          {s.topic || 'تعليم وعظة'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800">{s.speaker || 'آباء الكنيسة'}</td>
                      <td className="p-4 text-slate-500">{s.sermon_date}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 border border-blue-100 transition-colors"
                            title="تعديل القسم أو الكاهن"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                    {editingSermonId ? 'تعديل بيانات وتصنيف العظة' : 'إضافة عظة جديدة للمكتبة'}
                  </h3>
                  <p className="text-xs text-slate-200 font-semibold mt-0.5">
                    يمكنك تحديد القسم أو اسم الكاهن المحاضر على الفيديو بشكل اختياري
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
              <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-semibold">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">عنوان العظة / الكلمة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تأملات في صوم السيدة العذراء مريم"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                  />
                </div>

                {/* Topic / Department (اختياري) */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-[#002366]" />
                      القسم / التصنيف (Department - اختياري)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">اختياري</span>
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                  >
                    {DEFAULT_TOPICS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="مخصص">قسم آخر (اكتبه أدناه)...</option>
                  </select>

                  {topic === 'مخصص' && (
                    <input
                      type="text"
                      placeholder="اكتب اسم القسم المخصص..."
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366] mt-2"
                    />
                  )}
                </div>

                {/* Speaker / Priest (اختياري) */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#002366]" />
                      اسم الكاهن / الملقي (اختياري)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">اختياري</span>
                  </label>
                  <select
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                  >
                    <option value="آباء الكنيسة">آباء الكنيسة (افتراضي عام)</option>
                    {priests.map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name}</option>
                    ))}
                    <option value="مخصص">كاهن أو ملقي آخر (اكتبه أدناه)...</option>
                  </select>

                  {speaker === 'مخصص' && (
                    <input
                      type="text"
                      placeholder="اكتب اسم الكاهن أو الملقي..."
                      value={customSpeaker}
                      onChange={(e) => setCustomSpeaker(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366] mt-2"
                    />
                  )}
                </div>

                {/* YouTube URL */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">رابط الفيديو على يوتيوب</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                  />
                </div>

                {/* Date & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">تاريخ العظة</label>
                    <input
                      type="date"
                      value={sermonDate}
                      onChange={(e) => setSermonDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">المدة التقريبية (بالدقائق)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 45)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">وصف أو نقاط العظة (اختياري)</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة أو الشواهد الكتابية للعظة..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-xs focus:border-[#002366] resize-none"
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
                    {editingSermonId ? 'حفظ التعديلات' : 'إضافة العظة للمكتبة'}
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

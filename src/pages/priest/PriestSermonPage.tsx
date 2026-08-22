import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Plus, Trash2, BookOpen, Clock, Sparkles, AlertCircle, RefreshCw, Play, X } from 'lucide-react';
import { api, Sermon, Profile } from '../../lib/api';

export const PriestSermonPage: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [priests, setPriests] = useState<Profile[]>([]);
  const [topic, setTopic] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [duration, setDuration] = useState(45);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // YouTube video preview modal
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

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
      if (data.length > 0 && !speaker) {
        setSpeaker(data[0].full_name);
      }
    } catch (err: any) {
      console.error('Failed to fetch priest profiles:', err);
    }
  };

  useEffect(() => {
    fetchSermons();
    fetchPriests();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speaker || !topic) {
      setError('يرجى تعبئة الحقول الأساسية.');
      return;
    }
    setError(null);

    try {
      await api.createSermon({
        title,
        speaker,
        topic,
        sermon_date: new Date().toISOString().split('T')[0],
        duration_minutes: duration,
        youtube_url: youtubeUrl || null,
        audio_url: null,
        description: description || 'سلسة روحية للتأمل وبناء النفوس.',
        featured: false,
        created_by: null,
      });

      setTitle('');
      setYoutubeUrl('');
      setDuration(45);
      setDescription('');
      setShowAddModal(false);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في نشر العظة.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العظة؟')) return;
    setError(null);
    try {
      await api.deleteSermon(id);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف العظة.');
    }
  };

  // Helper to extract YouTube video ID
  const getYoutubeId = (url: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper to get embed URL
  const getMockYoutubeEmbedUrl = (url: string): string | null => {
    const videoId = getYoutubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Helper to get thumbnail image from YouTube URL
  const getYoutubeThumbnail = (url: string | null): string => {
    const videoId = getYoutubeId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : 'https://images.unsplash.com/photo-1438210125215-18c6132dd786?q=80&w=600&auto=format&fit=crop';
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              مكتبة العظات والدروس الروحية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">رفع عظات الفيديو المباشرة من YouTube وتبويبها</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/10 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عظة جديدة</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content grid */}
        {loading ? (
          <div className="text-center py-12 flex flex-col items-center gap-2 font-bold text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#d4af37]" />
            <span>جاري تحميل العظات...</span>
          </div>
        ) : sermons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4">
            <BookOpen className="w-12 h-12 text-slate-350 mx-auto" />
            <h3 className="font-tajawal font-bold text-slate-655 text-base">مكتبة العظات فارغة حالياً</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">قم بإدراج أول عظة لتظهر للشعب وتتاح عبر مكتبة الموقع.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#002366]/10 hover:bg-[#002366]/20 text-[#002366] font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              إضافة عظة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Header / YouTube Cover */}
                <div className="relative aspect-video bg-slate-900 group overflow-hidden">
                  <img
                    src={getYoutubeThumbnail(sermon.youtube_url)}
                    alt={sermon.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350 opacity-80"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {sermon.youtube_url && (
                    <button
                      onClick={() => setActiveVideoUrl(sermon.youtube_url!)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      title="تشغيل الفيديو"
                    >
                      <Play className="w-6 h-6 fill-current relative left-[-1px]" />
                    </button>
                  )}

                  {sermon.youtube_url && (
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 font-mono">
                      <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.516 3.545 12 3.545 12 3.545s-7.516 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.872.508 9.388.508 9.388.508s7.516 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>فيديو</span>
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#002366]/5 text-[#002366] border border-[#002366]/10 text-[10px] font-bold px-3 py-1 rounded-full">
                        {sermon.topic}
                      </span>
                      <button
                        onClick={() => handleDelete(sermon.id)}
                        className="p-1 text-slate-400 hover:text-red-650 hover:bg-slate-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-tajawal font-extrabold text-base text-[#002366] line-clamp-2 leading-relaxed">
                      {sermon.title}
                    </h3>
                    <p className="text-xs text-slate-550 font-medium line-clamp-2">
                      {sermon.description}
                    </p>
                  </div>

                  <div className="space-y-2 font-bold pt-3 border-t border-slate-50">
                    <p className="text-xs text-[#d4af37]">إلقاء: {sermon.speaker}</p>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold font-cairo">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {sermon.duration_minutes} دقيقة
                      </span>
                      <span>سجل البدء: {sermon.sermon_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {activeVideoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#00113a] rounded-3xl max-w-4xl w-full p-4 relative border border-[#d4af37]/30 shadow-2xl flex flex-col gap-3">
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="absolute top-[-36px] left-0 text-white hover:text-[#fed65b] bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all"
                title="إغلاق اللاعب"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                {getMockYoutubeEmbedUrl(activeVideoUrl) ? (
                  <iframe
                    src={`${getMockYoutubeEmbedUrl(activeVideoUrl)}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs font-semibold">
                    تعذر العثور على تشغيل للفيديو المذكور.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
              <div className="border-b border-[#d4af37]/20 pb-3">
                <h3 className="font-tajawal font-extrabold text-lg text-[#002366]">إضافة عظة جديدة للموقع</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تعبئة البيانات لبث الفيديو عبر البوابة الرقمية</p>
              </div>

              <form onSubmit={handleAdd} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">عنوان العظة الروحية *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl transition-all font-bold text-slate-700"
                    placeholder="عنوان العظة بالتفصيل"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">الخطيب / آب الكاهن *</label>
                    <select
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                    >
                      <option value="" disabled>-- اختر الكاهن --</option>
                      {priests.map((p) => (
                        <option key={p.id} value={p.full_name}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">تصنيف / موضوع العظة *</label>
                    <input
                      type="text"
                      required
                      list="sermon-topics-list"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-700"
                      placeholder="اكتب موضوع جديد أو اختر من القائمة"
                    />
                    <datalist id="sermon-topics-list">
                      {[...new Set(sermons.map(s => s.topic).filter(Boolean))].map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">مدة العظة بالدقائق</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-750"
                  />
                </div>

                <div>
                  <label className="block text-[#002366] font-bold mb-1.5">رابط فيديو YouTube *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">وصف مقتضب</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl resize-none font-bold text-slate-700"
                    placeholder="نبذة عن موضوع العظة أو الآية المحورية..."
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 font-bold text-slate-400 hover:text-slate-650 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all"
                  >
                    حفظ وبرمجة البث
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

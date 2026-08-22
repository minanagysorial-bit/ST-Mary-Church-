import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Sermon, Profile, api } from '../../lib/api';

export const SermonManagementPage: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [priests, setPriests] = useState<Profile[]>([]);
  const [topic, setTopic] = useState('روحيات');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const data = await api.getSermons();
      setSermons(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل العظات.');
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
    if (!title) return;
    setError(null);

    try {
      await api.createSermon({
        title,
        speaker,
        topic,
        sermon_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        youtube_url: youtubeUrl || null,
        audio_url: null,
        description: 'عظة جديدة تم رفعها عبر لوحة تحكم المشرف.',
        featured: false,
        created_by: null,
      });
      setTitle('');
      setYoutubeUrl('');
      setShowAddModal(false);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ العظة.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العظة؟')) return;
    setError(null);
    try {
      await api.deleteSermon(id);
      fetchSermons();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحذف.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة العظات والوسائط الروحية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">رفع وتعديل وتصنيف العظات بالمكتبة الرقمية</p>
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

        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 text-xs animate-pulse">جاري تحميل العظات الكنسية...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sermons.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#002366]/5 text-[#002366] border border-[#002366]/10 text-[10px] font-bold px-3 py-1 rounded-full">
                      {s.topic}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <button className="p-1 px-2 text-slate-500 hover:text-[#002366] hover:bg-slate-50 rounded-lg transition-colors" title="تعديل"><Edit className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 px-2 text-slate-500 hover:text-red-650 hover:bg-red-50 hover:text-[#002366] rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-tajawal font-extrabold text-base text-[#002366] line-clamp-2 leading-relaxed">{s.title}</h3>
                  <p className="text-xs text-[#d4af37] font-bold">بقمصية / إلقاء: {s.speaker}</p>
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-semibold font-cairo">
                  <span>{s.sermon_date}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg">استماع {s.play_count} مرة</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
              <div className="border-b border-[#d4af37]/20 pb-3">
                <h3 className="font-tajawal font-extrabold text-lg text-[#002366]">إضافة عظة جديدة للمكتبة</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تعبئة البيانات لنشر التسجيل أو الفيديو مباشرة</p>
              </div>
              <form onSubmit={handleAdd} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">عنوان العظة الكنسية *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl transition-all font-bold text-slate-700"
                    placeholder="مثال: عظة عن الصبر والاحتمال"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">الخطيب / الملقي</label>
                  <select value={speaker} onChange={e => setSpeaker(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl font-bold text-slate-750">
                    <option value="" disabled>-- اختر الكاهن --</option>
                    {priests.map((p) => (
                      <option key={p.id} value={p.full_name}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#002366] font-bold mb-1.5">رابط YouTube (اختياري)</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] focus:bg-white outline-none p-3 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 font-bold text-slate-400 hover:text-slate-650 transition-colors">إلغاء</button>
                  <button type="submit" className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all">حفظ ونشر العظة</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

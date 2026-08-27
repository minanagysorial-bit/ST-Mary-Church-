import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Sparkles, CheckCircle2, XCircle, Trash2, Edit2, Plus, 
  Search, RefreshCw, Clock, Phone, Images, Eye, Save, X, 
  Share2, Heart, Filter, AlertCircle, MessageCircle
} from 'lucide-react';
import { 
  api, 
  type CommunityMemory, 
  type CommunityMemoryCategory, 
  convertDriveUrl 
} from '../../lib/api';
import { useToast } from '../../components/common/Toast';

const CATEGORIES_LIST: CommunityMemoryCategory[] = [
  'أكاليل ومناسبات',
  'معجزات وبركات',
  'ذكريات مع الآباء',
  'أنشطة وخدام زمان',
  'تاريخ وتراث'
];

export const MemoriesModerationPage: React.FC = () => {
  const toast = useToast();
  const [memories, setMemories] = useState<CommunityMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [title, setTitle] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [category, setCategory] = useState<CommunityMemoryCategory>('أكاليل ومناسبات');
  const [storyContent, setStoryContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunityMemories('all');
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories for moderation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setAuthorName('');
    setContactPhone('');
    setTitle('');
    setEventYear('');
    setCategory('أكاليل ومناسبات');
    setStoryContent('');
    setImageUrls(['']);
    setStatus('approved');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (memory: CommunityMemory) => {
    setEditingId(memory.id);
    setAuthorName(memory.author_name);
    setContactPhone(memory.contact_phone || '');
    setTitle(memory.title);
    setEventYear(memory.event_year);
    setCategory(memory.category);
    setStoryContent(memory.story_content);
    setImageUrls(memory.image_urls.length > 0 ? memory.image_urls : ['']);
    setStatus(memory.status);
    setIsModalOpen(true);
  };

  const handleAddImageField = () => {
    if (imageUrls.length < 3) {
      setImageUrls(prev => [...prev, '']);
    }
  };

  const handleRemoveImageField = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageFieldChange = (idx: number, val: string) => {
    setImageUrls(prev => prev.map((url, i) => i === idx ? val : url));
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validImages = imageUrls
        .map(u => u.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map(convertDriveUrl);

      if (editingId) {
        await api.updateCommunityMemory(editingId, {
          author_name: authorName.trim(),
          contact_phone: contactPhone.trim() || null,
          title: title.trim(),
          event_year: eventYear.trim(),
          category,
          story_content: storyContent.trim(),
          image_urls: validImages,
          status
        });
        toast.showToast('تم تحديث الذكرى بنجاح!', 'success');
      } else {
        const newMem = await api.submitCommunityMemory({
          author_name: authorName.trim(),
          contact_phone: contactPhone.trim() || undefined,
          title: title.trim(),
          event_year: eventYear.trim(),
          category,
          story_content: storyContent.trim(),
          image_urls: validImages
        });
        if (status === 'approved') {
          await api.updateCommunityMemoryStatus(newMem.id, 'approved');
        }
        toast.showToast('تمت إضافة الذكرى بنجاح!', 'success');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.showToast('حدث خطأ أثناء حفظ البيانات.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.updateCommunityMemoryStatus(id, 'approved');
      setMemories(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
      toast.showToast('تم اعتماد ونشر الذكرى على جدار الكنيسة! 🌟', 'success');
    } catch (err) {
      toast.showToast('فشل اعتماد الذكرى.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رفض هذه المشاركة؟')) return;
    try {
      await api.updateCommunityMemoryStatus(id, 'rejected');
      setMemories(prev => prev.map(m => m.id === id ? { ...m, status: 'rejected' } : m));
      toast.showToast('تم رفض المشاركة.', 'info');
    } catch (err) {
      toast.showToast('فشل رفض المشاركة.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الذكرى نهائياً؟')) return;
    try {
      await api.deleteCommunityMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      toast.showToast('تم حذف الذكرى نهائياً.', 'success');
    } catch (err) {
      toast.showToast('فشل حذف الذكرى.', 'error');
    }
  };

  const pendingCount = useMemo(() => memories.filter(m => m.status === 'pending').length, [memories]);
  const approvedCount = useMemo(() => memories.filter(m => m.status === 'approved').length, [memories]);

  const filteredMemories = useMemo(() => {
    let list = [...memories];
    if (activeTab !== 'all') {
      list = list.filter(m => m.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) ||
        m.author_name.toLowerCase().includes(q) ||
        m.story_content.toLowerCase().includes(q) ||
        (m.contact_phone && m.contact_phone.includes(q))
      );
    }
    return list;
  }, [memories, activeTab, searchQuery]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 text-right font-cairo" dir="rtl">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white p-6 sm:p-8 rounded-3xl border border-[#d4af37]/40 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إدارة التراث والذكريات الشفاهية</span>
              </div>
              <h1 className="font-tajawal text-xl sm:text-3xl font-extrabold text-white">
                مراجعة واعتماد جدار ذكريات الكنيسة
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                مراجعة واعتماد القصص والصور التذكارية المرسلة من شعب الكنيسة قبل نشرها للعامة
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] px-5 py-3 rounded-2xl font-tajawal font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ذكرى جديدة (كمشرف)</span>
            </button>
          </div>
        </div>

        {/* Tabs & Search Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان، اسم الكاتب، أو رقم الهاتف..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-10 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 transition-colors flex items-center justify-center gap-1 text-xs font-bold shrink-0"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>قيد المراجعة</span>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'approved'
                  ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>المعتمدة والمنشورة</span>
              <span className="text-slate-400 text-[11px]">({approvedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              المرفوضة
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              جميع المشاركات ({memories.length})
            </button>
          </div>
        </div>

        {/* Stories List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold space-y-3">
            <RefreshCw className="w-8 h-8 text-[#002366] animate-spin mx-auto" />
            <p>جاري تحميل المشاركات...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 font-bold space-y-2">
            <Images className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm">لا توجد مشاركات في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map(memory => {
              const isPending = memory.status === 'pending';
              const isApproved = memory.status === 'approved';
              const hasImages = memory.image_urls && memory.image_urls.length > 0;

              return (
                <div
                  key={memory.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs space-y-4 ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                    
                    {/* Details (Right) */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                            isApproved 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isPending 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isApproved ? 'منشورة ومعتمدة 🌟' : isPending ? 'بانتظار المراجعة ⏳' : 'مرفوضة ❌'}
                          </span>

                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            {memory.category}
                          </span>

                          {memory.event_year && (
                            <span className="bg-amber-50 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                              {memory.event_year}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(memory.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      <h3 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366]">
                        {memory.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                        <span>✍️ الراوي: <b className="text-slate-900">{memory.author_name}</b></span>
                        {memory.contact_phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span dir="ltr">{memory.contact_phone}</span>
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                        {memory.story_content}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(memory.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>اعتماد ونشر على الجدار</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleReject(memory.id)}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>رفض</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(memory)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>تعديل</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(memory.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Images Preview (Left) */}
                    {hasImages && (
                      <div className="lg:w-64 shrink-0 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          الصور المرفقة ({memory.image_urls.length}):
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {memory.image_urls.map((url, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={convertDriveUrl(url)}
                              target="_blank"
                              rel="noreferrer"
                              className="h-24 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group block shadow-2xs"
                            >
                              <img
                                src={convertDriveUrl(url)}
                                alt={`صورة ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366]">
                {editingId ? 'تعديل بيانات الذكرى' : 'إضافة ذكرى جديدة (كمشرف)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اسم الكاتب أو العائلة</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان الذكرى</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">السنة / الحقبة</label>
                  <input
                    type="text"
                    value={eventYear}
                    onChange={(e) => setEventYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommunityMemoryCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  >
                    {CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">حالة النشر</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  >
                    <option value="approved">معتمدة ومنشورة 🌟</option>
                    <option value="pending">قيد المراجعة ⏳</option>
                    <option value="rejected">مرفوضة ❌</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نص القصة</label>
                <textarea
                  required
                  rows={4}
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none leading-relaxed"
                />
              </div>

              {/* Images */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">روابط الصور (بحد أقصى ٣ صور)</label>
                  {imageUrls.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddImageField}
                      className="text-xs text-[#002366] font-bold hover:underline"
                    >
                      + إضافة صورة
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageFieldChange(idx, e.target.value)}
                        placeholder={`رابط الصورة ${idx + 1} (Google Drive أو مباشر)`}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                      />
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageField(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

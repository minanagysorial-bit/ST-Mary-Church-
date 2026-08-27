import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Calendar, Heart, Share2, MessageCircle, 
  Send, Plus, X, Search, Sparkles, Images, Check,
  ZoomIn, ChevronLeft, ArrowLeft, Clock, Filter, Eye, AlertCircle,
  HelpCircle, ShieldCheck
} from 'lucide-react';
import { api, type CommunityMemory, type CommunityMemoryCategory, convertDriveUrl, parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

const CATEGORIES_LIST: CommunityMemoryCategory[] = [
  'أكاليل ومناسبات',
  'معجزات وبركات',
  'ذكريات مع الآباء',
  'أنشطة وخدام زمان',
  'تاريخ وتراث'
];

export const CommunityMemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<CommunityMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  
  // Submission Modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Submission Form State
  const [authorName, setAuthorName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [title, setTitle] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [category, setCategory] = useState<CommunityMemoryCategory>('أكاليل ومناسبات');
  const [storyContent, setStoryContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunityMemories('approved');
      setMemories(data);
    } catch (err) {
      console.error('Failed to load community memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrls.length < 3) {
      setImageUrls(prev => [...prev, '']);
    }
  };

  const handleRemoveImageUrl = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImageUrlChange = (idx: number, val: string) => {
    setImageUrls(prev => prev.map((url, i) => i === idx ? val : url));
  };

  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !title.trim() || !storyContent.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية.');
      return;
    }

    setSubmitting(true);
    try {
      const validImages = imageUrls
        .map(u => u.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map(convertDriveUrl);

      await api.submitCommunityMemory({
        author_name: authorName,
        contact_phone: contactPhone,
        title,
        event_year: eventYear,
        category,
        story_content: storyContent,
        image_urls: validImages
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccess(false);
        // Reset form
        setAuthorName('');
        setContactPhone('');
        setTitle('');
        setEventYear('');
        setStoryContent('');
        setImageUrls(['']);
      }, 2500);
    } catch (err) {
      console.error('Failed to submit memory:', err);
      alert('حدث خطأ أثناء إرسال الذكرى. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedCount = await api.likeCommunityMemory(id);
      setMemories(prev => prev.map(m => m.id === id ? { ...m, likes_count: updatedCount } : m));
    } catch (err) {
      console.error('Error liking memory:', err);
    }
  };

  const handleShareWhatsApp = (memory: CommunityMemory, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📜 *${memory.title}*\n✍️ رواها: ${memory.author_name} (${memory.event_year})\n\n"${memory.story_content}"\n\n(جدار ذكريات كنيسة السيدة العذراء مريم بمحرم بك)\n🔗 https://www.tibarthenos.com/about/memories`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareFacebook = (memory: CommunityMemory, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.tibarthenos.com/about/memories`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyLink = (memory: CommunityMemory, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📜 "${memory.title}" - ${memory.author_name}\nhttps://www.tibarthenos.com/about/memories`;
    navigator.clipboard.writeText(text);
    setCopiedId(memory.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredMemories = useMemo(() => {
    let list = [...memories];
    if (selectedCategory !== 'الكل') {
      list = list.filter(m => m.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) ||
        m.author_name.toLowerCase().includes(q) ||
        m.story_content.toLowerCase().includes(q) ||
        (m.event_year && m.event_year.toLowerCase().includes(q))
      );
    }
    return list;
  }, [memories, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo text-right" dir="rtl">
      <SEO
        title="جدار الذكريات | حكايات من محرم بك"
        description="شارك واقرأ حكايات وذكريات وصور شعب كنيسة السيدة العذراء مريم بمحرم بك عبر الأجيال."
        canonicalUrl="https://www.tibarthenos.com/about/memories"
      />

      {/* Top Banner */}
      <section className="relative py-12 bg-[#00113a] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] to-[#00113a]/80 z-10" />
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-3">
          <Link to="/about" className="inline-flex items-center gap-1 text-[#fed65b] text-xs font-bold hover:underline mb-2">
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع إلى "عن الكنيسة"</span>
          </Link>

          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/40 px-3.5 py-1 rounded-full text-[#fed65b] text-xs font-bold mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>توثيق التاريخ الشعبي والروحي لشعب الكنيسة</span>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold tracking-wide text-white">
            جدار ذكريات الكنيسة «حكايات من محرم بك»
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed">
            مساحة تذكارية مفتوحة لمشاركة صور أكاليل زمان، ذكريات مع الآباء المتنيحين، بركات ومعجزات العذراء، وأيام مدارس الأحد الأولى
          </p>

          <div className="pt-2">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] px-6 py-3 rounded-2xl font-tajawal font-extrabold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>✍️ شارك ذكرياتك أو صورتك التذكارية (بحد أقصى ٣ صور)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        
        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في القصص بالاسم، العنوان، الكاتب، أو السنة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-10 py-3 text-xs font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('الكل')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'الكل'
                  ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              الكل ({memories.length})
            </button>
            {CATEGORIES_LIST.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Story Cards List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold space-y-3">
            <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>جاري تحميل ذكريات وحكايات محرم بك...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 font-bold space-y-3">
            <Images className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm">
              {searchQuery || selectedCategory !== 'الكل'
                ? 'لا توجد حكايات تطابق معايير البحث الحالية.'
                : 'كن أول من يشارك بذكرياته وصوره التذكارية على جدار الكنيسة!'}
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs py-2 px-5 rounded-xl transition-all"
            >
              ✍️ شارك بقصتك الآن
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMemories.map((memory) => {
              const hasImages = memory.image_urls && memory.image_urls.length > 0;
              const photosCount = memory.image_urls?.length || 0;

              return (
                <div
                  key={memory.id}
                  className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 hover:border-[#002366]/40 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
                    
                    {/* 👉 1. Right Side (RTL): Author, Title, Category, Content & Actions */}
                    <div className="flex-1 flex flex-col justify-between space-y-4 text-right">
                      
                      <div className="space-y-3">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-50 text-[#00174a] border border-amber-200 text-[11px] font-extrabold px-3 py-1 rounded-full">
                              {memory.category}
                            </span>
                            {memory.event_year && (
                              <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#d4af37]" />
                                <span>{memory.event_year}</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 font-bold">
                            تاريخ النشر: {new Date(memory.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-tajawal font-extrabold text-lg sm:text-xl text-[#002366] leading-snug">
                          {memory.title}
                        </h3>

                        {/* Author */}
                        <p className="text-xs text-[#d4af37] font-extrabold flex items-center gap-1.5">
                          <span>✍️ رواها:</span>
                          <span className="text-slate-800">{memory.author_name}</span>
                        </p>

                        {/* Story Content */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {memory.story_content}
                        </div>
                      </div>

                      {/* Social Sharing & Like Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        
                        {/* Likes (بركة صلواتهم) */}
                        <button
                          onClick={(e) => handleLike(memory.id, e)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                          title="بركة صلواتهم"
                        >
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          <span>✝️ بركة صلواتهم</span>
                          <span className="bg-white px-2 py-0.5 rounded-md text-[11px] font-mono shadow-2xs">
                            {memory.likes_count || 0}
                          </span>
                        </button>

                        {/* Social Share Buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                            مشاركة:
                          </span>

                          <button
                            onClick={(e) => handleShareWhatsApp(memory, e)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all"
                            title="مشاركة على الواتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>واتساب</span>
                          </button>

                          <button
                            onClick={(e) => handleShareFacebook(memory, e)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all"
                            title="مشاركة على فيسبوك"
                          >
                            <Share2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>فيسبوك</span>
                          </button>

                          <button
                            onClick={(e) => handleCopyLink(memory, e)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                            title="نسخ الرابط"
                          >
                            {copiedId === memory.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* 👈 2. Left Side (Left): Images Gallery (1 to 3 Photos) */}
                    {hasImages && (
                      <div className="lg:w-72 shrink-0 flex flex-col justify-center">
                        <div className={`grid gap-2 ${
                          photosCount === 1 
                            ? 'grid-cols-1' 
                            : photosCount === 2 
                            ? 'grid-cols-2' 
                            : 'grid-cols-2'
                        }`}>
                          {memory.image_urls.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => {
                                setLightboxImages(memory.image_urls);
                                setLightboxIndex(imgIdx);
                              }}
                              className={`bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative cursor-zoom-in group shadow-xs hover:shadow-md transition-all ${
                                photosCount === 3 && imgIdx === 0 ? 'col-span-2 h-36' : 'h-28'
                              }`}
                            >
                              <img
                                src={convertDriveUrl(imgUrl)}
                                alt={`${memory.title} - صورة ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] text-center text-slate-400 font-bold mt-1.5 block">
                          اضغط على الصورة لتكبيرها ({photosCount} {photosCount === 1 ? 'صورة' : 'صور'})
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ✍️ Submission Modal (تقديم ذكرى جديدة) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366]">
                    مشاركة ذكريات وصور تذكارية
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    تُراجع المشاركة من مشرف الكنيسة قبل النشر على الجدار
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-tajawal text-lg font-extrabold text-slate-800">
                  تم استلام مشاركتك المباركة بنجاح!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  شكراً لمحبتك وحرصك على توثيق ذكريات الكنيسة. ستتم مراجعة القصة من المشرف ونشرها على الجدار قريباً ✝️
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitMemory} className="space-y-4">
                
                {/* Author & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      اسم الكاتب أو العائلة <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="مثال: عائلة الشماس يوسف حنا"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      رقم الواتساب / الهاتف <span className="text-[10px] text-slate-400">(سري للمراجعة فقط)</span>
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="012xxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Title & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      عنوان الذكرى أو الحدث <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: صورة إكليل والديّ بالكنيسة"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      السنة أو الحقبة الزمنية
                    </label>
                    <input
                      type="text"
                      value={eventYear}
                      onChange={(e) => setEventYear(e.target.value)}
                      placeholder="مثال: ١٩٧٨م أو السبعينات"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    تصنيف الذكرى <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommunityMemoryCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    {CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Story Content */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    نص القصة والذكرى <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={storyContent}
                    onChange={(e) => setStoryContent(e.target.value)}
                    placeholder="اكتب تفاصيل القصة والبركة وما تود توثيقه لشعب الكنيسة والأجيال القادمة..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none leading-relaxed"
                  />
                </div>

                {/* Images (Max 3, Supports Google Drive Links) */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-[#d4af37]" />
                      <span>روابط الصور التذكارية (بحد أقصى ٣ صور)</span>
                    </label>
                    {imageUrls.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="text-[11px] font-bold text-[#002366] hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة صورة أخرى</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    💡 يمكنك وضع رابط مشاركة مباشر من Google Drive أو أي رابط صورة على الإنترنت.
                  </p>

                  <div className="space-y-2">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                          {idx + 1}
                        </span>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                          placeholder={`رابط صورة ${idx + 1} (Google Drive أو مباشر)`}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs outline-none font-mono"
                        />
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrl(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-tajawal font-extrabold py-3 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'جاري الإرسال للمراجعة...' : 'إرسال القصة للمراجعة والاعتماد'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-colors"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {lightboxImages && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setLightboxImages(null)}
        >
          <div
            className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between text-white z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 text-xs text-slate-300">
              صورة {lightboxIndex + 1} من {lightboxImages.length}
            </div>

            <button
              className="bg-white/10 hover:bg-rose-600 text-white p-2.5 rounded-2xl transition-all shadow-lg"
              onClick={() => setLightboxImages(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all z-50 hidden sm:flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
                }}
              >
                <ChevronRight className="w-8 h-8 text-[#fed65b]" />
              </button>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all z-50 hidden sm:flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
                }}
              >
                <ChevronLeft className="w-8 h-8 text-[#fed65b]" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={convertDriveUrl(lightboxImages[lightboxIndex])}
              alt={`صورة مكبرة ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
};

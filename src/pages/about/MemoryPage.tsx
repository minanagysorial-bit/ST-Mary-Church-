import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, Calendar, 
  Images, X, ChevronLeft, ZoomIn, Search, Sparkles, AlertCircle,
  ArrowDownWideNarrow, ArrowUpNarrowWide, Clock, History, Filter
} from 'lucide-react';
import { api, type MemoryAlbum, parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

/**
 * Extracts a chronological timestamp from an Arabic/Gregorian date string
 */
function extractChronologicalTimestamp(dateStr?: string | null, fallbackCreatedAt?: string): number {
  if (!dateStr && !fallbackCreatedAt) return 0;

  // Convert Arabic digits (٠-٩) to English (0-9)
  const normalized = (dateStr || '').replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

  // 1. Try finding 4-digit year (1800 - 2099)
  const yearMatch = normalized.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
  
  // 2. Try parsing standard date
  const parsedDate = Date.parse(normalized);
  if (!isNaN(parsedDate) && parsedDate > 0) {
    return parsedDate;
  }

  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return new Date(year, 0, 1).getTime();
  }

  if (fallbackCreatedAt) {
    const fallback = Date.parse(fallbackCreatedAt);
    if (!isNaN(fallback)) return fallback;
  }

  return 0;
}

export const MemoryPage: React.FC = () => {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = Newest first, 'asc' = Oldest first
  const [selectedYear, setSelectedYear] = useState<string>('الكل');
  const [selectedAlbum, setSelectedAlbum] = useState<MemoryAlbum | null>(null);
  
  // Lightbox gallery state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getMemoryAlbums();
      setAlbums(data);
    } catch (err) {
      console.error('Failed to load memory albums:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct list of historical years extracted from album dates
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    albums.forEach(album => {
      const normalized = (album.event_date || '').replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
      const yearMatch = normalized.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        yearsSet.add(yearMatch[1]);
      }
    });
    return Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [albums]);

  // Filtered and Chronologically Sorted Albums
  const processedAlbums = useMemo(() => {
    let list = [...albums];

    // 1. Text Search Filter (Title or Date)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(album => 
        album.title.toLowerCase().includes(q) ||
        (album.event_date && album.event_date.toLowerCase().includes(q))
      );
    }

    // 2. Year Filter
    if (selectedYear !== 'الكل') {
      list = list.filter(album => {
        const normalized = (album.event_date || '').replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
        return normalized.includes(selectedYear);
      });
    }

    // 3. Chronological Sorting
    list.sort((a, b) => {
      const timeA = extractChronologicalTimestamp(a.event_date, a.created_at);
      const timeB = extractChronologicalTimestamp(b.event_date, b.created_at);

      if (sortOrder === 'desc') {
        return timeB - timeA; // Newest first
      } else {
        return timeA - timeB; // Oldest first
      }
    });

    return list;
  }, [albums, searchQuery, selectedYear, sortOrder]);

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedAlbum && lightboxIndex !== null) {
      setLightboxIndex((prev) => 
        prev === null ? 0 : (prev + 1) % selectedAlbum.image_urls.length
      );
    }
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedAlbum && lightboxIndex !== null) {
      setLightboxIndex((prev) => 
        prev === null ? 0 : (prev - 1 + selectedAlbum.image_urls.length) % selectedAlbum.image_urls.length
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo text-right" dir="rtl">
      <SEO 
        title={selectedAlbum ? `${selectedAlbum.title} | ألبوم الذاكرة التذكارية` : "أيام فى ذاكرة الكنيسة | ألبوم الصور التذكارية"}
        description={selectedAlbum ? `استعرض صور ألبوم "${selectedAlbum.title}" (${selectedAlbum.event_date}) التذكاري لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.` : "معرض وأرشيف ألبومات الصور التذكارية والمحطات التاريخية العريقة لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية."}
        keywords={[
          'البوم صور كنيسة العذراء محرم بك',
          'ارشيف صور كنيسة العذراء محرم بك',
          'ذكريات كنيسة العذراء محرم بك',
          'صور تذكارية كنيسة العذراء اسكندرية'
        ]}
        canonicalUrl="https://www.tibarthenos.com/about/memory"
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
            <span>الأرشيف المصور للمناسبات التاريخية</span>
          </div>
          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold tracking-wide">
            أيام فى ذاكرة الكنيسة
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl mx-auto">
            سجل المحطات التاريخية والألبومات التذكارية المصورة لكنيسة السيدة العذراء مريم بمحرم بك مرتبة زمنياً
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-8">
          {selectedAlbum ? (
            /* Expanded Album Gallery view */
            <div className="space-y-6 animate-fadeIn">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-[#002366] hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرجوع لكافة الألبومات</span>
              </button>

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="font-tajawal font-extrabold text-xl sm:text-2xl text-[#002366]">
                      {selectedAlbum.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#d4af37]" />
                      <span>تاريخ المناسبة: {selectedAlbum.event_date}</span>
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 px-3.5 py-1.5 rounded-full w-fit">
                    {selectedAlbum.image_urls.length} صورة تذكارية
                  </span>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedAlbum.image_urls.map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="aspect-square bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden relative cursor-zoom-in group shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <img 
                        src={url} 
                        alt={`${selectedAlbum.title} - ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Albums Cards List with Search Bar & Chronological Controls */
            <div className="space-y-6">
              
              {/* 🔍 Search Bar & Sort Order Controls Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن ألبوم بالاسم، السنة، أو المناسبة التاريخية..."
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

                  {/* 🔄 Chronological Sort Order Toggle Button */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="w-full sm:w-auto px-4 py-3 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] rounded-2xl text-xs font-extrabold font-tajawal transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 active:scale-95"
                    title="تغيير اتجاه الترتيب الزمني"
                  >
                    {sortOrder === 'desc' ? (
                      <>
                        <ArrowDownWideNarrow className="w-4 h-4" />
                        <span>الترتيب: من الأحدث للأقدم ⬇️</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpNarrowWide className="w-4 h-4" />
                        <span>الترتيب: من الأقدم للأحدث ⬆️</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 📅 Historical Era / Year Filter Pills */}
                {availableYears.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>تصفية بالسنة:</span>
                    </span>
                    <button
                      onClick={() => setSelectedYear('الكل')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedYear === 'الكل'
                          ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      الكل ({albums.length})
                    </button>
                    {availableYears.map(yr => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          selectedYear === yr
                            ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {yr}م
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                  <span>تم العثور على {processedAlbums.length} ألبوم تذكاري</span>
                  <span className="text-slate-400">مرتبة ترتيباً زمنياً دقيقاً ⏳</span>
                </div>
              </div>

              {/* Albums Grid */}
              {loading ? (
                <div className="py-20 text-center text-slate-400 font-bold space-y-3">
                  <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p>جاري تحميل الألبومات الفوتوغرافية...</p>
                </div>
              ) : processedAlbums.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 font-bold space-y-3">
                  <Images className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm">
                    {searchQuery || selectedYear !== 'الكل' 
                      ? 'لا توجد ألبومات تذكارية تطابق معايير البحث الحالية.' 
                      : 'لا توجد ألبومات صور تذكارية مسجلة حالياً.'}
                  </p>
                  {(searchQuery || selectedYear !== 'الكل') && (
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedYear('الكل'); }}
                      className="text-xs text-[#002366] underline font-bold"
                    >
                      إعادة تعيين البحث وعرض كافة الألبومات
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedAlbums.map((album) => {
                    const { convertedUrl, styles } = parseImageTransform(album.cover_image_url);
                    return (
                      <div
                        key={album.id}
                        onClick={() => setSelectedAlbum(album)}
                        className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                      >
                        <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                          <img
                            src={convertedUrl}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                            }}
                          />
                          
                          {/* Chronological Date Badge */}
                          <div className="absolute top-3 right-3 bg-[#00174a]/90 border border-[#d4af37]/40 text-[#fed65b] text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#d4af37]" />
                            <span>{album.event_date}</span>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white text-xs font-bold flex items-center gap-1">
                              <span>فتح واستعراض الألبوم</span>
                              <ChevronLeft className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-2 text-right flex-1 flex flex-col justify-between">
                          <h3 className="font-tajawal font-extrabold text-base text-[#002366] group-hover:text-[#d4af37] transition-colors leading-snug">
                            {album.title}
                          </h3>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Images className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{album.image_urls.length} صورة</span>
                            </span>
                            <span className="text-[#002366] font-extrabold group-hover:underline flex items-center gap-0.5">
                              <span>مشاهدة</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {selectedAlbum && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Info Bar */}
          <div 
            className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between text-white z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="font-tajawal text-sm font-bold text-[#fed65b] block">
                {selectedAlbum.title}
              </span>
              <span className="text-xs text-slate-300">
                صورة {lightboxIndex + 1} من {selectedAlbum.image_urls.length}
              </span>
            </div>

            <button 
              className="bg-white/10 hover:bg-rose-600 text-white p-2.5 rounded-2xl transition-all shadow-lg"
              onClick={() => setLightboxIndex(null)}
              title="إغلاق المعاينة"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous Photo Button */}
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all z-50 backdrop-blur-md hidden sm:flex items-center justify-center"
            onClick={handlePrevPhoto}
            title="الصورة السابقة"
          >
            <ChevronRight className="w-8 h-8 text-[#fed65b]" />
          </button>

          {/* Active Image */}
          <div 
            className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={selectedAlbum.image_urls[lightboxIndex]} 
              alt={`${selectedAlbum.title} - ${lightboxIndex + 1}`} 
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Next Photo Button */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all z-50 backdrop-blur-md hidden sm:flex items-center justify-center"
            onClick={handleNextPhoto}
            title="الصورة التالية"
          >
            <ChevronLeft className="w-8 h-8 text-[#fed65b]" />
          </button>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, Calendar, 
  Images, X, ChevronLeft, ZoomIn, Search, Sparkles, AlertCircle
} from 'lucide-react';
import { api, type MemoryAlbum, parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

export const MemoryPage: React.FC = () => {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filtered albums based on search query (title or date/year)
  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const q = searchQuery.trim().toLowerCase();
    return albums.filter(album => 
      album.title.toLowerCase().includes(q) ||
      (album.event_date && album.event_date.toLowerCase().includes(q))
    );
  }, [albums, searchQuery]);

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
            سجل المحطات التاريخية والألبومات التذكارية المصورة لكنيسة السيدة العذراء مريم بمحرم بك عبر الأجيال
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Photo Albums Content */}
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
            /* Albums Cards List with Search Bar */
            <div className="space-y-6">
              
              {/* Search Bar Bar Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full">
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

                <div className="text-xs font-bold text-slate-500 shrink-0 self-end sm:self-auto">
                  {filteredAlbums.length} ألبوم تذكاري
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400 font-bold space-y-3">
                  <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p>جاري تحميل الألبومات الفوتوغرافية...</p>
                </div>
              ) : filteredAlbums.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 font-bold space-y-3">
                  <Images className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm">
                    {searchQuery ? `لا توجد ألبومات تطابق كلمة البحث "${searchQuery}"` : 'لا توجد ألبومات صور تذكارية مسجلة حالياً.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#002366] underline font-bold"
                    >
                      عرض كافة الألبومات
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                  {filteredAlbums.map((album) => (
                    <div 
                      key={album.id}
                      onClick={() => setSelectedAlbum(album)}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                    >
                      <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                        {(() => {
                          const { convertedUrl, rawUrl, styles } = parseImageTransform(album.cover_image_url);
                          return (
                            <img 
                              src={convertedUrl || rawUrl} 
                              alt={album.title} 
                              style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          );
                        })()}
                        <div className="absolute top-3 right-3 bg-[#00174a]/90 backdrop-blur-sm border border-[#d4af37]/40 text-[#fed65b] text-[10px] font-bold px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#fed65b]" />
                          <span>{album.event_date}</span>
                        </div>
                      </div>

                      <div className="p-5 text-right space-y-3 flex-grow flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h3 className="font-tajawal font-extrabold text-sm sm:text-base text-[#002366] group-hover:text-[#d4af37] transition-colors leading-snug line-clamp-2">
                            {album.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 font-bold">
                            يحتوي على ({album.image_urls.length}) صورة تذكارية
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#002366]">
                          <span className="text-slate-400 text-[10px]">استعراض الألبوم</span>
                          <div className="flex items-center gap-1 text-[#002366] group-hover:text-[#d4af37] transition-colors">
                            <span>عرض الصور</span>
                            <ChevronLeft className="w-4 h-4 translate-x-1 group-hover:translate-x-0 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && selectedAlbum && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Control Bar */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-center text-white z-55 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm">
            <div className="text-xs font-bold text-slate-300">
              {lightboxIndex + 1} / {selectedAlbum.image_urls.length}
            </div>
            <div className="font-tajawal text-sm font-bold text-[#fed65b] truncate max-w-xs sm:max-w-md">
              {selectedAlbum.title}
            </div>
            <button 
              onClick={() => setLightboxIndex(null)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Buttons */}
          <button 
            onClick={handlePrevPhoto}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all hover:scale-110 z-55"
            title="الصورة السابقة"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button 
            onClick={handleNextPhoto}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all hover:scale-110 z-55"
            title="الصورة التالية"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Current Photo View */}
          <div 
            className="max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedAlbum.image_urls[lightboxIndex]} 
              alt={`${selectedAlbum.title} - ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-scaleUp"
            />
          </div>
        </div>
      )}
    </div>
  );
};

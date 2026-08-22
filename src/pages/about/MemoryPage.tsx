import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, Calendar, 
  Images, X, ChevronLeft, ZoomIn, Info
} from 'lucide-react';
import { api, type MemoryAlbum, parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

export const MemoryPage: React.FC = () => {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([]);
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-[#fbf9f8] font-cairo">
      <SEO 
        title={selectedAlbum ? `${selectedAlbum.title} | ألبوم الذاكرة التذكارية` : "أيام فى ذاكرة الكنيسة | ألبوم الصور التذكارية"}
        description={selectedAlbum ? `استعرض صور ألبوم "${selectedAlbum.title}" (${selectedAlbum.event_date}) التذكاري لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.` : "معرض وأرشيف ألبومات الصور التذكارية والمحطات التاريخية العريقة لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية."}
        keywords={[
          'البوم صور كنيسة العذراء محرم بك',
          'ارشيف صور كنيسة العذراء محرم بك',
          'ذكريات كنيسة العذراء محرم بك',
          'صور تذكارية كنيسة العذراء اسكندرية'
        ]}
        canonicalUrl="https://stmary-moharambek-digitalhub.org/about/memory"
      />
      {/* Top Banner */}
      <section className="relative py-12 bg-[#00113a] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] to-[#00113a]/80 z-10" />
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-3">
          <Link to="/about" className="inline-flex items-center gap-1 text-[#fed65b] text-xs font-bold hover:underline mb-2">
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع إلى "عن الكنيسة"</span>
          </Link>
          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold tracking-wide">
            أيام فى ذاكرة الكنيسة
          </h1>
          <p className="text-slate-350 text-xs font-medium">سجل المحطات التاريخية والألبومات التذكارية لحي محرم بك العريق</p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Photo Albums Content */}
        <div className="space-y-8">
          {selectedAlbum ? (
            /* Expanded Album Gallery view */
            <div className="space-y-6 animate-fadeIn">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="inline-flex items-center gap-1 bg-[#002366]/5 hover:bg-[#002366]/10 text-[#002366] font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرجوع لكافة الألبومات</span>
              </button>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-right">
                <div>
                  <h2 className="font-tajawal font-extrabold text-xl text-[#002366]">
                    {selectedAlbum.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold mt-1 flex items-center justify-end gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{selectedAlbum.event_date}</span>
                  </p>
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
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Albums Cards List */
            <>
              {loading ? (
                <div className="py-20 text-center text-slate-400 font-bold space-y-3">
                  <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p>جاري تحميل الألبومات الفوتوغرافية...</p>
                </div>
              ) : albums.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-[#c5c6d2] text-center text-slate-400 font-bold">
                  <Images className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>لا يوجد ألبومات صور تذكارية حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                  {albums.map((album) => (
                    <div 
                      key={album.id}
                      onClick={() => setSelectedAlbum(album)}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                    >
                      <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                        {(() => {
                          const { convertedUrl, rawUrl, styles } = parseImageTransform(album.cover_image_url);
                          return (
                            <img 
                              src={convertedUrl || rawUrl} 
                              alt={album.title} 
                              style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                              className="w-full h-full object-cover transition-transform duration-500"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          );
                        })()}
                        <div className="absolute top-3 right-3 bg-[#00174a]/85 border border-[#d4af37]/35 text-[#fed65b] text-[9px] font-bold px-2.5 py-0.5 rounded-md shadow">
                          {album.event_date}
                        </div>
                      </div>

                      <div className="p-5 text-right space-y-2 flex-grow flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h3 className="font-tajawal font-extrabold text-sm sm:text-base text-[#002366] group-hover:text-[#d4af37] transition-colors leading-snug line-clamp-2">
                            {album.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 font-bold">
                            يحتوي على ({album.image_urls.length}) صورة تذكارية
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-50 flex items-center justify-end text-[10px] sm:text-xs font-bold text-[#002366]">
                          <span>عرض الصور</span>
                          <ChevronLeft className="w-4 h-4 translate-x-1 group-hover:translate-x-0 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
            <span className="text-xs sm:text-sm font-bold tracking-wider">
              {lightboxIndex + 1} / {selectedAlbum.image_urls.length}
            </span>
            <span className="font-tajawal text-xs sm:text-sm font-bold line-clamp-1 max-w-xs sm:max-w-md hidden md:block">
              {selectedAlbum.title}
            </span>
            <button 
              onClick={() => setLightboxIndex(null)}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Left Arrow Button */}
          <button 
            onClick={handleNextPhoto}
            className="absolute left-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 transition-transform hover:scale-105 z-55"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>

          {/* Core Image Container */}
          <div 
            className="max-w-4xl max-h-[80vh] w-full flex justify-center items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedAlbum.image_urls[lightboxIndex]} 
              alt={`Photo ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10 animate-fade-in"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={handlePrevPhoto}
            className="absolute right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 transition-transform hover:scale-105 z-55"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Caption Box */}
          <div className="absolute bottom-4 inset-x-4 text-center z-55">
            <div className="inline-flex items-center gap-1.5 bg-black/60 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-[10px] sm:text-xs font-semibold max-w-lg mx-auto">
              <Info className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />
              <span>مستضاف خارجياً على Google Drive لتسريع الأداء وتخفيف التصفح.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

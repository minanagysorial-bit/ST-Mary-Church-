import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type CustomPage, type PageSection } from '../lib/api';
import { 
  RefreshCw, AlertCircle, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, X, Eye 
} from 'lucide-react';

export const DynamicPage: React.FC = () => {
  const params = useParams();
  const slug = params['*'] || '';
  const [page, setPage] = useState<CustomPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchPageData(slug);
    }
  }, [slug]);

  const fetchPageData = async (pageSlug: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const pageData = await api.getCustomPageBySlug(pageSlug);
      if (!pageData) {
        setErrorMsg('هذه الصفحة غير موجودة حالياً.');
        setPage(null);
        setSections([]);
        return;
      }
      setPage(pageData);
      const sectionsData = await api.getPageSections(pageData.id);
      setSections(sectionsData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء تحميل بيانات الصفحة. يرجى التأكد من تشغيل التحديثات في قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLightbox = (imgs: any[], index: number) => {
    const urls = imgs.map(img => typeof img === 'string' ? img : img.image_url || img.image || '');
    setLightboxImages(urls.filter(url => url !== ''));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] font-cairo">
        <div className="text-center space-y-3 font-bold text-slate-450">
          <RefreshCw className="w-8 h-8 text-[#002366] animate-spin mx-auto" />
          <p>جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] font-cairo p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md text-center space-y-6">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="font-tajawal font-extrabold text-lg text-[#002366]">عذراً، الصفحة غير متوفرة</h2>
            <p className="text-slate-500 text-xs">{errorMsg || 'يرجى التحقق من الرابط والمحاولة لاحقاً.'}</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-[#002366] text-white hover:bg-[#00174a] font-bold text-xs px-5 py-2.5 rounded-xl transition-all animate-pulse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>الرجوع للرئيسية</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo pb-16 space-y-12">
      {sections.map((sec) => {
        
        // 1. HERO SECTION
        if (sec.section_type === 'hero') {
          return (
            <section 
              key={sec.id}
              className="relative min-h-[50vh] lg:min-h-[65vh] flex items-center justify-center bg-[#00113a] overflow-hidden text-white border-b-4 border-[#d4af37]"
            >
              <div 
                className="absolute inset-0 bg-cover z-0" 
                style={{ 
                  backgroundImage: `url('${sec.image_url || '/church.jpeg'}')`,
                  backgroundPosition: "center bottom",
                  opacity: 0.48
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00113a]/90 via-[#00113a]/50 to-[#00113a]/90 z-10" />

              <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#fed65b]/30 text-[#fed65b] text-xs font-bold px-4 py-1.5 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span>كنيسة السيدة العذراء بمحرم بك</span>
                </div>
                <h1 className="font-tajawal text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  {sec.title}
                  {sec.subtitle && (
                    <span className="block text-[#fed65b] text-2xl sm:text-3xl mt-2 font-bold">
                      {sec.subtitle}
                    </span>
                  )}
                </h1>
                {sec.content && (
                  <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed whitespace-pre-line pt-2">
                    {sec.content}
                  </p>
                )}
              </div>
            </section>
          );
        }

        // 2. TEXT BLOCK SECTION
        if (sec.section_type === 'text_block') {
          return (
            <section key={sec.id} className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm text-right space-y-4">
                {sec.title && (
                  <h3 className="font-tajawal font-extrabold text-lg sm:text-xl text-[#002366] border-r-4 border-[#d4af37] pr-3">
                    {sec.title}
                  </h3>
                )}
                {sec.subtitle && (
                  <p className="text-xs text-[#d4af37] font-bold">{sec.subtitle}</p>
                )}
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed pt-2 whitespace-pre-line">
                  {sec.content}
                </p>
              </div>
            </section>
          );
        }

        // 3. CARDS GRID SECTION
        if (sec.section_type === 'cards_grid') {
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="space-y-6 text-right">
                <div>
                  <h3 className="font-tajawal font-extrabold text-xl text-[#002366]">{sec.title}</h3>
                  {sec.subtitle && <p className="text-xs text-slate-400 font-bold mt-1">{sec.subtitle}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(sec.items || []).map((item: any, cIdx: number) => {
                    const isInternal = item.link && item.link.startsWith('/');
                    const CardWrapper = isInternal ? Link : 'a';
                    const linkProps = isInternal ? { to: item.link } : { href: item.link, target: '_blank', rel: 'noreferrer' };
                    
                    return (
                      <CardWrapper 
                        key={cIdx} 
                        {...(linkProps as any)}
                        className="group bg-white rounded-3xl p-6 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1.5 border border-slate-200/80 text-right flex flex-col justify-between h-[360px]"
                      >
                        <div className="space-y-6">
                          <div className="h-44 bg-slate-100 overflow-hidden rounded-2xl relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-tajawal font-extrabold text-base text-[#002366]">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-normal line-clamp-3">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold pt-4 border-t border-slate-100 text-[#d4af37]">
                          <span>استكشف القسم</span>
                          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        </div>
                      </CardWrapper>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        // 4. GALLERY SECTION (Dynamic Google Drive images rendering)
        if (sec.section_type === 'gallery') {
          const imgs = sec.items || [];
          return (
            <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="space-y-6 text-right">
                <div>
                  <h3 className="font-tajawal font-extrabold text-xl text-[#002366]">{sec.title || 'معرض الصور التذكارية'}</h3>
                  {sec.subtitle && <p className="text-xs text-slate-400 font-bold mt-1">{sec.subtitle}</p>}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imgs.map((imgUrl: any, imgIdx: number) => {
                    const actualUrl = typeof imgUrl === 'string' ? imgUrl : imgUrl.image_url || imgUrl.image || '';
                    if (!actualUrl) return null;
                    return (
                      <div 
                        key={imgIdx}
                        onClick={() => handleOpenLightbox(imgs, imgIdx)}
                        className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 shadow hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                      >
                        <img 
                          src={actualUrl} 
                          alt="Gallery Item" 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {imgs.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">لا توجد صور في هذا المعرض حالياً.</p>
                )}
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* Lightbox / Zoom Overlay */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
            title="إغلاق"
          >
            <X className="w-8 h-8" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button 
                onClick={handleNextImage}
                className="absolute left-4 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button 
                onClick={handlePrevImage}
                className="absolute right-4 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center space-y-4">
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt="Zoomed" 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl animate-scaleIn"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="bg-black/50 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md">
              الصورة {lightboxIndex + 1} من {lightboxImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

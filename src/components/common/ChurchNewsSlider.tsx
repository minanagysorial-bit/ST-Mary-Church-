import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Sparkles,
  Share2,
  Check,
  Pause,
  Play,
  ArrowLeft,
  Tag
} from 'lucide-react';
import { api, Announcement } from '../../lib/api';

interface ChurchNewsSliderProps {
  onSelectAnnouncement: (ann: Announcement) => void;
  announcements?: Announcement[];
}

export const ChurchNewsSlider: React.FC<ChurchNewsSliderProps> = ({
  onSelectAnnouncement,
  announcements: propAnnouncements
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(propAnnouncements || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(!propAnnouncements);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (propAnnouncements && propAnnouncements.length > 0) {
      setAnnouncements(propAnnouncements);
      setLoading(false);
      return;
    }

    api.getActiveAnnouncements()
      .then(data => {
        if (data.length > 0) {
          setAnnouncements(data);
        } else {
          // Fallback to all announcements if active is empty
          api.getAnnouncements().then(all => {
            setAnnouncements(all.slice(0, 6));
          }).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [propAnnouncements]);

  // Auto-slide effect every 5 seconds
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [announcements.length, isPaused]);

  const handleNext = () => {
    if (announcements.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    if (announcements.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleShare = (ann: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanText = api.cleanAnnouncementContent(ann.content);
    const shareText = `📢 *${ann.title}*\n\n${cleanText}\n\n⛪ كنيسة السيدة العذراء مريم بمحرم بك\nhttps://www.tibarthenos.com/`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center animate-pulse space-y-3 font-cairo">
        <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto" />
        <p className="text-xs text-slate-400 font-bold">جاري تحميل أخبار وإعلانات الكنيسة...</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  const activeAnn = announcements[currentIndex] || announcements[0];
  const cleanContent = api.cleanAnnouncementContent(activeAnn.content);

  return (
    <section className="space-y-6 font-cairo text-right" dir="rtl">
      
      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-black shadow-xs">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </span>
            <h2 className="font-tajawal text-2xl sm:text-3xl font-black text-[#00174a]">
              أخبار وإعلانات الكنيسة 📢
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-bold">
            متابعة أحدث فعاليات، نهضات، ومناسبات كنيسة السيدة العذراء مريم بمحرم بك
          </p>
        </div>

        {/* Navigation Controls & Pause Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
            title={isPaused ? "تشغيل التبديل التلقائي" : "إيقاف التبديل التلقائي مؤقتاً"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-[#002366]" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[11px] hidden md:inline">{isPaused ? "تشغيل" : "إيقاف مؤقت"}</span>
          </button>

          {/* Prev Button (Arrows adjusted for RTL) */}
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-2xl bg-[#002366] text-[#fed65b] hover:bg-[#00174a] transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            title="الإعلان السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-2xl bg-[#002366] text-[#fed65b] hover:bg-[#00174a] transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            title="الإعلان التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slider Card Container */}
      <div 
        className="relative bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden group hover:border-[#d4af37]/60 transition-all cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => onSelectAnnouncement(activeAnn)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[340px] sm:min-h-[380px]">
          
          {/* Right/Hero Banner Area (5 or 6 cols) */}
          <div className="lg:col-span-6 relative bg-gradient-to-br from-[#00113a] via-[#001f5c] to-[#002366] flex items-center justify-center overflow-hidden min-h-[240px] sm:min-h-[320px]">
            {activeAnn.image_url ? (
              <div className="relative w-full h-full min-h-[240px] sm:min-h-[320px] overflow-hidden">
                <img
                  src={activeAnn.image_url}
                  alt={activeAnn.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00113a]/90 via-transparent to-black/20" />
                
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-[#00174a]/30 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex items-center justify-center text-white gap-2 font-black text-sm">
                  <Eye className="w-5 h-5 text-[#fed65b]" />
                  <span>اضغط لعرض البوستر كاملاً</span>
                </div>
              </div>
            ) : (
              /* Liturgical pattern fallback */
              <div className="p-8 text-center text-white space-y-3 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-[#fed65b]/20 border-2 border-[#fed65b]/40 flex items-center justify-center mx-auto text-[#fed65b] shadow-inner">
                  <Megaphone className="w-10 h-10" />
                </div>
                <h3 className="font-tajawal text-xl font-black text-[#fed65b]">
                  كنيسة السيدة العذراء مريم
                </h3>
                <p className="text-xs text-slate-300 font-semibold max-w-xs mx-auto">
                  إعلان وتنبيه روحي وإداري من آباء وخدام الكنيسة
                </p>
              </div>
            )}

            {/* Floating Date Badge on Image */}
            <div className="absolute top-4 right-4 z-20">
              <span className="bg-[#00174a]/90 backdrop-blur-md text-[#fed65b] border border-[#d4af37]/50 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeAnn.start_date || 'تنبيه كنسي'}</span>
              </span>
            </div>

            {/* Active Index Pill */}
            <div className="absolute bottom-4 right-4 z-20">
              <span className="bg-[#002366]/90 backdrop-blur-md text-white border border-white/20 text-[11px] font-black px-3 py-1 rounded-full">
                إعلان {currentIndex + 1} من {announcements.length}
              </span>
            </div>
          </div>

          {/* Left/Text Content Area (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] font-black text-xs px-3 py-1 rounded-xl shadow-xs">
                  ✨ إعلان كنسي
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl">
                  نشط الآن
                </span>
              </div>

              {/* Title */}
              <h3 className="font-tajawal text-xl sm:text-2xl font-black text-[#00174a] leading-snug group-hover:text-[#002366] transition-colors">
                {activeAnn.title}
              </h3>

              {/* Excerpt */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold line-clamp-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                {cleanContent || 'اضغط لقراءة تفاصيل هذا الإعلان والاطلاع على المواعيد والبوستر الرسمي.'}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnnouncement(activeAnn);
                }}
                className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-102"
              >
                <span>قراءة كامل التفاصيل والبوستر</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => handleShare(activeAnn, e)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-1.5"
                title="نسخ ومشاركة هذا الإعلان"
              >
                {copiedId === activeAnn.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-black">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-600" />
                    <span>مشاركة</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Dynamic Progress Bar at bottom */}
        <div className="w-full bg-slate-100 h-1.5 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / announcements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Thumbnail / Dot Navigation Pills */}
      {announcements.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          {announcements.map((ann, idx) => (
            <button
              key={ann.id}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all rounded-full cursor-pointer ${
                currentIndex === idx
                  ? 'w-8 h-2.5 bg-[#002366]'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={ann.title}
            />
          ))}
        </div>
      )}

    </section>
  );
};
export default ChurchNewsSlider;

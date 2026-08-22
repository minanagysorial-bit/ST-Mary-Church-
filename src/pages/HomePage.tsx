import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Cross,
  Calendar,
  BookOpen,
  UserCheck,
  HeartHandshake,
  ArrowLeft,
  Quote,
  Sparkles,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  ChevronLeft,
  Check,
  Megaphone
} from 'lucide-react';
import { api, Verse, Announcement } from '../lib/api';
import { DailyReadingsCard } from '../components/common/DailyReadingsCard';

interface HomePageProps {
  onOpenPrayerModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenPrayerModal }) => {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [heroContent, setHeroContent] = useState({
    title: 'كنيسة السيدة العذراء مريم',
    subtitle: 'بمحرم بك - الإسكندرية',
    image_url: '/church.jpeg',
    description: '"عَظَّمَ الرَّبُّ الْعَمَلَ مَعَنَا، وَصِرْنَا فَرِحِينَ." مرحباً بكم في الموقع الرسمي لمتابعة العظات، جدول القداسات، وتسجيل بيوت وأسر المخدومين.'
  });

  useEffect(() => {
    const fetchRandomVerse = async () => {
      try {
        setLoadingVerse(true);
        const data = await api.getRandomVerse();
        setVerse(data);
      } catch (err) {
        console.error('Failed to load random verse:', err);
      } finally {
        setLoadingVerse(false);
      }
    };
    const fetchAnnouncements = async () => {
      try {
        const data = await api.getActiveAnnouncements();
        setActiveAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }
    };
    const fetchHeroContent = async () => {
      try {
        const page = await api.getCustomPageBySlug('home');
        if (page) {
          const sections = await api.getPageSections(page.id);
          const hero = sections.find(s => s.section_type === 'hero');
          if (hero) {
            setHeroContent({
              title: hero.title || 'كنيسة السيدة العذراء مريم',
              subtitle: hero.subtitle || 'بمحرم بك - الإسكندرية',
              image_url: hero.image_url || '/church.jpeg',
              description: hero.content || '"عَظَّمَ الرَّبُّ الْعَمَلَ مَعَنَا، وَصِرْنَا فَرِحِينَ." مرحباً بكم في الموقع الرسمي لمتابعة العظات، جدول القداسات، وتسجيل بيوت وأسر المخدومين.'
            });
          }
        }
      } catch (err) {
        console.error('Error loading dynamic hero content:', err);
      }
    };
    fetchRandomVerse();
    fetchAnnouncements();
    fetchHeroContent();
  }, []);

  const handleShare = () => {
    const vText = verse?.text || '«تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ، وَأَنَا أُرِيحُكُمْ.»';
    const vRef = verse?.reference || 'متى ١١: ٢٨';
    const shareText = `آية اليوم من كنيسة العذراء مريم بمحرم بك:\n"${vText}"\n(${vRef})\nشاركونا بركة الكلمة!`;

    navigator.clipboard.writeText(shareText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        alert(shareText);
      });
  };

  const defaultVerseText = '«تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ، وَأَنَا أُرِيحُكُمْ.»';
  const defaultVerseRef = 'إنجيل متى (١١ : ٢٨)';

  return (
    <div className="flex flex-col gap-12 pb-16">
      <Helmet>
        <title>كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية | الموقع الرسمي | St. Mary Moharam Bek</title>
        <meta name="description" content="الموقع والمنصة الرقمية الرسمية لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. جدول القداسات الإلهية، عظات الآباء الكهنة، البث المباشر، تاريخ وتدشين الكنيسة منذ 1934، وألبوم الصور التذكارية." />
        <meta name="keywords" content="كنيسة العذراء محرم بك, كنيسة السيدة العذراء مريم بمحرم بك, كنيسة العذراء اسكندرية, قداسات كنيسة العذراء محرم بك, تاريخ كنيسة العذراء محرم بك, كهنة كنيسة العذراء محرم بك, بث مباشر كنيسة العذراء محرم بك, St Mary Moharam Bek, St Mary Church Alexandria, كنيسة قبطية ارثوذكسية محرم بك" />
        <link rel="canonical" href="https://stmary-moharambek-digitalhub.org/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Church",
            "name": "كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية",
            "alternateName": "St. Mary Coptic Orthodox Church Moharam Bek",
            "url": "https://stmary-moharambek-digitalhub.org/",
            "logo": "https://stmary-moharambek-digitalhub.org/favicon.svg",
            "image": "https://stmary-moharambek-digitalhub.org/church.jpeg",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "شارع الرضى، محرم بك",
              "addressLocality": "الإسكندرية",
              "addressRegion": "محافظة الإسكندرية",
              "addressCountry": "EG"
            }
          })}
        </script>
      </Helmet>
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] lg:min-h-[85vh] flex items-center justify-center bg-[#00113a] overflow-hidden text-white border-b-4 border-[#d4af37]">
        {/* Background Image with opacity */}
        <div 
          className="absolute inset-0 bg-cover z-0" 
          style={{ 
            backgroundImage: `url('${heroContent.image_url}')`, 
            opacity: 0.78,
            backgroundPosition: "center bottom"
          }}
        />
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a]/80 via-[#00113a]/40 to-[#00113a]/75 z-10" />

        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 py-16">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-inner animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>البوابة الرقمية الموحدة لخدمات الكنيسة</span>
          </div>

          <h1 className="font-tajawal text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-md">
            {heroContent.title}
            {heroContent.subtitle && (
              <span className="block text-[#fed65b] text-2xl sm:text-4xl lg:text-5xl mt-2 font-bold">
                {heroContent.subtitle}
              </span>
            )}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {heroContent.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto w-full">
            <Link
              to="/sermons"
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] font-bold text-xs sm:text-sm px-6 sm:px-7 py-3.5 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2 text-center"
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span>مكتبة العظات والكلمات الروحية</span>
            </Link>

            <button
              onClick={onOpenPrayerModal}
              className="bg-white/10 hover:bg-white/20 text-white border border-[#fed65b]/50 font-bold text-xs sm:text-sm px-6 sm:px-7 py-3.5 rounded-2xl transition-all backdrop-blur-md flex items-center justify-center gap-2 text-center"
            >
              <HeartHandshake className="w-5 h-5 text-[#fed65b] shrink-0" />
              <span>اطلب صلاة على المذبح</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid: Verse of the Day & Announcements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Verse of the day card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 sm:p-8 rounded-3xl border border-[#d4af37]/40 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
              <Cross className="w-64 h-64 text-[#fed65b]" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="bg-[#fed65b] text-[#00174a] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>آية اليوم</span>
                </span>
                <div className="flex items-center gap-2 text-slate-300">
                  <button
                    onClick={handleShare}
                    className="p-1.5 hover:text-[#fed65b] hover:bg-white/5 rounded-lg transition-all flex items-center gap-1 text-[11px] font-tajawal"
                    title="مشاركة الآية"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">تم نسخ الآية!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>نسخ ومشاركة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadingVerse ? (
                <div className="py-6 text-slate-300 text-xs font-bold font-cairo">جاري سحب آية مباركة...</div>
              ) : (
                <>
                  <blockquote className="font-tajawal text-base sm:text-xl lg:text-2xl font-extrabold text-[#fed65b] leading-relaxed pt-2">
                    {verse ? verse.text : defaultVerseText}
                  </blockquote>

                  <p className="text-xs sm:text-sm text-slate-300 font-semibold font-tajawal">
                    — {verse ? verse.reference : defaultVerseRef}
                  </p>
                </>
              )}
            </div>

            <div className="pt-5 border-t border-[#d4af37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-300 relative z-10 mt-4">
              <span>قراءة يومية مباركة لشعب الكنيسة</span>
              <Link to="/sermons" className="text-[#fed65b] hover:underline font-bold flex items-center gap-1 font-tajawal">
                <span>استمع للكلمة الكاملة</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-tajawal text-lg font-bold text-[#00174a] border-b border-slate-100 pb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#d4af37]" />
                <span>إعلانات ومناسبات الكنيسة</span>
              </h2>

              <ul className="divide-y divide-slate-100 text-xs">
                {activeAnnouncements.map((ann) => (
                  <li key={ann.id} className="py-3 space-y-1">
                    <span className="bg-[#002366]/10 text-[#002366] text-[10px] font-bold px-2 py-0.5 rounded">إعلان</span>
                    <p className="font-bold text-slate-800">{ann.title}</p>
                    <p className="text-slate-500">{ann.content}</p>
                  </li>
                ))}
                {activeAnnouncements.length === 0 && (
                  <li className="py-3 text-slate-500 italic">لا توجد إعلانات حالية.</li>
                )}
              </ul>
            </div>

            <Link
              to="/register"
              className="w-full text-center bg-[#00174a] hover:bg-[#00113a] text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow"
            >
              سجّل بياناتك في الكنيسة
            </Link>
          </div>

        </div>
      </section>

      {/* Daily Katamaros & Synaxarium Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyReadingsCard />
      </section>

      {/* Digital Services Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
            الخدمات الرقمية المتوفرة
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            تسهيل التواصل والخدمة الروحية والإدارية لكافة شعب الكنيسة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Service 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-tajawal text-xl font-bold text-[#00174a]">مكتبة العظات والدروس</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              استمع للمقاطع الصوتية والعظات المرئية لآباء الكنيسة الأجلاء، مع إمكانية التحميل وقراءة الآيات المقتبسة.
            </p>
            <Link
              to="/sermons"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#002366] hover:text-[#d4af37] pt-2"
            >
              <span>تصفح المكتبة</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Service 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37] text-[#00174a] flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="font-tajawal text-xl font-bold text-[#00174a]">بوابة تسجيل الأسر</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تحديث وافتقاد بيانات الأسر والمخدومين لتسهيل التواصل والخدمة والتثبيت في الكنيسة بكل سهولة.
            </p>
            <Link
              to="/membership/register"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#002366] hover:text-[#d4af37] pt-2"
            >
              <span>البدء في التسجيل (3 خطوات)</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Service 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow space-y-4 group">
            <div className="w-14 h-14 rounded-2xl bg-[#00174a] text-white flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-7 h-7 text-[#fed65b]" />
            </div>
            <h3 className="font-tajawal text-xl font-bold text-[#00174a]">طلبات الصلوات والإرشاد</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تقديم طلبات الصلاة وافتقاد الآباء الكهنة بكل سرية واهتمام لبناء النفوس ورعايتها روحياً.
            </p>
            <button
              onClick={onOpenPrayerModal}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#002366] hover:text-[#d4af37] pt-2"
            >
              <span>تقديم طلب صلاة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Spiritual Quote Banner */}
      <section className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white py-12 border-y-2 border-[#d4af37]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4 relative">
          <Quote className="w-12 h-12 text-[#fed65b]/20 mx-auto" />
          <p className="font-tajawal text-lg sm:text-2xl font-bold text-[#fed65b] leading-relaxed">
            "إن الكنيسة ليست مجرد مبنى من الحجارة، بل هي قلوب المؤمنين المجتمعين باسم المسيح والسالكين بالروح والتعاليم الأرثوذكسية."
          </p>
          <p className="text-xs text-slate-300 font-semibold">— من تعاليم آباء الكنيسة الأبرار</p>
        </div>
      </section>

    </div>
  );
};

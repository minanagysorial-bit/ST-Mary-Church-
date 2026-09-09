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
  Megaphone,
  Smartphone,
  Bell,
  Download,
  CheckCircle2,
  Radio,
  WifiOff,
  X,
  Eye,
  Home
} from 'lucide-react';
import { api, Verse, Announcement } from '../lib/api';
import { DailyReadingsCard } from '../components/common/DailyReadingsCard';
import { FathersQuotesSlider } from '../components/common/FathersQuotesSlider';
import { ChurchNewsSlider } from '../components/common/ChurchNewsSlider';
import { VisitationRequestModal } from '../components/common/VisitationRequestModal';
import { requestNotificationPermission, getNotificationPermission } from '../lib/pushNotifications';
import { getDailyAutoVerse } from '../lib/comfortVerses';

interface HomePageProps {
  onOpenPrayerModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenPrayerModal }) => {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnImage, setSelectedAnnImage] = useState<string | null>(null);
  const [copiedAnn, setCopiedAnn] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisitationModalOpen, setIsVisitationModalOpen] = useState(false);

  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(getNotificationPermission());
  const [installSuccess, setInstallSuccess] = useState(false);
  const [heroContent, setHeroContent] = useState({
    title: 'كنيسة السيدة العذراء مريم',
    subtitle: 'بمحرم بك - الإسكندرية',
    image_url: '/church.jpeg',
    description: '"عَظَّمَ الرَّبُّ الْعَمَلَ مَعَنَا، وَصِرْنَا فَرِحِينَ." مرحباً بكم في الموقع الرسمي لمتابعة العظات، جدول القداسات، وتسجيل بيوت وأسر المخدومين.'
  });

  useEffect(() => {
    // Listen for PWA prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    const prompt = (window as any).deferredInstallPrompt || deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
    } else {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        alert('✅ التطبيق مثبت بالفعل على هاتفك!');
        return;
      }

      const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      if (isIos) {
        alert('📱 على الآيفون: اضغط على زر المشاركة بالأسفل ⎋ ثم اختر (إضافة إلى الشاشة الرئيسية ➕).');
      } else {
        alert('📲 لتثبيت التطبيق على جهازك: اضغط على خيارات المتصفح (الثلاث نقاط ⋮ بالأعلى) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
      }
    }
  };

  const handleEnableNotifications = async () => {
    localStorage.removeItem('church_notifications_enabled');
    localStorage.removeItem('church_push_sub');

    const res = await requestNotificationPermission();
    setNotificationStatus(res);

    if (res === 'granted') {
      alert('✅ تم تفعيل الإشعارات بنجاح! ستصلك تنبيهات القداسات والإعلانات مباشرة على هاتفك.');
    } else if (res === 'denied') {
      alert('⚠️ تم حظر الإشعارات. يرجى فتح إعدادات المتصفح (اضغط على القفل 🔒 بجانب الرابط) وتفعيل "الإشعارات / Notifications".');
    } else {
      alert('⚠️ لم يتم السماح بالإشعارات. يرجى الضغط على "سماح (Allow)" عند ظهور النافذة.');
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      let settings: Record<string, string> = {};
      try {
        settings = await api.getSiteSettings();
        setHeroContent({
          title: settings.hero_title || 'كنيسة السيدة العذراء مريم',
          subtitle: settings.hero_subtitle || 'بمحرم بك - الإسكندرية',
          image_url: settings.hero_image_url || '/church.jpeg',
          description: settings.hero_paragraph || '"عَظَّمَ الرَّبُّ الْعَمَلَ مَعَنَا، وَصِرْنَا فَرِحِينَ." مرحباً بكم في الموقع الرسمي لمتابعة العظات، جدول القداسات، وتسجيل بيوت وأسر المخدومين.'
        });
      } catch (err) {
        console.error('Error fetching hero content:', err);
      }

      // Load Verse according to mode (auto vs manual)
      try {
        setLoadingVerse(true);
        const mode = settings.verse_display_mode || 'auto';
        
        if (mode === 'auto') {
          const autoV = getDailyAutoVerse(new Date());
          setVerse({
            id: autoV.id,
            text: autoV.text,
            reference: autoV.reference,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          // Manual mode
          const activeId = settings.active_manual_verse_id;
          const allVerses = await api.getVerses().catch(() => []);
          const activeCustom = allVerses.find(v => v.id === activeId);
          if (activeCustom) {
            setVerse(activeCustom);
          } else if (allVerses.length > 0) {
            setVerse(allVerses[0]);
          } else {
            const autoV = getDailyAutoVerse(new Date());
            setVerse({
              id: autoV.id,
              text: autoV.text,
              reference: autoV.reference,
              created_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Failed to load verse:', err);
        const autoV = getDailyAutoVerse(new Date());
        setVerse({
          id: autoV.id,
          text: autoV.text,
          reference: autoV.reference,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoadingVerse(false);
      }

      try {
        const data = await api.getActiveAnnouncements();
        setActiveAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }
    };

    loadContent();
  }, []);

  const handleShare = () => {
    if (!verse) return;
    const textToCopy = `"${verse.text}"\n— ${verse.reference}\n(كنيسة السيدة العذراء مريم بمحرم بك)\nhttps://www.tibarthenos.com/`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const defaultVerseText = "لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.";
  const defaultVerseRef = "إنجيل يوحنا 3: 16";

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>كنيسة السيدة العذراء مريم محرم بك - اسكندرية - الموقع الرسمي</title>
        <meta name="description" content="الموقع الرسمي لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. مواعيد القداسات، طلبات الافتقاد، صلوات المذبح، عظات الآباء الكهنة، البث المباشر، السنكسار والقراءات اليومية، وتاريخ الكنيسة." />
        <link rel="canonical" href="https://www.tibarthenos.com/" />
      </Helmet>

      {/* ── 1. HERO SECTION ── */}
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

        {/* Ambient Breathing Glow Balls */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none animate-ambient-pulse z-10" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#fed65b]/15 rounded-full blur-2xl pointer-events-none animate-ambient-pulse z-10" />

        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 py-16">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-inner animate-fade-in shimmer-container shimmer-effect">
            <Sparkles className="w-4 h-4 text-[#fed65b]" />
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

          <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium">
            {heroContent.description}
          </p>

          {/* ── 2 HERO ACTION BUTTONS: طلب افتقاد + اطلب صلاة ── */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto w-full">
            
            {/* Button 1: طلب افتقاد */}
            <button
              onClick={() => setIsVisitationModalOpen(true)}
              className="w-full sm:w-auto min-w-[210px] bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c5a030] hover:to-[#eec54f] text-[#00174a] font-black text-xs sm:text-sm px-7 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl btn-bounce flex items-center justify-center gap-2.5 text-center cursor-pointer border border-amber-300 active:scale-95"
            >
              <UserCheck className="w-5 h-5 text-[#00174a] shrink-0" />
              <span>طلب افتقاد</span>
            </button>

            {/* Button 2: اطلب صلاة على المذبح */}
            <button
              onClick={onOpenPrayerModal}
              className="w-full sm:w-auto min-w-[210px] bg-white/10 hover:bg-white/20 text-white border-2 border-[#fed65b]/60 font-black text-xs sm:text-sm px-7 py-4 rounded-2xl transition-all backdrop-blur-md btn-bounce flex items-center justify-center gap-2.5 text-center cursor-pointer active:scale-95"
            >
              <HeartHandshake className="w-5 h-5 text-[#fed65b] shrink-0" />
              <span>اطلب صلاة على المذبح 🕊️</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. VERSE OF THE DAY CARD ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#002366] via-[#001d54] to-[#00174a] text-white p-6 sm:p-8 md:p-10 rounded-3xl border-2 border-[#d4af37]/40 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[240px] interactive-card">
          <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
            <Cross className="w-72 h-72 text-[#fed65b]" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="bg-[#fed65b] text-[#00174a] text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm font-tajawal">
                <Sparkles className="w-4 h-4" />
                <span>آية اليوم المباركة</span>
              </span>
              <div className="flex items-center gap-2 text-slate-300">
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#fed65b] border border-[#fed65b]/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-tajawal cursor-pointer"
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
              <div className="py-8 text-slate-300 text-xs font-bold font-cairo">جاري سحب آية مباركة...</div>
            ) : (
              <div className="py-2 space-y-3">
                <blockquote className="font-tajawal text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#fed65b] leading-relaxed sm:leading-loose tracking-wide">
                  "{verse ? verse.text : defaultVerseText}"
                </blockquote>

                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-1 rounded-full border border-white/15 text-xs sm:text-sm text-slate-200 font-bold font-tajawal">
                  <span>🕊️</span>
                  <span>{verse ? verse.reference : defaultVerseRef}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-[#d4af37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-300 relative z-10 mt-4">
            <span className="font-semibold text-slate-300">غذاء روحي يومي لشعب ورعية الكنيسة</span>
            <Link to="/readings" className="text-[#fed65b] hover:text-white font-bold flex items-center gap-1 font-tajawal transition-colors">
              <span>تصفح السنكسار وقراءات اليوم الكاملة</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. AUTOMATIC CHURCH NEWS & ANNOUNCEMENTS SLIDER (سلايدر أخبار الكنيسة) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ChurchNewsSlider onSelectAnnouncement={(ann) => setSelectedAnnouncement(ann)} />
      </section>

      {/* ── 4. DAILY KATAMAROS & SYNAXARIUM SECTION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyReadingsCard />
      </section>

      {/* ── 5. APP DOWNLOAD & NOTIFICATION PROMPT HERO BOX ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white via-slate-50 to-amber-50/20 text-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#d4af37]/40 relative overflow-hidden font-cairo transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Right: Info & Features */}
            <div className="space-y-3 max-w-2xl text-right flex-grow">
              
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#002366] text-[#fed65b] text-xs font-black px-3.5 py-1 rounded-full shadow-xs">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>تطبيق الهاتف الذكي الرسمي</span>
                </span>

                <span className="bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-black px-3 py-1 rounded-full">
                  ⚡ خفيف وسريع ويعمل أوفلاين
                </span>
              </div>

              {/* Headline */}
              <h2 className="font-tajawal text-xl sm:text-2xl font-black text-[#00174a] leading-snug">
                ثبّت تطبيق كنيسة العذراء محرم بك على هاتفك 📱
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                تابع البث المباشر للصلوات، استقبل آية اليوم وتنبيهات القداسات لحظياً، وتصفح السنكسار وقراءات اليوم بدون اتصال بالإنترنت.
              </p>

              {/* Feature Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="bg-white border border-slate-200/90 shadow-2xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>إشعارات وتنبيهات فورية</span>
                </div>
                <div className="bg-white border border-slate-200/90 shadow-2xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Radio className="w-3.5 h-3.5 text-red-600" />
                  <span>بث مباشر للصلوات</span>
                </div>
                <div className="bg-white border border-slate-200/90 shadow-2xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <WifiOff className="w-3.5 h-3.5 text-[#002366]" />
                  <span>يعمل بدون اتصال بالإنترنت</span>
                </div>
              </div>
            </div>

            {/* Left: Icon & CTA Buttons */}
            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-center gap-3.5 pt-2 md:pt-0">
              <div className="flex items-center gap-3 w-full justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shadow-lg shrink-0">
                  <img
                    src="/app-icon-192.png"
                    alt="Church App Icon"
                    className="w-full h-full rounded-2xl object-cover"
                  />
                </div>
                <div className="text-right sm:hidden md:block">
                  <p className="font-tajawal text-sm font-black text-[#00174a]">العذراء محرم بك</p>
                  <p className="text-[11px] text-amber-700 font-bold">التطبيق الرقمي الرسمي</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full">
                <button
                  onClick={handleInstallApp}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-[#fed65b] px-6 py-3 rounded-xl font-tajawal font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95 cursor-pointer border border-[#d4af37]/40"
                >
                  <Download className="w-4 h-4 text-[#fed65b]" />
                  <span>{installSuccess ? 'تم التثبيت بنجاح!' : 'تثبيت التطبيق على هاتفك 📲'}</span>
                </button>

                {notificationStatus !== 'granted' ? (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>تفعيل الإشعارات والتنبيهات 🔔</span>
                  </button>
                ) : (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] px-3 py-2 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الإشعارات مفعلة بنجاح ✅</span>
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE CHURCH FATHERS' QUOTES SLIDER ── */}
      <FathersQuotesSlider />

      {/* ── 7. VISITATION REQUEST MODAL (نموذج طلب افتقاد) ── */}
      <VisitationRequestModal
        isOpen={isVisitationModalOpen}
        onClose={() => setIsVisitationModalOpen(false)}
      />

      {/* ── 8. FULL ANNOUNCEMENT DETAILS MODAL ── */}
      {selectedAnnouncement && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl my-8 text-right font-cairo border-2 border-[#d4af37]/40 animate-scaleUp"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header bar */}
            <div className="bg-[#00174a] text-white p-5 flex items-center justify-between border-b-2 border-[#fed65b]">
              <div className="flex items-center gap-2">
                <span className="bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-2.5 py-0.5 rounded-md">إعلان كنسي</span>
                <h3 className="font-tajawal font-bold text-lg text-[#fed65b] truncate max-w-md">{selectedAnnouncement.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster / Image (if available) */}
            {selectedAnnouncement.image_url && (
              <div className="relative bg-slate-950/5 max-h-[55vh] overflow-hidden flex items-center justify-center border-b border-slate-100">
                <img 
                  src={selectedAnnouncement.image_url} 
                  alt={selectedAnnouncement.title} 
                  className="w-full h-auto max-h-[55vh] object-contain cursor-zoom-in"
                  onClick={() => setSelectedAnnImage(selectedAnnouncement.image_url!)}
                  title="اضغط للتكبير بملء الشاشة"
                />
              </div>
            )}

            {/* Announcement Details & Actions */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <h2 className="font-tajawal font-bold text-xl text-[#00174a] leading-snug">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[#002366]" />
                    <span>تاريخ النشر: {selectedAnnouncement.start_date}</span>
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                    إعلان نشط
                  </span>
                </div>
              </div>

              {/* Full Content */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium max-h-60 overflow-y-auto">
                {api.cleanAnnouncementContent(selectedAnnouncement.content)}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    const text = `📢 *${selectedAnnouncement.title}*\n\n${api.cleanAnnouncementContent(selectedAnnouncement.content)}\n\n⛪ كنيسة السيدة العذراء مريم بمحرم بك\nhttps://www.tibarthenos.com/`;
                    navigator.clipboard.writeText(text);
                    setCopiedAnn(true);
                    setTimeout(() => setCopiedAnn(false), 2500);
                  }}
                  className="w-full sm:flex-1 bg-[#00174a] hover:bg-[#002366] text-[#fed65b] font-bold text-xs py-3 rounded-xl transition-all shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {copiedAnn ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">تم نسخ تفاصيل الإعلان!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة / نسخ تفاصيل الإعلان</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. ANNOUNCEMENT IMAGE LIGHTBOX ZOOM MODAL ── */}
      {selectedAnnImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedAnnImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedAnnImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors z-10 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedAnnImage} 
              alt="Announcement Full" 
              className="w-full max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
export default HomePage;

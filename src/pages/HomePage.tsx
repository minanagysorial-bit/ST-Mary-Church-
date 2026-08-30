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
  WifiOff
} from 'lucide-react';
import { api, Verse, Announcement } from '../lib/api';
import { DailyReadingsCard } from '../components/common/DailyReadingsCard';
import { FathersQuotesSlider } from '../components/common/FathersQuotesSlider';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
    // Clear old flags so we always re-register fresh
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
        <meta name="description" content="الموقع الرسمي لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. مواعيد القداسات، عظات الآباء الكهنة، البث المباشر، السنكسار والقراءات اليومية، وتاريخ الكنيسة." />
        <link rel="canonical" href="https://www.tibarthenos.com/" />
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

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto w-full">
            <Link
              to="/sermons"
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] font-bold text-xs sm:text-sm px-6 sm:px-7 py-3.5 rounded-2xl transition-all shadow-xl hover:shadow-2xl btn-bounce flex items-center justify-center gap-2 text-center"
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span>مكتبة العظات والكلمات الروحية</span>
            </Link>

            <button
              onClick={onOpenPrayerModal}
              className="bg-white/10 hover:bg-white/20 text-white border border-[#fed65b]/50 font-bold text-xs sm:text-sm px-6 sm:px-7 py-3.5 rounded-2xl transition-all backdrop-blur-md btn-bounce flex items-center justify-center gap-2 text-center"
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
          <div className="lg:col-span-2 bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 sm:p-8 rounded-3xl border border-[#d4af37]/40 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px] interactive-card">
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
              to="/membership/register"
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

      {/* ── APP DOWNLOAD & NOTIFICATION PROMPT HERO BOX (WHITE COMPACT CARD) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-slate-200/80 hover:border-[#d4af37]/40 relative overflow-hidden font-cairo transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Right: Info & Features */}
            <div className="space-y-3 max-w-2xl text-right flex-grow">
              
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#002366]/5 border border-[#002366]/15 text-[#002366] text-xs font-extrabold px-3 py-1 rounded-full">
                  <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>تطبيق الهاتف المحمول</span>
                </span>

                <span className="bg-amber-50 text-amber-900 border border-amber-200/60 text-xs font-bold px-3 py-1 rounded-full">
                  ⚡ إصدار خفيف وسريع مجاناً
                </span>
              </div>

              {/* Headline */}
              <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#00174a] leading-snug">
                تطبيق كنيسة السيدة العذراء محرم بك على هاتفك 📱
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                تابع البث المباشر للقداسات، استقبل آية اليوم والتنبيهات الكنسية فورياً، وتصفح السنكسار وقراءات اليوم بدون اتصال بالإنترنت.
              </p>

              {/* Feature Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>إشعارات فورية</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <Radio className="w-3.5 h-3.5 text-red-600" />
                  <span>بث مباشر للصلوات</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <WifiOff className="w-3.5 h-3.5 text-[#002366]" />
                  <span>يعمل بدون إنترنت</span>
                </div>
              </div>
            </div>

            {/* Left: Icon & CTA Buttons */}
            <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col items-center gap-3 pt-2 md:pt-0">
              <div className="flex items-center gap-3 w-full justify-center">
                <img
                  src="/app-icon-192.png"
                  alt="Church App Icon"
                  className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-200 shrink-0"
                />
                <div className="text-right sm:hidden md:block">
                  <p className="font-tajawal text-xs font-bold text-[#00174a]">العذراء محرم بك</p>
                  <p className="text-[10px] text-slate-400 font-semibold">تطبيق رسمي</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full">
                <button
                  onClick={handleInstallApp}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] px-5 py-2.5 rounded-xl font-tajawal font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#fed65b]" />
                  <span>{installSuccess ? 'تم التثبيت بنجاح!' : 'تثبيت التطبيق على هاتفك 📲'}</span>
                </button>

                {notificationStatus !== 'granted' ? (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>تفعيل الإشعارات 🔔</span>
                  </button>
                ) : (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الإشعارات مفعلة ✅</span>
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
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

      {/* 🕊️ Interactive Church Fathers' Quotes Slider (سلايدر أقوال الآباء القديسين) */}
      <FathersQuotesSlider />

    </div>
  );
};

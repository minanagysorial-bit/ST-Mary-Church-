import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, HeartHandshake, Calendar, Mic, Sparkles, Share2, Check,
  Radio, Bell, ChevronLeft, Award, HelpCircle, Phone, ArrowUpRight,
  Cross, ShieldCheck, Quote
} from 'lucide-react';
import { Verse, Announcement } from '../../lib/api';
import { getCopticDate } from '../../lib/copticReadings';
import { DailyReadingsCard } from '../common/DailyReadingsCard';

interface MobileAppHomeProps {
  verse: Verse | null;
  loadingVerse: boolean;
  announcements: Announcement[];
  onOpenPrayerModal: () => void;
  onInstallApp: () => void;
  onEnableNotifications: () => void;
}

export const MobileAppHome: React.FC<MobileAppHomeProps> = ({
  verse,
  loadingVerse,
  announcements,
  onOpenPrayerModal,
  onInstallApp,
  onEnableNotifications
}) => {
  const [copied, setCopied] = useState(false);
  const copticDate = getCopticDate(new Date());

  const handleShareVerse = () => {
    if (!verse) return;
    const textToCopy = `"${verse.text}"\n— ${verse.reference}\n(كنيسة السيدة العذراء مريم بمحرم بك)\nhttps://www.tibarthenos.com/`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const quickActions = [
    {
      title: 'السنكسار',
      subtitle: 'قراءات اليوم',
      icon: BookOpen,
      to: '/readings',
      color: 'from-amber-500/20 to-amber-600/10 text-amber-900 border-amber-200/80'
    },
    {
      title: 'طلب صلاة',
      subtitle: 'على المذبح',
      icon: HeartHandshake,
      onClick: onOpenPrayerModal,
      color: 'from-rose-500/20 to-rose-600/10 text-rose-900 border-rose-200/80'
    },
    {
      title: 'القداسات',
      subtitle: 'جدول المواعيد',
      icon: Calendar,
      to: '/liturgies-schedule',
      color: 'from-blue-500/20 to-blue-600/10 text-blue-900 border-blue-200/80'
    },
    {
      title: 'العظات',
      subtitle: 'كلمات الآباء',
      icon: Mic,
      to: '/sermons',
      color: 'from-purple-500/20 to-purple-600/10 text-purple-900 border-purple-200/80'
    },
    {
      title: 'تسجيل عضوية',
      subtitle: 'بيانات الأسرة',
      icon: ShieldCheck,
      to: '/membership/register',
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-900 border-emerald-200/80'
    },
    {
      title: 'مسابقات',
      subtitle: 'كاهوت الكنسي',
      icon: Award,
      to: '/quiz',
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-900 border-cyan-200/80'
    },
    {
      title: 'بنك الدروس',
      subtitle: 'تحضير وترانيم',
      icon: Sparkles,
      to: '/servant/lesson-bank',
      color: 'from-amber-500/20 to-amber-600/10 text-amber-900 border-amber-200/80'
    },
    {
      title: 'تواصل معنا',
      subtitle: 'أرقام الآباء',
      icon: Phone,
      to: '/contact-us',
      color: 'from-slate-500/20 to-slate-600/10 text-slate-900 border-slate-200/80'
    }
  ];

  return (
    <div className="md:hidden space-y-5 px-3.5 pt-3 pb-8 font-cairo text-right" dir="rtl">
      
      {/* 📱 1. App Top Header Bar */}
      <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white p-4 rounded-3xl shadow-lg border border-[#d4af37]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shadow-md shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#00174a] flex items-center justify-center">
              <Cross className="w-6 h-6 text-[#fed65b]" />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-[#fed65b] font-bold block">سلام ونعمة ✝️</span>
            <h1 className="font-tajawal text-sm font-extrabold text-white leading-tight">
              كنيسة العذراء محرم بك
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEnableNotifications}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#fed65b] transition-all"
            title="تفعيل الإشعارات"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={onInstallApp}
            className="bg-[#fed65b] text-[#00174a] px-3 py-1.5 rounded-xl font-bold text-[11px] font-tajawal shadow-sm active:scale-95"
          >
            📲 تثبيت التطبيق
          </button>
        </div>
      </div>

      {/* 📅 2. Today's Liturgical Calendar Strip */}
      <div className="bg-amber-50/80 border border-amber-200/70 p-3 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping shrink-0" />
          <span className="text-xs font-extrabold text-[#002366] font-tajawal">
            📅 {copticDate.copticDateString}
          </span>
        </div>
        <Link 
          to="/readings"
          className="text-[11px] font-bold text-[#d4af37] hover:text-[#002366] flex items-center gap-0.5"
        >
          <span>قراءات اليوم</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 🎛️ 3. Quick Action Grid (8 Mobile App Action Tiles) */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action, idx) => {
          const Content = (
            <div className={`p-2.5 rounded-2xl bg-gradient-to-b ${action.color} border shadow-xs flex flex-col items-center justify-center text-center space-y-1.5 active:scale-90 transition-transform h-22`}>
              <div className="p-1.5 bg-white rounded-xl shadow-xs">
                <action.icon className="w-4 h-4" />
              </div>
              <div className="space-y-0">
                <span className="text-[11px] font-extrabold block leading-tight tracking-tight">
                  {action.title}
                </span>
                <span className="text-[8px] text-slate-500 font-semibold block scale-90">
                  {action.subtitle}
                </span>
              </div>
            </div>
          );

          if (action.to) {
            return (
              <Link key={idx} to={action.to} className="block">
                {Content}
              </Link>
            );
          }

          return (
            <button key={idx} onClick={action.onClick} className="w-full text-right block">
              {Content}
            </button>
          );
        })}
      </div>

      {/* 📜 4. Verse of the Day Card (Tashkeel & Mobile Comfort Card) */}
      <div className="bg-gradient-to-br from-[#00174a] via-[#002366] to-[#00123a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#fed65b]" />
            <span className="text-xs font-extrabold text-[#fed65b] font-tajawal">آية اليوم المعزية</span>
          </div>
          <button
            onClick={handleShareVerse}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-[#fed65b] bg-white/10 px-2.5 py-1 rounded-lg transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة</span>
              </>
            )}
          </button>
        </div>

        {loadingVerse ? (
          <p className="text-xs text-slate-300 font-bold py-2">جاري تحميل آية اليوم...</p>
        ) : (
          <blockquote className="font-tajawal text-sm sm:text-base font-extrabold text-white leading-relaxed">
            {verse?.text || '«تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ، وَأَنَا أُرِيحُكُمْ.»'}
          </blockquote>
        )}

        <div className="pt-1 flex items-center justify-between text-[11px] text-[#fed65b] font-bold">
          <span>— {verse?.reference || 'إنجيل متى ١١ : ٢٨'}</span>
          <Link to="/readings" className="text-slate-300 hover:text-white flex items-center gap-0.5">
            <span>تأمل اليوم</span>
            <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 📖 5. Daily Readings & Katamaros Compact Card */}
      <DailyReadingsCard />

      {/* 📢 6. Church Announcements Carousel */}
      {announcements.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-tajawal text-xs font-extrabold text-[#002366] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              <span>إعلانات ومناسبات الكنيسة</span>
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
              {announcements.length} إعلان
            </span>
          </div>

          <div className="space-y-2">
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] bg-[#002366] text-white px-2 py-0.5 rounded-md font-bold">
                  تنبيه
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">{ann.title}</p>
                {ann.content && <p className="text-[11px] text-slate-500">{ann.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🕊️ 7. Bottom Fast Prayer CTA Banner */}
      <div 
        onClick={onOpenPrayerModal}
        className="bg-gradient-to-r from-[#fed65b] to-[#d4af37] p-4 rounded-3xl text-[#00174a] shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00174a] text-[#fed65b] rounded-2xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-tajawal text-xs font-extrabold">هل تحتاج إلى صلاة أو مساندة؟</h4>
            <p className="text-[10px] text-[#00174a]/80 font-bold">اكتب طلب صلاة ليُرفع اسمك على مذبح الكنيسة</p>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-[#00174a] shrink-0" />
      </div>

    </div>
  );
};

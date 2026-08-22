import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Calendar, ChevronRight, ChevronLeft, Sparkles, Share2, 
  Copy, Check, Heart, Volume2, Type, ArrowRight, Shield
} from 'lucide-react';
import { getDailyReadings, type DailyReadingData } from '../lib/copticReadings';
import { SEO } from '../components/common/SEO';

interface ReadingsPageProps {
  onOpenPrayerModal?: () => void;
}

export const ReadingsPage: React.FC<ReadingsPageProps> = ({ onOpenPrayerModal }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'synaxarium' | 'gospel' | 'epistles' | 'matins' | 'reflection'>('synaxarium');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

  const readings: DailyReadingData = getDailyReadings(selectedDate);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleCopyReading = () => {
    let content = `📖 قراءات وسنكسار يوم ${readings.copticDate.copticDateString}\n`;
    content += `التاريخ الميلادي: ${readings.copticDate.gregorianDateString}\n\n`;
    content += `🌟 السنكسار: ${readings.synaxarium.title}\n`;
    content += `${readings.synaxarium.mainStory}\n\n`;
    content += `📜 إنجيل القداس (${readings.gospel.reference}):\n`;
    content += `${readings.gospel.text}\n\n`;
    content += `كنيسة السيدة العذراء مريم بمحرم بك - الإسكندرية`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fontClasses = {
    normal: 'text-sm sm:text-base leading-relaxed',
    large: 'text-base sm:text-lg leading-loose',
    xlarge: 'text-lg sm:text-xl leading-loose font-medium'
  }[fontSize];

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-cairo text-right" dir="rtl">
      <SEO 
        title={`القطمارس والسنكسار اليومي (${readings.copticDate.copticDateString}) | كنيسة العذراء محرم بك`}
        description={`قراءات الكنيسة القبطية الأرثوذكسية وسنكسار اليوم ${readings.copticDate.copticDateString}. إنجيل ومزمور القداس الإلهي، رسائل البولس والكاثوليكون والإبركسيس.`}
        keywords={[
          'سنكسار اليوم القبطي',
          'قطمارس اليوم',
          'قراءات القداس الالهي اليوم',
          'انجيل اليوم كنيسة العذراء',
          'التقويم القبطي محرم بك'
        ]}
        canonicalUrl="https://stmary-moharambek-digitalhub.org/readings"
      />

      {/* Hero Header */}
      <section className="relative py-12 bg-gradient-to-b from-[#00113a] via-[#00174a] to-[#002366] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent)] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#fed65b] bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 transition-all mb-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع للرئيسية</span>
          </Link>

          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/40 px-3.5 py-1 rounded-full text-[#fed65b] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>القطمارس والسنكسار الكنسي اليومي</span>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold tracking-tight">
            قراءات وسنكسار اليوم
          </h1>

          {/* Date Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1">
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl font-tajawal font-bold text-[#fed65b] text-sm sm:text-base border border-white/10">
              📅 {readings.copticDate.copticDateString}
            </span>
            <span className="bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-xl font-bold text-slate-200 text-xs sm:text-sm border border-white/5">
              ☀️ {readings.copticDate.gregorianDateString}
            </span>
          </div>

          {/* Season / Fast Tag */}
          <div className="inline-block bg-[#fed65b]/10 text-[#fed65b] text-[11px] font-bold px-3 py-1 rounded-lg border border-[#fed65b]/20">
            🌿 {readings.copticDate.seasonName}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Navigation & Controls Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Day Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handlePrevDay}
              className="px-3 py-2 bg-slate-50 hover:bg-[#002366] hover:text-white rounded-2xl text-xs font-bold text-slate-700 transition-all border border-slate-200 flex items-center gap-1"
              title="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={handleToday}
              className="px-4 py-2 bg-[#002366] text-[#fed65b] rounded-2xl text-xs font-bold transition-all shadow-sm"
              title="العودة لتاريخ اليوم"
            >
              اليوم الحالي
            </button>

            <button
              onClick={handleNextDay}
              className="px-3 py-2 bg-slate-50 hover:bg-[#002366] hover:text-white rounded-2xl text-xs font-bold text-slate-700 transition-all border border-slate-200 flex items-center gap-1"
              title="اليوم التالي"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Actions: Font Size & Share */}
          <div className="flex items-center gap-2">
            {/* Font Size Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  fontSize === 'normal' ? 'bg-white text-[#002366] shadow-sm' : 'text-slate-500'
                }`}
                title="حجم خط عادي"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  fontSize === 'large' ? 'bg-white text-[#002366] shadow-sm' : 'text-slate-500'
                }`}
                title="حجم خط كبير"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  fontSize === 'xlarge' ? 'bg-white text-[#002366] shadow-sm' : 'text-slate-500'
                }`}
                title="حجم خط كبير جداً"
              >
                A++
              </button>
            </div>

            {/* Share / Copy Reading Button */}
            <button
              onClick={handleCopyReading}
              className="p-2.5 bg-slate-50 hover:bg-[#d4af37]/20 text-slate-700 hover:text-[#002366] rounded-2xl border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="نسخ القراءات ومشاركتها"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#d4af37]" />
                  <span>مشاركة</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-3xl border border-slate-200 no-scrollbar">
          <button
            onClick={() => setActiveTab('synaxarium')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'synaxarium'
                ? 'bg-[#002366] text-[#fed65b] shadow-md ring-2 ring-[#d4af37]/40'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>🌟</span>
            <span>السنكسار الكنسي</span>
          </button>

          <button
            onClick={() => setActiveTab('gospel')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'gospel'
                ? 'bg-[#002366] text-[#fed65b] shadow-md ring-2 ring-[#d4af37]/40'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>📜</span>
            <span>إنجيل ومزمور القداس</span>
          </button>

          <button
            onClick={() => setActiveTab('epistles')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'epistles'
                ? 'bg-[#002366] text-[#fed65b] shadow-md ring-2 ring-[#d4af37]/40'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>✉️</span>
            <span>الرسائل (البولس والجامعة)</span>
          </button>

          <button
            onClick={() => setActiveTab('matins')}
            className={`flex-1 min-w-[110px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'matins'
                ? 'bg-[#002366] text-[#fed65b] shadow-md ring-2 ring-[#d4af37]/40'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>🌅</span>
            <span>باكر وعشية</span>
          </button>

          <button
            onClick={() => setActiveTab('reflection')}
            className={`flex-1 min-w-[110px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'reflection'
                ? 'bg-[#002366] text-[#fed65b] shadow-md ring-2 ring-[#d4af37]/40'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <span>🕊️</span>
            <span>تأمل اليوم</span>
          </button>
        </div>

        {/* Tab 1: Synaxarium */}
        {activeTab === 'synaxarium' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37] mb-1">
                <span>🌟</span>
                <span>تذكارات السنكسار لهذا اليوم</span>
              </div>
              <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#00174a]">
                {readings.synaxarium.title}
              </h2>
            </div>

            {/* Commemorations List */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/50 space-y-2">
              <h3 className="text-xs font-bold text-[#735c00] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>أبرز قديسي وتذكارات اليوم:</span>
              </h3>
              <ul className="space-y-1.5 pr-4 text-xs sm:text-sm font-bold text-slate-700 list-disc">
                {readings.synaxarium.commemorations.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            {/* Main Story Narrative */}
            <div className="space-y-3">
              <h3 className="font-tajawal text-base font-bold text-[#002366]">
                سيرة اليوم العطرة:
              </h3>
              <p className={`text-slate-700 ${fontClasses} text-justify bg-slate-50/60 p-5 rounded-2xl border border-slate-100`}>
                {readings.synaxarium.mainStory}
              </p>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs font-bold text-slate-400">
                بركة صلوات وشفاعة هؤلاء القديسين فلتكن معنا جميعاً، آمين.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Liturgy Gospel & Psalm */}
        {activeTab === 'gospel' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8 animate-fadeIn">
            
            {/* Psalm of the Liturgy */}
            <div className="space-y-3 bg-amber-50/60 p-5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <span className="font-tajawal text-sm font-bold text-[#735c00]">مزمور القداس الإلهي</span>
                <span className="text-xs font-mono font-bold text-[#002366]">{readings.gospel.psalmRef}</span>
              </div>
              <p className={`text-slate-800 ${fontClasses} font-semibold text-center py-2 text-[#00174a]`}>
                {readings.gospel.psalmText}
              </p>
            </div>

            {/* Gospel of the Liturgy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-tajawal text-base font-bold text-[#002366]">إنجيل القداس الإلهي</span>
                <span className="text-xs font-bold text-[#d4af37] bg-[#002366] px-3 py-1 rounded-xl">
                  {readings.gospel.reference}
                </span>
              </div>
              <p className={`text-slate-800 ${fontClasses} text-justify leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200`}>
                {readings.gospel.text}
              </p>
              <p className="text-[11px] text-center text-slate-400 font-bold">
                «وَالْمَجْدُ لِلَّهِ دَائِمًا أَبَدِيًّا، آمِينَ.»
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Epistles */}
        {activeTab === 'epistles' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            {/* Pauline */}
            <div className="space-y-3 border-b border-slate-200 pb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-tajawal font-bold text-[#002366] text-sm sm:text-base">البولس (رسالة معلمنا بولس الرسول)</h3>
                <span className="text-xs font-bold text-slate-500">{readings.epistles.paulineRef}</span>
              </div>
              <p className={`text-slate-700 ${fontClasses} bg-slate-50 p-4 rounded-2xl border border-slate-100 text-justify`}>
                {readings.epistles.paulineText}
              </p>
            </div>

            {/* Catholic */}
            <div className="space-y-3 border-b border-slate-200 pb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-tajawal font-bold text-[#002366] text-sm sm:text-base">الكاثوليكون (رسائل الجامعة)</h3>
                <span className="text-xs font-bold text-slate-500">{readings.epistles.catholicRef}</span>
              </div>
              <p className={`text-slate-700 ${fontClasses} bg-slate-50 p-4 rounded-2xl border border-slate-100 text-justify`}>
                {readings.epistles.catholicText}
              </p>
            </div>

            {/* Acts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-tajawal font-bold text-[#002366] text-sm sm:text-base">الإبركسيس (أعمال الرسل الأطهار)</h3>
                <span className="text-xs font-bold text-slate-500">{readings.epistles.actsRef}</span>
              </div>
              <p className={`text-slate-700 ${fontClasses} bg-slate-50 p-4 rounded-2xl border border-slate-100 text-justify`}>
                {readings.epistles.actsText}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Matins */}
        {activeTab === 'matins' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-tajawal text-base font-bold text-[#002366]">إنجيل باكر</h2>
              <span className="text-xs font-bold text-[#d4af37] bg-[#002366] px-3 py-1 rounded-xl">
                {readings.matins.gospelRef}
              </span>
            </div>
            <p className={`text-slate-800 ${fontClasses} bg-slate-50 p-6 rounded-2xl border border-slate-200 text-justify`}>
              {readings.matins.gospelText}
            </p>
          </div>
        )}

        {/* Tab 5: Reflection */}
        {activeTab === 'reflection' && (
          <div className="bg-gradient-to-br from-[#00174a] to-[#002366] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/30 shadow-xl space-y-6 animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-[#fed65b]/20 text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full border border-[#fed65b]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>تأمل اليوم الروحي</span>
              </div>
              <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#fed65b]">
                {readings.reflection.title}
              </h2>
            </div>

            <blockquote className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center font-tajawal text-base sm:text-lg font-bold text-white leading-relaxed relative z-10">
              {readings.reflection.quote}
            </blockquote>

            <p className={`text-slate-200 ${fontClasses} leading-relaxed relative z-10 text-justify`}>
              {readings.reflection.text}
            </p>

            {onOpenPrayerModal && (
              <div className="pt-2 text-center relative z-10">
                <button
                  onClick={onOpenPrayerModal}
                  className="bg-[#fed65b] hover:bg-[#fed65b]/90 text-[#00174a] px-6 py-2.5 rounded-2xl font-tajawal font-bold text-xs shadow-lg transition-all"
                >
                  🙏 ارفع طلب صلاة أو ترحيم على المذبح
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

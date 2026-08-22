import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Calendar, ChevronRight, ChevronLeft, Sparkles,
  Copy, Check, Heart, Type, ArrowRight, Shield, ScrollText, Flame
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

  // Dynamic recalculation when selectedDate changes
  const readings: DailyReadingData = useMemo(() => {
    return getDailyReadings(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  };

  const formattedIsoDate = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

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
        canonicalUrl="https://www.tibarthenos.com/readings"
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
            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl font-tajawal font-bold text-[#fed65b] text-sm sm:text-base border border-white/10 shadow-sm">
              📅 {readings.copticDate.copticDateString}
            </span>
            <span className="bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-xl font-bold text-slate-200 text-xs sm:text-sm border border-white/5">
              ☀️ {readings.copticDate.gregorianDateString}
            </span>
          </div>

          {/* Season / Fast Tag */}
          <div className="inline-block bg-[#fed65b]/10 text-[#fed65b] text-[11px] font-bold px-3.5 py-1 rounded-lg border border-[#fed65b]/20">
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
              className="px-3.5 py-2 bg-slate-50 hover:bg-[#002366] hover:text-white rounded-2xl text-xs font-bold text-slate-700 transition-all border border-slate-200 flex items-center gap-1 shadow-sm active:scale-95"
              title="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span>اليوم السابق</span>
            </button>

            <button
              onClick={handleToday}
              className="px-4 py-2 bg-[#002366] text-[#fed65b] rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
              title="العودة لتاريخ اليوم"
            >
              اليوم الحالي
            </button>

            <button
              onClick={handleNextDay}
              className="px-3.5 py-2 bg-slate-50 hover:bg-[#002366] hover:text-white rounded-2xl text-xs font-bold text-slate-700 transition-all border border-slate-200 flex items-center gap-1 shadow-sm active:scale-95"
              title="اليوم التالي"
            >
              <span>اليوم التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-[#002366]" />
              <input
                type="date"
                value={formattedIsoDate}
                onChange={handleDateChange}
                className="bg-transparent outline-none font-bold text-xs cursor-pointer text-[#002366]"
                title="اختر يوماً محدداً"
              />
            </div>

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

            {/* Copy Button */}
            <button
              onClick={handleCopyReading}
              className={`p-2.5 rounded-2xl border transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="نسخ القراءات"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
              <span className="hidden md:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>

        </div>

        {/* Readings Tabs Menu */}
        <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100 rounded-3xl border border-slate-200 no-scrollbar">
          <button
            onClick={() => setActiveTab('synaxarium')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'synaxarium'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>السنكسار اليومي</span>
          </button>

          <button
            onClick={() => setActiveTab('gospel')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'gospel'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إنجيل ومزمور القداس</span>
          </button>

          <button
            onClick={() => setActiveTab('epistles')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'epistles'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>الرسائل (القطمارس)</span>
          </button>

          <button
            onClick={() => setActiveTab('matins')}
            className={`flex-1 min-w-[100px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'matins'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>إنجيل باكر</span>
          </button>

          <button
            onClick={() => setActiveTab('reflection')}
            className={`flex-1 min-w-[100px] py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'reflection'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>تأمل اليوم</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          
          {/* 1. SYNAXARIUM */}
          {activeTab === 'synaxarium' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-[#d4af37] block mb-1">
                  السنكسار القبطي • {readings.copticDate.copticDateString}
                </span>
                <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#002366] leading-snug">
                  {readings.synaxarium.title}
                </h2>
              </div>

              {/* Commemorations List */}
              <div className="bg-amber-50/60 border border-amber-200/60 p-5 rounded-2xl space-y-3">
                <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#d4af37]" />
                  <span>تذكارات هذا اليوم:</span>
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm font-bold text-slate-700">
                  {readings.synaxarium.commemorations.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#d4af37] shrink-0 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Main Synaxarium Story */}
              <div className="space-y-3 pt-2">
                <h3 className="font-tajawal text-base font-extrabold text-[#002366]">
                  سيرة وقصة اليوم:
                </h3>
                <p className={`${fontClasses} text-slate-800 font-semibold text-justify leading-loose bg-slate-50/50 p-6 rounded-2xl border border-slate-100`}>
                  {readings.synaxarium.mainStory}
                </p>
              </div>

              <div className="bg-[#002366]/5 border border-[#002366]/10 p-4 rounded-2xl text-center">
                <p className="font-tajawal font-bold text-xs sm:text-sm text-[#002366]">
                  بركة صلوات وشفاعة هؤلاء القديسين فلتكن معنا جميعاً، آمين.
                </p>
              </div>
            </div>
          )}

          {/* 2. GOSPEL & PSALM */}
          {activeTab === 'gospel' && (
            <div className="space-y-8">
              {/* Psalm */}
              <div className="space-y-3 bg-amber-50/40 p-6 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                  <span className="font-tajawal font-extrabold text-sm text-[#002366]">مزمور القداس الإلهي</span>
                  <span className="text-xs font-bold text-[#d4af37] bg-white px-3 py-1 rounded-full border border-amber-200">
                    {readings.gospel.psalmRef}
                  </span>
                </div>
                <p className={`${fontClasses} font-bold text-slate-800 leading-loose pt-2`}>
                  {readings.gospel.psalmText}
                </p>
              </div>

              {/* Gospel */}
              <div className="space-y-3 bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                  <span className="font-tajawal font-extrabold text-base text-[#002366]">إنجيل القداس الإلهي</span>
                  <span className="text-xs font-bold text-[#002366] bg-white px-3 py-1 rounded-full border border-blue-200">
                    {readings.gospel.reference}
                  </span>
                </div>
                <p className={`${fontClasses} font-bold text-slate-800 leading-loose pt-2`}>
                  {readings.gospel.text}
                </p>
                <div className="pt-2 text-left">
                  <span className="text-xs font-bold text-[#d4af37]">«وَالْمَجْدُ للهِ دَائِماً»</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. EPISTLES (PAULINE, CATHOLIC, ACTS) */}
          {activeTab === 'epistles' && (
            <div className="space-y-6">
              {/* Pauline */}
              <div className="space-y-3 p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-tajawal font-extrabold text-sm text-[#002366]">رسالة البولس (بولس الرسول)</span>
                  <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {readings.epistles.paulineRef}
                  </span>
                </div>
                <p className={`${fontClasses} font-semibold text-slate-800 leading-loose pt-2`}>
                  {readings.epistles.paulineText}
                </p>
              </div>

              {/* Catholic */}
              <div className="space-y-3 p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-tajawal font-extrabold text-sm text-[#002366]">الكاثوليكون (الرسائل الجامعة)</span>
                  <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {readings.epistles.catholicRef}
                  </span>
                </div>
                <p className={`${fontClasses} font-semibold text-slate-800 leading-loose pt-2`}>
                  {readings.epistles.catholicText}
                </p>
              </div>

              {/* Acts (Praxis) */}
              <div className="space-y-3 p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-tajawal font-extrabold text-sm text-[#002366]">الإبركسيس (سفر أعمال الرسل)</span>
                  <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {readings.epistles.actsRef}
                  </span>
                </div>
                <p className={`${fontClasses} font-semibold text-slate-800 leading-loose pt-2`}>
                  {readings.epistles.actsText}
                </p>
              </div>
            </div>
          )}

          {/* 4. MATINS GOSPEL */}
          {activeTab === 'matins' && (
            <div className="space-y-4 bg-slate-50/50 p-6 sm:p-8 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-tajawal font-extrabold text-base text-[#002366]">إنجيل باكر العشية والقداس</span>
                <span className="text-xs font-bold text-[#002366] bg-white px-3 py-1 rounded-full border border-slate-200">
                  {readings.matins.gospelRef}
                </span>
              </div>
              <p className={`${fontClasses} font-bold text-slate-800 leading-loose pt-2`}>
                {readings.matins.gospelText}
              </p>
              <div className="pt-2 text-left">
                <span className="text-xs font-bold text-[#d4af37]">«وَالْمَجْدُ للهِ دَائِماً»</span>
              </div>
            </div>
          )}

          {/* 5. REFLECTION */}
          {activeTab === 'reflection' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#00174a] to-[#002366] text-white p-6 sm:p-8 rounded-3xl border border-[#d4af37]/40 shadow-md space-y-4">
                <span className="text-[#fed65b] text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>آية وتأمل اليوم</span>
                </span>
                <h3 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#fed65b]">
                  {readings.reflection.title}
                </h3>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 font-bold text-sm sm:text-base text-white leading-relaxed">
                  {readings.reflection.quote}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold pt-1">
                  {readings.reflection.text}
                </p>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};

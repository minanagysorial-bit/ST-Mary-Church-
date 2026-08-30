import React, { useState, useEffect, useRef } from 'react';
import { Quote, ChevronLeft, ChevronRight, Share2, Check, Sparkles } from 'lucide-react';

interface FatherQuote {
  id: number;
  text: string;
  author: string;
  title: string;
  theme?: string;
}

export const FATHERS_QUOTES: FatherQuote[] = [
  {
    id: 1,
    text: "إن الكنيسة ليست مجرد مبنى من الحجارة، بل هي قلوب المؤمنين المجتمعين باسم المسيح والسالكين بروح السلام والتعاليم الأرثوذكسية الطاهرة.",
    author: "الشهيد كبريانوس",
    title: "أسقف قرطاجنة والشهيد العظيم",
    theme: "جسد المسيح الواحد"
  },
  {
    id: 2,
    text: "كن مطمئناً جداً جداً ولا تفكر في الأمر كثيراً، بل دع الأمر لمن بيده الأمر.. فكل الأشياء تعمل معاً للخير للذين يحبون الله.",
    author: "القديس البابا كيرلس السادس",
    title: "رجل الصلاة والبركة وبطريرك الإسكندرية",
    theme: "السلام والاتكال"
  },
  {
    id: 3,
    text: "ربنا موجود، يرى كل شيء، وهو قادر على كل شيء، وضابط الكل.. فاطمئن لأن حياتك في يد أمينة ترعاك وتدبر خلاصك في كل حين.",
    author: "مثلث الرحمات البابا شنودة الثالث",
    title: "معلم الأجيال وبطريرك الكرازة المرقسية",
    theme: "رعاية الله وضبطه للكون"
  },
  {
    id: 4,
    text: "الصلاة هي ميناء للذين في العاصفة، ومرساة للذين تغرقهم الأمواج، وعصا للمتزعزعين، وسلاح ضد الشياطين، وشفاء للمتألمين.",
    author: "القديس يوحنا ذهبي الفم",
    title: "بطريرك القسطنطينية وفم الذهب",
    theme: "قوة الصلاة الدائمة"
  },
  {
    id: 5,
    text: "جلست على قمة العالم حينما أحسست في نفسي أني لا أشتهي شيئاً في هذا الوجود ولا أخاف شيئاً سوى الله وحده.. فسلام النفس ينبع من محبته.",
    author: "القديس أوغسطينوس",
    title: "أسقف هيبو وفيلسوف التوبة والنعمة",
    theme: "حرية التوبة والنعمة"
  },
  {
    id: 6,
    text: "المحبة تطرح الخوف إلى خارج.. وكل من أحب الله من كل قلبه صار حراً ومستنيراً بنور الفادي، وعاش حياة ملائكية على الأرض.",
    author: "القديس الأنبا أنطونيوس الكبير",
    title: "أبو الرهبان وكوكب البرية الشرقية",
    theme: "المحبة الإلهية الكاملة"
  },
  {
    id: 7,
    text: "إذا صليت بانسحاق قلب ووداعة، فإن مراحم الرب تسبقك إلى كل مكان، ونعمته تحوطك كترس، وتفيض في داخلك تعزيات الروح القدس.",
    author: "القديس مارإسحق السرياني",
    title: "شيخ المتوحدين ومعلم الروحانيات",
    theme: "انسحاق القلب والسكينة"
  },
  {
    id: 8,
    text: "المسيح تجسد لكي يجدد فينا صورة الله التي فسدت، واشترك في بشريتنا لكي يمنحنا شركة الحياة الإلهية وغلبة القيامة على الموت والفساد.",
    author: "القديس أثناسيوس الرسولي",
    title: "حامي الإيمان والبطريرك العشرون",
    theme: "سر التجسد والفداء"
  },
  {
    id: 9,
    text: "إن القلب هو مذبح الله الحي، والروح القدس هو النار الإلهية المشتعلة فيه لترفع الصلوات النقية كرائحة بخور ذكية أمام العرش الإلهي.",
    author: "القديس الأنبا مقاريوس الكبير",
    title: "أب شيهيت ومصباح وادي النطرون",
    theme: "المذبح الداخلي والقداسة"
  },
  {
    id: 10,
    text: "لا تكن كالمرآة تعكس النور فقط، بل كن كالمصباح يفيض دفئاً ورحمة.. فالخبز الذي تحفظه عندك هو للجائع، والفضة التي تدخرها هي للمحتاج.",
    author: "القديس باسيليوس الكبير",
    title: "رئيس أساقفة قيصرية الكبادوك وواضع القداس",
    theme: "العطاء والرحمة الحقيقية"
  }
];

export const FathersQuotesSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuote = FATHERS_QUOTES[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % FATHERS_QUOTES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + FATHERS_QUOTES.length) % FATHERS_QUOTES.length);
  };

  const handleShare = () => {
    const textToCopy = `"${currentQuote.text}"\n— ${currentQuote.author} (${currentQuote.title})\nكنيسة السيدة العذراء مريم بمحرم بك\nhttps://www.tibarthenos.com/`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  return (
    <section 
      className="relative bg-gradient-to-r from-[#001438] via-[#002366] to-[#001030] text-white py-14 sm:py-16 border-y-2 border-[#d4af37] overflow-hidden select-none font-cairo"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background ambient lighting effects */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-[#004080]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs font-bold px-3.5 py-1 rounded-full shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ينابيع النعمة • من أقوال وتعاليم الآباء القديسين</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share / Copy Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-[#fed65b] px-3 py-1 rounded-full text-xs font-bold transition-all border border-white/10"
              title="نسخ ومشاركة المقولة"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">مشاركة</span>
                </>
              )}
            </button>

            {/* Counter badge */}
            <span className="text-[11px] font-mono font-bold bg-black/30 border border-white/10 px-2.5 py-0.5 rounded-full text-slate-300">
              {currentIndex + 1} / {FATHERS_QUOTES.length}
            </span>
          </div>
        </div>

        {/* Main Quote Card with Smooth Keyframe Transition */}
        <div className="relative min-h-[190px] sm:min-h-[170px] flex flex-col justify-center items-center text-center px-4 sm:px-12">
          {/* Subtle Quote Watermark */}
          <Quote className="w-16 h-16 sm:w-20 sm:h-20 text-[#fed65b]/10 absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none" />

          {/* Animated Quote Content */}
          <div 
            key={currentQuote.id}
            className="space-y-4 animate-tab-transition max-w-4xl"
          >
            {/* Theme Tag */}
            {currentQuote.theme && (
              <span className="inline-block text-[11px] font-bold text-[#fed65b]/80 bg-[#fed65b]/10 px-3 py-0.5 rounded-md">
                🌿 {currentQuote.theme}
              </span>
            )}

            {/* Quote Body */}
            <p className="font-tajawal text-lg sm:text-2xl md:text-3xl font-extrabold text-[#fed65b] leading-relaxed drop-shadow-sm">
              "{currentQuote.text}"
            </p>

            {/* Author & Dignity */}
            <div className="pt-2">
              <h4 className="font-tajawal text-base sm:text-lg font-bold text-white tracking-wide">
                — {currentQuote.author}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                {currentQuote.title}
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            aria-label="المقولة السابقة"
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-[#fed65b] text-white hover:text-[#00174a] flex items-center justify-center transition-all shadow-md hover:scale-105 border border-white/15 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="المقولة التالية"
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-[#fed65b] text-white hover:text-[#00174a] flex items-center justify-center transition-all shadow-md hover:scale-105 border border-white/15 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Indicators Dots */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-6">
          {FATHERS_QUOTES.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`الانتقال للمقولة ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-7 sm:w-8 bg-[#fed65b] shadow-sm'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Hover Pause hint */}
        <div className="text-center pt-2">
          <span className="text-[10px] text-slate-400 font-semibold">
            {isPaused ? '⏸️ متوقف مؤقتاً للقراءة (أبعد الماوس للاستمرار)' : '🔄 يتغير تلقائياً كل ٦ ثوانٍ • قف بالماوس للتوقف'}
          </span>
        </div>

      </div>
    </section>
  );
};

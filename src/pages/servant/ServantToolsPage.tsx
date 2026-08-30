import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Wrench, BookOpen, Download, FileText, CheckSquare, 
  HelpCircle, ChevronLeft, Volume2, Play, Pause, RefreshCw, PlusCircle, Gamepad, Award, Bell, Presentation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ServantToolsPage: React.FC = () => {
  const { profile } = useAuth();
  
  // Interactive Tools state
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Tombola Game State
  const [tombolaNumbers, setTombolaNumbers] = useState<number[]>([]);
  const [lastTombolaNumber, setLastTombolaNumber] = useState<number | null>(null);
  const [tombolaHistory, setTombolaHistory] = useState<number[]>([]);

  // Audio Hymn Player State
  const [isPlayingHymn, setIsPlayingHymn] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Guide modal state
  const [showGuide, setShowGuide] = useState(false);

  // Draw a number for Tombola
  const drawTombolaNumber = () => {
    if (tombolaHistory.length >= 90) {
      alert('تم سحب جميع الأرقام من 1 إلى 90!');
      return;
    }
    let num: number;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (tombolaHistory.includes(num));

    setLastTombolaNumber(num);
    setTombolaHistory(prev => [num, ...prev]);
  };

  const resetTombola = () => {
    setLastTombolaNumber(null);
    setTombolaHistory([]);
  };

  // Toggle play audio simulation
  const toggleHymnPlay = () => {
    setIsPlayingHymn(!isPlayingHymn);
    if (!isPlayingHymn) {
      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlayingHymn(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  return (
    <DashboardLayout role="servant">
      <div className="space-y-8 font-cairo">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              حقيبة أدوات الخادم الرقمية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">الوسائل والأدوات الروحية والتعليمية التفاعلية</p>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00113a] to-[#002366] p-8 lg:p-10 text-white shadow-lg border border-[#d4af37]/20">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-block bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fed65b] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              نظام الوسائل التفاعلية
            </span>
            <h2 className="font-headline font-extrabold text-2xl lg:text-3xl tracking-wide">أهلاً بك في حقيبة الخادم الرقمية</h2>
            <p className="font-body-md text-slate-350 opacity-90 leading-relaxed text-sm">
              نحن هنا لنسهل عليك خدمتك. ابدأ باستخدام الأدوات التفاعلية والمناهج الروحية لإثراء وقت الخدمة مع المخدومين.
            </p>
            <button 
              onClick={() => setShowGuide(true)}
              className="mt-4 bg-secondary-container text-primary font-bold px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-2 shadow-md shadow-black/10"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>دليل الاستخدام</span>
            </button>
          </div>
          {/* Spiritual background decors */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-2xl"></div>
        </section>

        {/* Dynamic Tool Interface Area (Shows if a tool is maximized) */}
        {activeTool === 'tombola' && (
          <div className="bg-white rounded-2xl p-6 border border-secondary/30 shadow-md space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#eae8e7] pb-3">
              <h3 className="font-headline font-bold text-primary flex items-center gap-2 text-sm lg:text-base">
                <Gamepad className="w-5 h-5 text-secondary" />
                <span>أداة الطمبولة الرقمية (لعبة سحب الأرقام)</span>
              </h3>
              <button 
                onClick={() => setActiveTool(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
              >
                إغلاق الأداة
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-primary/5 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 border border-[#c5c6d2]/35">
                <p className="text-xs text-slate-500 font-bold">الرقم المسحوب حالياً</p>
                <div className="w-24 h-24 rounded-full bg-secondary-container text-primary border-4 border-secondary flex items-center justify-center font-headline font-black text-4xl shadow-inner animate-pulse">
                  {lastTombolaNumber !== null ? lastTombolaNumber : '—'}
                </div>
                <div className="flex gap-2 w-full pt-2">
                  <button 
                    onClick={drawTombolaNumber}
                    className="flex-1 bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-container text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>اسحب رقم</span>
                  </button>
                  <button 
                    onClick={resetTombola}
                    className="border border-[#c5c6d2] bg-white text-slate-550 font-bold px-3 py-2.5 rounded-lg hover:bg-slate-50 text-xs transition-all active:scale-95 flex items-center justify-center"
                    title="إعادة تعيين السحب"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-550" />
                  </button>
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <h4 className="text-xs font-extrabold text-[#002366]">لوحة الأرقام المسحوبة (السجل)</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-[#eae8e7] h-40 overflow-y-auto font-mono text-[11px] grid grid-cols-10 gap-1.5 text-center">
                  {Array.from({ length: 90 }, (_, k) => k + 1).map(n => {
                    const isDrawn = tombolaHistory.includes(n);
                    return (
                      <span 
                        key={n} 
                        className={`py-1 rounded font-bold border transition-colors ${
                          isDrawn 
                            ? 'bg-secondary-container border-secondary text-primary font-black scale-105 shadow-sm' 
                            : 'bg-white border-slate-100 text-slate-300'
                        }`}
                      >
                        {n}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'curriculum' && (
          <div className="bg-white rounded-2xl p-6 border border-secondary/30 shadow-md space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#eae8e7] pb-3">
              <h3 className="font-headline font-bold text-primary flex items-center gap-2 text-sm lg:text-base">
                <BookOpen className="w-5 h-5 text-secondary" />
                <span>دليل ومقترحات مناهج مدارس الأحد</span>
              </h3>
              <button 
                onClick={() => setActiveTool(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
              >
                إغلاق
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold font-tajawal">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3">
                <p className="text-primary text-sm font-extrabold">منهج حضانة (الملائكة)</p>
                <p className="text-slate-500 text-[11px] font-normal leading-relaxed font-cairo">تحضير قصص شيقة تفاعلية مع وسائل إيضاح وتلوين مجسمة.</p>
                <button className="bg-primary hover:bg-primary-container text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الدليل PDF</span>
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3">
                <p className="text-primary text-sm font-extrabold">منهج ابتدائي</p>
                <p className="text-slate-500 text-[11px] font-normal leading-relaxed font-cairo">منهج العقيدة والطقوس المبسط والأنشطة والمسابقات الرياضية والدينية.</p>
                <button className="bg-primary hover:bg-primary-container text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الدليل PDF</span>
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3">
                <p className="text-primary text-sm font-extrabold">منهج إعدادي وثانوي</p>
                <p className="text-slate-500 text-[11px] font-normal leading-relaxed font-cairo">دراسات كتابية، دفاعيات مبسطة وحلقات نقاش اجتماعية وإيجاد حلول للمشاكل.</p>
                <button className="bg-primary hover:bg-primary-container text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الدليل PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Tool 1: Curriculums */}
          <div 
            onClick={() => setActiveTool(activeTool === 'curriculum' ? null : 'curriculum')}
            className="group bg-white border border-[#c5c6d2]/50 hover:border-secondary rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-primary/5">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base group-hover:text-primary transition-colors">مناهج روحية</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              مجموعة متكاملة من الدروس والأنشطة لجميع المراحل العمرية.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-secondary font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>تصفح المناهج</span>
              <ChevronLeft className="w-4 h-4 text-secondary scale-x-[-1]" />
            </div>
          </div>

          {/* Tool 2: Interactive Games */}
          <div 
            onClick={() => alert('قريباً: سيتم توفير مكتبة تضم أفكار الألعاب التفاعلية والألعاب الجماعية الصيفية للأخوة الخدام.')}
            className="group bg-white border border-[#c5c6d2]/50 hover:border-secondary rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-secondary-container/10 text-secondary flex items-center justify-center group-hover:bg-secondary-container group-hover:text-primary transition-all duration-300 shadow-sm border border-secondary/5">
              <Gamepad className="w-7 h-7 text-[#735c00]" />
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base">ألعاب تفاعلية</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              أفكار مبتكرة لألعاب جماعية وحركية داخل وخارج الكنيسة.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-secondary font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>استعرض الألعاب</span>
              <ChevronLeft className="w-4 h-4 text-secondary scale-x-[-1]" />
            </div>
          </div>

          {/* Tool 3: Kahoot */}
          <div 
            onClick={() => window.open('https://kahoot.it/', '_blank')}
            className="group bg-white border border-[#c5c6d2]/50 hover:border-secondary rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-sm border border-rose-100">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base">كاهوت</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              مسابقات تنافسية سريعة وممتعة لتقييم استيعاب الدروس.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-secondary font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>ابدأ مسابقة</span>
              <ChevronLeft className="w-4 h-4 text-secondary scale-x-[-1]" />
            </div>
          </div>

          {/* Tool 4: Tambola */}
          <div 
            onClick={() => setActiveTool(activeTool === 'tombola' ? null : 'tombola')}
            className="group bg-white border border-[#c5c6d2]/50 hover:border-secondary rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-[#735c00] group-hover:text-white transition-all duration-300 shadow-sm border border-amber-100">
              <span className="text-xl font-bold font-mono">90</span>
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base group-hover:text-primary transition-colors">طمبولة</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              أداة رقمية لسحب الأرقام وإدارة لعبة الطمبولة التقليدية.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-secondary font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>فتح اللوحة</span>
              <ChevronLeft className="w-4 h-4 text-secondary scale-x-[-1]" />
            </div>
          </div>

          {/* Tool 5: Attendance */}
          <div 
            onClick={() => window.location.href = '/servant/families'}
            className="group bg-white border border-[#c5c6d2]/50 hover:border-secondary rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm border border-emerald-100">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base">الغياب والحضور</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              سجل حضور المخدومين إلكترونياً ومتابعة الغائبين بذكاء.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-secondary font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>تسجيل الحضور</span>
              <ChevronLeft className="w-4 h-4 text-secondary scale-x-[-1]" />
            </div>
          </div>

          {/* Tool 6: PowerPoint Hymns from Drive */}
          <Link 
            to="/servant/lesson-bank?tab=hymns"
            className="group bg-white border border-[#c5c6d2]/50 hover:border-orange-400 rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm border border-orange-100">
              <Presentation className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-extrabold text-[#002366] text-base group-hover:text-orange-600 transition-colors">ترانيم الباوربوينت</h3>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[200px]">
              مكتبة عروض PPTX لترانيم مدارس الأحد والأجبية والاجتماعات من Google Drive.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-orange-600 font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>تصفح الترانيم (٢١ ملف)</span>
              <ChevronLeft className="w-4 h-4 text-orange-600 scale-x-[-1]" />
            </div>
          </Link>

        </section>

        {/* Coptic Hymns Encyclopedia Section */}
        <section className="bg-surface-container-low rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-center border border-[#c5c6d2]/50 shadow-inner">
          <div className="flex-1 space-y-4">
            <span className="inline-block bg-secondary-container text-[#574500] px-3.5 py-1 rounded-md text-[10px] font-extrabold mb-2 uppercase tracking-wide">
              جديد وحصري
            </span>
            <h2 className="font-headline font-black text-[#002366] text-xl">موسوعة الألحان القبطية</h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed text-xs">
              تم إضافة قسم جديد للألحان مع ملفات صوتية تعليمية وشروحات للمعاني الروحية. يمكنك استخدامها الآن في فترات الترتيل ومجامر مدارس الأحد والاجتماعات.
            </p>
            
            {/* Audio Simulation Controls */}
            {isPlayingHymn && (
              <div className="bg-white p-3 rounded-xl border border-[#c5c6d2]/40 w-full max-w-sm space-y-2 mt-4 transition-all">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-secondary animate-pulse" />
                    <span>جاري تشغيل: لحن الـ بي إكيسوستيس</span>
                  </span>
                  <span>{audioProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-[#735c00] h-1.5 rounded-full transition-all" style={{ width: `${audioProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button 
                onClick={toggleHymnPlay}
                className="bg-primary hover:bg-primary-container text-white py-2 px-6 rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-xs shadow-md shadow-primary/10"
              >
                {isPlayingHymn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingHymn ? 'إيقاف مؤقت' : 'استماع للحن'}</span>
              </button>
              <button 
                onClick={() => alert('جاري تنزيل ملفات نوت وكلمات الألحان القبطية الملحقة...')}
                className="border border-primary text-primary px-6 py-2 rounded-xl font-bold hover:bg-primary/5 transition-colors text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل الملفات</span>
              </button>
            </div>
          </div>
          
          {/* Coptic manuscript image placeholder wrapper */}
          <div className="w-full lg:w-1/3 h-48 rounded-xl overflow-hidden relative shadow-md border border-[#c5c6d2]/35 bg-white">
            <img 
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBzm2p4CYcVmvvmRXHNHaVZgsCEbaHapzrZAOoAo96lN7uUiiVKfzSkBk7_J6gYuWS2pd6aDGsjs66n4BFr6DcmEfNp2p6zXVAvLeccDnh9ZhSrBjnJVC0zjOsozeIDjMijBwsU8KCY9NYl3iyhxrJydAk1GrPRksuFyUuHT_gajFR8TAny882Bn7E8cy3Bbx73lmYrrtrU9-Z7uYeJ7xAzXM2JTGZeeX1CS_jOByG7o4J4a-IBWYBmVq0xh5xYgGQ3fU_1i3EQqcv" 
              alt="المخطوطات القبطية الروحية"
            />
          </div>
        </section>

      </div>

      {/* Guide Modal Overlay */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-secondary/35 overflow-hidden">
            <div className="p-5 border-b border-[#eae8e7] flex justify-between items-center bg-[#00174a] text-white">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-secondary-container" />
                <h2 className="font-headline font-bold text-sm lg:text-base">حقيبة الخادم — دليل البدء السريع</h2>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-slate-300 hover:text-white rounded-full p-1 hover:bg-white/10 transition-all cursor-pointer"
              >
                <XIcon />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-bold text-slate-650 leading-relaxed font-cairo">
              <div className="space-y-1">
                <p className="text-primary font-extrabold font-tajawal text-sm border-r-4 border-secondary pr-2">1. المناهج والتحضير</p>
                <p className="text-slate-500 font-normal pr-6">مجموعة متكاملة من الدروس للملائكة، ابتدائي، إعدادي وثانوي. تحضير المادة الروحية بالكامل.</p>
              </div>
              <div className="space-y-1">
                <p className="text-primary font-extrabold font-tajawal text-sm border-r-4 border-secondary pr-2">2. الألعاب والمسابقات</p>
                <p className="text-slate-500 font-normal pr-6">ألعاب كروت، ألعاب كاهوت، ومولد سحب أرقام الطمبولة الرقمي لتبادلها مع المخدومين في ساحة النشاط.</p>
              </div>
              <div className="space-y-1">
                <p className="text-primary font-extrabold font-tajawal text-sm border-r-4 border-secondary pr-2">3. الحضور والانصراف والافتقاد</p>
                <p className="text-slate-500 font-normal pr-6">ربط الحضور والافتقاد بسجلات شعب الكنيسة مباشرةً وتحديد احتياجات الغائبين لإجراء الزيارات التفتيشية.</p>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setShowGuide(false)}
                  className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary-container transition-all"
                >
                  فهمت ذلك
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Quick inline custom cross icon close replacement helper
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);

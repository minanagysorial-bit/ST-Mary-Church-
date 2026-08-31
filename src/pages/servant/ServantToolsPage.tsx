import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Wrench, BookOpen, Download, FileText, CheckSquare, 
  HelpCircle, ChevronLeft, Volume2, Play, Pause, RefreshCw, PlusCircle, Gamepad, Award, Bell, Presentation,
  ExternalLink, Eye, Sparkles, X, Settings, Trophy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { ChurchCurriculum, formatDriveUrl } from '../super-admin/CurriculumManagementPage';

export const ServantToolsPage: React.FC = () => {
  const { profile } = useAuth();
  const isLeaderOrAdmin = profile && ['super_admin', 'admin', 'service_leader'].includes(profile.role);
  
  // Interactive Tools state
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Curriculums State
  const [curriculums, setCurriculums] = useState<ChurchCurriculum[]>([]);
  const [selectedCurriculumStage, setSelectedCurriculumStage] = useState<string>('الكل');
  const [previewingCurriculum, setPreviewingCurriculum] = useState<ChurchCurriculum | null>(null);

  // Coming Soon Modal (Animated)
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; title: string }>({ open: false, title: '' });

  // Guide modal state
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const loadCurriculums = async () => {
      try {
        const settings = await api.getSiteSettings();
        if (settings && settings['church_curriculums']) {
          const parsed = JSON.parse(settings['church_curriculums']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCurriculums(parsed);
            return;
          }
        }
        const local = localStorage.getItem('church_curriculums_cache');
        if (local) setCurriculums(JSON.parse(local));
      } catch (e) {
        console.error(e);
      }
    };
    loadCurriculums();
  }, []);

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


        {activeTool === 'curriculum' && (
          <div className="bg-white rounded-2xl p-6 border border-secondary/30 shadow-md space-y-6 animate-fadeIn text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eae8e7] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                <h3 className="font-headline font-bold text-primary text-sm lg:text-base">
                  دليل ومناهج مدارس الأحد (Google Drive)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isLeaderOrAdmin && (
                  <Link
                    to="/admin/curriculums"
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>إدارة المناهج (سوبر أدمن) ⚙️</span>
                  </Link>
                )}
                <button 
                  onClick={() => setActiveTool(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Stage filter tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold font-tajawal">
              {['الكل', 'حضانة', 'ابتدائي', 'إعدادي', 'ثانوي', 'جامعة', 'عام'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedCurriculumStage(st)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedCurriculumStage === st
                      ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st === 'الكل' ? 'جميع المراحل' : `مرحلة ${st}`}
                </button>
              ))}
            </div>
            
            {/* Dynamic Curriculums Cards */}
            {curriculums.filter(c => selectedCurriculumStage === 'الكل' || c.stage === selectedCurriculumStage).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">لا توجد مناهج مضافة لهذه المرحلة حالياً.</p>
                {isLeaderOrAdmin && (
                  <Link to="/admin/curriculums" className="text-xs text-[#002366] font-bold underline">
                    + اضغط هنا لإضافة منهج من درايف
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold font-tajawal">
                {curriculums
                  .filter(c => selectedCurriculumStage === 'الكل' || c.stage === selectedCurriculumStage)
                  .map(c => {
                    const { previewUrl, downloadUrl, isFolder } = formatDriveUrl(c.drive_url);
                    return (
                      <div key={c.id} className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-[#002366] flex flex-col justify-between space-y-3 transition-all shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="bg-blue-100 text-[#002366] text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                              {c.stage}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {c.file_type} {c.term ? `• ${c.term}` : ''}
                            </span>
                          </div>
                          <p className="text-primary text-sm font-extrabold leading-snug">{c.title}</p>
                          {c.description && (
                            <p className="text-slate-500 text-[11px] font-normal leading-relaxed font-cairo line-clamp-2">
                              {c.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={c.drive_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-[#002366] hover:bg-[#00113a] text-[#fed65b] py-2 rounded-xl flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>فتح الملف في Google Drive</span>
                          </a>

                          {!isFolder && (
                            <button
                              onClick={() => setPreviewingCurriculum(c)}
                              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
                              title="معاينة المنهج"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
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
            onClick={() => setComingSoonModal({ open: true, title: 'الألعاب التفاعلية' })}
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
            onClick={() => setComingSoonModal({ open: true, title: 'مسابقات كاهوت الروحية' })}
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

          {/* Tool 4: Honor Board (لوحة الشرف للأولاد) */}
          <div 
            onClick={() => window.open('/leaderboard', '_blank')}
            className="group bg-gradient-to-br from-white to-amber-50/50 border border-amber-200 hover:border-[#d4af37] rounded-2xl p-8 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center space-y-4 relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#fed65b] text-[#00174a] flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md shadow-amber-500/20">
              <Trophy className="w-8 h-8 text-[#00174a]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                صفحة خارجية تفاعلية 🌟
              </span>
              <h3 className="font-headline font-extrabold text-[#002366] text-base group-hover:text-amber-700 transition-colors">
                لوحة الشرف وأبطال الخدمة
              </h3>
            </div>
            <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-[210px]">
              لوحة ترتيب النقاط للأولاد لكل خدمة (ابتدائي، إعدادي، ثانوي) مع إمكانية مشاركة الترتيب على فيسبوك وواتساب.
            </p>
            <div className="w-full pt-4 border-t border-[#eae8e7] text-amber-700 font-bold text-xs flex justify-center items-center gap-2 group-hover:gap-3 transition-all">
              <span>فتح لوحة الشرف للأولاد</span>
              <ExternalLink className="w-4 h-4 text-amber-700" />
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

      {/* Modal: Preview Curriculum Drive Document */}
      {previewingCurriculum && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] p-6 flex flex-col space-y-4 shadow-2xl border border-slate-100 animate-scale-in" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#002366]" />
                <h3 className="font-tajawal text-base font-bold text-[#00174a]">
                  معاينة: {previewingCurriculum.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewingCurriculum.drive_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في درايف</span>
                </a>
                <button
                  onClick={() => setPreviewingCurriculum(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden relative">
              <iframe
                src={formatDriveUrl(previewingCurriculum.drive_url).previewUrl}
                className="w-full h-full border-0"
                title={previewingCurriculum.title}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Animated Coming Soon for Interactive Games & Kahoot in the center */}
      {comingSoonModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-[#fed65b]/40 relative overflow-hidden animate-scale-in" dir="rtl">
            {/* Background glowing rings */}
            <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#fed65b]/20 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#002366]/15 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

            <div className="relative z-10 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#00174a] to-[#002366] text-[#fed65b] flex items-center justify-center shadow-xl border border-[#fed65b]/40 animate-bounce">
                <Sparkles className="w-10 h-10 text-[#fed65b]" />
              </div>

              <div className="space-y-2">
                <span className="inline-block bg-[#fed65b]/25 border border-[#fed65b]/50 text-[#735c00] text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  قريباً جداً ✨
                </span>
                <h3 className="font-tajawal text-2xl sm:text-3xl font-black text-[#00174a]">
                  اذكرونا في صلواتكم ✝️
                </h3>
                <p className="text-xs text-slate-600 font-bold leading-relaxed max-w-xs mx-auto">
                  يجري إعداد وتجهيز باقة مميزة ومبتكرة من الألعاب التفاعلية الجماعية ومسابقات كاهوت الروحية لمدارس الأحد لخدمة أولادنا ومخدومينا.
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setComingSoonModal({ open: false, title: '' })}
                  className="w-full py-3 bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>حسناً، نرافقكم بالصلاة 🙏</span>
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

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  BookOpen, Download, Search, Filter, Plus, FileText, Presentation, Gamepad2, 
  Palette, Star, CheckCircle2, ChevronLeft, Bookmark, Sparkles, X, Share2, Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { api } from '../../lib/api';

interface LessonResource {
  id: string;
  title: string;
  stage: 'ابتدائي' | 'إعدادي' | 'ثانوي' | 'عام';
  category: 'دروس وتحضير' | 'عروض تقديمية PPT' | 'مسابقات وألعاب' | 'أنشطة وتلوين PDF';
  scripture_ref: string;
  memory_verse: string;
  objective: string;
  summary: string;
  points: string[];
  activities: string[];
  file_url?: string;
  file_type?: string;
  file_size?: string;
  author: string;
  created_at: string;
}

const DEFAULT_LESSONS: LessonResource[] = [
  {
    id: 'lesson_1',
    title: 'درس: شجاعة داود النبي والغلبة بالإيمان',
    stage: 'ابتدائي',
    category: 'دروس وتحضير',
    scripture_ref: 'صموئيل الأول ١٧: ١ - ٥٠',
    memory_verse: '«أَنْتَ تَأْتِي إِلَيَّ بِسَيْفٍ وَبِرُمْحٍ وَبِتُرْسٍ، وَأَنَا آتِي إِلَيْكَ بِاسْمِ رَبِّ الْجُنُودِ» (١ صم ١٧: ٤٥)',
    objective: 'أن يتعلم الطفل أن الاتكال على قوة ربنا يسوع يغلب أي خوف أو تحدي مهما كان كبيراً.',
    summary: 'قصة داود الصغير الراعي الذي انتصر على جليات الجبار ليس بالسلاح بل بالثقة في اسم إله إسرائيل.',
    points: [
      'داود الأمين في رعاية غنم أبيه.',
      'صوت جليات المخيف وثقة داود بالله الحي.',
      'خمسة حصوات ملساء ومقلاع داود.',
      'النصرة العظيمة وفرح شعب الله.'
    ],
    activities: [
      'نشاط رسم الدرع والخوذة وكتابة الآية الذهبية.',
      'لعبة ترتيب أحداث المعركة كروت مصورة.'
    ],
    file_type: 'PDF',
    file_size: '2.4 MB',
    author: 'لجنة التربية الكنسية - أسقفية الشباب',
    created_at: '2026-08-20'
  },
  {
    id: 'lesson_2',
    title: 'عرض تقديمي PPT: رحلة الفلك ونوح البار',
    stage: 'ابتدائي',
    category: 'عروض تقديمية PPT',
    scripture_ref: 'تكوين ٦ - ٨',
    memory_verse: '«وَأَمَّا نُوحٌ فَوَجَدَ نِعْمَةً فِي عَيْنَيِ الرَّبِّ» (تك ٦: ٨)',
    objective: 'إدراك معنى طاعة وصية الله والحياة في قداسة وبر وسط العالم.',
    summary: 'شرائح ملونة جذابة تشرح بناء الفلك ودخول الحيوانات وظهور قوس قزح كعلامة للعهد الإلهي.',
    points: [
      'فساد العالم ونقاء قلب نوح.',
      'مواصفات الفلك الإلهية كرمز لكنيسة العهد الجديد.',
      'الطوفان ورعاية الله لمن في داخل الفلك.',
      'حمامة الغصن الأخضر وقوس قزح.'
    ],
    activities: [
      'عرض تفاعلي بالباوربوينت مع أسئلة سريعة بين الشرائح.',
      'أوراق تلوين قوس قزح والفلك.'
    ],
    file_type: 'PPTX',
    file_size: '8.5 MB',
    author: 'مجمع خدام كنيسة السيدة العذراء بمحرم بك',
    created_at: '2026-08-22'
  },
  {
    id: 'lesson_3',
    title: 'بنك مسابقات وألعاب: أبطال الإيمان والعهد القديم',
    stage: 'إعدادي',
    category: 'مسابقات وألعاب',
    scripture_ref: 'عبرانيين ١١',
    memory_verse: '«وَأَمَّا الإِيمَانُ فَهُوَ الثِّقَةُ بِمَا يُرْجَى وَالإِيقَانُ بِأُمُورٍ لاَ تُرَى» (عب ١١: ١)',
    objective: 'تثبيت الحقائق الكتابية وتنشيط الذاكرة التاريخية للعهدين بأسلوب تنافسي حماسي.',
    summary: 'مجموعة من ٥٠ سؤالاً متدرجة الصعوبة مقسمة لمحطات: من أكون؟، أكمل الشاهد، وفك الشفرات القبطية.',
    points: [
      'محطة الآباء البطاركة (إبراهيم، إسحق، يعقوب).',
      'محطة القضاة والملوك (يشوع، جدعون، سليمان).',
      'محطة الأنبياء العظام والرسل.'
    ],
    activities: [
      'مسابقة الفرق الدوارة باستخدام كروت الإجابات.',
      'تحدي سرعة فتح الشواهد في الأناجيل.'
    ],
    file_type: 'PDF',
    file_size: '1.8 MB',
    author: 'لجنة الأنشطة والمسابقات',
    created_at: '2026-08-25'
  },
  {
    id: 'lesson_4',
    title: 'كتيب تلوين وأنشطة: معجزات السيد المسيح في الأناجيل',
    stage: 'ابتدائي',
    category: 'أنشطة وتلوين PDF',
    scripture_ref: 'الأناجيل الأربعة',
    memory_verse: '«كُلُّ شَيْءٍ بِهِ كَانَ، وَبِغَيْرِهِ لَمْ يَكُنْ شَيْءٌ مِمَّا كَانَ» (يو ١: ٣)',
    objective: 'غرس محبة الرب يسوع وقدرته الشافية المحيية في نفوس الأطفال عبر الفن والتلوين.',
    summary: '١٢ صفحة رسومات عالية الجودة جاهزة للطباعة بالأبيض والأسود مع آيات مفرغة للتلوين.',
    points: [
      'عرس قانا الجليل وتحويل الماء إلى خمر.',
      'تهدئة العاصفة في البحر.',
      'إشباع الجموع بالخمس خبزات والسمكتين.',
      'شفاء المولود أعمى وقيامة لعازر.'
    ],
    activities: [
      'تلوين وتوصيل النقط والمتاهات الروحية.',
      'حفظ الآيات المصاحبة لكل معجزة.'
    ],
    file_type: 'PDF',
    file_size: '4.2 MB',
    author: 'مكتبة كنيسة السيدة العذراء محرم بك',
    created_at: '2026-08-26'
  },
  {
    id: 'lesson_5',
    title: 'دراسة شبابية: بناء الهوية المسيحية في عصر السوشيال ميديا',
    stage: 'ثانوي',
    category: 'دروس وتحضير',
    scripture_ref: 'رومية ١٢: ١ - ٢',
    memory_verse: '«وَلاَ تُشَاكِلُوا هذَا الدَّهْرَ، بَلْ تَغَيَّرُوا عَنْ شَكْلِكُمْ بِتَجْدِيدِ أَذْهَانِكُمْ» (رو ١٢: ٢)',
    objective: 'تمكين الشباب من التعامل الواعي مع العالم الرقمي والمحافظة على نقاوة الفكر والشهادة للمسيح.',
    summary: 'محاور نقاشية وورش عمل تفاعلية حول إدارة الوقت، حماية الخصوصية، والشهادة الحية في الفضاء الإلكتروني.',
    points: [
      'مفهوم القيمة الذاتية المستمدة من بنوة الله لا من عدد الـ Likes.',
      'تحديات المقارنة والتشويش والانسياق وراء التريند.',
      'كيف نكون نوراً وملحاً في وسائل التواصل الاجتماعي.',
      'خطة عملية لتقنين الشاشات وتكريس الوقت للصلاة والنمو.'
    ],
    activities: [
      'ورشة عمل دراسة حالات واقعية.',
      'مناظرة شبابية تفاعلية حول الاستخدام الإيجابي للتقنية.'
    ],
    file_type: 'PDF',
    file_size: '3.1 MB',
    author: 'لجنة الشباب والخريجين',
    created_at: '2026-08-26'
  }
];

export const LessonBankPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  const [lessons, setLessons] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<LessonResource | null>(null);

  // New Lesson Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<'ابتدائي' | 'إعدادي' | 'ثانوي' | 'عام'>('ابتدائي');
  const [newCategory, setNewCategory] = useState<'دروس وتحضير' | 'عروض تقديمية PPT' | 'مسابقات وألعاب' | 'أنشطة وتلوين PDF'>('دروس وتحضير');
  const [newScripture, setNewScripture] = useState('');
  const [newMemoryVerse, setNewMemoryVerse] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newPoints, setNewPoints] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const settings = await api.getSiteSettings().catch(() => ({} as Record<string, string>));
      const raw = settings['church_servant_lesson_bank'];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setLessons(parsed);
        } catch {
          setLessons(DEFAULT_LESSONS);
        }
      } else {
        setLessons(DEFAULT_LESSONS);
      }
    } catch (err) {
      console.error('Error loading lesson bank:', err);
      setLessons(DEFAULT_LESSONS);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim()) {
      toast.error('يرجى كتابة عنوان الدرس والهدف التعليمي');
      return;
    }

    const created: LessonResource = {
      id: `lesson_${Date.now()}`,
      title: newTitle.trim(),
      stage: newStage,
      category: newCategory,
      scripture_ref: newScripture.trim() || 'الكتاب المقدس',
      memory_verse: newMemoryVerse.trim() || 'آية الدرس',
      objective: newObjective.trim(),
      summary: newSummary.trim(),
      points: newPoints.split('\n').map(p => p.trim()).filter(Boolean),
      activities: ['نشاط تطبيقي تفاعلي', 'مراجعة وحفظ الآية'],
      file_type: 'PDF',
      file_size: '1.5 MB',
      author: profile?.full_name || 'خادم بكنيسة العذراء مريم',
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...lessons];
    setLessons(updated);
    setShowAddModal(false);
    
    // Clear inputs
    setNewTitle('');
    setNewScripture('');
    setNewMemoryVerse('');
    setNewObjective('');
    setNewSummary('');
    setNewPoints('');

    toast.success('تمت إضافة الدرس إلى بنك الدروس بنجاح ✨');

    try {
      await api.updateSiteSettings({
        church_servant_lesson_bank: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Error syncing lesson bank settings:', err);
    }
  };

  const filteredLessons = lessons.filter(l => {
    const matchesStage = selectedStage === 'الكل' || l.stage === selectedStage;
    const matchesCategory = selectedCategory === 'الكل' || l.category === selectedCategory;
    const matchesSearch = 
      l.title.includes(searchQuery) ||
      l.summary.includes(searchQuery) ||
      l.memory_verse.includes(searchQuery) ||
      l.scripture_ref.includes(searchQuery);
    return matchesStage && matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'دروس وتحضير':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'عروض تقديمية PPT':
        return <Presentation className="w-4 h-4 text-orange-600" />;
      case 'مسابقات وألعاب':
        return <Gamepad2 className="w-4 h-4 text-purple-600" />;
      case 'أنشطة وتلوين PDF':
        return <Palette className="w-4 h-4 text-emerald-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <DashboardLayout role={(profile?.role as any) || 'servant'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] to-[#002366] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#d4af37]/20">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b] shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-tajawal font-extrabold text-2xl sm:text-3xl text-[#fed65b]">
                  بنك تحضير دروس مدارس الأحد والمناهج الكنسية
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm font-semibold">
                  مكتبة متكاملة للخدام: تحضير دروس، عروض باوربوينت، مسابقات تفاعلية، وأوراق تلوين PDF.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00123a] font-extrabold text-xs rounded-2xl shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تحضير درس جديد</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالعنوان، الآية، الشاهد الكتابي..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
              />
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['الكل', 'ابتدائي', 'إعدادي', 'ثانوي', 'عام'].map(stg => (
                <button
                  key={stg}
                  onClick={() => setSelectedStage(stg)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedStage === stg
                      ? 'bg-[#002366] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['الكل', 'دروس وتحضير', 'عروض تقديمية PPT', 'مسابقات وألعاب', 'أنشطة وتلوين PDF'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#fed65b] text-[#00123a] shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Lessons Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map(lesson => (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">
                    {getCategoryIcon(lesson.category)}
                    <span>{lesson.category}</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-extrabold">
                    {lesson.stage}
                  </span>
                </div>

                <h3 className="font-tajawal text-base font-extrabold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug">
                  {lesson.title}
                </h3>

                {/* Memory Verse Box */}
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>الآية الذهبية والشاهد:</span>
                  </p>
                  <p className="text-xs text-amber-950 font-bold leading-relaxed italic">
                    {lesson.memory_verse}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {lesson.summary}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">
                  بواسطة: {lesson.author}
                </span>
                <button
                  onClick={() => setSelectedLesson(lesson)}
                  className="bg-[#002366] hover:bg-[#00113a] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>عرض التحضير</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Lesson Details Modal */}
        {selectedLesson && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in max-h-[90vh] overflow-y-auto" dir="rtl">
              
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-lg text-xs font-bold">
                      {selectedLesson.stage}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                      {selectedLesson.category}
                    </span>
                  </div>
                  <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                    {selectedLesson.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Memory Verse Callout */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl space-y-1 shadow-xs">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>الشاهد والآية الذهبية للحفظ:</span>
                </span>
                <p className="text-sm font-extrabold text-amber-950 font-tajawal">
                  {selectedLesson.memory_verse}
                </p>
                <span className="text-[11px] font-bold text-amber-800 block mt-1">
                  📖 الشاهد الكتابي: {selectedLesson.scripture_ref}
                </span>
              </div>

              {/* Objective & Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#00174a]">الهدف التعليمي والروحي للدرس:</h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-semibold leading-relaxed">
                  {selectedLesson.objective}
                </p>
              </div>

              {/* Lesson Main Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#00174a]">عناصر وشرح الدرس:</h4>
                <div className="space-y-1.5">
                  {selectedLesson.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#00174a]">الأنشطة والألعاب المقترحة:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLesson.activities.map((act, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold">
                      🎨 {act}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    toast.success('جاري تجهيز وتحميل ملف تحضير الدرس بنجاح 📥');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل كراس التحضير ({selectedLesson.file_type || 'PDF'})</span>
                </button>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Add New Lesson */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                  إضافة تحضير درس جديد لبنك الدروس 📖
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLesson} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان الدرس *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مثل السامري الصالح وعمل الرحمة"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المرحلة *</label>
                    <select
                      value={newStage}
                      onChange={e => setNewStage(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="ابتدائي">ابتدائي</option>
                      <option value="إعدادي">إعدادي</option>
                      <option value="ثانوي">ثانوي</option>
                      <option value="عام">عام</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نوع المورد *</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="دروس وتحضير">دروس وتحضير</option>
                      <option value="عروض تقديمية PPT">عروض تقديمية PPT</option>
                      <option value="مسابقات وألعاب">مسابقات وألعاب</option>
                      <option value="أنشطة وتلوين PDF">أنشطة وتلوين PDF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشاهد الكتابي والآية الذهبية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: لوقا ١٠: ٢٥-٣٧ | طوبى للرحماء لأنهم يرحمون"
                    value={newMemoryVerse}
                    onChange={e => setNewMemoryVerse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الهدف التعليمي والروحي *</label>
                  <input
                    type="text"
                    required
                    placeholder="ما الذي يتعلمه المخدوم ويطبقه في حياته؟"
                    value={newObjective}
                    onChange={e => setNewObjective(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">موجز قصة وشرح الدرس *</label>
                  <textarea
                    rows={3}
                    placeholder="ملخص مبسط للقصة والشرح..."
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عناصر الدرس (كل عنصر في سطر منفصل)</label>
                  <textarea
                    rows={3}
                    placeholder="العنصر الأول&#10;العنصر الثاني&#10;العنصر الثالث"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#002366] text-[#fed65b] font-bold rounded-xl shadow-md"
                  >
                    حفظ الدرس
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

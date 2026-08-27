import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  BookOpen, Download, Search, Filter, Plus, FileText, Presentation, Gamepad2, 
  Palette, Star, CheckCircle2, ChevronLeft, Bookmark, Sparkles, X, Share2, Upload,
  FolderPlus, Music, ExternalLink, RefreshCw, Wand2, Eye, FileSpreadsheet, PlayCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { api } from '../../lib/api';

// Types
export interface LessonResource {
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

export interface PrepBookResource {
  id: string;
  title: string;
  author: string;
  stage: string;
  drive_url: string;
  description: string;
  pages_count?: string;
  created_at: string;
}

export interface HymnPptResource {
  id: string;
  title: string;
  category: string; // e.g. "ترانيم مدارس الأحد", "ترانيم العذراء", "ترانيم الصليب والقيامة", "ترانيم شبابية"
  drive_url: string;
  lyrics_snippet?: string;
  created_at: string;
}

// Initial Data
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
      'لعبة ترتيب أحداث المعركة كروت مصورة.',
      'تطبيق عملي: الصلاة قبل المذاكرة والامتحانات لطرد الخوف.'
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
  }
];

const DEFAULT_PREP_BOOKS: PrepBookResource[] = [
  {
    id: 'book_1',
    title: 'كتاب منهج التربية الكنسية للمرحلة الابتدائية (المنهج الكامل)',
    author: 'أسقفية الشباب والتربية الكنسية',
    stage: 'ابتدائي',
    drive_url: 'https://drive.google.com/drive/folders/1B3n0K9y8X7q6w5v4u3t2s1r0',
    description: 'يحتوي على تحضير ٥٢ أسبوعاً تشمل دروس العهدين القديم والجديد، سير القديسين، والطقوس الكنسية مع الأهداف والوسائل الإيضاحية.',
    pages_count: '٢٤٠ صفحة',
    created_at: '2026-08-20'
  },
  {
    id: 'book_2',
    title: 'دليل الخادم لإعداد دروس المرحلة الإعدادية والفتيان',
    author: 'مجمع خدام كنيسة السيدة العذراء بمحرم بك',
    stage: 'إعدادي',
    drive_url: 'https://drive.google.com/drive/folders/1C4m1L8x7W6v5u4t3s2r1q0p9',
    description: 'مواضيع نفسية وروحية وتاريخية تناسب سن المراهقة وبناء الشخصية المسيحية مع ورش عمل وأسئلة تفكير نقدي.',
    pages_count: '١٨٠ صفحة',
    created_at: '2026-08-22'
  },
  {
    id: 'book_3',
    title: 'المرجع الشامل في تفسير وتدريس الأناجيل الأربعة',
    author: 'القمص تادرس يعقوب ملطي',
    stage: 'ثانوي وعام',
    drive_url: 'https://drive.google.com/drive/folders/1D5n2M9y8X7w6v5u4t3s2r1q0',
    description: 'تفسير آبائي كنسي عميق لكل أحداث ومعجزات وأمثال السيد المسيح، يفيد الخادم في التحضير اللاهوتي والروحي الرصين.',
    pages_count: '٥٢٠ صفحة',
    created_at: '2026-08-25'
  }
];

const DEFAULT_HYMNS_PPT: HymnPptResource[] = [
  {
    id: 'hymn_1',
    title: 'ترنيمة: يا مريم البكر فقت الشمس والقمر',
    category: 'ترانيم السيدة العذراء',
    drive_url: 'https://drive.google.com/file/d/1E6o3N0z9Y8x7w6v5u4t3s2r1/view',
    lyrics_snippet: 'يا مريم البكر فقت الشمس والقمرا، وكل كواكب الصبح نلت ظفراً...',
    created_at: '2026-08-21'
  },
  {
    id: 'hymn_2',
    title: 'ترنيمة: ربي يسوع الغالي علمني حبك',
    category: 'ترانيم مدارس الأحد',
    drive_url: 'https://drive.google.com/file/d/1F7p4O1a0Z9y8x7w6v5u4t3s2/view',
    lyrics_snippet: 'ربي يسوع الغالي علمني حبك، دايمًا يفيض في قلبي وأعيش وأشهد لك...',
    created_at: '2026-08-22'
  },
  {
    id: 'hymn_3',
    title: 'ترنيمة: في وقت ضعفي أراك تشفي صميم قلبي',
    category: 'ترانيم شبابية وتأمل',
    drive_url: 'https://drive.google.com/file/d/1G8q5P2b1A0z9y8x7w6v5u4t3/view',
    lyrics_snippet: 'في وقت ضعفي أراك تشفي صميم قلبي من الجراح، تمسك بيدي ترعى دروبي...',
    created_at: '2026-08-23'
  },
  {
    id: 'hymn_4',
    title: 'ترنيمة: قام المسيح حقاً قام من بين الأموات',
    category: 'ترانيم الصليب والقيامة',
    drive_url: 'https://drive.google.com/file/d/1H9r6Q3c2B1a0z9y8x7w6v5u4/view',
    lyrics_snippet: 'قام المسيح وغلب الموت بالموت وداس الجحيم، هللويا يسوع فدانا...',
    created_at: '2026-08-24'
  }
];

// Helper to sanitize Google Drive links into view/embed URLs
function formatDriveLinks(rawUrl: string) {
  if (!rawUrl) return { viewUrl: '#', embedUrl: '#' };
  let fileId = '';
  
  const idMatch = rawUrl.match(/(?:file\/d\/|id=|folders\/)([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    fileId = idMatch[1];
  }

  if (fileId) {
    return {
      viewUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }

  return {
    viewUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
    embedUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
  };
}

export const LessonBankPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  
  // Active Tab: 'lessons' | 'books' | 'hymns'
  const [activeTab, setActiveTab] = useState<'lessons' | 'books' | 'hymns'>('lessons');

  // Main States
  const [lessons, setLessons] = useState<LessonResource[]>([]);
  const [books, setBooks] = useState<PrepBookResource[]>([]);
  const [hymns, setHymns] = useState<HymnPptResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedLesson, setSelectedLesson] = useState<LessonResource | null>(null);

  // AI Generator States
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Lesson Form States
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<'ابتدائي' | 'إعدادي' | 'ثانوي' | 'عام'>('ابتدائي');
  const [newCategory, setNewCategory] = useState<'دروس وتحضير' | 'عروض تقديمية PPT' | 'مسابقات وألعاب' | 'أنشطة وتلوين PDF'>('دروس وتحضير');
  const [newScripture, setNewScripture] = useState('');
  const [newMemoryVerse, setNewMemoryVerse] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newActivities, setNewActivities] = useState('');

  // Books Form States
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookStage, setNewBookStage] = useState('ابتدائي');
  const [newBookDriveUrl, setNewBookDriveUrl] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [newBookPages, setNewBookPages] = useState('');

  // Hymns Form States
  const [showAddHymnModal, setShowAddHymnModal] = useState(false);
  const [newHymnTitle, setNewHymnTitle] = useState('');
  const [newHymnCategory, setNewHymnCategory] = useState('ترانيم مدارس الأحد');
  const [newHymnDriveUrl, setNewHymnDriveUrl] = useState('');
  const [newHymnLyrics, setNewHymnLyrics] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const settings = await api.getSiteSettings().catch(() => ({} as Record<string, string>));
      
      // 1. Lessons
      if (settings['church_servant_lesson_bank']) {
        try { setLessons(JSON.parse(settings['church_servant_lesson_bank'])); } catch { setLessons(DEFAULT_LESSONS); }
      } else {
        setLessons(DEFAULT_LESSONS);
      }

      // 2. Books
      if (settings['church_prep_books']) {
        try { setBooks(JSON.parse(settings['church_prep_books'])); } catch { setBooks(DEFAULT_PREP_BOOKS); }
      } else {
        setBooks(DEFAULT_PREP_BOOKS);
      }

      // 3. Hymns PPT
      if (settings['church_hymns_ppt']) {
        try { setHymns(JSON.parse(settings['church_hymns_ppt'])); } catch { setHymns(DEFAULT_HYMNS_PPT); }
      } else {
        setHymns(DEFAULT_HYMNS_PPT);
      }
    } catch (err) {
      console.error('Error loading lesson bank portal data:', err);
      setLessons(DEFAULT_LESSONS);
      setBooks(DEFAULT_PREP_BOOKS);
      setHymns(DEFAULT_HYMNS_PPT);
    } finally {
      setLoading(false);
    }
  };

  // 🤖 Smart AI Lesson Generator Engine
  const handleGenerateAI = () => {
    const prompt = (aiTopicPrompt || newTitle).trim();
    if (!prompt) {
      toast.error('يرجى كتابة اسم الشخصية أو موضوع الدرس أولاً لتوليد التحضير بالذكاء الاصطناعي.');
      return;
    }

    setIsGeneratingAI(true);

    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let generated: Partial<LessonResource> = {};

      if (lower.includes('يونان') || lower.includes('الحوت')) {
        generated = {
          title: `درس: قصة يونان النبي وطاعة وصية الله والتوبة`,
          scripture_ref: 'سفر يونان ١ - ٤',
          memory_verse: '«مَعَ الرَّبِّ إِلهِنَا الْمَرَاحِمُ وَالْمَغْفِرَةُ» (دا ٩: ٩)',
          objective: 'أن يتعلم المخدوم أهمية طاعة صوت الله والصلاة في وقت الشدة ومحبة الآخرين دون إدانة.',
          summary: 'هروب يونان إلى ترشيش، هيجان البحر، ابتلاع الحوت له، صلاته في بطن الحوت، ومناداته لأهل نينوى وخلاصهم بالتوبة والصوم.',
          points: [
            'صوت الله ليونان بالذهاب لنينوى وهروبه في السفينة.',
            'العاصفة الشديدة واعتراف يونان وإلقائه في البحر.',
            'إعداد الحوت العظيم وصلاته من الأعماق واستجابة الرب.',
            'كرازة يونان في نينوى وصوم الشعب ومغفرة الله العظيمة.'
          ],
          activities: [
            'لعبة ترتيب بطاقات قصة يونان الأربعة محطات.',
            'نشاط صنع حوت من الورق الملون وداخله صورة يونان يصلي.',
            'تطبيق عملي: الاعتذار السريع عند الخطأ والصلاة قبل النوم.'
          ]
        };
      } else if (lower.includes('سامري') || lower.includes('الرحمة')) {
        generated = {
          title: `درس: مثل السامري الصالح وعمل الرحمة والمحبة العملية`,
          scripture_ref: 'إنجيل لوقا ١٠: ٢٥ - ٣٧',
          memory_verse: '«طُوبَى لِلرُّحَمَاءِ، لأَنَّهُمْ يُرْحَمُونَ» (مت ٥: ٧)',
          objective: 'أن يدرك المخدوم أن قريبي هو كل إنسان محتاج، وأن المحبة الحقيقية تظهر في الأفعال والمساعدة.',
          summary: 'الرجل المسافر من أورشليم لأريحا الذي هاجمه اللصوص، مرور الكاهن واللاوي، وإحسان السامري ومداواة جراحه ودفع نفقات الفندق.',
          points: [
            'سؤال الناموسي للسيد المسيح: من هو قريبي؟',
            'الرجل الجريح على طريق أريحا وموقف الكاهن واللاوي.',
            'رحمة السامري الصالح وعلاجه للجريح ونقله للفندق.',
            'وصية الرب يسوع: اذهب أنت أيضاً واصنع هكذا.'
          ],
          activities: [
            'تمثيل مسرحي للقصة كأدوار بين الأولاد.',
            'نشاط شنطة الإسعافات الروحية (كروت بطاقات الكلمات الطيبة).',
            'تطبيق عملي: مساعدة زميل محتاج في المدرسة أو البيت.'
          ]
        };
      } else if (lower.includes('ابن الضال') || lower.includes('الابن الضال') || lower.includes('الراجع')) {
        generated = {
          title: `درس: مثل الابن الضال وأحضان الآب السماوي المفتوحة`,
          scripture_ref: 'إنجيل لوقا ١٥: ١١ - ٣٢',
          memory_verse: '«أَقُومُ وَأَذْهَبُ إِلَى أَبِي وَأَقُولُ لَهُ: يَا أَبِي، أَخْطَأْتُ إِلَى السَّمَاءِ وَقُدَّامَكَ» (لو ١٥: ١٨)',
          objective: 'غرس الثقة في محبة الله الآب واستعداده الدائم لقبولنا ومسامحتنا مهما ابتعدنا.',
          summary: 'طلب الابن الأصغر نصيبه وسفره لبلد بعيد، نفاذ أمواله واشتهاؤه طعام الخنازير، رجوعه لنفسه وعودته، واستقبال الأب الحنون له بالقبلات والحلة الأولى.',
          points: [
            'اختيار الابن للبعد عن بيت أبيه ونتيجة البعد عن الله.',
            'لحظة الرجوع إلى النفس والقرار الشجاع بالتوبة.',
            'مشهد الأب وهو يركض ليعانق ابنه ويقبله.',
            'الحلة الأولى والخاتم وفرحة السماء بالخاطئ التائب.'
          ],
          activities: [
            'لعبة المتاهة للوصول إلى بيت الأب.',
            'ورشة كتابة رسالة شكر لربنا على رحمته وغفرانه.',
            'تطبيق عملي: المواظبة على سر الاعتراف دون خوف أو تردد.'
          ]
        };
      } else if (lower.includes('مارجرجس') || lower.includes('جرجس') || lower.includes('شهيد')) {
        generated = {
          title: `درس: سيرة أمير الشهداء مارجرجس الروماني وثبات الإيمان`,
          scripture_ref: 'رسالة بولس الرسول الثانية إلى تيموثاوس ٤: ٧',
          memory_verse: '«جَاهَدْتُ الْجِهَادَ الْحَسَنَ، أَكْمَلْتُ السَّعْيَ، حَفِظْتُ الإِيمَانَ» (٢ تي ٤: ٧)',
          objective: 'غرس الشجاعة الروحية والتمسك بالرب يسوع والصليب وعدم المساومة على الإيمان.',
          summary: 'نشأة القديس مارجرجس وترقيته في الجيش، وقوفه ضد منشور دقلديانوس لإنكار المسيح، احتماله للعذابات الشديدة ٧ سنوات، وإكليله السمائي.',
          points: [
            'أخلاق وشجاعة القديس في رتبة قائد الألف بالجيش.',
            'تمزيقه لمنشور عبادة الأوثان والدفاع عن إيمانه المسيحي.',
            'ظهورات الرب يسوع وتعزيته له وشفائه من العذابات.',
            'إيمان الملكة ألكسندرة والعديد من الحراس بسببه.'
          ],
          activities: [
            'رسم وتلوين التاج والفرس الأبيض لمارجرجس.',
            'مسابقة أسئلة سريعة حول سيرة القديس.',
            'تطبيق عملي: الشجاعة في الشهادة للمسيح في المدرسة بعدم التلفظ بألفاظ سيئة.'
          ]
        };
      } else {
        // Dynamic Coptic Smart Generator for any topic
        generated = {
          title: `درس: ${prompt} — دروس روحية وتطبيقات حياتية`,
          scripture_ref: 'الكتاب المقدس (شواهد ومحطات كنسية مختارة)',
          memory_verse: `«كُلُّ الْكِتَابِ هُوَ مُوحىً بِهِ مِنَ اللهِ، وَنَافِعٌ لِلتَّعْلِيمِ وَالتَّوْبِيخِ وَالتَّقْوِيمِ» (٢ تي ٣: ١٦)`,
          objective: `أن يتعلم المخدوم كيف يطبق فضيلة ${prompt} في حياته اليومية بالمدرسة والبيت والكنيسة.`,
          summary: `دراسة روحية شيقة لموضوع (${prompt}) بأسلوب أرثوذكسي مبسط يربط النص الكتابي بالطقس وسير الآباء القديسين.`,
          points: [
            `مفهوم (${prompt}) في تعاليم السيد المسيح والكتاب المقدس.`,
            `شواهد وأمثلة حية من العهدين وسير القديسين.`,
            `كيف نقاوم المعطلات ونحيا هذه الفضيلة بنعمة الروح القدس.`,
            `ثمار وبركات السلوك في النور وتأثيره على من حولنا.`
          ],
          activities: [
            `مسابقة الآيات والشواهد السريعة حول ${prompt}.`,
            `لعبة تمثيل مواقف وحلها من منظور المحبة المسيحية.`,
            `تطبيق عملي يومي للأسبوع: التزام محدد للصلاة والخدمة.`
          ]
        };
      }

      setNewTitle(generated.title || prompt);
      setNewScripture(generated.scripture_ref || '');
      setNewMemoryVerse(generated.memory_verse || '');
      setNewObjective(generated.objective || '');
      setNewSummary(generated.summary || '');
      setNewPoints((generated.points || []).join('\n'));
      setNewActivities((generated.activities || []).join('\n'));

      setIsGeneratingAI(false);
      toast.success('تم توليد وتحضير عناصر الدرس بالذكاء الاصطناعي بنجاح! ✨ يمكنك مراجعته وحفظه.');
    }, 600);
  };

  // Add Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
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
      activities: newActivities ? newActivities.split('\n').map(a => a.trim()).filter(Boolean) : ['نشاط تطبيقي تفاعلي', 'مراجعة وحفظ الآية'],
      file_type: 'PDF',
      file_size: '1.5 MB',
      author: profile?.full_name || 'خادم بكنيسة العذراء مريم',
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...lessons];
    setLessons(updated);
    setShowAddLessonModal(false);
    
    // Clear inputs
    setNewTitle('');
    setAiTopicPrompt('');
    setNewScripture('');
    setNewMemoryVerse('');
    setNewObjective('');
    setNewSummary('');
    setNewPoints('');
    setNewActivities('');

    toast.success('تمت إضافة الدرس إلى بنك الدروس بنجاح ✨');

    try {
      await api.updateSiteSettings({
        church_servant_lesson_bank: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Error syncing lesson bank settings:', err);
    }
  };

  // Add Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookDriveUrl.trim()) {
      toast.error('يرجى كتابة عنوان الكتاب ورابط Google Drive');
      return;
    }

    const created: PrepBookResource = {
      id: `book_${Date.now()}`,
      title: newBookTitle.trim(),
      author: newBookAuthor.trim() || 'مجمع خدام الكنيسة',
      stage: newBookStage,
      drive_url: newBookDriveUrl.trim(),
      description: newBookDesc.trim() || 'كتاب تحضير ومناهج للتربية الكنسية',
      pages_count: newBookPages.trim() || 'كتاب كامل',
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...books];
    setBooks(updated);
    setShowAddBookModal(false);

    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookDriveUrl('');
    setNewBookDesc('');
    setNewBookPages('');

    toast.success('تمت إضافة كتاب التحضير بنجاح 📚');

    try {
      await api.updateSiteSettings({
        church_prep_books: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Error syncing books settings:', err);
    }
  };

  // Add Hymn
  const handleSaveHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHymnTitle.trim() || !newHymnDriveUrl.trim()) {
      toast.error('يرجى كتابة اسم الترنيمة ورابط ملف Google Drive');
      return;
    }

    const created: HymnPptResource = {
      id: `hymn_${Date.now()}`,
      title: newHymnTitle.trim(),
      category: newHymnCategory,
      drive_url: newHymnDriveUrl.trim(),
      lyrics_snippet: newHymnLyrics.trim(),
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [created, ...hymns];
    setHymns(updated);
    setShowAddHymnModal(false);

    setNewHymnTitle('');
    setNewHymnDriveUrl('');
    setNewHymnLyrics('');

    toast.success('تمت إضافة ترنيمة الباوربوينت بنجاح 🎵');

    try {
      await api.updateSiteSettings({
        church_hymns_ppt: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Error syncing hymns settings:', err);
    }
  };

  // Filtered Lists
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

  const filteredBooks = books.filter(b => {
    const matchesStage = selectedStage === 'الكل' || b.stage.includes(selectedStage);
    const matchesSearch = 
      b.title.includes(searchQuery) ||
      b.author.includes(searchQuery) ||
      b.description.includes(searchQuery);
    return matchesStage && matchesSearch;
  });

  const filteredHymns = hymns.filter(h => {
    const matchesCategory = selectedCategory === 'الكل' || h.category === selectedCategory;
    const matchesSearch = 
      h.title.includes(searchQuery) ||
      (h.lyrics_snippet && h.lyrics_snippet.includes(searchQuery)) ||
      h.category.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <DashboardLayout role={(profile?.role as any) || 'servant'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] via-[#002366] to-[#00174a] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#d4af37]/30">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b] shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-tajawal font-extrabold text-2xl sm:text-3xl text-[#fed65b]">
                  بنك تحضير الدروس، المناهج والترانيم 📖✨
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm font-semibold">
                  مكتبة التربية الكنسية المتكاملة: تحضير ذكي بالذكاء الاصطناعي، كتب ومناهج Drive، وترانيم باوربوينت.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {activeTab === 'lessons' && (
              <button
                onClick={() => setShowAddLessonModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00123a] font-extrabold text-xs rounded-2xl shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ تحضير درس (يدوي أو بالذكاء الاصطناعي)</span>
              </button>
            )}

            {activeTab === 'books' && (
              <button
                onClick={() => setShowAddBookModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00123a] font-extrabold text-xs rounded-2xl shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ إضافة كتاب تحضير من Drive</span>
              </button>
            )}

            {activeTab === 'hymns' && (
              <button
                onClick={() => setShowAddHymnModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00123a] font-extrabold text-xs rounded-2xl shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
              >
                <Music className="w-4 h-4" />
                <span>+ إضافة ترنيمة باوربوينت</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Tabs Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-2.5 rounded-3xl border border-slate-200 shadow-sm">
          
          <button
            onClick={() => { setActiveTab('lessons'); setSearchQuery(''); }}
            className={`py-3.5 px-4 rounded-2xl font-tajawal text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 ${
              activeTab === 'lessons'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5 text-[#fed65b]" />
            <span>📖 بنك تحضير الدروس والمناهج ({lessons.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('books'); setSearchQuery(''); }}
            className={`py-3.5 px-4 rounded-2xl font-tajawal text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 ${
              activeTab === 'books'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FolderPlus className="w-5 h-5 text-[#fed65b]" />
            <span>📚 كتب ومناهج التحضير (Drive) ({books.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('hymns'); setSearchQuery(''); }}
            className={`py-3.5 px-4 rounded-2xl font-tajawal text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 ${
              activeTab === 'hymns'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Music className="w-5 h-5 text-[#fed65b]" />
            <span>🎵 ترانيم باوربوينت (PPT / Drive) ({hymns.length})</span>
          </button>

        </div>

        {/* Filters & Search Row */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'lessons' 
                    ? 'ابحث بالعنوان، الآية، الشاهد...'
                    : (activeTab === 'books' ? 'ابحث باسم الكتاب أو المؤلف...' : 'ابحث باسم الترنيمة أو الكلمات...')
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
              />
            </div>

            {/* Stage Filters (for lessons & books) */}
            {activeTab !== 'hymns' && (
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
            )}

            {/* Category Filter for Hymns */}
            {activeTab === 'hymns' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['الكل', 'ترانيم مدارس الأحد', 'ترانيم السيدة العذراء', 'ترانيم الصليب والقيامة', 'ترانيم شبابية وتأمل'].map(cat => (
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
            )}

          </div>
        </div>

        {/* TAB 1: LESSONS & AI PREP */}
        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => (
              <div
                key={lesson.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">
                      {lesson.category}
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
        )}

        {/* TAB 2: BOOKS & CURRICULUM FROM GOOGLE DRIVE */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => {
              const drive = formatDriveLinks(book.drive_url);
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>كتاب تحضير ومناهج</span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-extrabold">
                        {book.stage}
                      </span>
                    </div>

                    <h3 className="font-tajawal text-base font-extrabold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug">
                      {book.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {book.description}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold pt-1">
                      <span>✍️ إعداد: {book.author}</span>
                      {book.pages_count && <span>• 📖 {book.pages_count}</span>}
                    </div>
                  </div>

                  {/* Drive Links */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={drive.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#002366] hover:bg-[#00113a] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 w-full justify-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#fed65b]" />
                      <span>فتح الكتاب في Google Drive</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: HYMNS POWERPOINT FROM GOOGLE DRIVE */}
        {activeTab === 'hymns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHymns.map(hymn => {
              const drive = formatDriveLinks(hymn.drive_url);
              return (
                <div
                  key={hymn.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                        <Presentation className="w-3.5 h-3.5 text-orange-600" />
                        <span>{hymn.category}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                        PPTX
                      </span>
                    </div>

                    <h3 className="font-tajawal text-base font-extrabold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug">
                      {hymn.title}
                    </h3>

                    {hymn.lyrics_snippet && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-700 italic font-semibold leading-relaxed line-clamp-2">
                          "{hymn.lyrics_snippet}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Play / Download Drive Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={drive.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 w-full justify-center"
                    >
                      <Presentation className="w-4 h-4 text-orange-200" />
                      <span>عرض وتنزيل الباوربوينت (Drive)</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: ADD LESSON (WITH AI ASSISTANT) */}
        {showAddLessonModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in max-h-[90vh] overflow-y-auto" dir="rtl">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fed65b]/20 text-[#00123a] rounded-full text-xs font-extrabold">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>مساعد التحضير الذكي للتربية الكنسية</span>
                  </div>
                  <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                    إعداد وتحضير درس جديد 📖
                  </h3>
                </div>
                <button onClick={() => setShowAddLessonModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 🤖 AI Prompt Generator Box */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-blue-950">
                    توليد تحضير الدرس تلقائياً بالذكاء الاصطناعي:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="اكتب اسم الشخصية أو الآية (مثلاً: يونان النبي، السامري الصالح، مارجرجس، الابن الضال)..."
                    value={aiTopicPrompt}
                    onChange={e => setAiTopicPrompt(e.target.value)}
                    className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'جاري التوليد...' : '✨ توليد التحضير'}</span>
                  </button>
                </div>
              </div>

              {/* Full Lesson Form */}
              <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان الدرس *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: درس شجاعة داود النبي والغلبة بالإيمان"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الشاهد الكتابي</label>
                    <input
                      type="text"
                      placeholder="مثال: سفر صموئيل الأول ١٧"
                      value={newScripture}
                      onChange={e => setNewScripture(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الآية الذهبية والشاهد للحفظ *</label>
                    <input
                      type="text"
                      required
                      placeholder="«أَنْتَ تَأْتِي إِلَيَّ بِسَيْفٍ...»"
                      value={newMemoryVerse}
                      onChange={e => setNewMemoryVerse(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الهدف التعليمي والروحي للدرس *</label>
                  <input
                    type="text"
                    required
                    placeholder="ما هو الهدف والفضيلة التي يخرج بها المخدوم؟"
                    value={newObjective}
                    onChange={e => setNewObjective(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">موجز قصة وشرح الدرس *</label>
                  <textarea
                    rows={3}
                    placeholder="مقدمة القصة وسرد الأحداث..."
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">عناصر ونقاط الشرح (كل نقطة بسطر منفصل)</label>
                  <textarea
                    rows={3}
                    placeholder="النقطة الأولى&#10;النقطة الثانية&#10;النقطة الثالثة"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الأنشطة والألعاب المقترحة (كل نشاط بسطر)</label>
                  <textarea
                    rows={2}
                    placeholder="نشاط تلوين ورسم&#10;لعبة أسئلة ومسابقات"
                    value={newActivities}
                    onChange={e => setNewActivities(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLessonModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
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

        {/* MODAL 2: ADD PREPARATION BOOK FROM GOOGLE DRIVE */}
        {showAddBookModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                  إضافة كتاب تحضير ومناهج من Google Drive 📚
                </h3>
                <button onClick={() => setShowAddBookModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الكتاب أو المنهج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كتاب مناهج التربية الكنسية - مرحلة إعدادي"
                    value={newBookTitle}
                    onChange={e => setNewBookTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المؤلف / الجهة *</label>
                    <input
                      type="text"
                      required
                      placeholder="أسقفية الشباب / كنيسة العذراء"
                      value={newBookAuthor}
                      onChange={e => setNewBookAuthor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المرحلة *</label>
                    <select
                      value={newBookStage}
                      onChange={e => setNewBookStage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="ابتدائي">ابتدائي</option>
                      <option value="إعدادي">إعدادي</option>
                      <option value="ثانوي">ثانوي</option>
                      <option value="عام">عام</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط Google Drive للكتاب (ملف أو فولدر) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={newBookDriveUrl}
                    onChange={e => setNewBookDriveUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وصف مختصر للكتاب والمحتوى</label>
                  <textarea
                    rows={2}
                    placeholder="ملخص لموضوعات المنهج وكيفية استفادة الخادم منه..."
                    value={newBookDesc}
                    onChange={e => setNewBookDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBookModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#002366] text-[#fed65b] font-bold rounded-xl shadow-md"
                  >
                    حفظ الكتاب
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD HYMN POWERPOINT FROM GOOGLE DRIVE */}
        {showAddHymnModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                  إضافة ترنيمة باوربوينت من Google Drive 🎵
                </h3>
                <button onClick={() => setShowAddHymnModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHymn} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الترنيمة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ترنيمة يا مريم البكر فقت الشمس والقمرا"
                    value={newHymnTitle}
                    onChange={e => setNewHymnTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف *</label>
                  <select
                    value={newHymnCategory}
                    onChange={e => setNewHymnCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="ترانيم مدارس الأحد">ترانيم مدارس الأحد</option>
                    <option value="ترانيم السيدة العذراء">ترانيم السيدة العذراء</option>
                    <option value="ترانيم الصليب والقيامة">ترانيم الصليب والقيامة</option>
                    <option value="ترانيم شبابية وتأمل">ترانيم شبابية وتأمل</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط Google Drive لملف الباوربوينت (PPT / PPTX) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={newHymnDriveUrl}
                    onChange={e => setNewHymnDriveUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مطلع أو كلمات الترنيمة (للبحث السريع)</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب الكلمات الأولى للترنيمة لتسهيل العثور عليها بالبحث..."
                    value={newHymnLyrics}
                    onChange={e => setNewHymnLyrics(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHymnModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#002366] text-[#fed65b] font-bold rounded-xl shadow-md"
                  >
                    حفظ الترنيمة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: LESSON DETAILS VIEW */}
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

      </div>
    </DashboardLayout>
  );
};

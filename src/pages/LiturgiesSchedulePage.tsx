import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { api, Liturgy } from '../lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  User,
  ChevronRight,
  ChevronLeft,
  Sun,
  Layers,
  CalendarDays,
  Users,
  GraduationCap,
  Heart,
  Baby,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Search,
  BookOpen,
  HeartHandshake,
  LayoutList,
  Grid,
  Sparkle,
  BookmarkCheck
} from 'lucide-react';
import { getCopticDate } from '../lib/copticReadings';
import { type DayOfWeekArabic } from '../lib/attendanceStatusHelper';

export const PRIEST_NAMES_LIST = [
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه'
];

export interface ChurchServiceDisplayItem {
  id: string;
  name: string;
  category: string;
  day: DayOfWeekArabic;
  startTime24: string; // for strict chronological sorting (e.g. "07:00", "09:00", "11:00", "12:00", "14:30", "16:30", "17:00", "18:00", "19:00", "19:30", "20:00")
  formattedTime: string;
  targetStage: string;
  periodicity: string;
  iconType: 'youth_boys' | 'youth_girls' | 'kids_boys' | 'kids_girls' | 'prep_boys' | 'prep_girls' | 'family' | 'men' | 'women' | 'graduates' | 'bible' | 'servants' | 'special_needs' | 'general' | 'care';
  iconBg: string;
  iconText: string;
  badgeBg: string;
}

export const FIXED_CHURCH_SERVICES: ChurchServiceDisplayItem[] = [
  // ===================== الجمعة =====================
  {
    id: 'fri_1',
    name: 'خدمة ثانوي بنين',
    category: 'شباب ثانوي',
    day: 'الجمعة',
    startTime24: '09:00',
    formattedTime: '٩:٠٠ ص',
    targetStage: 'شباب المرحلة الثانوية (بنين)',
    periodicity: 'أسبوعي',
    iconType: 'youth_boys',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-900',
    badgeBg: 'bg-blue-50 text-blue-900 border-blue-200'
  },
  {
    id: 'fri_2',
    name: 'خدمة ابتدائي بنات',
    category: 'ابتدائي بنات',
    day: 'الجمعة',
    startTime24: '11:00',
    formattedTime: '١١:٠٠ ص',
    targetStage: 'فتيات المرحلة الابتدائية (من الصف الأول للسادس)',
    periodicity: 'أسبوعي',
    iconType: 'kids_girls',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-900',
    badgeBg: 'bg-rose-50 text-rose-900 border-rose-200'
  },
  {
    id: 'fri_3',
    name: 'خدمة إعدادي بنات',
    category: 'فتيات إعدادي',
    day: 'الجمعة',
    startTime24: '12:00',
    formattedTime: '١٢:٠٠ ظهراً - ٢:٠٠ م',
    targetStage: 'فتيات المرحلة الإعدادية (أولى - ثانية - ثالثة إعدادي)',
    periodicity: 'أسبوعي',
    iconType: 'prep_girls',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-900',
    badgeBg: 'bg-purple-50 text-purple-900 border-purple-200'
  },
  {
    id: 'fri_4',
    name: 'خدمة ابتدائي بنين',
    category: 'ابتدائي بنين',
    day: 'الجمعة',
    startTime24: '14:30',
    formattedTime: '٢:٣٠ م',
    targetStage: 'بنين المرحلة الابتدائية (من الصف الأول للسادس)',
    periodicity: 'أسبوعي',
    iconType: 'kids_boys',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-900',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  {
    id: 'fri_5',
    name: 'خدمة إعدادي بنين',
    category: 'فتيان إعدادي',
    day: 'الجمعة',
    startTime24: '16:30',
    formattedTime: '٤:٣٠ م',
    targetStage: 'فتيان المرحلة الإعدادية (أولى - ثانية - ثالثة إعدادي)',
    periodicity: 'أسبوعي',
    iconType: 'prep_boys',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-900',
    badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-200'
  },
  {
    id: 'fri_6',
    name: 'إجتماع الرجال',
    category: 'اجتماع عام',
    day: 'الجمعة',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م',
    targetStage: 'رجال وأرباب الأسر بالكنيسة',
    periodicity: 'أسبوعي',
    iconType: 'men',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-900',
    badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200'
  },
  {
    id: 'fri_7',
    name: 'اجتماع لمسة حب (حديثي الزواج)',
    category: 'رعاية الأسرة',
    day: 'الجمعة',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م',
    targetStage: 'المتزوجون حديثاً والمقبلون على الزواج',
    periodicity: 'الجمعة الأولى من كل شهر',
    iconType: 'family',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-900',
    badgeBg: 'bg-pink-50 text-pink-900 border-pink-200'
  },

  // ===================== السبت =====================
  {
    id: 'sat_1',
    name: 'خدمة الأرامل',
    category: 'خدمة ورعاية',
    day: 'السبت',
    startTime24: '07:00',
    formattedTime: '٧:٠٠ ص (بالقداس الإلهي)',
    targetStage: 'أمهاتنا وأخواتنا الأرامل',
    periodicity: 'السبت الأول من كل شهر',
    iconType: 'care',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-900',
    badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  },
  {
    id: 'sat_2',
    name: 'خدمة المرضى',
    category: 'خدمة ورعاية',
    day: 'السبت',
    startTime24: '07:00',
    formattedTime: '٧:٠٠ ص (بالقداس الإلهي)',
    targetStage: 'المرضى وأسرهم وبركة الصلاة من أجل شفائهم',
    periodicity: 'السبت الثاني من كل شهر',
    iconType: 'care',
    iconBg: 'bg-teal-100',
    iconText: 'text-teal-900',
    badgeBg: 'bg-teal-50 text-teal-900 border-teal-200'
  },

  // ===================== الأحد =====================
  {
    id: 'sun_1',
    name: 'خدمة ذوي الهمم (بنات)',
    category: 'ذوي القدرات والهمم',
    day: 'الأحد',
    startTime24: '17:00',
    formattedTime: '٥:٠٠ م',
    targetStage: 'بنات وفتيات ذوي القدرات والهمم المباركة',
    periodicity: 'أسبوعي',
    iconType: 'special_needs',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-900',
    badgeBg: 'bg-violet-50 text-violet-900 border-violet-200'
  },
  {
    id: 'sun_2',
    name: 'اجتماع الخريجين',
    category: 'خريجين ومهنيين',
    day: 'الأحد',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م',
    targetStage: 'الخريجين والخريجات والشباب المهنيين وسوق العمل',
    periodicity: 'أسبوعي',
    iconType: 'graduates',
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-900',
    badgeBg: 'bg-sky-50 text-sky-900 border-sky-200'
  },
  {
    id: 'sun_3',
    name: 'خدمة يسوع بيحبك',
    category: 'رعاية وافتقاد',
    day: 'الأحد',
    startTime24: '20:00',
    formattedTime: '٨:٠٠ م',
    targetStage: 'اجتماع عام للرعاية والافتقاد الروحي لجميع الأعمار',
    periodicity: 'أسبوعي',
    iconType: 'general',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-900',
    badgeBg: 'bg-rose-50 text-rose-900 border-rose-200'
  },

  // ===================== الإثنين =====================
  {
    id: 'mon_1',
    name: 'خدمة ذوي الهمم (بنين)',
    category: 'ذوي القدرات والهمم',
    day: 'الإثنين',
    startTime24: '17:00',
    formattedTime: '٥:٠٠ م',
    targetStage: 'بنين وفتيان ذوي القدرات والهمم المباركة',
    periodicity: 'أسبوعي',
    iconType: 'special_needs',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-900',
    badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-200'
  },
  {
    id: 'mon_2',
    name: 'إعداد خدام',
    category: 'إعداد وتدريب',
    day: 'الإثنين',
    startTime24: '18:00',
    formattedTime: '٦:٠٠ م',
    targetStage: 'الخدام والدارسون بكورسات إعداد الخدام',
    periodicity: 'أسبوعي',
    iconType: 'servants',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-900',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  {
    id: 'mon_3',
    name: 'درس الكتاب المقدس',
    category: 'دراسة كتاب',
    day: 'الإثنين',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م',
    targetStage: 'دراسة وتأمل في أسفار الكتاب المقدس لعموم الشعب',
    periodicity: 'أسبوعي',
    iconType: 'bible',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-900',
    badgeBg: 'bg-blue-50 text-blue-900 border-blue-200'
  },

  // ===================== الثلاثاء =====================
  {
    id: 'tue_1',
    name: 'إعداد خدام',
    category: 'إعداد وتدريب',
    day: 'الثلاثاء',
    startTime24: '18:00',
    formattedTime: '٦:٠٠ م',
    targetStage: 'الخدام والدارسون بكورسات إعداد الخدام',
    periodicity: 'أسبوعي',
    iconType: 'servants',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-900',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  {
    id: 'tue_2',
    name: 'خدمة شباب جامعة',
    category: 'شباب جامعة',
    day: 'الثلاثاء',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م',
    targetStage: 'الشباب والطلبة الجامعيين',
    periodicity: 'أسبوعي',
    iconType: 'youth_boys',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-900',
    badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200'
  },

  // ===================== الأربعاء =====================
  {
    id: 'wed_1',
    name: 'اجتماع السيدات',
    category: 'اجتماع عام',
    day: 'الأربعاء',
    startTime24: '17:00',
    formattedTime: '٥:٠٠ م',
    targetStage: 'أمهات وسيدات الكنيسة',
    periodicity: 'أسبوعي',
    iconType: 'women',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-900',
    badgeBg: 'bg-pink-50 text-pink-900 border-pink-200'
  },
  {
    id: 'wed_2',
    name: 'خدمة عرس قانا الجليل',
    category: 'رعاية الأسرة',
    day: 'الأربعاء',
    startTime24: '19:00',
    formattedTime: '٧:٠٠ م - ٩:٠٠ م',
    targetStage: 'المتزوجون والأسر الشابة والمقبلون على الزواج',
    periodicity: 'أسبوعي',
    iconType: 'family',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-900',
    badgeBg: 'bg-rose-50 text-rose-900 border-rose-200'
  },

  // ===================== الخميس =====================
  {
    id: 'thu_1',
    name: 'خدمة ثانوي بنات',
    category: 'شابات ثانوي',
    day: 'الخميس',
    startTime24: '17:00',
    formattedTime: '٥:٠٠ م',
    targetStage: 'شابات المرحلة الثانوية (بنات)',
    periodicity: 'أسبوعي',
    iconType: 'youth_girls',
    iconBg: 'bg-pink-100',
    iconText: 'text-pink-900',
    badgeBg: 'bg-pink-50 text-pink-900 border-pink-200'
  },
  {
    id: 'thu_2',
    name: 'خدمة شابات جامعة',
    category: 'شابات جامعة',
    day: 'الخميس',
    startTime24: '19:30',
    formattedTime: '٧:٣٠ م',
    targetStage: 'الشابات والطالبات الجامعيات والخريجات',
    periodicity: 'أسبوعي',
    iconType: 'youth_girls',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-900',
    badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200'
  }
];

export const LiturgiesSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'liturgies' | 'services'>('liturgies');
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceDay, setSelectedServiceDay] = useState<string>('الكل');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');
  const [serviceViewMode, setServiceViewMode] = useState<'table' | 'cards'>('table');

  const DAYS_OF_WEEK: DayOfWeekArabic[] = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const SERVICES_DAYS_ORDER: DayOfWeekArabic[] = ['الجمعة', 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthName = useMemo(() => {
    return now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [now]);

  const todayFullDate = useMemo(() => {
    const coptic = getCopticDate(now);
    const gregorian = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return {
      gregorian,
      coptic: coptic.copticDateString,
      dayName: now.toLocaleDateString('ar-EG', { weekday: 'long' }),
      dayNumber: now.getDate()
    };
  }, [now]);

  // Generate Weeks strictly for Current Month
  const currentMonthWeeks = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeks = [];

    let currentDay = 1;
    let weekIndex = 1;

    while (currentDay <= totalDays) {
      const startDay = currentDay;
      const endDay = Math.min(currentDay + 6, totalDays);
      const days = [];

      for (let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        const matchedDayName = DAYS_OF_WEEK.find(x => dayName.includes(x)) || 'الأحد';
        const isToday = now.getDate() === d;
        const coptic = getCopticDate(dateObj);

        days.push({
          dayNumber: d,
          dateObj,
          dayName,
          matchedDayName,
          isToday,
          copticString: coptic.copticDateString
        });
      }

      const containsToday = now.getDate() >= startDay && now.getDate() <= endDay;

      weeks.push({
        weekIndex,
        label: `الأسبوع ${weekIndex === 1 ? 'الأول' : weekIndex === 2 ? 'الثاني' : weekIndex === 3 ? 'الثالث' : weekIndex === 4 ? 'الرابع' : 'الخامس'}`,
        rangeString: `${startDay} - ${endDay} ${now.toLocaleDateString('ar-EG', { month: 'long' })}`,
        startDay,
        endDay,
        containsToday,
        days
      });

      currentDay += 7;
      weekIndex++;
    }

    return weeks;
  }, [currentYear, currentMonth, now]);

  // Default active week is the week that contains today
  const initialWeekIndex = useMemo(() => {
    const foundIdx = currentMonthWeeks.findIndex(w => w.containsToday);
    return foundIdx !== -1 ? foundIdx : 0;
  }, [currentMonthWeeks]);

  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(initialWeekIndex);

  useEffect(() => {
    setActiveWeekIndex(initialWeekIndex);
  }, [initialWeekIndex]);

  const fetchLiturgies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLiturgies();
      setLiturgies(data);
    } catch (err: any) {
      console.error(err);
      setError('فشل تحميل جدول القداسات الكنسي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiturgies();
  }, []);

  const formatArabicTime = (time: string) => {
    if (!time) return '';
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const suffix = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutesStr} ${suffix}`;
  };

  // Helper to extract multiple priest names from notes
  const extractPriestNames = (liturgy: Liturgy): string[] => {
    if (!liturgy.notes) return ['آباء الكنيسة'];
    const matched: string[] = [];

    for (const p of PRIEST_NAMES_LIST) {
      if (liturgy.notes.includes(p) && !matched.includes(p)) {
        matched.push(p);
      }
    }

    if (matched.length > 0) return matched;

    const match = liturgy.notes.match(/(?:الكهنة|الكاهن(?:\s*المصلي)?[:\s]+)?([^|]+)/);
    if (match) {
      const names = match[1].split(/[،,•]/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) return names;
    }

    return [liturgy.notes.trim() || 'آباء الكنيسة'];
  };

  // Grouped by Day of Week
  const groupedLiturgies = useMemo(() => {
    const groups: Record<string, Liturgy[]> = {};
    DAYS_OF_WEEK.forEach(d => {
      groups[d] = liturgies
        .filter(l => l.liturgy_day === d)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [liturgies]);

  // Group services by day in exact chronological order from morning to night
  const groupedServicesByDay = useMemo(() => {
    const query = serviceSearchQuery.trim().toLowerCase();
    const filtered = FIXED_CHURCH_SERVICES.filter(s => {
      const matchesDay = selectedServiceDay === 'الكل' || s.day === selectedServiceDay;
      const matchesQuery = !query || 
        s.name.toLowerCase().includes(query) || 
        s.category.toLowerCase().includes(query) ||
        s.targetStage.toLowerCase().includes(query) ||
        s.periodicity.toLowerCase().includes(query) ||
        s.day.includes(query);
      return matchesDay && matchesQuery;
    });

    const groups: { day: DayOfWeekArabic; services: ChurchServiceDisplayItem[] }[] = [];
    const daysToInclude = selectedServiceDay === 'الكل' ? SERVICES_DAYS_ORDER : [selectedServiceDay];

    daysToInclude.forEach(d => {
      const dayServices = filtered
        .filter(s => s.day === d)
        .sort((a, b) => a.startTime24.localeCompare(b.startTime24));
      
      if (dayServices.length > 0) {
        groups.push({
          day: d as DayOfWeekArabic,
          services: dayServices
        });
      }
    });

    return groups;
  }, [selectedServiceDay, serviceSearchQuery]);

  const getServiceIcon = (iconType: string) => {
    switch (iconType) {
      case 'bible': return <BookOpen className="w-5 h-5" />;
      case 'family': return <HeartHandshake className="w-5 h-5" />;
      case 'servants': return <GraduationCap className="w-5 h-5" />;
      case 'special_needs': return <Smile className="w-5 h-5" />;
      case 'care': return <ShieldCheck className="w-5 h-5" />;
      case 'kids_boys':
      case 'kids_girls': return <Baby className="w-5 h-5" />;
      case 'graduates': return <GraduationCap className="w-5 h-5" />;
      case 'general': return <Heart className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const currentWeek = currentMonthWeeks[activeWeekIndex] || currentMonthWeeks[0];

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-10 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>{`مواعيد القداسات والخدمات الأسبوعية`} | كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content={`جدول مواعيد قداسات واجتماعات خدمات كنيسة السيدة العذراء بمحرم بك بالإسكندرية لشهر ${currentMonthName}.`} />
        <link rel="canonical" href="https://www.tibarthenos.com/schedule" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Header Card (Month + Today's Date) */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-xl space-y-4 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
            <span>جدول المواعيد الطقسية والرعوية الموحد</span>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold text-[#fed65b] leading-tight">
            جدول قداسات واجتماعات خدمات الكنيسة
          </h1>

          {/* Today Date Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-xs sm:text-sm font-bold">
            <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-slate-100 shadow-sm">
              <Sun className="w-4 h-4 text-[#fed65b]" />
              <span>تاريخ اليوم: {todayFullDate.gregorian}</span>
            </span>
            <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-[#fed65b] shadow-sm">
              <Calendar className="w-4 h-4" />
              <span>{todayFullDate.coptic}</span>
            </span>
          </div>
        </div>

        {/* 🎛️ Main Navigation Tabs: Liturgies vs Church Services */}
        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-2">
          <button
            onClick={() => setActiveTab('liturgies')}
            className={`flex-1 py-3 px-4 rounded-2xl font-tajawal text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'liturgies'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>⛪ جدول القداسات الإلهية (شهر {now.toLocaleDateString('ar-EG', { month: 'long' })})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 px-4 rounded-2xl font-tajawal text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'services'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📅 مواعيد اجتماعات وخدمات الكنيسة الأسبوعية (١٠ خدمات)</span>
          </button>
        </div>

        {/* ⛪ TAB 1: LITURGIES SCHEDULE */}
        {activeTab === 'liturgies' && (
          <div className="space-y-6">
            {/* Weekly Navigation Selector Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveWeekIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeWeekIndex === 0}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الأسبوع السابق</span>
                </button>

                <div className="text-center">
                  <span className="font-tajawal text-base font-extrabold text-[#002366] block">
                    {currentWeek?.label} ({currentWeek?.rangeString})
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">
                    شهر {currentMonthName} فقط
                  </span>
                </div>

                <button
                  onClick={() => setActiveWeekIndex(prev => Math.min(currentMonthWeeks.length - 1, prev + 1))}
                  disabled={activeWeekIndex === currentMonthWeeks.length - 1}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 active:scale-95"
                >
                  <span>الأسبوع التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Week Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
                {currentMonthWeeks.map((w, idx) => (
                  <button
                    key={w.weekIndex}
                    onClick={() => setActiveWeekIndex(idx)}
                    className={`py-2.5 px-3 rounded-2xl flex flex-col items-center gap-0.5 transition-all text-xs font-bold border ${
                      activeWeekIndex === idx
                        ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md scale-[1.02]'
                        : w.containsToday
                        ? 'bg-amber-50/70 text-[#00174a] border-amber-300 hover:bg-amber-100/60'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{w.label}</span>
                      {w.containsToday && (
                        <span className="w-2 h-2 rounded-full bg-[#d4af37]" title="الأسبوع الحالي" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold opacity-80">
                      {w.startDay} - {w.endDay}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Section: The Whole Week Displayed Together */}
            {loading ? (
              <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-sm max-w-xl mx-auto">
                <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">جاري تحميل وتنسيق جدول القداسات...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-3xl p-12 border border-rose-200 text-center space-y-4 max-w-lg mx-auto">
                <p className="text-xs font-bold text-rose-600">{error}</p>
                <button
                  onClick={fetchLiturgies}
                  className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs py-2.5 px-6 rounded-xl transition-all"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {currentWeek?.days.map(dayItem => {
                  const dayLiturgies = groupedLiturgies[dayItem.matchedDayName] || [];

                  return (
                    <div
                      key={dayItem.dayNumber}
                      className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm ${
                        dayItem.isToday
                          ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                        
                        {/* Day & Date Header Block */}
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-sm shrink-0 border ${
                            dayItem.isToday
                              ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md'
                              : 'bg-slate-50 text-slate-800 border-slate-200'
                          }`}>
                            <span className="text-lg font-extrabold">{dayItem.dayNumber}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{dayItem.dayName}</span>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className="font-tajawal text-base font-extrabold text-[#002366]">
                                {dayItem.dayName} {dayItem.dayNumber} {now.toLocaleDateString('ar-EG', { month: 'long' })}
                              </h3>
                              {dayItem.isToday && (
                                <span className="text-[10px] bg-[#d4af37] text-[#00174a] px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                                  اليوم ☀️
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold">
                              {dayItem.copticString}
                            </p>
                          </div>
                        </div>

                        {/* Liturgies for this Day */}
                        <div className="flex-1 w-full">
                          {dayLiturgies.length === 0 ? (
                            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-center">
                              <span className="text-xs text-slate-400 font-bold">لا توجد قداسات مقررة في هذا اليوم</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {dayLiturgies.map(l => {
                                const priestNames = extractPriestNames(l);

                                return (
                                  <div
                                    key={l.id}
                                    className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl space-y-2.5 hover:bg-slate-50 transition-colors shadow-sm"
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-tajawal text-sm font-extrabold text-[#002366]">
                                        {l.title}
                                      </span>
                                      <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                                        <span>{formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}</span>
                                      </span>
                                    </div>

                                    {/* Priest Names Badge */}
                                    <div className="bg-white border border-amber-200/80 p-2.5 rounded-xl flex items-start gap-2 shadow-2xs">
                                      <div className="w-6 h-6 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                        <User className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold">
                                          {priestNames.length > 1 ? 'الكهنة المصلون:' : 'الكاهن المصلي:'}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {priestNames.map((p, idx) => (
                                           <span
                                              key={idx}
                                              className="bg-amber-50 text-[#00174a] border border-amber-200 px-2 py-0.5 rounded-md font-tajawal text-xs font-extrabold"
                                            >
                                              {p}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Location */}
                                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-0.5">
                                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                      <span>{l.church_name} • {l.altar_name}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 📅 TAB 2: FIXED CHURCH SERVICES & MEETINGS SCHEDULE */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Toolbar: Search + Days Filter + View Toggle */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              
              {/* Search Bar & View Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    placeholder="ابحث عن خدمة، اجتماع، مرحلة، أو يوم (مثال: ثانوي، إعداد خدام، ذوي الهمم)..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#002366] focus:bg-white transition-all"
                  />
                  {serviceSearchQuery && (
                    <button
                      onClick={() => setServiceSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* View Switcher: Table vs Cards */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 shrink-0 self-center">
                  <button
                    onClick={() => setServiceViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      serviceViewMode === 'table'
                        ? 'bg-[#002366] text-[#fed65b] shadow-sm shadow-[#002366]/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>جدول منظم</span>
                  </button>
                  <button
                    onClick={() => setServiceViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      serviceViewMode === 'cards'
                        ? 'bg-[#002366] text-[#fed65b] shadow-sm shadow-[#002366]/20'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>كروت</span>
                  </button>
                </div>
              </div>

              {/* Days Filter Pills */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-400 block">تصفية حسب اليوم:</span>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['الكل', ...SERVICES_DAYS_ORDER].map(day => {
                    const count = day === 'الكل'
                      ? FIXED_CHURCH_SERVICES.length
                      : FIXED_CHURCH_SERVICES.filter(s => s.day === day).length;
                    const isSelected = selectedServiceDay === day;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedServiceDay(day)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20 ring-2 ring-[#002366]/30'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{day}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSelected ? 'bg-[#fed65b] text-[#00174a]' : 'bg-slate-200/70 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Content: When no services match filter/search */}
            {groupedServicesByDay.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-tajawal text-lg font-bold text-slate-800">لا توجد خدمات مطابقة لخيارات البحث</h3>
                <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                  جرب البحث بكلمات أخرى أو اختر "الكل" لعرض جميع مواعيد خدمات واجتماعات الكنيسة.
                </p>
                <button
                  onClick={() => { setSelectedServiceDay('الكل'); setServiceSearchQuery(''); }}
                  className="bg-[#002366] text-[#fed65b] text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-[#00174a] transition-all"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              /* Grouped Days List (Chronological from morning to night) */
              <div className="space-y-6">
                {groupedServicesByDay.map(group => (
                  <div
                    key={group.day}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    
                    {/* Day Header Banner */}
                    <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#001f5c] text-white px-5 sm:px-6 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#fed65b]/20 border border-[#fed65b]/40 text-[#fed65b] flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#fed65b]">
                            يوم {group.day}
                          </h2>
                        </div>
                      </div>
                      
                      <span className="bg-white/10 text-slate-100 text-xs font-extrabold px-3 py-1 rounded-full border border-white/15">
                        {group.services.length} {group.services.length === 1 ? 'خدمة' : group.services.length === 2 ? 'خدمتان' : 'خدمات واجتماعات'}
                      </span>
                    </div>

                    {/* TABLE VIEW: Clean, Readable, Comfortable Grid Table */}
                    {serviceViewMode === 'table' ? (
                      <div className="divide-y divide-slate-100">
                        
                        {/* Table Header (Hidden on small mobile for responsive flow) */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[11px] font-extrabold text-slate-500 border-b border-slate-200">
                          <div className="col-span-4 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>الميعاد والتوقيت</span>
                          </div>
                          <div className="col-span-5">الخدمة / الاجتماع</div>
                          <div className="col-span-3 text-left">دورية الخدمة</div>
                        </div>

                        {/* Chronological Table Rows */}
                        {group.services.map((service, idx) => (
                          <div
                            key={service.id}
                            className={`p-4 sm:px-6 sm:py-4 transition-colors hover:bg-slate-50/80 flex flex-col md:grid md:grid-cols-12 gap-3 md:items-center ${
                              idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            }`}
                          >
                            
                            {/* Col 1: Time */}
                            <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-2">
                              <div className="inline-flex items-center gap-2 bg-[#002366]/5 border border-[#002366]/15 text-[#002366] px-3.5 py-1.5 rounded-xl font-tajawal text-xs sm:text-sm font-extrabold shadow-2xs">
                                <Clock className="w-4 h-4 text-[#d4af37] shrink-0" />
                                <span>{service.formattedTime}</span>
                              </div>
                              <span className="md:hidden text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600">
                                {service.periodicity}
                              </span>
                            </div>

                            {/* Col 2: Service Title + Icon + Category Badge */}
                            <div className="md:col-span-5 flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl ${service.iconBg} ${service.iconText} flex items-center justify-center shrink-0 font-bold shadow-2xs`}>
                                {getServiceIcon(service.iconType)}
                              </div>
                              <div className="space-y-0.5">
                                <h3 className="font-tajawal text-sm sm:text-base font-extrabold text-[#00174a] leading-tight">
                                  {service.name}
                                </h3>
                                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${service.badgeBg}`}>
                                  {service.category}
                                </span>
                              </div>
                            </div>

                            {/* Col 3: Periodicity (Desktop) */}
                            <div className="hidden md:flex md:col-span-3 justify-end">
                              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                                service.periodicity === 'أسبوعي'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {service.periodicity === 'أسبوعي' ? '✦ خدمة أسبوعية منتظمة' : service.periodicity}
                              </span>
                            </div>

                          </div>
                        ))}

                      </div>
                    ) : (
                      /* CARDS VIEW: Responsive visual grid for the day */
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/50">
                        {group.services.map(service => (
                          <div
                            key={service.id}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-[#002366] transition-all space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              
                              {/* Header: Title + Time */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-11 h-11 rounded-2xl ${service.iconBg} ${service.iconText} flex items-center justify-center shrink-0 font-bold shadow-2xs`}>
                                    {getServiceIcon(service.iconType)}
                                  </div>
                                  <div>
                                    <h3 className="font-tajawal text-sm sm:text-base font-extrabold text-[#00174a]">
                                      {service.name}
                                    </h3>
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border mt-1 ${service.badgeBg}`}>
                                      {service.category}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-[#002366] text-[#fed65b] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{service.formattedTime}</span>
                                </div>
                              </div>

                            </div>

                            {/* Footer periodicity */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-500 font-tajawal">كنيسة السيدة العذراء بمحرم بك</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                service.periodicity === 'أسبوعي'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {service.periodicity === 'أسبوعي' ? '✦ أسبوعي' : service.periodicity}
                              </span>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

            {/* Note & Footer guidance */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 p-5 rounded-3xl text-center space-y-2 shadow-xs">
              <p className="font-tajawal text-sm font-extrabold text-[#00174a]">
                ✝️ جميع اجتماعات وخدمات الكنيسة ترحب بجميع المخدومين والمخدومات
              </p>
              <p className="text-xs text-slate-600 font-semibold max-w-xl mx-auto leading-relaxed">
                لأي استفسار أو رغبة في الاشتراك أو الانضمام لإحدى الخدمات، يُسعدنا تواصلكم مع الآباء الكهنة أو أمناء الخدمة بكنيسة السيدة العذراء مريم بمحرم بك.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

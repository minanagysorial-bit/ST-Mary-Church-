import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
  Edit,
  User,
  CheckCircle2,
  Check,
  Sun,
  Lock,
  Flame,
  Mic,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  CalendarRange,
  Table as TableIcon,
  LayoutGrid,
  Star,
  BookmarkCheck,
  Award
} from 'lucide-react';
import { api, Liturgy } from '../../lib/api';
import { getCopticDate } from '../../lib/copticReadings';

export const PRIEST_NAMES_LIST = [
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه'
];

export const OFFICIAL_ALTAR_CHOICES = [
  { label: 'الكنيسة الكبيرة - مذبح العذراء', church: 'الكنيسة الكبيرة', altar: 'مذبح العذراء' },
  { label: 'الكنيسة الكبيرة - مذبح مارمينا', church: 'الكنيسة الكبيرة', altar: 'مذبح مارمينا' },
  { label: 'الكنيسة الكبيرة - مذبح مارمرقس', church: 'الكنيسة الكبيرة', altar: 'مذبح مارمرقس' },
  { label: 'كنيسة الملاك - مذبح الملاك ميخائيل', church: 'كنيسة الملاك', altar: 'مذبح الملاك ميخائيل' },
  { label: 'كنيسة الانبا انطونيوس - مذبح الانبا انطونيوس', church: 'كنيسة الانبا انطونيوس', altar: 'مذبح الانبا انطونيوس' },
];

export const FIXED_WEEKDAY_LITURGIES = [
  {
    day: 'الاثنين',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا ميخائيل ميخائيل']
  },
  {
    day: 'الثلاثاء',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا مرقس ميلاد', 'ابونا موسى وجيه']
  },
  {
    day: 'الأربعاء',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا بيشوي ثابت']
  },
  {
    day: 'الخميس',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا مينا نادر']
  }
];

export interface ParsedLiturgyInfo {
  priests: string[];
  hasSermon: boolean;
  sermonSpeaker: string;
  sermonTopic?: string;
  weekScope: 'all' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'specific_date' | string;
  specificDate?: string;
  isSpecialOccasion: boolean;
  occasionTitle?: string;
  extraNotes: string;
}

export const parseLiturgyNotes = (notes: string | null | undefined): ParsedLiturgyInfo => {
  if (!notes) {
    return {
      priests: ['آباء الكنيسة'],
      hasSermon: false,
      sermonSpeaker: '',
      sermonTopic: '',
      weekScope: 'all',
      isSpecialOccasion: false,
      occasionTitle: '',
      extraNotes: '',
    };
  }

  let hasSermon = false;
  let sermonSpeaker = '';
  let sermonTopic = '';
  let weekScope: ParsedLiturgyInfo['weekScope'] = 'all';
  let specificDate = '';
  let isSpecialOccasion = false;
  let occasionTitle = '';

  // Week scope parsing
  if (notes.includes('الأسبوع: الأول') || notes.includes('الأسبوع الأول')) weekScope = 'week_1';
  else if (notes.includes('الأسبوع: الثاني') || notes.includes('الأسبوع الثاني')) weekScope = 'week_2';
  else if (notes.includes('الأسبوع: الثالث') || notes.includes('الأسبوع الثالث')) weekScope = 'week_3';
  else if (notes.includes('الأسبوع: الرابع') || notes.includes('الأسبوع الرابع')) weekScope = 'week_4';
  else if (notes.includes('الأسبوع: الخامس') || notes.includes('الأسبوع الخامس')) weekScope = 'week_5';
  
  const dateMatch = notes.match(/تاريخ[:\s]+(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    weekScope = 'specific_date';
    specificDate = dateMatch[1];
  }

  // Special Occasion / Feast Parsing
  const occasionMatch = notes.match(/(?:مناسبة|مناسبة طقسية|عيد)[:\s]+([^|()]+)/);
  if (occasionMatch) {
    isSpecialOccasion = true;
    occasionTitle = occasionMatch[1].trim();
  } else if (notes.includes('نيروز') || notes.includes('النيروز') || notes.includes('صليب') || notes.includes('الصليب') || notes.includes('عيد')) {
    isSpecialOccasion = true;
    if (notes.includes('نيروز') || notes.includes('النيروز')) occasionTitle = 'عيد النيروز المجيد (رأس السنة القبطية)';
    else if (notes.includes('صليب') || notes.includes('الصليب')) occasionTitle = 'عيد الصليب المجيد';
    else occasionTitle = 'مناسبة طقسية خاصة';
  }

  // Sermon parsing
  const sermonMatch = notes.match(/(?:العظة|ملقي العظة|واعظ القداس|واعظ العشية)[:\s]+([^|()]+)(?:\(([^)]+)\))?/);
  if (sermonMatch) {
    hasSermon = true;
    sermonSpeaker = sermonMatch[1].trim();
    if (sermonMatch[2]) {
      sermonTopic = sermonMatch[2].trim();
    }
  }

  // Priests parsing with strict click order preservation
  const priests: string[] = [];
  const priestMatch = notes.match(/(?:الكهنة المصلون|الكاهن المصلي|الكهنة|الكاهن)[:\s]+([^|]+)/);
  
  if (priestMatch) {
    const rawNames = priestMatch[1].split(/[•،,]/).map(s => s.trim()).filter(Boolean);
    for (const name of rawNames) {
      if (name && !priests.includes(name)) {
        priests.push(name);
      }
    }
  } else {
    // Fallback: look for priests by their character index in the notes string
    const foundWithIndex: { name: string; idx: number }[] = [];
    for (const p of PRIEST_NAMES_LIST) {
      const idx = notes.indexOf(p);
      if (idx !== -1) {
        foundWithIndex.push({ name: p, idx });
      }
    }
    foundWithIndex.sort((a, b) => a.idx - b.idx);
    for (const item of foundWithIndex) {
      if (!priests.includes(item.name)) {
        priests.push(item.name);
      }
    }
  }

  if (priests.length === 0) {
    priests.push('آباء الكنيسة');
  }

  let cleanExtra = notes;
  if (sermonMatch) cleanExtra = cleanExtra.replace(sermonMatch[0], '');
  if (dateMatch) cleanExtra = cleanExtra.replace(dateMatch[0], '');
  if (occasionMatch) cleanExtra = cleanExtra.replace(occasionMatch[0], '');
  cleanExtra = cleanExtra.replace(/الأسبوع[:\s]+[^\s|]+/g, '');
  PRIEST_NAMES_LIST.forEach(p => {
    cleanExtra = cleanExtra.replace(new RegExp(`(?:الكهنة|الكاهن(?:\\s*المصلي)?[:\\s]+)?${p}`, 'g'), '');
  });
  cleanExtra = cleanExtra.replace(/\|/g, '').replace(/الكهنة المصلون[:\s]*/g, '').replace(/الكاهن المصلي[:\s]*/g, '').trim();

  return {
    priests,
    hasSermon,
    sermonSpeaker,
    sermonTopic,
    weekScope,
    specificDate,
    isSpecialOccasion,
    occasionTitle,
    extraNotes: cleanExtra,
  };
};

export const PriestLiturgiesPage: React.FC = () => {
  const { profile } = useAuth();
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View Mode: 'table' (الجدول المريح) vs 'cards' (الكروت)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Month Switcher: 0 = current month, 1 = next month, etc.
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const activeDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const currentYear = activeDate.getFullYear();
  const currentMonth = activeDate.getMonth();
  const monthName = useMemo(() => {
    return activeDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [activeDate]);

  // Generate All Weeks of the Selected Month (الأسبوع 1، 2، 3، 4، 5)
  const monthWeeks = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weeks = [];
    const now = new Date();

    let currentDay = 1;
    let weekIndex = 1;

    while (currentDay <= totalDays) {
      const startDay = currentDay;
      const endDay = Math.min(currentDay + 6, totalDays);
      const days = [];

      for (let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
        const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === d;
        const coptic = getCopticDate(dateObj);

        days.push({
          dayNumber: d,
          dateObj,
          dayName,
          dateStr: `${d} ${dateObj.toLocaleDateString('ar-EG', { month: 'long' })}`,
          fullDateText: `${d} ${dateObj.toLocaleDateString('ar-EG', { month: 'long' })} / ${coptic.copticDay} ${coptic.copticMonthName}`,
          isToday,
          copticString: coptic.copticDateString
        });
      }

      const containsToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() >= startDay && now.getDate() <= endDay;

      weeks.push({
        weekIndex,
        key: `week_${weekIndex}` as ParsedLiturgyInfo['weekScope'],
        label: `الأسبوع ${weekIndex === 1 ? 'الأول' : weekIndex === 2 ? 'الثاني' : weekIndex === 3 ? 'الثالث' : weekIndex === 4 ? 'الرابع' : 'الخامس'}`,
        rangeString: `${startDay} - ${endDay} ${activeDate.toLocaleDateString('ar-EG', { month: 'long' })}`,
        startDay,
        endDay,
        containsToday,
        days
      });

      currentDay += 7;
      weekIndex++;
    }

    return weeks;
  }, [currentYear, currentMonth, activeDate]);

  // Active Week Filter: 'all' (الشهر كاملاً) or week index (0, 1, 2, 3, 4)
  const [selectedWeekTab, setSelectedWeekTab] = useState<'all' | number>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLiturgyId, setEditingLiturgyId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('القداس الأول');
  const [serviceType, setServiceType] = useState<'liturgy' | 'vespers'>('liturgy');
  const [day, setDay] = useState('الجمعة');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  
  // Altar & Church Choice
  const [selectedAltarOption, setSelectedAltarOption] = useState('الكنيسة الكبيرة - مذبح العذراء');
  const [isCustomAltar, setIsCustomAltar] = useState(false);
  const [customChurchName, setCustomChurchName] = useState('');
  const [customAltarName, setCustomAltarName] = useState('');
  
  // Multi-priest selection with strict click-order preservation
  const [selectedPriests, setSelectedPriests] = useState<string[]>(['ابونا مرقس ميلاد']);
  const [customPriestName, setCustomPriestName] = useState('');

  // 🎤 SERMON (العظة)
  const [hasSermon, setHasSermon] = useState(false);
  const [sermonSpeaker, setSermonSpeaker] = useState('ابونا مرقس ميلاد');
  const [customSermonSpeaker, setCustomSermonSpeaker] = useState('');
  const [sermonTopic, setSermonTopic] = useState('');

  // 🌟 Special Occasion / Feast (مناسبة طقسية / عيد مثل عيد النيروز)
  const [isSpecialOccasion, setIsSpecialOccasion] = useState(false);
  const [occasionTitle, setOccasionTitle] = useState('عيد النيروز المجيد');

  // Week scope
  const [formWeekScope, setFormWeekScope] = useState<ParsedLiturgyInfo['weekScope']>('all');

  const [extraNotes, setExtraNotes] = useState('');

  const ALL_DAYS_ORDER = ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  // Current Live Date
  const today = new Date();
  const todayFullDate = useMemo(() => {
    const greg = today.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cop = getCopticDate(today);
    return {
      gregorian: greg,
      coptic: `${cop.copticDay} ${cop.copticMonthName} ${cop.copticYear} ش`
    };
  }, []);

  const fetchLiturgies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLiturgies();
      setLiturgies(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل جدول القداسات.');
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

  // Toggle priest preserving the exact click order
  const togglePriest = (name: string) => {
    if (selectedPriests.includes(name)) {
      if (selectedPriests.length === 1 && !customPriestName.trim()) return;
      setSelectedPriests(prev => prev.filter(p => p !== name));
    } else {
      // Append strictly at the end of the clicked order
      setSelectedPriests(prev => [...prev, name]);
    }
  };

  const openAddModal = (
    defaultType: 'liturgy' | 'vespers' = 'liturgy',
    defaultDay: string = 'الجمعة',
    defaultWeek: ParsedLiturgyInfo['weekScope'] = 'all',
    prefillOccasion?: { title: string; occasionName: string }
  ) => {
    setEditingLiturgyId(null);
    setServiceType(defaultType);
    setTitle(prefillOccasion ? prefillOccasion.title : (defaultType === 'vespers' ? 'صلاة العشية والتمجيد' : 'القداس الأول'));
    setDay(defaultDay);
    setStartTime(defaultType === 'vespers' ? '18:30' : '07:00');
    setEndTime(defaultType === 'vespers' ? '20:30' : '09:00');
    setSelectedAltarOption('الكنيسة الكبيرة - مذبح العذراء');
    setIsCustomAltar(false);
    setCustomChurchName('');
    setCustomAltarName('');
    setSelectedPriests(['ابونا مرقس ميلاد']);
    setCustomPriestName('');
    
    setHasSermon(false);
    setSermonSpeaker('ابونا مرقس ميلاد');
    setCustomSermonSpeaker('');
    setSermonTopic('');

    if (prefillOccasion) {
      setIsSpecialOccasion(true);
      setOccasionTitle(prefillOccasion.occasionName);
    } else {
      setIsSpecialOccasion(false);
      setOccasionTitle('');
    }

    setFormWeekScope(defaultWeek);
    setExtraNotes('');
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (l: Liturgy) => {
    setEditingLiturgyId(l.id);
    setTitle(l.title);
    setDay(l.liturgy_day);
    setStartTime(l.start_time);
    setEndTime(l.end_time);

    const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
    setServiceType(isVesper ? 'vespers' : 'liturgy');

    const matchedOption = OFFICIAL_ALTAR_CHOICES.find(
      opt => opt.church === l.church_name && opt.altar.includes(l.altar_name.replace('مذبح السيدة ', 'مذبح '))
    );

    if (matchedOption) {
      setSelectedAltarOption(matchedOption.label);
      setIsCustomAltar(false);
      setCustomChurchName('');
      setCustomAltarName('');
    } else {
      setSelectedAltarOption('custom');
      setIsCustomAltar(true);
      setCustomChurchName(l.church_name);
      setCustomAltarName(l.altar_name);
    }

    const parsed = parseLiturgyNotes(l.notes);
    const knownInList = parsed.priests.filter(p => PRIEST_NAMES_LIST.includes(p));
    const customInList = parsed.priests.filter(p => !PRIEST_NAMES_LIST.includes(p));

    // Preserve the exact sequence parsed from the notes
    setSelectedPriests(knownInList.length > 0 ? knownInList : ['ابونا مرقس ميلاد']);
    setCustomPriestName(customInList.join('، '));

    if (parsed.hasSermon) {
      setHasSermon(true);
      if (PRIEST_NAMES_LIST.includes(parsed.sermonSpeaker)) {
        setSermonSpeaker(parsed.sermonSpeaker);
        setCustomSermonSpeaker('');
      } else {
        setSermonSpeaker(PRIEST_NAMES_LIST[0]);
        setCustomSermonSpeaker(parsed.sermonSpeaker);
      }
      setSermonTopic(parsed.sermonTopic || '');
    } else {
      setHasSermon(false);
      setSermonSpeaker('ابونا مرقس ميلاد');
      setCustomSermonSpeaker('');
      setSermonTopic('');
    }

    setIsSpecialOccasion(parsed.isSpecialOccasion);
    setOccasionTitle(parsed.occasionTitle || '');

    setFormWeekScope(parsed.weekScope);
    setExtraNotes(parsed.extraNotes);
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalChurchName = '';
    let finalAltarName = '';

    if (isCustomAltar || selectedAltarOption === 'custom') {
      finalChurchName = customChurchName.trim();
      finalAltarName = customAltarName.trim();
    } else {
      const selected = OFFICIAL_ALTAR_CHOICES.find(o => o.label === selectedAltarOption);
      if (selected) {
        finalChurchName = selected.church;
        finalAltarName = selected.altar;
      }
    }

    const allPriests = [...selectedPriests];
    if (customPriestName.trim()) {
      allPriests.push(customPriestName.trim());
    }

    if (!title.trim() || !day || !startTime || !endTime || !finalChurchName || !finalAltarName) {
      setError('يرجى تعبئة كافة الحقول وتحديد الكنيسة والمذبح.');
      return;
    }

    if (allPriests.length === 0) {
      setError('يرجى اختيار كاهن واحد على الأقل للمشاركة في الخدمة.');
      return;
    }

    const priestPrefix = allPriests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
    const parts: string[] = [`${priestPrefix}: ${allPriests.join(' • ')}`];

    // Append Special Occasion / Feast
    if (isSpecialOccasion && occasionTitle.trim()) {
      parts.push(`مناسبة: ${occasionTitle.trim()}`);
    }

    // Append Week Scope if specific week
    if (formWeekScope !== 'all') {
      if (formWeekScope === 'week_1') parts.push('الأسبوع: الأول');
      else if (formWeekScope === 'week_2') parts.push('الأسبوع: الثاني');
      else if (formWeekScope === 'week_3') parts.push('الأسبوع: الثالث');
      else if (formWeekScope === 'week_4') parts.push('الأسبوع: الرابع');
      else if (formWeekScope === 'week_5') parts.push('الأسبوع: الخامس');
    }

    if (hasSermon) {
      const finalSermonSpeaker = customSermonSpeaker.trim() || sermonSpeaker;
      if (finalSermonSpeaker) {
        let sermonText = `العظة: ${finalSermonSpeaker}`;
        if (sermonTopic.trim()) {
          sermonText += ` (${sermonTopic.trim()})`;
        }
        parts.push(sermonText);
      }
    }

    if (extraNotes.trim()) {
      parts.push(extraNotes.trim());
    }

    const combinedNotes = parts.join(' | ');

    try {
      if (editingLiturgyId) {
        await api.updateLiturgy(editingLiturgyId, {
          title: title.trim(),
          liturgy_day: day,
          start_time: startTime,
          end_time: endTime,
          church_name: finalChurchName,
          altar_name: finalAltarName,
          notes: combinedNotes,
        });
        setSuccessMessage('تم تحديث بيانات الخدمة بنجاح!');
      } else {
        await api.createLiturgy({
          title: title.trim(),
          liturgy_day: day,
          start_time: startTime,
          end_time: endTime,
          church_name: finalChurchName,
          altar_name: finalAltarName,
          notes: combinedNotes,
          created_by: null,
        });
        setSuccessMessage('تمت إضافة الخدمة للجدول بنجاح!');
      }

      setShowModal(false);
      fetchLiturgies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ الخدمة.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القداس/الخدمة من الجدول؟')) return;
    setError(null);
    try {
      await api.deleteLiturgy(id);
      setLiturgies(prev => prev.filter(l => l.id !== id));
      setSuccessMessage('تم حذف الخدمة من الجدول.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف الخدمة.');
    }
  };

  // Convert non-fixed liturgy to fixed routine across the whole month
  const handleConvertToFixed = async (l: Liturgy) => {
    const parsed = parseLiturgyNotes(l.notes);
    const priestPrefix = parsed.priests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
    const parts: string[] = [`${priestPrefix}: ${parsed.priests.join(' • ')}`];

    if (parsed.isSpecialOccasion && parsed.occasionTitle) {
      parts.push(`مناسبة: ${parsed.occasionTitle}`);
    }

    if (parsed.hasSermon && parsed.sermonSpeaker) {
      let sText = `العظة: ${parsed.sermonSpeaker}`;
      if (parsed.sermonTopic) sText += ` (${parsed.sermonTopic})`;
      parts.push(sText);
    }

    if (parsed.extraNotes) {
      parts.push(parsed.extraNotes);
    }

    const newNotes = parts.join(' | ');

    try {
      await api.updateLiturgy(l.id, {
        notes: newNotes
      });
      setSuccessMessage(`تم تثبيت قداس "${l.title}" كقداس ثابت طوال الشهر 🔒`);
      fetchLiturgies();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('فشل تثبيت القداس: ' + err.message);
    }
  };

  const handleSyncFixedWeekdays = async () => {
    if (!window.confirm('هل تريد تثبيت ومزامنة قداسات (الاثنين - الثلاثاء - الأربعاء - الخميس) بالمواعيد الرسمية؟')) return;
    setLoading(true);
    try {
      for (const item of FIXED_WEEKDAY_LITURGIES) {
        const priestPrefix = item.priests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
        const notes = `${priestPrefix}: ${item.priests.join(' • ')}`;
        
        const match = liturgies.find(l => l.liturgy_day === item.day && l.church_name === item.church);
        if (match) {
          await api.updateLiturgy(match.id, {
            title: item.title,
            start_time: item.startTime,
            end_time: item.endTime,
            church_name: item.church,
            altar_name: item.altar,
            notes: notes
          });
        } else {
          await api.createLiturgy({
            title: item.title,
            liturgy_day: item.day,
            start_time: item.startTime,
            end_time: item.endTime,
            church_name: item.church,
            altar_name: item.altar,
            notes: notes,
            created_by: null
          });
        }
      }
      setSuccessMessage('تمت مزامنة وتثبيت قداسات الاثنين إلى الخميس بنجاح ⚡');
      fetchLiturgies();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError('حدث خطأ في مزامنة القداسات الثابتة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to filter liturgies for a given week index
  const getLiturgiesForWeek = (wIndex: number) => {
    const targetKey = `week_${wIndex}`;
    return liturgies.filter(l => {
      const parsed = parseLiturgyNotes(l.notes);
      return parsed.weekScope === 'all' || parsed.weekScope === targetKey;
    }).sort((a, b) => {
      const dayDiff = ALL_DAYS_ORDER.indexOf(a.liturgy_day) - ALL_DAYS_ORDER.indexOf(b.liturgy_day);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    });
  };

  // Non-fixed liturgies aggregator across the whole month
  const nonFixedLiturgies = useMemo(() => {
    return liturgies.filter(l => {
      const parsed = parseLiturgyNotes(l.notes);
      return parsed.weekScope !== 'all' && !['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day);
    });
  }, [liturgies]);

  // Weeks to display
  const displayWeeks = useMemo(() => {
    if (selectedWeekTab === 'all') {
      return monthWeeks;
    }
    return [monthWeeks[selectedWeekTab]].filter(Boolean);
  }, [selectedWeekTab, monthWeeks]);

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-6 font-cairo text-right" dir="rtl">
        
        {/* ── 1. HEADER: MONTH SELECTOR & TODAY'S DATE BADGE ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-tajawal text-xl sm:text-2xl font-black text-[#002366]">
                جدول قداسات وعشيات شهر {monthName}
              </h1>
            </div>

            {/* ☀️ Today's Live Date */}
            <div className="inline-flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#00174a]">
              <Sun className="w-4 h-4 text-[#d4af37]" />
              <span>تاريخ اليوم:</span>
              <span className="font-black text-[#002366]">{todayFullDate.gregorian}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-900 font-extrabold">{todayFullDate.coptic}</span>
            </div>
          </div>

          {/* Month Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            
            {/* View Mode Toggle (Table / Cards) */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#002366] text-[#fed65b] font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>عرض الجدول 📋</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[#002366] text-[#fed65b] font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>عرض الكروت 🗂️</span>
              </button>
            </div>

            {/* Month Switcher */}
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-2 text-[#002366] font-black">
                {monthName}
              </span>
              <button
                onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSyncFixedWeekdays}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="تثبيت مواعيد الاثنين إلى الخميس الرسمية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تثبيت الثوابت ⚡</span>
            </button>

            <button
              onClick={() => openAddModal('liturgy', 'الجمعة', selectedWeekTab !== 'all' ? `week_${selectedWeekTab + 1}` : 'all')}
              className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ إضافة قداس / عشية</span>
            </button>
          </div>
        </div>

        {/* ── SPECIAL FEAST QUICK ADD BANNER (e.g. عيد النيروز المجيد) ── */}
        <div className="bg-gradient-to-r from-[#002366] via-[#003399] to-[#00174a] text-white rounded-3xl p-5 sm:p-6 border border-amber-300/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center font-black shrink-0 shadow-md text-xl">
              🌟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#fed65b] text-[#00174a] px-2.5 py-0.5 rounded-lg text-[11px] font-black">
                  مناسبة طقسية قادمة
                </span>
                <h3 className="font-tajawal text-base sm:text-lg font-black text-[#fed65b]">
                  عيد النيروز المجيد (رأس السنة القبطية الشهداء)
                </h3>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-1">
                يمكنك بسهولة إضافة عشية العيد والقداس الإلهي الاحتفالي للمناسبة بضغطة زر واحدة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openAddModal('vespers', 'الأربعاء', 'all', { title: 'عشية عيد النيروز المجيد', occasionName: 'عيد النيروز المجيد' })}
              className="bg-purple-700/80 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              🕯️ إضافة عشية النيروز
            </button>
            <button
              onClick={() => openAddModal('liturgy', 'الخميس', 'all', { title: 'قداس عيد النيروز المجيد', occasionName: 'عيد النيروز المجيد' })}
              className="bg-[#fed65b] hover:bg-amber-300 text-[#00174a] font-black text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              👑 إضافة قداس النيروز
            </button>
          </div>
        </div>

        {/* ── NON-FIXED LITURGIES AGGREGATOR BANNER ── */}
        {nonFixedLiturgies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-amber-700" />
                <h4 className="font-tajawal font-black text-[#00174a] text-sm sm:text-base">
                  تجميع قداسات الشهر المتغيرة ({nonFixedLiturgies.length} قداس أسبوعي)
                </h4>
              </div>
              <p className="text-xs text-amber-900 font-semibold">
                هذه القداسات محددة لأسابيع معينة، يمكنك تثبيت أي منها ليصبح روتيناً ثابتاً طوال الشهر كاملاً.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {nonFixedLiturgies.slice(0, 3).map(l => (
                <button
                  key={l.id}
                  onClick={() => handleConvertToFixed(l)}
                  className="bg-white hover:bg-amber-100 text-[#00174a] border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="تثبيت هذا القداس لكل أسابيع الشهر"
                >
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>تثبيت ({l.liturgy_day} - {l.title})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── 2. FULL MONTH WEEKS SELECTOR TABS ── */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedWeekTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedWeekTab === 'all'
                ? 'bg-[#002366] text-[#fed65b] font-black shadow-xs scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>🌟 الشهر كاملاً (عرض كل الأسابيع)</span>
          </button>

          {monthWeeks.map((w, idx) => (
            <button
              key={w.weekIndex}
              onClick={() => setSelectedWeekTab(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedWeekTab === idx
                  ? 'bg-[#002366] text-[#fed65b] border-[#002366] font-black shadow-xs scale-[1.02]'
                  : w.containsToday
                  ? 'bg-amber-50 text-[#00174a] border-amber-300 font-extrabold'
                  : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span>{w.label}</span>
              <span className={`text-[10px] ${selectedWeekTab === idx ? 'text-[#fed65b]' : 'text-slate-400'}`}>
                ({w.startDay} - {w.endDay} {activeDate.toLocaleDateString('ar-EG', { month: 'short' })})
              </span>
              {w.containsToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" title="الأسبوع الحالي" />
              )}
            </button>
          ))}
        </div>

        {/* ── 3. FULL MONTH TABLE / CARDS DISPLAY ── */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 font-bold border border-slate-200">
            جاري تحميل جدول قداسات الشهر...
          </div>
        ) : displayWeeks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
            لا توجد بيانات لهذا الشهر
          </div>
        ) : (
          <div className="space-y-8">
            {displayWeeks.map(w => {
              const weekLiturgies = getLiturgiesForWeek(w.weekIndex);

              return (
                <div key={w.weekIndex} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
                  
                  {/* Week Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        w.containsToday
                          ? 'bg-[#fed65b] text-[#00174a] shadow-xs'
                          : 'bg-[#002366] text-[#fed65b]'
                      }`}>
                        {w.weekIndex}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-tajawal text-base font-black text-[#002366]">
                            {w.label} ({w.rangeString})
                          </h3>
                          {w.containsToday && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-bold">
                              الأسبوع الحالي 📍
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-bold">
                          إجمالي الخدمات المقررة في هذا الأسبوع: ({weekLiturgies.length})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openAddModal('liturgy', 'الجمعة', `week_${w.weekIndex}`)}
                      className="text-xs text-[#002366] hover:text-blue-800 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة قداس في {w.label}</span>
                    </button>
                  </div>

                  {/* Empty State */}
                  {weekLiturgies.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-500">لا توجد قداسات مسجلة في {w.label}</p>
                      <button
                        onClick={() => openAddModal('liturgy', 'الجمعة', `week_${w.weekIndex}`)}
                        className="text-xs bg-[#002366] text-[#fed65b] font-bold px-3.5 py-1.5 rounded-xl"
                      >
                        ➕ إضافة قداس لهذا الأسبوع
                      </button>
                    </div>
                  ) : viewMode === 'table' ? (
                    /* ══════════════════════════════════════════════════════════════
                       TABLE VIEW (جدول شهر سبتمبر المريح)
                    ══════════════════════════════════════════════════════════════ */
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-right border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="bg-[#002366] text-white font-tajawal text-xs">
                            <th className="p-3.5 font-bold border-l border-white/10 w-44">اليوم والتاريخ</th>
                            <th className="p-3.5 font-bold border-l border-white/10 w-48">القداس / الخدمة والتوقيت</th>
                            <th className="p-3.5 font-bold border-l border-white/10 w-52">الكنيسة والمذبح</th>
                            <th className="p-3.5 font-bold border-l border-white/10">الآباء الكهنة المصلون والعظة</th>
                            <th className="p-3.5 font-bold border-l border-white/10 w-36">الحالة / التثبيت</th>
                            <th className="p-3.5 font-bold text-center w-28">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {weekLiturgies.map((l, index) => {
                            const parsed = parseLiturgyNotes(l.notes);
                            const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
                            const isFixedWeekday = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day);
                            const isAllWeekFixed = parsed.weekScope === 'all';

                            // Find exact date of this day in this specific week
                            const matchedDay = w.days.find(d => d.dayName.includes(l.liturgy_day));
                            const exactDateText = matchedDay?.fullDateText || '';
                            const isTodayRow = matchedDay?.isToday;

                            return (
                              <React.Fragment key={l.id}>
                                {/* Special Occasion Wide Rectangle Banner */}
                                {parsed.isSpecialOccasion && (
                                  <tr className="bg-gradient-to-r from-amber-500/20 via-blue-900/10 to-amber-500/20 border-y-2 border-[#d4af37]">
                                    <td colSpan={6} className="p-2.5 text-center">
                                      <div className="inline-flex items-center gap-2 text-xs font-black text-[#00174a]">
                                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                                        <span>🌟 [ مناسبة طقسية خاصة: {parsed.occasionTitle || l.title} - بركة صلواته معنا ] 🌟</span>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                <tr className={`hover:bg-slate-50/80 transition-colors ${
                                  isTodayRow ? 'bg-amber-50/40' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                                }`}>
                                  
                                  {/* 1. اليوم والتاريخ */}
                                  <td className="p-3.5 border-l border-slate-100 align-top">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="bg-[#002366] text-[#fed65b] px-2.5 py-0.5 rounded-lg font-black text-xs">
                                          {l.liturgy_day}
                                        </span>
                                        {isTodayRow && (
                                          <span className="bg-amber-400 text-[#00174a] text-[10px] px-1.5 py-0.2 rounded font-black">
                                            اليوم ☀️
                                          </span>
                                        )}
                                      </div>
                                      {exactDateText && (
                                        <div className="text-[11px] text-slate-600 font-bold">
                                          {exactDateText}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* 2. القداس والتوقيت */}
                                  <td className="p-3.5 border-l border-slate-100 align-top">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-tajawal font-black text-xs text-[#00174a]">
                                          {l.title}
                                        </span>
                                        {isVesper && (
                                          <span className="text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                                            عشية 🕯️
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold">
                                        <Clock className="w-3 h-3 text-[#d4af37]" />
                                        <span>{formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 3. الكنيسة والمذبح */}
                                  <td className="p-3.5 border-l border-slate-100 align-top">
                                    <div className="flex items-center gap-1.5 text-xs text-[#002366] font-bold">
                                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                      <div>
                                        <div className="font-extrabold">{l.church_name}</div>
                                        <div className="text-[11px] text-slate-500">{l.altar_name}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 4. الكهنة المصلون والعظة */}
                                  <td className="p-3.5 border-l border-slate-100 align-top">
                                    <div className="space-y-2">
                                      {/* Ordered Priests Chips */}
                                      <div className="flex flex-wrap gap-1">
                                        {parsed.priests.map((pName, pIdx) => (
                                          <span
                                            key={pIdx}
                                            className="bg-amber-50 text-amber-950 border border-amber-200/90 px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                                          >
                                            <span className="w-4 h-4 rounded-full bg-[#002366] text-[#fed65b] text-[9px] flex items-center justify-center font-black">
                                              {pIdx + 1}
                                            </span>
                                            <span>{pName}</span>
                                          </span>
                                        ))}
                                      </div>

                                      {/* Sermon Chip */}
                                      {parsed.hasSermon && (
                                        <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg text-[11px] text-purple-900 font-bold">
                                          <Mic className="w-3 h-3 text-purple-700 shrink-0" />
                                          <span>العظة: <strong>{parsed.sermonSpeaker}</strong> {parsed.sermonTopic ? `(${parsed.sermonTopic})` : ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* 5. الحالة / التثبيت */}
                                  <td className="p-3.5 border-l border-slate-100 align-top">
                                    {isFixedWeekday || isAllWeekFixed ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-extrabold">
                                        <Lock className="w-3 h-3 text-emerald-600" />
                                        <span>قداس ثابت 🔒</span>
                                      </span>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                          <span>متغير أسبوعياً 📅</span>
                                        </span>
                                        <button
                                          onClick={() => handleConvertToFixed(l)}
                                          className="block text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 px-2 py-1 rounded-lg font-black transition-colors cursor-pointer"
                                          title="تثبيت هذا القداس لكل أسابيع الشهر"
                                        >
                                          تثبيت القداس 🔒
                                        </button>
                                      </div>
                                    )}
                                  </td>

                                  {/* 6. الإجراءات */}
                                  <td className="p-3.5 text-center align-top">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => openEditModal(l)}
                                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="تعديل القداس"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(l.id)}
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="حذف القداس"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* ══════════════════════════════════════════════════════════════
                       CARDS VIEW (عرض الكروت)
                    ══════════════════════════════════════════════════════════════ */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weekLiturgies.map(l => {
                        const parsed = parseLiturgyNotes(l.notes);
                        const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
                        const isFixed = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day) || parsed.weekScope === 'all';

                        const matchedDay = w.days.find(d => d.dayName.includes(l.liturgy_day));
                        const exactDateStr = matchedDay?.dateStr;

                        return (
                          <div
                            key={l.id}
                            className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                              parsed.isSpecialOccasion
                                ? 'border-amber-300 bg-amber-50/30'
                                : isVesper
                                ? 'border-purple-200 bg-purple-50/20'
                                : isFixed
                                ? 'border-amber-200 bg-amber-50/20'
                                : 'border-slate-200 hover:border-[#d4af37]/40'
                            }`}
                          >
                            <div className="space-y-3">
                              
                              {/* Top Row: Day & Exact Date + Type Badge */}
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="bg-[#002366] text-[#fed65b] px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-2xs">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{l.liturgy_day}</span>
                                  </span>

                                  {exactDateStr && (
                                    <span className="bg-amber-100/90 text-[#00174a] border border-amber-300 px-2.5 py-1 rounded-xl font-black text-xs flex items-center gap-1 shadow-2xs">
                                      <Sun className="w-3 h-3 text-[#d4af37]" />
                                      <span>{exactDateStr}</span>
                                    </span>
                                  )}
                                </div>

                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shrink-0 ${
                                  parsed.isSpecialOccasion
                                    ? 'bg-amber-200 text-amber-950 border-amber-300'
                                    : isVesper
                                    ? 'bg-purple-100 text-purple-900 border-purple-200'
                                    : isFixed
                                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                                    : 'bg-blue-50 text-blue-900 border-blue-200'
                                }`}>
                                  {parsed.isSpecialOccasion ? '🌟 مناسبة خاصة' : isVesper ? 'صلاة عشية 🕯️' : isFixed ? 'قداس ثابت 🔒' : 'قداس إلهي ⛪'}
                                </span>
                              </div>

                              {/* Title & Timing */}
                              <div>
                                <h4 className="font-tajawal font-black text-base text-[#00174a]">{l.title}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                                  <span>{formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}</span>
                                </div>
                              </div>

                              {/* Church & Altar */}
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-[#002366] font-bold">
                                <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span>{l.church_name} - {l.altar_name}</span>
                              </div>

                              {/* Priests (المصلون) in strict click order */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block">الآباء الكهنة المصلون:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {parsed.priests.map((p, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="bg-amber-50 text-amber-950 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-[#002366] text-[#fed65b] text-[9px] flex items-center justify-center font-black">
                                        {pIdx + 1}
                                      </span>
                                      <span>{p}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* 🎤 SERMON CHIP */}
                              {parsed.hasSermon && (
                                <div className="p-2.5 bg-purple-50 border border-purple-200/80 rounded-xl flex items-center gap-2 shadow-2xs">
                                  <div className="w-6 h-6 rounded-full bg-purple-700 text-[#fed65b] flex items-center justify-center font-bold text-[10px] shrink-0">
                                    <Mic className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col text-xs">
                                    <span className="text-[10px] text-purple-600 font-bold">ملقي العظة والكلمة:</span>
                                    <span className="font-black text-purple-950">
                                      {parsed.sermonSpeaker} {parsed.sermonTopic ? `(${parsed.sermonTopic})` : ''}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                              <button
                                onClick={() => openEditModal(l)}
                                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>

                              <button
                                onClick={() => handleDelete(l.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. ADD / EDIT MODAL
        ══════════════════════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
              
              {/* Modal Header */}
              <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#fed65b]">
                    {editingLiturgyId ? 'تعديل بيانات القداس / العشية' : (serviceType === 'vespers' ? 'إضافة صلاة عشية جديدة' : 'إضافة قداس إلهي جديد')}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-200 font-semibold mt-0.5">
                    <Sun className="w-3 h-3 text-[#fed65b]" />
                    <span>تاريخ اليوم: {todayFullDate.gregorian} ({todayFullDate.coptic})</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold max-h-[80vh] overflow-y-auto">
                
                {/* 1. نوع الخدمة */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('liturgy');
                      if (title.includes('عشية')) setTitle('القداس الأول');
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      serviceType === 'liturgy'
                        ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⛪ قداس إلهي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('vespers');
                      if (!title.includes('عشية')) setTitle('صلاة العشية والتمجيد');
                    }}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                      serviceType === 'vespers'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🕯️ صلاة عشية
                  </button>
                </div>

                {/* 2. نطاق الأسبوع في شهر */}
                <div className="space-y-1">
                  <label className="text-[#002366] font-black block">نطاق تطبيق الخدمة في شهر {monthName} *</label>
                  <select
                    value={formWeekScope}
                    onChange={(e) => setFormWeekScope(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs focus:border-[#002366] text-[#00174a]"
                  >
                    <option value="all">🌟 كل أسابيع الشهر (ثابت طوال شهر {monthName})</option>
                    {monthWeeks.map(w => (
                      <option key={w.key} value={w.key}>
                        📅 {w.label} فقط ({w.rangeString})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. عنوان الخدمة ويوم الأسبوع */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">اسم القداس / الخدمة *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: القداس الأول"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">يوم الأسبوع *</label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {ALL_DAYS_ORDER.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. التوقيت */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">من الساعة *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">إلى الساعة *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>
                </div>

                {/* 5. الكنيسة والمذبح المحدد */}
                <div className="space-y-1.5">
                  <label className="text-[#002366] font-black flex items-center gap-1 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>الكنيسة والمذبح *</span>
                  </label>

                  <select
                    value={isCustomAltar ? 'custom' : selectedAltarOption}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomAltar(true);
                        setSelectedAltarOption('custom');
                      } else {
                        setIsCustomAltar(false);
                        setSelectedAltarOption(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs focus:border-[#002366] text-[#00174a]"
                  >
                    {OFFICIAL_ALTAR_CHOICES.map(opt => (
                      <option key={opt.label} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="custom">➕ مذبح آخر / كنيسة أخرى...</option>
                  </select>

                  {isCustomAltar && (
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      <input
                        type="text"
                        placeholder="اسم الكنيسة"
                        value={customChurchName}
                        onChange={(e) => setCustomChurchName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="اسم المذبح"
                        value={customAltarName}
                        onChange={(e) => setCustomAltarName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* 6. الآباء الكهنة المصلون مع حفظ الترتيب الفعلي للضغط */}
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[#00174a] font-black flex items-center gap-1 text-xs">
                      <User className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>الآباء الكهنة المصلون (بالترتيب المطلوب) *</span>
                    </label>
                    <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-lg font-bold">
                      تم اختيار ({selectedPriests.length}) كاهن
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-semibold">
                    💡 اضغط على أسماء الآباء بالترتيب الذي ترغب في تسجيله (سيتم ترقيمهم 1، 2، 3...).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PRIEST_NAMES_LIST.map((pName) => {
                      const selectedIndex = selectedPriests.indexOf(pName);
                      const isSelected = selectedIndex !== -1;
                      return (
                        <button
                          key={pName}
                          type="button"
                          onClick={() => togglePriest(pName)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold border text-right flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-xs font-black'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{pName}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#fed65b] text-[#00174a] text-[10px] flex items-center justify-center font-black shrink-0">
                              {selectedIndex + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual Click Order Preview */}
                  {selectedPriests.length > 0 && (
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-700 font-bold flex flex-wrap items-center gap-1.5">
                      <span className="text-[#002366] font-black">الترتيب المسجل:</span>
                      {selectedPriests.map((p, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded-md text-[#00174a]">
                          ({idx + 1}) {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. مناسبة طقسية / عيد كنسي (مثل عيد النيروز) */}
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span className="text-[#00174a] font-black text-xs">
                        مناسبة طقسية خاصة / عيد كنسي (مثل عيد النيروز)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSpecialOccasion}
                      onChange={(e) => setIsSpecialOccasion(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>

                  {isSpecialOccasion && (
                    <div className="pt-2 border-t border-amber-200 space-y-1.5 animate-fadeIn">
                      <label className="text-slate-700 font-bold block text-[11px]">
                        اسم المناسبة أو العيد:
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: عيد النيروز المجيد / عيد الصليب"
                        value={occasionTitle}
                        onChange={(e) => setOccasionTitle(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 outline-none font-bold text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 8. العظة (اختياري) */}
                <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200/70 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-purple-700" />
                      <span className="text-[#00174a] font-black text-xs">
                        إضافة عظة / كلمة روحية
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasSermon}
                      onChange={(e) => setHasSermon(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                    />
                  </label>

                  {hasSermon && (
                    <div className="pt-2 border-t border-purple-200/60 space-y-2 animate-fadeIn">
                      <div>
                        <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                          الكاهن الواعظ:
                        </label>
                        <select
                          value={sermonSpeaker}
                          onChange={(e) => setSermonSpeaker(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none font-bold text-xs"
                        >
                          {PRIEST_NAMES_LIST.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                          عنوان العظة (اختياري):
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: فضيلة التواضع"
                          value={sermonTopic}
                          onChange={(e) => setSermonTopic(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-black text-xs shadow-md shadow-[#002366]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    {editingLiturgyId ? 'حفظ التعديلات' : 'إضافة للجدول'}
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
export default PriestLiturgiesPage;

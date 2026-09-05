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
  CalendarDays,
  Check,
  Sun,
  Lock,
  Flame,
  Layers,
  Sparkle,
  Mic,
  Volume2,
  ChevronRight,
  ChevronLeft,
  CalendarRange,
  Table,
  Copy,
  CheckCheck
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
      extraNotes: '',
    };
  }

  let hasSermon = false;
  let sermonSpeaker = '';
  let sermonTopic = '';
  let weekScope: ParsedLiturgyInfo['weekScope'] = 'all';
  let specificDate = '';

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

  // Sermon parsing
  const sermonMatch = notes.match(/(?:العظة|ملقي العظة|واعظ القداس|واعظ العشية)[:\s]+([^|()]+)(?:\(([^)]+)\))?/);
  if (sermonMatch) {
    hasSermon = true;
    sermonSpeaker = sermonMatch[1].trim();
    if (sermonMatch[2]) {
      sermonTopic = sermonMatch[2].trim();
    }
  }

  // Priests parsing
  const priests: string[] = [];
  const priestSection = notes.split(/\||\b(?:العظة|ملقي العظة)/)[0];
  for (const p of PRIEST_NAMES_LIST) {
    if (priestSection.includes(p) && !priests.includes(p)) {
      priests.push(p);
    }
  }
  if (priests.length === 0) {
    const match = notes.match(/(?:الكهنة|الكاهن(?:\s*المصلي)?[:\s]+)?([^|]+)/);
    if (match) {
      const names = match[1].split(/[،,•]/).map(s => s.trim()).filter(Boolean);
      if (names.length > 0) priests.push(...names);
    }
  }
  if (priests.length === 0) {
    priests.push('آباء الكنيسة');
  }

  let cleanExtra = notes;
  if (sermonMatch) cleanExtra = cleanExtra.replace(sermonMatch[0], '');
  if (dateMatch) cleanExtra = cleanExtra.replace(dateMatch[0], '');
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
    extraNotes: cleanExtra,
  };
};

export const PriestLiturgiesPage: React.FC = () => {
  const { profile } = useAuth();
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View Mode: Cards vs Full Month Matrix
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Month & Year Selection
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0); // 0 = current month, 1 = next month, etc.
  const activeDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const currentYear = activeDate.getFullYear();
  const currentMonth = activeDate.getMonth();

  const monthName = useMemo(() => {
    return activeDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [activeDate]);

  // Generate Weeks for Selected Month
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
          dateStr: `${d} ${dateObj.toLocaleDateString('ar-EG', { month: 'short' })}`,
          isoDate: dateObj.toISOString().split('T')[0],
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

  // Selected Week Filter in Dashboard: 'all' or week index (0, 1, 2, 3, 4)
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<'all' | number>('all');

  // Active Filter in Dynamic View
  const [dynamicFilter, setDynamicFilter] = useState<'all' | 'الجمعة' | 'السبت' | 'الأحد' | 'liturgy' | 'vespers'>('all');

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
  
  // Multi-priest selection (المصلون)
  const [selectedPriests, setSelectedPriests] = useState<string[]>(['ابونا مرقس ميلاد']);
  const [customPriestName, setCustomPriestName] = useState('');

  // 🎤 SERMON (العظة)
  const [hasSermon, setHasSermon] = useState(false);
  const [sermonSpeaker, setSermonSpeaker] = useState('ابونا مرقس ميلاد');
  const [customSermonSpeaker, setCustomSermonSpeaker] = useState('');
  const [sermonTopic, setSermonTopic] = useState('');

  // 📅 Week Scope Field
  const [formWeekScope, setFormWeekScope] = useState<ParsedLiturgyInfo['weekScope']>('all');
  const [formSpecificDate, setFormSpecificDate] = useState<string>('');

  const [extraNotes, setExtraNotes] = useState('');

  const ALL_DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const todayFullDate = useMemo(() => {
    const now = new Date();
    const greg = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cop = getCopticDate(now);
    return {
      gregorian: greg,
      coptic: `${cop.copticDay} ${cop.copticMonthName} ${cop.copticYear} ش`
    };
  }, []);

  // Compute actual dates for the 7 days of the current week
  const weekDayDates = useMemo(() => {
    const datesMap: Record<string, { dateStr: string; isToday: boolean }> = {};
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    dayNames.forEach((dName, idx) => {
      const diff = idx - currentDayOfWeek;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + diff);

      const formatted = targetDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      datesMap[dName] = {
        dateStr: formatted,
        isToday: idx === currentDayOfWeek
      };
    });

    return datesMap;
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

  const togglePriest = (name: string) => {
    if (selectedPriests.includes(name)) {
      if (selectedPriests.length === 1 && !customPriestName.trim()) return;
      setSelectedPriests(prev => prev.filter(p => p !== name));
    } else {
      setSelectedPriests(prev => [...prev, name]);
    }
  };

  const openAddModal = (defaultType: 'liturgy' | 'vespers' = 'liturgy', defaultDay: string = 'الجمعة', defaultWeekScope: ParsedLiturgyInfo['weekScope'] = 'all') => {
    setEditingLiturgyId(null);
    setServiceType(defaultType);
    setTitle(defaultType === 'vespers' ? 'صلاة العشية والتمجيد' : 'القداس الأول');
    setDay(defaultDay);
    setStartTime(defaultType === 'vespers' ? '18:30' : '07:00');
    setEndTime(defaultType === 'vespers' ? '20:30' : '09:00');
    setSelectedAltarOption('الكنيسة الكبيرة - مذبح العذراء');
    setIsCustomAltar(false);
    setCustomChurchName('');
    setCustomAltarName('');
    setSelectedPriests(['ابونا مرقس ميلاد']);
    setCustomPriestName('');
    
    // Sermon resets
    setHasSermon(false);
    setSermonSpeaker('ابونا مرقس ميلاد');
    setCustomSermonSpeaker('');
    setSermonTopic('');

    setFormWeekScope(defaultWeekScope);
    setFormSpecificDate('');
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

    // Match official altar option
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

    setSelectedPriests(knownInList.length > 0 ? knownInList : ['ابونا مرقس ميلاد']);
    setCustomPriestName(customInList.join('، '));

    // Restore Sermon state
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

    setFormWeekScope(parsed.weekScope);
    setFormSpecificDate(parsed.specificDate || '');
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
      setError('يرجى اختيار أو كتابة كاهن واحد على الأقل للمشاركة في الخدمة.');
      return;
    }

    // Format combined notes
    const priestPrefix = allPriests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
    const parts: string[] = [`${priestPrefix}: ${allPriests.join(' • ')}`];

    // Append Week scope
    if (formWeekScope !== 'all') {
      if (formWeekScope === 'week_1') parts.push('الأسبوع: الأول');
      else if (formWeekScope === 'week_2') parts.push('الأسبوع: الثاني');
      else if (formWeekScope === 'week_3') parts.push('الأسبوع: الثالث');
      else if (formWeekScope === 'week_4') parts.push('الأسبوع: الرابع');
      else if (formWeekScope === 'week_5') parts.push('الأسبوع: الخامس');
      else if (formWeekScope === 'specific_date' && formSpecificDate) {
        parts.push(`تاريخ: ${formSpecificDate}`);
      }
    }

    // Append Sermon if checked
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

  // Sync fixed weekday routine
  const handleSyncFixedWeekdays = async () => {
    if (!window.confirm('هل تريد مزامنة وتثبيت قداسات (الاثنين - الثلاثاء - الأربعاء - الخميس) بالكهنة والمذابح الرسمية المحددة تلقائياً؟')) return;
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

  // Separate Fixed Weekday Liturgies
  const fixedLiturgies = useMemo(() => {
    return liturgies.filter(l => ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day))
      .sort((a, b) => {
        const order = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        return order.indexOf(a.liturgy_day) - order.indexOf(b.liturgy_day);
      });
  }, [liturgies]);

  // Filter dynamic liturgies by week and day/type filter
  const dynamicLiturgies = useMemo(() => {
    return liturgies.filter(l => ['الجمعة', 'السبت', 'الأحد'].includes(l.liturgy_day))
      .filter(l => {
        const parsed = parseLiturgyNotes(l.notes);
        
        // Week filter
        if (selectedWeekFilter !== 'all') {
          const targetWeekKey = `week_${selectedWeekFilter + 1}`;
          if (parsed.weekScope !== 'all' && parsed.weekScope !== targetWeekKey) {
            return false;
          }
        }

        // Dynamic Sub Filter
        if (dynamicFilter === 'all') return true;
        if (dynamicFilter === 'الجمعة' || dynamicFilter === 'السبت' || dynamicFilter === 'الأحد') {
          return l.liturgy_day === dynamicFilter;
        }
        if (dynamicFilter === 'liturgy') {
          return !l.title.includes('عشية') && !l.title.includes('نهضة');
        }
        if (dynamicFilter === 'vespers') {
          return l.title.includes('عشية') || l.title.includes('نهضة');
        }
        return true;
      })
      .sort((a, b) => {
        const order = ['الجمعة', 'السبت', 'الأحد'];
        const dayDiff = order.indexOf(a.liturgy_day) - order.indexOf(b.liturgy_day);
        if (dayDiff !== 0) return dayDiff;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [liturgies, dynamicFilter, selectedWeekFilter]);

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* ── TOP HEADER WITH MONTH SELECTOR & WEEKS NAVIGATION ── */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/30 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-xs mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>لوحة التخطيط الشهري الشامل للمواعيد الكنسية</span>
              </div>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b] tracking-wide">
                جدول قداسات وعشيات شهر {monthName}
              </h1>
              <p className="text-xs text-slate-200 font-semibold mt-1">
                إضافة وإدارة جدول الشهر بالكامل أسبوعاً بأسبوع، مع تحديد الآباء الكهنة والمذابح والعظات
              </p>
            </div>

            {/* Top Month Switcher & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              
              {/* Month Switcher */}
              <div className="bg-white/10 border border-white/20 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                  className="px-2.5 py-1.5 rounded-xl hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="px-2 text-[#fed65b] font-extrabold">
                  {monthName}
                </span>
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                  className="px-2.5 py-1.5 rounded-xl hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {selectedMonthOffset !== 0 && (
                  <button
                    onClick={() => setSelectedMonthOffset(0)}
                    className="text-[10px] bg-[#fed65b] text-[#00174a] px-2 py-1 rounded-lg font-extrabold ml-1 cursor-pointer"
                  >
                    الشهر الحالي
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => openAddModal('liturgy', 'الجمعة', selectedWeekFilter !== 'all' ? `week_${selectedWeekFilter + 1}` : 'all')}
                className="bg-[#fed65b] hover:bg-[#ffe285] text-[#00174a] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>➕ قداس إلهي</span>
              </button>

              <button
                onClick={() => openAddModal('vespers', 'السبت', selectedWeekFilter !== 'all' ? `week_${selectedWeekFilter + 1}` : 'all')}
                className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-[#fed65b]" />
                <span>➕ صلاة عشية / نهضة</span>
              </button>
            </div>
          </div>

          {/* ☀️ 1. PROMINENT TODAY'S DATE & 7-DAY WEEK STRIP */}
          <div className="bg-gradient-to-r from-amber-500/25 via-[#fed65b]/30 to-amber-500/25 border-2 border-[#fed65b] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#fed65b]/40 pb-3">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center font-black shadow-md shrink-0">
                  <Sun className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs text-[#fed65b] font-black block">تاريخ اليوم الحالي:</span>
                  <h2 className="text-lg sm:text-2xl font-tajawal font-black text-white leading-tight">
                    {todayFullDate.gregorian}
                  </h2>
                </div>
              </div>

              <div className="bg-[#00174a] border border-[#fed65b]/60 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black text-[#fed65b] shadow-inner self-start sm:self-auto">
                <Calendar className="w-4 h-4 text-[#fed65b]" />
                <span>التقويم القبطي: {todayFullDate.coptic}</span>
              </div>
            </div>

            {/* 7-Day Live Strip */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-200 font-extrabold block">
                📍 تواريخ أيام هذا الأسبوع الحالي لتسهيل ضبط ومراجعة القداسات:
              </span>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold">
                {ALL_DAYS_OF_WEEK.map(dName => {
                  const dayInfo = weekDayDates[dName] || { dateStr: '', isToday: false };
                  const isDynamic = ['الجمعة', 'السبت', 'الأحد'].includes(dName);

                  return (
                    <div
                      key={dName}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                        dayInfo.isToday
                          ? 'bg-[#fed65b] text-[#00174a] border-white shadow-lg ring-2 ring-white font-black scale-105'
                          : isDynamic
                          ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          : 'bg-white/5 text-slate-300 border-white/10'
                      }`}
                    >
                      <span className="block text-[11px] sm:text-xs font-extrabold">{dName}</span>
                      <span className={`block text-[10px] sm:text-xs mt-0.5 ${dayInfo.isToday ? 'text-[#00174a] font-black' : 'text-[#fed65b]'}`}>
                        {dayInfo.dateStr}
                      </span>
                      {dayInfo.isToday && (
                        <span className="inline-block mt-1 text-[9px] bg-[#00174a] text-[#fed65b] px-1.5 py-0.2 rounded-md font-black">
                          اليوم 📍
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 📅 2. FULL MONTH WEEKS SELECTOR BAR */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 text-xs font-bold">
              <div className="flex items-center gap-2 text-[#fed65b]">
                <CalendarRange className="w-4 h-4" />
                <span>تخطيط أسابيع شهر {monthName} ({monthWeeks.length} أسابيع):</span>
              </div>
              <span className="text-[11px] text-slate-300">
                اختر أسبوعاً معيناً أو اعرض الشهر بالكامل
              </span>
            </div>

            {/* Weeks Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => setSelectedWeekFilter('all')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  selectedWeekFilter === 'all'
                    ? 'bg-[#fed65b] text-[#00174a] border-[#fed65b] shadow-md font-black scale-[1.02]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <span>الشهر بالكامل 🌟</span>
                <span className="text-[10px] opacity-80">جميع الأسابيع</span>
              </button>

              {monthWeeks.map((w, idx) => (
                <button
                  key={w.weekIndex}
                  onClick={() => setSelectedWeekFilter(idx)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    selectedWeekFilter === idx
                      ? 'bg-[#fed65b] text-[#00174a] border-[#fed65b] shadow-md font-black scale-[1.02]'
                      : w.containsToday
                      ? 'bg-amber-400/25 text-[#fed65b] border-[#fed65b]/60 hover:bg-amber-400/35'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{w.label}</span>
                    {w.containsToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] opacity-80">{w.startDay} - {w.endDay} {activeDate.toLocaleDateString('ar-EG', { month: 'short' })}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: DYNAMIC WEEKEND LITURGIES & VESPERS (الجمعة • السبت • الأحد)
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="font-tajawal text-lg font-extrabold text-[#002366]">
                  قداسات وعشيات نهاية الأسبوع (الجمعة • السبت • الأحد)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {selectedWeekFilter === 'all'
                  ? `عرض قداسات وعشيات الشهر بالكامل (${monthName})`
                  : `عرض قداسات وعشيات ${monthWeeks[selectedWeekFilter]?.label} (${monthWeeks[selectedWeekFilter]?.rangeString})`}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              {[
                { id: 'all', label: `الكل (${dynamicLiturgies.length})` },
                { id: 'الجمعة', label: 'الجمعة' },
                { id: 'السبت', label: 'السبت' },
                { id: 'الأحد', label: 'الأحد' },
                { id: 'liturgy', label: 'القداسات الإلهية' },
                { id: 'vespers', label: 'العشيات والنهضات' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDynamicFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    dynamicFilter === tab.id
                      ? 'bg-[#002366] text-[#fed65b] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#002366] hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل القداسات...</div>
          ) : dynamicLiturgies.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">لا توجد خدمات مسجلة لهذا الأسبوع / الفلتر</p>
              <button
                onClick={() => openAddModal('liturgy', 'الجمعة', selectedWeekFilter !== 'all' ? `week_${selectedWeekFilter + 1}` : 'all')}
                className="text-xs bg-[#002366] text-[#fed65b] font-bold px-4 py-2 rounded-xl"
              >
                ➕ إضافة قداس لهذا الأسبوع الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicLiturgies.map(l => {
                const parsed = parseLiturgyNotes(l.notes);
                const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');

                const weekBadgeLabel = 
                  parsed.weekScope === 'all' ? 'طوال الشهر' :
                  parsed.weekScope === 'week_1' ? 'الأسبوع الأول' :
                  parsed.weekScope === 'week_2' ? 'الأسبوع الثاني' :
                  parsed.weekScope === 'week_3' ? 'الأسبوع الثالث' :
                  parsed.weekScope === 'week_4' ? 'الأسبوع الرابع' :
                  parsed.weekScope === 'week_5' ? 'الأسبوع الخامس' :
                  parsed.specificDate ? `تاريخ ${parsed.specificDate}` : 'طوال الشهر';

                return (
                  <div
                    key={l.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                      isVesper
                        ? 'bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border-indigo-200'
                        : 'bg-white border-slate-200 hover:border-[#d4af37]/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Day & Week Scope & Type Badge */}
                      <div className="flex items-center justify-between">
                        <span className="bg-[#002366] text-[#fed65b] px-3 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{l.liturgy_day}</span>
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-md text-white font-semibold">
                            {weekBadgeLabel}
                          </span>
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                          isVesper
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}>
                          {isVesper ? 'صلاة عشية' : 'قداس إلهي'}
                        </span>
                      </div>

                      {/* Title & Timing */}
                      <div>
                        <h4 className="font-tajawal font-bold text-base text-[#00174a]">{l.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                          <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>{formatArabicTime(l.start_time)} - {formatArabicTime(l.end_time)}</span>
                        </div>
                      </div>

                      {/* Church & Altar */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-[#002366] font-bold">
                        <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span>{l.church_name} - {l.altar_name}</span>
                      </div>

                      {/* Priests (المصلون) */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">الآباء الكهنة المصلون:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.priests.map((p, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <User className="w-3 h-3 text-[#d4af37]" />
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
                            <span className="text-[10px] text-purple-600 font-bold">ملقي العظة والكلمة الروحية:</span>
                            <span className="font-extrabold text-purple-950">
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
                        <span>تعديل الموعد / الكهنة / الأسبوع</span>
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

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: FIXED WEEKDAY LITURGIES (الاثنين • الثلاثاء • الأربعاء • الخميس)
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#d4af37]" />
                <h2 className="font-tajawal text-lg font-extrabold text-[#002366]">
                  القداسات الثابتة أسبوعياً طوال الشهر (الاثنين • الثلاثاء • الأربعاء • الخميس)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                مواعيد وكهنة قداسات أيام الأسبوع الرسمية الثابتة في الكنيسة الكبيرة - مذبح العذراء لجميع أسابيع الشهر
              </p>
            </div>

            <button
              onClick={handleSyncFixedWeekdays}
              className="bg-slate-100 hover:bg-[#002366] text-[#002366] hover:text-[#fed65b] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
              title="إعادة تعيين وتأكيد المواعيد الرسمية الثابتة"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تثبيت ومزامنة الثوابت الرسمية ⚡</span>
            </button>
          </div>

          {/* Cards for Monday - Thursday */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FIXED_WEEKDAY_LITURGIES.map(item => {
              const matchedLiturgy = fixedLiturgies.find(l => l.liturgy_day === item.day);

              return (
                <div
                  key={item.day}
                  className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#00174a] text-[#fed65b] px-3 py-0.5 rounded-xl font-extrabold text-xs">
                        {item.day}
                      </span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>ثابت طوال الشهر</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-tajawal font-bold text-sm text-[#00174a]">{item.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold mt-1">
                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{formatArabicTime(item.startTime)} - {formatArabicTime(item.endTime)}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-amber-200/50 text-xs text-[#002366] font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] inline ml-1" />
                      <span>{item.church} - {item.altar}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">الآباء الكهنة المصلون:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.priests.map((p, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-[#00174a] border border-amber-300/80 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>{p}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {matchedLiturgy && (
                    <div className="border-t border-amber-200/60 pt-2 text-left">
                      <button
                        onClick={() => openEditModal(matchedLiturgy)}
                        className="text-xs text-[#002366] hover:text-[#d4af37] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>تعديل الموعد / العظة</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ADD / EDIT MODAL
        ══════════════════════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
              
              {/* Modal Header */}
              <div className="bg-[#002366] text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-tajawal text-lg font-extrabold text-[#fed65b]">
                    {editingLiturgyId ? 'تعديل بيانات الخدمة' : (serviceType === 'vespers' ? 'إضافة صلاة عشية / نهضة' : 'إضافة قداس إلهي للجدول')}
                  </h3>
                  <p className="text-xs text-slate-200 font-semibold mt-0.5">
                    شهر {monthName} • كنيسة السيدة العذراء بمحرم بك
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-semibold max-h-[80vh] overflow-y-auto">
                
                {/* ☀️ PROMINENT TODAY'S DATE BADGE INSIDE MODAL */}
                <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border-2 border-[#fed65b] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-900 font-extrabold block">تاريخ اليوم الحالي 📍:</span>
                      <span className="text-xs sm:text-sm font-black text-[#00174a]">
                        {todayFullDate.gregorian}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        ({todayFullDate.coptic})
                      </span>
                    </div>
                  </div>

                  {weekDayDates[day] && (
                    <div className="bg-white border border-[#fed65b] px-3.5 py-1.5 rounded-xl text-center self-start sm:self-auto shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-bold block">تاريخ يوم ({day}):</span>
                      <span className="text-xs font-black text-[#002366]">
                        {weekDayDates[day].dateStr} {weekDayDates[day].isToday ? '• (اليوم)' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Service Type Switch */}
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('liturgy');
                      if (title.includes('عشية')) setTitle('القداس الأول');
                    }}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
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
                    className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      serviceType === 'vespers'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🕯️ صلاة عشية / نهضة
                  </button>
                </div>

                {/* 📅 WEEK SCOPE IN MONTH (تطبيق على الأسبوع في الشهر) */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="text-[#002366] font-extrabold flex items-center gap-1.5 text-xs">
                    <CalendarRange className="w-4 h-4 text-[#d4af37]" />
                    <span>نطاق التطبيق في شهر {monthName} *</span>
                  </label>
                  
                  <select
                    value={formWeekScope}
                    onChange={(e) => setFormWeekScope(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366] text-[#00174a]"
                  >
                    <option value="all">🌟 كل أسابيع الشهر (ثابت أسبوعياً طوال الشهر)</option>
                    {monthWeeks.map(w => (
                      <option key={w.key} value={w.key}>
                        📅 {w.label} فقط ({w.rangeString})
                      </option>
                    ))}
                    <option value="specific_date">🗓️ تاريخ محدد بعينه</option>
                  </select>

                  {formWeekScope === 'specific_date' && (
                    <div className="pt-2">
                      <label className="text-slate-600 text-[11px] font-bold block mb-1">
                        اختر التاريخ المحدد للقداس:
                      </label>
                      <input
                        type="date"
                        required
                        value={formSpecificDate}
                        onChange={(e) => setFormSpecificDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Title & Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">عنوان الخدمة *</label>
                    <input
                      type="text"
                      required
                      placeholder={serviceType === 'vespers' ? "مثال: صلاة العشية والتمجيد" : "مثال: القداس الأول / القداس الإلهي"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">
                      يوم الأسبوع * {weekDayDates[day] && <span className="text-[#002366] font-extrabold mr-1">({weekDayDates[day].dateStr})</span>}
                    </label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {ALL_DAYS_OF_WEEK.map(d => (
                        <option key={d} value={d}>
                          {d} {weekDayDates[d] ? `(${weekDayDates[d].dateStr})` : ''} {weekDayDates[d]?.isToday ? '• (اليوم 📍)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">توقيت البدء *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block">توقيت الانتهاء *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    />
                  </div>
                </div>

                {/* ⛪ OFFICIAL ALTAR & CHURCH SELECTION */}
                <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-200/60">
                  <label className="text-[#002366] font-extrabold flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-[#d4af37]" />
                    <span>الكنيسة والمذبح المحدد *</span>
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
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366] text-[#00174a]"
                  >
                    {OFFICIAL_ALTAR_CHOICES.map(opt => (
                      <option key={opt.label} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="custom">➕ مذبح آخر / كنيسة أخرى (تحديد يدوي)</option>
                  </select>

                  {isCustomAltar && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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

                {/* 👨‍🦳 MULTI-PRIEST SELECTION (المصلون) */}
                <div className="space-y-2.5 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[#00174a] font-extrabold flex items-center gap-1.5 text-xs">
                      <User className="w-4 h-4 text-[#d4af37]" />
                      <span>الآباء الكهنة المصلون (يمكن تحديد أكثر من كاهن) *</span>
                    </label>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      تم تحديد ({selectedPriests.length + (customPriestName.trim() ? 1 : 0)})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {PRIEST_NAMES_LIST.map((pName) => {
                      const isSelected = selectedPriests.includes(pName);
                      return (
                        <button
                          key={pName}
                          type="button"
                          onClick={() => togglePriest(pName)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border text-right flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className="truncate">{pName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Priest Input */}
                  <div className="pt-2">
                    <label className="text-slate-600 text-[11px] font-bold block mb-1">
                      كاهن زائر أو اسم آخر للمشاركة في الصلاة (اختياري):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أبونا بافلي / كاهن ضيف"
                      value={customPriestName}
                      onChange={(e) => setCustomPriestName(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 outline-none font-bold text-xs"
                    />
                  </div>
                </div>

                {/* 🎤 SERMON (العظة) */}
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/60 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-purple-700" />
                      <span className="text-[#00174a] font-extrabold text-xs">
                        إضافة عظة / كلمة روحية لهذه الخدمة
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
                    <div className="pt-2 border-t border-purple-200/60 space-y-3 animate-fadeIn">
                      <div>
                        <label className="text-slate-700 font-bold block mb-1.5 text-[11px]">
                          اختيار أب كاهن ملقي العظة *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {PRIEST_NAMES_LIST.map((pName) => {
                            const isSelected = sermonSpeaker === pName && !customSermonSpeaker.trim();
                            return (
                              <button
                                key={pName}
                                type="button"
                                onClick={() => {
                                  setSermonSpeaker(pName);
                                  setCustomSermonSpeaker('');
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-right flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                                }`}
                              >
                                <span className="truncate">{pName}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-2">
                          <label className="text-slate-500 text-[10px] font-bold block mb-1">
                            أو كاهن زائر / واعظ ضيف (اختياري):
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: أبونا بافلي / كاهن ضيف"
                            value={customSermonSpeaker}
                            onChange={(e) => setCustomSermonSpeaker(e.target.value)}
                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 outline-none font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-700 font-bold block mb-1 text-[11px]">
                          عنوان أو موضوع العظة (اختياري)
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: فضيلة التواضع في فكر الآباء / تأملات في إنجيل القداس"
                          value={sermonTopic}
                          onChange={(e) => setSermonTopic(e.target.value)}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 outline-none font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Notes */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: قداس الأطفال / نهضة العيد"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs shadow-md shadow-[#002366]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    {editingLiturgyId ? 'حفظ التعديلات' : 'إضافة إلى الجدول'}
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

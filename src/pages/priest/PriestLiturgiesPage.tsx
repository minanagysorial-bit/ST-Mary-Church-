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
  Volume2
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
  extraNotes: string;
}

export const parseLiturgyNotes = (notes: string | null | undefined): ParsedLiturgyInfo => {
  if (!notes) {
    return {
      priests: ['آباء الكنيسة'],
      hasSermon: false,
      sermonSpeaker: '',
      sermonTopic: '',
      extraNotes: '',
    };
  }

  let hasSermon = false;
  let sermonSpeaker = '';
  let sermonTopic = '';

  const sermonMatch = notes.match(/(?:العظة|ملقي العظة|واعظ القداس|واعظ العشية)[:\s]+([^|()]+)(?:\(([^)]+)\))?/);
  if (sermonMatch) {
    hasSermon = true;
    sermonSpeaker = sermonMatch[1].trim();
    if (sermonMatch[2]) {
      sermonTopic = sermonMatch[2].trim();
    }
  }

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
  if (sermonMatch) {
    cleanExtra = cleanExtra.replace(sermonMatch[0], '');
  }
  PRIEST_NAMES_LIST.forEach(p => {
    cleanExtra = cleanExtra.replace(new RegExp(`(?:الكهنة|الكاهن(?:\\s*المصلي)?[:\\s]+)?${p}`, 'g'), '');
  });
  cleanExtra = cleanExtra.replace(/\|/g, '').replace(/الكهنة المصلون[:\s]*/g, '').replace(/الكاهن المصلي[:\s]*/g, '').trim();

  return {
    priests,
    hasSermon,
    sermonSpeaker,
    sermonTopic,
    extraNotes: cleanExtra,
  };
};

export const PriestLiturgiesPage: React.FC = () => {
  const { profile } = useAuth();
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // 🎤 SERMON (العظة) OPTIONAL TOGGLE & SPEAKER
  const [hasSermon, setHasSermon] = useState(false);
  const [sermonSpeaker, setSermonSpeaker] = useState('ابونا مرقس ميلاد');
  const [customSermonSpeaker, setCustomSermonSpeaker] = useState('');
  const [sermonTopic, setSermonTopic] = useState('');

  const [extraNotes, setExtraNotes] = useState('');

  const ALL_DAYS_OF_WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // Calculate Current Week Dates
  const today = new Date();
  const currentMonthName = useMemo(() => {
    return today.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, []);

  const todayFullDate = useMemo(() => {
    const greg = today.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cop = getCopticDate(today);
    return {
      gregorian: greg,
      coptic: `${cop.copticDay} ${cop.copticMonthName} ${cop.copticYear} ش`
    };
  }, []);

  // Compute actual date for each day of current week
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
      if (selectedPriests.length === 1 && !customPriestName.trim()) {
        return;
      }
      setSelectedPriests(prev => prev.filter(p => p !== name));
    } else {
      setSelectedPriests(prev => [...prev, name]);
    }
  };

  const openAddModal = (defaultType: 'liturgy' | 'vespers' = 'liturgy', defaultDay: string = 'الجمعة') => {
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
    
    // Sermon resets to false by default
    setHasSermon(false);
    setSermonSpeaker('ابونا مرقس ميلاد');
    setCustomSermonSpeaker('');
    setSermonTopic('');

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

    // Combine all selected and custom priests (المصلون)
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

    // Format combined notes with all priest names + optional Sermon
    const priestPrefix = allPriests.length > 1 ? 'الكهنة المصلون' : 'الكاهن المصلي';
    const parts: string[] = [`${priestPrefix}: ${allPriests.join(' • ')}`];

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
        setSuccessMessage('تم تحديث بيانات الخدمة والكهنة والعظة بنجاح!');
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

  // Separate Fixed Weekday Liturgies from Dynamic Weekend Liturgies
  const fixedLiturgies = useMemo(() => {
    return liturgies.filter(l => ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day))
      .sort((a, b) => {
        const order = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        return order.indexOf(a.liturgy_day) - order.indexOf(b.liturgy_day);
      });
  }, [liturgies]);

  const dynamicLiturgies = useMemo(() => {
    return liturgies.filter(l => ['الجمعة', 'السبت', 'الأحد'].includes(l.liturgy_day))
      .filter(l => {
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
  }, [liturgies, dynamicFilter]);

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* ── TOP HEADER WITH TODAY'S DATE AND CURRENT WEEK STRIP ── */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-xs mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>لوحة التحكم في المواعيد الطقسية والرعوية</span>
              </div>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b] tracking-wide">
                جدول القداسات والعشيات - شهر {currentMonthName}
              </h1>
              <p className="text-xs text-slate-200 font-semibold mt-1">
                تثبيت قداسات أيام الأسبوع الرسمية، وإدارة قداسات وعشيات الجمعة والسبت والأحد وتحديد الآباء والمذابح والعظات
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => openAddModal('liturgy', 'الجمعة')}
                className="bg-[#fed65b] hover:bg-[#ffe285] text-[#00174a] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>➕ قداس إلهي</span>
              </button>

              <button
                onClick={() => openAddModal('vespers', 'السبت')}
                className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-[#fed65b]" />
                <span>➕ صلاة عشية / نهضة</span>
              </button>
            </div>
          </div>

          {/* 📅 CURRENT DATE & WEEK DAYS STRIP */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 text-xs font-bold">
              <div className="flex items-center gap-2 text-[#fed65b]">
                <Sun className="w-4 h-4" />
                <span>تاريخ اليوم: {todayFullDate.gregorian}</span>
                <span className="text-slate-300">({todayFullDate.coptic})</span>
              </div>
              <span className="text-[11px] text-slate-300">تواريخ أيام الأسبوع الحالي لتسهيل ضبط الجدول بدقة:</span>
            </div>

            {/* Week days visual cards */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold">
              {ALL_DAYS_OF_WEEK.map(dName => {
                const dayInfo = weekDayDates[dName] || { dateStr: '', isToday: false };
                const isDynamic = ['الجمعة', 'السبت', 'الأحد'].includes(dName);

                return (
                  <div
                    key={dName}
                    className={`p-2 rounded-xl border transition-all ${
                      dayInfo.isToday
                        ? 'bg-[#fed65b] text-[#00174a] border-[#fed65b] shadow-md ring-2 ring-white/40 font-extrabold'
                        : isDynamic
                        ? 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                        : 'bg-white/5 text-slate-300 border-white/10'
                    }`}
                  >
                    <span className="block text-[11px] sm:text-xs">{dName}</span>
                    <span className={`block text-[10px] sm:text-xs mt-0.5 ${dayInfo.isToday ? 'text-[#00174a]' : 'text-[#fed65b]'}`}>
                      {dayInfo.dateStr}
                    </span>
                    {dayInfo.isToday && (
                      <span className="inline-block mt-1 text-[9px] bg-[#00174a] text-white px-1.5 py-0.2 rounded-md">
                        اليوم 📍
                      </span>
                    )}
                  </div>
                );
              })}
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
                  جدول عطلة نهاية الأسبوع المتغير (الجمعة • السبت • الأحد)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                القداسات الإلهية وصلوات العشية والعظات المتغيرة أسبوعياً
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
              {[
                { id: 'all', label: `الكل (${liturgies.filter(l => ['الجمعة', 'السبت', 'الأحد'].includes(l.liturgy_day)).length})` },
                { id: 'الجمعة', label: `الجمعة (${weekDayDates['الجمعة']?.dateStr || ''})` },
                { id: 'السبت', label: `السبت (${weekDayDates['السبت']?.dateStr || ''})` },
                { id: 'الأحد', label: `الأحد (${weekDayDates['الأحد']?.dateStr || ''})` },
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
              <p className="font-bold text-slate-600">لا توجد خدمات مسجلة لهذا الفلتر</p>
              <button
                onClick={() => openAddModal('liturgy', 'الجمعة')}
                className="text-xs bg-[#002366] text-[#fed65b] font-bold px-4 py-2 rounded-xl"
              >
                ➕ إضافة قداس جديد الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicLiturgies.map(l => {
                const parsed = parseLiturgyNotes(l.notes);
                const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
                const dayDate = weekDayDates[l.liturgy_day]?.dateStr;

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
                      {/* Day & Date & Type Badge */}
                      <div className="flex items-center justify-between">
                        <span className="bg-[#002366] text-[#fed65b] px-3 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{l.liturgy_day} {dayDate && `(${dayDate})`}</span>
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

                      {/* 🎤 SERMON CHIP (If exists) */}
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
                        <span>تعديل الموعد / الكهنة / العظة</span>
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
                  القداسات الثابتة أسبوعياً (الاثنين • الثلاثاء • الأربعاء • الخميس)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                مواعيد وكهنة قداسات أيام الأسبوع الرسمية الثابتة في الكنيسة الكبيرة - مذبح العذراء
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
              const dayDate = weekDayDates[item.day]?.dateStr;

              return (
                <div
                  key={item.day}
                  className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#00174a] text-[#fed65b] px-3 py-0.5 rounded-xl font-extrabold text-xs">
                        {item.day} {dayDate && `(${dayDate})`}
                      </span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>ثابت</span>
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
                            <User className="w-3 h-3 text-[#d4af37]" />
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
                    شهر {currentMonthName} • كنيسة السيدة العذراء بمحرم بك
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
                      يوم الأسبوع * {weekDayDates[day] && <span className="text-[#002366] font-extrabold">({weekDayDates[day].dateStr})</span>}
                    </label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {ALL_DAYS_OF_WEEK.map(d => (
                        <option key={d} value={d}>
                          {d} {weekDayDates[d] ? `(${weekDayDates[d].dateStr})` : ''}
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

                {/* 🎤 SERMON (العظة) - OPTIONAL TOGGLE & SPEAKER SELECTION */}
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

                  {/* Conditional Sermon Section */}
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
                                {isSelected && <Check className="w-3 h-3 text-[#fed65b] shrink-0" />}
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

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
  Mic
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
  if (sermonMatch) cleanExtra = cleanExtra.replace(sermonMatch[0], '');
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

  // Active Day Filter: 'all' | 'الجمعة' | 'السبت' | 'الأحد' | 'الاثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس'
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');

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

  const [extraNotes, setExtraNotes] = useState('');

  const ALL_DAYS_ORDER = ['الجمعة', 'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  // Current Date Calculation
  const today = new Date();
  const todayFullDate = useMemo(() => {
    const greg = today.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const cop = getCopticDate(today);
    return {
      gregorian: greg,
      coptic: `${cop.copticDay} ${cop.copticMonthName} ${cop.copticYear} ش`
    };
  }, []);

  // Compute dates for each day in current week
  const weekDayDates = useMemo(() => {
    const datesMap: Record<string, { dateStr: string; isToday: boolean }> = {};
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0: Sunday ... 6: Saturday
    const dayIndices: Record<string, number> = {
      'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6
    };

    ALL_DAYS_ORDER.forEach(dName => {
      const targetIdx = dayIndices[dName] ?? 0;
      const diff = targetIdx - currentDayOfWeek;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + diff);

      datesMap[dName] = {
        dateStr: targetDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
        isToday: targetIdx === currentDayOfWeek
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
    
    // Sermon defaults to false
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

  const handleSyncFixedWeekdays = async () => {
    if (!window.confirm('هل تريد تثبيت قداسات (الاثنين - الثلاثاء - الأربعاء - الخميس) بالمواعيد الرسمية؟')) return;
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

  // Filtered Liturgies based on Selected Day Tab
  const displayLiturgies = useMemo(() => {
    return liturgies
      .filter(l => {
        if (selectedDayTab === 'all') return true;
        return l.liturgy_day === selectedDayTab;
      })
      .sort((a, b) => {
        const dayDiff = ALL_DAYS_ORDER.indexOf(a.liturgy_day) - ALL_DAYS_ORDER.indexOf(b.liturgy_day);
        if (dayDiff !== 0) return dayDiff;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [liturgies, selectedDayTab]);

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-6 font-cairo text-right" dir="rtl">
        
        {/* ── 1. ULTRA-CLEAN HEADER & TODAY'S DATE BADGE ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-tajawal text-xl sm:text-2xl font-black text-[#002366]">
                جدول القداسات والعشيات
              </h1>
            </div>

            {/* ☀️ Crystal Clear Today's Date */}
            <div className="inline-flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#00174a]">
              <Sun className="w-4 h-4 text-[#d4af37]" />
              <span>اليوم الحالي:</span>
              <span className="font-black text-[#002366]">{todayFullDate.gregorian}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-900 font-extrabold">{todayFullDate.coptic}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleSyncFixedWeekdays}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="تثبيت مواعيد الاثنين إلى الخميس الرسمية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تثبيت الثوابت ⚡</span>
            </button>

            <button
              onClick={() => openAddModal('liturgy', selectedDayTab !== 'all' ? selectedDayTab : 'الجمعة')}
              className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#002366]/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ إضافة قداس / عشية</span>
            </button>
          </div>
        </div>

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

        {/* ── 2. SEAMLESS DAYS BAR (الأيام بوضوح تام مع تواريخها) ── */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedDayTab('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDayTab === 'all'
                ? 'bg-[#002366] text-[#fed65b] font-black shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            🌟 كل الأيام ({liturgies.length})
          </button>

          {ALL_DAYS_ORDER.map(dName => {
            const dayInfo = weekDayDates[dName] || { dateStr: '', isToday: false };
            const isSelected = selectedDayTab === dName;
            const count = liturgies.filter(l => l.liturgy_day === dName).length;
            const isFixed = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(dName);

            return (
              <button
                key={dName}
                onClick={() => setSelectedDayTab(dName)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#002366] text-[#fed65b] border-[#002366] font-black shadow-xs'
                    : dayInfo.isToday
                    ? 'bg-amber-50 text-[#00174a] border-amber-300 font-extrabold'
                    : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span>{dName}</span>
                <span className={`text-[10px] ${isSelected ? 'text-[#fed65b]' : 'text-slate-400'}`}>
                  ({dayInfo.dateStr})
                </span>
                {dayInfo.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" title="اليوم" />
                )}
                {isFixed && (
                  <span title="قداس ثابت"><Lock className="w-2.5 h-2.5 opacity-60" /></span>
                )}
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3. LITURGIES CARDS GRID ── */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 font-bold border border-slate-200">
            جاري تحميل القداسات...
          </div>
        ) : displayLiturgies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">لا توجد خدمات مسجلة ليوم ({selectedDayTab})</p>
            <button
              onClick={() => openAddModal('liturgy', selectedDayTab !== 'all' ? selectedDayTab : 'الجمعة')}
              className="text-xs bg-[#002366] text-[#fed65b] font-bold px-4 py-2 rounded-xl"
            >
              ➕ إضافة قداس لهذا اليوم الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayLiturgies.map(l => {
              const parsed = parseLiturgyNotes(l.notes);
              const isVesper = l.title.includes('عشية') || l.title.includes('نهضة') || l.title.includes('تسبيحة');
              const isFixed = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].includes(l.liturgy_day);
              const dayDate = weekDayDates[l.liturgy_day]?.dateStr;

              return (
                <div
                  key={l.id}
                  className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${
                    isVesper
                      ? 'border-purple-200 bg-purple-50/20'
                      : isFixed
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 hover:border-[#d4af37]/40'
                  }`}
                >
                  <div className="space-y-3">
                    
                    {/* Top Row: Day & Type Badges */}
                    <div className="flex items-center justify-between">
                      <span className="bg-[#002366] text-[#fed65b] px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{l.liturgy_day} {dayDate && `(${dayDate})`}</span>
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                        isVesper
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : isFixed
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}>
                        {isVesper ? 'صلاة عشية 🕯️' : isFixed ? 'قداس ثابت 🔒' : 'قداس إلهي ⛪'}
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

                    {/* Priests (المصلون) */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">الآباء الكهنة المصلون:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.priests.map((p, idx) => (
                          <span
                            key={idx}
                            className="bg-amber-50 text-amber-950 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <User className="w-3 h-3 text-[#d4af37]" />
                            <span>{p}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 🎤 SERMON CHIP (إن وجدت) */}
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

        {/* ══════════════════════════════════════════════════════════════
            4. ULTRA-SIMPLE ADD / EDIT MODAL (نافذة مبسطة جداً)
        ══════════════════════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
              
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

                {/* 2. عنوان الخدمة ويوم الأسبوع */}
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
                    <label className="text-slate-700 font-bold block">
                      يوم الأسبوع * {weekDayDates[day] && <span className="text-[#002366] font-black mr-1">({weekDayDates[day].dateStr})</span>}
                    </label>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none font-bold text-xs focus:border-[#002366]"
                    >
                      {ALL_DAYS_ORDER.map(d => (
                        <option key={d} value={d}>
                          {d} {weekDayDates[d] ? `(${weekDayDates[d].dateStr})` : ''} {weekDayDates[d]?.isToday ? '• (اليوم 📍)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. التوقيت */}
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

                {/* 4. الكنيسة والمذبح المحدد */}
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

                {/* 5. الآباء الكهنة المصلون */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[#00174a] font-black flex items-center gap-1 text-xs">
                      <User className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>الآباء الكهنة المصلون *</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-bold">
                      تم اختيار ({selectedPriests.length + (customPriestName.trim() ? 1 : 0)})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PRIEST_NAMES_LIST.map((pName) => {
                      const isSelected = selectedPriests.includes(pName);
                      return (
                        <button
                          key={pName}
                          type="button"
                          onClick={() => togglePriest(pName)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-right flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-xs font-black'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{pName}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#fed65b] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. العظة (اختياري بنقرة واحدة) */}
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

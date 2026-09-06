import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  Sun,
  Sparkles,
  User,
  Heart,
  Mic,
  BookmarkCheck,
  AlertCircle,
  X,
  Printer,
  CalendarDays,
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Phone
} from 'lucide-react';
import { Liturgy, Sermon, ChurchService } from '../../lib/database.types';
import { PRIEST_NAMES_LIST, OFFICIAL_ALTAR_CHOICES } from '../../pages/priest/PriestLiturgiesPage';
import {
  PriestPersonalEvent,
  UnifiedPriestDuty,
  PriestEventType,
  getStoredPriestEvents,
  savePriestCustomEvent,
  deletePriestCustomEvent,
  aggregatePriestSchedule,
  createGoogleCalendarUrl,
  downloadIcsSchedule,
  printPriestSchedule,
  formatArabicTime,
  getPriestDailySummary,
  ALL_DAYS_ORDER
} from '../../lib/priestAgendaHelper';

interface Props {
  liturgies: Liturgy[];
  sermons?: Sermon[];
  services?: ChurchService[];
  currentPriestName?: string;
}

export const PriestWeeklyAgendaCard: React.FC<Props> = ({
  liturgies,
  sermons = [],
  services = [],
  currentPriestName = 'ابونا مرقس ميلاد',
}) => {
  // Active Priest Selection
  const initialPriest = useMemo(() => {
    const matched = PRIEST_NAMES_LIST.find(p => currentPriestName.includes(p) || p.includes(currentPriestName));
    return matched || PRIEST_NAMES_LIST[0];
  }, [currentPriestName]);

  const [selectedPriest, setSelectedPriest] = useState<string>(initialPriest);
  const [customEvents, setCustomEvents] = useState<PriestPersonalEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Active View Tab: 'today' | 'week' | 'all_events'
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all_events'>('today');

  // Filter for 'all_events' tab
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Form State
  const [eventType, setEventType] = useState<PriestEventType>('wedding');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDay, setEventDay] = useState('الجمعة');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [location, setLocation] = useState('الكنيسة الكبيرة - صالة الأكاليل');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Load custom events for active priest
  const loadEvents = () => {
    const evts = getStoredPriestEvents(selectedPriest);
    setCustomEvents(evts);
  };

  useEffect(() => {
    loadEvents();
  }, [selectedPriest]);

  // Aggregate unified duties
  const { allDuties, todayDuties, weekDutiesByDay, stats } = useMemo(() => {
    return aggregatePriestSchedule(selectedPriest, liturgies, sermons, services, customEvents);
  }, [selectedPriest, liturgies, sermons, services, customEvents]);

  // Handle Add Custom Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    savePriestCustomEvent({
      priest_name: selectedPriest,
      event_type: eventType,
      title: eventTitle.trim(),
      date: eventDate,
      day_name: eventDay,
      start_time: startTime,
      end_time: endTime,
      location: location.trim() || 'كنيسة السيدة العذراء مريم بمحرم بك',
      contact_phone: contactPhone.trim(),
      notes: notes.trim(),
    });

    setNotificationMsg(`تمت إضافة "${eventTitle}" إلى جدول ${selectedPriest} بنجاح!`);
    loadEvents();
    setShowAddModal(false);
    resetForm();
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${title}" من جدول ${selectedPriest}؟`)) return;
    deletePriestCustomEvent(selectedPriest, id);
    loadEvents();
    setNotificationMsg(`تم حذف الموعد بنجاح.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const resetForm = () => {
    setEventType('wedding');
    setEventTitle('');
    setEventDay('الجمعة');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStartTime('18:00');
    setEndTime('19:30');
    setLocation('الكنيسة الكبيرة - صالة الأكاليل');
    setContactPhone('');
    setNotes('');
  };

  const getBadgeForType = (type: PriestEventType) => {
    switch (type) {
      case 'liturgy':
        return { label: 'قداس إلهي ⛪', bg: 'bg-blue-100 text-[#002366] border-blue-300 font-black' };
      case 'vespers':
        return { label: 'صلاة عشية 🕯️', bg: 'bg-purple-100 text-purple-950 border-purple-300 font-black' };
      case 'wedding':
        return { label: 'إكليل وفرح 💍', bg: 'bg-amber-100 text-amber-950 border-amber-400 font-black' };
      case 'baptism':
        return { label: 'معمودية 🕊️', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black' };
      case 'confession':
        return { label: 'جلسة اعتراف ✝️', bg: 'bg-indigo-100 text-indigo-950 border-indigo-300 font-black' };
      case 'visitation':
        return { label: 'افتقاد وزيارة 🏠', bg: 'bg-rose-100 text-rose-950 border-rose-300 font-black' };
      case 'unction':
        return { label: 'صلاة قنديل 🌿', bg: 'bg-teal-100 text-teal-950 border-teal-300 font-black' };
      case 'meeting':
        return { label: 'اجتماع خدمة 👥', bg: 'bg-cyan-100 text-cyan-950 border-cyan-300 font-black' };
      case 'sermon':
        return { label: 'عظة وكلمة 🎤', bg: 'bg-orange-100 text-orange-950 border-orange-300 font-black' };
      default:
        return { label: 'موعد كنسي 📅', bg: 'bg-slate-100 text-slate-800 border-slate-300 font-black' };
    }
  };

  // Filtered duties for all_events tab
  const filteredDuties = useMemo(() => {
    return allDuties.filter(d => {
      const matchType = filterType === 'all' || d.dutyType === filterType;
      const matchQuery = !searchQuery || 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [allDuties, filterType, searchQuery]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border-2 border-slate-200 shadow-md space-y-6 font-cairo text-right" dir="rtl">
      
      {/* ── 1. HEADER & SENIOR-FRIENDLY PRIEST SELECTOR ── */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#002366] to-[#00174a] text-[#fed65b] flex items-center justify-center font-black shadow-md shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-tajawal text-xl sm:text-2xl font-black text-[#002366]">
                جدول ومسؤوليات قدس أبونا الأسبوعية
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold">
                القداسات، العشيات، الأكاليل، المعموديات، والاجتماعات المخصصة لقدسه.
              </p>
            </div>
          </div>

          {/* Action Buttons (Elderly Friendly) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add Appointment Button */}
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c5a030] hover:to-[#eec54f] text-[#00174a] font-black text-xs sm:text-sm px-4 py-2.5 sm:py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-300"
            >
              <Plus className="w-4 h-4 text-[#00174a]" />
              <span>إضافة فرح / معمودية / موعد</span>
            </button>

            {/* Print Schedule Button */}
            <button
              onClick={() => printPriestSchedule(selectedPriest, allDuties)}
              className="bg-slate-100 hover:bg-slate-200 text-[#002366] font-bold text-xs sm:text-sm px-3.5 py-2.5 sm:py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="طباعة جدول قدس أبونا بصيغة ورقية منسقة A4"
            >
              <Printer className="w-4 h-4 text-[#002366]" />
              <span>طباعة الجدول 🖨️</span>
            </button>

            {/* Export iCal for Apple & Android */}
            <button
              onClick={() => downloadIcsSchedule(allDuties, `جدول_${selectedPriest.replace(/\s+/g, '_')}.ics`)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-3.5 py-2.5 sm:py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="تنزيل ملف تقويم لموبايل الآيفون والأندرويد"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>حفظ في الهاتف (iCal) 📲</span>
            </button>
          </div>
        </div>

        {/* Big Priest Selector Chips Bar */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-black text-[#002366] flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#d4af37]" />
            <span>اختر قدس الأب الكاهن لعرض وتعديل جدوله الشخصي:</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRIEST_NAMES_LIST.map(priest => {
              const isSelected = selectedPriest === priest;
              return (
                <button
                  key={priest}
                  onClick={() => setSelectedPriest(priest)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 border-2 ${
                    isSelected
                      ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-md scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-sm">✝️</span>
                  <span>{priest}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#fed65b]" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-2xl text-sm font-black flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── 2. DAILY SPIRITUAL SUMMARY BANNER ── */}
      <div className="bg-gradient-to-r from-blue-50 via-amber-50/60 to-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-[#002366]">
          <Sun className="w-5 h-5 text-[#d4af37] shrink-0" />
          <span>{getPriestDailySummary(selectedPriest, todayDuties)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-slate-600 shrink-0">
          <span className="bg-white px-3 py-1 rounded-xl border border-slate-200">
            إجمالي الأسبوع: <strong className="text-[#002366]">{allDuties.length}</strong>
          </span>
        </div>
      </div>

      {/* ── 3. VIEW MODE TABS (اليوم / جدول الأسبوع / كل المواعيد) ── */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 sm:px-6 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
            activeTab === 'today'
              ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm'
              : 'text-slate-600 hover:text-[#002366] hover:bg-slate-50 border-transparent'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>جدول قدس أبونا اليوم ({todayDuties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('week')}
          className={`px-4 sm:px-6 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
            activeTab === 'week'
              ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm'
              : 'text-slate-600 hover:text-[#002366] hover:bg-slate-50 border-transparent'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>الجدول الأسبوعي المنظم</span>
        </button>

        <button
          onClick={() => setActiveTab('all_events')}
          className={`px-4 sm:px-6 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
            activeTab === 'all_events'
              ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm'
              : 'text-slate-600 hover:text-[#002366] hover:bg-slate-50 border-transparent'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>كل المواعيد والمناسبات ({allDuties.length})</span>
        </button>
      </div>

      {/* ── TAB 1: TODAY'S DUTIES (جدول اليوم) ── */}
      {activeTab === 'today' && (
        <div className="space-y-4 pt-2">
          {todayDuties.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
              <Sun className="w-12 h-12 text-[#d4af37] mx-auto opacity-70" />
              <h3 className="font-tajawal text-base sm:text-lg font-black text-[#002366]">
                لا توجد قداسات أو مواعيد مسجلة لقدس أبونا اليوم
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-md mx-auto">
                يوم مبارك ومقدس .. يمكنك إضافة موعد خاص أو إكليل أو معمودية بالضغط على الزر بالأسفل.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setEventDay(new Date().toLocaleDateString('ar-EG', { weekday: 'long' }));
                  setShowAddModal(true);
                }}
                className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة موعد لليوم</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayDuties.map(duty => {
                const badge = getBadgeForType(duty.dutyType);
                const gCalUrl = createGoogleCalendarUrl(duty);

                return (
                  <div
                    key={duty.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-md flex flex-col justify-between gap-4 hover:border-amber-400 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-xl text-xs border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                          <Clock className="w-4 h-4 text-[#d4af37]" />
                          <span>من {formatArabicTime(duty.startTime)} إلى {formatArabicTime(duty.endTime)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-tajawal text-base sm:text-lg font-black text-[#00174a] leading-snug">
                        {duty.title}
                      </h4>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-bold">
                        <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span>{duty.location}</span>
                      </div>

                      {/* Details / Co-celebrants */}
                      {duty.description && (
                        <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                          {duty.description}
                        </p>
                      )}

                      {/* Contact Phone */}
                      {duty.contactPhone && (
                        <div className="flex items-center gap-2 text-xs font-black text-blue-900 bg-blue-50 p-2 rounded-lg">
                          <Phone className="w-3.5 h-3.5 text-blue-700" />
                          <span>هاتف المخدوم: {duty.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-50 hover:bg-blue-100 text-[#002366] text-xs sm:text-sm font-black px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200"
                        title="إضافة هذا الميعاد إلى Google Calendar مباشرة"
                      >
                        <Calendar className="w-4 h-4 text-blue-700" />
                        <span>إضافة لـ Google Calendar 📅</span>
                      </a>

                      {duty.canEditOrDelete && (
                        <button
                          onClick={() => handleDeleteEvent(duty.id, duty.title)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="حذف هذا الموعد"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
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

      {/* ── TAB 2: FULL WEEK-AT-A-GLANCE (جدول الأسبوع المنظم) ── */}
      {activeTab === 'week' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ALL_DAYS_ORDER.map(dayName => {
              const dayDuties = weekDutiesByDay[dayName] || [];
              const isToday = new Date().toLocaleDateString('ar-EG', { weekday: 'long' }) === dayName;

              return (
                <div
                  key={dayName}
                  className={`rounded-3xl p-4 sm:p-5 border-2 flex flex-col justify-between gap-3 transition-all ${
                    isToday
                      ? 'bg-amber-50/60 border-amber-400 shadow-md'
                      : dayDuties.length > 0
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black ${
                          isToday ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-200 text-[#00174a]'
                        }`}>
                          {dayName}
                        </span>
                        {isToday && (
                          <span className="bg-amber-400 text-[#00174a] text-[10px] px-2 py-0.5 rounded-md font-black animate-pulse">
                            اليوم 📍
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {dayDuties.length} خدمات
                      </span>
                    </div>

                    {/* Duties List */}
                    {dayDuties.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-bold">
                        لا توجد مواعيد
                      </div>
                    ) : (
                      <div className="space-y-3 pt-3">
                        {dayDuties.map(d => {
                          const badge = getBadgeForType(d.dutyType);
                          const gCal = createGoogleCalendarUrl(d);

                          return (
                            <div
                              key={d.id}
                              className="bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 space-y-2 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[11px] text-slate-700 font-black">
                                  {formatArabicTime(d.startTime)}
                                </span>
                              </div>

                              <div className="font-tajawal font-black text-xs sm:text-sm text-[#00174a]">
                                {d.title}
                              </div>

                              <div className="text-[11px] text-slate-600 font-semibold truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                                <span>{d.location}</span>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                                <a
                                  href={gCal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:text-blue-900 font-black flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Google Cal</span>
                                </a>

                                {d.canEditOrDelete && (
                                  <button
                                    onClick={() => handleDeleteEvent(d.id, d.title)}
                                    className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Event in this day */}
                  <button
                    onClick={() => {
                      resetForm();
                      setEventDay(dayName);
                      setShowAddModal(true);
                    }}
                    className="w-full text-center text-xs text-[#002366] hover:text-blue-900 font-black py-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer mt-2 shadow-2xs"
                  >
                    + إضافة موعد في {dayName}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: ALL UPCOMING EVENTS & SEARCH (كل المواعيد) ── */}
      {activeTab === 'all_events' && (
        <div className="space-y-4 pt-2">
          {/* Filter Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث في المواعيد، الأكاليل، المعموديات، والمكان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-[#002366]"
              />
            </div>

            {/* Type Filter Select */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#002366]" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-[#002366] outline-none cursor-pointer"
              >
                <option value="all">كل أنواع الخدمات والمواعيد</option>
                <option value="liturgy">قداسات إلهية ⛪</option>
                <option value="vespers">عشيات ونهضات 🕯️</option>
                <option value="wedding">أكاليل وأفراح 💍</option>
                <option value="baptism">معموديات 🕊️</option>
                <option value="confession">جلسات اعتراف ✝️</option>
                <option value="visitation">افتقاد وزيارة مريض 🏠</option>
                <option value="meeting">اجتماعات وخدمات 👥</option>
                <option value="sermon">عظات وكلمات 🎤</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          {filteredDuties.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-2xl font-bold text-xs">
              لا توجد مواعيد مطابقة للبحث
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-[#002366] text-[#fed65b] border-b border-slate-200">
                    <th className="p-3.5 font-black">اليوم والتاريخ</th>
                    <th className="p-3.5 font-black">الموعد</th>
                    <th className="p-3.5 font-black">النوع والخدمة</th>
                    <th className="p-3.5 font-black">المكان / المذبح</th>
                    <th className="p-3.5 font-black">الملاحظات</th>
                    <th className="p-3.5 font-black text-center">التقويم والإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDuties.map(d => {
                    const badge = getBadgeForType(d.dutyType);
                    const gCal = createGoogleCalendarUrl(d);

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <strong className="text-[#00174a]">{d.dayName}</strong>
                          {d.dateStr && <div className="text-[11px] text-slate-400">{d.dateStr}</div>}
                        </td>
                        <td className="p-3.5 text-slate-700 font-black">
                          {formatArabicTime(d.startTime)} - {formatArabicTime(d.endTime)}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <div className="font-bold text-[#00174a] mt-0.5">{d.title}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-bold">{d.location}</td>
                        <td className="p-3.5 text-slate-500 max-w-xs truncate">{d.description || '-'}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={gCal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-50 text-blue-900 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1"
                              title="إضافة لجوجل كالندر"
                            >
                              <Calendar className="w-3 h-3 text-blue-700" />
                              <span>جوجل</span>
                            </a>
                            {d.canEditOrDelete && (
                              <button
                                onClick={() => handleDeleteEvent(d.id, d.title)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 4. MODAL: ADD CUSTOM PRIEST EVENT / WEDDING / MEETING ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#00113a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border-2 border-[#d4af37]/40 animate-scaleUp my-auto">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#002366] to-[#00174a] text-white p-5 flex items-center justify-between border-b border-amber-400/30">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-[#fed65b]" />
                <h3 className="font-tajawal text-base sm:text-lg font-black text-[#fed65b]">
                  إضافة مناسبة / موعد لقدس {selectedPriest}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs sm:text-sm font-semibold max-h-[80vh] overflow-y-auto">
              
              {/* Event Type Grid */}
              <div className="space-y-1.5">
                <label className="text-[#002366] font-black block text-xs sm:text-sm">نوع المناسبة / الموعد *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'wedding' as PriestEventType, label: 'إكليل وفرح 💍' },
                    { type: 'baptism' as PriestEventType, label: 'معمودية 🕊️' },
                    { type: 'liturgy' as PriestEventType, label: 'قداس إضافي ⛪' },
                    { type: 'vespers' as PriestEventType, label: 'عشية وتمجيد 🕯️' },
                    { type: 'confession' as PriestEventType, label: 'جلسة اعتراف ✝️' },
                    { type: 'visitation' as PriestEventType, label: 'افتقاد مريض 🏠' },
                    { type: 'unction' as PriestEventType, label: 'صلاة قنديل 🌿' },
                    { type: 'meeting' as PriestEventType, label: 'اجتماع خدمة 👥' },
                    { type: 'sermon' as PriestEventType, label: 'عظة وكلمة 🎤' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setEventType(item.type);
                        if (item.type === 'wedding') {
                          setLocation('الكنيسة الكبيرة - صالة الأكاليل');
                          setStartTime('18:00');
                          setEndTime('19:30');
                        } else if (item.type === 'baptism') {
                          setLocation('قاعة المعمودية المقدسة');
                          setStartTime('10:00');
                          setEndTime('11:30');
                        } else if (item.type === 'liturgy') {
                          setLocation('الكنيسة الكبيرة - مذبح العذراء');
                          setStartTime('07:00');
                          setEndTime('09:00');
                        }
                      }}
                      className={`p-2.5 rounded-xl text-center font-black border-2 transition-all cursor-pointer text-xs ${
                        eventType === item.type
                          ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm scale-102'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Title */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block text-xs sm:text-sm">
                  عنوان المناسبة / اسم المخدوم أو العروسين *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إكليل الشماس مينا وسارة / معمودية الطفل كيرلس / اعتراف أسرة ماريان"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* Day & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block text-xs">يوم الأسبوع *</label>
                  <select
                    value={eventDay}
                    onChange={(e) => setEventDay(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                  >
                    {ALL_DAYS_ORDER.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block text-xs">التاريخ المحدد *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (e.target.value) {
                        const dName = new Date(e.target.value).toLocaleDateString('ar-EG', { weekday: 'long' });
                        if (ALL_DAYS_ORDER.includes(dName)) setEventDay(dName);
                      }
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block text-xs">من الساعة *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-800 font-bold block text-xs">إلى الساعة *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>
              </div>

              {/* Location Presets */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block text-xs">المكان / القاعة / المذبح *</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[
                    'الكنيسة الكبيرة - مذبح العذراء',
                    'الكنيسة الكبيرة - صالة الأكاليل',
                    'قاعة المعمودية المقدسة',
                    'كنيسة الملاك ميخائيل',
                    'كنيسة الأنبا أنطونيوس',
                    'مبنى الخدمات والأنشطة',
                    'منزل المخدوم'
                  ].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`text-[11px] px-2 py-1 rounded-lg border font-bold ${
                        location === loc
                          ? 'bg-[#002366] text-[#fed65b] border-[#002366]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="المكان أو العنوان..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block text-xs">رقم هاتف المخدوم / العروسين (اختياري)</label>
                <input
                  type="tel"
                  placeholder="مثال: 01223456789"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-800 font-bold block text-xs">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل أخرى خاصة بالموعد..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الموعد في الجدول 💾</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default PriestWeeklyAgendaCard;

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
  Bell,
  Check
} from 'lucide-react';
import { Liturgy, Sermon, ChurchService } from '../../lib/database.types';
import { PRIEST_NAMES_LIST } from '../../pages/priest/PriestLiturgiesPage';
import {
  PriestPersonalEvent,
  UnifiedPriestDuty,
  PriestEventType,
  getStoredPriestEvents,
  savePriestCustomEvent,
  deletePriestCustomEvent,
  aggregatePriestSchedule,
  createGoogleCalendarUrl,
  downloadIcsSchedule
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

  // Modal Form State
  const [eventType, setEventType] = useState<PriestEventType>('wedding');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDay, setEventDay] = useState('الجمعة');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [location, setLocation] = useState('الكنيسة الكبيرة - صالة الأكاليل');
  const [notes, setNotes] = useState('');

  const ALL_DAYS_ORDER = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Load custom events for active priest
  const loadEvents = () => {
    const evts = getStoredPriestEvents(selectedPriest);
    setCustomEvents(evts);
  };

  useEffect(() => {
    loadEvents();
  }, [selectedPriest]);

  // Aggregate unified duties
  const { allDuties, todayDuties, weekDutiesByDay } = useMemo(() => {
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
      notes: notes.trim(),
    });

    setNotificationMsg(`تمت إضافة "${eventTitle}" إلى جدول ${selectedPriest} بنجاح!`);
    loadEvents();
    setShowAddModal(false);
    resetForm();
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${title}" من جدول ${selectedPriest}؟`)) return;
    deletePriestCustomEvent(selectedPriest, id);
    loadEvents();
    setNotificationMsg(`تم حذف الموعد بنجاح.`);
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  const resetForm = () => {
    setEventType('wedding');
    setEventTitle('');
    setEventDay('الجمعة');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStartTime('18:00');
    setEndTime('19:30');
    setLocation('الكنيسة الكبيرة - صالة الأكاليل');
    setNotes('');
  };

  const formatArabicTime = (time: string) => {
    if (!time) return '';
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const suffix = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutesStr} ${suffix}`;
  };

  const getBadgeForType = (type: PriestEventType) => {
    switch (type) {
      case 'liturgy':
        return { label: 'قداس إلهي ⛪', bg: 'bg-blue-50 text-blue-900 border-blue-200' };
      case 'vespers':
        return { label: 'صلاة عشية 🕯️', bg: 'bg-purple-50 text-purple-900 border-purple-200' };
      case 'wedding':
        return { label: 'إكليل وفرح 💍', bg: 'bg-amber-50 text-amber-950 border-amber-300' };
      case 'baptism':
        return { label: 'معمودية 🕊️', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      case 'meeting':
        return { label: 'اجتماع خدمة 👥', bg: 'bg-cyan-50 text-cyan-900 border-cyan-200' };
      case 'sermon':
        return { label: 'عظة وكلمة 🎤', bg: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
      case 'visitation':
        return { label: 'افتقاد خاص 🏠', bg: 'bg-rose-50 text-rose-900 border-rose-200' };
      case 'unction':
        return { label: 'صلاة قنديل ✝️', bg: 'bg-teal-50 text-teal-900 border-teal-200' };
      default:
        return { label: 'موعد كنسي 📅', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6 font-cairo text-right" dir="rtl">
      
      {/* ── 1. HEADER: PRIEST SELECTOR & ACTION BUTTONS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-black shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tajawal text-xl font-black text-[#002366] flex items-center gap-2">
                <span>جدول ومسؤوليات قدس أبونا الأسبوعية</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                القداسات، العشيات، الأكاليل، المعموديات، والاجتماعات المخصصة لقدسه.
              </p>
            </div>
          </div>
        </div>

        {/* Priest Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Priest Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <User className="w-4 h-4 text-[#002366] mr-1" />
            <select
              value={selectedPriest}
              onChange={(e) => setSelectedPriest(e.target.value)}
              className="bg-transparent font-black text-xs text-[#002366] outline-none cursor-pointer"
            >
              {PRIEST_NAMES_LIST.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Add Custom Event Button */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>➕ إضافة فرح / معمودية / ميعاد</span>
          </button>

          {/* Export to ICS Button */}
          <button
            onClick={() => downloadIcsSchedule(allDuties, `جدول_${selectedPriest.replace(/\s+/g, '_')}.ics`)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="تنزيل ملف تقويم لموبايل الآيفون والأندرويد"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير التقويم (iCal / Apple) 📲</span>
          </button>

        </div>
      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── 2. TODAY'S HIGHLIGHTED AGENDA CARD (جدول قدس أبونا اليوم) ── */}
      <div className={`p-5 rounded-3xl border transition-all ${
        todayDuties.length > 0
          ? 'bg-gradient-to-r from-amber-50/80 via-blue-50/40 to-amber-50/80 border-amber-300 shadow-sm'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-tajawal text-base font-black text-[#002366] flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-[#d4af37]" />
              <span>جدول ومسؤوليات {selectedPriest} اليوم:</span>
            </h3>
          </div>

          <span className="text-xs bg-[#002366] text-[#fed65b] px-3 py-1 rounded-xl font-black self-start sm:self-auto shadow-2xs">
            ({todayDuties.length}) خدمات ومواعيد مقررة اليوم
          </span>
        </div>

        {todayDuties.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 font-bold">
            🕊️ لا توجد قداسات أو مواعيد مسجلة لقدس أبونا اليوم .. يوم مبارك ومقدس.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            {todayDuties.map(duty => {
              const badge = getBadgeForType(duty.dutyType);
              const gCalUrl = createGoogleCalendarUrl(duty);

              return (
                <div key={duty.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 font-black">
                        <Clock className="w-3 h-3 text-[#d4af37]" />
                        <span>{formatArabicTime(duty.startTime)} - {formatArabicTime(duty.endTime)}</span>
                      </div>
                    </div>

                    <h4 className="font-tajawal font-black text-sm text-[#00174a]">
                      {duty.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span className="truncate">{duty.location}</span>
                    </div>

                    {duty.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {duty.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <a
                      href={gCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 hover:bg-blue-100 text-[#002366] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      title="إضافة هذا الميعاد إلى Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-700" />
                      <span>إضافة لجوجل 📅</span>
                    </a>

                    {duty.canEditOrDelete && (
                      <button
                        onClick={() => handleDeleteEvent(duty.id, duty.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="حذف هذا الموعد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. FULL WEEK-AT-A-GLANCE (جدول الأسبوع بالكامل) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-tajawal text-base font-black text-[#002366] flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-[#002366]" />
            <span>الجدول الأسبوعي الكامل لقدس {selectedPriest}</span>
          </h3>
          <span className="text-xs text-slate-500 font-bold">
            إجمالي التكليفات في الأسبوع: ({allDuties.length})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ALL_DAYS_ORDER.map(dayName => {
            const dayDuties = weekDutiesByDay[dayName] || [];
            const isToday = new Date().toLocaleDateString('ar-EG', { weekday: 'long' }) === dayName;

            return (
              <div
                key={dayName}
                className={`p-4 rounded-3xl border flex flex-col justify-between gap-3 ${
                  isToday
                    ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                    : dayDuties.length > 0
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div>
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                        isToday ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-[#00174a]'
                      }`}>
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="bg-amber-400 text-[#00174a] text-[10px] px-1.5 py-0.2 rounded font-black">
                          اليوم 📍
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold">
                      ({dayDuties.length})
                    </span>
                  </div>

                  {/* Day Duties List */}
                  {dayDuties.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-slate-400 font-semibold">
                      لا توجد مواعيد
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-3">
                      {dayDuties.map(d => {
                        const badge = getBadgeForType(d.dutyType);
                        const gCal = createGoogleCalendarUrl(d);

                        return (
                          <div
                            key={d.id}
                            className="bg-slate-50/90 hover:bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-slate-600 font-black">
                                {formatArabicTime(d.startTime)}
                              </span>
                            </div>

                            <div className="font-tajawal font-black text-xs text-[#00174a]">
                              {d.title}
                            </div>

                            <div className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
                              <span>{d.location}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                              <a
                                href={gCal}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>جوجل كالندر</span>
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

                {/* Quick Add For Day */}
                <button
                  onClick={() => {
                    resetForm();
                    setEventDay(dayName);
                    setShowAddModal(true);
                  }}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-[#002366] font-bold py-1 bg-white hover:bg-slate-100 rounded-xl border border-dashed border-slate-300 transition-colors cursor-pointer"
                >
                  + إضافة موعد في {dayName}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. MODAL: ADD CUSTOM PRIEST EVENT / WEDDING / MEETING ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
            
            <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#fed65b]" />
                <h3 className="font-tajawal text-base font-black text-[#fed65b]">
                  إضافة مناسبة / موعد خاص لـ {selectedPriest}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 text-xs font-semibold max-h-[80vh] overflow-y-auto">
              
              {/* نوع المناسبة */}
              <div className="space-y-1.5">
                <label className="text-[#002366] font-black block">نوع المناسبة / الموعد *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { type: 'wedding' as PriestEventType, label: 'إكليل وفرح 💍' },
                    { type: 'baptism' as PriestEventType, label: 'معمودية 🕊️' },
                    { type: 'meeting' as PriestEventType, label: 'اجتماع خدمة 👥' },
                    { type: 'sermon' as PriestEventType, label: 'عظة / كلمة 🎤' },
                    { type: 'unction' as PriestEventType, label: 'صلاة قنديل ✝️' },
                    { type: 'visitation' as PriestEventType, label: 'افتقاد خاص 🏠' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setEventType(item.type)}
                      className={`p-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                        eventType === item.type
                          ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* عنوان المناسبة */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">عنوان المناسبة / اسم المخدوم أو العروسين *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إكليل الشماس مينا و سارة / معمودية الطفل بيتر"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* اليوم والتاريخ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">يوم الأسبوع *</label>
                  <select
                    value={eventDay}
                    onChange={(e) => setEventDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                  >
                    {ALL_DAYS_ORDER.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">التاريخ المحدد *</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>
              </div>

              {/* المواعيد */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">من الساعة *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">إلى الساعة *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                  />
                </div>
              </div>

              {/* المكان */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">المكان / القاعة / العنوان *</label>
                <input
                  type="text"
                  placeholder="الكنيسة الكبيرة - صالة الأكاليل / منزل الأسرة"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* ملاحظات إضافية */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">ملاحظات خاصة (اختياري):</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل خاصة بالموعد..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-black text-xs shadow-md shadow-[#002366]/20 transition-all active:scale-95 cursor-pointer"
                >
                  💾 حفظ الموعد في الجدول
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

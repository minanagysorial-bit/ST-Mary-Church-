import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Shield,
  Church,
  Users,
  UserCheck,
  Edit2,
  Check,
  X,
  Plus,
  Save,
  ChevronLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  FolderOpen,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { api, Profile, ChurchServiceCategory } from '../../lib/api';
import { useToast } from '../../components/common/Toast';
import { 
  type DayOfWeekArabic, 
  type ServiceScheduleConfig,
  DEFAULT_SERVICE_SCHEDULES 
} from '../../lib/attendanceStatusHelper';

const APPROVED_CATEGORIES: { category: ChurchServiceCategory; icon: string; description: string }[] = [
  { category: 'ابتدائي بنين', icon: 'boy', description: 'خدمة مرحلة ابتدائي للبنين (الجمعة 2:30 ظهراً)' },
  { category: 'ابتدائي بنات', icon: 'girl', description: 'خدمة مرحلة ابتدائي للبنات (الجمعة 10:30 صباحاً)' },
  { category: 'فتيان إعدادي', icon: 'school', description: 'خدمة فتيان المرحلة الإعدادية (الجمعة 4:30 مساءً)' },
  { category: 'فتيات إعدادي', icon: 'school', description: 'خدمة فتيات المرحلة الإعدادية (الجمعة 11:00 صباحاً)' },
  { category: 'شباب ثانوي', icon: 'groups', description: 'خدمة شباب المرحلة الثانوية (الجمعة 9:00 صباحاً)' },
  { category: 'شابات ثانوي', icon: 'groups_2', description: 'خدمة شابات المرحلة الثانوية (الخميس 6:00 مساءً)' },
  { category: 'خدمة شباب جامعة', icon: 'local_library', description: 'خدمة الشباب والطلبة الجامعيين (الثلاثاء 7:00 مساءً)' },
  { category: 'خدمة شابات جامعة', icon: 'local_library', description: 'خدمة الشابات والطالبات الجامعيات (الخميس 7:00 مساءً)' },
  { category: 'خريجين', icon: 'work', description: 'خدمة الخريجين وسوق العمل والمهنيين (الأحد 7:00 مساءً)' },
  { category: 'عرس قانا الجليل', icon: 'favorite', description: 'خدمة المقبلين على الزواج والمتزوجين حديثاً (الأربعاء 7:00 مساءً)' },
];

const DAYS_LIST: DayOfWeekArabic[] = [
  'الجمعة',
  'الأحد',
  'السبت',
  'الخميس',
  'الأربعاء',
  'الثلاثاء',
  'الإثنين'
];

export const ServicesAssignmentPage: React.FC = () => {
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Record<string, ServiceScheduleConfig>>({});
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // Edit Modal State
  const [activeCategory, setActiveCategory] = useState<ChurchServiceCategory | null>(null);
  const [selectedPriests, setSelectedPriests] = useState<string[]>([]);
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [serviceDay, setServiceDay] = useState<DayOfWeekArabic>('الجمعة');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [serviceNotes, setServiceNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesData, settings] = await Promise.all([
        api.getProfiles(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);

      setProfiles(profilesData);

      // Parse saved assignments from siteSettings or local defaults
      const configMap: Record<string, ServiceScheduleConfig> = {};
      APPROVED_CATEGORIES.forEach(item => {
        const defaultSched = DEFAULT_SERVICE_SCHEDULES[item.category] || { day: 'الجمعة', start: '09:00', end: '11:30' };
        const raw = settings[`service_assignment_${item.category}`];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            configMap[item.category] = {
              priest_ids: parsed.priest_ids || [],
              leader_ids: parsed.leader_ids || [],
              day_of_week: parsed.day_of_week || defaultSched.day,
              start_time: parsed.start_time || defaultSched.start,
              end_time: parsed.end_time || defaultSched.end,
              notes: parsed.notes || ''
            };
          } catch {
            configMap[item.category] = {
              priest_ids: [],
              leader_ids: [],
              day_of_week: defaultSched.day,
              start_time: defaultSched.start,
              end_time: defaultSched.end
            };
          }
        } else {
          // Check localStorage backup
          const local = localStorage.getItem(`church_service_assign_${item.category}`);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              configMap[item.category] = {
                priest_ids: parsed.priest_ids || [],
                leader_ids: parsed.leader_ids || [],
                day_of_week: parsed.day_of_week || defaultSched.day,
                start_time: parsed.start_time || defaultSched.start,
                end_time: parsed.end_time || defaultSched.end,
                notes: parsed.notes || ''
              };
            } catch {
              configMap[item.category] = {
                priest_ids: [],
                leader_ids: [],
                day_of_week: defaultSched.day,
                start_time: defaultSched.start,
                end_time: defaultSched.end
              };
            }
          } else {
            configMap[item.category] = {
              priest_ids: [],
              leader_ids: [],
              day_of_week: defaultSched.day,
              start_time: defaultSched.start,
              end_time: defaultSched.end
            };
          }
        }
      });

      setAssignments(configMap);
    } catch (err) {
      console.error('Error loading service assignments:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الخدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allPriests = profiles.filter(p => p.role === 'priest');
  const allServiceLeaders = profiles.filter(p => p.role === 'service_leader' || p.role === 'servant');

  const handleOpenEdit = (category: ChurchServiceCategory) => {
    const defaultSched = DEFAULT_SERVICE_SCHEDULES[category] || { day: 'الجمعة', start: '09:00', end: '11:30' };
    const current = assignments[category] || { 
      priest_ids: [], 
      leader_ids: [],
      day_of_week: defaultSched.day,
      start_time: defaultSched.start,
      end_time: defaultSched.end
    };
    setActiveCategory(category);
    setSelectedPriests(current.priest_ids || []);
    setSelectedLeaders(current.leader_ids || []);
    setServiceDay(current.day_of_week || defaultSched.day);
    setStartTime(current.start_time || defaultSched.start);
    setEndTime(current.end_time || defaultSched.end);
    setServiceNotes(current.notes || '');
  };

  const handleSaveAssignment = async (category: ChurchServiceCategory) => {
    setSavingCategory(category);
    const config: ServiceScheduleConfig = {
      priest_ids: selectedPriests,
      leader_ids: selectedLeaders,
      day_of_week: serviceDay,
      start_time: startTime,
      end_time: endTime,
      notes: serviceNotes.trim()
    };

    try {
      // Save to Site Settings in Supabase with bidirectional synchronization
      const key = `service_assignment_${category}`;
      const syncUpdates: Record<string, string> = { [key]: JSON.stringify(config) };

      allServiceLeaders.forEach(leader => {
        const directKey = `service_leader_assigned_services_${leader.id}`;
        const currentServices = new Set<ChurchServiceCategory>();
        APPROVED_CATEGORIES.forEach(c => {
          if (c.category === category) {
            if (selectedLeaders.includes(leader.id)) currentServices.add(c.category);
          } else {
            const otherConfig = assignments[c.category];
            if (otherConfig?.leader_ids?.includes(leader.id)) {
              currentServices.add(c.category);
            }
          }
        });
        syncUpdates[directKey] = JSON.stringify(Array.from(currentServices));
      });

      // Synchronize for all Priests as well
      allPriests.forEach(priest => {
        const directKey = `priest_assigned_services_${priest.id}`;
        const currentServices = new Set<ChurchServiceCategory>();
        APPROVED_CATEGORIES.forEach(c => {
          if (c.category === category) {
            if (selectedPriests.includes(priest.id)) currentServices.add(c.category);
          } else {
            const otherConfig = assignments[c.category];
            if (otherConfig?.priest_ids?.includes(priest.id)) {
              currentServices.add(c.category);
            }
          }
        });
        syncUpdates[directKey] = JSON.stringify(Array.from(currentServices));
      });

      await api.updateSiteSettings(syncUpdates);
      
      // Save local backup
      localStorage.setItem(`church_service_assign_${category}`, JSON.stringify(config));

      setAssignments(prev => ({ ...prev, [category]: config }));
      toast.success(`تم حفظ موعد وتعيين مشرفي وأمناء ${category} بنجاح ✨`);
      setActiveCategory(null);
    } catch (err: any) {
      console.warn('API save warning, saving locally:', err);
      localStorage.setItem(`church_service_assign_${category}`, JSON.stringify(config));
      setAssignments(prev => ({ ...prev, [category]: config }));
      toast.success(`تم حفظ تعيينات ومواعيد ${category} بنجاح`);
      setActiveCategory(null);
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
                تعيين كهنة وأمناء ومواعيد الخدمات
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                صلاحية السوبر أدمن: تعيين المشرفين وتحديد اليوم الأسبوعي وتوقيت الخدمة لرصد الحضور والغياب آلياً ⏰🔴
              </p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm">
            جاري تحميل قطاعات الخدمات والمسؤولين والمواعيد...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {APPROVED_CATEGORIES.map(({ category, icon, description }) => {
              const defaultSched = DEFAULT_SERVICE_SCHEDULES[category] || { day: 'الجمعة', start: '09:00', end: '11:30' };
              const current = assignments[category] || { 
                priest_ids: [], 
                leader_ids: [],
                day_of_week: defaultSched.day,
                start_time: defaultSched.start,
                end_time: defaultSched.end 
              };
              const assignedPriests = (current.priest_ids || []).map(id => profiles.find(p => p.id === id)).filter(Boolean);
              const assignedLeaders = (current.leader_ids || []).map(id => profiles.find(p => p.id === id)).filter(Boolean);

              return (
                <div
                  key={category}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">{icon}</span>
                      </div>
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="bg-slate-100 hover:bg-[#002366] text-[#002366] hover:text-[#fed65b] p-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                        title="تعديل وتعيين المسؤولين والمواعيد"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                        {category}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                        {description}
                      </p>
                    </div>

                    {/* Schedule Badge */}
                    <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs font-bold text-blue-900">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-700" />
                        <span>يوم: {current.day_of_week || defaultSched.day}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-blue-800 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{current.start_time || defaultSched.start} - {current.end_time || defaultSched.end}</span>
                      </span>
                    </div>

                    {/* Assigned Priests */}
                    <div className="space-y-1.5 p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <Church className="w-3.5 h-3.5 text-amber-700" />
                          <span>الآباء الكهنة المشرفون ({assignedPriests.length}):</span>
                        </span>
                      </div>
                      {assignedPriests.length === 0 ? (
                        <p className="text-[11px] text-amber-700 italic">لم يتم تعيين كاهن مشرف بعد</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedPriests.map(p => (
                            <span key={p!.id} className="bg-white border border-amber-200 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                              {p!.full_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assigned Service Leaders */}
                    <div className="space-y-1.5 p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-cyan-900">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-cyan-700" />
                          <span>أمناء الخدمة المسؤولون ({assignedLeaders.length}):</span>
                        </span>
                      </div>
                      {assignedLeaders.length === 0 ? (
                        <p className="text-[11px] text-cyan-700 italic">لم يتم تعيين أمين خدمة بعد</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedLeaders.map(l => (
                            <span key={l!.id} className="bg-white border border-cyan-200 text-cyan-900 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                              {l!.full_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {current.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        💡 {current.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEdit(category)}
                      className="w-full bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل المواعيد والمسؤولين</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Assign Priests, Service Leaders, and Schedule */}
        {activeCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      إعدادات ومسؤولي: {activeCategory}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">تحديد يوم وتوقيت الخدمة والمشرفين والأمناء</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* 1. Schedule Day & Time Window */}
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-700" />
                    <span>مواعيد إقامة الخدمة ومهلة تسجيل الغياب ⏰</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">يوم الخدمة *</label>
                      <select
                        value={serviceDay}
                        onChange={(e) => setServiceDay(e.target.value as DayOfWeekArabic)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                      >
                        {DAYS_LIST.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">وقت البدء *</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">المهلة القصوى (انتهاء) *</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-800 font-semibold">
                    🔴 إذا انقضت المهلة المحددة ولم يقم الخادم برفع الحضور والغياب، سيتم إظهار علامة حمراء وإرسال تنبيه آلي للأمين والكاهن.
                  </p>
                </div>

                {/* 2. Priests Assignment */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#00174a] flex items-center gap-1.5">
                    <Church className="w-4 h-4 text-amber-600" />
                    <span>الآباء الكهنة المشرفون على الخدمة:</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                    {allPriests.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">لا يوجد حسابات برتبة كاهن مسجلة بالنظام</p>
                    ) : (
                      allPriests.map(p => {
                        const isSelected = selectedPriests.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPriests([...selectedPriests, p.id]);
                                  } else {
                                    setSelectedPriests(selectedPriests.filter(id => id !== p.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span>{p.full_name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-800" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Service Leaders Assignment */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#00174a] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>أمناء الخدمة المسؤولون:</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                    {allServiceLeaders.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">لا يوجد حسابات خدام مسجلة</p>
                    ) : (
                      allServiceLeaders.map(l => {
                        const isSelected = selectedLeaders.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-cyan-100 text-cyan-900 font-bold border border-cyan-300' : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeaders([...selectedLeaders, l.id]);
                                  } else {
                                    setSelectedLeaders(selectedLeaders.filter(id => id !== l.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span>{l.full_name} ({l.role === 'service_leader' ? 'أمين خدمة' : 'خادم'})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-800" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات وتوجيهات خاصة بالخدمة</label>
                  <textarea
                    rows={2}
                    placeholder="ملاحظات حول أهداف الخدمة أو مكان الإقامة..."
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={savingCategory !== null}
                    onClick={() => handleSaveAssignment(activeCategory)}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCategory ? 'جاري الحفظ...' : 'حفظ المواعيد والتعيينات'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

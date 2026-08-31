import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Users,
  Church,
  UserCheck,
  Award,
  CalendarCheck,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Shield,
  Layers,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Send,
  Check,
  Cake,
  PhoneCall,
  MessageSquare,
  BookOpen,
  Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, type Family, type Profile, type ChurchServiceCategory, type ChurchService, type FamilyAttendanceRecord, type FamilyMember } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  checkFamilyAttendanceStatus,
  findConsecutiveAbsentees,
  getUpcomingBirthdays,
  type ServiceScheduleConfig,
  type AttendanceStatusResult,
  DEFAULT_SERVICE_SCHEDULES 
} from '../../lib/attendanceStatusHelper';
import { useToast } from '../../components/common/Toast';
import { 
  ALL_CHURCH_SERVICE_CATEGORIES, 
  getLeaderAssignedServices 
} from '../../lib/servicesAssignmentHelper';

const DEFAULT_SERVICE_CATEGORIES: ChurchServiceCategory[] = [
  'ابتدائي بنين',
  'ابتدائي بنات',
  'فتيان إعدادي',
  'فتيات إعدادي',
  'شباب ثانوي',
  'شابات ثانوي',
  'خدمة شباب جامعة',
  'خدمة شابات جامعة',
  'خريجين'
];

export const ServiceLeaderDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<FamilyAttendanceRecord[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceScheduleConfig>>({});
  const [loading, setLoading] = useState(true);
  const [remindedFamilies, setRemindedFamilies] = useState<string[]>([]);

  // Stats
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedFamilies, fetchedProfiles, fetchedRelations, fetchedAttendance, settings] = await Promise.all([
        api.getFamilies(),
        api.getProfiles(),
        api.getFamilyServantsForAll().catch(() => []),
        api.getAllFamilyAttendanceRecords().catch(() => []),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);

      const relMap: Record<string, string[]> = {};
      fetchedRelations.forEach((r: any) => {
        if (!relMap[r.family_id]) relMap[r.family_id] = [];
        relMap[r.family_id].push(r.servant_id);
      });

      // Parse schedule configs
      const configs: Record<string, ServiceScheduleConfig> = {};
      DEFAULT_SERVICE_CATEGORIES.forEach(cat => {
        const raw = settings[`service_assignment_${cat}`];
        if (raw) {
          try {
            configs[cat] = JSON.parse(raw);
          } catch {
            configs[cat] = { priest_ids: [], leader_ids: [] };
          }
        }
      });

      setFamilies(fetchedFamilies);
      setProfiles(fetchedProfiles);
      setSiteSettings(settings);
      setFamilyServantsMap(relMap);
      setAttendanceRecords(fetchedAttendance);
      setServiceConfigs(configs);

      // Load members for Sunday School families
      const ssFams = fetchedFamilies.filter(f => f.family_type === 'sunday_school');
      try {
        const memPromises = ssFams.slice(0, 25).map(fam => api.getFamilyMembers(fam.id));
        const memResults = await Promise.all(memPromises);
        setFamilyMembers(memResults.flat());
      } catch (e) {
        console.warn('Could not load family members:', e);
      }
    } catch (err) {
      console.error('Error fetching service leader data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isGlobalAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  // Determine allowed categories for the current leader
  const myAssignedCategories: ChurchServiceCategory[] = isGlobalAdmin
    ? ALL_CHURCH_SERVICE_CATEGORIES.map(c => c.category)
    : (profile?.id ? getLeaderAssignedServices(profile.id, siteSettings) : []);

  // Filtered families strictly to assigned services
  const sundaySchoolFamilies = families
    .filter(f => f.family_type === 'sunday_school')
    .filter(f => {
      if (isGlobalAdmin) return true;
      if (myAssignedCategories.length === 0) return false;
      return myAssignedCategories.some(cat => (f.stage && f.stage.includes(cat)) || (f.area && f.area.includes(cat)) || (f.notes && f.notes.includes(cat)));
    });

  const myAssignedFamilyIds = new Set(sundaySchoolFamilies.map(f => f.id));
  const myServantIds = new Set<string>();
  Object.entries(familyServantsMap).forEach(([fId, sIds]) => {
    if (myAssignedFamilyIds.has(fId)) {
      sIds.forEach(id => myServantIds.add(id));
    }
  });

  const allServants = isGlobalAdmin
    ? profiles.filter(p => p.role === 'servant' || p.role === 'service_leader')
    : profiles.filter(p => (p.role === 'servant' || p.role === 'service_leader') && (myServantIds.has(p.id) || p.id === profile?.id));

  const allPriests = profiles.filter(p => p.role === 'priest');

  const familyNamesMap = families.reduce((acc, f) => {
    acc[f.id] = f.head_name;
    return acc;
  }, {} as Record<string, string>);

  // Calculate attendance status for every family
  const familyAttendanceStatusMap: Record<string, AttendanceStatusResult> = {};
  sundaySchoolFamilies.forEach(fam => {
    // Determine category
    const matchedCategory = DEFAULT_SERVICE_CATEGORIES.find(c => (fam.stage && fam.stage.includes(c)) || (fam.area && fam.area.includes(c))) || 'ابتدائي بنين';
    const config = serviceConfigs[matchedCategory];
    
    // Dates recorded for this family
    const recordedDates = attendanceRecords
      .filter(r => r.family_id === fam.id)
      .map(r => r.date);

    familyAttendanceStatusMap[fam.id] = checkFamilyAttendanceStatus(
      fam.id,
      fam.head_name,
      matchedCategory,
      config,
      recordedDates
    );
  });

  const overdueFamilies = sundaySchoolFamilies.filter(f => familyAttendanceStatusMap[f.id]?.status === 'OVERDUE');
  const completedFamilies = sundaySchoolFamilies.filter(f => familyAttendanceStatusMap[f.id]?.status === 'COMPLETED');
  const pendingFamilies = sundaySchoolFamilies.filter(f => familyAttendanceStatusMap[f.id]?.status === 'PENDING');

  const sundaySchoolFamilyIdSet = new Set(sundaySchoolFamilies.map(f => f.id));
  const relevantFamilyMembers = familyMembers.filter(m => sundaySchoolFamilyIdSet.has(m.family_id));

  const consecutiveAbsentees = findConsecutiveAbsentees(
    relevantFamilyMembers,
    attendanceRecords,
    familyNamesMap,
    2
  );

  const upcomingBirthdays = getUpcomingBirthdays(
    relevantFamilyMembers.map(m => ({ id: m.id, full_name: m.full_name, birth_date: m.birth_date, phone: m.phone, family_name: familyNamesMap[m.family_id] })),
    allServants.map(s => ({ id: s.id, full_name: s.full_name, phone: s.phone, role: s.role }))
  );

  const handleSendReminder = (familyId: string, familyName: string) => {
    setRemindedFamilies(prev => [...prev, familyId]);
    toast.success(`تم إرسال تذكير عاجل لخدام أسرة "${familyName}" لتسجيل الغياب 🔔`);
  };

  return (
    <DashboardLayout role="service_leader">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fed65b]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>لوحة أمين الخدمة الرسمية</span>
            </div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-white">
              أهلاً بك يا أستاذ {profile?.full_name || 'أمين الخدمة'} 🌟
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-xl leading-relaxed">
              إدارة خدمات وأسر التربية الكنسية، متابعة الحضور والغياب ورصد المواعيد والتنبيهات الحمراء الفورية.
            </p>

            {/* Assigned Services Tags */}
            {!isGlobalAdmin && myAssignedCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-slate-300 font-bold">المراحل المسندة إليك:</span>
                {myAssignedCategories.map(cat => (
                  <span key={cat} className="px-3 py-1 rounded-xl bg-[#fed65b] text-[#00174a] text-xs font-extrabold shadow-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            )}

            {!isGlobalAdmin && myAssignedCategories.length === 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span>تنبيه: لم يتم تعيين خدمة مسندة لحسابك بعد من قبل مسؤول النظام</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/servant/lesson-bank"
              className="bg-white/10 hover:bg-white/20 text-[#fed65b] border border-[#fed65b]/40 font-bold text-xs px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>بنك الدروس 📖</span>
            </Link>
            <Link
              to="/service-leader/families"
              className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>إنشاء أسرة / فصل جديد</span>
            </Link>
          </div>
        </div>

        {/* ⚠️ Consecutive Absentees Sector Alert */}
        {consecutiveAbsentees.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-400 rounded-3xl text-rose-950 space-y-3 shadow-md animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md animate-pulse">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-tajawal text-base sm:text-lg font-extrabold text-rose-950 flex items-center gap-2">
                    <span>🔴 رصد الغياب المتكرر بالقطاع: يوجد {consecutiveAbsentees.length} مخدومين غائبين لأسبوعين متتاليين!</span>
                  </h4>
                  <p className="text-xs text-rose-800 font-semibold mt-0.5">
                    الرجاء توجيه الخدام المسؤولين عن هذه الأسر لتفقد المخدومين والاطمئنان على أحوالهم.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {consecutiveAbsentees.map(ca => {
                const phoneClean = (ca.parent_phone || ca.phone || '').replace(/\D/g, '');
                const waUrl = phoneClean 
                  ? `https://wa.me/2${phoneClean}?text=${encodeURIComponent(`سلام ونعمة يا ${ca.member_name} 🌟، أسرة التربية الكنسية بكنيسة السيدة العذراء مريم بمحرم بك تفتقدك وتصليلك؛ مستنيينك في قداس واجتماع الأسبوع القادم✝️`)}`
                  : null;

                return (
                  <div key={ca.member_id} className="p-3 bg-white border border-rose-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{ca.member_name}</span>
                      <span className="text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        غائب {ca.consecutive_count} أسابيع متتالية • {ca.family_name}
                      </span>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                        title="إرسال رسالة افتقاد واتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-[10px]">افتقاد</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🎂 Joyful Sector Birthdays Widget */}
        {upcomingBirthdays.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-3xl text-purple-950 space-y-3 shadow-md animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Cake className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-tajawal text-base sm:text-lg font-extrabold text-purple-950 flex items-center gap-2">
                    <span>🎂 احتفالات أعياد ميلاد القطاع هذا الأسبوع ({upcomingBirthdays.length}) 🎉</span>
                  </h4>
                  <p className="text-xs text-purple-800 font-semibold mt-0.5">
                    أعياد ميلاد الخدام والمخدومين خلال الأسبوع الحالي لتقديم التهاني والمحبة.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {upcomingBirthdays.map(b => {
                const phoneClean = (b.phone || '').replace(/\D/g, '');
                const waUrl = phoneClean 
                  ? `https://wa.me/2${phoneClean}?text=${encodeURIComponent(`كل سنة وأنت طيب يا ${b.name} 🎉🎂 بمناسبة عيد ميلادك المبارك! أسرة التربية الكنسية بكنيسة السيدة العذراء مريم بمحرم بك تتمنى لك عاماً مباركاً ملئ بالنعمة والبركة والنجاح ✝️✨`)}`
                  : null;

                return (
                  <div key={b.id} className="p-3 bg-white border border-purple-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900">{b.name}</span>
                        {b.is_today && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-extrabold animate-pulse">
                            اليوم 🎂
                          </span>
                        )}
                        {b.type === 'servant' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded text-[9px] font-bold">
                            خادم
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-purple-800 font-bold block mt-0.5">
                        {b.age ? `يكمل ${b.age} سنة` : 'عيد ميلاد مبارك'} {b.family_name ? `• ${b.family_name}` : ''}
                      </span>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                        title="إرسال تهنئة عبر الواتساب"
                      >
                        <Gift className="w-4 h-4 text-emerald-200" />
                        <span className="text-[10px]">تهنئة</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🔴 RED OVERDUE ATTENDANCE ALERT BANNER (If any family missed deadline) */}
        {overdueFamilies.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-500/40 rounded-3xl p-6 shadow-lg space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-extrabold text-rose-900 flex items-center gap-2">
                    <span>🔴 تنبيه عاجل: يوجد {overdueFamilies.length} أسر لم يتم تسجيل الغياب لها بعد انقضاء موعد الخدمة!</span>
                  </h3>
                  <p className="text-xs text-rose-700 font-semibold mt-0.5">
                    انقضت المهلة المحددة للخدمة ولم يقم الخدام المسؤولون برفع الحضور والغياب. تم إشعار الأب الكاهن وأمين الخدمة.
                  </p>
                </div>
              </div>

              <Link
                to="/servant/attendance"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0 hidden sm:inline-flex items-center gap-1.5"
              >
                <span>شاشة الحضور</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {/* Overdue Families List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {overdueFamilies.map(fam => {
                const statusInfo = familyAttendanceStatusMap[fam.id];
                const servantIds = familyServantsMap[fam.id] || (fam.assigned_servant_id ? [fam.assigned_servant_id] : []);
                const assignedServants = servantIds.map(id => profiles.find(p => p.id === id)).filter(Boolean);
                const isReminded = remindedFamilies.includes(fam.id);

                return (
                  <div
                    key={fam.id}
                    className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                        <h4 className="font-tajawal text-sm font-bold text-rose-950">{fam.head_name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          {fam.area || 'خدمة'}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 font-semibold">
                        {statusInfo?.message}
                      </p>
                      <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <span>الخدام:</span>
                        <span>{assignedServants.map(s => s?.full_name).join('، ') || 'لم يتم تعيين خادم'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendReminder(fam.id, fam.head_name)}
                      disabled={isReminded}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                        isReminded 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-100 hover:bg-rose-200 text-rose-900 shadow-xs'
                      }`}
                      title="إرسال تذكير للخادم"
                    >
                      {isReminded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تم التذكير</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>تذكير الخادم</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">إجمالي الفصول والأسر</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{sundaySchoolFamilies.length}</h4>
              </div>
              <div className="p-3 bg-[#002366]/5 rounded-2xl text-[#002366]">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 text-[11px] font-bold">
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {completedFamilies.length} مسجل
              </span>
              <span className="text-rose-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {overdueFamilies.length} متأخر
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">حالة الحضور هذا الأسبوع</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-emerald-600">
                  {completedFamilies.length} / {sundaySchoolFamilies.length}
                </h4>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-4">
              فصول قامت برفع الغياب بالموعد
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">الخدام المسجلون</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{allServants.length}</h4>
              </div>
              <div className="p-3 bg-[#fed65b]/10 rounded-2xl text-[#002366]">
                <Users className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-4">
              خدام وأمناء الخدمات النشطون
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">الآباء الكهنة المشرفون</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{allPriests.length}</h4>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
                <Church className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-4">
              متابعة وإرشاد روحي مستمر
            </p>
          </div>
        </div>

        {/* 9 Approved Church Services Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tajawal text-xl font-bold text-[#00174a]">
              {isGlobalAdmin ? 'أقسام وقطاعات الخدمة المعتمدة ومواعيدها' : 'الخدمات والمراحل المسندة إليك ومواعيدها'}
            </h2>
            <Link
              to="/service-leader/families"
              className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
            >
              <span>إدارة كافة الأسر</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {!isGlobalAdmin && myAssignedCategories.length === 0 ? (
            <div className="p-8 bg-amber-50 border-2 border-amber-300 rounded-3xl text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
              <h3 className="font-tajawal text-lg font-extrabold text-amber-950">
                لم يتم إسناد خدمة أو مرحلة لحسابك حتى الآن
              </h3>
              <p className="text-xs text-amber-800 font-semibold max-w-md mx-auto leading-relaxed">
                مرحباً بك يا {profile?.full_name}. حسابك مسجل برتبة أمين خدمة، ولكن لم يقم مسؤول النظام (Super Admin) بتعيين المرحلة المسؤولة عنها بعد. يرجى مراجعة إدارة الكنيسة لتحديد خدمتك.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(isGlobalAdmin ? DEFAULT_SERVICE_CATEGORIES : myAssignedCategories).map(category => {
              const defaultSched = DEFAULT_SERVICE_SCHEDULES[category] || { day: 'الجمعة', start: '09:00', end: '11:30' };
              const config = serviceConfigs[category] || { 
                priest_ids: [], 
                leader_ids: [],
                day_of_week: defaultSched.day,
                start_time: defaultSched.start,
                end_time: defaultSched.end
              };

              const categoryFamilies = sundaySchoolFamilies.filter(f => f.stage?.includes(category) || f.area?.includes(category));
              const catOverdue = categoryFamilies.filter(f => familyAttendanceStatusMap[f.id]?.status === 'OVERDUE').length;
              const catCompleted = categoryFamilies.filter(f => familyAttendanceStatusMap[f.id]?.status === 'COMPLETED').length;

              return (
                <div
                  key={category}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">diversity_3</span>
                      </div>
                      <span className="bg-[#002366]/10 text-[#002366] text-xs font-extrabold px-3 py-1 rounded-full border border-[#002366]/20">
                        {categoryFamilies.length} فصول وأسر
                      </span>
                    </div>

                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      {category}
                    </h3>

                    {/* Schedule Indicator */}
                    <div className="p-2 bg-blue-50/70 rounded-xl text-blue-900 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                        <span>يوم {config.day_of_week || defaultSched.day}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{config.start_time || defaultSched.start} - {config.end_time || defaultSched.end}</span>
                      </span>
                    </div>

                    {/* Attendance Status Mini Bar */}
                    {categoryFamilies.length > 0 && (
                      <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                        <span className="text-emerald-700">✅ {catCompleted} تم الحضور</span>
                        {catOverdue > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            🔴 {catOverdue} متأخر
                          </span>
                        ) : (
                          <span className="text-slate-400">لا يوجد تأخير</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/service-leader/families?category=${encodeURIComponent(category)}`}
                      className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
                    >
                      <span>عرض فصول {category}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Quick Actions Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <Link
            to="/servant/attendance"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">تفقد الحضور الأسبوعي</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">تسجيل ومتابعة حضور المخدومين</p>
            </div>
          </Link>

          <Link
            to="/servant/points"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">نقاط مدارس الأحد 🌟</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">لوحة الشرف وتنافس الفصول</p>
            </div>
          </Link>

          <Link
            to="/servant/visitations"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">سجل الافتقاد والزيارات</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">متابعة الغائبين والحالات الخاصة</p>
            </div>
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
};

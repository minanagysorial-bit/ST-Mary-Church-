import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  BookOpen, Users, Calendar, CheckSquare, Heart, Plus, Trash2, Download, Search, Sparkles, X, CheckCircle2, 
  Award, MapPin, Navigation, PhoneCall, MessageSquare, Cake, Gift, ChevronLeft, BellRing
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, type FamilyAttendanceRecord, type FamilyMember } from '../../lib/api';
import type { Family, Sermon, Member } from '../../lib/database.types';
import { useToast } from '../../components/common/Toast';
import { findConsecutiveAbsentees, getUpcomingBirthdays, type ConsecutiveAbsentee, type BirthdayItem } from '../../lib/attendanceStatusHelper';

export const ServantDashboardPage: React.FC = () => {
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [sermonsCount, setSermonsCount] = useState<number>(0);
  const [students, setStudents] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<FamilyAttendanceRecord[]>([]);
  const [allFamilyMembers, setAllFamilyMembers] = useState<FamilyMember[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Student quick addition form states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentStage, setStudentStage] = useState('ابتدائي');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServantDashboardData = async () => {
    try {
      const [f, s, m, att, settings] = await Promise.all([
        api.getFamilies(),
        api.getSermons(),
        api.getSundaySchoolStudents(),
        api.getAllFamilyAttendanceRecords().catch(() => []),
        api.getSiteSettings(),
      ]);
      setFamilies(f);
      setSermonsCount(s.length);
      setStudents(m);
      setAttendanceRecords(att);
      setSiteSettings(settings);

      // Fetch family members for attendance and birthdays
      try {
        const memPromises = f.slice(0, 15).map(fam => api.getFamilyMembers(fam.id));
        const memResults = await Promise.all(memPromises);
        const flattened = memResults.flat();
        setAllFamilyMembers(flattened);
      } catch (err) {
        console.warn('Family members fetch notice:', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServantDashboardData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) {
      toast.error('يرجى كتابة الاسم ورقم الهاتف للمخدوم.');
      return;
    }
    setSavingStudent(true);
    try {
      const ageNum = parseInt(studentAge) || 0;
      const newStudent = await api.createMember({
        full_name: studentName.trim(),
        phone: studentPhone.trim(),
        email: null,
        service: studentStage,
        education: studentAge ? `${studentAge} سنة` : null,
        status: 'نشط',
        address: ''
      });
      setStudents(prev => [newStudent, ...prev]);
      toast.success('تمت إضافة المخدوم بنجاح!');
      setShowAddStudentModal(false);
      setStudentName('');
      setStudentPhone('');
      setStudentAge('');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إضافة المخدوم: ' + err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (deletingId) return;
    if (!window.confirm(`هل أنت متأكد من إزالة المخدوم (${name})؟`)) return;
    setDeletingId(id);
    try {
      await api.deleteMember(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('تمت إزالة المخدوم بنجاح');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الإزالة: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const visitedCount = families.filter(f => f.last_visit_date !== null).length;
  const visitPercentage = families.length > 0 ? Math.round((visitedCount / families.length) * 100) : 0;
  const urgentVisitations = families.filter(f => !f.last_visit_date).slice(0, 2);

  const familyNamesMap = families.reduce((acc, f) => {
    acc[f.id] = f.head_name;
    return acc;
  }, {} as Record<string, string>);

  const consecutiveAbsentees = findConsecutiveAbsentees(
    allFamilyMembers.length > 0 ? allFamilyMembers : students.map(s => ({ id: s.id, full_name: s.full_name, phone: s.phone })),
    attendanceRecords,
    familyNamesMap,
    2
  );

  const upcomingBirthdays = getUpcomingBirthdays(
    allFamilyMembers.length > 0 
      ? allFamilyMembers.map(m => ({ id: m.id, full_name: m.full_name, birth_date: m.birth_date, phone: m.phone, family_name: familyNamesMap[m.family_id] }))
      : students.map(s => ({ id: s.id, full_name: s.full_name, birth_date: null, phone: s.phone })),
    []
  );

  return (
    <DashboardLayout role="servant">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة تحكم الخادم المتابع
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">إعداد وتحضير مناهج مدارس الأحد ومتابعة افتقاد وغياب المخدومين</p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            نظام الافتقاد الرقمي
          </span>
        </div>

        {/* ⚠️ Consecutive Absentees Alert Banner */}
        {consecutiveAbsentees.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-400 rounded-3xl text-rose-950 space-y-3 shadow-md animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md animate-pulse">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-tajawal text-base sm:text-lg font-extrabold text-rose-950 flex items-center gap-2">
                    <span>🔴 تنبيه افتقاد عاجل: يوجد {consecutiveAbsentees.length} مخدومين غائبين لأسبوعين متتاليين!</span>
                  </h4>
                  <p className="text-xs text-rose-800 font-semibold mt-0.5">
                    «خِرَافِي تَسْمَعُ صَوْتِي وَأَنَا أَعْرِفُهَا فَتَتْبَعُنِي» — يُرجى الاطمئنان عليهم تليفونياً أو عبر الزيارة المنزلية.
                  </p>
                </div>
              </div>
              <Link
                to="/servant/visitations"
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs shrink-0 hidden sm:inline-flex items-center gap-1"
              >
                <span>سجل الافتقاد</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {consecutiveAbsentees.map(ca => {
                const phoneClean = (ca.parent_phone || ca.phone || '').replace(/\D/g, '');
                const waUrl = phoneClean 
                  ? `https://wa.me/2${phoneClean}?text=${encodeURIComponent(`سلام ونعمة يا ${ca.member_name} 🌟، كنيسة السيدة العذراء مريم بمحرم بك بتفتقدك وبنصليلك ومستنيينك تفرحنا بوجودك في الخدمة الجمعة القادمة ✝️`)}`
                  : null;

                return (
                  <div key={ca.member_id} className="p-3.5 bg-white border border-rose-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{ca.member_name}</span>
                      <span className="text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        غائب {ca.consecutive_count} أسابيع متتالية ({ca.family_name})
                      </span>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                        title="إرسال رسالة افتقاد واتساب"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[11px]">افتقاد</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🎂 Joyful Birthday Celebrations Widget */}
        {upcomingBirthdays.length > 0 && (
          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-3xl text-purple-950 space-y-3 shadow-md animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Cake className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-tajawal text-base sm:text-lg font-extrabold text-purple-950 flex items-center gap-2">
                    <span>🎂 احتفالات أعياد الميلاد هذا الأسبوع ({upcomingBirthdays.length}) 🎉</span>
                  </h4>
                  <p className="text-xs text-purple-800 font-semibold mt-0.5">
                    فرصة طيبة لإرسال معايدة وتهنئة رقيقة من الكنيسة وإدخال الفرحة على قلوبهم!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {upcomingBirthdays.map(b => {
                const phoneClean = (b.phone || '').replace(/\D/g, '');
                const waUrl = phoneClean 
                  ? `https://wa.me/2${phoneClean}?text=${encodeURIComponent(`كل سنة وأنت طيب يا ${b.name} 🎉🎂 بمناسبة عيد ميلادك المبارك! كنيسة السيدة العذراء مريم بمحرم بك تتمنى لك سنة جديدة مليانة نعمة وفرح وسلام مع المسيح ✝️✨`)}`
                  : null;

                return (
                  <div key={b.id} className="p-3.5 bg-white border border-purple-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900">{b.name}</span>
                        {b.is_today && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-extrabold animate-pulse">
                            اليوم 🎂
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                        title="إرسال تهنئة عبر الواتساب"
                      >
                        <Gift className="w-4 h-4 text-emerald-200" />
                        <span className="text-[11px]">تهنئة</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Quick Highlight Banners (Lesson Bank + Points + Visitation Map) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/servant/lesson-bank"
            className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-[#fed65b]/20 text-[#fed65b] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                <BookOpen className="w-3 h-3" />
                <span>مناهج وتحضير</span>
              </div>
              <h3 className="font-tajawal text-base font-extrabold text-white group-hover:text-[#fed65b] transition-colors">
                بنك تحضير الدروس 📖
              </h3>
              <p className="text-[11px] text-slate-300">
                دروس جاهزة، عروض PPT، مسابقات وأنشطة PDF.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center font-bold shadow-md shrink-0 mr-2">
              <BookOpen className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/servant/points"
            className="bg-gradient-to-r from-[#002366] to-[#00174a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-[#fed65b]/20 text-[#fed65b] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>تحفيز وجوائز</span>
              </div>
              <h3 className="font-tajawal text-base font-extrabold text-white group-hover:text-[#fed65b] transition-colors">
                نقاط مدارس الأحد 🌟
              </h3>
              <p className="text-[11px] text-slate-300">
                تسجيل الحضور بالباركود، ومنح النقاط.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center font-bold shadow-md shrink-0 mr-2">
              <Award className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/servant/visitation-map"
            className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                <Navigation className="w-3 h-3" />
                <span>خريطة ذكية</span>
              </div>
              <h3 className="font-tajawal text-base font-extrabold text-white group-hover:text-[#fed65b] transition-colors">
                خريطة الافتقاد 🗺️
              </h3>
              <p className="text-[11px] text-slate-300">
                توزيع جغرافي للأسر ودبابيس ملونة.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shrink-0 mr-2">
              <MapPin className="w-5 h-5" />
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">الأسر المستهدفة بالافتقاد</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <Users className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : families.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-slate-550 font-bold">بمنطقة الخدمة المحددة</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">تم افتقادهم</span>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <Heart className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : visitedCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">نسبة إنجاز {visitPercentage.toLocaleString('ar-EG')}٪</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">دروس التحضير المرفوعة</span>
              <div className="p-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : sermonsCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-[#002366] font-bold">منهج النصف الأول</p>
          </div>
        </div>

        {/* Quick action card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
          
          {/* Left panel: urgent tasks & dynamic curriculums (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
              <h2 className="font-tajawal text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3">
                المهام الأسبوعية العاجلة للخدمة
              </h2>
              <div className="space-y-3.5 text-xs font-semibold">
                {loading ? (
                  <p className="text-slate-400 text-center py-4">جاري التحميل...</p>
                ) : urgentVisitations.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">لا توجد مهام عاجلة. جميع الأسر تم افتقادها!</p>
                ) : (
                  urgentVisitations.map(f => (
                    <div key={f.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <CheckSquare className="w-5 h-5 text-[#d4af37] shrink-0" />
                      <div>
                        <p className="font-bold text-[#002366]">افتكاد أسرة أ/ {f.head_name}</p>
                        <p className="text-slate-550 mt-0.5">المنطقة والشارع: {f.area} — الحالة مستعجلة</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic Curriculums Download */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
                <span>مناهج وأدلة الخدمة الرقمية</span>
              </h2>
              
              <div className="space-y-3 text-xs font-bold font-tajawal">
                {/* infants */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج الملائكة (حضانة)</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">قصص تفاعلية، تلوين ووسائل إيضاح مجسمة.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_infants_url || '#'}
                    onClick={e => !siteSettings.curriculum_infants_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {/* primary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج ابتدائي</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">دروس العقيدة والطقوس المبسط والأنشطة والمسابقات.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_primary_url || '#'}
                    onClick={e => !siteSettings.curriculum_primary_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {/* prep/sec */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج إعدادي وثانوي</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">دراسات كتابية، دفاعيات مبسطة وحلقات نقاش اجتماعية.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_prep_url || '#'}
                    onClick={e => !siteSettings.curriculum_prep_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Sunday School students CRUD (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-tajawal font-extrabold text-base text-[#002366] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span>سجل الطلاب والمخدومين (الولاد)</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">إجمالي المسجلين: {students.length} طالب</p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={e => setStudentSearchTerm(e.target.value)}
                  placeholder="بحث عن طالب..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] outline-none focus:border-[#002366] font-semibold w-full sm:w-44"
                />
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب</span>
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-slate-400 text-xs py-12 font-bold">جاري تحميل سجل المخدومين...</p>
            ) : students.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-12 font-bold">لا يوجد مخدومين مسجلين بسجلك حالياً.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 font-tajawal">
                      <th className="p-3 rounded-r-xl">الاسم</th>
                      <th className="p-3">المرحلة</th>
                      <th className="p-3">العمر</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3 rounded-l-xl text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {students
                      .filter(s => s.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                      .map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-[#002366]">{s.full_name}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {s.service || 'غير محدد'}
                            </span>
                          </td>
                          <td className="p-3">{s.education || '—'}</td>
                          <td className="p-3 font-mono">{s.phone}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.full_name)}
                              disabled={deletingId === s.id}
                              className="text-rose-500 hover:bg-rose-50 p-1 rounded disabled:opacity-40"
                              title="حذف الطالب"
                            >
                              <Trash2 className={`w-4 h-4 ${deletingId === s.id ? 'animate-pulse' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-right font-cairo">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#00174a] text-white">
              <h2 className="font-tajawal font-bold text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-[#fed65b]" />
                <span>إضافة مخدوم جديد لمدارس الأحد</span>
              </h2>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-350 hover:text-white p-1 rounded-full transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4 text-slate-700">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اسم المخدوم بالكامل *</label>
                <input 
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="مثال: يوحنا أمجد فريد"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رقم الهاتف الموبايل *</label>
                <input 
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={e => setStudentPhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">العمر (سنوات)</label>
                  <input 
                    type="number"
                    value={studentAge}
                    onChange={e => setStudentAge(e.target.value)}
                    placeholder="مثال: 12"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
                  <select
                    value={studentStage}
                    onChange={e => setStudentStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-bold"
                  >
                    <option value="حضانة">حضانة (الملائكة)</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="إعدادي">إعدادي</option>
                    <option value="ثانوي">ثانوي</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  disabled={savingStudent}
                  className="flex-grow bg-[#00174a] text-[#fed65b] font-bold py-2.5 rounded-xl hover:bg-[#002366] transition-all shadow-md text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingStudent ? 'جاري الحفظ...' : 'إضافة المخدوم'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddStudentModal(false)}
                  className="bg-white border border-slate-200 text-slate-650 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-xs"
                >
                  <span>إلغاء</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

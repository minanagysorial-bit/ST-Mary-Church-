import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Link } from 'react-router-dom';
import { api, type ContactMessage, type Family, type FamilyAttendanceRecord, type Profile } from '../../lib/api';
import type { MembershipComment, Sermon, Liturgy, PrayerRequest, ChurchService } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { getCopticDate } from '../../lib/copticReadings';
import { PriestWeeklyAgendaCard } from '../../components/priest/PriestWeeklyAgendaCard';
import {
  Radio,
  RefreshCw,
  Send,
  Trash2,
  MailOpen,
  AlertCircle,
  Play,
  Heart,
  MessageSquare,
  Clock,
  Users,
  ChevronLeft,
  Calendar,
  Mic,
  MapPin,
  Megaphone,
  CheckCircle2,
  Sun,
  ShieldCheck,
  Flame,
  BookmarkCheck,
  Eye,
  Check,
  ClipboardList,
  BookOpen,
  UserPlus,
  Compass,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const PriestDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();

  const [comments, setComments] = useState<MembershipComment[]>([]);
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<FamilyAttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingStream, setSubmittingStream] = useState(false);

  // Live Stream editor form states
  const [streamActive, setStreamActive] = useState('false');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDesc, setStreamDesc] = useState('');

  // Selected Message for detail modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Current Live Dates
  const today = new Date();
  const todayFormatted = {
    gregorian: today.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    coptic: `${getCopticDate(today).copticDay} ${getCopticDate(today).copticMonthName} ${getCopticDate(today).copticYear} ش`
  };

  const fetchPriestDashboardData = async () => {
    try {
      const [l, c, p, s, srvs, msg, f, att, profs, settings] = await Promise.all([
        api.getLiturgies(),
        api.getMembershipComments().catch(() => []),
        api.getPrayerRequests().catch(() => []),
        api.getSermons().catch(() => []),
        api.getChurchServices().catch(() => []),
        api.getContactMessages().catch(() => []),
        api.getFamilies().catch(() => []),
        api.getAllFamilyAttendanceRecords().catch(() => []),
        api.getProfiles().catch(() => []),
        api.getSiteSettings().catch(() => ({} as Record<string, string>)),
      ]);
      setLiturgies(l);
      setComments(c);
      setPrayers(p);
      setSermons(s);
      setServices(srvs);
      setContactMessages(msg);
      setFamilies(f);
      setAttendanceRecords(att);
      setProfiles(profs);
      
      const safeSettings = (settings || {}) as Record<string, string>;
      setSiteSettings(safeSettings);

      setStreamActive(safeSettings['live_stream_active'] || 'false');
      setStreamUrl(safeSettings['live_stream_youtube_url'] || '');
      setStreamTitle(safeSettings['live_stream_title'] || '');
      setStreamDesc(safeSettings['live_stream_description'] || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriestDashboardData();
  }, []);

  const handleUpdateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStream(true);
    try {
      const updatedSettings: Record<string, string> = {
        ...siteSettings,
        live_stream_active: streamActive,
        live_stream_youtube_url: streamUrl,
        live_stream_title: streamTitle,
        live_stream_description: streamDesc,
      };
      await api.updateSiteSettings(updatedSettings);
      setSiteSettings(updatedSettings);
      toast.success('تم تحديث إعدادات البث المباشر الكنسي بنجاح!');
    } catch (err: any) {
      toast.error('خطأ أثناء حفظ البث: ' + err.message);
    } finally {
      setSubmittingStream(false);
    }
  };

  const handleMessageStatus = async (id: string, newStatus: 'unread' | 'read' | 'replied') => {
    try {
      await api.updateContactMessageStatus(id, newStatus);
      toast.success('تم تحديث حالة الرسالة بنجاح');
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast.error('فشل تحديث الحالة: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await api.deleteContactMessage(id);
      toast.success('تم مسح الرسالة بنجاح');
      setContactMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      toast.error('فشل حذف الرسالة: ' + err.message);
    }
  };

  const pendingCommentsCount = comments.filter(c => c.status === 'قيد المراجعة').length;
  const unreadMessagesCount = contactMessages.filter(m => m.status === 'unread').length;
  const unreadPrayersCount = prayers.filter(p => !p.is_read).length;

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* ── 1. WARM FATHERLY GREETING & HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-[#002366] via-[#001f5c] to-[#00174a] text-white rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-[#d4af37]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-[#fed65b]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-[#fed65b]/20 border border-[#fed65b]/40 text-[#fed65b] px-4 py-1.5 rounded-full text-xs sm:text-sm font-black">
                  <span>🕊️ بوابة الآباء الكهنة الموقرين</span>
                </div>

                <h1 className="font-tajawal text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                  أهلاً بك يا قدس أبونا {profile?.full_name ? `«${profile.full_name}»` : ''} .. بركة صلواتك
                </h1>

                <p className="text-xs sm:text-base text-slate-200 font-semibold max-w-2xl leading-relaxed">
                  لوحة تحكم رعوية متكاملة وسهلة الاستخدام لمتابعة القداسات الإلهية، الأكاليل، المعموديات، العظات، وتكليفات الأسبوع مع الإضافة الفورية لتقويم جوجل.
                </p>
              </div>

              {/* Live Today Badge */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl space-y-2 shrink-0 shadow-lg text-center md:text-right min-w-[240px]">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-[#fed65b] font-black">
                  <Sun className="w-4 h-4 text-[#fed65b]" />
                  <span>اليوم في كنيسة السيدة العذراء:</span>
                </div>
                <div className="font-black text-base sm:text-lg text-white">
                  {todayFormatted.gregorian}
                </div>
                <div className="text-xs sm:text-sm text-amber-300 font-black">
                  {todayFormatted.coptic}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-white/10">
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">إجمالي القداسات</span>
                <span className="text-lg font-black text-[#fed65b]">{liturgies.length}</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">شعب الكنيسة</span>
                <span className="text-lg font-black text-[#fed65b]">{families.length} أسرة</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">مكتبة العظات</span>
                <span className="text-lg font-black text-[#fed65b]">{sermons.length} عظة</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">رسائل الشعب</span>
                <span className="text-lg font-black text-[#fed65b]">
                  {unreadMessagesCount > 0 ? `(${unreadMessagesCount}) جديدة` : contactMessages.length}
                </span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">طلبات الصلاة</span>
                <span className="text-lg font-black text-[#fed65b]">
                  {unreadPrayersCount > 0 ? `(${unreadPrayersCount}) جديدة` : prayers.length}
                </span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <span className="text-[11px] text-slate-300 font-bold block">ملاحظات الأسر</span>
                <span className="text-lg font-black text-[#fed65b]">{pendingCommentsCount} معلقة</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. PRIEST PERSONAL WEEKLY AGENDA & GOOGLE CALENDAR CARD ── */}
        <PriestWeeklyAgendaCard
          liturgies={liturgies}
          sermons={sermons}
          services={services}
          currentPriestName={profile?.full_name || 'ابونا مرقس ميلاد'}
        />

        {/* ── 3. QUICK HIGH-TOUCH CARDS GRID (ELDERLY-FRIENDLY PORTAL) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tajawal text-xl sm:text-2xl font-black text-[#002366] flex items-center gap-2.5">
              <span>🌟 الأقسام والخدمات الرعوية الرئيسية</span>
            </h2>
            <span className="text-xs sm:text-sm text-slate-500 font-bold">اضغط على أي قسم للانتقال الفوري</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            
            {/* Card 1: جدول القداسات والعشيات */}
            <Link
              to="/priest/liturgies"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-blue-900 transition-colors">
                    جدول القداسات والعشيات
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    عرض وتعديل جدول الشهر، توزيع مواعيد الآباء، والعظات.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#002366] pt-3 border-t border-slate-100">
                <span>إجمالي القداسات ({liturgies.length})</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-[#002366]" />
              </div>
            </Link>

            {/* Card 2: الإعلانات والتنبيهات */}
            <Link
              to="/priest/announcements"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Megaphone className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-amber-800 transition-colors">
                    الإعلانات والتنبيهات
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    نشر وتحديث إعلانات الكنيسة والنهضات مع إضافة الصور والبوسترات.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-amber-700 pt-3 border-t border-slate-100">
                <span>نشر وتعديل الإعلانات 📢</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: سجل الشعب والأسر */}
            <Link
              to="/membership/members"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-emerald-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-emerald-800 transition-colors">
                    سجل الشعب والعائلات
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    البحث في بيانات شعب الكنيسة، كشوفات العائلات، وأرقام الهواتف.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-emerald-700 pt-3 border-t border-slate-100">
                <span>إجمالي العائلات ({families.length})</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: الخريطة الذكية للافتقاد */}
            <Link
              to="/servant/visitation-map"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-purple-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-purple-800 transition-colors">
                    خريطة الافتقاد الذكية
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    استعراض وتوزيع افتقاد الأسر جغرافياً حسب المناطق والشوارع.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-purple-700 pt-3 border-t border-slate-100">
                <span>فتح خريطة الافتقاد 🗺️</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 5: العظات والكلمات الروحية */}
            <Link
              to="/priest/sermons"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Mic className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-indigo-800 transition-colors">
                    العظات والكلمات الروحية
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    تسجيل ومتابعة عظات الآباء الكهنة وروابط اليوتيوب والصوتيات.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-indigo-700 pt-3 border-t border-slate-100">
                <span>إجمالي العظات ({sermons.length})</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 6: طلبات الصلاة والرسائل */}
            <Link
              to="/admin/communications"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-blue-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-blue-900 transition-colors">
                    طلبات الصلاة ورسائل الشعب
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    متابعة صلوات المذبح والرسائل الواردة من أبناء الكنيسة.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-blue-800 pt-3 border-t border-slate-100">
                <span>صلوات المذبح والرسائل ({prayers.length + contactMessages.length})</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 7: تعليقات وملاحظات الأسر */}
            <Link
              to="/priest/comments"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-rose-500 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <MailOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-rose-800 transition-colors">
                    ملاحظات وتعليقات الأسر
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    مراجعة طلبات وتحديثات أفراد شعب الكنيسة المرفوعة للمراجعة.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-rose-700 pt-3 border-t border-slate-100">
                <span>قيد المراجعة ({pendingCommentsCount})</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 8: خدمات ومجموعات الكنيسة */}
            <Link
              to="/priest/services"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-cyan-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <BookmarkCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-cyan-800 transition-colors">
                    اجتماعات وخدمات الكنيسة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    متابعة مدارس الأحد، الشباب، واجتماعات الخريجين والخدام.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-cyan-700 pt-3 border-t border-slate-100">
                <span>عرض الخدمات والأسر</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 9: تفقد الحضور والغياب */}
            <Link
              to="/servant/attendance"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-teal-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-teal-800 transition-colors">
                    تفقد الحضور والغياب
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    متابعة حضور فصول مدارس الأحد واجتماعات التربية الكنسية.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-teal-700 pt-3 border-t border-slate-100">
                <span>كشوف الحضور</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 10: سجل الافتقاد الرعوي */}
            <Link
              to="/priest/member-visitation"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-amber-600 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-amber-800 transition-colors">
                    سجل الافتقاد الرعوي
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    متابعة تقارير الزيارات وافتقاد الحالات الخاصة من الخدام.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-amber-700 pt-3 border-t border-slate-100">
                <span>سجل الزيارات</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 11: طلبات العضوية */}
            <Link
              to="/priest/membership-requests"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-blue-700 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-blue-900 transition-colors">
                    طلبات العضوية الجديدة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    اعتماد ومراجعة طلبات انضمام العائلات الجديدة للكنيسة.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-blue-800 pt-3 border-t border-slate-100">
                <span>مراجعة الطلبات</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 12: موقع الكنيسة والجدول العام */}
            <Link
              to="/schedule"
              target="_blank"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Eye className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] group-hover:text-[#fed65b] transition-colors">
                    عرض الجدول العام للشعب
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-relaxed">
                    معاينة الصفحة العامة لجدول القداسات كما يراها شعب الكنيسة.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#002366] pt-3 border-t border-slate-100">
                <span>فتح الصفحة العامة 🌐</span>
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>
        </div>

        {/* ── 4. LIVE STREAM CONTROLLER (تحكم البث المباشر الكنسي) ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366]">
                  إدارة البث المباشر للصلوات والقداسات 🔴
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                  تحكم مباشر في تشغيل أو إيقاف البث المباشر لكنيسة السيدة العذراء على الموقع العام.
                </p>
              </div>
            </div>

            <span className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black self-start sm:self-auto ${
              streamActive === 'true'
                ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 animate-pulse'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {streamActive === 'true' ? '🔴 البث يعمل حالياً ومتاح للشعب' : '⚪ البث مغلق حالياً'}
            </span>
          </div>

          <form onSubmit={handleUpdateLiveStream} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* حالة البث */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-700 block">حالة البث المباشر *</label>
                <select
                  value={streamActive}
                  onChange={(e) => setStreamActive(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-black text-[#002366] outline-none focus:border-[#002366]"
                >
                  <option value="false">⚪ مغلق (لا يوجد بث الآن)</option>
                  <option value="true">🔴 نشط الآن (عرض البث في الصفحة الرئيسية)</option>
                </select>
              </div>

              {/* رابط يوتيوب */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs sm:text-sm font-black text-slate-700 block">رابط البث على يوتيوب (YouTube Live URL) *</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* عنوان البث */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs sm:text-sm font-black text-slate-700 block">عنوان البث (مثال: بث مباشر للقداس الإلهي) *</label>
                <input
                  type="text"
                  placeholder="بث مباشر للقداس الإلهي - كنيسة السيدة العذراء مريم"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* زر الحفظ */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingStream}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 border border-amber-400"
                >
                  {submittingStream ? 'جاري الحفظ...' : '💾 حفظ وتحديث حالة البث'}
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* ── 5. CITIZEN MESSAGES INBOX (رسائل تواصل معنا) ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black shrink-0">
                <MailOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-tajawal text-lg sm:text-xl font-black text-[#002366]">
                  رسائل واستفسارات الشعب (تواصل معنا) ✉️
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                  قراءة والرد على الرسائل والطلبات الواردة من أبناء الكنيسة.
                </p>
              </div>
            </div>

            {unreadMessagesCount > 0 && (
              <span className="bg-rose-100 text-rose-800 border-2 border-rose-300 px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-black animate-pulse">
                ({unreadMessagesCount}) رسائل غير مقروءة 🔔
              </span>
            )}
          </div>

          {contactMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MailOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-500">لا توجد رسائل واردة حالياً من الشعب</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right border-collapse text-xs sm:text-sm font-semibold">
                <thead>
                  <tr className="bg-[#002366] text-[#fed65b] border-b border-slate-200">
                    <th className="p-4 font-black">الاسم ورقم الهاتف</th>
                    <th className="p-4 font-black">الرسالة</th>
                    <th className="p-4 font-black">التاريخ</th>
                    <th className="p-4 font-black">الحالة</th>
                    <th className="p-4 font-black text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {contactMessages.slice(0, 10).map((msg) => (
                    <tr key={msg.id} className={`hover:bg-slate-50 transition-colors ${msg.status === 'unread' ? 'bg-blue-50/40 font-bold' : ''}`}>
                      <td className="p-4">
                        <div className="font-black text-[#00174a] text-sm">{msg.name}</div>
                        {msg.phone && <div className="text-xs text-slate-500 font-bold">{msg.phone}</div>}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-700">{msg.message}</td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                          msg.status === 'unread'
                            ? 'bg-rose-100 text-rose-800'
                            : msg.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {msg.status === 'unread' ? 'جديدة' : msg.status === 'replied' ? 'تم الرد' : 'تمت القراءة'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (msg.status === 'unread') {
                                handleMessageStatus(msg.id, 'read');
                              }
                            }}
                            className="p-2 rounded-xl text-blue-700 hover:bg-blue-100 bg-blue-50 transition-colors cursor-pointer font-black text-xs flex items-center gap-1"
                            title="قراءة الرسالة"
                          >
                            <Eye className="w-4 h-4" />
                            <span>قراءة</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 bg-rose-50 transition-colors cursor-pointer"
                            title="حذف الرسالة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 6. MESSAGE DETAIL MODAL ── */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-[#00113a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-slate-200 animate-scaleUp my-auto">
              
              <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MailOpen className="w-6 h-6 text-[#fed65b]" />
                  <h3 className="font-tajawal text-base sm:text-lg font-black text-[#fed65b]">
                    تفاصيل رسالة من: {selectedMessage.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs sm:text-sm font-semibold">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold">الاسم:</span>
                    <span className="text-[#00174a] font-black text-sm">{selectedMessage.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold">رقم الهاتف:</span>
                    <span className="text-[#00174a] font-black text-sm">{selectedMessage.phone || 'غير مسجل'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 font-black block">نص الرسالة:</label>
                  <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 leading-relaxed whitespace-pre-wrap text-sm font-bold">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleMessageStatus(selectedMessage.id, 'replied')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>تم الرد على الشعب</span>
                  </button>

                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-colors cursor-pointer text-xs sm:text-sm"
                  >
                    إغلاق
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
export default PriestDashboardPage;

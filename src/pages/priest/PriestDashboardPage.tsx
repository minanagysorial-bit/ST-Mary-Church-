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
  Check
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

  return (
    <DashboardLayout role={profile?.role as any || 'priest'}>
      <div className="space-y-7 font-cairo text-right" dir="rtl">
        
        {/* ── 1. WARM FATHERLY GREETING & HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-[#002366] via-[#001f5c] to-[#00174a] text-white rounded-3xl p-6 sm:p-8 border border-[#fed65b]/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#fed65b]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#fed65b]/20 border border-[#fed65b]/40 text-[#fed65b] px-3.5 py-1 rounded-full text-xs font-bold">
                <span>🕊️ بوابة الآباء الكهنة الموقرين</span>
              </div>

              <h1 className="font-tajawal text-2xl sm:text-3xl font-black text-white leading-tight">
                أهلاً بك يا قدس أبونا {profile?.full_name ? `«${profile.full_name}»` : ''} .. بركة صلواتك معنا
              </h1>

              <p className="text-sm text-slate-200 font-semibold max-w-2xl">
                لوحة تحكم كنسية شاملة لمتابعة القداسات الإلهية، مواعيد الأكاليل والمعموديات، العظات، جدولك اليومي والأسبوعي، وإضافة المواعيد لتقويم جوجل بسهولة.
              </p>
            </div>

            {/* Live Today Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-1.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#fed65b] font-bold">
                <Sun className="w-4 h-4 text-[#fed65b]" />
                <span>اليوم في كنيسة السيدة العذراء:</span>
              </div>
              <div className="font-black text-sm text-white">
                {todayFormatted.gregorian}
              </div>
              <div className="text-xs text-amber-300 font-extrabold">
                {todayFormatted.coptic}
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-tajawal text-lg sm:text-xl font-black text-[#002366] flex items-center gap-2">
              <span>🌟 الأقسام والخدمات الرئيسية</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">اضغط على أي قسم للانتقال المباشر</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: جدول القداسات والعشيات */}
            <Link
              to="/priest/liturgies"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#002366] text-[#fed65b] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-blue-900 transition-colors">
                    جدول القداسات والعشيات
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    عرض وتعديل جدول الشهر، توزيع مواعيد الكهنة، والعظات.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-[#002366] pt-3 border-t border-slate-100">
                <span>إجمالي القداسات ({liturgies.length})</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: الإعلانات والتنبيهات */}
            <Link
              to="/priest/announcements"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-amber-800 transition-colors">
                    الإعلانات والتنبيهات
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    نشر وتحديث إعلانات الكنيسة، النهضات، والمناسبات.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-amber-700 pt-3 border-t border-slate-100">
                <span>نشر إعلان جديد 📢</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: سجل الشعب والأسر */}
            <Link
              to="/membership/members"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-emerald-600 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-emerald-800 transition-colors">
                    سجل الشعب والعائلات
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    البحث في بيانات شعب الكنيسة، كشوفات العائلات، والخدام.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-emerald-700 pt-3 border-t border-slate-100">
                <span>إجمالي العائلات ({families.length})</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: الخريطة الذكية للافتقاد */}
            <Link
              to="/servant/visitation-map"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-purple-600 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-purple-800 transition-colors">
                    خريطة الافتقاد الذكية
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    استعراض وتوزيع افتقاد الأسر جغرافياً حسب المناطق والشوارع.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-purple-700 pt-3 border-t border-slate-100">
                <span>فتح خريطة الافتقاد 🗺️</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 5: العظات والكلمات الروحية */}
            <Link
              to="/priest/sermons"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-indigo-600 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-indigo-800 transition-colors">
                    العظات والكلمات الروحية
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    تسجيل ومتابعة عظات الآباء الكهنة وروابط اليوتيوب.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-indigo-700 pt-3 border-t border-slate-100">
                <span>إجمالي العظات ({sermons.length})</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 6: تعليقات وملاحظات الأسر */}
            <Link
              to="/priest/comments"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-rose-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-rose-800 transition-colors">
                    ملاحظات وتعليقات الأسر
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    مراجعة طلبات وتحديثات أفراد شعب الكنيسة.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-rose-700 pt-3 border-t border-slate-100">
                <span>قيد المراجعة ({pendingCommentsCount})</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 7: خدمات ومجموعات الكنيسة */}
            <Link
              to="/priest/services-families"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-cyan-600 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <BookmarkCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-cyan-800 transition-colors">
                    اجتماعات وخدمات الكنيسة
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    متابعة مدارس الأحد، الشباب، واجتماعات الخريجين.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-cyan-700 pt-3 border-t border-slate-100">
                <span>عرض أسر الخدمات</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 8: موقع الكنيسة والجدول العام */}
            <Link
              to="/schedule"
              target="_blank"
              className="bg-white hover:bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-amber-600 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                  <Eye className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366] group-hover:text-amber-700 transition-colors">
                    عرض الجدول العام للشعب
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    معاينة الصفحة العامة لجدول القداسات كما يراها الشعب.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-[#002366] pt-3 border-t border-slate-100">
                <span>فتح الصفحة العامة 🌐</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>
        </div>

        {/* ── 4. LIVE STREAM CONTROLLER (تحكم البث المباشر الكنسي) ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-tajawal text-lg font-black text-[#002366]">
                  إدارة البث المباشر للصلوات والقداسات 🔴
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  تحكم مباشر في تشغيل أو إيقاف البث المباشر لكنيسة السيدة العذراء على الموقع العام.
                </p>
              </div>
            </div>

            <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black self-start sm:self-auto ${
              streamActive === 'true'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {streamActive === 'true' ? '🔴 البث يعمل حالياً ومتاح للشعب' : '⚪ البث مغلق حالياً'}
            </span>
          </div>

          <form onSubmit={handleUpdateLiveStream} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* حالة البث */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">حالة البث المباشر *</label>
                <select
                  value={streamActive}
                  onChange={(e) => setStreamActive(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#002366] outline-none focus:border-[#002366]"
                >
                  <option value="false">⚪ مغلق (لا يوجد بث الآن)</option>
                  <option value="true">🔴 نشط الآن (عرض البث في الصفحة الرئيسية)</option>
                </select>
              </div>

              {/* رابط يوتيوب */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">رابط البث على يوتيوب (YouTube Live URL) *</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* عنوان البث */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">عنوان البث (مثال: بث مباشر للقداس الإلهي) *</label>
                <input
                  type="text"
                  placeholder="بث مباشر للقداس الإلهي - كنيسة السيدة العذراء مريم"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#002366]"
                />
              </div>

              {/* زر الحفظ */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingStream}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submittingStream ? 'جاري الحفظ...' : '💾 حفظ وتحديث حالة البث'}
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* ── 5. CITIZEN MESSAGES INBOX (رسائل تواصل معنا) ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black shrink-0">
                <MailOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-tajawal text-lg font-black text-[#002366]">
                  رسائل واستفسارات الشعب (تواصل معنا) ✉️
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  قراءة والرد على الرسائل والطلبات الواردة من أبناء الكنيسة.
                </p>
              </div>
            </div>

            {unreadMessagesCount > 0 && (
              <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-xl text-xs font-black">
                ({unreadMessagesCount}) رسائل غير مقروءة 🔔
              </span>
            )}
          </div>

          {contactMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MailOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">لا توجد رسائل واردة حالياً من الشعب</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="p-3.5 font-bold">الاسم ورقم الهاتف</th>
                    <th className="p-3.5 font-bold">الرسالة</th>
                    <th className="p-3.5 font-bold">التاريخ</th>
                    <th className="p-3.5 font-bold">الحالة</th>
                    <th className="p-3.5 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contactMessages.slice(0, 10).map((msg) => (
                    <tr key={msg.id} className={`hover:bg-slate-50/80 transition-colors ${msg.status === 'unread' ? 'bg-blue-50/30 font-bold' : ''}`}>
                      <td className="p-3.5">
                        <div className="font-bold text-[#00174a]">{msg.name}</div>
                        {msg.phone && <div className="text-[11px] text-slate-500">{msg.phone}</div>}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600">{msg.message}</td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          msg.status === 'unread'
                            ? 'bg-rose-100 text-rose-800'
                            : msg.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {msg.status === 'unread' ? 'جديدة' : msg.status === 'replied' ? 'تم الرد' : 'تمت القراءة'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (msg.status === 'unread') {
                                handleMessageStatus(msg.id, 'read');
                              }
                            }}
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="قراءة الرسالة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto">
              
              <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MailOpen className="w-5 h-5 text-[#fed65b]" />
                  <h3 className="font-tajawal text-base font-black text-[#fed65b]">
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

              <div className="p-6 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">الاسم:</span>
                    <span className="text-[#00174a] font-bold">{selectedMessage.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">رقم الهاتف:</span>
                    <span className="text-[#00174a] font-bold">{selectedMessage.phone || 'غير مسجل'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold block">نص الرسالة:</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMessageStatus(selectedMessage.id, 'replied')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تم الرد على الشعب</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
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

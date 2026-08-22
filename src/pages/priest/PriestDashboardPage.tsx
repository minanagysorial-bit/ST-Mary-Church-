import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Link } from 'react-router-dom';
import { api, type ContactMessage } from '../../lib/api';
import type { MembershipComment, Sermon, Liturgy, PrayerRequest } from '../../lib/database.types';
import { useToast } from '../../components/common/Toast';
import { Radio, RefreshCw, Send, Trash2, MailOpen, AlertCircle, Play, Heart, MessageSquare } from 'lucide-react';

export const PriestDashboardPage: React.FC = () => {
  const toast = useToast();
  const [comments, setComments] = useState<MembershipComment[]>([]);
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingStream, setSubmittingStream] = useState(false);

  // Live Stream editor form states
  const [streamActive, setStreamActive] = useState('false');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDesc, setStreamDesc] = useState('');

  const fetchPriestDashboardData = async () => {
    try {
      const [l, c, p, s, msg, settings] = await Promise.all([
        api.getLiturgies(),
        api.getMembershipComments(),
        api.getPrayerRequests(),
        api.getSermons(),
        api.getContactMessages(),
        api.getSiteSettings(),
      ]);
      setLiturgies(l);
      setComments(c);
      setPrayers(p);
      setSermons(s);
      setContactMessages(msg);
      setSiteSettings(settings);

      setStreamActive(settings.live_stream_active || 'false');
      setStreamUrl(settings.live_stream_youtube_url || '');
      setStreamTitle(settings.live_stream_title || '');
      setStreamDesc(settings.live_stream_description || '');
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
      const updatedSettings = {
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
    } catch (err: any) {
      toast.error('فشل حذف الرسالة: ' + err.message);
    }
  };

  const pendingCommentsCount = comments.filter(c => c.status === 'قيد المراجعة').length;
  const thisMonthSermons = sermons.filter(s => {
    const d = new Date(s.sermon_date || s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Activity log (dynamic + static fallback)
  const latestPrayer = prayers[0];
  const latestComment = comments[0];

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo" dir="rtl">

        {/* Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00113a] mb-1">
              سلام ونعمة، أبونا مينا
            </h3>
            <p className="text-sm text-[#444650] font-semibold">
              إليك ملخص شامل لأنشطة الكنيسة لهذا الأسبوع.
            </p>
          </div>
          <Link
            to="/priest/sermons"
            className="bg-[#00113a] text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>إضافة عظة جديدة</span>
          </Link>
        </div>

        {/* 4 Summary Cards (Bento Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Liturgies */}
          <div className="bg-white p-6 rounded-xl border border-[#c5c6d2]/30 transition-all duration-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#00113a]/5 rounded-lg">
                <span className="material-symbols-outlined text-[#00113a]">church</span>
              </div>
            </div>
            <p className="text-[#444650] text-xs font-semibold mb-1">القداسات الإلهية</p>
            <h4 className="font-tajawal text-3xl font-extrabold text-[#00113a]">
              {loading ? '...' : liturgies.length.toLocaleString('ar-EG')}
            </h4>
          </div>

          {/* Prayer Requests */}
          <div className="bg-white p-6 rounded-xl border border-[#c5c6d2]/30 transition-all duration-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#735c00]/5 rounded-lg">
                <span className="material-symbols-outlined text-[#735c00]">favorite</span>
              </div>
              <span className="text-[#735c00] bg-[#fed65b]/20 px-2 py-1 rounded text-[10px] font-bold">طلبات الصلاة</span>
            </div>
            <p className="text-[#444650] text-xs font-semibold mb-1">طلبات الصلاة</p>
            <h4 className="font-tajawal text-3xl font-extrabold text-[#00113a]">
              {loading ? '...' : prayers.length.toLocaleString('ar-EG')}
            </h4>
          </div>

          {/* Monthly Sermons */}
          <div className="bg-white p-6 rounded-xl border border-[#c5c6d2]/30 transition-all duration-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#501300]/5 rounded-lg">
                <span className="material-symbols-outlined text-[#d37758]">podcasts</span>
              </div>
            </div>
            <p className="text-[#444650] text-xs font-semibold mb-1">عظات الشهر</p>
            <h4 className="font-tajawal text-3xl font-extrabold text-[#00113a]">
              {loading ? '...' : thisMonthSermons.toLocaleString('ar-EG')}
            </h4>
          </div>

          {/* Contact Messages */}
          <div className="bg-white p-6 rounded-xl border border-[#c5c6d2]/30 transition-all duration-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#ba1a1a]/5 rounded-lg">
                <span className="material-symbols-outlined text-[#ba1a1a]">mail</span>
              </div>
              <div className="w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse" />
            </div>
            <p className="text-[#444650] text-xs font-semibold mb-1">رسائل الشعب</p>
            <h4 className="font-tajawal text-3xl font-extrabold text-[#00113a]">
              {loading ? '...' : contactMessages.length.toLocaleString('ar-EG')}
            </h4>
          </div>
        </div>

        {/* Main Grid: Activities & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h5 className="text-lg font-bold text-[#00113a] font-tajawal">آخر التحديثات والنشاطات</h5>
              <Link to="/priest/services" className="text-[#00113a] hover:underline font-semibold flex items-center gap-1 text-sm">
                عرض الكل <span className="material-symbols-outlined text-sm">chevron_left</span>
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-[#c5c6d2]/30 shadow-sm overflow-hidden divide-y divide-[#c5c6d2]/20">
              
              {/* Activity 1: New Prayer Request */}
              <div className="p-5 flex gap-4 hover:bg-[#fbf9f8] transition-colors">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#735c00]/10 flex items-center justify-center text-[#735c00] border border-[#735c00]/20">
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#735c00] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-white">add</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-[#1b1c1c]">طلب صلاة جديد</p>
                    <span className="text-xs text-[#444650]">مستجد</span>
                  </div>
                  <p className="text-sm text-[#444650]">
                    {latestPrayer ? `تم تلقي طلب صلاة جديد من: "${latestPrayer.requester_name || 'فاعل خير'}".` : 'لا توجد طلبات صلاة جديدة اليوم.'}
                  </p>
                </div>
              </div>

              {/* Activity 2: Liturgies */}
              <div className="p-5 flex gap-4 hover:bg-[#fbf9f8] transition-colors">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#00113a]/10 flex items-center justify-center text-[#00113a]">
                    <span className="material-symbols-outlined">church</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00113a] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-white">update</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-[#1b1c1c]">تحديث مواعيد القداسات</p>
                    <span className="text-xs text-[#444650]">منذ ساعتين</span>
                  </div>
                  <p className="text-sm text-[#444650]">تم تعديل موعد قداس الأربعاء ليبدأ في تمام الساعة ٦:٠٠ صباحاً بدلاً من ٧:٠٠.</p>
                </div>
              </div>

              {/* Activity 3: Comment */}
              <div className="p-5 flex gap-4 hover:bg-[#fbf9f8] transition-colors">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#f5f3f3] flex items-center justify-center overflow-hidden border border-[#c5c6d2]/50">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdlI8NMRg17shngWBBtzX_VRh9H-O5QJF-GFGVPOa4KmUjOL3KBGxNrkEhCM6E1vZlUf7kRSbQ2-2cosv72W_CaD39HZAen8IFwFgS4mbBeY486f2VZSdxvvIJx48snssYq44r2zCqT81RLX2WkpenbjC9FP5WmfgZGOs_X-ozscYTlZpwYYRgPLdPNoYIh252UQbeInu3JV478__GVqlBAs3_4hwO0Fo5GCRuzG9CK6PepX8bxA0QwqltoyoJstEYr7Qs2VA2zLqd" alt="User" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ba1a1a] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-white">comment</span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-[#1b1c1c]">تعليق جديد على عظة</p>
                    <span className="text-xs text-[#444650]">منذ ٥ ساعات</span>
                  </div>
                  <p className="text-sm text-[#444650]">
                    {latestComment 
                      ? `طلب العضوية من "${latestComment.applicant_name}" للخدمة: "${latestComment.requested_service}"`
                      : 'علق "أستاذ هاني" على عظة الأحد الماضي: "كلمات معزية جداً يا أبونا.."'
                    }
                  </p>
                </div>
              </div>

              {/* Activity 4: Announcement */}
              <div className="p-5 flex gap-4 hover:bg-[#fbf9f8] transition-colors">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#ffdbd0]/20 flex items-center justify-center text-[#d37758]">
                    <span className="material-symbols-outlined">campaign</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-[#1b1c1c]">تنويه هام للشباب</p>
                    <span className="text-xs text-[#444650]">أمس</span>
                  </div>
                  <p className="text-sm text-[#444650]">تم نشر تنويه بخصوص مؤتمر الشباب القادم في بيت القديس أنطونيوس.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Schedule & Static Stats */}
          <div className="space-y-8">
            {/* Quick Schedule */}
            <div>
              <h5 className="text-base font-bold text-[#00113a] mb-5 font-tajawal">جدول الخدمة اليوم</h5>
              <div className="bg-white rounded-xl border border-[#c5c6d2]/30 shadow-sm p-6 space-y-4">
                
                <div className="flex items-center gap-4 border-r-4 border-[#735c00] pr-4 py-2 bg-[#735c00]/5 rounded-l-lg">
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className="text-sm font-bold text-[#735c00]">٠٨:٠٠</p>
                    <p className="text-[10px] text-[#444650]">صباحاً</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#00113a]">قداس يومي</p>
                    <p className="text-xs text-[#444650]">المذبح الرئيسي</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-r-4 border-[#c5c6d2] pr-4 py-2">
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className="text-sm font-bold text-[#444650]">١٠:٣٠</p>
                    <p className="text-[10px] text-[#444650]">صباحاً</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b1c1c]">افتقاد منزلي</p>
                    <p className="text-xs text-[#444650]">منطقة سويتر</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-r-4 border-[#c5c6d2] pr-4 py-2">
                  <div className="text-center min-w-[50px] shrink-0">
                    <p className="text-sm font-bold text-[#444650]">٠٦:٠٠</p>
                    <p className="text-[10px] text-[#444650]">مساءً</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b1c1c]">اجتماع الخدام</p>
                    <p className="text-xs text-[#444650]">قاعة الدور الثالث</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Statistics snapshot card */}
            <div className="bg-[#00113a] p-6 rounded-xl text-white relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <span className="material-symbols-outlined text-9xl">auto_graph</span>
              </div>
              <h6 className="font-tajawal text-base font-bold mb-4">أداء المحتوى</h6>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>مشاهدات العظات</span>
                    <span>٨٥٪</span>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full">
                    <div className="bg-[#fed65b] h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>تفاعل الأعضاء</span>
                    <span>٦٢٪</span>
                  </div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full">
                    <div className="bg-[#fed65b] h-full rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] mt-6 text-white/60">تحليل البيانات يعتمد على آخر ٣٠ يوم عمل.</p>
            </div>
          </div>
        </div>

        {/* Database Integrations: Prayer Requests list */}
        <div className="bg-white rounded-xl p-6 border border-[#c5c6d2]/30 shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between border-b border-[#c5c6d2]/20 pb-3 mb-5">
            <h5 className="font-tajawal text-base font-bold text-[#00113a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fed65b]">favorite</span>
              متابعة طلبات الصلاة الواردة
            </h5>
            <span className="text-xs bg-[#f5f3f3] text-[#444650] px-3 py-1 rounded-full font-bold">
              {prayers.length.toLocaleString('ar-EG')} طلب صلاة
            </span>
          </div>

          <div className="space-y-3 font-semibold text-xs sm:text-sm">
            {loading ? (
              <p className="text-[#444650] text-[#1b1c1c]/70 text-center py-4 text-sm font-bold">جاري تحميل البيانات...</p>
            ) : prayers.length === 0 ? (
              <p className="text-[#444650] text-[#1b1c1c]/70 text-center py-4 text-sm font-bold">لا توجد طلبات صلاة مسجلة حالياً.</p>
            ) : (
              prayers.slice(0, 5).map(p => (
                <div key={p.id} className="p-4 bg-[#f5f3f3]/50 rounded-xl border border-[#c5c6d2]/20 flex items-center justify-between hover:bg-[#f5f3f3] transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <h6 className="font-bold text-[#00113a] text-sm">طالب الصلاة: {p.requester_name || 'فاعل خير'}</h6>
                    <p className="text-xs text-[#444650] mt-1 line-clamp-2">{p.request_text}</p>
                  </div>
                  <span className={`font-bold px-3.5 py-1.5 rounded-full text-[10px] whitespace-nowrap shrink-0 ${
                    p.is_read
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : 'bg-amber-50 text-amber-800 border border-[#fed65b]/50'
                  }`}>
                    {p.is_read ? 'تمت قراءتها' : 'جديدة قيد الصلاة'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priest Live Stream & Inbound Contact Messages Restructure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Live Stream Controller (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#c5c6d2]/30 shadow-sm text-right flex flex-col justify-between">
            <div>
              <h5 className="font-tajawal text-base font-bold text-[#00113a] border-b border-[#c5c6d2]/20 pb-3 mb-5 flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#d4af37]" />
                <span>التحكم في البث المباشر</span>
              </h5>
              
              <form onSubmit={handleUpdateLiveStream} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[11px] font-bold text-slate-700">البث المباشر نشط الآن:</span>
                  <select
                    value={streamActive}
                    onChange={e => setStreamActive(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs outline-none focus:border-[#002366] font-bold"
                  >
                    <option value="false">مغلق</option>
                    <option value="true">مفتوح (نشط)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">رابط فيديو البث (يوتيوب)</label>
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={e => setStreamUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">عنوان البث</label>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={e => setStreamTitle(e.target.value)}
                    placeholder="القداس الإلهي..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">وصف وتفاصيل البث</label>
                  <textarea
                    value={streamDesc}
                    onChange={e => setStreamDesc(e.target.value)}
                    placeholder="اكتب تفاصيل البث هنا..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] h-16 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingStream}
                  className="w-full bg-[#00113a] hover:bg-[#002366] text-[#fed65b] font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${submittingStream ? 'animate-spin' : ''}`} />
                  <span>{submittingStream ? 'جاري التحديث والحفظ...' : 'تحديث وحفظ البث'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* 2. Inbound Contact Messages (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#c5c6d2]/30 shadow-sm text-right flex flex-col justify-between">
            <div>
              <h5 className="font-tajawal text-base font-bold text-[#00113a] border-b border-[#c5c6d2]/20 pb-3 mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#d4af37]" />
                <span>رسائل نموذج تواصل معنا ({contactMessages.length})</span>
              </h5>

              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-center text-slate-400 text-xs py-10 font-bold">جاري تحميل الرسائل...</p>
                ) : contactMessages.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-10 font-bold">لا توجد رسائل واردة حالياً.</p>
                ) : (
                  contactMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-2xl border transition-all text-xs font-semibold relative ${
                        msg.status === 'unread' 
                          ? 'bg-amber-50/50 border-amber-200/60 shadow-sm' 
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-[#002366]">{msg.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">تليفون: <span className="font-mono">{msg.phone}</span> — {new Date(msg.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {msg.status === 'unread' && (
                            <button
                              onClick={() => handleMessageStatus(msg.id, 'read')}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold"
                              title="تحديد كمقروءة"
                            >
                              غير مقروءة
                            </button>
                          )}
                          {msg.status !== 'unread' && (
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold select-none">
                              تمت قراءتها
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="مسح الرسالة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-slate-650 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-100">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Database Integrations: Content Performance summary counts */}
        <div className="bg-white rounded-xl p-6 border border-[#c5c6d2]/30 shadow-sm transition-all duration-200">
          <h5 className="font-tajawal text-base font-bold text-[#00113a] border-b border-[#c5c6d2]/20 pb-3 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fed65b]">bar_chart</span>
            مؤشرات الأداء العامة
          </h5>
          <p className="text-xs text-[#444650] mb-4">تحليل إحصائي مباشر للأشهر السابقة.</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#00113a]/5 rounded-xl p-4 text-center">
              <h4 className="font-tajawal text-2xl font-extrabold text-[#00113a]">
                {loading ? '...' : sermons.length.toLocaleString('ar-EG')}
              </h4>
              <p className="text-[10px] text-[#444650] font-bold mt-1">إجمالي العظات</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <h4 className="font-tajawal text-2xl font-extrabold text-emerald-700">
                {loading ? '...' : prayers.length.toLocaleString('ar-EG')}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mt-1">طلبات الصلاة</p>
            </div>
            <div className="bg-[#fed65b]/10 rounded-xl p-4 text-center">
              <h4 className="font-tajawal text-2xl font-extrabold text-[#735c00]">
                {loading ? '...' : comments.length.toLocaleString('ar-EG')}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mt-1">التعليقات</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Bell,
  Send,
  Smartphone,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  BookOpen,
  Calendar,
  Layers,
  Cross
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  requestNotificationPermission,
  triggerLocalNotification,
  broadcastChurchNotification,
  isNotificationSupported,
  getNotificationPermission
} from '../../lib/pushNotifications';
import { api, Announcement } from '../../lib/api';

const LOGO_PRESETS = [
  { label: 'أيقونة الكنيسة الرسمية', url: '/favicon.svg' },
  { label: 'صورة مبنى الكنيسة', url: '/church.jpeg' },
];

const TEMPLATES = [
  {
    title: '🔴 بدأ الآن البث المباشر للقداس الإلهي',
    body: 'نرحب بكم للمشاركة معنا في صلاة القداس الإلهي المنقولة مباشرة من كنيسة العذراء بمحرم بك.',
    url: '/live',
    icon: '/favicon.svg'
  },
  {
    title: '🌅 آية اليوم والسنكسار الكنسي',
    body: 'تعرف على قراءات وسنكسار اليوم وتأمل في كلمة الله من كنيسة السيدة العذراء بمحرم بك.',
    url: '/readings',
    icon: '/favicon.svg'
  },
  {
    title: '⛪ تذكير بمواعيد قداسات الأسبوع الحالي',
    body: 'تم تحديث جدول مواعيد القداسات وتوزيع الآباء الكهنة لهذا الأسبوع في الكنيسة.',
    url: '/schedule',
    icon: '/favicon.svg'
  },
  {
    title: '📢 إعلان كنسي وخدمي هام',
    body: 'تعلن كنيسة السيدة العذراء مريم بمحرم بك عن مواعيد الخدمة والاجتماعات الروحية القادمة.',
    url: '/about',
    icon: '/favicon.svg'
  }
];

export const PushNotificationsPage: React.FC = () => {
  const { profile } = useAuth();

  // Form State
  const [title, setTitle] = useState('🔴 بدأ الآن البث المباشر للقداس الإلهي');
  const [body, setBody] = useState('نرحب بكم للمشاركة معنا في صلاة القداس الإلهي المنقولة مباشرة من كنيسة العذراء بمحرم بك.');
  const [targetUrl, setTargetUrl] = useState('/live');
  const [iconUrl, setIconUrl] = useState('/favicon.svg');
  const [imageUrl, setImageUrl] = useState('');

  // Status State
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [sentList, setSentList] = useState<Announcement[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchHistory = async () => {
    setLoadingList(true);
    try {
      const data = await api.getAnnouncements();
      setSentList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setSuccessMsg('تم تفعيل استقبال الإشعارات على هذا الجهاز بنجاح!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('تم رفض إذن الإشعارات من إعدادات المتصفح.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setTargetUrl(tmpl.url);
    setIconUrl(tmpl.icon);
  };

  const handleTestOnMyDevice = async () => {
    if (permission !== 'granted') {
      const newPerm = await requestNotificationPermission();
      setPermission(newPerm);
      if (newPerm !== 'granted') {
        setErrorMsg('يرجى السماح بإذن الإشعارات لتجربتها على جهازك.');
        return;
      }
    }

    const success = await triggerLocalNotification({
      title,
      body,
      icon: iconUrl,
      image: imageUrl || undefined,
      url: targetUrl
    });

    if (success) {
      setSuccessMsg('تم إرسال إشعار تجريبي لشاشة هاتفك / جهازك بنجاح! 🔔');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg('تعذر إظهار الإشعار. تأكد من تفعيل إشعارات المتصفح.');
    }
  };

  const handleBroadcastToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('يرجى كتابة عنوان الإشعار ونص الرسالة.');
      return;
    }

    setSending(true);
    setErrorMsg(null);
    try {
      await broadcastChurchNotification({
        title: title.trim(),
        body: body.trim(),
        icon: iconUrl,
        image: imageUrl.trim() || undefined,
        url: targetUrl.trim() || '/'
      }, profile?.id);

      setSuccessMsg('تم بث وإرسال الإشعار لجميع الأجهزة والمشتركين بنجاح! 🎉');
      fetchHistory();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء بث الإشعار.');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-[#d4af37]" />
              <span>إدارة وبث الإشعارات الفورية (Push Notifications)</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              إرسال إشعارات تظهر على شاشات هواتف شعب الكنيسة مباشرة باللوجو والنص والرابط
            </p>
          </div>

          <div className="flex items-center gap-2">
            {permission !== 'granted' ? (
              <button
                onClick={handleEnablePermission}
                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Bell className="w-4 h-4 text-amber-700" />
                <span>تفعيل إشعارات جهازي</span>
              </button>
            ) : (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>إشعارات جهازك مفعلة</span>
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Templates */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#002366]">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>نماذج إشعارات جاهزة وسريعة:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-2xl text-right transition-all group"
              >
                <p className="font-tajawal text-xs font-extrabold text-[#002366] group-hover:text-amber-900 line-clamp-1">
                  {tmpl.title}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {tmpl.body}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Form (Left) & Mobile Mockup Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form */}
          <form onSubmit={handleBroadcastToAll} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="font-tajawal text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#d4af37]" />
              <span>إنشاء وتخصيص الإشعار</span>
            </h2>

            {/* Notification Title */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold text-xs block">عنوان الإشعار *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: 🔴 بث مباشر للقداس الإلهي الآن"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-[#002366]"
              />
            </div>

            {/* Notification Body */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold text-xs block">نص رسالة الإشعار *</label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب تفاصيل التنبيه أو الآية الروحية هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-xs outline-none focus:border-[#002366] resize-none"
              />
            </div>

            {/* Target URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold text-xs block flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>الرابط عند الضغط على الإشعار</span>
                </label>
                <select
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-[#002366]"
                >
                  <option value="/live">صفحة البث المباشر (/live)</option>
                  <option value="/schedule">جدول القداسات (/schedule)</option>
                  <option value="/readings">قراءات والسنكسار اليومي (/readings)</option>
                  <option value="/sermons">مكتبة العظات (/sermons)</option>
                  <option value="/about/memory">ذاكرة الكنيسة والألبومات (/about/memory)</option>
                  <option value="/">الصفحة الرئيسية (/)</option>
                </select>
              </div>

              {/* Logo Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold text-xs block flex items-center gap-1">
                  <Cross className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>شعار / لوجو الإشعار</span>
                </label>
                <select
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-[#002366]"
                >
                  {LOGO_PRESETS.map((p, idx) => (
                    <option key={idx} value={p.url}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Banner Image URL */}
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold text-xs block flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>رابط صورة عريضة اختيارية (Banner Image)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... اختياري: صورة مرفقة بالإشعار"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-semibold text-xs outline-none focus:border-[#002366]"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestOnMyDevice}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200"
              >
                <Smartphone className="w-4 h-4 text-[#002366]" />
                <span>تجربة الإشعار على جهازي الآن 📱</span>
              </button>

              <button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-extrabold text-xs px-7 py-3 rounded-xl shadow-lg shadow-[#002366]/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                <span>{sending ? 'جاري البث...' : 'إرسال وبث لجميع شعب الكنيسة 🚀'}</span>
              </button>
            </div>

          </form>

          {/* Live Mobile Notification Mockup Preview */}
          <div className="space-y-3">
            <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#d4af37]" />
              <span>معاينة الإشعار على شاشة الهاتف:</span>
            </h3>

            {/* Phone Lockscreen Card */}
            <div className="bg-[#00113a] text-white p-5 rounded-3xl shadow-2xl border-4 border-slate-800 space-y-4 max-w-sm mx-auto">
              
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-white/10 pb-2">
                <span>09:41</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Notification Banner on Phone */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/20 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={iconUrl}
                      alt="App Icon"
                      className="w-5 h-5 rounded-md object-contain bg-[#00174a] p-0.5"
                    />
                    <span className="text-[11px] font-tajawal font-extrabold text-[#fed65b]">
                      كنيسة العذراء محرم بك
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">الآن</span>
                </div>

                <div className="space-y-0.5 text-right">
                  <p className="font-tajawal text-xs font-bold text-white leading-tight">
                    {title || 'عنوان الإشعار...'}
                  </p>
                  <p className="text-[11px] text-slate-200 leading-snug line-clamp-2">
                    {body || 'نص الرسالة والتنبيه...'}
                  </p>
                </div>

                {imageUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video w-full bg-black/40 mt-2">
                    <img src={imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  يفتح الرابط: {targetUrl}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* History of Sent Notifications Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-tajawal text-base font-extrabold text-[#002366]">
              سجل الإشعارات والتنبيهات السابقة ({sentList.length})
            </h2>
            <span className="text-xs text-slate-500 font-bold">بث مباشر للأجهزة</span>
          </div>

          {loadingList ? (
            <div className="p-10 text-center text-slate-400 font-bold">جاري تحميل سجل الإشعارات...</div>
          ) : sentList.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold">لا توجد إشعارات سابقة مسجلة.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                    <th className="p-4">العنوان</th>
                    <th className="p-4">نص الإشعار</th>
                    <th className="p-4">تاريخ الإرسال</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {sentList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-[#002366]">{item.title}</td>
                      <td className="p-4 text-slate-600 max-w-md line-clamp-1">{item.content}</td>
                      <td className="p-4 text-slate-400 font-mono">{item.start_date || item.created_at?.split('T')[0]}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                          تم البث بنجاح
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type PrayerRequest, type ContactMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageSquare,
  Heart,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Check,
  Eye,
  Calendar,
  Phone,
  Download
} from 'lucide-react';

export const CommunicationsPage: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'prayers' | 'messages'>('prayers');
  
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prayersData, messagesData, settings] = await Promise.all([
        api.getPrayerRequests(),
        api.getContactMessages(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);

      setSiteSettings(settings);

      // Auto-clean & delete prayers older than 7 days (Weekly Pruning)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const expiredPrayers = prayersData.filter(p => new Date(p.submitted_at) < sevenDaysAgo);
      if (expiredPrayers.length > 0) {
        expiredPrayers.forEach(p => api.deletePrayerRequest(p.id).catch(console.warn));
      }

      const validWeeklyPrayers = prayersData.filter(p => new Date(p.submitted_at) >= sevenDaysAgo);
      setPrayers(validWeeklyPrayers);
      setMessages(messagesData);
    } catch (err: any) {
      console.error('Error loading communications:', err);
      setErrorMsg('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getHandledInfo = (key: string): { priest_name: string; handled_at: string } | null => {
    const raw = siteSettings[key];
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const handleMarkPrayerPrayed = async (id: string) => {
    const priestTitle = profile?.full_name?.startsWith('أبونا') 
      ? profile.full_name 
      : (profile?.role === 'priest' ? `أبونا ${profile.full_name}` : (profile?.full_name || 'أحد الآباء الكهنة'));
    const key = `prayer_handled_${id}`;
    const info = JSON.stringify({
      priest_name: priestTitle,
      priest_id: profile?.id,
      handled_at: new Date().toISOString()
    });

    try {
      await api.updatePrayerRequestStatus(id, true);
      await api.updateSiteSettings({ [key]: info }).catch(console.warn);
      setSiteSettings(prev => ({ ...prev, [key]: info }));
      setPrayers(prev => prev.map(p => (p.id === id ? { ...p, is_read: true } : p)));
      setSuccessMsg(`تم تسجيل الصلاة للطلب بواسطة ${priestTitle} بنجاح 🙏`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg('فشل تحديث حالة الصلاة: ' + err.message);
    }
  };

  const handleMarkMessageReceived = async (id: string) => {
    const priestTitle = profile?.full_name?.startsWith('أبونا') 
      ? profile.full_name 
      : (profile?.role === 'priest' ? `أبونا ${profile.full_name}` : (profile?.full_name || 'أحد الآباء الكهنة'));
    const key = `contact_handled_${id}`;
    const info = JSON.stringify({
      priest_name: priestTitle,
      priest_id: profile?.id,
      handled_at: new Date().toISOString()
    });

    try {
      await api.updateContactMessageStatus(id, 'replied');
      await api.updateSiteSettings({ [key]: info }).catch(console.warn);
      setSiteSettings(prev => ({ ...prev, [key]: info }));
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, status: 'replied' } : m)));
      setSuccessMsg(`تم تسجيل استلام الحالة والتواصل بواسطة ${priestTitle} بنجاح 📞`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg('فشل تحديث حالة الرسالة: ' + err.message);
    }
  };

  const handleTogglePrayerRead = async (id: string, currentRead: boolean) => {
    try {
      await api.updatePrayerRequestStatus(id, !currentRead);
      setPrayers(prev =>
        prev.map(p => (p.id === id ? { ...p, is_read: !currentRead } : p))
      );
      setSuccessMsg('تم تحديث حالة طلب الصلاة بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('فشل تحديث حالة الطلب: ' + err.message);
    }
  };

  const handleToggleMessageStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'unread' ? 'read' : 'unread';
    try {
      await api.updateContactMessageStatus(id, nextStatus as any);
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, status: nextStatus as any } : m))
      );
      setSuccessMsg('تم تحديث حالة الرسالة بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('فشل تحديث حالة الرسالة: ' + err.message);
    }
  };

  const handleDeletePrayer = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طلب الصلاة هذا نهائياً؟')) return;
    try {
      await api.deletePrayerRequest(id);
      setPrayers(prev => prev.filter(p => p.id !== id));
      setSuccessMsg('تم حذف طلب الصلاة بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('فشل حذف طلب الصلاة: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) return;
    try {
      await api.deleteContactMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      setSuccessMsg('تم حذف الرسالة بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('فشل حذف الرسالة: ' + err.message);
    }
  };

  const handleExportPrayers = () => {
    if (filteredPrayers.length === 0) {
      alert('لا توجد طلبات صلاة مطابقة لتصديرها');
      return;
    }

    const headers = ['اسم مقدم الطلب', 'نص الصلاة', 'تاريخ التقديم', 'الحالة'];
    const rows = filteredPrayers.map(p => [
      p.requester_name || 'فاعل خير',
      p.request_text.replace(/"/g, '""'),
      new Date(p.submitted_at).toLocaleString('ar-EG'),
      p.is_read ? 'مقروءة' : 'جديدة'
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `طلبات_الصلاة_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMessages = () => {
    if (filteredMessages.length === 0) {
      alert('لا توجد رسائل تواصل مطابقة لتصديرها');
      return;
    }

    const headers = ['الاسم', 'رقم الهاتف', 'الرسالة', 'التاريخ', 'الحالة'];
    const rows = filteredMessages.map(m => [
      m.name,
      m.phone,
      m.message.replace(/"/g, '""'),
      new Date(m.created_at).toLocaleString('ar-EG'),
      m.status === 'read' ? 'مقروءة' : 'غير مقروءة'
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `رسائل_تواصل_معنا_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists based on search
  const filteredPrayers = prayers.filter(p =>
    p.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.request_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm) ||
    m.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Unread counts for badges
  const unreadPrayersCount = prayers.filter(p => !p.is_read).length;
  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;

  return (
    <DashboardLayout role={profile?.role as any || 'admin'}>
      <div className="space-y-8 font-cairo" dir="rtl">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] to-[#002366] p-6 rounded-3xl text-white shadow-xl border border-[#d4af37]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-2xl text-[#fed65b]">طلبات الصلاة والرسائل</h1>
            </div>
            <p className="text-slate-300 text-sm">متابعة طلبات الصلاة المقدمة من الشعب وتفقد رسائل تواصل معنا الواردة للموقع</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => { setActiveTab('prayers'); setSearchTerm(''); }}
            className={`pb-4 text-base font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'prayers'
                ? 'text-[#002366] border-b-2 border-[#d4af37]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>طلبات الصلاة</span>
            {unreadPrayersCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadPrayersCount} جديد
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('messages'); setSearchTerm(''); }}
            className={`pb-4 text-base font-bold transition-all relative flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'text-[#002366] border-b-2 border-[#d4af37]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Mail className="w-5 h-5" />
            <span>رسائل تواصل معنا</span>
            {unreadMessagesCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadMessagesCount} جديد
              </span>
            )}
          </button>
        </div>

        {/* Search Bar & Export */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'prayers' ? "البحث بـاسم مقدم الطلب أو بنص الصلاة..." : "البحث بالاسم، برقم الهاتف أو بنص الرسالة..."}
              className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-medium text-sm shadow-sm focus:ring-2 focus:ring-[#002366]"
            />
          </div>
          <button
            onClick={activeTab === 'prayers' ? handleExportPrayers : handleExportMessages}
            className="bg-[#002366] hover:bg-[#00113a] text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تصدير إلى Excel</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 text-sm font-bold rounded-2xl flex items-center gap-3 border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold">جاري تحميل البيانات...</p>
          </div>
        ) : activeTab === 'prayers' ? (
          filteredPrayers.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 space-y-2">
              <Heart className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="font-bold text-slate-600">لا يوجد طلبات صلاة للأسبوع الحالي</p>
              <p className="text-xs text-slate-400">يتم تجديد طلبات الصلاة ومسحها تلقائياً كل ٧ أيام للمحافظة على المتابعة الدورية.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>تنبيه رعوي: طلبات الصلاة خاصة بالأسبوع الحالي وتُحذف تلقائياً كل أسبوع (٧ أيام) لضمان الصلاة من أجل الحالات والطلبات الجديدة أولاً بأول.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrayers.map(p => {
                  const handledInfo = getHandledInfo(`prayer_handled_${p.id}`);

                  return (
                    <div
                      key={p.id}
                      className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                        !p.is_read
                          ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border-blue-200 shadow-md ring-1 ring-blue-400/20'
                          : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base font-tajawal text-[#00123a] flex items-center gap-2">
                            <span>{p.requester_name || 'فاعل خير'}</span>
                            {!p.is_read ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200">
                                جديد
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                تمت الصلاة
                              </span>
                            )}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(p.submitted_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-cairo">
                          "{p.request_text}"
                        </p>

                        {/* Priest Handled Status Badge */}
                        {handledInfo && (
                          <div className="flex items-center gap-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 shadow-xs">
                            <Heart className="w-4 h-4 text-amber-600 shrink-0 fill-current" />
                            <span>تمت الصلاة بواسطة: {handledInfo.priest_name} ({new Date(handledInfo.handled_at).toLocaleDateString('ar-EG')})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkPrayerPrayed(p.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                              p.is_read
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-[#002366] hover:bg-[#00174a] text-[#fed65b]'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span>{p.is_read ? 'تمت الصلاة ✓' : 'تم الصلاة'}</span>
                          </button>

                          <button
                            onClick={() => handleTogglePrayerRead(p.id, p.is_read)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            {p.is_read ? 'تغيير لجديد' : 'كمقروء'}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePrayer(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          filteredMessages.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 space-y-2">
              <Mail className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="font-bold text-slate-600">لا يوجد رسائل تواصل مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMessages.map(m => {
                const handledInfo = getHandledInfo(`contact_handled_${m.id}`);

                return (
                  <div
                    key={m.id}
                    className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                      m.status === 'unread'
                        ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border-blue-200 shadow-md ring-1 ring-blue-400/20'
                        : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base font-tajawal text-[#00123a] flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.status === 'unread' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] bg-blue-100 text-blue-800 font-bold border border-blue-200">
                              جديد
                            </span>
                          ) : m.status === 'replied' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              تم التواصل
                            </span>
                          ) : null}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(m.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#002366] font-bold">
                        <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span dir="ltr">{m.phone}</span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-cairo">
                        {m.message}
                      </p>

                      {/* Handled Info Badge for Contact Messages */}
                      {handledInfo && (
                        <div className="flex items-center gap-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 shadow-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تم الاستلام والتواصل بواسطة: {handledInfo.priest_name} ({new Date(handledInfo.handled_at).toLocaleDateString('ar-EG')})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkMessageReceived(m.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                            m.status === 'replied'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{m.status === 'replied' ? 'تم الاستلام والتواصل ✓' : 'تم الاستلام للتواصل معنا'}</span>
                        </button>

                        <button
                          onClick={() => handleToggleMessageStatus(m.id, m.status)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          {m.status !== 'unread' ? 'تغيير لغير مقروء' : 'تحديد كمقروء'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="حذف الرسالة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </DashboardLayout>
  );
};
export default CommunicationsPage;

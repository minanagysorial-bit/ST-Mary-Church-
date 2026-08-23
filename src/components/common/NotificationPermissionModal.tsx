import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Radio, X, CheckCircle2, Share } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission } from '../../lib/pushNotifications';

export const NotificationPermissionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(isIosDevice);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Already granted? Re-register silently in background, don't show modal
    if (getNotificationPermission() === 'granted') {
      // Re-register to make sure subscription is in DB
      import('../../lib/pushNotifications').then(({ requestNotificationPermission: reg }) => {
        reg().catch(() => {});
      });
      return;
    }

    // Show popup after 2 seconds unless dismissed in last 3 days
    const lastDismissed = localStorage.getItem('church_popup_dismissed_at');
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const tooSoon = lastDismissed && (Date.now() - parseInt(lastDismissed)) < threeDaysMs;

    if (!tooSoon) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await requestNotificationPermission();

      if (res === 'granted') {
        setSuccess(true);
        localStorage.removeItem('church_popup_dismissed_at');
        setTimeout(() => setIsOpen(false), 2000);
      } else if (res === 'denied') {
        setErrorMsg('تم حظر الإشعارات من المتصفح. اضغط على أيقونة القفل 🔒 بجانب الرابط → الإشعارات → سماح.');
      } else {
        setErrorMsg('يرجى الضغط على "سماح (Allow)" في النافذة التي ستظهر من المتصفح.');
      }
    } catch (e) {
      setErrorMsg('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('church_popup_dismissed_at', Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-cairo text-right" dir="rtl">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#d4af37]/30 relative overflow-hidden">
        
        {/* Gold top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#00174a] via-[#d4af37] to-[#00113a]" />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md">
              <img src="/app-icon-192.png" alt="Church" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wide">كنيسة العذراء محرم بك</p>
              <h2 className="text-base font-extrabold text-[#00174a] leading-tight">فعّل إشعارات الكنيسة 🔔</h2>
            </div>
            <button onClick={handleDismiss} className="mr-auto p-1.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Features */}
          <div className="space-y-2">
            {[
              { icon: <Radio className="w-3.5 h-3.5 animate-pulse" />, color: 'bg-red-100 text-red-600', text: 'تنبيه فوري عند بدء البث المباشر للقداسات' },
              { icon: <Bell className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-[#002366]', text: 'إعلانات ومناسبات الكنيسة والنهضات الروحية' },
              { icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-700', text: 'آية اليوم وتأملات روحية يومية' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <div className={`w-6 h-6 rounded-lg ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* iOS guide */}
          {isIOS && !isStandalone && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">📱 على الآيفون — خطوتان:</p>
              <p>1. اضغط زر المشاركة <Share className="w-3 h-3 inline" /> بأسفل المتصفح</p>
              <p>2. اختر <strong>« إضافة للشاشة الرئيسية ➕ »</strong> ثم افتحه من هناك</p>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تفعيل الإشعارات! بركة صلوات العذراء تكون معك ✝️</span>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleAllow}
                disabled={loading}
                className="w-full bg-[#002366] hover:bg-[#00174a] disabled:opacity-60 text-white font-extrabold text-sm py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> جارٍ التفعيل...</>
                ) : (
                  <><Bell className="w-4 h-4 text-[#fed65b]" /> تفعيل الإشعارات الآن</>
                )}
              </button>
              <button onClick={handleDismiss} className="w-full text-slate-400 hover:text-slate-600 text-xs font-semibold py-1 text-center transition-colors">
                ربما لاحقاً
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  Radio,
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  Cross
} from 'lucide-react';
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '../../lib/pushNotifications';

export const NotificationPermissionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(isIosDevice);

    // Detect if already installed as PWA / Standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    // Catch PWA Install Prompt for Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if dismissed before
    const dismissed = localStorage.getItem('church_popup_dismissed');

    // Show popup after 3 seconds if not dismissed and not already granted
    if (!dismissed && permission !== 'granted') {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [permission]);

  const handleAllowNotifications = async () => {
    // 1. If PWA Install Prompt is available, trigger it
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        setDeferredPrompt(null);
      } catch (err) {
        console.warn(err);
      }
    }

    // 2. Request Notification Permission
    const res = await requestNotificationPermission();
    setPermission(res);

    if (res === 'granted') {
      setSuccess(true);
      localStorage.setItem('church_notifications_enabled', 'true');
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } else if (res === 'denied') {
      // If blocked, keep popup open with clear instructions
      alert('⚠️ يرجى الضغط على علامة القفل 🔒 في أعلى المتصفح والسماح بالإشعارات لاستلام تنبيهات القداسات.');
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('church_popup_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-cairo text-right" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-[#d4af37]/40 relative space-y-5 animate-scaleUp overflow-hidden">
        
        {/* Top Decorative Background Bar */}
        <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-[#00174a] via-[#d4af37] to-[#00113a]" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Church Header Icon & Title */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shadow-md shrink-0 overflow-hidden">
            <img src="/app-icon-192.png" alt="Church App Icon" className="w-full h-full rounded-2xl object-cover" />
          </div>
          <div>
            <span className="bg-[#002366]/5 text-[#002366] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#002366]/10 inline-block mb-1">
              خدمة الإشعارات والتطبيق
            </span>
            <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#00174a]">
              كنيسة السيدة العذراء محرم بك
            </h2>
          </div>
        </div>

        {/* Intro Message */}
        <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
          خليك دائماً على تواصل مع كنيستك وتابع كل الصلوات والخدمات أولاً بأول:
        </p>

        {/* Feature List */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span>تنبيه فوري عند بدء البث المباشر للقداسات والعشيات</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>آية اليوم وقراءات وسنكسار اليوم كل صباح</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#002366] flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <span>إعلانات ومناسبات الكنيسة والنهضات الروحية</span>
          </div>
        </div>

        {/* iOS Special Instructions Guide */}
        {isIOS && !isStandalone && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-[#00174a]">
              <span>📱 لتثبيت التطبيق وتفعيل الإشعارات على الآيفون:</span>
            </p>
            <p className="font-semibold text-slate-700 flex items-center gap-1.5 pt-0.5">
              1. اضغط على زر المشاركة بالأسفل <Share className="w-3.5 h-3.5 text-blue-600" />
            </p>
            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
              2. اختر <strong className="text-[#00174a]">« إضافة للشاشة الرئيسية ➕ »</strong>
            </p>
          </div>
        )}

        {/* Action Button */}
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>تم تفعيل الإشعارات بنجاح! بركة صلوات العذراء تكون معك.</span>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleAllowNotifications}
              className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-tajawal font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 group"
            >
              <Bell className="w-4 h-4 text-[#fed65b] group-hover:scale-110 transition-transform" />
              <span>تفعيل الإشعارات الآن 🔔</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold py-1.5 text-center transition-colors"
            >
              ربما لاحقاً
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Download, X, Cross, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Show subtle iOS install hint after 5 seconds
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }

    // Detect Android / Desktop Chrome BeforeInstallPrompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-50 animate-slideUp font-cairo text-right" dir="rtl">
      <div className="bg-[#00174a]/95 backdrop-blur-md border border-[#d4af37]/60 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3">
        
        {/* App Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shrink-0 shadow-md">
          <div className="w-full h-full rounded-2xl bg-[#00174a] flex items-center justify-center">
            <Cross className="w-6 h-6 text-[#fed65b]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-tajawal text-xs sm:text-sm font-extrabold text-[#fed65b]">
              تطبيق كنيسة العذراء محرم بك
            </span>
          </div>
          <p className="text-[11px] text-slate-200 font-semibold leading-tight">
            {isIOS
              ? 'اضغط على زر المشاركة ⎋ ثم "إضافة إلى الصفحة الرئيسية" ➕'
              : 'ثبّت التطبيق على شاشة هاتفك لتصفح سريع بدون إنترنت!'}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

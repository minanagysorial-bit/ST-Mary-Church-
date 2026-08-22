import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, X, HeartHandshake, Play, Sparkles, Video } from 'lucide-react';
import { api } from '../../lib/api';

interface LiveStreamBannerProps {
  onOpenPrayerModal?: () => void;
}

export const LiveStreamBanner: React.FC<LiveStreamBannerProps> = ({ onOpenPrayerModal }) => {
  const location = useLocation();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [streamTitle, setStreamTitle] = useState<string>('البث المباشر للقداس الإلهي');
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Don't show on the live page itself or in dashboard pages
    if (location.pathname === '/live' || location.pathname.startsWith('/admin') || location.pathname.startsWith('/priest') || location.pathname.startsWith('/servant') || location.pathname.startsWith('/board')) {
      return;
    }

    const checkLiveStatus = async () => {
      try {
        const settings = await api.getSiteSettings();
        const manualActive = settings.live_stream_active === 'true' || settings.is_live === 'true';
        const title = settings.live_stream_title || 'البث المباشر للقداس الإلهي والصلوات';

        // Auto schedule check (Friday & Sunday morning liturgies)
        const now = new Date();
        const day = now.getDay(); // 0: Sun, 5: Fri
        const hours = now.getHours();
        const isScheduledLiturgy = (day === 0 || day === 5) && (hours >= 6 && hours <= 11);

        if (manualActive || isScheduledLiturgy) {
          setIsActive(true);
          setStreamTitle(title);
        } else {
          setIsActive(false);
        }
      } catch (err) {
        // Fallback silently
      }
    };

    checkLiveStatus();
  }, [location.pathname]);

  if (!isActive || dismissed || location.pathname === '/live') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-700 via-rose-800 to-[#00174a] text-white px-3 sm:px-4 py-2.5 shadow-lg border-b-2 border-[#fed65b] relative z-40 animate-fadeIn font-cairo">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-right">
        
        {/* Left Side: Live Badge & Stream Title */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-2 ring-white/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>بث مباشر الآن</span>
          </span>

          <span className="font-tajawal font-bold text-xs sm:text-sm text-white drop-shadow-sm">
            {streamTitle}
          </span>
        </div>

        {/* Right Side: Quick Action Buttons & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/live"
            className="bg-[#fed65b] hover:bg-[#fed65b]/90 text-[#00174a] px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>مشاهدة البث</span>
          </Link>

          {onOpenPrayerModal && (
            <button
              onClick={onOpenPrayerModal}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#fed65b]" />
              <span className="hidden md:inline">طلب صلاة للمذبح</span>
              <span className="md:hidden">صلاة</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/70 hover:text-white rounded-lg transition-colors mr-1"
            title="إخفاء التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

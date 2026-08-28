import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Calendar, Radio, RefreshCw, Heart, BookOpen, Clock, Play, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const OFFICIAL_CHURCH_CHANNEL_ID = 'UCLEhdhZFRuxMXHL3pDpg65g';

export const LiveStreamPage: React.FC = () => {
  const [forceLive, setForceLive] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoStreamData, setAutoStreamData] = useState<{
    isActive: boolean;
    embedUrl: string;
    title: string;
    description: string;
  } | null>(null);

  // Helper to extract YouTube video ID and ensure rel=0
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://www.youtube.com/embed/live_stream?channel=${OFFICIAL_CHURCH_CHANNEL_ID}&autoplay=1&rel=0`;
  };

  const fetchStreamSettings = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const siteSettings = await api.getSiteSettings().catch(() => ({}));
      setSettings(siteSettings);

      // ALWAYS check live broadcast from the official church channel with cache buster
      try {
        const checkRes = await fetch(`/api/check-live?channelId=${OFFICIAL_CHURCH_CHANNEL_ID}&_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (checkRes.ok) {
          const liveData = await checkRes.json();
          if (liveData.isLive && liveData.videoId) {
            setAutoStreamData({
              isActive: true,
              embedUrl: `https://www.youtube.com/embed/${liveData.videoId}?autoplay=1&rel=0`,
              title: liveData.title || 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك',
              description: 'نرحب بكم للمشاركة معنا في الصلوات والقداسات الإلهية المنقولة مباشرة من كنيسة العذراء بمحرم بك.'
            });
            return;
          }
        }
        setAutoStreamData(null);
      } catch (apiErr) {
        console.error('Check live fetch failed:', apiErr);
        setAutoStreamData(null);
      }
    } catch (err) {
      console.error('Failed to load stream settings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreamSettings();
    // Auto refresh every 30s to detect live stream start or finish
    const interval = setInterval(() => fetchStreamSettings(), 30000);
    return () => clearInterval(interval);
  }, []);

  let isStreamActive = false;
  let embedUrl = '';
  let title = '';
  let description = '';

  // Priority 1: Automated Live Detection from Church Channel
  if (autoStreamData && autoStreamData.isActive) {
    isStreamActive = true;
    embedUrl = autoStreamData.embedUrl;
    title = autoStreamData.title;
    description = autoStreamData.description;
  } else if (forceLive) {
    // User triggered direct channel live player
    isStreamActive = true;
    embedUrl = `https://www.youtube.com/embed/live_stream?channel=${OFFICIAL_CHURCH_CHANNEL_ID}&autoplay=1&rel=0`;
    title = 'البث المباشر المباشر - قناة كنيسة العذراء مريم بمحرم بك';
    description = 'مشغل البث المباشر المباشر للقناة الرسمية لكنيسة السيدة العذراء مريم بمحرم بك.';
  } else if (settings.live_stream_active === 'true' && settings.live_stream_youtube_url) {
    // Priority 2: Manual fallback stream
    isStreamActive = true;
    embedUrl = getYouTubeEmbedUrl(settings.live_stream_youtube_url);
    title = settings.live_stream_title || 'البث المباشر للخدمات والقداسات الروحية';
    description = settings.live_stream_description || 'نرحب بكم للمشاركة معنا في الصلوات والقداسات الإلهية والاجتماعات الروحية.';
  } else {
    isStreamActive = false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-12 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>البث المباشر - كنيسة السيدة العذراء مريم محرم بك | الإسكندرية</title>
        <meta name="description" content="البث المباشر للصلوات والقداسات الإلهية والعظات الروحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية." />
        <link rel="canonical" href="https://www.tibarthenos.com/live-stream" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-red-50 text-red-650 rounded-full border border-red-200/50 shadow-md animate-pulse">
            <Radio className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-tajawal text-3xl sm:text-4xl font-extrabold text-[#00174a]">
            البث المباشر الكنسي
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            تابع الصلوات الطقسية، القداسات الإلهية، والاجتماعات الروحية لحظة بلحظة حصرياً من قناة كنيسة العذراء بمحرم بك
          </p>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري التحقق من حالة البث المباشر للقناة الرسمية...</p>
          </div>
        ) : isStreamActive ? (
          /* Active Live Stream Screen */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
            
            {/* Live Indicator Topbar */}
            <div className="bg-rose-600 text-white px-6 py-3 flex items-center justify-between text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping shrink-0" />
                <span className="w-2.5 h-2.5 bg-white rounded-full absolute shrink-0" />
                <span className="font-tajawal pr-1 text-white select-none">بث مباشر الآن من الكنيسة</span>
              </div>
              <button
                onClick={() => fetchStreamSettings(true)}
                disabled={refreshing}
                className="hover:bg-white/10 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors text-xs border border-white/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث البث</span>
              </button>
            </div>

            {/* Video Player Frame Container */}
            <div className="relative aspect-video w-full bg-black shadow-inner">
              <iframe
                title="St. Mary Church Live Stream"
                src={embedUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video Metadata Panel */}
            <div className="p-6 sm:p-8 space-y-4 text-right">
              <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#002366] leading-snug">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
                {description}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 py-1.5 px-3 rounded-full">
                  <Calendar className="w-4 h-4 text-[#d4af37]" />
                  <span>بث مباشر من القناة الرسمية للكنيسة</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#002366]/5 text-[#002366] py-1.5 px-3.5 rounded-full border border-[#002366]/10">
                  <Heart className="w-4 h-4 text-[#d4af37] animate-pulse" />
                  <span>صلوا من أجل الخدمة</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Inactive Stream Screen */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6 max-w-2xl mx-auto transition-all">
            
            <div className="w-20 h-20 rounded-full bg-[#00174a]/5 text-[#002366] border border-[#d4af37]/30 flex items-center justify-center mx-auto shadow-inner">
              <Radio className="w-10 h-10 text-[#002366]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#00174a]">
                لا يوجد بث مباشر في الوقت الحالي
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-md mx-auto leading-relaxed">
                لا توجد صلوات مذاعة في هذه اللحظة على القناة الرسمية للكنيسة. يمكنك متابعة العظات السابقة أو زيارة القناة على يوتيوب.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => setForceLive(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-rose-600/30 w-full sm:w-auto justify-center animate-pulse"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل البث المباشر للقناة الآن</span>
              </button>

              <button
                onClick={() => fetchStreamSettings(true)}
                disabled={refreshing}
                className="bg-[#002366] text-[#fed65b] font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#00174a] transition-all flex items-center gap-2 shadow-md w-full sm:w-auto justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحقق من وجود بث الآن</span>
              </button>

              <a
                href={`https://www.youtube.com/channel/${OFFICIAL_CHURCH_CHANNEL_ID}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-6 rounded-xl transition-all flex items-center gap-2 w-full sm:w-auto justify-center border border-slate-200"
              >
                <Play className="w-4 h-4 fill-current text-red-600" />
                <span>فتح البث على يوتيوب</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        )}

        {/* Schedule reminder box */}
        <div className="bg-[#002366]/5 border border-[#002366]/10 rounded-2xl p-4 sm:p-5 text-right flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] bg-[#d4af37] text-white px-2 py-0.5 rounded font-bold">مواعيد البث المتوقعة</span>
            <p className="text-xs sm:text-sm font-bold text-[#002366]">قداسات الأحد والجمعة والاجتماعات العامة والنهضات الروحية</p>
          </div>
          <span className="text-xs text-[#d4af37] font-extrabold font-tajawal">كنيسة العذراء محرم بك</span>
        </div>

      </div>
    </div>
  );
};

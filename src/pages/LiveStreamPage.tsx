import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calendar, Radio, Users, RefreshCw, Play, Heart, Video } from 'lucide-react';

export const LiveStreamPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoStreamData, setAutoStreamData] = useState<{
    isActive: boolean;
    embedUrl: string;
    title: string;
    description: string;
    isPastVideo?: boolean;
  } | null>(null);

  // Helper to extract YouTube video ID
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const fetchStreamSettings = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const siteSettings = await api.getSiteSettings();
      setSettings(siteSettings);

      const mode = siteSettings.live_stream_mode || 'manual';
      const apiKey = siteSettings.youtube_api_key;
      const channelId = siteSettings.youtube_channel_id;

      if (mode === 'auto' && channelId) {
        try {
          const checkRes = await fetch(`/api/check-live?channelId=${channelId}`);
          if (checkRes.ok) {
            const liveData = await checkRes.json();
            if (liveData.isLive) {
              setAutoStreamData({
                isActive: true,
                embedUrl: `https://www.youtube.com/embed/${liveData.videoId || 'live_stream?channel=' + channelId}?autoplay=1`,
                title: liveData.title || 'البث المباشر للصلوات والقداسات الإلهية',
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
      } else {
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
    // Auto refresh every 45s in case stream status changes
    const interval = setInterval(() => fetchStreamSettings(), 45000);
    return () => clearInterval(interval);
  }, []);

  const mode = settings.live_stream_mode || 'manual';
  
  let isStreamActive = false;
  let embedUrl = '';
  let title = '';
  let description = '';
  let isPastVideo = false;

  if (mode === 'auto' && autoStreamData) {
    isStreamActive = autoStreamData.isActive;
    embedUrl = autoStreamData.embedUrl;
    title = autoStreamData.title;
    description = autoStreamData.description;
    isPastVideo = !!autoStreamData.isPastVideo;
  } else {
    isStreamActive = settings.live_stream_active === 'true';
    const rawUrl = settings.live_stream_youtube_url || '';
    embedUrl = getYouTubeEmbedUrl(rawUrl);
    title = settings.live_stream_title || 'البث المباشر للخدمات والقداسات الروحية';
    description = settings.live_stream_description || 'نرحب بكم للمشاركة معنا في الصلوات والقداسات الإلهية والاجتماعات الروحية المنقولة مباشرة من كنيسة العذراء بمحرم بك.';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-12 px-4 sm:px-6 lg:px-8 font-cairo">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-red-50 text-red-650 rounded-full border border-red-200/50 shadow-md animate-pulse">
            <Radio className="w-8 h-8 animate-pulse text-red-600" />
          </div>
          <h1 className="font-tajawal text-3xl sm:text-4xl font-extrabold text-[#00174a]">
            البث المباشر الكنسي
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            تابع الصلوات الطقسية، القداسات الإلهية، والاجتماعات الروحية لحظة بلحظة أينما كنت
          </p>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-[#002366] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري التحميل والتأكد من البث المباشر...</p>
          </div>
        ) : (isStreamActive || (mode === 'auto' && embedUrl)) ? (
          /* Active Stream or Fallback Video Screen */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
            
            {/* Live / Past Video Indicator Topbar */}
            <div className={`text-white px-6 py-3 flex items-center justify-between text-xs sm:text-sm font-bold ${isStreamActive ? 'bg-red-600' : 'bg-[#002366]'}`}>
              <div className="flex items-center gap-2">
                {isStreamActive ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping shrink-0" />
                    <span className="w-2.5 h-2.5 bg-white rounded-full absolute shrink-0" />
                    <span className="font-tajawal pr-1 text-white select-none">بث مباشر الآن</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 text-[#fed65b]" />
                    <span className="font-tajawal pr-1 text-white select-none">آخر فيديو مسجل بالقناة</span>
                  </>
                )}
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 py-1.5 px-3 rounded-full">
                    <Calendar className="w-4 h-4 text-[#d4af37]" />
                    <span>{isStreamActive ? 'بث روحي مبارك ومتجدد' : 'تسجيل روحي متوفر للمشاهدة'}</span>
                  </div>
                  <a
                    href={`https://www.youtube.com/channel/${settings.youtube_channel_id || 'UCLEhdhZFRuxMXHL3pDpg65g'}/live`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-full transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>المشاهدة على يوتيوب ↗</span>
                  </a>
                </div>
                <div className="flex items-center gap-1.5 bg-[#002366]/5 text-[#002366] py-1.5 px-3.5 rounded-full border border-[#002366]/10">
                  <Heart className="w-4 h-4 text-[#d4af37] animate-pulse" />
                  <span>صلوا من أجل الخدمة</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Inactive Stream Screen (friendly card) */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6 max-w-2xl mx-auto transition-all">
            
            <div className="w-24 h-24 rounded-full bg-slate-50 text-[#002366] border border-slate-200/80 flex items-center justify-center mx-auto shadow-inner">
              <Radio className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="font-tajawal text-lg sm:text-xl font-bold text-[#002366]">
                لا يوجد بث مباشر في الوقت الحالي
              </h3>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                نشكر محبتكم ومتابعتكم. يمكنك دائماً تصفح العظات السابقة في مكتبة العظات أو مراجعة مواعيد القداسات.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => fetchStreamSettings(true)}
                disabled={refreshing}
                className="bg-[#002366] text-[#fed65b] font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-[#00174a] transition-all flex items-center gap-2 shadow-md w-full sm:w-auto justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحقق من وجود بث الآن</span>
              </button>
              <a
                href="/sermons"
                className="bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200/80 font-bold text-xs py-2.5 px-6 rounded-xl transition-all w-full sm:w-auto block text-center"
              >
                زيارة مكتبة العظات
              </a>
            </div>

          </div>
        )}

        {/* Schedule reminder box */}
        <div className="bg-[#002366]/5 border border-[#002366]/10 rounded-2xl p-4 sm:p-5 text-right flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] bg-[#d4af37] text-white px-2 py-0.5 rounded font-bold">مواعيد البث المتوقعة</span>
            <p className="text-xs sm:text-sm font-bold text-[#002366]">قداسات الأحد والجمعة والاجتماعات العامة الروحية</p>
          </div>
          <span className="text-xs text-[#d4af37] font-extrabold font-tajawal">مواعيد ثابتة كنسية</span>
        </div>

      </div>
    </div>
  );
};

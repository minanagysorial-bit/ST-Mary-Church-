import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Filter,
  Play,
  Volume2,
  Calendar,
  Clock,
  User,
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Sermon, api } from '../lib/api';

interface SermonsPageProps {
  onSelectSermonForModal?: (sermon: Sermon) => void;
}

export const SermonsPage: React.FC<SermonsPageProps> = ({ onSelectSermonForModal }) => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('الكل');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const data = await api.getSermons();
      setSermons(data);
    } catch (err) {
      console.error('Failed to fetch sermons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromYouTube = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-sermons');
      if (res.ok) {
        await fetchSermons();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSermons();
    api.getSiteSettings().then(setSiteSettings).catch(console.error);
    // Background auto-sync on load
    handleSyncFromYouTube();
  }, []);

  // Extract unique topics / departments from available sermons
  const topics = ['الكل', ...Array.from(new Set(sermons.map(s => s.topic).filter(Boolean)))];

  const filteredSermons = sermons.filter(s => {
    const matchesSearch =
      (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.speaker || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'الكل' || s.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Always use the latest sermon for the featured top box
  const featuredSermon = sermons.length > 0 ? sermons[0] : null;

  const extractVideoId = (url: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderSermonImage = (youtubeUrl: string | null, sermonId: string) => {
    const videoId = extractVideoId(youtubeUrl);
    
    if (videoId) {
      return (
        <Link
          to={`/sermons/${sermonId}`}
          className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/50 block group cursor-pointer shadow-sm"
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="Sermon thumbnail"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-[#00174a]/30 group-hover:bg-[#00174a]/10 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current mr-0.5" />
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link
        to={`/sermons/${sermonId}`}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#002366] to-[#000814] flex flex-col items-center justify-center border border-slate-200/50 text-white/60 group hover:text-white transition-colors cursor-pointer shadow-sm"
      >
        <Volume2 className="w-10 h-10 text-[#fed65b] mb-1.5" />
        <span className="text-[10px] font-bold tracking-wider">عظة صوتية</span>
        <div className="absolute inset-0 bg-[#00174a]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-current mr-0.5" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>مكتبة العظات والكلمات الروحية | كنيسة السيدة العذراء بمحرم بك بالإسكندرية</title>
        <meta name="description" content="استمع وشاهد أحدث العظات والكلمات الروحية والقداسات لآباء كهنة كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. مكتبة متجددة تلقائياً من قناة اليوتيوب الرسمية." />
        <meta name="keywords" content="عظات كنيسة العذراء محرم بك, عظات مسيحية ارثوذكسية, عظات اباء كنيسة العذراء محرم بك, تأملات روحية محرم بك, تفسير الكتاب المقدس كنيسة العذراء" />
        <link rel="canonical" href="https://www.tibarthenos.com/sermons" />
      </Helmet>

      {/* Header & Search Bar */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="font-tajawal text-3xl font-extrabold text-[#00174a]">
              {siteSettings.sermons_title || 'مكتبة العظات والكلمات الروحية'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              {siteSettings.sermons_subtitle || 'سجل روحي متجدد ومربوط تلقائياً بأحدث عظات وقداسات قناة الكنيسة الرسمية'}
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بعنوان العظة أو القسم أو اسم الأب الكاهن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] shadow-sm font-bold"
              />
            </div>

            <button
              onClick={handleSyncFromYouTube}
              disabled={isSyncing}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-[#002366] transition-colors shadow-sm shrink-0 flex items-center gap-1.5 text-xs font-bold"
              title="تحديث العظات من يوتيوب"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 pl-2">
            <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>القسم / التصنيف:</span>
          </span>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedTopic === t
                  ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Sermon Top Hero Player Card (Always Most Recent Sermon) */}
      {featuredSermon && (
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>أحدث عظة منشورة</span>
              </span>
              <span className="bg-white/10 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-[#fed65b]" />
                <span>{featuredSermon.topic || 'تعليم وعظة'}</span>
              </span>
            </div>

            <Link to={`/sermons/${featuredSermon.id}`} className="block group">
              <h2 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b] leading-snug group-hover:underline">
                {featuredSermon.title}
              </h2>
            </Link>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2 font-medium">
              {featuredSermon.description || 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-semibold pt-1">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.speaker || 'آباء الكنيسة'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.sermon_date}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.duration_minutes || 45} دقيقة</span>
              </span>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <Link
                to={`/sermons/${featuredSermon.id}`}
                className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>مشاهدة واستماع العظة الآن</span>
              </Link>
            </div>
          </div>

          <div className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1.5 self-stretch flex items-center justify-center min-h-[160px] aspect-video lg:aspect-auto">
            {(() => {
              const videoId = extractVideoId(featuredSermon.youtube_url);
              return videoId ? (
                <Link to={`/sermons/${featuredSermon.id}`} className="w-full h-full relative group cursor-pointer block rounded-xl overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt="Featured Sermon"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#00174a]/20 flex items-center justify-center group-hover:bg-[#00174a]/10 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current mr-0.5" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Volume2 className="w-10 h-10 text-[#fed65b] animate-pulse mx-auto" />
                  <p className="font-tajawal text-xs font-bold text-white">تسجيل صوتي عالي الجودة</p>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Sermons Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-tajawal text-xl font-bold text-[#00174a]">
            جميع العظات المنشورة ({filteredSermons.length})
          </h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm">
            جاري تحميل مكتبة العظات...
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm">
            لا توجد عظات تطابق خيارات البحث والتصنيف المحددة.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map(sermon => (
              <div
                key={sermon.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Thumbnail with direct Play link */}
                  {renderSermonImage(sermon.youtube_url, sermon.id)}

                  <div className="flex items-center justify-between">
                    <span className="bg-[#002366]/10 text-[#002366] text-xs font-bold px-2.5 py-1 rounded-full border border-[#002366]/20">
                      {sermon.topic || 'تعليم وعظة'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{sermon.sermon_date}</span>
                    </span>
                  </div>

                  <Link to={`/sermons/${sermon.id}`} className="block">
                    <h3 className="font-tajawal text-base font-bold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug line-clamp-2">
                      {sermon.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                    {sermon.description || 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">الملقي / الخطيب</p>
                      <p className="text-xs font-bold text-[#00174a]">{sermon.speaker || 'آباء الكنيسة'}</p>
                    </div>
                  </div>

                  <Link
                    to={`/sermons/${sermon.id}`}
                    className="w-10 h-10 rounded-xl bg-[#002366] hover:bg-[#00113a] text-[#fed65b] flex items-center justify-center transition-all shadow-md active:scale-95 group-hover:bg-[#fed65b] group-hover:text-[#00174a]"
                    title="تشغيل العظة"
                  >
                    <Play className="w-4 h-4 fill-current mr-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

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
  FolderOpen,
  ListVideo,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { Sermon, api } from '../lib/api';

interface PlaylistSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  count?: number;
}

interface SermonsPageProps {
  onSelectSermonForModal?: (sermon: Sermon) => void;
}

export const SermonsPage: React.FC<SermonsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists'>('videos');
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('الكل');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Defined playlist sections matching church channel categories
  const playlistSections: PlaylistSection[] = [
    {
      id: 'liturgies',
      title: 'القداسات الإلهية والعشيات',
      description: 'تسجيلات القداسات الإلهية الأسبوعية، قداسات الأحد، والصلوات الطقسية والعشيات',
      icon: 'church'
    },
    {
      id: 'sermons',
      title: 'عظات وكلمات الآباء الكهنة',
      description: 'العظات والكلمات الروحية لآباء كهنة الكنيسة والآباء المطارنة والأساقفة',
      icon: 'settings_voice'
    },
    {
      id: 'feasts',
      title: 'نهضات الأعياد وصوم السيدة العذراء',
      description: 'صلوات وتسابيح وعظات نهضة صوم العذراء مريم وقداسات أعياد الكنيسة',
      icon: 'stars'
    },
    {
      id: 'youth',
      title: 'اجتماعات الشباب والشبان',
      description: 'عشيات وعظات وموضوعات اجتماعات الشباب والخريجين الأسبوعية',
      icon: 'groups'
    },
    {
      id: 'bible',
      title: 'دراسات الكتاب المقدس والعقيدة',
      description: 'شروحات وتفاسير أسفار العهدين القديم والجديد والمفاهيم اللاهوتية',
      icon: 'menu_book'
    }
  ];

  const fetchLiveYouTubeFeed = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-sermons');
      if (res.ok) {
        const syncData = await res.json();
        if (syncData.sermons && syncData.sermons.length > 0) {
          // Live YouTube videos are prioritized and sorted descending (newest first)
          const ytVideos: Sermon[] = syncData.sermons.map((s: any) => ({
            id: s.id,
            title: s.title,
            speaker: s.speaker,
            topic: s.topic,
            sermon_date: s.sermon_date,
            duration_minutes: s.duration_minutes || 45,
            youtube_url: s.youtube_url,
            audio_url: s.audio_url || null,
            description: s.description,
            featured: false,
            play_count: s.play_count || 0
          }));

          setSermons(ytVideos);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Live YouTube sync fetch warning:', err);
    } finally {
      setIsSyncing(false);
    }

    // Fallback to database if network / API is unreachable
    try {
      const dbSermons = await api.getSermons();
      setSermons(dbSermons);
    } catch (err) {
      console.error('Failed to fetch sermons from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveYouTubeFeed();
    api.getSiteSettings().then(setSiteSettings).catch(console.error);
  }, []);

  // Filter video list by playlist category if in playlist view
  const getPlaylistVideos = (sectionId: string | null) => {
    if (!sectionId) return sermons;
    return sermons.filter(s => {
      const title = (s.title || '').toLowerCase();
      const topic = (s.topic || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();

      switch (sectionId) {
        case 'liturgies':
          return title.includes('قداس') || title.includes('عشية') || topic.includes('قداس') || topic.includes('عشيات');
        case 'sermons':
          return title.includes('عظة') || title.includes('كلمة') || topic.includes('عظة') || topic.includes('تعليم');
        case 'feasts':
          return title.includes('نهضة') || title.includes('صوم') || title.includes('عيد') || title.includes('صعود') || topic.includes('نهضات');
        case 'youth':
          return title.includes('شبان') || title.includes('شباب') || topic.includes('شباب') || desc.includes('شبان');
        case 'bible':
          return title.includes('دراسة') || title.includes('تفسير') || title.includes('إنجيل') || topic.includes('كتاب مقدس');
        default:
          return true;
      }
    });
  };

  // Extract unique topics for the filter chips
  const topics = ['الكل', ...Array.from(new Set(sermons.map(s => s.topic).filter(Boolean)))];

  const filteredSermons = sermons.filter(s => {
    const matchesSearch =
      (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.speaker || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'الكل' || s.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Always the absolute newest video is the featured hero sermon
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
            loading="lazy"
            decoding="async"
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
        <title>مكتبة العظات وفيديوهات القناة | كنيسة السيدة العذراء بمحرم بك بالإسكندرية</title>
        <meta name="description" content="استمع وشاهد أحدث العظات والكلمات الروحية والقداسات لآباء كهنة كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. مكتبة متجددة تلقائياً من قناة اليوتيوب الرسمية." />
        <meta name="keywords" content="عظات كنيسة العذراء محرم بك, عظات مسيحية ارثوذكسية, قداسات كنيسة العذراء محرم بك" />
        <link rel="canonical" href="https://www.tibarthenos.com/sermons" />
      </Helmet>

      {/* Header & Main Search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="font-tajawal text-3xl font-extrabold text-[#00174a]">
              {siteSettings.sermons_title || 'مكتبة العظات وفيديوهات القناة'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              {siteSettings.sermons_subtitle || 'مربوطة مباشرة بالقناة الرسمية لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية وتتحدث تلقائياً'}
            </p>
          </div>

          {/* Search Box & Refresh Button */}
          <div className="flex items-center gap-3 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالعظة، الموضوع، أو اسم الأب الكاهن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] shadow-sm font-bold"
              />
            </div>

            <button
              onClick={fetchLiveYouTubeFeed}
              disabled={isSyncing}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-[#002366] transition-colors shadow-sm shrink-0 flex items-center gap-1.5 text-xs font-bold"
              title="تحديث وسحب أحدث الفيديوهات من يوتيوب"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* View Selector Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('videos'); setSelectedPlaylistId(null); }}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              activeTab === 'videos'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>جميع الفيديوهات والعظات ({sermons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              activeTab === 'playlists'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>أقسام وقوائم التشغيل (Playlists)</span>
          </button>
        </div>

        {/* Filter Category Chips (When on Videos tab) */}
        {activeTab === 'videos' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 pl-2">
              <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>التصنيف:</span>
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
        )}
      </div>

      {/* VIEW 1: PLAYLISTS / SECTIONS TAB */}
      {activeTab === 'playlists' && (
        <div className="space-y-8 animate-fade-in">
          {/* If no playlist is selected, show list of playlist cards */}
          {!selectedPlaylistId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlistSections.map(section => {
                const sectionVideos = getPlaylistVideos(section.id);
                return (
                  <div
                    key={section.id}
                    onClick={() => setSelectedPlaylistId(section.id)}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#002366] shadow-md hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">{section.icon}</span>
                        </div>
                        <span className="bg-[#002366]/10 text-[#002366] text-xs font-extrabold px-3 py-1 rounded-full border border-[#002366]/20">
                          {sectionVideos.length} فيديو
                        </span>
                      </div>

                      <h3 className="font-tajawal text-lg font-bold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug">
                        {section.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#002366]">
                      <span>عرض جميع فيديوهات القسم</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Inside Selected Playlist: List all available videos */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-slate-50 p-4 sm:p-6 rounded-3xl border border-slate-200">
                <div>
                  <button
                    onClick={() => setSelectedPlaylistId(null)}
                    className="text-xs font-bold text-slate-500 hover:text-[#002366] flex items-center gap-1 mb-1"
                  >
                    <span>← العودة لجميع القوائم</span>
                  </button>
                  <h3 className="font-tajawal text-xl font-bold text-[#00174a]">
                    {playlistSections.find(p => p.id === selectedPlaylistId)?.title}
                  </h3>
                </div>

                <span className="bg-[#002366] text-[#fed65b] text-xs font-bold px-4 py-2 rounded-2xl shadow-sm">
                  {getPlaylistVideos(selectedPlaylistId).length} فيديو متاح
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPlaylistVideos(selectedPlaylistId).map(sermon => (
                  <div
                    key={sermon.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
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
                        <h4 className="font-tajawal text-base font-bold text-[#00174a] group-hover:text-[#002366] transition-colors leading-snug line-clamp-2">
                          {sermon.title}
                        </h4>
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                        {sermon.description && !sermon.description.includes('مستوردة') ? sermon.description : 'عظة وكلمة روحية مباركة من كنيسة السيدة العذراء مريم بمحرم بك.'}
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
                        title="تشغيل الفيديو"
                      >
                        <Play className="w-4 h-4 fill-current mr-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL VIDEOS TAB */}
      {activeTab === 'videos' && (
        <div className="space-y-10 animate-fade-in">
          {/* Featured Sermon Top Hero Player Card (ALWAYS ABSOLUTE NEWEST VIDEO FROM CHANNEL) */}
          {featuredSermon && (
            <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>أحدث فيديو نزل على القناة</span>
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
                  {featuredSermon.description && !featuredSermon.description.includes('مستوردة') ? featuredSermon.description : 'عظة وكلمة روحية مباركة من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.'}
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
                    <span>مشاهدة واستماع الفيديو الآن</span>
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
                        loading="lazy"
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

          {/* Videos Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-tajawal text-xl font-bold text-[#00174a]">
                جميع الفيديوهات والعظات ({filteredSermons.length})
              </h2>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm">
                جاري تحميل الفيديوهات والعظات من القناة...
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
                        {sermon.description && !sermon.description.includes('مستوردة') ? sermon.description : 'عظة وكلمة روحية مباركة من كنيسة السيدة العذراء مريم بمحرم بك.'}
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
      )}

    </div>
  );
};

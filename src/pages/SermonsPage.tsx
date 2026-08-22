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
  Download,
  Share2,
  Bookmark
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

  useEffect(() => {
    api.getSermons().then(setSermons);
    api.getSiteSettings().then(setSiteSettings).catch(err => console.error(err));
  }, []);

  const topics = ['الكل', 'عقيدة', 'كتاب مقدس', 'روحيات', 'شباب ومجلس'];

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.includes(searchQuery) || s.speaker.includes(searchQuery);
    const matchesTopic = selectedTopic === 'الكل' || s.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const featuredSermon = sermons.find(s => s.featured) || sermons[0];

  const renderSermonImage = (youtubeUrl: string | null) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl?.match(regExp);
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/50">
          <img 
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
            alt="Sermon thumbnail" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-[#00174a]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-[#fed65b] flex items-center justify-center shadow">
              <Play className="w-5 h-5 text-[#00174a] fill-current mr-0.5" />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#002366] to-[#000814] flex flex-col items-center justify-center border border-slate-200/50 text-white/40 group-hover:text-white/60 transition-colors">
        <Volume2 className="w-10 h-10 text-[#fed65b] mb-1.5" />
        <span className="text-[10px] font-bold tracking-wider">عظة صوتية</span>
        <div className="absolute inset-0 bg-[#00174a]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#fed65b] flex items-center justify-center shadow">
            <Play className="w-5 h-5 text-[#00174a] fill-current mr-0.5" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Helmet>
        <title>مكتبة العظات والكلمات الروحية | كنيسة السيدة العذراء بمحرم بك بالإسكندرية</title>
        <meta name="description" content="استمع وحمل العظات والكلمات الروحية والطقسية لآباء كهنة كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. مكتبة متكاملة للتعليم الأرثوذكسي والكتاب المقدس." />
        <meta name="keywords" content="عظات كنيسة العذراء محرم بك, عظات مسيحية ارثوذكسية, عظات اباء كنيسة العذراء محرم بك, تأملات روحية محرم بك, تفسير الكتاب المقدس كنيسة العذراء" />
        <link rel="canonical" href="https://stmary-moharambek-digitalhub.org/sermons" />
      </Helmet>
      
      {/* Header & Search Bar */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="font-tajawal text-3xl font-extrabold text-[#00174a]">
              {siteSettings.sermons_title || 'مكتبة العظات والكلمات الروحية'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {siteSettings.sermons_subtitle || 'سجل روحي متجدد لعظات ودروس آباء الكنيسة الأجلاء بمحرم بك'}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بعنون العظة أو اسم الخطيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] shadow-sm"
            />
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 pl-2">
            <Filter className="w-3.5 h-3.5" />
            <span>التصنيف:</span>
          </span>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedTopic === t
                  ? 'bg-[#002366] text-[#fed65b] shadow'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Sermon Hero Player Card */}
      {featuredSermon && (
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#fed65b] text-[#00174a] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>العظة المميزة الأسبوعية</span>
              </span>
              <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-full border border-white/10">
                {featuredSermon.topic}
              </span>
            </div>

            <h2 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b] leading-snug">
              {featuredSermon.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2">
              {featuredSermon.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-semibold pt-2">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.speaker}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.sermon_date}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#fed65b]" />
                <span>{featuredSermon.duration_minutes} دقيقة</span>
              </span>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Link
                to={`/sermons/${featuredSermon.id}`}
                className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-bold text-xs px-6 py-3 rounded-xl transition-all shadow flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>استمع للعظة كاملة</span>
              </Link>
              {onSelectSermonForModal && (
                <button
                  onClick={() => onSelectSermonForModal(featuredSermon)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-[#fed65b]" />
                  <span>مشغل سريع</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1.5 self-stretch flex items-center justify-center min-h-[160px] aspect-video lg:aspect-auto">
            {featuredSermon.youtube_url ? (
              (() => {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = featuredSermon.youtube_url.match(regExp);
                const videoId = match && match[2].length === 11 ? match[2] : null;
                return videoId ? (
                  <img 
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                    alt="Featured Sermon"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Volume2 className="w-10 h-10 text-[#fed65b] animate-pulse mx-auto" />
                    <p className="font-tajawal text-xs font-bold text-white">تسجيل صوتي عالي الجودة</p>
                  </div>
                );
              })()
            ) : (
              <div className="text-center p-6 space-y-2">
                <Volume2 className="w-10 h-10 text-[#fed65b] animate-pulse mx-auto" />
                <p className="font-tajawal text-xs font-bold text-white">تسجيل صوتي عالي الجودة</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sermons Grid */}
      <div className="space-y-4">
        <h2 className="font-tajawal text-xl font-bold text-[#00174a]">
          جميع العظات المتاحة ({filteredSermons.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSermons.map(sermon => (
            <div
              key={sermon.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {renderSermonImage(sermon.youtube_url)}
                <div className="flex items-center justify-between">
                  <span className="bg-[#002366]/10 text-[#002366] text-xs font-bold px-2.5 py-1 rounded-full border border-[#002366]/20">
                    {sermon.topic}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sermon.duration_minutes} دقيقة</span>
                  </span>
                </div>

                <h3 className="font-tajawal text-lg font-bold text-[#00174a] group-hover:text-[#d4af37] transition-colors leading-snug line-clamp-2">
                  {sermon.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {sermon.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">الخطيب</p>
                    <p className="text-xs font-bold text-[#00174a]">{sermon.speaker}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/sermons/${sermon.id}`}
                    className="w-9 h-9 rounded-xl bg-[#002366] hover:bg-[#00113a] text-white flex items-center justify-center transition-colors shadow"
                    title="صفحة العظة"
                  >
                    <Play className="w-4 h-4 fill-current text-[#fed65b]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

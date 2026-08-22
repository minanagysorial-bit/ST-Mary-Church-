import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Calendar,
  Clock,
  User,
  FolderOpen
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Sermon, api } from '../lib/api';

export const SermonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.getSermonById(id)
        .then(setSermon)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const extractVideoId = (url: string | null): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-cairo" dir="rtl">
        <h2 className="font-tajawal text-2xl font-bold text-[#00174a]">جاري تحميل بيانات العظة...</h2>
        <Link to="/sermons" className="text-xs font-bold text-[#002366] hover:underline">
          العودة لمكتبة العظات
        </Link>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-cairo" dir="rtl">
        <h2 className="font-tajawal text-2xl font-bold text-[#00174a]">لم يتم العثور على هذه العظة</h2>
        <Link to="/sermons" className="text-xs font-bold text-[#002366] hover:underline">
          العودة لمكتبة العظات
        </Link>
      </div>
    );
  }

  const videoId = extractVideoId(sermon.youtube_url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-cairo text-right" dir="rtl">
      <Helmet>
        <title>{`${sermon.title} - ${sermon.speaker || 'عظات الكنيسة'}`} | كنيسة العذراء مريم بمحرم بك</title>
        <meta name="description" content={sermon.description || sermon.title} />
      </Helmet>
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link to="/" className="hover:text-[#002366]">الرئيسية</Link>
        <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        <Link to="/sermons" className="hover:text-[#002366]">مكتبة العظات</Link>
        <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        <span className="text-[#002366] truncate max-w-xs">{sermon.title}</span>
      </nav>

      {/* Main Media Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{sermon.topic || 'تعليم وعظة'}</span>
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#fed65b]" />
                <span>{sermon.sermon_date}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#fed65b]" />
                <span>{sermon.duration_minutes || 45} دقيقة</span>
              </span>
            </div>
          </div>

          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            {sermon.title}
          </h1>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-bold">الملقي والخطيب</p>
              <p className="font-tajawal font-bold text-sm text-[#fed65b]">{sermon.speaker || 'آباء الكنيسة'}</p>
            </div>
          </div>
        </div>

        {/* Player View */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {embedUrl ? (
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-[#d4af37]/30">
              <iframe
                src={embedUrl}
                title={sermon.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-[#00174a] text-white rounded-2xl p-8 space-y-4 border border-[#d4af37]/40 shadow-inner text-center">
              <Volume2 className="w-12 h-12 text-[#fed65b] mx-auto animate-pulse" />
              <p className="font-tajawal font-bold text-lg">مشغل الصوت الروحي الأرثوذكسي</p>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <button className="p-2 text-slate-300 hover:text-[#fed65b]" title="-10 ثواني">
                  <RotateCcw className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current mr-0.5" />}
                </button>
                <button className="p-2 text-slate-300 hover:text-[#fed65b]" title="+10 ثواني">
                  <RotateCw className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-4 pt-2">
            <h3 className="font-tajawal text-xl font-bold text-[#00174a] border-b border-slate-200 pb-2">
              عن الكلمة الروحية والنقاط الأساسية
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed font-semibold">
              {sermon.description || 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

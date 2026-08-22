import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Download,
  Share2,
  BookOpen,
  Calendar,
  Clock,
  User,
  Sparkles,
  FileText,
  Bookmark
} from 'lucide-react';
import { Sermon, api } from '../lib/api';
import { getYouTubeEmbedUrl } from '../utils/youtube';

export const SermonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (id) {
      api.getSermonById(id).then(setSermon);
    }
  }, [id]);

  if (!sermon) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-tajawal text-2xl font-bold text-[#00174a]">جاري تحميل بيانات العظة...</h2>
        <Link to="/sermons" className="text-xs font-bold text-[#002366] hover:underline">
          العودة لمكتبة العظات
        </Link>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(sermon.youtube_url, false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Link to="/" className="hover:text-[#002366]">الرئيسية</Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <Link to="/sermons" className="hover:text-[#002366]">مكتبة العظات</Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-[#002366] truncate max-w-xs">{sermon.title}</span>
      </nav>

      {/* Main Media Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="bg-[#fed65b] text-[#00174a] text-xs font-bold px-3 py-1 rounded-full">
              {sermon.topic}
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[#fed65b]" />
                <span>{sermon.sermon_date}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#fed65b]" />
                <span>{sermon.duration_minutes} دقيقة</span>
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
              <p className="text-[11px] text-slate-300">الملقي والخطيب</p>
              <p className="font-tajawal font-bold text-sm text-[#fed65b]">{sermon.speaker}</p>
            </div>
          </div>
        </div>

        {/* Player View */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {sermon.youtube_url ? (
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-[#d4af37]/30">
              <iframe
                src={embedUrl}
                title={sermon.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-[#00174a] text-white rounded-2xl p-6 space-y-4 border border-[#d4af37]/40 shadow-inner text-center">
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

          {/* Actions & Downloads */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button className="bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                <Download className="w-4 h-4 text-[#fed65b]" />
                <span>تحميل ملف MP3</span>
              </button>
              <button className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#002366]" />
                <span>ملخص العظة (PDF)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <button className="p-2.5 bg-white rounded-xl border border-slate-200 hover:text-[#002366] flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#d4af37]" />
                <span>مشاركة</span>
              </button>
              <button className="p-2.5 bg-white rounded-xl border border-slate-200 hover:text-[#002366] flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-[#d4af37]" />
                <span>حفظ المرجعية</span>
              </button>
            </div>
          </div>

          {/* Description & Verses */}
          <div className="space-y-4 pt-2">
            <h3 className="font-tajawal text-xl font-bold text-[#00174a] border-b border-slate-200 pb-2">
              عن الكلمة الروحية والنقاط الأساسية
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {sermon.description}
            </p>

            <div className="bg-[#fbf9f8] p-5 rounded-2xl border border-[#d4af37]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#002366] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>الآيات والمراجع الكتابية المقتبسة:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pr-2 font-semibold">
                <li>إنجيل القديس متى الأصحاح ١١ الآية ٢٨</li>
                <li>رسالة القديس بولس الرسول الأولى إلى أهل كورنثوس الأصحاح ١٣</li>
                <li>سفر المزامير (مزمور ٢٣ : ١) "الرَّبُّ رَاعِيَّ فَلاَ يَعْوِزُنِي شَيْءٌ"</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

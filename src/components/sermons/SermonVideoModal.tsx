import React, { useEffect, useRef } from 'react';
import { X, Calendar, Clock, User, ExternalLink, Volume2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sermon, api } from '../../lib/api';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

interface SermonVideoModalProps {
  sermon: Sermon | null;
  onClose: () => void;
}

export const SermonVideoModal: React.FC<SermonVideoModalProps> = ({ sermon, onClose }) => {
  const incrementedRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (sermon && sermon.id !== incrementedRef.current) {
      incrementedRef.current = sermon.id;
      api.incrementPlayCount(sermon.id).catch(() => {});
    }
  }, [sermon]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sermon) return null;

  const embedUrl = getYouTubeEmbedUrl(sermon.youtube_url, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#d4af37]/40 flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#d4af37]/30">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#d4af37]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مشغل العظات والكلمات الروحية</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="bg-black relative aspect-video w-full">
          {sermon.youtube_url ? (
            <iframe
              src={embedUrl}
              title={sermon.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#00174a] to-[#002366] text-white p-6 text-center space-y-3">
              <Volume2 className="w-16 h-16 text-[#fed65b] animate-pulse" />
              <p className="font-tajawal font-bold text-lg">مقطع صوتي روحاني</p>
              <p className="text-xs text-slate-300">{sermon.title}</p>
            </div>
          )}
        </div>

        {/* Sermon Details & Footer */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <span className="bg-[#002366] text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full border border-[#d4af37]/40">
              {sermon.topic}
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
              {sermon.sermon_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#735c00]" />
                  <span>{sermon.sermon_date}</span>
                </span>
              )}
              {sermon.duration_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#735c00]" />
                  <span>{sermon.duration_minutes} دقيقة</span>
                </span>
              )}
            </div>
          </div>

          <h2 className="font-tajawal text-xl sm:text-2xl font-bold text-[#00174a]">
            {sermon.title}
          </h2>

          <div className="flex items-center gap-3 bg-[#fbf9f8] p-3 rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">الملقي والخطيب</div>
              <div className="font-tajawal font-bold text-sm text-[#00174a]">{sermon.speaker}</div>
            </div>
          </div>

          {sermon.description && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 line-clamp-3">
              {sermon.description}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Link
              to={`/sermons/${sermon.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-md"
            >
              <span>عرض الصفحة الكاملة للعظة</span>
              <ExternalLink className="w-4 h-4 text-[#fed65b]" />
            </Link>
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

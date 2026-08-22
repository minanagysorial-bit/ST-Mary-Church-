import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, ChevronLeft, Calendar, Heart } from 'lucide-react';
import { getDailyReadings } from '../../lib/copticReadings';

export const DailyReadingsCard: React.FC = () => {
  const readings = getDailyReadings(new Date());

  return (
    <div className="bg-gradient-to-br from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#d4af37]/40 relative overflow-hidden font-cairo">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004080]/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left / Main Details */}
        <div className="space-y-3 max-w-2xl text-right">
          
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>قطمارس وسنكسار اليوم</span>
            </span>

            <span className="bg-white/10 text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
              📅 {readings.copticDate.copticDateString}
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#fed65b] leading-snug">
            {readings.synaxarium.title}
          </h2>

          {/* Gospel snippet */}
          <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#fed65b] mb-1">
              <span>إنجيل القداس الإلهي</span>
              <span className="font-mono">{readings.gospel.reference}</span>
            </div>
            <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
              {readings.gospel.text}
            </p>
          </div>

          <p className="text-[11px] text-slate-300 font-bold">
            🌿 {readings.copticDate.seasonName}
          </p>
        </div>

        {/* Right CTA Button */}
        <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-2 pt-2 md:pt-0">
          <Link
            to="/readings"
            className="w-full md:w-auto bg-[#fed65b] hover:bg-[#fed65b]/90 text-[#00174a] px-6 py-3 rounded-2xl font-tajawal font-extrabold text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <BookOpen className="w-4 h-4 text-[#00174a]" />
            <span>قراءة القطمارس والسنكسار كاملاً</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <span className="text-[10px] text-slate-400 font-bold">يُحدَّث تلقائياً كل صباح</span>
        </div>

      </div>
    </div>
  );
};

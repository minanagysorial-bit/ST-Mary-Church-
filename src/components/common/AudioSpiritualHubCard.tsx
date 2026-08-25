import React from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, BookOpen, Sparkles, ChevronLeft, WifiOff,
  Book, ArrowLeft, Headphones, Layers, ShieldCheck, Sun, Moon, Compass
} from 'lucide-react';

export const AudioSpiritualHubCard: React.FC = () => {
  return (
    <div className="relative font-cairo text-right" dir="rtl">
      
      {/* Outer Glow Container */}
      <div className="relative bg-gradient-to-br from-[#001438] via-[#001f5c] to-[#000f2e] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-[#d4af37]/40 overflow-hidden group">
        
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-[#d4af37]/15 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0055b3]/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-8">
          
          {/* Top Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#fed65b] text-[#00174a] text-xs font-black px-3.5 py-1 rounded-full shadow-md">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>الركن الصوتي الروحي الذكي</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 border border-white/15 text-slate-200 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  <WifiOff className="w-3.5 h-3.5 text-[#fed65b]" />
                  <span>يعمل أوفلاين بدون إنترنت</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>متابعة نصية حية (Highlighter)</span>
                </span>
              </div>

              <h2 className="font-tajawal text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight pt-1">
                الأجبية المقدسة والكتاب المقدس المسموع 🕊️📖
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                استمع واقرأ صلوات السواعي وأسفار الكتاب المقدس مع ميزة الهايلايتر التفاعلي الذي يتابع القراءة آية بآية في الوقت الفعلي.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] text-[#00174a] flex items-center justify-center shadow-lg font-black text-2xl border-2 border-white/20">
                ✝️
              </div>
            </div>
          </div>

          {/* 2 Main Bento Cards (Agpeya vs Bible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Bento Card 1: Agpeya */}
            <Link
              to="/agpeya"
              className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#fed65b] p-6 sm:p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 group/card hover:scale-[1.02] shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none group-hover/card:bg-[#d4af37]/20 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#002366] text-[#fed65b] border border-[#d4af37]/40 flex items-center justify-center font-bold text-xl shadow-inner group-hover/card:bg-[#fed65b] group-hover/card:text-[#00174a] transition-all">
                    🕊️
                  </div>
                  <span className="text-xs font-bold text-[#fed65b] bg-black/30 px-3 py-1 rounded-xl border border-white/10">
                    ٨ صلوات السواعي
                  </span>
                </div>

                <div>
                  <h3 className="font-tajawal text-xl sm:text-2xl font-black text-white group-hover/card:text-[#fed65b] transition-colors">
                    صلوات الأجبية المقدسة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                    صلوات (باكر، الثالثة، السادسة، التاسعة، الغروب، النوم، نصف الليل، والستار) مع المزامير والقطع والإنجيل والتحليل بصوت نقي.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">🌅 باكر</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">☀️ الثالثة والسادسة</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">🌆 الغروب والنوم</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">🌙 نصف الليل</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-[#fed65b]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  <span>دخول ركن الأجبية المسموعة</span>
                </span>
                <div className="w-8 h-8 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center group-hover/card:-translate-x-1 transition-transform shadow-md">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Bento Card 2: Bible */}
            <Link
              to="/bible"
              className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-[#fed65b] p-6 sm:p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 group/card hover:scale-[1.02] shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#0055b3]/15 rounded-full blur-2xl pointer-events-none group-hover/card:bg-[#0055b3]/25 transition-all" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#002366] text-[#fed65b] border border-[#d4af37]/40 flex items-center justify-center font-bold text-xl shadow-inner group-hover/card:bg-[#fed65b] group-hover/card:text-[#00174a] transition-all">
                    📖
                  </div>
                  <span className="text-xs font-bold text-[#fed65b] bg-black/30 px-3 py-1 rounded-xl border border-white/10">
                    العهد الجديد + المزامير
                  </span>
                </div>

                <div>
                  <h3 className="font-tajawal text-xl sm:text-2xl font-black text-white group-hover/card:text-[#fed65b] transition-colors">
                    الكتاب المقدس المسموع
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                    تصفح جميع الأسفار والأصحاحات كاملة مع ميزة الهايلايتر الذكي الذي يتحرك آلياً مع قراءة الآيات في الوقت الفعلي.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">✝️ الأناجيل الأربعة</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">📜 رسائل بولس</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">🎵 سفر المزامير</span>
                  <span className="text-[11px] bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg">👑 سفر الرؤيا</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-[#fed65b]">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>دخول قارئ ومشغل الكتاب المقدس</span>
                </span>
                <div className="w-8 h-8 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center group-hover/card:-translate-x-1 transition-transform shadow-md">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </Link>

          </div>

          {/* Bottom Quick Feature Highlights */}
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">
                تطبيق الويب PWA يدعم الاستماع والقراءة والمتابعة في أي مكان بدون اتصال بالشبكة 💾
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-[#fed65b]">
              <Link to="/agpeya" className="hover:underline flex items-center gap-1">
                <span>تصفح الأجبية</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
              <span className="text-white/20">|</span>
              <Link to="/bible" className="hover:underline flex items-center gap-1">
                <span>تصفح الإنجيل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronRight, ChevronLeft, WifiOff, Clock, Heart,
  Copy, Check, Moon, Sun, Type, Share2, Shield, Download
} from 'lucide-react';
import { AGPEYA_PRAYERS, AgpeyaPrayer } from '../lib/agpeyaData';
import { SEO } from '../components/common/SEO';

export const AgpeyaPage: React.FC = () => {
  const [selectedPrayer, setSelectedPrayer] = useState<AgpeyaPrayer>(AGPEYA_PRAYERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [selectedPrayer]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play error:', err);
        setIsPlaying(true);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyPrayer = () => {
    let content = `🕊️ ${selectedPrayer.name} (${selectedPrayer.hourTitle})\n`;
    content += `${selectedPrayer.theme}\n\n`;
    content += `📖 ${selectedPrayer.gospelTitle}:\n${selectedPrayer.gospelText}\n\n`;
    content += `✨ التحليل:\n${selectedPrayer.absolutionText}\n\n`;
    content += `كنيسة السيدة العذراء مريم بمحرم بك - الإسكندرية`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fontClasses = {
    normal: 'text-sm sm:text-base leading-loose',
    large: 'text-base sm:text-lg leading-loose',
    xlarge: 'text-lg sm:text-xl leading-loose font-medium'
  }[fontSize];

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-cairo text-right" dir="rtl">
      <SEO
        title="كتاب الأجبية المسموعة والمقروءة | كنيسة السيدة العذراء محرم بك"
        description="صلوات السواعي القبطية الأرثوذكسية كاملة بصوت نقي ومكتوبة: صلاة باكر، الثالثة، السادسة، التاسعة، الغروب، النوم، نصف الليل، والستار. تعمل بدون إنترنت."
        keywords={['الاجبية المسموعة', 'صلوات السواعي', 'صلاة باكر', 'صلاة النوم', 'الاجبية القبطية']}
        canonicalUrl="https://www.tibarthenos.com/agpeya"
      />

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={selectedPrayer.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
        preload="metadata"
      />

      {/* Hero Header */}
      <section className="relative py-12 bg-gradient-to-b from-[#00113a] via-[#00174a] to-[#002366] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent)] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-4">
          <Link 
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#fed65b] bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 transition-all mb-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع للرئيسية</span>
          </Link>

          <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/40 px-3.5 py-1 rounded-full text-[#fed65b] text-xs font-bold">
            <Volume2 className="w-3.5 h-3.5" />
            <span>كتاب السواعي والصلوات اليومية</span>
          </div>

          <h1 className="font-tajawal text-3xl sm:text-5xl font-black tracking-tight text-white">
            الأجبية المقدسة المسموعة 🕊️
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
            استمع واقرأ صلوات السواعي على مدار اليوم، بصوت نقي ونصوص كاملة تعمل أونلاين وأوفلاين بدون إنترنت.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Navigation Hours Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {AGPEYA_PRAYERS.map((prayer) => {
            const isSelected = selectedPrayer.id === prayer.id;
            return (
              <button
                key={prayer.id}
                onClick={() => setSelectedPrayer(prayer)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-lg font-black scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold shadow-sm'
                }`}
              >
                <span className="text-2xl">{prayer.symbol}</span>
                <span className="text-xs font-extrabold leading-tight">{prayer.name}</span>
                <span className="text-[10px] opacity-75 font-mono">{prayer.timePeriod.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Floating / Sticky Audio Player Bar */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00174a] text-white p-5 sm:p-6 rounded-3xl border-2 border-[#d4af37]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedPrayer.symbol}</span>
                <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#fed65b]">
                  {selectedPrayer.name} — {selectedPrayer.hourTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {selectedPrayer.theme}
              </p>
            </div>

            {/* Font Control & Copy */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2.5 py-1 rounded-lg ${fontSize === 'normal' ? 'bg-[#fed65b] text-[#00174a]' : 'text-slate-200'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2.5 py-1 rounded-lg ${fontSize === 'large' ? 'bg-[#fed65b] text-[#00174a]' : 'text-slate-200'}`}
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-2.5 py-1 rounded-lg ${fontSize === 'xlarge' ? 'bg-[#fed65b] text-[#00174a]' : 'text-slate-200'}`}
                >
                  A++
                </button>
              </div>

              <button
                onClick={handleCopyPrayer}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl transition-all border border-white/10 text-xs flex items-center gap-1"
                title="نسخ الصلاة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#fed65b]"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : selectedPrayer.durationEstimate}</span>
            </div>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRateChange}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[#fed65b] rounded-xl text-xs font-mono font-bold"
            >
              {playbackRate}x
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="تأخير ١٠ ثواني"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-[-1px]" />}
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="تقديم ١٠ ثواني"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            <span className="text-[11px] text-slate-300 flex items-center gap-1 font-bold">
              <WifiOff className="w-3.5 h-3.5 text-[#fed65b]" />
              <span className="hidden sm:inline">يعمل بدون إنترنت</span>
            </span>
          </div>
        </div>

        {/* Full Text Content Sections */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          
          {/* 1. Opening Prayer */}
          <div className="space-y-2 border-b border-slate-100 pb-6">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
              <span>⛪ مقدمة الصلاة</span>
            </h3>
            <p className={`${fontClasses} text-slate-700 bg-amber-50/60 p-4 rounded-2xl border border-amber-100`}>
              {selectedPrayer.openingPrayer}
            </p>
          </div>

          {/* 2. Psalms List */}
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
              <span>🎵 مزامير {selectedPrayer.name} ({selectedPrayer.psalmsSummary.length} مزمور)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              {selectedPrayer.psalmsSummary.map((psalm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#002366]/10 text-[#002366] flex items-center justify-center text-[10px] shrink-0 font-extrabold">
                    {idx + 1}
                  </span>
                  <span className="truncate">{psalm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Gospel Reading */}
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
                <span>📜 إنجيل الصلاة</span>
              </h3>
              <span className="text-xs font-bold bg-[#002366] text-[#fed65b] px-3 py-1 rounded-full">
                {selectedPrayer.gospelTitle}
              </span>
            </div>
            <blockquote className={`${fontClasses} font-bold text-slate-800 bg-slate-50 p-5 rounded-2xl border border-slate-200`}>
              {selectedPrayer.gospelText}
            </blockquote>
          </div>

          {/* 4. Litanies */}
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
              <span>✨ القطع والتضرعات</span>
            </h3>
            <div className="space-y-3">
              {selectedPrayer.litanies.map((litany, idx) => (
                <div key={idx} className={`${fontClasses} text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100`}>
                  {litany}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Absolution */}
          <div className="space-y-3">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
              <span>🕊️ التحليل وبركة الصلاة</span>
            </h3>
            <p className={`${fontClasses} text-slate-800 bg-gradient-to-r from-amber-50 to-blue-50 p-5 rounded-2xl border border-amber-200/80 font-bold`}>
              {selectedPrayer.absolutionText}
            </p>
          </div>

        </div>

      </main>
    </div>
  );
};

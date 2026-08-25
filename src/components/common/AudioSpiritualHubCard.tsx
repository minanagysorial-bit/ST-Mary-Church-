import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronLeft, WifiOff, Clock, Heart, Check,
  Download, Music, ArrowRight, Book, Layers, Radio
} from 'lucide-react';
import { AGPEYA_PRAYERS, AgpeyaPrayer } from '../../lib/agpeyaData';
import { AUDIO_BIBLE_BOOKS, BibleBook } from '../../lib/audioBibleData';

export const AudioSpiritualHubCard: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'agpeya' | 'bible'>('agpeya');
  
  // Agpeya Selection
  const [selectedAgpeya, setSelectedAgpeya] = useState<AgpeyaPrayer>(AGPEYA_PRAYERS[0]);
  
  // Bible Selection
  const [selectedBibleBook, setSelectedBibleBook] = useState<BibleBook>(AUDIO_BIBLE_BOOKS[0]);
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudioUrl = activeCategory === 'agpeya' 
    ? selectedAgpeya.audioUrl 
    : selectedBibleBook.audioBaseUrl;

  const activeTitle = activeCategory === 'agpeya'
    ? `${selectedAgpeya.name} (${selectedAgpeya.hourTitle})`
    : `${selectedBibleBook.name} (${selectedBibleBook.section})`;

  // Handle Audio Changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [activeAudioUrl]);

  // Audio Events
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
        // Fallback for autoplay policy or offline demo
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

  return (
    <div className="bg-gradient-to-br from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#d4af37]/50 relative overflow-hidden font-cairo text-right" dir="rtl">
      
      {/* Decorative Glows */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#004080]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Hidden Audio Tag */}
      <audio
        ref={audioRef}
        src={activeAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
        preload="metadata"
      />

      <div className="relative z-10 space-y-6">
        
        {/* Top Header & Mode Toggle Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#fed65b] text-[#00174a] text-xs font-black px-3 py-1 rounded-full shadow-sm">
                <Volume2 className="w-3.5 h-3.5" />
                <span>الركن الصوتي الروحي</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-white/10 border border-white/10 text-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                <WifiOff className="w-3 h-3 text-[#fed65b]" />
                <span>يعمل بدون إنترنت (Offline)</span>
              </span>
            </div>

            <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-white mt-1">
              الأجبية والإنجيل المسموع 🎧📖
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveCategory('agpeya')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeCategory === 'agpeya'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-lg scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>صلوات الأجبية (السواعي)</span>
            </button>
            <button
              onClick={() => setActiveCategory('bible')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeCategory === 'bible'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-lg scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>الكتاب المقدس المسموع</span>
            </button>
          </div>
        </div>

        {/* Horizontal Quick Selector Carousel */}
        {activeCategory === 'agpeya' ? (
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#fed65b]">اختر صلاة الساعة للاستماع أو القراءة:</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
              {AGPEYA_PRAYERS.map((prayer) => {
                const isSelected = selectedAgpeya.id === prayer.id;
                return (
                  <button
                    key={prayer.id}
                    onClick={() => setSelectedAgpeya(prayer)}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-white text-[#00174a] border-[#fed65b] shadow-lg font-black scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 font-bold'
                    }`}
                  >
                    <span className="text-lg">{prayer.symbol}</span>
                    <div>
                      <p className="text-xs font-extrabold leading-tight">{prayer.name}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-[#002366]' : 'text-slate-400'}`}>
                        {prayer.timePeriod}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#fed65b]">اختر السفر أو الإنجيل للاستماع:</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
              {AUDIO_BIBLE_BOOKS.map((book) => {
                const isSelected = selectedBibleBook.id === book.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBibleBook(book)}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-white text-[#00174a] border-[#fed65b] shadow-lg font-black scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 font-bold'
                    }`}
                  >
                    <Book className={`w-4 h-4 ${isSelected ? 'text-[#002366]' : 'text-[#fed65b]'}`} />
                    <div>
                      <p className="text-xs font-extrabold leading-tight">{book.name}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-[#002366]' : 'text-slate-400'}`}>
                        {book.chaptersCount} أصحاح
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Embedded Player Console Box */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 shadow-inner">
          
          {/* Currently Playing Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-[#fed65b] uppercase">المشغل الصوتي الروحي</span>
              </div>
              <h3 className="font-tajawal text-lg sm:text-xl font-black text-white">
                {activeTitle}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {activeCategory === 'agpeya' ? selectedAgpeya.theme : selectedBibleBook.description}
              </p>
            </div>

            {/* Quick Text Button */}
            <button
              onClick={() => setShowTextModal(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-1.5 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#fed65b]" />
              <span>قراءة النص كاملاً</span>
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="space-y-1.5">
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
              <span>{duration > 0 ? formatTime(duration) : (activeCategory === 'agpeya' ? selectedAgpeya.durationEstimate : 'صوت مسيحي')}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-1">
            
            {/* Speed Selector */}
            <button
              onClick={handleRateChange}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#fed65b] rounded-lg text-xs font-mono font-bold transition-all"
              title="سرعة الصوت"
            >
              {playbackRate}x
            </button>

            {/* Center Playback Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="تأخير ١٠ ثواني"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] flex items-center justify-center font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصلاة'}
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

            {/* Link to Full Hub */}
            <Link
              to={activeCategory === 'agpeya' ? '/agpeya' : '/bible'}
              className="text-[11px] font-bold text-[#fed65b] hover:text-white transition-colors flex items-center gap-1"
            >
              <span>تصفح الفهرس</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* Bottom Quick Snippet */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-right">
            <span className="text-[#fed65b] font-bold">📜 آية مباركة:</span>
            <span className="text-slate-200 font-medium">
              {activeCategory === 'agpeya' ? selectedAgpeya.gospelTitle : selectedBibleBook.sampleVerses.ref}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/agpeya"
              className="text-[#fed65b] hover:underline font-bold text-[11px]"
            >
              فتح كتاب الأجبية كاملاً 📖
            </Link>
            <span className="text-white/20">|</span>
            <Link
              to="/bible"
              className="text-[#fed65b] hover:underline font-bold text-[11px]"
            >
              الكتاب المقدس كاملاً ✝️
            </Link>
          </div>
        </div>

      </div>

      {/* Modal to Read Full Prayer / Chapter Text */}
      {showTextModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-cairo text-right" dir="rtl">
          <div className="bg-white text-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-[#00174a] text-white p-5 flex items-center justify-between border-b-2 border-[#d4af37]">
              <div>
                <span className="text-xs font-bold text-[#fed65b]">نص الصلاة المكتوب</span>
                <h3 className="font-tajawal text-lg font-black text-white">{activeTitle}</h3>
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm leading-loose font-medium">
              {activeCategory === 'agpeya' ? (
                <>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60">
                    <h4 className="font-bold text-[#002366] text-xs mb-1">مقدمة الصلاة:</h4>
                    <p className="text-xs text-slate-700">{selectedAgpeya.openingPrayer}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#002366] text-sm mb-2">📜 {selectedAgpeya.gospelTitle}</h4>
                    <blockquote className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-800 font-bold">
                      {selectedAgpeya.gospelText}
                    </blockquote>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#002366] text-sm mb-2">✨ القطع والطلبات:</h4>
                    <div className="space-y-2">
                      {selectedAgpeya.litanies.map((litany, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          {litany}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#002366] text-sm mb-1">🕊️ التحليل:</h4>
                    <p className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      {selectedAgpeya.absolutionText}
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-[#002366] text-sm mb-2">📖 {selectedBibleBook.sampleVerses.ref}</h4>
                    <p className="text-base text-slate-800 font-bold leading-relaxed">
                      {selectedBibleBook.sampleVerses.text}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    يمكنك الاستماع للأصحاحات كاملة أو تصفح باقي الأسفار من الرابط المباشر بالأسفل.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">كنيسة السيدة العذراء محرم بك</span>
              <button
                onClick={() => setShowTextModal(false)}
                className="px-5 py-2 bg-[#002366] text-white rounded-xl text-xs font-bold hover:bg-[#00174a] transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

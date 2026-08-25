import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronLeft, WifiOff, Clock, Heart, Check,
  Download, Music, ArrowRight, Book, Layers, Radio,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { AGPEYA_PRAYERS, AgpeyaPrayer } from '../../lib/agpeyaData';
import { AUDIO_BIBLE_BOOKS, BibleBook } from '../../lib/audioBibleData';
import { getChapterData, BibleChapterData, getAgpeyaTimedSections, AgpeyaSection } from '../../lib/bibleChaptersEngine';

export const AudioSpiritualHubCard: React.FC = () => {
  // Main Category: 'agpeya' | 'bible'
  const [activeCategory, setActiveCategory] = useState<'agpeya' | 'bible'>('agpeya');
  
  // Bible Sub-view: 'testaments' | 'books' | 'chapters' | 'reader'
  const [bibleTestament, setBibleTestament] = useState<'new' | 'old'>('new');
  const [selectedBibleBook, setSelectedBibleBook] = useState<BibleBook>(AUDIO_BIBLE_BOOKS[0]);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [chapterData, setChapterData] = useState<BibleChapterData>(() =>
    getChapterData('matthew', 5, 'إنجيل متى', 'الأناجيل', 'new')
  );

  // Agpeya Selection
  const [selectedAgpeya, setSelectedAgpeya] = useState<AgpeyaPrayer>(AGPEYA_PRAYERS[0]);
  const [agpeyaSections, setAgpeyaSections] = useState<AgpeyaSection[]>(() =>
    getAgpeyaTimedSections(
      AGPEYA_PRAYERS[0].id,
      AGPEYA_PRAYERS[0].openingPrayer,
      AGPEYA_PRAYERS[0].gospelText,
      AGPEYA_PRAYERS[0].litanies,
      AGPEYA_PRAYERS[0].absolutionText
    )
  );

  // View Mode for Bible: 'selector' | 'reader'
  const [bibleStep, setBibleStep] = useState<'books' | 'chapters' | 'reader'>('books');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeVerseRef = useRef<HTMLDivElement | null>(null);

  // Audio URL determination
  const activeAudioUrl = activeCategory === 'agpeya'
    ? selectedAgpeya.audioUrl
    : chapterData.audioUrl;

  // Handle Chapter selection
  const handleSelectChapter = (num: number) => {
    setSelectedChapterNum(num);
    const data = getChapterData(
      selectedBibleBook.id,
      num,
      selectedBibleBook.name,
      selectedBibleBook.section,
      selectedBibleBook.testament
    );
    setChapterData(data);
    setBibleStep('reader');
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Handle Agpeya selection
  const handleSelectAgpeya = (prayer: AgpeyaPrayer) => {
    setSelectedAgpeya(prayer);
    setAgpeyaSections(
      getAgpeyaTimedSections(
        prayer.id,
        prayer.openingPrayer,
        prayer.gospelText,
        prayer.litanies,
        prayer.absolutionText
      )
    );
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Audio time update & auto-scroll
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      setDuration(audioRef.current.duration || 0);

      // Auto-scroll active verse gently into view
      if (activeVerseRef.current) {
        activeVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
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

  // Filter Bible books by selected testament
  const filteredBibleBooks = AUDIO_BIBLE_BOOKS.filter(b => b.testament === bibleTestament);

  return (
    <div className="bg-gradient-to-br from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#d4af37]/50 relative overflow-hidden font-cairo text-right" dir="rtl">
      
      {/* Decorative Glows */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#004080]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Hidden Audio Element */}
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
                <span>أوفلاين بدون إنترنت</span>
              </span>
            </div>

            <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-white mt-1">
              {activeCategory === 'agpeya' ? 'الأجبية المقدسة المسموعة 🕊️' : 'الكتاب المقدس المسموع 📖🎧'}
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => { setActiveCategory('agpeya'); setIsPlaying(false); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeCategory === 'agpeya'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-lg scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🕊️ صلوات الأجبية</span>
            </button>
            <button
              onClick={() => { setActiveCategory('bible'); setIsPlaying(false); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeCategory === 'bible'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-lg scale-105'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>📖 الكتاب المقدس</span>
            </button>
          </div>
        </div>

        {/* ── 1. AGPEYA MODE ── */}
        {activeCategory === 'agpeya' && (
          <div className="space-y-5">
            {/* Hours Selector Carousel */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#fed65b]">اختر صلاة الساعة للاستماع والمتابعة:</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20">
                {AGPEYA_PRAYERS.map((prayer) => {
                  const isSelected = selectedAgpeya.id === prayer.id;
                  return (
                    <button
                      key={prayer.id}
                      onClick={() => handleSelectAgpeya(prayer)}
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
                          {prayer.timePeriod.split(' ')[0]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio Controller Bar */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#fed65b]">الصوت والهايلايتر التفاعلي ⚡</span>
                  <h3 className="font-tajawal text-base sm:text-lg font-extrabold text-white">
                    {selectedAgpeya.name} — {selectedAgpeya.hourTitle}
                  </h3>
                </div>
                <button
                  onClick={handleTogglePlay}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] flex items-center gap-2 font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-xs"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصلاة'}</span>
                </button>
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
                  <span>{duration > 0 ? formatTime(duration) : selectedAgpeya.durationEstimate}</span>
                </div>
              </div>
            </div>

            {/* Agpeya Interactive Karaoke Text Reader */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/15 max-h-[350px] overflow-y-auto space-y-4 text-slate-100 leading-loose scrollbar-thin scrollbar-thumb-white/20">
              {agpeyaSections.map((sec) => {
                const isActive = currentTime >= sec.startSec && currentTime < sec.endSec;
                return (
                  <div
                    key={sec.id}
                    ref={isActive ? activeVerseRef : null}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = sec.startSec;
                        setCurrentTime(sec.startSec);
                      }
                    }}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#fed65b] text-[#00174a] font-extrabold shadow-xl border-[#d4af37] scale-[1.01] ring-2 ring-[#fed65b]/50'
                        : 'bg-black/20 hover:bg-black/30 border-white/5 text-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-bold ${isActive ? 'text-[#002366]' : 'text-[#fed65b]'}`}>{sec.title}</span>
                      <span className="font-mono text-[10px] opacity-75">{formatTime(sec.startSec)}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">{sec.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2. BIBLE MODE (TESTAMENTS -> BOOKS -> CHAPTERS -> VERSE HIGHLIGHTER) ── */}
        {activeCategory === 'bible' && (
          <div className="space-y-5">
            
            {/* Step 1: Testament & Book Selection */}
            {bibleStep === 'books' && (
              <div className="space-y-4">
                {/* Testament Switcher */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 bg-black/30 p-1 rounded-2xl border border-white/10">
                    <button
                      onClick={() => setBibleTestament('new')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        bibleTestament === 'new' ? 'bg-[#fed65b] text-[#00174a] shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      العهد الجديد (٢٧ سفراً)
                    </button>
                    <button
                      onClick={() => setBibleTestament('old')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        bibleTestament === 'old' ? 'bg-[#fed65b] text-[#00174a] shadow-sm' : 'text-slate-300'
                      }`}
                    >
                      العهد القديم (المزامير والأسفار)
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">اختر السفر:</span>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
                  {filteredBibleBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBibleBook(book);
                        setBibleStep('chapters');
                      }}
                      className="p-3.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fed65b] rounded-2xl text-right transition-all group flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <Book className="w-4 h-4 text-[#fed65b] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-slate-400 font-bold">{book.section}</span>
                      </div>
                      <div>
                        <h4 className="font-tajawal text-xs sm:text-sm font-extrabold text-white group-hover:text-[#fed65b] transition-colors">
                          {book.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">{book.chaptersCount} أصحاحاً</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Chapter Selection */}
            {bibleStep === 'chapters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBibleStep('books')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#fed65b] hover:underline"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الرجوع لقائمة الأسفار</span>
                  </button>
                  <h3 className="font-tajawal text-sm font-extrabold text-white">
                    {selectedBibleBook.name} — اختر الأصحاح ({selectedBibleBook.chaptersCount} أصحاح)
                  </h3>
                </div>

                {/* Chapters Numbered Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
                  {Array.from({ length: selectedBibleBook.chaptersCount }, (_, i) => i + 1).map((chNum) => (
                    <button
                      key={chNum}
                      onClick={() => handleSelectChapter(chNum)}
                      className="p-3 bg-white/5 hover:bg-[#fed65b] hover:text-[#00174a] border border-white/10 rounded-2xl text-center font-tajawal font-black text-sm transition-all hover:scale-105 shadow-sm active:scale-95"
                    >
                      {chNum}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Interactive Chapter Reader with Verse Highlighter */}
            {bibleStep === 'reader' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setBibleStep('chapters')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#fed65b] hover:underline"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>تغيير الأصحاح ({selectedBibleBook.name})</span>
                  </button>

                  <h3 className="font-tajawal text-sm sm:text-base font-extrabold text-white">
                    {chapterData.bookName} — الأصحاح {chapterData.chapterNumber}
                  </h3>
                </div>

                {/* Player Console Bar */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#fed65b]">استماع مباشر مع الهايلايتر ⚡</span>
                      <p className="text-xs text-slate-300 font-medium">{chapterData.bookName} أصحاح {chapterData.chapterNumber}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRateChange}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#fed65b] rounded-lg text-xs font-mono font-bold"
                      >
                        {playbackRate}x
                      </button>

                      <button
                        onClick={handleTogglePlay}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] flex items-center gap-1.5 font-black shadow-lg hover:scale-105 transition-all text-xs"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>{isPlaying ? 'إيقاف' : 'تشغيل الأصحاح'}</span>
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
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>{duration > 0 ? formatTime(duration) : chapterData.totalDurationEstimate}</span>
                    </div>
                  </div>
                </div>

                {/* Chapter Verses with Real-time Karaoke Highlighter */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/15 max-h-[300px] overflow-y-auto space-y-3 leading-loose scrollbar-thin scrollbar-thumb-white/20">
                  {chapterData.verses.map((v) => {
                    const isVerseActive = currentTime >= v.startSec && currentTime < v.endSec;
                    return (
                      <div
                        key={v.verseNumber}
                        ref={isVerseActive ? activeVerseRef : null}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = v.startSec;
                            setCurrentTime(v.startSec);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                          isVerseActive
                            ? 'bg-[#fed65b] text-[#00174a] font-extrabold shadow-lg border-[#d4af37] scale-[1.01] ring-2 ring-[#fed65b]/50'
                            : 'bg-black/20 hover:bg-black/30 border-white/5 text-slate-100 font-medium'
                        }`}
                      >
                        <span className={`inline-block ml-2 px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                          isVerseActive ? 'bg-[#002366] text-[#fed65b]' : 'bg-white/10 text-[#fed65b]'
                        }`}>
                          {v.verseNumber}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed">{v.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer Link */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold">كنيسة السيدة العذراء مريم بمحرم بك</span>
          <div className="flex items-center gap-3">
            <Link to="/agpeya" className="text-[#fed65b] hover:underline font-bold text-[11px]">
              فتح الأجبية كاملة 🕊️
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/bible" className="text-[#fed65b] hover:underline font-bold text-[11px]">
              فتح الكتاب المقدس كاملاً 📖
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronRight, ChevronLeft, WifiOff, Clock, Heart,
  Search, Book, Layers, ArrowRight, Download, Filter
} from 'lucide-react';
import { AUDIO_BIBLE_BOOKS, BibleBook } from '../lib/audioBibleData';
import { SEO } from '../components/common/SEO';

export const AudioBiblePage: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<BibleBook>(AUDIO_BIBLE_BOOKS[0]);
  const [selectedSection, setSelectedSection] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [selectedBook]);

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
        console.warn('Audio error:', err);
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

  const sections = ['الكل', 'الأناجيل', 'أعمال الرسل', 'رسائل بولس', 'الرسائل الجامعة', 'الرؤيا', 'المزامير'];

  const filteredBooks = AUDIO_BIBLE_BOOKS.filter(book => {
    const matchSection = selectedSection === 'الكل' || book.section === selectedSection;
    const matchSearch = book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        book.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSection && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-cairo text-right" dir="rtl">
      <SEO
        title="الكتاب المقدس المسموع | كنيسة السيدة العذراء محرم بك"
        description="استمع إلى أسفار العهد الجديد وسفر المزامير بصوت نقي باللغة العربية (ترجمة فان دايك). استماع فوري يعمل أونلاين وأوفلاين."
        keywords={['الانجيل المسموع', 'الكتاب المقدس صوتي', 'العهد الجديد مسموع', 'المزامير مسموعة']}
        canonicalUrl="https://www.tibarthenos.com/bible"
      />

      <audio
        ref={audioRef}
        src={selectedBook.audioBaseUrl}
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
            <BookOpen className="w-3.5 h-3.5" />
            <span>كلمة الله الحية والمحيية</span>
          </div>

          <h1 className="font-tajawal text-3xl sm:text-5xl font-black tracking-tight text-white">
            الكتاب المقدس المسموع 📖🎧
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
            استمع لكلمة الإنجيل وسفر المزامير ورسائل الرسل القديسين بصوت نقي وترجمة معتمدة في كل وقت.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Floating Player Console */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00174a] text-white p-5 sm:p-6 rounded-3xl border-2 border-[#d4af37]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-[#fed65b]">{selectedBook.section}</span>
              </div>
              <h2 className="font-tajawal text-xl sm:text-2xl font-black text-white">
                {selectedBook.name} ({selectedBook.chaptersCount} أصحاح)
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {selectedBook.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-[#fed65b] flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>متاح أوفلاين</span>
              </span>
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
              <span>{duration > 0 ? formatTime(duration) : 'تسجيل نقي'}</span>
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

            <Link
              to="/agpeya"
              className="text-xs font-bold text-slate-300 hover:text-[#fed65b] transition-colors"
            >
              صلوات الأجبية 🕊️
            </Link>
          </div>
        </div>

        {/* Search & Section Filter */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-thin">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  selectedSection === sec
                    ? 'bg-[#002366] text-[#fed65b] shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في أسفار الكتاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#002366] transition-all text-right"
            />
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isSelected = selectedBook.id === book.id;
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-50 to-white border-[#d4af37] shadow-md ring-2 ring-[#d4af37]/30 scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-[#002366]'
                    }`}>
                      <Book className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-tajawal font-black text-base text-[#00174a]">{book.name}</h3>
                      <p className="text-[11px] text-slate-400 font-bold">{book.section}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                    {book.chaptersCount} أصحاح
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {book.description}
                </p>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[#002366] font-bold flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSelected && isPlaying ? 'جاري التشغيل...' : 'استماع للسفر'}</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">فان دايك</span>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};

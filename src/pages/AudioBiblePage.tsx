import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronRight, ChevronLeft, WifiOff, Clock, Heart,
  Search, Book, Layers, ArrowRight, Download, Filter, Type, Copy, Check, Square
} from 'lucide-react';
import { AUDIO_BIBLE_BOOKS, BibleBook } from '../lib/audioBibleData';
import { getChapterData, BibleChapterData } from '../lib/bibleChaptersEngine';
import { SpiritualAudioPlayer } from '../lib/spiritualAudioEngine';
import { SEO } from '../components/common/SEO';

export const AudioBiblePage: React.FC = () => {
  const [testament, setTestament] = useState<'new' | 'old'>('new');
  const [selectedBook, setSelectedBook] = useState<BibleBook>(AUDIO_BIBLE_BOOKS[0]);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [chapterData, setChapterData] = useState<BibleChapterData>(() =>
    getChapterData('matthew', 1, 'إنجيل متى', 'الأناجيل', 'new')
  );

  const [step, setStep] = useState<'books' | 'chapters' | 'reader'>('books');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

  const playerRef = useRef<SpiritualAudioPlayer | null>(null);
  const activeVerseElementRef = useRef<HTMLDivElement | null>(null);

  // Initialize Player
  useEffect(() => {
    playerRef.current = new SpiritualAudioPlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Update Player verses when chapter data changes
  useEffect(() => {
    if (playerRef.current && chapterData.verses.length > 0) {
      const verseTexts = chapterData.verses.map(v => `الآية ${v.verseNumber}: ${v.text}`);
      playerRef.current.setVerses(
        verseTexts,
        (idx) => {
          setActiveVerseIndex(idx);
          if (activeVerseElementRef.current) {
            activeVerseElementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        (playing) => {
          setIsPlaying(playing);
        }
      );
    }
  }, [chapterData]);

  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapterNum(1);
    setStep('chapters');
    playerRef.current?.stop();
    setIsPlaying(false);
  };

  const handleSelectChapter = (chNum: number) => {
    setSelectedChapterNum(chNum);
    const data = getChapterData(selectedBook.id, chNum, selectedBook.name, selectedBook.section, selectedBook.testament);
    setChapterData(data);
    setStep('reader');
    setActiveVerseIndex(0);
    playerRef.current?.stop();
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.resume();
    }
  };

  const handleStop = () => {
    playerRef.current?.stop();
    setActiveVerseIndex(0);
  };

  const handleVerseClick = (index: number) => {
    setActiveVerseIndex(index);
    playerRef.current?.jumpToVerse(index);
  };

  const handleRateChange = () => {
    const rates = [0.8, 1.0, 1.2, 1.4];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    playerRef.current?.setRate(nextRate);
  };

  const handleCopyChapter = () => {
    const text = `📖 ${chapterData.bookName} - الأصحاح ${chapterData.chapterNumber}\n\n` +
      chapterData.verses.map(v => `(${v.verseNumber}) ${v.text}`).join('\n') +
      `\n\nكنيسة السيدة العذراء مريم بمحرم بك`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredBooks = AUDIO_BIBLE_BOOKS.filter(book => {
    const matchTestament = book.testament === testament;
    const matchSearch = book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        book.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTestament && matchSearch;
  });

  const fontClasses = {
    normal: 'text-sm sm:text-base leading-loose',
    large: 'text-base sm:text-lg leading-loose',
    xlarge: 'text-lg sm:text-xl leading-loose font-medium'
  }[fontSize];

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-cairo text-right" dir="rtl">
      <SEO
        title="الكتاب المقدس المسموع والمقروء | كنيسة السيدة العذراء محرم بك"
        description="استمع واقرأ أسفار العهد الجديد والعهد القديم وسفر المزامير مع ميزة المتابعة الصوتية الذكية (Highlighter) للآيات في الوقت الفعلي."
        keywords={['الانجيل المسموع', 'الكتاب المقدس صوتي', 'العهد الجديد مسموع', 'المزامير مسموعة']}
        canonicalUrl="https://www.tibarthenos.com/bible"
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
            الكتاب المقدس المسموع والمقروء 📖🎧
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
            استمع للأصحاحات بصوت نقي مع متابعة الآية المقروءة في الوقت الفعلي عبر الهايلايتر التفاعلي.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Step 1: Books Grid */}
        {step === 'books' && (
          <div className="space-y-6">
            
            {/* Testament Selector Tabs */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setTestament('new')}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    testament === 'new' ? 'bg-[#002366] text-[#fed65b] shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العهد الجديد (٢٧ سفراً)
                </button>
                <button
                  onClick={() => setTestament('old')}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    testament === 'old' ? 'bg-[#002366] text-[#fed65b] shadow-sm scale-105' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العهد القديم (المزامير والأسفار)
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث في الأسفار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#002366] transition-all text-right"
                />
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className="p-5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#d4af37] rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#002366]/10 text-[#002366] group-hover:bg-[#002366] group-hover:text-[#fed65b] flex items-center justify-center font-bold transition-all">
                        <Book className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-tajawal font-black text-base text-[#00174a] group-hover:text-[#002366]">
                          {book.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-bold">{book.section}</p>
                      </div>
                    </div>

                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                      {book.chaptersCount} أصحاح
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#002366]">
                    <span>عرض الأصحاحات ({book.chaptersCount})</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Chapters Selection */}
        {step === 'chapters' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                onClick={() => setStep('books')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#002366] hover:underline"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرجوع للأسفار</span>
              </button>

              <div className="text-left sm:text-right">
                <h2 className="font-tajawal text-xl font-black text-[#00174a]">{selectedBook.name}</h2>
                <p className="text-xs text-slate-400 font-bold">{selectedBook.chaptersCount} أصحاح — اختر الأصحاح للاستماع</p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((chNum) => (
                <button
                  key={chNum}
                  onClick={() => handleSelectChapter(chNum)}
                  className="p-4 bg-slate-50 hover:bg-[#002366] hover:text-[#fed65b] text-slate-800 rounded-2xl border border-slate-200 font-tajawal font-black text-base transition-all hover:scale-105 shadow-sm active:scale-95 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xs opacity-75 font-normal">أصحاح</span>
                  <span>{chNum}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Interactive Chapter Reader with Verse Highlighter */}
        {step === 'reader' && (
          <div className="space-y-6">
            
            {/* Navigation & Chapter Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setStep('chapters')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#002366] hover:underline"
              >
                <ChevronRight className="w-4 h-4" />
                <span>تغيير الأصحاح ({selectedBook.name})</span>
              </button>

              <h2 className="font-tajawal text-base sm:text-lg font-black text-[#00174a]">
                {chapterData.bookName} — الأصحاح {chapterData.chapterNumber}
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-1 rounded-lg ${fontSize === 'normal' ? 'bg-[#002366] text-white' : 'text-slate-600'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-1 rounded-lg ${fontSize === 'large' ? 'bg-[#002366] text-white' : 'text-slate-600'}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('xlarge')}
                    className={`px-2 py-1 rounded-lg ${fontSize === 'xlarge' ? 'bg-[#002366] text-white' : 'text-slate-600'}`}
                  >
                    A++
                  </button>
                </div>

                <button
                  onClick={handleCopyChapter}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-200 text-xs flex items-center gap-1"
                  title="نسخ الأصحاح"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Audio Controller Bar */}
            <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00174a] text-white p-5 sm:p-6 rounded-3xl border-2 border-[#d4af37]/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#fed65b]">المتابعة الصوتية الذكية (Verse Highlighter)</span>
                  </div>
                  <h3 className="font-tajawal text-lg sm:text-xl font-black text-white">
                    {chapterData.bookName} — الأصحاح {chapterData.chapterNumber} (الآية {activeVerseIndex + 1} من {chapterData.verses.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRateChange}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#fed65b] rounded-xl text-xs font-mono font-bold"
                  >
                    {playbackRate}x
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={handleStop}
                  className="p-2 text-slate-300 hover:text-rose-300 transition-colors"
                  title="إيقاف كامل"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="px-6 py-3 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center gap-2 font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-sm"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل الأصحاح بصوت واضح'}</span>
                </button>
              </div>
            </div>

            {/* Verses Karaoke List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3 max-h-[550px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              <div className="text-xs text-slate-400 font-bold mb-2">💡 اضغط على أي آية للاستماع إليها مباشرة</div>
              {chapterData.verses.map((v, idx) => {
                const isVerseActive = isPlaying && activeVerseIndex === idx;
                return (
                  <div
                    key={v.verseNumber}
                    ref={isVerseActive ? activeVerseElementRef : null}
                    onClick={() => handleVerseClick(idx)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                      isVerseActive
                        ? 'bg-amber-50 text-[#00174a] font-extrabold border-[#d4af37] shadow-md scale-[1.01] ring-2 ring-[#d4af37]/40'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-100 text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 ${
                        isVerseActive ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {v.verseNumber}
                      </span>
                      <p className={`${fontClasses} flex-1 leading-relaxed`}>
                        {v.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

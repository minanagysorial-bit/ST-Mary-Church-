import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2, Play, Pause, RotateCcw, RotateCw, BookOpen,
  Sparkles, ChevronRight, ChevronLeft, WifiOff, Clock, Heart,
  Copy, Check, Moon, Sun, Type, Share2, Shield, Download, Square
} from 'lucide-react';
import { AGPEYA_PRAYERS, AgpeyaPrayer } from '../lib/agpeyaData';
import { getAgpeyaTimedSections, AgpeyaSection } from '../lib/bibleChaptersEngine';
import { SpiritualAudioPlayer } from '../lib/spiritualAudioEngine';
import { SEO } from '../components/common/SEO';

export const AgpeyaPage: React.FC = () => {
  const [selectedPrayer, setSelectedPrayer] = useState<AgpeyaPrayer>(AGPEYA_PRAYERS[0]);
  const [agpeyaSections, setAgpeyaSections] = useState<AgpeyaSection[]>(() =>
    getAgpeyaTimedSections(
      AGPEYA_PRAYERS[0].id,
      AGPEYA_PRAYERS[0].openingPrayer,
      AGPEYA_PRAYERS[0].gospelText,
      AGPEYA_PRAYERS[0].litanies,
      AGPEYA_PRAYERS[0].absolutionText
    )
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);

  const playerRef = useRef<SpiritualAudioPlayer | null>(null);
  const activeSectionElementRef = useRef<HTMLDivElement | null>(null);

  // Initialize Player
  useEffect(() => {
    playerRef.current = new SpiritualAudioPlayer();
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Update Player verses when prayer sections change
  useEffect(() => {
    if (playerRef.current && agpeyaSections.length > 0) {
      const sectionTexts = agpeyaSections.map(s => `${s.title}: ${s.text}`);
      playerRef.current.setVerses(
        sectionTexts,
        (idx) => {
          setActiveSectionIndex(idx);
          if (activeSectionElementRef.current) {
            activeSectionElementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        (playing) => {
          setIsPlaying(playing);
        }
      );
    }
  }, [agpeyaSections]);

  const handleSelectPrayer = (prayer: AgpeyaPrayer) => {
    setSelectedPrayer(prayer);
    const sections = getAgpeyaTimedSections(
      prayer.id,
      prayer.openingPrayer,
      prayer.gospelText,
      prayer.litanies,
      prayer.absolutionText
    );
    setAgpeyaSections(sections);
    setActiveSectionIndex(0);
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
    setActiveSectionIndex(0);
  };

  const handleSectionClick = (index: number) => {
    setActiveSectionIndex(index);
    playerRef.current?.jumpToVerse(index);
  };

  const handleRateChange = () => {
    const rates = [0.8, 1.0, 1.2, 1.4];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    playerRef.current?.setRate(nextRate);
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
        description="صلوات السواعي القبطية الأرثوذكسية كاملة بصوت نقي ومكتوبة مع الهايلايتر التفاعلي الذكي. صلاة باكر، الثالثة، السادسة، التاسعة، الغروب، النوم، نصف الليل، والستار."
        keywords={['الاجبية المسموعة', 'صلوات السواعي', 'صلاة باكر', 'صلاة النوم', 'الاجبية القبطية']}
        canonicalUrl="https://www.tibarthenos.com/agpeya"
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
            الأجبية المقدسة المسموعة والمقروءة 🕊️
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
            استمع واقرأ صلوات السواعي على مدار اليوم، مع المتابعة المباشرة بالهايلايتر التفاعلي.
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
                onClick={() => handleSelectPrayer(prayer)}
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

        {/* Audio Controller Bar */}
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

          {/* Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRateChange}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[#fed65b] rounded-xl text-xs font-mono font-bold"
            >
              {playbackRate}x
            </button>

            <div className="flex items-center gap-4">
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
                <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصلاة بصوت واضح'}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-300 flex items-center gap-1 font-bold">
              <WifiOff className="w-3.5 h-3.5 text-[#fed65b]" />
              <span className="hidden sm:inline">أوفلاين</span>
            </span>
          </div>
        </div>

        {/* Interactive Sections with Karaoke-style Highlighter */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Psalms list summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
            <h4 className="font-tajawal text-xs font-extrabold text-[#002366] mb-2">🎵 مزامير صلاة {selectedPrayer.name}:</h4>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-600">
              {selectedPrayer.psalmsSummary.map((psalm, idx) => (
                <span key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {psalm}
                </span>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 font-bold mb-2">💡 اضغط على أي قسم للاستماع إليه فوراً</div>

          {agpeyaSections.map((sec, idx) => {
            const isSectionActive = isPlaying && activeSectionIndex === idx;
            return (
              <div
                key={sec.id}
                ref={isSectionActive ? activeSectionElementRef : null}
                onClick={() => handleSectionClick(idx)}
                className={`p-5 rounded-3xl transition-all cursor-pointer border ${
                  isSectionActive
                    ? 'bg-amber-50 text-[#00174a] font-bold border-[#d4af37] shadow-lg scale-[1.01] ring-2 ring-[#d4af37]/40'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/5">
                  <span className={`font-tajawal text-xs font-black ${isSectionActive ? 'text-[#002366]' : 'text-slate-600'}`}>
                    {sec.title}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">قسم {idx + 1}</span>
                </div>
                <p className={`${fontClasses} leading-relaxed`}>{sec.text}</p>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};

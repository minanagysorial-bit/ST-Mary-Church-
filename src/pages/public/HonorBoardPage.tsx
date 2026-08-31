import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  Trophy, 
  Award, 
  Star, 
  Crown, 
  Share2, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronLeft, 
  Users, 
  Download, 
  X,
  MessageCircle,
  PartyPopper,
  Image as ImageIcon
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

const publicReaderClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export interface LeaderboardStudent {
  id: string;
  fullName: string;
  familyId: string;
  familyName: string;
  serviceKey: string;
  serviceName: string;
  grade: string;
  points: number;
}

export const SERVICES_CONFIG = [
  { 
    key: 'primary_boys', 
    name: 'ابتدائي بنين', 
    icon: '👦', 
    description: 'أبطال المرحلة الابتدائية (من أولى حتى سادسة ابتدائي بنين)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'primary_girls', 
    name: 'ابتدائي بنات', 
    icon: '👧', 
    description: 'أميرات المرحلة الابتدائية (من أولى حتى سادسة ابتدائي بنات)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'prep_boys', 
    name: 'إعدادي بنين (فتيان)', 
    icon: '👔', 
    description: 'فرسان مرحلة إعدادي بنين (الصف الأول والثاني والثالث الإعدادي)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'prep_girls', 
    name: 'إعدادي بنات (فتيات)', 
    icon: '🎀', 
    description: 'بطلات مرحلة إعدادي بنات (الصف الأول والثاني والثالث الإعدادي)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'secondary_boys', 
    name: 'ثانوي بنين', 
    icon: '🎓', 
    description: 'شباب المرحلة الثانوية (من أولى حتى ثالثة ثانوي)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'secondary_girls', 
    name: 'ثانوي بنات', 
    icon: '🌸', 
    description: 'شابات المرحلة الثانوية (من أولى حتى ثالثة ثانوي)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'nursery', 
    name: 'حضانة (الملائكة)', 
    icon: '🕊️', 
    description: 'ملائكة حضانة والطفولة المبكرة الأبرار',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'all', 
    name: 'أبطال الكنيسة ككل', 
    icon: '🌟', 
    description: 'الترتيب العام الشامل لجميع مخدومي وأبناء الكنيسة',
    mascot: '/assets/leaderboard/trophy_gold.jpg'
  }
];

export function extractPointsFromNotes(notes?: string | null): number {
  if (!notes) return 0;
  const match = notes.match(/\[PTS:(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
}

export function setPointsInNotes(notes: string | null | undefined, pts: number): string {
  const clean = (notes || '').replace(/\[PTS:\d+\]/g, '').trim();
  return clean ? `${clean} [PTS:${pts}]` : `[PTS:${pts}]`;
}

export const HonorBoardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeServiceKey = searchParams.get('service') || 'primary_boys';

  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Disney Background Theme Switcher
  const [disneyTheme, setDisneyTheme] = useState<'cathedral' | 'kingdom'>('cathedral');

  // Sharing Modal State
  const [sharingStudent, setSharingStudent] = useState<{
    student: LeaderboardStudent;
    rank: number;
  } | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      await publicReaderClient.auth.signInWithPassword({
        email: 'peter@stmary.church',
        password: 'peter@123'
      });

      const { data: families } = await publicReaderClient
        .from('families')
        .select('*')
        .eq('family_type', 'sunday_school');

      const { data: members } = await publicReaderClient
        .from('family_members')
        .select('*');

      const localPointsCache: Record<string, number> = {};
      try {
        const local = localStorage.getItem('sunday_school_points_map');
        if (local) Object.assign(localPointsCache, JSON.parse(local));
      } catch {}

      const allStudents: LeaderboardStudent[] = [];
      const famMap = new Map((families || []).map(f => [f.id, f]));

      (members || []).forEach(m => {
        const fam = famMap.get(m.family_id);
        const famNotes = (fam?.notes || '').toLowerCase();
        const famArea = (fam?.area || '').toLowerCase();
        const stage = (m.sunday_school_stage || '').toLowerCase();
        const combined = `${famArea} ${famNotes} ${stage}`;

        let serviceKey = 'primary_boys';
        let serviceName = 'ابتدائي بنين';

        if (combined.includes('ابتدائي') && (combined.includes('بنات') || combined.includes('بنت'))) {
          serviceKey = 'primary_girls';
          serviceName = 'ابتدائي بنات';
        } else if (combined.includes('ابتدائي')) {
          serviceKey = 'primary_boys';
          serviceName = 'ابتدائي بنين';
        } else if ((combined.includes('إعدادي') || combined.includes('اعدادي')) && (combined.includes('بنات') || combined.includes('فتيات'))) {
          serviceKey = 'prep_girls';
          serviceName = 'إعدادي بنات (فتيات)';
        } else if (combined.includes('إعدادي') || combined.includes('اعدادي') || combined.includes('فتيان')) {
          serviceKey = 'prep_boys';
          serviceName = 'إعدادي بنين (فتيان)';
        } else if (combined.includes('ثانوي') && (combined.includes('بنات') || combined.includes('شابات'))) {
          serviceKey = 'secondary_girls';
          serviceName = 'ثانوي بنات';
        } else if (combined.includes('ثانوي') || combined.includes('شباب')) {
          serviceKey = 'secondary_boys';
          serviceName = 'ثانوي بنين';
        } else if (combined.includes('حضانة') || combined.includes('ملائكة')) {
          serviceKey = 'nursery';
          serviceName = 'حضانة (الملائكة)';
        }

        let pts = extractPointsFromNotes(m.notes);
        if (pts === 0 && localPointsCache[m.id]) {
          pts = localPointsCache[m.id];
        }

        allStudents.push({
          id: m.id,
          fullName: m.full_name,
          familyId: m.family_id,
          familyName: fam?.head_name || 'فصل التربية الكنسية',
          serviceKey,
          serviceName,
          grade: m.sunday_school_stage || fam?.stage || 'مرحلة كنسية',
          points: pts
        });
      });

      setStudents(allStudents);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredStudents = students
    .filter(s => activeServiceKey === 'all' || s.serviceKey === activeServiceKey)
    .filter(s => searchTerm.trim() === '' || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.points - a.points);

  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];

  const activeServiceObj = SERVICES_CONFIG.find(s => s.key === activeServiceKey) || SERVICES_CONFIG[0];
  const isGirlStage = activeServiceKey.includes('girl');

  const handleCopyServiceLink = () => {
    const url = `${window.location.origin}/leaderboard?service=${activeServiceKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getShareText = (student: LeaderboardStudent, rank: number) => {
    const rankTitle = rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${rank} 🌟`;
    return `🏰 بطل مدارس الأحد في عالم ديزني الساحر 🏆\nأنا البطل: ${student.fullName}\nحصلت على ${student.points} نقطة في ${rankTitle} على ${student.serviceName} بكنيسة السيدة العذراء مريم بمحرم بك! 🎈✨\nشوفوا لوحة الشرف هنا: ${window.location.origin}/leaderboard?service=${student.serviceKey}`;
  };

  const handleShareFacebook = (student: LeaderboardStudent, rank: number) => {
    const shareUrl = encodeURIComponent(`${window.location.origin}/leaderboard?service=${student.serviceKey}`);
    const text = encodeURIComponent(getShareText(student, rank));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${text}`, '_blank');
  };

  const handleShareWhatsApp = (student: LeaderboardStudent, rank: number) => {
    const text = encodeURIComponent(getShareText(student, rank));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyShareText = (student: LeaderboardStudent, rank: number) => {
    navigator.clipboard.writeText(getShareText(student, rank));
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 3000);
  };

  // Generate & Download Magical Disney Achievement Badge
  const handleDownloadBadge = (student: LeaderboardStudent, rank: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disney Rainbow Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
    gradient.addColorStop(0, '#38bdf8');
    gradient.addColorStop(0.3, '#fde047');
    gradient.addColorStop(0.7, '#f472b6');
    gradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);

    // Crystal white card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 40;
    ctx.roundRect(50, 50, 900, 900, 55);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing Golden Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.roundRect(50, 50, 900, 900, 55);
    ctx.stroke();

    // Church Header
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 36px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('كنيسة السيدة العذراء مريم — محرم بك ⛪', 500, 140);

    // Festive Title
    ctx.fillStyle = '#d97706';
    ctx.font = '900 50px Tahoma, Arial, sans-serif';
    ctx.fillText('🌟 لوحة الشرف وأبطال مدارس الأحد 🏆', 500, 230);

    // Student Box
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.roundRect(100, 310, 800, 480, 40);
    ctx.fill();
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 70px Tahoma, Arial, sans-serif';
    ctx.fillText(student.fullName, 500, 435);

    // Service Name
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 40px Tahoma, Arial, sans-serif';
    ctx.fillText(student.serviceName, 500, 515);

    // Rank Pill
    const rankTitle = rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${rank} 🌟`;
    ctx.fillStyle = '#f59e0b';
    ctx.roundRect(240, 575, 520, 90, 45);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Tahoma, Arial, sans-serif';
    ctx.fillText(rankTitle, 500, 638);

    // Points
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 52px Tahoma, Arial, sans-serif';
    ctx.fillText(`⭐️ ${student.points} نقطة تميز ⭐️`, 500, 745);

    // Verse
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 26px Tahoma, Arial, sans-serif';
    ctx.fillText('« كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ » ✝️', 500, 850);

    // Footer
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px Tahoma, Arial, sans-serif';
    ctx.fillText('منصة التربية الكنسية الرقمية • stmary.church', 500, 915);

    const link = document.createElement('a');
    link.download = `بطل_مدارس_الأحد_${student.fullName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const bgImage = disneyTheme === 'cathedral' 
    ? '/assets/leaderboard/disney_coptic_cathedral.jpg' 
    : '/assets/leaderboard/disney_magical_kingdom.jpg';

  return (
    <div 
      className="min-h-screen text-white font-cairo selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden" 
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed'
      }}
      dir="rtl"
    >
      {/* Soft Ambient Cinematic Vignette Overlay (Background remains 100% visible!) */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-0"></div>

      {/* Floating Disney Sparkles */}
      <div className="fixed top-10 left-8 text-3xl animate-bounce pointer-events-none opacity-90 z-10" style={{ animationDuration: '3.5s' }}>✨</div>
      <div className="fixed top-24 right-10 text-4xl animate-bounce pointer-events-none opacity-90 z-10" style={{ animationDuration: '4.5s' }}>🎈</div>
      <div className="fixed bottom-20 left-12 text-3xl animate-pulse pointer-events-none opacity-80 z-10">🌟</div>
      <div className="fixed bottom-32 right-14 text-4xl animate-bounce pointer-events-none opacity-90 z-10" style={{ animationDuration: '5s' }}>🎉</div>

      {/* Sleek Floating Glass Header (No solid white block) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/20 shadow-2xl px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center font-black shadow-[0_0_20px_rgba(251,191,36,0.6)] border-2 border-white/80 transform hover:rotate-12 transition-transform cursor-pointer">
              <Trophy className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full inline-block border border-amber-400/40">
                كنيسة السيدة العذراء مريم — محرم بك ⛪
              </span>
              <h1 className="font-tajawal text-base sm:text-lg font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                لوحة الشرف وأبطال مدارس الأحد ✨
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Background Switcher Capsule */}
            <button
              onClick={() => setDisneyTheme(disneyTheme === 'cathedral' ? 'kingdom' : 'cathedral')}
              className="px-3.5 py-2 rounded-full backdrop-blur-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/40 shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer hidden md:flex"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{disneyTheme === 'cathedral' ? 'خلفية القصر 🏰' : 'خلفية الكاتدرائية ⛪'}</span>
            </button>

            <button
              onClick={handleCopyServiceLink}
              className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.5)] border-2 border-white/80 transition-all active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
              <span className="sm:hidden">{copiedLink ? 'تم!' : 'مشاركة'}</span>
            </button>

            <Link
              to="/servant/points"
              className="backdrop-blur-xl bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-full text-xs font-black transition-all border border-white/40 shadow-sm hidden sm:flex items-center gap-1"
            >
              <span>دخول الخدام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Flow Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8 relative z-10">
        
        {/* Seamless Hero Header (NO Big White Card!) */}
        <section className="text-center space-y-3 pt-2 relative">
          
          {/* Floating Mascots alongside Title */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            
            {/* 3D Boy Avatar Floating */}
            <div className="hidden sm:flex flex-col items-center animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] border-2 border-white">
                <img 
                  src="/assets/leaderboard/mascot_boy.jpg" 
                  alt="Boy Hero" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-[10px] font-black text-sky-200 mt-1 drop-shadow">بطل ابتدائي 👦</span>
            </div>

            {/* Central Glowing Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-xl bg-black/40 border border-amber-300/60 text-amber-300 text-xs font-black shadow-2xl">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>عالم أبطال التربية الكنسية الساحر 🏰✨</span>
              </div>

              <h2 className="font-tajawal text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                أبطال <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">{activeServiceObj.name}</span> 🏆
              </h2>

              <p className="text-xs sm:text-sm text-slate-100 font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-lg mx-auto">
                {activeServiceObj.description}
              </p>

              <div className="backdrop-blur-md bg-black/40 border border-amber-300/50 rounded-full px-5 py-1.5 inline-block text-xs text-amber-200 font-black shadow-lg">
                « كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ » (1 كو 15: 58) ✝️
              </div>
            </div>

            {/* 3D Girl Avatar Floating */}
            <div className="hidden sm:flex flex-col items-center animate-bounce" style={{ animationDuration: '4.5s' }}>
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-pink-400 to-amber-400 shadow-[0_0_25px_rgba(244,114,182,0.5)] border-2 border-white">
                <img 
                  src="/assets/leaderboard/mascot_girl.jpg" 
                  alt="Girl Hero" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-[10px] font-black text-pink-200 mt-1 drop-shadow">أميرة ابتدائي 👧</span>
            </div>

          </div>

        </section>

        {/* Floating Glass Bubbles Stage Selector (No square boxes) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <Users className="w-4 h-4 text-amber-300" />
              <span>اختر خدمة مدارس الأحد:</span>
            </span>
            <span className="text-xs font-black text-amber-200 backdrop-blur-xl bg-black/40 border border-amber-300/40 px-3.5 py-1 rounded-full shadow-lg">
              {filteredStudents.length} بطل متألق 🌟
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-amber-400/50">
            {SERVICES_CONFIG.map(svc => {
              const isActive = activeServiceKey === svc.key;
              const count = students.filter(s => svc.key === 'all' || s.serviceKey === svc.key).length;
              return (
                <button
                  key={svc.key}
                  onClick={() => setSearchParams({ service: svc.key })}
                  className={`px-4 py-2.5 rounded-full font-black text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 shadow-[0_0_25px_rgba(251,191,36,0.8)] border-2 border-white scale-105 transform -translate-y-1'
                      : 'backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white border border-white/30 hover:border-amber-300 shadow-lg'
                  }`}
                >
                  <span className="text-sm">{svc.icon}</span>
                  <span>{svc.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-amber-950 text-amber-300' : 'bg-white/20 text-white'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Floating Capsule Search Bar */}
        <section className="relative max-w-md mx-auto">
          <Search className="w-5 h-5 text-amber-300 absolute right-4 top-3.5" />
          <input
            type="text"
            placeholder="ابحث عن اسمك أو اسم صديقك... 🔍"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full backdrop-blur-2xl bg-black/40 border-2 border-white/40 focus:border-amber-400 rounded-full pr-12 pl-5 py-3 text-xs sm:text-sm font-black text-white placeholder:text-slate-300 outline-none shadow-2xl transition-all"
          />
        </section>

        {/* Dynamic Display Area */}
        {loading ? (
          <div className="py-20 text-center space-y-4 backdrop-blur-xl bg-black/40 rounded-3xl border border-white/30 max-w-md mx-auto p-8 shadow-2xl">
            <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
            <p className="font-tajawal text-base font-black text-white drop-shadow">جاري تجهيز لوحة الشرف وأبطال الخدمة...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="backdrop-blur-xl bg-black/40 rounded-3xl border border-white/30 p-12 text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 flex items-center justify-center text-4xl shadow-inner border border-amber-300">
              🌟
            </div>
            <h3 className="font-tajawal text-xl font-black text-white">لا توجد نقاط مسجلة لهذه الخدمة بعد</h3>
            <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto font-black leading-relaxed">
              سيظهر أبطال الخدمة هنا فور قيام الخدام بتسجيل ومنح النقاط من صفحة نقاط مدارس الأحد.
            </p>
          </div>
        ) : (
          <>
            {/* Seamless Disney Cloud Podium for Top 3 */}
            <section className="pt-8 pb-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto">
                
                {/* #2 Silver (Right in RTL) */}
                {top2 ? (
                  <div className="flex flex-col items-center space-y-2 order-1 group">
                    <div className="relative">
                      <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-white text-slate-900 border-4 border-white shadow-[0_0_25px_rgba(255,255,255,0.6)] flex items-center justify-center font-black text-3xl group-hover:scale-105 transition-transform">
                        🥈
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-slate-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        #2
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{top2.fullName}</h4>
                      <p className="text-[11px] text-slate-300 font-bold drop-shadow">{top2.grade}</p>
                      <span className="inline-block backdrop-blur-md bg-white/20 border border-white/40 text-white px-3 py-0.5 rounded-full text-xs font-black shadow-md mt-1">
                        ⭐️ {top2.points}
                      </span>
                    </div>

                    {/* Silver Cloud Pedestal */}
                    <div className="w-full h-28 sm:h-36 rounded-t-3xl backdrop-blur-2xl bg-gradient-to-b from-white/35 via-white/20 to-black/40 border-t-4 border-slate-300 flex flex-col items-center justify-between p-2.5 shadow-2xl border-x border-white/20">
                      <span className="text-white font-black text-2xl sm:text-3xl drop-shadow">2</span>
                      <button
                        onClick={() => setSharingStudent({ student: top2, rank: 2 })}
                        className="w-full py-1.5 bg-white/30 hover:bg-white/50 text-white rounded-full text-[11px] font-black flex items-center justify-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer border border-white/40"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="order-1" />
                )}

                {/* #1 Gold (Center - Highest) */}
                {top1 && (
                  <div className="flex flex-col items-center space-y-2 order-2 group -mt-10">
                    <div className="relative">
                      {/* Floating Disney Crown */}
                      <Crown className="w-10 h-10 text-amber-300 animate-bounce mx-auto mb-1 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 text-amber-950 border-4 border-white shadow-[0_0_40px_rgba(251,191,36,0.8)] flex items-center justify-center font-black text-4xl sm:text-5xl group-hover:scale-105 transition-transform animate-pulse">
                        🥇
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-sm font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        #1
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-sm sm:text-lg text-amber-300 line-clamp-1 drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">{top1.fullName}</h4>
                      <p className="text-[11px] text-amber-200 font-black drop-shadow">{top1.grade}</p>
                      <span className="inline-block bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 px-4 py-1 rounded-full text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.7)] mt-1 border-2 border-white">
                        ⭐️ {top1.points} نقطة
                      </span>
                    </div>

                    {/* Gold Cloud Pedestal */}
                    <div className="w-full h-40 sm:h-48 rounded-t-3xl backdrop-blur-2xl bg-gradient-to-b from-amber-400/40 via-yellow-300/25 to-black/50 border-t-4 border-amber-300 flex flex-col items-center justify-between p-3 shadow-[0_0_40px_rgba(251,191,36,0.4)] border-x border-amber-300/40">
                      <div className="text-center">
                        <span className="text-amber-300 font-black text-3xl sm:text-4xl block drop-shadow">1</span>
                        <span className="text-[10px] text-amber-200 font-black uppercase tracking-wider bg-black/40 px-3 py-0.5 rounded-full border border-amber-300/40">
                          بطل الخدمة 👑
                        </span>
                      </div>
                      <button
                        onClick={() => setSharingStudent({ student: top1, rank: 1 })}
                        className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 cursor-pointer border-2 border-white"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-950" />
                        <span>مشاركة الإنجاز 🚀</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* #3 Bronze (Left in RTL) */}
                {top3 ? (
                  <div className="flex flex-col items-center space-y-2 order-3 group">
                    <div className="relative">
                      <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-400 text-white border-4 border-white shadow-[0_0_25px_rgba(217,119,6,0.6)] flex items-center justify-center font-black text-3xl group-hover:scale-105 transition-transform">
                        🥉
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-800 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        #3
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{top3.fullName}</h4>
                      <p className="text-[11px] text-slate-300 font-bold drop-shadow">{top3.grade}</p>
                      <span className="inline-block backdrop-blur-md bg-white/20 border border-white/40 text-amber-200 px-3 py-0.5 rounded-full text-xs font-black shadow-md mt-1">
                        ⭐️ {top3.points}
                      </span>
                    </div>

                    {/* Bronze Cloud Pedestal */}
                    <div className="w-full h-24 sm:h-32 rounded-t-3xl backdrop-blur-2xl bg-gradient-to-b from-amber-700/40 via-amber-600/25 to-black/40 border-t-4 border-amber-500 flex flex-col items-center justify-between p-2.5 shadow-2xl border-x border-white/20">
                      <span className="text-amber-200 font-black text-2xl sm:text-3xl drop-shadow">3</span>
                      <button
                        onClick={() => setSharingStudent({ student: top3, rank: 3 })}
                        className="w-full py-1.5 bg-white/30 hover:bg-white/50 text-white rounded-full text-[11px] font-black flex items-center justify-center gap-1 shadow-lg transition-all active:scale-95 cursor-pointer border border-white/40"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="order-3" />
                )}

              </div>
            </section>

            {/* Creative Seamless Stream for the Rest of the Champions */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-white/30 pb-2 px-2">
                <h3 className="font-tajawal text-base sm:text-lg font-black text-white flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <Award className="w-5 h-5 text-amber-300" />
                  <span>باقي أبطال الخدمة في لوحة الشرف 🎈</span>
                </h3>
                <span className="text-xs font-black text-amber-200 backdrop-blur-md bg-black/40 px-3.5 py-1 rounded-full border border-amber-300/30 shadow-md">
                  ترتيب تنازلي حسب النقاط
                </span>
              </div>

              {/* Seamless Floating Ribbons (NO Clunky Square White Boxes!) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStudents.map((s, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 backdrop-blur-xl shadow-xl hover:scale-[1.02] ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-500/35 via-black/45 to-black/35 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                          : rank === 2
                          ? 'bg-gradient-to-r from-slate-300/30 via-black/45 to-black/35 border-slate-300'
                          : rank === 3
                          ? 'bg-gradient-to-r from-amber-700/30 via-black/45 to-black/35 border-amber-500'
                          : 'bg-black/35 hover:bg-black/55 border-white/20 hover:border-amber-300/60'
                      }`}
                    >
                      {/* Rank Badge & Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                          rank === 1
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-400 text-amber-950 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                            : rank === 2
                            ? 'bg-gradient-to-br from-slate-300 to-slate-100 text-slate-900 border-2 border-white'
                            : rank === 3
                            ? 'bg-gradient-to-br from-amber-600 to-amber-500 text-white border-2 border-white'
                            : 'backdrop-blur-md bg-white/20 text-white border border-white/40'
                        }`}>
                          #{rank}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-black text-sm sm:text-base text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {s.fullName}
                          </h4>
                          <p className="text-[11px] text-amber-200/90 font-bold truncate drop-shadow">
                            {s.familyName} {s.grade ? `• ${s.grade}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Points Capsule & Share Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 rounded-full backdrop-blur-md bg-amber-400/25 border border-amber-300 text-amber-300 font-black text-xs sm:text-sm shadow-md">
                          ⭐️ {s.points}
                        </span>

                        <button
                          onClick={() => setSharingStudent({ student: s, rank })}
                          className="p-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 transition-all cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.5)] active:scale-95 border border-white"
                          title="مشاركة إنجازك على فيسبوك وواتساب"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

      </main>

      {/* Disney Celebration Share Modal */}
      {sharingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="backdrop-blur-3xl bg-[#001438]/90 border-2 border-amber-400/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-[0_0_60px_rgba(251,191,36,0.3)] relative overflow-hidden text-center animate-scale-in">
            
            {/* Modal Close */}
            <button
              onClick={() => setSharingStudent(null)}
              className="absolute top-4 left-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="inline-block px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/40">
                بطاقة تكريم ومشاركة البطل 🥳🚀
              </span>
              <h3 className="font-tajawal text-2xl font-black text-white drop-shadow">
                شارك إنجازك مع أصحابك وعيلتك!
              </h3>
            </div>

            {/* Visual 3D Preview Celebration Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-white/10 via-amber-400/10 to-white/5 border border-amber-300/40 shadow-inner space-y-3 relative overflow-hidden">
              
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                <img 
                  src={isGirlStage ? "/assets/leaderboard/mascot_girl.jpg" : "/assets/leaderboard/mascot_boy.jpg"} 
                  alt="Mascot" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-sky-300 font-black block drop-shadow">كنيسة السيدة العذراء مريم بمحرم بك ⛪</span>
                <h4 className="font-tajawal text-2xl font-black text-amber-300 drop-shadow">
                  {sharingStudent.student.fullName}
                </h4>
                <p className="text-xs text-slate-200 font-bold">
                  {sharingStudent.student.serviceName}
                </p>
              </div>

              {/* Rank & Points Pill */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 px-6 py-2 rounded-full font-black text-sm shadow-lg border border-white">
                <span>
                  {sharingStudent.rank === 1 ? 'المركز الأول 🥇' : sharingStudent.rank === 2 ? 'المركز الثاني 🥈' : sharingStudent.rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${sharingStudent.rank}`}
                </span>
                <span>•</span>
                <span>{sharingStudent.student.points} نقطة تميز ⭐️</span>
              </div>

              <p className="text-[11px] text-slate-300 italic pt-1 font-bold">
                « مَنِ اعْتَرَفَ بِي قُدَّامَ النَّاسِ أَعْتَرِفُ أَنَا أَيْضًا بِهِ قُدَّامَ أَبِي الَّذِي فِي السَّمَاوَاتِ » ✝️
              </p>
            </div>

            {/* Share Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleShareFacebook(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-white/30 active:scale-95"
              >
                <span>مشاركة على فيسبوك 🟦</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer border border-white/30 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>مشاركة على واتساب 🟩</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleDownloadBadge(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 rounded-full text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer border border-white active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-950" />
                <span>تحميل صورة البطاقة 📸</span>
              </button>

              <button
                onClick={() => handleCopyShareText(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                {copiedShareText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShareText ? 'تم نسخ النص والرابط!' : 'نسخ نص المنشور 📋'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sleek Floating Footer */}
      <footer className="border-t border-white/20 py-6 text-center text-xs text-white/80 space-y-1.5 backdrop-blur-xl bg-black/40 mt-12">
        <p className="font-black text-white drop-shadow">كنيسة السيدة العذراء مريم — محرم بك • الإسكندرية ⛪</p>
        <p className="text-[11px] text-amber-200/90 font-bold">لوحة الشرف وأبطال مدارس الأحد في عالم ديزني الساحر 🎈 © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
};

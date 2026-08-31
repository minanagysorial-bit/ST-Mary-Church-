import React, { useState, useEffect, useRef } from 'react';
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
  Heart
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

// Isolated read-only client for public visitors
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
    color: 'from-blue-400 to-cyan-500', 
    btnBg: 'bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-700',
    description: 'أبطال المرحلة الابتدائية (من أولى حتى سادسة ابتدائي بنين)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'primary_girls', 
    name: 'ابتدائي بنات', 
    icon: '👧', 
    color: 'from-pink-400 to-rose-500', 
    btnBg: 'bg-pink-500 hover:bg-pink-600 border-b-4 border-pink-700',
    description: 'أميرات المرحلة الابتدائية (من أولى حتى سادسة ابتدائي بنات)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'prep_boys', 
    name: 'إعدادي بنين (فتيان)', 
    icon: '👔', 
    color: 'from-purple-500 to-indigo-600', 
    btnBg: 'bg-purple-600 hover:bg-purple-700 border-b-4 border-purple-800',
    description: 'فرسان مرحلة إعدادي بنين (الصف الأول والثاني والثالث الإعدادي)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'prep_girls', 
    name: 'إعدادي بنات (فتيات)', 
    icon: '🎀', 
    color: 'from-rose-400 to-fuchsia-500', 
    btnBg: 'bg-rose-500 hover:bg-rose-600 border-b-4 border-rose-700',
    description: 'بطلات مرحلة إعدادي بنات (الصف الأول والثاني والثالث الإعدادي)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'secondary_boys', 
    name: 'ثانوي بنين', 
    icon: '🎓', 
    color: 'from-indigo-500 to-blue-600', 
    btnBg: 'bg-indigo-600 hover:bg-indigo-700 border-b-4 border-indigo-800',
    description: 'شباب المرحلة الثانوية (من أولى حتى ثالثة ثانوي)',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'secondary_girls', 
    name: 'ثانوي بنات', 
    icon: '🌸', 
    color: 'from-fuchsia-400 to-pink-600', 
    btnBg: 'bg-fuchsia-600 hover:bg-fuchsia-700 border-b-4 border-fuchsia-800',
    description: 'شابات المرحلة الثانوية (من أولى حتى ثالثة ثانوي)',
    mascot: '/assets/leaderboard/mascot_girl.jpg'
  },
  { 
    key: 'nursery', 
    name: 'حضانة (الملائكة)', 
    icon: '🕊️', 
    color: 'from-amber-400 to-orange-500', 
    btnBg: 'bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700',
    description: 'ملائكة حضانة والطفولة المبكرة الأبرار',
    mascot: '/assets/leaderboard/mascot_boy.jpg'
  },
  { 
    key: 'all', 
    name: 'أبطال الكنيسة ككل', 
    icon: '🌟', 
    color: 'from-amber-400 via-yellow-400 to-amber-500', 
    btnBg: 'bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700',
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

  // Sharing Modal State
  const [sharingStudent, setSharingStudent] = useState<{
    student: LeaderboardStudent;
    rank: number;
  } | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Fetch all students and dynamic points
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Silent guest reader
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
    return `🎉 بطل مدارس الأحد 🏆\nأنا البطل: ${student.fullName}\nحصلت على ${student.points} نقطة في ${rankTitle} على ${student.serviceName} بكنيسة السيدة العذراء مريم بمحرم بك! 🎈✨\nشاركوني الفرحة وشوفوا لوحة الشرف هنا: ${window.location.origin}/leaderboard?service=${student.serviceKey}`;
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

  // Download Badge Image
  const handleDownloadBadge = (student: LeaderboardStudent, rank: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cheerful sunny sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
    gradient.addColorStop(0, '#38bdf8'); // Sky blue
    gradient.addColorStop(0.5, '#fde047'); // Sunshine yellow
    gradient.addColorStop(1, '#f472b6'); // Candy pink
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);

    // Inner glossy white card
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 30;
    ctx.roundRect(50, 50, 900, 900, 50);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Golden colorful border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.roundRect(50, 50, 900, 900, 50);
    ctx.stroke();

    // Church Header
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 36px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('كنيسة السيدة العذراء مريم — محرم بك ⛪', 500, 140);

    // Festive Title
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 52px Tahoma, Arial, sans-serif';
    ctx.fillText('🌟 لوحة الشرف وأبطال مدارس الأحد 🏆', 500, 230);

    // Student Name Box
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.roundRect(100, 310, 800, 480, 40);
    ctx.fill();
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 70px Tahoma, Arial, sans-serif';
    ctx.fillText(student.fullName, 500, 440);

    // Service Name
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 40px Tahoma, Arial, sans-serif';
    ctx.fillText(student.serviceName, 500, 520);

    // Rank Pill
    const rankTitle = rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${rank} 🌟`;
    ctx.fillStyle = '#f59e0b';
    ctx.roundRect(240, 580, 520, 90, 45);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Tahoma, Arial, sans-serif';
    ctx.fillText(rankTitle, 500, 642);

    // Points
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 52px Tahoma, Arial, sans-serif';
    ctx.fillText(`⭐️ ${student.points} نقطة تميز ⭐️`, 500, 745);

    // Verse
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 26px Tahoma, Arial, sans-serif';
    ctx.fillText('« كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ »', 500, 850);

    // Footer
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px Tahoma, Arial, sans-serif';
    ctx.fillText('منصة التربية الكنسية الرقمية • stmary.church', 500, 910);

    const link = document.createElement('a');
    link.download = `بطل_مدارس_الأحد_${student.fullName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#dbeafe] via-[#fef08a]/40 to-[#fce7f3] text-slate-800 font-cairo selection:bg-amber-400 selection:text-slate-900 relative overflow-x-hidden" dir="rtl">
      
      {/* Floating 3D Background Decors (Balloons & Sparkles) */}
      <div className="fixed top-12 left-6 text-4xl animate-bounce pointer-events-none opacity-80" style={{ animationDuration: '3s' }}>🎈</div>
      <div className="fixed top-24 right-8 text-3xl animate-bounce pointer-events-none opacity-80" style={{ animationDuration: '4s' }}>🎉</div>
      <div className="fixed bottom-20 left-12 text-4xl animate-pulse pointer-events-none opacity-70">⭐️</div>
      <div className="fixed bottom-32 right-12 text-3xl animate-bounce pointer-events-none opacity-70" style={{ animationDuration: '5s' }}>🎈</div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/85 border-b-2 border-amber-300 shadow-sm px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30 border-2 border-white transform hover:rotate-6 transition-transform">
              <Trophy className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                كنيسة السيدة العذراء مريم — محرم بك ⛪
              </span>
              <h1 className="font-tajawal text-base sm:text-lg font-black text-slate-900 leading-tight">
                لوحة الشرف وأبطال مدارس الأحد ✨
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyServiceLink}
              className="bg-amber-400 hover:bg-amber-500 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 text-amber-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة رابط هذه الخدمة'}</span>
              <span className="sm:hidden">{copiedLink ? 'تم!' : 'مشاركة'}</span>
            </button>

            <Link
              to="/servant/points"
              className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-2xl text-xs font-black transition-all border-2 border-slate-200 shadow-xs hidden sm:flex items-center gap-1"
            >
              <span>دخول الخدام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8 relative z-10">
        
        {/* Vibrant 3D Cartoon Hero Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-sky-400 via-amber-300 to-pink-400 p-1 shadow-xl overflow-hidden">
          <div className="bg-white/90 backdrop-blur-md rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
            
            {/* 3D Boy Mascot (Left / Start) */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 to-sky-400 shadow-xl shadow-sky-500/20 transform -rotate-3 hover:rotate-0 transition-transform">
                <img 
                  src="/assets/leaderboard/mascot_boy.jpg" 
                  alt="بطل مدارس الأحد 3D" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full mt-2 shadow-xs">
                بطل ابتدائي بنين 👦⚡
              </span>
            </div>

            {/* Center Content */}
            <div className="text-center space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-sm border border-amber-500 animate-bounce">
                <PartyPopper className="w-4 h-4" />
                <span>لوحة الشرف التفاعلية المباشرة 🥳</span>
              </div>

              <h2 className="font-tajawal text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                أبطال <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-amber-600 to-pink-600">{activeServiceObj.name}</span> 🏆
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-bold leading-relaxed">
                {activeServiceObj.description} • يتم تحديث النقاط والمراكز تلقائياً من الخدام فوراً.
              </p>

              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 inline-block text-[11px] text-amber-900 font-bold">
                « كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ كُلَّ حِينٍ » (1 كو 15: 58) ✝️
              </div>
            </div>

            {/* 3D Girl Mascot (Right / End) */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-tr from-pink-400 to-amber-400 shadow-xl shadow-pink-500/20 transform rotate-3 hover:rotate-0 transition-transform">
                <img 
                  src="/assets/leaderboard/mascot_girl.jpg" 
                  alt="بطلة مدارس الأحد 3D" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-[11px] font-black text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full mt-2 shadow-xs">
                أميرة ابتدائي بنات 👧💖
              </span>
            </div>

          </div>
        </section>

        {/* 3D Tactile Services Switcher Tabs */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>اختر خدمة مدارس الأحد:</span>
            </span>
            <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              {filteredStudents.length} بطل متألق 🌟
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-amber-300">
            {SERVICES_CONFIG.map(svc => {
              const isActive = activeServiceKey === svc.key;
              const count = students.filter(s => svc.key === 'all' || s.serviceKey === svc.key).length;
              return (
                <button
                  key={svc.key}
                  onClick={() => setSearchParams({ service: svc.key })}
                  className={`px-4 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? `${svc.btnBg} text-white shadow-xl scale-105 transform -translate-y-1`
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-amber-400 shadow-sm'
                  }`}
                >
                  <span className="text-base">{svc.icon}</span>
                  <span>{svc.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white text-slate-900 shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Playful Search Bar */}
        <section className="relative max-w-md mx-auto">
          <Search className="w-5 h-5 text-amber-500 absolute right-4 top-3.5" />
          <input
            type="text"
            placeholder="ابحث عن اسمك أو اسم صاحبك في لوحة الشرف... 🔍"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-amber-300 focus:border-amber-500 rounded-2xl pr-12 pl-4 py-3 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none shadow-md shadow-amber-500/10 transition-all"
          />
        </section>

        {/* Content State */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
            <p className="font-tajawal text-base font-black text-slate-700">جاري تجهيز لوحة الشرف وأبطال الخدمة...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-amber-200 p-12 text-center space-y-4 shadow-lg">
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-4xl shadow-inner">
              🌟
            </div>
            <h3 className="font-tajawal text-xl font-black text-slate-800">لا توجد نقاط مسجلة لهذه الخدمة بعد</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-bold leading-relaxed">
              سيظهر أبطال الخدمة هنا فور قيام الخادم بتسجيل ومنح النقاط للمخدومين من صفحة نقاط مدارس الأحد.
            </p>
          </div>
        ) : (
          <>
            {/* Joyful 3D Podium for Top 3 */}
            <section className="pt-6 pb-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto">
                
                {/* #2 Silver (Right in RTL) */}
                {top2 ? (
                  <div className="flex flex-col items-center space-y-2 order-1 group">
                    <div className="relative">
                      <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-slate-200 via-slate-100 to-white text-slate-800 border-4 border-slate-300 shadow-xl flex items-center justify-center font-black text-3xl group-hover:scale-105 transition-transform">
                        🥈
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-slate-400 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        #2
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1">{top2.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">{top2.grade}</p>
                      <span className="inline-block bg-slate-200 text-slate-800 px-3 py-0.5 rounded-full text-xs font-black shadow-xs mt-1">
                        ⭐️ {top2.points}
                      </span>
                    </div>

                    {/* Silver Pedestal */}
                    <div className="w-full h-32 sm:h-40 rounded-t-3xl bg-gradient-to-b from-slate-300 to-slate-200 border-t-4 border-slate-400 flex flex-col items-center justify-between p-2.5 shadow-xl">
                      <span className="text-slate-600 font-black text-2xl sm:text-3xl">2</span>
                      <button
                        onClick={() => setSharingStudent({ student: top2, rank: 2 })}
                        className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-slate-600" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="order-1" />
                )}

                {/* #1 Gold (Center - Highest) */}
                {top1 && (
                  <div className="flex flex-col items-center space-y-2 order-2 group -mt-8">
                    <div className="relative">
                      {/* Floating Crown */}
                      <Crown className="w-9 h-9 text-amber-500 animate-bounce mx-auto mb-1 filter drop-shadow-md" />
                      <div className="w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 text-amber-950 border-4 border-amber-400 shadow-2xl shadow-amber-500/40 flex items-center justify-center font-black text-4xl group-hover:scale-105 transition-transform animate-pulse">
                        🥇
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-sm font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        #1
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-sm sm:text-base text-amber-900 line-clamp-1">{top1.fullName}</h4>
                      <p className="text-[11px] text-amber-700 font-bold">{top1.grade}</p>
                      <span className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 px-4 py-1 rounded-full text-xs sm:text-sm font-black shadow-md mt-1 border border-amber-300">
                        ⭐️ {top1.points} نقطة
                      </span>
                    </div>

                    {/* Gold Pedestal */}
                    <div className="w-full h-44 sm:h-52 rounded-t-3xl bg-gradient-to-b from-amber-400 via-amber-300 to-yellow-200 border-t-4 border-amber-500 flex flex-col items-center justify-between p-3 shadow-2xl shadow-amber-500/30">
                      <div className="text-center">
                        <span className="text-amber-950 font-black text-3xl sm:text-4xl block">1</span>
                        <span className="text-[10px] text-amber-900 font-black uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full shadow-xs">
                          بطل الخدمة 👑
                        </span>
                      </div>
                      <button
                        onClick={() => setSharingStudent({ student: top1, rank: 1 })}
                        className="w-full py-2.5 bg-amber-950 hover:bg-black text-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>مشاركة الإنجاز 🚀</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* #3 Bronze (Left in RTL) */}
                {top3 ? (
                  <div className="flex flex-col items-center space-y-2 order-3 group">
                    <div className="relative">
                      <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white border-4 border-amber-600 shadow-xl flex items-center justify-center font-black text-3xl group-hover:scale-105 transition-transform">
                        🥉
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-700 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        #3
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-1">{top3.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-bold">{top3.grade}</p>
                      <span className="inline-block bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full text-xs font-black shadow-xs mt-1">
                        ⭐️ {top3.points}
                      </span>
                    </div>

                    {/* Bronze Pedestal */}
                    <div className="w-full h-28 sm:h-34 rounded-t-3xl bg-gradient-to-b from-amber-600 to-amber-500 border-t-4 border-amber-700 flex flex-col items-center justify-between p-2.5 shadow-xl">
                      <span className="text-white font-black text-2xl sm:text-3xl">3</span>
                      <button
                        onClick={() => setSharingStudent({ student: top3, rank: 3 })}
                        className="w-full py-2 bg-white hover:bg-amber-50 text-amber-950 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-amber-700" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="order-3" />
                )}

              </div>
            </section>

            {/* Complete Joyful Ranked Cards List */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b-2 border-amber-300 pb-2">
                <h3 className="font-tajawal text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>باقي أبطال الخدمة 🎈</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  ترتيب تنازلي حسب النقاط
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStudents.map((s, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between gap-3 shadow-md hover:-translate-y-1 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-100 to-yellow-50 border-amber-400'
                          : rank === 2
                          ? 'bg-gradient-to-r from-slate-100 to-white border-slate-300'
                          : rank === 3
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
                          : 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      {/* Rank & Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                          rank === 1
                            ? 'bg-amber-400 text-amber-950 border-2 border-white'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-900 border-2 border-white'
                            : rank === 3
                            ? 'bg-amber-600 text-white border-2 border-white'
                            : 'bg-sky-100 text-sky-800 border-2 border-sky-200'
                        }`}>
                          #{rank}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-slate-900 truncate">{s.fullName}</h4>
                          <p className="text-[11px] text-slate-500 font-bold truncate">
                            {s.familyName} {s.grade ? `• ${s.grade}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Points & Share Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3.5 py-1.5 rounded-2xl bg-amber-100 text-amber-950 font-black text-xs sm:text-sm border border-amber-300 shadow-xs">
                          ⭐️ {s.points}
                        </span>

                        <button
                          onClick={() => setSharingStudent({ student: s, rank })}
                          className="p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 border-b-2 border-amber-600 active:border-b-0 active:translate-y-0.5 text-amber-950 transition-all cursor-pointer shadow-xs"
                          title="مشاركة إنجازك على فيسبوك وواتساب"
                        >
                          <Share2 className="w-4 h-4" />
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

      {/* Joyful Share Achievement Modal */}
      {sharingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-center animate-scale-in">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSharingStudent(null)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                بطاقة تكريم ومشاركة البطل 🥳🚀
              </span>
              <h3 className="font-tajawal text-2xl font-black text-slate-900">
                شارك إنجازك مع أصحابك وعيلتك!
              </h3>
            </div>

            {/* Visual 3D Preview Celebration Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-sky-100 via-amber-50 to-pink-100 border-2 border-amber-300 shadow-inner space-y-3 relative overflow-hidden">
              
              {/* 3D Mascot in Celebration Card */}
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-lg">
                <img 
                  src={isGirlStage ? "/assets/leaderboard/mascot_girl.jpg" : "/assets/leaderboard/mascot_boy.jpg"} 
                  alt="Mascot" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-sky-800 font-black block">كنيسة السيدة العذراء مريم بمحرم بك ⛪</span>
                <h4 className="font-tajawal text-2xl font-black text-slate-900">
                  {sharingStudent.student.fullName}
                </h4>
                <p className="text-xs text-slate-600 font-bold">
                  {sharingStudent.student.serviceName}
                </p>
              </div>

              {/* Rank & Points Pill */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 px-6 py-2.5 rounded-2xl font-black text-sm shadow-md border border-amber-300">
                <span>
                  {sharingStudent.rank === 1 ? 'المركز الأول 🥇' : sharingStudent.rank === 2 ? 'المركز الثاني 🥈' : sharingStudent.rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${sharingStudent.rank}`}
                </span>
                <span>•</span>
                <span>{sharingStudent.student.points} نقطة تميز ⭐️</span>
              </div>

              <p className="text-[11px] text-slate-500 italic pt-1">
                « مَنِ اعْتَرَفَ بِي قُدَّامَ النَّاسِ أَعْتَرِفُ أَنَا أَيْضًا بِهِ قُدَّامَ أَبِي الَّذِي فِي السَّمَاوَاتِ » ✝️
              </p>
            </div>

            {/* Share Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleShareFacebook(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] border-b-4 border-[#0c59be] active:border-b-0 active:translate-y-1 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>مشاركة على فيسبوك 🟦</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] border-b-4 border-[#128C7E] active:border-b-0 active:translate-y-1 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>مشاركة على واتساب 🟩</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleDownloadBadge(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 text-amber-950 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-950" />
                <span>تحميل صورة البطاقة 📸</span>
              </button>

              <button
                onClick={() => handleCopyShareText(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedShareText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShareText ? 'تم نسخ النص والرابط!' : 'نسخ نص المنشور 📋'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-amber-300/60 py-6 text-center text-xs text-slate-600 space-y-2 bg-white/60 mt-12">
        <p className="font-black text-slate-800">كنيسة السيدة العذراء مريم — محرم بك • الإسكندرية ⛪</p>
        <p className="text-[11px] text-slate-500 font-bold">منصة لوحة الشرف وأبطال مدارس الأحد الرقمية 🎈 © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
};

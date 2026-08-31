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
  ExternalLink, 
  Sparkles, 
  ChevronLeft, 
  Users, 
  Download, 
  Flame, 
  RefreshCw,
  X,
  MessageCircle
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
  { key: 'primary_boys', name: 'ابتدائي بنين', icon: '👦', description: 'الصف الأول حتى السادس الابتدائي (بنين)' },
  { key: 'primary_girls', name: 'ابتدائي بنات', icon: '👧', description: 'الصف الأول حتى السادس الابتدائي (بنات)' },
  { key: 'prep_boys', name: 'إعدادي بنين (فتيان)', icon: '👔', description: 'الصف الأول والثاني والثالث الإعدادي (بنين)' },
  { key: 'prep_girls', name: 'إعدادي بنات (فتيات)', icon: '🎀', description: 'الصف الأول والثاني والثالث الإعدادي (بنات)' },
  { key: 'secondary_boys', name: 'ثانوي بنين', icon: '🎓', description: 'المرحلة الثانوية للشباب' },
  { key: 'secondary_girls', name: 'ثانوي بنات', icon: '🌸', description: 'المرحلة الثانوية للشابات' },
  { key: 'nursery', name: 'حضانة (الملائكة)', icon: '🕊️', description: 'مرحلة الطفولة المبكرة والملائكة الأبرار' },
  { key: 'all', name: 'أبطال الكنيسة ككل', icon: '🌟', description: 'الترتيب العام على مستوى جميع خدمات الكنيسة' }
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

  // Canvas ref for image card generator
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch all students and dynamic points
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Silent login as reader if needed
      await publicReaderClient.auth.signInWithPassword({
        email: 'peter@stmary.church',
        password: 'peter@123'
      });

      // 2. Fetch families and members
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

        // Calculate points
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

  // Filter and sort students for the active service
  const filteredStudents = students
    .filter(s => activeServiceKey === 'all' || s.serviceKey === activeServiceKey)
    .filter(s => searchTerm.trim() === '' || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.points - a.points);

  const top1 = filteredStudents[0];
  const top2 = filteredStudents[1];
  const top3 = filteredStudents[2];
  const restStudents = filteredStudents.slice(3);

  const activeServiceObj = SERVICES_CONFIG.find(s => s.key === activeServiceKey) || SERVICES_CONFIG[0];

  // Copy shareable service link
  const handleCopyServiceLink = () => {
    const url = `${window.location.origin}/leaderboard?service=${activeServiceKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Generate celebratory share text
  const getShareText = (student: LeaderboardStudent, rank: number) => {
    const rankTitle = rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${rank} 🌟`;
    return `✝️ بطل مدارس الأحد 🏆\nأنا البطل: ${student.fullName}\nحصلت على ${student.points} نقطة في ${rankTitle} على ${student.serviceName} بكنيسة السيدة العذراء مريم بمحرم بك!\nشاركوني الفرحة وشوفوا لوحة الشرف كاملة هنا: ${window.location.origin}/leaderboard?service=${student.serviceKey}`;
  };

  // Share to Facebook
  const handleShareFacebook = (student: LeaderboardStudent, rank: number) => {
    const shareUrl = encodeURIComponent(`${window.location.origin}/leaderboard?service=${student.serviceKey}`);
    const text = encodeURIComponent(getShareText(student, rank));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${text}`, '_blank');
  };

  // Share to WhatsApp
  const handleShareWhatsApp = (student: LeaderboardStudent, rank: number) => {
    const text = encodeURIComponent(getShareText(student, rank));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Copy share text to clipboard
  const handleCopyShareText = (student: LeaderboardStudent, rank: number) => {
    navigator.clipboard.writeText(getShareText(student, rank));
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 3000);
  };

  // Generate and Download Canvas Image Badge
  const handleDownloadBadge = (student: LeaderboardStudent, rank: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
    gradient.addColorStop(0, '#00113a');
    gradient.addColorStop(0.5, '#002366');
    gradient.addColorStop(1, '#000d2b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);

    // Golden border
    ctx.strokeStyle = '#fed65b';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 940, 940);

    // Inner thin border
    ctx.strokeStyle = 'rgba(254, 214, 91, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(45, 45, 910, 910);

    // Header Church Name
    ctx.fillStyle = '#fed65b';
    ctx.font = 'bold 36px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('كنيسة السيدة العذراء مريم — محرم بك', 500, 120);

    // Cross Symbol
    ctx.font = 'bold 45px Tahoma, Arial, sans-serif';
    ctx.fillText('✝️', 500, 190);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px Tahoma, Arial, sans-serif';
    ctx.fillText('🌟 لوحة الشرف وأبطال مدارس الأحد 🏆', 500, 270);

    // Student Box
    ctx.fillStyle = 'rgba(254, 214, 91, 0.12)';
    ctx.strokeStyle = 'rgba(254, 214, 91, 0.6)';
    ctx.lineWidth = 4;
    ctx.roundRect(100, 320, 800, 480, 40);
    ctx.fill();
    ctx.stroke();

    // Student Name
    ctx.fillStyle = '#fed65b';
    ctx.font = '900 70px Tahoma, Arial, sans-serif';
    ctx.fillText(student.fullName, 500, 430);

    // Service Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Tahoma, Arial, sans-serif';
    ctx.fillText(student.serviceName, 500, 510);

    // Rank Pill
    const rankTitle = rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${rank} 🌟`;
    ctx.fillStyle = '#d4af37';
    ctx.roundRect(250, 560, 500, 85, 40);
    ctx.fill();
    ctx.fillStyle = '#00113a';
    ctx.font = '900 46px Tahoma, Arial, sans-serif';
    ctx.fillText(rankTitle, 500, 620);

    // Points
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Tahoma, Arial, sans-serif';
    ctx.fillText(`⭐️ ${student.points} نقطة تميز ⭐️`, 500, 730);

    // Encouraging Verse
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'italic 26px Tahoma, Arial, sans-serif';
    ctx.fillText('«كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ»', 500, 860);

    // Footer
    ctx.fillStyle = '#fed65b';
    ctx.font = 'bold 24px Tahoma, Arial, sans-serif';
    ctx.fillText('stmary.church • منصة مدارس الأحد الرقمية', 500, 920);

    // Download Image
    const link = document.createElement('a');
    link.download = `شهادة_شرف_${student.fullName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000d2b] via-[#00174a] to-[#002366] text-white font-cairo selection:bg-[#fed65b] selection:text-[#00123a] relative overflow-x-hidden" dir="rtl">
      
      {/* Decorative Starry Glows */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#fed65b]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#00113a]/80 border-b border-[#fed65b]/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] text-[#00123a] flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#fed65b] block">كنيسة السيدة العذراء مريم — محرم بك</span>
              <h1 className="font-tajawal text-base sm:text-lg font-black text-white leading-none">لوحة الشرف وأبطال مدارس الأحد</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyServiceLink}
              className="bg-[#fed65b] hover:bg-[#ffe58f] text-[#00174a] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/15 transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة رابط الخدمة'}</span>
              <span className="sm:hidden">{copiedLink ? 'تم!' : 'مشاركة'}</span>
            </button>

            <Link
              to="/servant/points"
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 hidden sm:flex items-center gap-1"
            >
              <span>تسجيل دخول الخدام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative z-10">
        
        {/* Festive Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-[#001442] via-[#002366] to-[#001442] border border-[#fed65b]/30 p-6 sm:p-10 text-center shadow-2xl overflow-hidden">
          <div className="absolute top-2 left-2 text-2xl opacity-20">✨</div>
          <div className="absolute bottom-2 right-2 text-2xl opacity-20">✝️</div>

          <div className="max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#fed65b]/15 text-[#fed65b] border border-[#fed65b]/30 text-xs font-black animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة التميز الكنسي المباشرة</span>
            </span>

            <h2 className="font-tajawal text-3xl sm:text-4xl lg:text-5xl font-black text-[#fed65b] tracking-wide">
              أبطال {activeServiceObj.name} 🏆
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
              {activeServiceObj.description} • يتم تحديث الترتيب والنقاط تلقائياً وفورياً مع كل نشاط وحضور.
            </p>

            <p className="text-[11px] text-amber-200/80 italic font-serif">
              « كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ كُلَّ حِينٍ » (1 كو 15: 58)
            </p>
          </div>
        </section>

        {/* Services Tabs Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-[#fed65b] flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>اختر خدمة مدارس الأحد:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-bold">
              {filteredStudents.length} بطل مسجل
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#fed65b]/30">
            {SERVICES_CONFIG.map(svc => {
              const isActive = activeServiceKey === svc.key;
              const count = students.filter(s => svc.key === 'all' || s.serviceKey === svc.key).length;
              return (
                <button
                  key={svc.key}
                  onClick={() => setSearchParams({ service: svc.key })}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all flex items-center gap-2 shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-[#001a4d]/80 hover:bg-[#002366] text-slate-300 border border-white/10 hover:border-[#fed65b]/40'
                  }`}
                >
                  <span className="text-sm">{svc.icon}</span>
                  <span>{svc.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#00174a] text-[#fed65b]' : 'bg-white/10 text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search Input Bar */}
        <section className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم المخدوم في لوحة الشرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#001442]/90 border border-white/15 focus:border-[#fed65b] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none shadow-inner transition-colors"
          />
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#fed65b] border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-amber-500/20"></div>
            <p className="font-tajawal text-sm font-bold text-slate-300">جاري تحميل لوحة الشرف وأبطال الخدمة...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-[#001442]/60 rounded-3xl border border-white/10 p-12 text-center space-y-3">
            <Trophy className="w-16 h-16 text-slate-500 mx-auto opacity-40" />
            <h3 className="font-tajawal text-lg font-bold text-white">لا توجد نقاط مسجلة لهذه الخدمة بعد</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              سيظهر الأبطال فور قيام خدام المرحلة بتسجيل ومنح النقاط للمخدومين من شاشة نقاط مدارس الأحد.
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Section */}
            <section className="pt-8 pb-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto">
                
                {/* #2 Silver (Right in RTL, Left in LTR) */}
                {top2 ? (
                  <div className="flex flex-col items-center space-y-2 order-1 group">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border-4 border-slate-300 shadow-xl flex items-center justify-center font-black text-2xl group-hover:scale-105 transition-transform">
                        🥈
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-900 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border border-white shadow">
                        #2
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-1">{top2.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{top2.grade}</p>
                      <span className="inline-block bg-slate-400/20 text-slate-200 px-2.5 py-0.5 rounded-full text-xs font-black border border-slate-400/30 mt-1">
                        ⭐ {top2.points}
                      </span>
                    </div>

                    {/* Pedestal Bar */}
                    <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-slate-300/30 to-slate-400/10 border-t-4 border-slate-300 flex flex-col items-center justify-between p-2 shadow-lg">
                      <span className="text-slate-300 font-black text-lg sm:text-2xl">2</span>
                      <button
                        onClick={() => setSharingStudent({ student: top2, rank: 2 })}
                        className="w-full py-1.5 bg-slate-300/20 hover:bg-slate-300/30 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all active:scale-95"
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
                  <div className="flex flex-col items-center space-y-2 order-2 group -mt-6">
                    <div className="relative">
                      {/* Floating Crown */}
                      <Crown className="w-8 h-8 text-[#fed65b] animate-bounce mx-auto mb-1 filter drop-shadow-[0_2px_8px_rgba(254,214,91,0.6)]" />
                      <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-[#fed65b] via-[#d4af37] to-[#b38f20] text-[#00174a] border-4 border-[#fed65b] shadow-2xl flex items-center justify-center font-black text-3xl group-hover:scale-105 transition-transform animate-pulse">
                        🥇
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-[#fed65b] text-[#00174a] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        #1
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-sm sm:text-base text-[#fed65b] line-clamp-1">{top1.fullName}</h4>
                      <p className="text-[11px] text-amber-200/80 font-bold">{top1.grade}</p>
                      <span className="inline-block bg-[#fed65b]/20 text-[#fed65b] px-3 py-1 rounded-full text-xs sm:text-sm font-black border border-[#fed65b]/40 mt-1 shadow-md shadow-amber-500/20">
                        ⭐️ {top1.points} نقطة
                      </span>
                    </div>

                    {/* Pedestal Bar */}
                    <div className="w-full h-40 sm:h-48 rounded-t-3xl bg-gradient-to-b from-[#fed65b]/40 via-[#d4af37]/20 to-transparent border-t-4 border-[#fed65b] flex flex-col items-center justify-between p-3 shadow-2xl shadow-amber-500/20">
                      <div className="text-center">
                        <span className="text-[#fed65b] font-black text-2xl sm:text-3xl block">1</span>
                        <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">بطل الخدمة</span>
                      </div>
                      <button
                        onClick={() => setSharingStudent({ student: top1, rank: 1 })}
                        className="w-full py-2 bg-[#fed65b] hover:bg-[#ffe58f] text-[#00174a] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة الإنجاز 🚀</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* #3 Bronze (Left in RTL, Right in LTR) */}
                {top3 ? (
                  <div className="flex flex-col items-center space-y-2 order-3 group">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white border-4 border-amber-500 shadow-xl flex items-center justify-center font-black text-2xl group-hover:scale-105 transition-transform">
                        🥉
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-700 text-amber-100 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border border-white shadow">
                        #3
                      </span>
                    </div>

                    <div className="text-center space-y-0.5">
                      <h4 className="font-black text-xs sm:text-sm text-white line-clamp-1">{top3.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{top3.grade}</p>
                      <span className="inline-block bg-amber-700/20 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black border border-amber-700/30 mt-1">
                        ⭐ {top3.points}
                      </span>
                    </div>

                    {/* Pedestal Bar */}
                    <div className="w-full h-24 sm:h-30 rounded-t-2xl bg-gradient-to-b from-amber-700/30 to-amber-800/10 border-t-4 border-amber-600 flex flex-col items-center justify-between p-2 shadow-lg">
                      <span className="text-amber-400 font-black text-lg sm:text-2xl">3</span>
                      <button
                        onClick={() => setSharingStudent({ student: top3, rank: 3 })}
                        className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all active:scale-95"
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

            {/* Complete Ranked List */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-tajawal text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#fed65b]" />
                  <span>باقي أبطال ومخدومي الخدمة</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  ترتيب تنازلي حسب النقاط
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStudents.map((s, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-[#fed65b]/20 to-transparent border-[#fed65b]/50 shadow-md'
                          : rank === 2
                          ? 'bg-gradient-to-r from-slate-300/15 to-transparent border-slate-300/40'
                          : rank === 3
                          ? 'bg-gradient-to-r from-amber-700/15 to-transparent border-amber-600/40'
                          : 'bg-[#001442]/60 hover:bg-[#00174a] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Rank & Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                          rank === 1
                            ? 'bg-[#fed65b] text-[#00174a]'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : rank === 3
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-white/10 text-slate-300'
                        }`}>
                          #{rank}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-white truncate">{s.fullName}</h4>
                          <p className="text-[11px] text-slate-400 font-bold truncate">
                            {s.familyName} {s.grade ? `• ${s.grade}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Points & Share Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1.5 rounded-xl bg-white/10 text-[#fed65b] font-black text-xs sm:text-sm border border-[#fed65b]/20">
                          ⭐️ {s.points}
                        </span>

                        <button
                          onClick={() => setSharingStudent({ student: s, rank })}
                          className="p-2 rounded-xl bg-[#fed65b]/10 hover:bg-[#fed65b] text-[#fed65b] hover:text-[#00174a] transition-colors"
                          title="مشاركة الإنجاز على فيسبوك وواتساب"
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

      {/* Share Achievement Modal */}
      {sharingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-[#00174a] border-2 border-[#fed65b] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-center animate-scale-in">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSharingStudent(null)}
              className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-[#fed65b]/20 text-[#fed65b] text-[10px] font-black">
                بطاقة تكريم ومشاركة البطل 🚀
              </span>
              <h3 className="font-tajawal text-xl font-black text-white">
                شارك إنجازك مع أصحابك وعيلتك!
              </h3>
            </div>

            {/* Visual Celebration Card (Preview of what will be shared) */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#00113a] via-[#002366] to-[#00113a] border border-[#fed65b]/50 shadow-inner space-y-3 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fed65b]/15 rounded-full blur-xl"></div>
              
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#fed65b] to-[#d4af37] text-[#00174a] flex items-center justify-center text-2xl shadow-lg">
                🏆
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-amber-200 font-bold block">كنيسة السيدة العذراء مريم بمحرم بك</span>
                <h4 className="font-tajawal text-2xl font-black text-[#fed65b]">
                  {sharingStudent.student.fullName}
                </h4>
                <p className="text-xs text-slate-300 font-bold">
                  {sharingStudent.student.serviceName}
                </p>
              </div>

              {/* Rank & Points Pill */}
              <div className="inline-flex items-center gap-3 bg-[#fed65b] text-[#00174a] px-5 py-2 rounded-2xl font-black text-sm shadow-md">
                <span>
                  {sharingStudent.rank === 1 ? 'المركز الأول 🥇' : sharingStudent.rank === 2 ? 'المركز الثاني 🥈' : sharingStudent.rank === 3 ? 'المركز الثالث 🥉' : `المركز رقم #${sharingStudent.rank}`}
                </span>
                <span>•</span>
                <span>{sharingStudent.student.points} نقطة تميز ⭐️</span>
              </div>

              <p className="text-[10px] text-slate-400 italic pt-1">
                « مَنِ اعْتَرَفَ بِي قُدَّامَ النَّاسِ أَعْتَرِفُ أَنَا أَيْضًا بِهِ قُدَّامَ أَبِي الَّذِي فِي السَّمَاوَاتِ »
              </p>
            </div>

            {/* Share Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handleShareFacebook(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>مشاركة على فيسبوك 🟦</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>مشاركة على واتساب 🟩</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDownloadBadge(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-[#00174a]" />
                <span>تحميل صورة البطاقة 📸</span>
              </button>

              <button
                onClick={() => handleCopyShareText(sharingStudent.student, sharingStudent.rank)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all"
              >
                {copiedShareText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShareText ? 'تم نسخ النص والرابط!' : 'نسخ نص المنشور 📋'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#fed65b]/20 py-6 text-center text-xs text-slate-400 space-y-2">
        <p className="font-bold">كنيسة السيدة العذراء مريم — محرم بك • الإسكندرية ⛪</p>
        <p className="text-[11px] text-slate-500">نظام لوحة الشرف وأبطال مدارس الأحد الرقمي © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
};

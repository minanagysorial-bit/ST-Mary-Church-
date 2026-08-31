import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api } from '../../lib/api';
import type { Member } from '../../lib/database.types';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { StudentIdCardModal } from '../../components/sunday-school/StudentIdCardModal';
import {
  Award,
  Sparkles,
  Search,
  Plus,
  QrCode,
  Trophy,
  Gift,
  CheckCircle2,
  Filter,
  UserCheck,
  BookOpen,
  Church,
  Smile,
  Zap,
  ShoppingBag,
  History,
  TrendingUp,
  X
} from 'lucide-react';

interface GiftItem {
  id: string;
  name: string;
  pointsCost: number;
  icon: string;
  category: string;
  inStock: boolean;
}

const DEFAULT_GIFTS: GiftItem[] = [
  { id: 'g1', name: 'كتاب مقدس مصور للأطفال', pointsCost: 150, icon: '📖', category: 'كتب وكتيبات', inStock: true },
  { id: 'g2', name: 'صليب خشب زيتون للرقبة', pointsCost: 80, icon: '✝️', category: 'بركات كنسية', inStock: true },
  { id: 'g3', name: 'كشكول وقلم بشعار الكنيسة', pointsCost: 50, icon: '✏️', category: 'أدوات مدرسية', inStock: true },
  { id: 'g4', name: 'ميدالية وأيقونة السيدة العذراء', pointsCost: 40, icon: '👑', category: 'بركات كنسية', inStock: true },
  { id: 'g5', name: 'لعبة بازل قبطية (سفينة نوح)', pointsCost: 120, icon: '🧩', category: 'ألعاب تعليمية', inStock: true },
  { id: 'g6', name: 'شهادة تقدير + درع بطل الفصل', pointsCost: 200, icon: '🏆', category: 'تكريم خاص', inStock: true }
];

export const SundaySchoolPointsPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  const [students, setStudents] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('الكل');
  const [activeTab, setActiveTab] = useState<'students' | 'leaderboard' | 'store' | 'scanner'>('students');

  // Points State (Stored in LocalStorage & Synced)
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Member | null>(null);

  // Custom Points Modal
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Member | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [pointsReason, setPointsReason] = useState<string>('حضور القداس الإلهي');
  const [isDeduction, setIsDeduction] = useState<boolean>(false);

  // Scanner manual code
  const [scannerCode, setScannerCode] = useState('');

  // Initial Load
  useEffect(() => {
    fetchStudents();
    loadPoints();
  }, [profile]);

  const loadPoints = () => {
    try {
      const saved = localStorage.getItem('sunday_school_points_map');
      if (saved) {
        setPointsMap(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const savePoints = (updated: Record<string, number>) => {
    setPointsMap(updated);
    localStorage.setItem('sunday_school_points_map', JSON.stringify(updated));
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sunday School families
      const allFamilies = await api.getFamilies('sunday_school');
      
      let targetFamilies = allFamilies;
      if (profile?.role === 'servant') {
        try {
          const relations = await api.getFamilyServantsForAll();
          const myFamilyIds = relations.filter(r => r.servant_id === profile.id).map(r => r.family_id);
          const myFamilies = allFamilies.filter(f => myFamilyIds.includes(f.id) || f.assigned_servant_id === profile.id);
          if (myFamilies.length > 0) {
            targetFamilies = myFamilies;
          }
        } catch (e) {
          console.warn('Could not filter servant families:', e);
        }
      }

      // 2. Load members of families
      const membersPromises = targetFamilies.map(f => api.getFamilyMembers(f.id));
      const membersResults = await Promise.all(membersPromises);
      const allMembers = membersResults.flat();

      let studentList: Member[] = [];

      if (allMembers.length > 0) {
        studentList = allMembers.map(fm => {
          const fam = allFamilies.find(f => f.id === fm.family_id);
          const stage = fam?.stage || fam?.area || fm.sunday_school_stage || 'ابتدائي';
          return {
            id: fm.id,
            full_name: fm.full_name,
            national_id: '',
            phone: fm.phone || '',
            service: stage,
            registration_date: fm.created_at || new Date().toISOString(),
            father_of_confession: 'كنيسة السيدة العذراء مريم',
            spiritual_status: 'منتظم',
            attendance_status: 'حاضر',
            points: 0,
            qr_code: fm.id
          } as unknown as Member;
        });
      } else {
        // Fallback to Sunday school members table
        studentList = await api.getSundaySchoolStudents();
      }

      setStudents(studentList);

      // Initialize default points if not set
      const saved = localStorage.getItem('sunday_school_points_map');
      const existing: Record<string, number> = saved ? JSON.parse(saved) : {};
      let changed = false;

      studentList.forEach((s, idx) => {
        if (existing[s.id] === undefined) {
          existing[s.id] = (idx % 5 + 1) * 20 + 20;
          changed = true;
        }
      });

      if (changed) {
        savePoints(existing);
      }
    } catch (err: any) {
      toast.error('حدث خطأ في تحميل المخدومين: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Points directly
  const handleQuickAddPoints = (student: Member, amount: number, reason: string) => {
    const current = pointsMap[student.id] || 0;
    const next = Math.max(0, current + amount);
    const updated = { ...pointsMap, [student.id]: next };
    savePoints(updated);
    toast.success(`تمت إضافة ${amount} نقطة لـ ${student.full_name} (${reason}) 🌟`);
  };

  // Submit custom points modal
  const handleApplyCustomPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    const current = pointsMap[targetStudent.id] || 0;
    const delta = isDeduction ? -Math.abs(pointsAmount) : Math.abs(pointsAmount);
    const next = Math.max(0, current + delta);

    const updated = { ...pointsMap, [targetStudent.id]: next };
    savePoints(updated);

    if (isDeduction) {
      toast.success(`تم خصم ${pointsAmount} نقطة من ${targetStudent.full_name} (${pointsReason})`);
    } else {
      toast.success(`تم منح ${pointsAmount} نقطة لـ ${targetStudent.full_name} (${pointsReason}) 🌟`);
    }

    setShowPointsModal(false);
  };

  // Redeem Gift
  const handleRedeemGift = (gift: GiftItem, student: Member) => {
    const current = pointsMap[student.id] || 0;
    if (current < gift.pointsCost) {
      toast.error(`رصيد ${student.full_name} (${current} نقطة) لا يكفي لاستبدال ${gift.name} (${gift.pointsCost} نقطة).`);
      return;
    }

    if (!window.confirm(`هل أنت متأكد من استبدال "${gift.name}" للمخدوم "${student.full_name}" مقابل ${gift.pointsCost} نقطة؟`)) return;

    const next = current - gift.pointsCost;
    const updated = { ...pointsMap, [student.id]: next };
    savePoints(updated);
    toast.success(`مبروك! تم استبدال ${gift.name} لـ ${student.full_name} بنجاح 🎉`);
  };

  // Quick Scanner Submission
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerCode.trim()) return;

    let searchId = scannerCode.trim();
    // In case QR contains JSON
    try {
      if (searchId.startsWith('{')) {
        const parsed = JSON.parse(searchId);
        if (parsed.id) searchId = parsed.id;
      }
    } catch {}

    const found = students.find(s => s.id === searchId || s.id.startsWith(searchId) || s.phone === searchId);
    if (found) {
      handleQuickAddPoints(found, 20, 'حضور القداس ومسح الباركود');
      setScannerCode('');
    } else {
      toast.error('لم يتم العثور على مخدوم بهذا الكود أو الرقم.');
    }
  };

  // Filter students
  const availableStages = Array.from(new Set(students.map(s => s.service).filter(Boolean)));

  const filteredStudents = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.phone && s.phone.includes(searchTerm));
    const matchStage = selectedStage === 'الكل' || s.service === selectedStage || (s.service && s.service.includes(selectedStage));
    return matchSearch && matchStage;
  });

  // Sort for leaderboard
  const sortedStudents = [...students].sort((a, b) => {
    const ptsA = pointsMap[a.id] || 0;
    const ptsB = pointsMap[b.id] || 0;
    return ptsB - ptsA;
  });

  // Calculate stats
  const totalPointsAwarded = Object.values(pointsMap).reduce((a, b) => a + b, 0);
  const activeStudentsCount = students.length;
  const topStudent = sortedStudents[0];

  return (
    <DashboardLayout role="servant">
      <div className="space-y-6 text-right font-cairo" dir="rtl">
        
        {/* Top Header & Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-bold">إجمالي مخدومي الفصل</p>
              <p className="text-2xl font-extrabold text-[#fed65b] mt-1">{activeStudentsCount} مخدوم</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center text-[#fed65b]">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-bold">إجمالي النقاط الممنوحة</p>
              <p className="text-2xl font-extrabold text-[#fed65b] mt-1">⭐️ {totalPointsAwarded}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#fed65b]/20 flex items-center justify-center text-[#fed65b]">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-bold">المتصدر الحالي 🏆</p>
              <p className="text-base font-extrabold text-white truncate max-w-[150px] mt-1">
                {topStudent ? topStudent.full_name : '—'}
              </p>
              <p className="text-[11px] text-[#fed65b] font-bold">
                {topStudent ? `${pointsMap[topStudent.id] || 0} نقطة` : ''}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#002366] to-[#00174a] text-white p-5 rounded-3xl border border-[#d4af37]/40 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-bold">جوائز المتجر المتاحة</p>
              <p className="text-2xl font-extrabold text-[#fed65b] mt-1">{DEFAULT_GIFTS.length} جوائز</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'students'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-[#fed65b]" />
            <span>سجل المخدومين والنقاط</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#fed65b]" />
            <span>لوحة الشرف والمتصدرين 🏆</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'store'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#fed65b]" />
            <span>متجر جوائز مدارس الأحد 🎁</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scanner'
                ? 'bg-[#002366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#fed65b]" />
            <span>ماسح الباركود السريع 📲</span>
          </button>
        </div>

        {/* ── TAB 1: STUDENTS LIST & QUICK POINTS ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم المخدوم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#002366]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#002366]"
                >
                  <option value="الكل">كل المراحل</option>
                  {availableStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table / Cards */}
            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">جاري تحميل سجل المخدومين...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                <Award className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">لا يوجد مخدومين يطابقون البحث</p>
                <p className="text-xs text-slate-400">يمكنك إضافة مخدومين جدد من لوحة تحكم الخادم الرئيسية.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const pts = pointsMap[student.id] || 0;
                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#d4af37]/60 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      {/* Top Student Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="bg-[#002366]/10 text-[#002366] text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            {student.service || 'مدارس الأحد'}
                          </span>
                          <h3 className="font-extrabold text-base text-slate-800 leading-tight">
                            {student.full_name}
                          </h3>
                          {student.phone && (
                            <p className="text-xs text-slate-400 font-mono">{student.phone}</p>
                          )}
                        </div>

                        {/* Points Pill */}
                        <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-center shrink-0">
                          <p className="text-[10px] text-amber-800 font-bold">الرصيد</p>
                          <p className="text-base font-extrabold text-amber-600">⭐️ {pts}</p>
                        </div>
                      </div>

                      {/* Quick Points Awarding Buttons */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-500">⚡ إضافة نقاط سريعة:</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <button
                            onClick={() => handleQuickAddPoints(student, 20, 'قداس')}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <span>⛪ قداس</span>
                            <span className="text-[10px] bg-blue-200 text-blue-900 px-1 rounded">+20</span>
                          </button>
                          <button
                            onClick={() => handleQuickAddPoints(student, 15, 'حفظ آية')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <span>📖 آية</span>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded">+15</span>
                          </button>
                          <button
                            onClick={() => handleQuickAddPoints(student, 10, 'حضور فصل')}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <span>🎒 حضور</span>
                            <span className="text-[10px] bg-purple-200 text-purple-900 px-1 rounded">+10</span>
                          </button>
                          <button
                            onClick={() => handleQuickAddPoints(student, 10, 'سلوك مميز')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <span>🌟 سلوك</span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded">+10</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedStudentForCard(student)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#002366]" />
                          <span>عرض بطاقة QR</span>
                        </button>
                        <button
                          onClick={() => {
                            setTargetStudent(student);
                            setIsDeduction(false);
                            setPointsAmount(10);
                            setShowPointsModal(true);
                          }}
                          className="bg-[#002366] hover:bg-[#00174a] text-white p-2 rounded-xl font-bold text-xs transition-colors"
                          title="تعديل مخصص للنقاط"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: LEADERBOARD ── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            
            {/* Top 3 Podium Card */}
            {sortedStudents.length >= 3 && (
              <div className="bg-gradient-to-br from-[#00174a] via-[#002366] to-[#0b1026] rounded-3xl p-6 border-2 border-[#d4af37]/60 text-white shadow-xl relative overflow-hidden">
                <div className="text-center space-y-1 mb-8">
                  <span className="bg-[#d4af37]/20 text-[#fed65b] text-xs font-bold px-3 py-1 rounded-full border border-[#d4af37]/40">
                    أبطال مدارس الأحد لهذا الشهر 🌟
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">لوحة الشرف والتكريم 🏆</h2>
                </div>

                <div className="grid grid-cols-3 gap-3 items-end max-w-lg mx-auto text-center">
                  
                  {/* Rank 2 (Silver) */}
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-800 font-black text-lg flex items-center justify-center mx-auto shadow-md border-2 border-white">
                      2
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 border border-slate-300/30">
                      <p className="text-xs font-bold text-white truncate">{sortedStudents[1]?.full_name}</p>
                      <p className="text-xs font-extrabold text-slate-300 mt-1">⭐️ {pointsMap[sortedStudents[1]?.id] || 0}</p>
                    </div>
                  </div>

                  {/* Rank 1 (Gold) */}
                  <div className="space-y-2 -translate-y-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fed65b] to-[#d4af37] text-[#00174a] font-black text-2xl flex items-center justify-center mx-auto shadow-xl border-2 border-white animate-bounce">
                      👑
                    </div>
                    <div className="bg-[#fed65b]/20 rounded-2xl p-4 border-2 border-[#fed65b] shadow-lg">
                      <p className="text-sm font-extrabold text-[#fed65b] truncate">{sortedStudents[0]?.full_name}</p>
                      <p className="text-sm font-black text-white mt-1">⭐️ {pointsMap[sortedStudents[0]?.id] || 0}</p>
                    </div>
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-700 text-amber-100 font-black text-lg flex items-center justify-center mx-auto shadow-md border-2 border-amber-500">
                      3
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 border border-amber-700/30">
                      <p className="text-xs font-bold text-white truncate">{sortedStudents[2]?.full_name}</p>
                      <p className="text-xs font-extrabold text-amber-400 mt-1">⭐️ {pointsMap[sortedStudents[2]?.id] || 0}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Complete Ranking List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#00174a]">ترتيب جميع مخدومي مدارس الأحد</h3>
                <span className="text-xs text-slate-500 font-bold">{sortedStudents.length} مخدوم</span>
              </div>

              <div className="divide-y divide-slate-100">
                {sortedStudents.map((student, rank) => {
                  const pts = pointsMap[student.id] || 0;
                  return (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                          rank === 0 ? 'bg-[#fed65b] text-[#00174a] font-extrabold' :
                          rank === 1 ? 'bg-slate-200 text-slate-800' :
                          rank === 2 ? 'bg-amber-100 text-amber-900' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {rank + 1}
                        </span>
                        <div>
                          <p className="font-extrabold text-sm text-slate-800">{student.full_name}</p>
                          <span className="text-[11px] text-slate-400 font-semibold">{student.service || 'مدارس الأحد'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-black">
                          ⭐️ {pts} نقطة
                        </span>
                        <button
                          onClick={() => setSelectedStudentForCard(student)}
                          className="p-2 text-slate-400 hover:text-[#002366] hover:bg-slate-100 rounded-lg transition-colors"
                          title="عرض البطاقة"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: GIFTS STORE ── */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#002366] to-[#00174a] text-white p-6 rounded-3xl border border-[#d4af37]/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <span className="bg-[#fed65b] text-[#00174a] text-[10px] font-extrabold px-3 py-0.5 rounded-full">
                  متجر الجوائز والتشجيع
                </span>
                <h2 className="text-xl font-extrabold text-white">استبدال النقاط بجوائز كنسية 🎁</h2>
                <p className="text-xs text-slate-300">
                  يمكن للطفل اختيار الجائزة عند وصول رصيد نقاطه للحد المطلوب، ويقوم الخادم بالاستبدال وتوثيق التسليم.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[#fed65b] text-[#00174a] flex items-center justify-center shrink-0 shadow-lg">
                <Gift className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_GIFTS.map((gift) => (
                <div
                  key={gift.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-3xl flex items-center justify-center shrink-0 shadow-inner">
                      {gift.icon}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {gift.category}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-800">{gift.name}</h3>
                      <p className="text-xs font-black text-amber-600">⭐️ {gift.pointsCost} نقطة</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500">اختر مخدوماً للاستبدال:</label>
                    <select
                      id={`select-student-${gift.id}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#002366]"
                    >
                      <option value="">-- اختر المخدوم --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({pointsMap[s.id] || 0} نقطة)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        const selectEl = document.getElementById(`select-student-${gift.id}`) as HTMLSelectElement;
                        const studentId = selectEl?.value;
                        if (!studentId) {
                          toast.error('يرجى اختيار المخدوم أولاً');
                          return;
                        }
                        const st = students.find(s => s.id === studentId);
                        if (st) handleRedeemGift(gift, st);
                      }}
                      className="w-full bg-[#002366] hover:bg-[#00174a] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                      <span>تسليم واستبدال الجائزة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: QR FAST SCANNER ── */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-[#002366] text-[#fed65b] flex items-center justify-center mx-auto shadow-lg">
                <QrCode className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#00174a]">ماسح الحضور بالباركود 📲</h2>
                <p className="text-xs text-slate-500">
                  وجه كاميرا قارئ الباركود على بطاقة المخدوم أو الصق الكود لمنح نقاط الحضور (+20 نقطة) فورياً.
                </p>
              </div>

              <form onSubmit={handleScanSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="أدخل كود الـ QR أو رقم تليفون المخدوم..."
                  value={scannerCode}
                  onChange={(e) => setScannerCode(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#002366] rounded-2xl p-4 text-center font-mono font-bold text-base text-slate-800 focus:outline-none shadow-inner"
                />

                <button
                  type="submit"
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4 text-[#fed65b]" />
                  <span>تسجيل الحضور ومنح النقاط (+20)</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Student ID Badge Modal */}
      {selectedStudentForCard && (
        <StudentIdCardModal
          student={selectedStudentForCard}
          points={pointsMap[selectedStudentForCard.id] || 0}
          isOpen={true}
          onClose={() => setSelectedStudentForCard(null)}
        />
      )}

      {/* Custom Points Modal */}
      {showPointsModal && targetStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-cairo" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#00174a]">تعديل النقاط</h3>
                <p className="text-xs text-slate-500 font-bold">{targetStudent.full_name}</p>
              </div>
              <button onClick={() => setShowPointsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomPoints} className="space-y-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsDeduction(false)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    !isDeduction ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  ➕ إضافة نقاط
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeduction(true)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    isDeduction ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  ➖ خصم نقاط
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عدد النقاط:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">السبب / المناسبة:</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002366]"
                  placeholder="مثال: تفوق في مسابقة الكتاب المقدس"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Users, 
  Award, 
  CalendarCheck, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Trophy, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  UserCheck, 
  FileSpreadsheet, 
  MessageSquare, 
  Phone, 
  ChevronDown, 
  Crown,
  History,
  ShieldCheck,
  Save,
  Layers
} from 'lucide-react';
import { 
  api, 
  type Profile, 
  type Family, 
  type ServantAttendanceRecord, 
  type ServantPointTransaction, 
  type UserRole,
  type ChurchServiceCategory
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ALL_CHURCH_SERVICE_CATEGORIES, getLeaderAssignedServices } from '../../lib/servicesAssignmentHelper';

const PRESET_POINT_REASONS = [
  { reason: 'حضور مبكر وتجهيز الفصل ووسائل الإيضاح', points: 10, isDeduction: false },
  { reason: 'تحضير وتقديم درس متميز وتفاعلي', points: 15, isDeduction: false },
  { reason: 'افتقاد وزيارة ومتابعة حالات المخدومين', points: 20, isDeduction: false },
  { reason: 'المشاركة في خدمة القداس الإلهي والتناول', points: 15, isDeduction: false },
  { reason: 'حضور اجتماع الخدام والدراسة الأسبوعية', points: 10, isDeduction: false },
  { reason: 'تنظيم نشاط أو مسابقة أو يوم روحي', points: 25, isDeduction: false },
  { reason: 'تأخير عن موعد بدء الخدمة بدون إذن', points: -5, isDeduction: true },
  { reason: 'غياب عن الخدمة بدون عذر مسبق', points: -10, isDeduction: true }
];

export const ServantsAttendancePointsPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'attendance' | 'points' | 'history'>('attendance');
  const [servants, setServants] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Attendance Date
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');

  // Daily attendance state: Record<servantId, { status, notes }>
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, {
    status: 'present_early' | 'present' | 'late' | 'excused' | 'absent';
    notes: string;
  }>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Points Map & History
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<ServantPointTransaction[]>([]);

  // Points Modal State
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [targetServant, setTargetServant] = useState<Profile | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(10);
  const [pointsReason, setPointsReason] = useState<string>('حضور مبكر وتجهيز الفصل ووسائل الإيضاح');
  const [isDeduction, setIsDeduction] = useState(false);
  const [savingPoint, setSavingPoint] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesList, familiesList, settings, attendanceRecords, points, txs, allFamilyServants] = await Promise.all([
        api.getProfiles(),
        api.getFamilies('sunday_school').catch(() => [] as Family[]),
        api.getSiteSettings().catch(() => ({})),
        api.getServantAttendanceRecords(),
        api.getServantsPoints(),
        api.getServantPointTransactions(),
        api.getFamilyServantsForAll().catch(() => [])
      ]);

      const relMap: Record<string, string[]> = {};
      (allFamilyServants || []).forEach((fs: any) => {
        if (!relMap[fs.family_id]) relMap[fs.family_id] = [];
        relMap[fs.family_id].push(fs.servant_id);
      });

      setSiteSettings(settings);
      setFamilies(familiesList);
      setPointsMap(points);
      setTransactions(txs);
      setAllProfiles(profilesList);
      setFamilyServantsMap(relMap);

      const isGlobalAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'priest';

      // 1. Determine assigned service categories for current leader
      let leaderAssignedCategories: ChurchServiceCategory[] = [];
      if (isGlobalAdmin) {
        leaderAssignedCategories = ALL_CHURCH_SERVICE_CATEGORIES.map(c => c.category);
      } else if (profile?.id) {
        leaderAssignedCategories = getLeaderAssignedServices(profile.id, settings);
        const pService = (profile as any)?.service;
        if (pService) {
          const matchCat = ALL_CHURCH_SERVICE_CATEGORIES.find(c => pService.includes(c.category));
          if (matchCat && !leaderAssignedCategories.includes(matchCat.category)) {
            leaderAssignedCategories.push(matchCat.category);
          }
        }
      }

      // 2. Find Sunday School families belonging to these categories
      const matchingFamilies = familiesList.filter(f => {
        if (isGlobalAdmin) return true;
        if (leaderAssignedCategories.length === 0) return true;
        return leaderAssignedCategories.some(cat => 
          (f.stage && f.stage.includes(cat)) || 
          (f.area && f.area.includes(cat)) || 
          (f.notes && f.notes.includes(cat)) ||
          (f.head_name && f.head_name.includes(cat))
        );
      });

      // 3. Collect servant IDs belonging to leader's families
      const servantIdsInMyServices = new Set<string>();
      matchingFamilies.forEach(f => {
        if (f.assigned_servant_id) servantIdsInMyServices.add(f.assigned_servant_id);
        const assignedList = relMap[f.id] || [];
        assignedList.forEach((id: string) => servantIdsInMyServices.add(id));
      });

      // 4. Filter active servants strictly
      const activeServants = profilesList.filter(p => {
        if (p.role !== 'servant' && p.role !== 'service_leader' && p.role !== 'admin') return false;
        if (isGlobalAdmin) return true;
        
        const servantService = (p as any)?.service || '';

        // Match by assigned class / family
        if (servantIdsInMyServices.has(p.id)) return true;
        
        // Match by servant profile service category
        if (leaderAssignedCategories.some(cat => servantService.includes(cat))) return true;

        // Service leader themselves
        if (p.id === profile?.id) return true;

        // If no explicit category was found, fallback to matching servant service with leader service
        const pLeaderService = (profile as any)?.service || '';
        if (leaderAssignedCategories.length === 0 && pLeaderService && servantService === pLeaderService) {
          return true;
        }

        return false;
      });

      setServants(activeServants);

      // Build daily attendance from records for selected date
      const attendanceState: Record<string, { status: any; notes: string }> = {};
      activeServants.forEach(s => {
        const found = attendanceRecords.find(r => r.servant_id === s.id && r.date === selectedDate);
        if (found) {
          attendanceState[s.id] = { status: found.status, notes: found.notes || '' };
        } else {
          attendanceState[s.id] = { status: 'present', notes: '' };
        }
      });
      setDailyAttendance(attendanceState);
    } catch (err) {
      console.error('Failed to load servants attendance and points:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status Change for Servant Attendance
  const handleSetStatus = (servantId: string, status: 'present_early' | 'present' | 'late' | 'excused' | 'absent') => {
    setDailyAttendance(prev => ({
      ...prev,
      [servantId]: {
        ...(prev[servantId] || { notes: '' }),
        status
      }
    }));
  };

  const handleSetNotes = (servantId: string, notes: string) => {
    setDailyAttendance(prev => ({
      ...prev,
      [servantId]: {
        ...(prev[servantId] || { status: 'present' }),
        notes
      }
    }));
  };

  // Mark all servants present
  const handleMarkAllPresent = () => {
    setDailyAttendance(prev => {
      const updated = { ...prev };
      servants.forEach(s => {
        updated[s.id] = { ...(updated[s.id] || { notes: '' }), status: 'present' };
      });
      return updated;
    });
    toast.success('تم تحديد جميع الخدام: حاضر ✅');
  };

  // Save Attendance & Auto Award/Deduct Points
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const recordsToSave: ServantAttendanceRecord[] = Object.entries(dailyAttendance).map(([sId, data]) => {
        const servant = servants.find(s => s.id === sId);
        return {
          id: `${sId}_${selectedDate}`,
          servant_id: sId,
          servant_name: servant?.full_name || 'خادم',
          service_name: (servant as any)?.service || 'تربية كنسية',
          date: selectedDate,
          status: data.status,
          notes: data.notes,
          updated_at: new Date().toISOString()
        };
      });

      await api.saveServantAttendanceRecords(recordsToSave);

      // Auto Award Points for early / late / present
      for (const rec of recordsToSave) {
        if (rec.status === 'present_early') {
          await api.addServantPointTransaction({
            id: 'tx_' + Date.now() + Math.random(),
            servant_id: rec.servant_id,
            servant_name: rec.servant_name,
            points: 10,
            reason: `حضور مبكر للخدمة بتاريخ ${selectedDate}`,
            date: selectedDate,
            created_by: profile?.full_name || 'أمين الخدمة'
          });
        } else if (rec.status === 'present') {
          await api.addServantPointTransaction({
            id: 'tx_' + Date.now() + Math.random(),
            servant_id: rec.servant_id,
            servant_name: rec.servant_name,
            points: 5,
            reason: `حضور الخدمة بتاريخ ${selectedDate}`,
            date: selectedDate,
            created_by: profile?.full_name || 'أمين الخدمة'
          });
        }
      }

      // Refresh points
      const updatedPoints = await api.getServantsPoints();
      const updatedTxs = await api.getServantPointTransactions();
      setPointsMap(updatedPoints);
      setTransactions(updatedTxs);

      toast.success(`تم حفظ كشف حضور الخدام بتاريخ (${selectedDate}) واحتساب النقاط بنجاح ✨`);
    } catch (err: any) {
      toast.error('فشل حفظ الحضور: ' + err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Open Points Adjustment Modal
  const handleOpenPointsModal = (servant: Profile) => {
    setTargetServant(servant);
    setPointsAmount(10);
    setPointsReason('تحضير وتقديم درس متميز وتفاعلي');
    setIsDeduction(false);
    setShowPointsModal(true);
  };

  const handlePresetReasonSelect = (preset: typeof PRESET_POINT_REASONS[0]) => {
    setPointsReason(preset.reason);
    setPointsAmount(Math.abs(preset.points));
    setIsDeduction(preset.isDeduction);
  };

  const handleSavePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetServant) return;
    if (pointsAmount <= 0) {
      toast.error('يرجى تحديد عدد النقاط بشكل صحيح');
      return;
    }

    setSavingPoint(true);
    try {
      const finalPoints = isDeduction ? -Math.abs(pointsAmount) : Math.abs(pointsAmount);
      const tx: ServantPointTransaction = {
        id: 'tx_' + Date.now(),
        servant_id: targetServant.id,
        servant_name: targetServant.full_name || 'خادم',
        points: finalPoints,
        reason: pointsReason.trim() || (isDeduction ? 'خصم نقاط' : 'مكافأة نقاط'),
        date: new Date().toISOString().split('T')[0],
        created_by: profile?.full_name || 'أمين الخدمة'
      };

      await api.addServantPointTransaction(tx);
      
      const updatedPoints = await api.getServantsPoints();
      const updatedTxs = await api.getServantPointTransactions();
      setPointsMap(updatedPoints);
      setTransactions(updatedTxs);

      toast.success(`تم ${isDeduction ? 'خصم' : 'إضافة'} ${pointsAmount} نقطة للخادم (${targetServant.full_name}) بنجاح ⭐`);
      setShowPointsModal(false);
    } catch (err: any) {
      toast.error('فشل حفظ النقاط: ' + err.message);
    } finally {
      setSavingPoint(false);
    }
  };

  const isGlobalAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'priest';
  const myAssignedCategories: ChurchServiceCategory[] = isGlobalAdmin
    ? ALL_CHURCH_SERVICE_CATEGORIES.map(c => c.category)
    : (profile?.id ? getLeaderAssignedServices(profile.id, siteSettings) : []);

  const currentLeaderService = (profile as any)?.service;
  if (!isGlobalAdmin && currentLeaderService) {
    const matchCat = ALL_CHURCH_SERVICE_CATEGORIES.find(c => currentLeaderService.includes(c.category));
    if (matchCat && !myAssignedCategories.includes(matchCat.category)) {
      myAssignedCategories.push(matchCat.category);
    }
  }

  // Available Category filters
  const availableCategories = isGlobalAdmin
    ? ['الكل', ...ALL_CHURCH_SERVICE_CATEGORIES.map(c => c.category)]
    : myAssignedCategories.length > 1
      ? ['الكل', ...myAssignedCategories]
      : [];

  // Filter Servants
  const filteredServants = servants.filter(s => {
    const matchesSearch = searchTerm.trim() === '' || 
      (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const sService = (s as any)?.service || '';
    const matchesCategory = selectedCategory === 'الكل' || 
      sService.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Visible Servant IDs
  const visibleServantIds = new Set(servants.map(s => s.id));
  const visibleTransactions = transactions.filter(t => visibleServantIds.has(t.servant_id));

  // Sorted Leaderboard
  const leaderboardServants = [...filteredServants].sort((a, b) => {
    const ptsA = pointsMap[a.id] || 0;
    const ptsB = pointsMap[b.id] || 0;
    return ptsB - ptsA;
  });

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    const headers = ['اسم الخادم', 'الرتبة', 'الخدمة / الفصل', 'الهاتف', 'الحالة', 'ملاحظات', 'تاريخ الخدمة'];
    const rows = filteredServants.map(s => {
      const att = dailyAttendance[s.id] || { status: 'present', notes: '' };
      const statusLabel = 
        att.status === 'present_early' ? 'حاضر مبكر' :
        att.status === 'present' ? 'حاضر' :
        att.status === 'late' ? 'متأخر' :
        att.status === 'excused' ? 'غياب بعذر' : 'غياب';

      return [
        `"${s.full_name}"`,
        s.role === 'service_leader' ? 'أمين خدمة' : 'خادم',
        `"${(s as any).service || 'تربية كنسية'}"`,
        `"${s.phone || ''}"`,
        statusLabel,
        `"${att.notes || ''}"`,
        `"${selectedDate}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف_حضور_خدام_${selectedCategory !== 'الكل' ? selectedCategory : 'الخدمة'}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير كشف الحضور بنجاح إلى Excel 📊');
  };

  // Status Badge Colors & Labels
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present_early':
        return { label: 'حاضر مبكر 🌟', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'present':
        return { label: 'حاضر ✅', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'late':
        return { label: 'متأخر ⏳', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'excused':
        return { label: 'غياب بعذر ℹ️', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'absent':
        return { label: 'غياب ❌', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'حاضر ✅', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  // Stats Counters
  const earlyCount = Object.values(dailyAttendance).filter(a => a.status === 'present_early').length;
  const presentCount = Object.values(dailyAttendance).filter(a => a.status === 'present').length;
  const lateCount = Object.values(dailyAttendance).filter(a => a.status === 'late').length;
  const absentCount = Object.values(dailyAttendance).filter(a => a.status === 'absent' || a.status === 'excused').length;
  const totalRecorded = filteredServants.length;
  const attendanceRate = totalRecorded > 0 ? Math.round(((earlyCount + presentCount) / totalRecorded) * 100) : 0;

  return (
    <DashboardLayout role={(profile?.role as UserRole) || 'service_leader'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
                  حضور وغياب ونقاط الخدام ⭐
                </h1>
                {!isGlobalAdmin && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1 rounded-full font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>خدمتك: {myAssignedCategories.join(' ، ') || currentLeaderService || 'التربية الكنسية'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                {isGlobalAdmin 
                  ? 'رصد التزام الخدام أسبوعياً لجميع الخدمات وتحفيزهم بالنقاط ولوحة الشرف'
                  : `متابعة حضور ودرجات خدام خدمتك (${myAssignedCategories.join(' ، ') || currentLeaderService || 'الخدمة'}) فقط`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveAttendance}
              disabled={savingAttendance}
              className="px-5 py-2.5 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingAttendance ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#fed65b] border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ كشف حضور اليوم 💾</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportAttendanceCSV}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills (if admin or leader of multiple services) */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-black text-slate-500 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية الخدمة:</span>
            </span>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#002366] text-[#fed65b] shadow'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-black text-slate-400">نسبة حضور الخدام</span>
            <p className="font-tajawal text-2xl font-black text-[#002366]">{attendanceRate}%</p>
            <p className="text-[10px] text-emerald-600 font-bold">إجمالي الخدام: {totalRecorded}</p>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-1">
            <span className="text-[11px] font-black text-amber-800">حضور مبكر 🌟</span>
            <p className="font-tajawal text-2xl font-black text-amber-900">{earlyCount} خادم</p>
            <p className="text-[10px] text-amber-700 font-bold">+10 نقاط تميز</p>
          </div>

          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200 shadow-sm space-y-1">
            <span className="text-[11px] font-black text-orange-800">متأخرين ⏳</span>
            <p className="font-tajawal text-2xl font-black text-orange-900">{lateCount} خادم</p>
            <p className="text-[10px] text-orange-700 font-bold">تتطلب المتابعة</p>
          </div>

          <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-1">
            <span className="text-[11px] font-black text-rose-800">غياب واعتذارات ❌</span>
            <p className="font-tajawal text-2xl font-black text-rose-900">{absentCount} خادم</p>
            <p className="text-[10px] text-rose-700 font-bold">مسجلين اليوم</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>تسجيل حضور وغياب الخدام ({servants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'points'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>نقاط الخدام ولوحة الشرف 🏆</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل حركات النقاط والتكريم ({transactions.length})</span>
          </button>
        </div>

        {/* TAB 1: ATTENDANCE RECORDING */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Date & Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-black text-slate-600 flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-4 h-4 text-[#002366]" />
                  <span>تاريخ الخدمة:</span>
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002366] focus:outline-none focus:ring-2 focus:ring-[#002366]"
                />

                <button
                  onClick={handleMarkAllPresent}
                  className="px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تحديد الكل حاضر ✅
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم الخادم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                />
              </div>
            </div>

            {/* Servants Attendance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#002366] text-[#fed65b] font-black">
                    <tr>
                      <th className="p-4">الخادم</th>
                      <th className="p-4">الرتبة والخدمة</th>
                      <th className="p-4">رصيد النقاط</th>
                      <th className="p-4">حالة الحضور اليوم</th>
                      <th className="p-4">ملاحظات وتكليفات الخدمة</th>
                      <th className="p-4 text-center">مكافأة / خصم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {filteredServants.map(servant => {
                      const att = dailyAttendance[servant.id] || { status: 'present', notes: '' };
                      const pts = pointsMap[servant.id] || 0;

                      return (
                        <tr key={servant.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-black text-sm shadow shrink-0">
                              {servant.full_name?.charAt(0) || 'خ'}
                            </div>
                            <div>
                              <p className="font-black text-[#002366] text-xs">{servant.full_name}</p>
                              {servant.phone && <p className="text-[10px] text-slate-400 font-mono">{servant.phone}</p>}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                              {servant.role === 'service_leader' ? 'أمين خدمة 🛡️' : 'خادم متابعة'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                              {pts} ⭐
                            </span>
                          </td>

                          {/* Quick 1-click status selector */}
                          <td className="p-4">
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-max">
                              <button
                                onClick={() => handleSetStatus(servant.id, 'present_early')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  att.status === 'present_early' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                                title="حاضر مبكر (+10)"
                              >
                                مبكر 🌟
                              </button>

                              <button
                                onClick={() => handleSetStatus(servant.id, 'present')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  att.status === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                                title="حاضر (+5)"
                              >
                                حاضر ✅
                              </button>

                              <button
                                onClick={() => handleSetStatus(servant.id, 'late')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  att.status === 'late' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                                title="متأخر (-2)"
                              >
                                متأخر ⏳
                              </button>

                              <button
                                onClick={() => handleSetStatus(servant.id, 'excused')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  att.status === 'excused' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                                title="غياب بعذر"
                              >
                                بعذر ℹ️
                              </button>

                              <button
                                onClick={() => handleSetStatus(servant.id, 'absent')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                  att.status === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                                title="غياب بدون عذر (-5)"
                              >
                                غياب ❌
                              </button>
                            </div>
                          </td>

                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="ملاحظات أو تكليف..."
                              value={att.notes}
                              onChange={(e) => handleSetNotes(servant.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:bg-white"
                            />
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleOpenPointsModal(servant)}
                              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black transition-all flex items-center gap-1 mx-auto cursor-pointer"
                              title="تعديل نقاط الخادم"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>نقاط</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVANTS LEADERBOARD & PODIUM */}
        {activeTab === 'points' && (
          <div className="space-y-8">
            
            {/* Top 3 Podium */}
            {leaderboardServants.length >= 3 && (
              <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#0a192f] p-8 rounded-3xl text-white shadow-xl border-4 border-[#fed65b] relative overflow-hidden">
                <div className="text-center space-y-2 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#fed65b] text-[#00174a] text-xs font-black shadow animate-bounce">
                    <Crown className="w-4 h-4" />
                    <span>لوحة شرف فرسان وخدام الكنيسة 🌟</span>
                  </span>
                  <h3 className="font-tajawal text-2xl sm:text-3xl font-black">أكثر الخدام التزاماً وتميزاً</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto items-end text-center">
                  
                  {/* Rank 2 (Silver) */}
                  <div className="space-y-3 order-1 sm:order-1">
                    <div className="w-16 h-16 rounded-full bg-slate-300 text-slate-800 mx-auto flex items-center justify-center font-black text-xl border-4 border-white shadow-xl">
                      🥈
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                      <p className="font-tajawal text-sm font-black line-clamp-1">{leaderboardServants[1]?.full_name}</p>
                      <p className="text-[#fed65b] font-black text-base mt-1">{pointsMap[leaderboardServants[1]?.id] || 0} ⭐</p>
                      <span className="text-[10px] text-slate-300 font-bold">المركز الثاني</span>
                    </div>
                  </div>

                  {/* Rank 1 (Gold) */}
                  <div className="space-y-3 order-2 sm:order-2 -translate-y-4">
                    <div className="w-20 h-20 rounded-full bg-[#fed65b] text-[#00174a] mx-auto flex items-center justify-center font-black text-3xl border-4 border-white shadow-2xl animate-pulse">
                      🥇
                    </div>
                    <div className="bg-gradient-to-b from-[#fed65b] to-[#f59e0b] text-[#00174a] p-5 rounded-2xl shadow-xl border border-white/40">
                      <p className="font-tajawal text-base font-black line-clamp-1">{leaderboardServants[0]?.full_name}</p>
                      <p className="font-black text-xl mt-1">{pointsMap[leaderboardServants[0]?.id] || 0} ⭐</p>
                      <span className="text-[10px] font-black uppercase tracking-wider">بطل الخدمة الأول 👑</span>
                    </div>
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="space-y-3 order-3 sm:order-3">
                    <div className="w-16 h-16 rounded-full bg-amber-700 text-white mx-auto flex items-center justify-center font-black text-xl border-4 border-white shadow-xl">
                      🥉
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                      <p className="font-tajawal text-sm font-black line-clamp-1">{leaderboardServants[2]?.full_name}</p>
                      <p className="text-[#fed65b] font-black text-base mt-1">{pointsMap[leaderboardServants[2]?.id] || 0} ⭐</p>
                      <span className="text-[10px] text-slate-300 font-bold">المركز الثالث</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-tajawal text-sm font-black text-[#002366]">الترتيب العام لجميع الخدام</h4>
                <span className="text-xs text-slate-500 font-bold">{servants.length} خادم مسجل</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#002366] text-[#fed65b] font-black">
                    <tr>
                      <th className="p-4">الترتيب</th>
                      <th className="p-4">الخادم</th>
                      <th className="p-4">الرتبة والصفة</th>
                      <th className="p-4">إجمالي النقاط</th>
                      <th className="p-4 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {leaderboardServants.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-amber-400 text-[#002366]' :
                            idx === 1 ? 'bg-slate-300 text-slate-800' :
                            idx === 2 ? 'bg-amber-600 text-white' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-black text-xs">
                            {s.full_name?.charAt(0) || 'خ'}
                          </div>
                          <span className="font-black text-[#002366]">{s.full_name}</span>
                        </td>

                        <td className="p-4">
                          <span className="text-slate-500">{s.role === 'service_leader' ? 'أمين خدمة' : 'خادم'}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                            {pointsMap[s.id] || 0} ⭐
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenPointsModal(s)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black transition-colors cursor-pointer"
                          >
                            تعديل النقاط
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: TRANSACTIONS HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-tajawal text-sm font-black text-[#002366]">سجل حركات ومنح النقاط لخدام الخدمة</h4>
              <span className="text-xs text-slate-500 font-bold">{visibleTransactions.length} حركة مسجلة</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#002366] text-[#fed65b] font-black">
                  <tr>
                    <th className="p-4">الخادم</th>
                    <th className="p-4">النقاط</th>
                    <th className="p-4">سبب المنح / الخصم</th>
                    <th className="p-4">المسؤول</th>
                    <th className="p-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {visibleTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        لا توجد حركات نقاط مسجلة لخدام هذه الخدمة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    visibleTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-black text-[#002366]">{tx.servant_name}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            tx.points >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points} ⭐
                          </span>
                        </td>
                        <td className="p-4 text-slate-800">{tx.reason}</td>
                        <td className="p-4 text-slate-500">{tx.created_by || 'أمين الخدمة'}</td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono">{tx.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add/Deduct Points */}
        {showPointsModal && targetServant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-base font-black text-[#002366]">منح / خصم نقاط للخادم</h3>
                    <p className="text-[11px] text-slate-500 font-bold">{targetServant.full_name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPointsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Points */}
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between text-xs font-bold">
                <span className="text-amber-900">الرصيد الحالي للخادم:</span>
                <span className="font-black text-amber-900 text-base">{pointsMap[targetServant.id] || 0} ⭐</span>
              </div>

              {/* Presets List */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">أسباب سريعة جاهزة:</label>
                <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  {PRESET_POINT_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetReasonSelect(preset)}
                      className="w-full text-right p-2 hover:bg-white rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer font-bold"
                    >
                      <span className="text-slate-800 line-clamp-1">{preset.reason}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                        preset.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {preset.points > 0 ? `+${preset.points}` : preset.points}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSavePoints} className="space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-black text-[#002366]">عدد النقاط *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">نوع الحركة</label>
                    <select
                      value={isDeduction ? 'deduct' : 'add'}
                      onChange={(e) => setIsDeduction(e.target.value === 'deduct')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    >
                      <option value="add">➕ مكافأة وإضافة نقاط</option>
                      <option value="deduct">➖ خصم نقاط</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1">السبب / التكريم *</label>
                  <input
                    type="text"
                    required
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#002366]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPointsModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={savingPoint}
                    className="flex-2 py-2.5 rounded-xl bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingPoint ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type Family, type FamilyMember, type FamilyAttendanceRecord } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCheck,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  Search,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Layers,
  FileText,
  Clock
} from 'lucide-react';
import { checkFamilyAttendanceStatus, type ServiceScheduleConfig, type AttendanceStatusResult } from '../../lib/attendanceStatusHelper';

export const AttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>({});
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<FamilyAttendanceRecord[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceScheduleConfig>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  
  const [reportStartDate, setReportStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reportEndDate, setReportEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchInitialData();
  }, [profile]);

  useEffect(() => {
    if (selectedFamilyId) {
      loadFamilyAttendance();
    }
  }, [selectedFamilyId, date]);

  const fetchInitialData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [allFamilies, settings] = await Promise.all([
        api.getFamilies(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);
      
      let myFamilyIds: string[] = [];
      try {
        const relations = await api.getFamilyServantsForAll();
        // Filter families assigned to the current servant
        if (profile.role === 'servant') {
          myFamilyIds = relations.filter(r => r.servant_id === profile.id).map(r => r.family_id);
        }
      } catch (err) {
        console.warn("family_servants table not created yet or RLS error:", err);
      }

      // Filtered families list (admins/priests see all, servants see their own or assigned)
      let filtered = allFamilies;
      if (profile.role === 'servant') {
        filtered = allFamilies.filter(f => 
          myFamilyIds.includes(f.id) || f.assigned_servant_id === profile.id
        );
      }

      // Parse schedule configs from settings
      const configs: Record<string, ServiceScheduleConfig> = {};
      Object.keys(settings).forEach(key => {
        if (key.startsWith('service_assignment_')) {
          const cat = key.replace('service_assignment_', '');
          try {
            configs[cat] = JSON.parse(settings[key]);
          } catch {}
        }
      });

      setFamilies(filtered);
      setServiceConfigs(configs);

      if (filtered.length > 0) {
        setSelectedFamilyId(filtered[0].id);
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyAttendance = async () => {
    try {
      // Get members of the family
      const familyMembersList = await api.getFamilyMembers(selectedFamilyId);
      setMembers(familyMembersList);

      // Get existing attendance for this family & date
      let records: FamilyAttendanceRecord[] = [];
      try {
        records = await api.getFamilyAttendanceRecords(selectedFamilyId, date);
      } catch (e) {
        console.warn("family_attendance_records table not ready:", e);
      }
      
      const stateMap: Record<string, boolean> = {};
      records.forEach(rec => {
        stateMap[rec.member_id] = rec.present;
      });
      setAttendanceState(stateMap);

      // Get all stats for history
      try {
        const allRecords = await api.getFamilyAttendanceStats(selectedFamilyId);
        setAllAttendanceRecords(allRecords);
      } catch (e) {
        console.warn("Error loading attendance stats:", e);
      }
    } catch (err: any) {
      console.error('Error fetching attendance records:', err);
    }
  };

  const toggleAttendance = (memberId: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const markAll = (present: boolean) => {
    const nextState: Record<string, boolean> = {};
    members.forEach(m => {
      nextState[m.id] = present;
    });
    setAttendanceState(nextState);
  };

  const handleSave = async () => {
    if (!selectedFamilyId) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const promises = members.map(m => {
        const isPresent = !!attendanceState[m.id];
        return api.upsertFamilyAttendanceRecord({
          family_id: selectedFamilyId,
          member_id: m.id,
          date: date,
          present: isPresent,
          recorded_by: profile?.id || null
        });
      });

      await Promise.all(promises);
      setSuccessMsg('تم حفظ تفقد الحضور والغياب بنجاح');
      
      // Reload stats after save
      const allRecords = await api.getFamilyAttendanceStats(selectedFamilyId);
      setAllAttendanceRecords(allRecords);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الحضور');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToExcel = () => {
    const headers = ['اسم المخدوم', 'تاريخ الميلاد', 'رقم الهاتف', 'مرات الحضور', 'مرات الغياب', 'نسبة الالتزام'];
    const rows = members.map(member => {
      const totalPresent = allAttendanceRecords.filter(r => 
        r.member_id === member.id && 
        r.present && 
        r.date >= reportStartDate && 
        r.date <= reportEndDate
      ).length;
      const totalAbsent = allAttendanceRecords.filter(r => 
        r.member_id === member.id && 
        !r.present && 
        r.date >= reportStartDate && 
        r.date <= reportEndDate
      ).length;
      const totalClasses = totalPresent + totalAbsent;
      const rate = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
      
      return [
        member.full_name,
        member.birth_date || 'غير مسجل',
        member.phone || 'بدون هاتف',
        totalPresent,
        totalAbsent,
        `${rate}%`
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_حضور_وغياب_من_${reportStartDate}_إلى_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm)
  );

  const presentCount = members.filter(m => attendanceState[m.id]).length;
  const absentCount = members.length - presentCount;
  const attendanceRate = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  const selectedFamily = families.find(f => f.id === selectedFamilyId);
  const matchedCategory = selectedFamily ? (['ابتدائي بنين', 'ابتدائي بنات', 'فتيان إعدادي', 'فتيات إعدادي', 'شباب ثانوي', 'شابات ثانوي', 'خدمة شباب جامعة', 'خدمة شابات جامعة', 'خريجين'].find(c => (selectedFamily.stage && selectedFamily.stage.includes(c)) || (selectedFamily.area && selectedFamily.area.includes(c))) || 'ابتدائي بنين') : 'ابتدائي بنين';
  const config = serviceConfigs[matchedCategory];
  const recordedDates = allAttendanceRecords.map(r => r.date);
  const familyStatus = selectedFamily ? checkFamilyAttendanceStatus(selectedFamily.id, selectedFamily.head_name, matchedCategory, config, recordedDates) : null;

  return (
    <DashboardLayout role={profile?.role as any || 'servant'}>
      <div className="space-y-8 font-cairo">

        {/* Status Alert Banner (Red if Overdue / Green if Completed) */}
        {familyStatus?.status === 'OVERDUE' && (
          <div className="p-5 bg-rose-50 border-2 border-rose-500 rounded-3xl text-rose-900 flex items-center justify-between gap-4 shadow-md animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center animate-pulse shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-tajawal text-base font-extrabold text-rose-950 flex items-center gap-2">
                  <span>🔴 تنبيه عاجل: لقد انقضى موعد الخدمة والمهلة المحددة!</span>
                </h3>
                <p className="text-xs text-rose-800 font-semibold">
                  {familyStatus.message} — تم إشعار أمين الخدمة والأب الكاهن. يرجى تسجيل وغلق الحضور فوراً بالضغط على "حفظ غياب اليوم".
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 bg-rose-200 text-rose-900 rounded-xl text-xs font-extrabold shrink-0">
              متأخر
            </span>
          </div>
        )}

        {familyStatus?.status === 'COMPLETED' && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{familyStatus.message}</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg text-[11px]">
              مكتمل
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] to-[#002366] p-6 rounded-3xl text-white shadow-xl border border-[#d4af37]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-2xl text-[#fed65b]">تسجيل حضور وغياب مدارس الأحد</h1>
            </div>
            <p className="text-slate-300 text-sm">متابعة حضور المخدومين في الاجتماعات الأسبوعية والافتقادات</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-5 py-3 bg-[#00123a] text-[#fed65b] border border-[#d4af37]/30 hover:bg-[#002366] font-bold rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <span>عرض تقرير الفصل</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || members.length === 0}
              className="px-6 py-3 bg-[#d4af37] text-[#00123a] font-bold rounded-2xl shadow-lg hover:bg-[#fed65b] transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ غياب اليوم'}</span>
            </button>
          </div>
        </div>

        {/* Controls & Selector Row */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Group/Family Selector */}
            <div className="space-y-1 min-w-[220px]">
              <label className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#002366]" />
                اختر الأسرة / المجموعة
              </label>
              <select
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-[#00123a] outline-none focus:ring-2 focus:ring-[#002366]"
              >
                {families.length === 0 ? (
                  <option value="">لا توجد أسر مسندة إليك</option>
                ) : (
                  families.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.head_name} ({f.area})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Selector */}
            <div className="space-y-1 min-w-[180px]">
              <label className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#002366]" />
                تاريخ الاجتماع
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-[#00123a] outline-none focus:ring-2 focus:ring-[#002366]"
              />
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-r border-slate-100 pt-3 md:pt-0 md:pr-4">
            <button
              onClick={() => markAll(true)}
              className="px-3 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-200"
            >
              <Check className="w-4 h-4" />
              <span>تحديد الكل حاضر</span>
            </button>
            <button
              onClick={() => markAll(false)}
              className="px-3 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1 border border-rose-200"
            >
              <X className="w-4 h-4" />
              <span>تحديد الكل غائب</span>
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats Bar */}
        <div className="bg-gradient-to-br from-[#00123a]/5 to-[#002366]/10 p-6 rounded-3xl border border-[#002366]/10 space-y-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-[#00123a]">نسبة حضور اليوم</span>
            <span className="text-[#002366] font-extrabold text-base">{attendanceRate}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-1">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              حاضر: {presentCount} مخدوم
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-bold">
              <XCircle className="w-4 h-4" />
              غائب: {absentCount} مخدوم
            </span>
            <span>إجمالي الكشف: {members.length} مخدوم</span>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 text-sm font-bold rounded-2xl flex items-center gap-3 border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو برقم الهاتف في كشف الحضور..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-medium text-sm shadow-sm focus:ring-2 focus:ring-[#002366]"
          />
        </div>

        {/* Members Grid List */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold">جاري تحميل كشف أسماء المخدومين...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">لا يوجد مخدومين في هذه القائمة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(member => {
              const isPresent = !!attendanceState[member.id];
              return (
                <div
                  key={member.id}
                  onClick={() => toggleAttendance(member.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 select-none ${
                    isPresent
                      ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors ${
                      isPresent
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`font-bold font-tajawal text-base transition-colors ${
                        isPresent ? 'text-emerald-950' : 'text-[#00123a]'
                      }`}>
                        {member.full_name}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">{member.phone || 'بدون هاتف'}</p>
                    </div>
                  </div>

                  {/* Status Toggle Icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isPresent
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isPresent ? <Check className="w-6 h-6 stroke-[3]" /> : <X className="w-5 h-5 stroke-[2]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden" dir="rtl">
              <div className="p-6 bg-gradient-to-r from-[#00123a] to-[#002366] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#fed65b]" />
                  <div>
                    <h3 className="font-tajawal font-bold text-xl text-[#fed65b]">تقرير حضور وغياب الفصل</h3>
                    <p className="text-xs text-white/80 mt-1">
                      إجمالي الحضور والغياب المسجلة لكل ولد للفترة المحددة
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Date Filters inside Report Modal */}
              <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">من تاريخ</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-[#00123a] outline-none focus:ring-1 focus:ring-[#002366]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block">إلى تاريخ</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-[#00123a] outline-none focus:ring-1 focus:ring-[#002366]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>تصدير إلى Excel</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3.5">اسم المخدوم</th>
                        <th className="p-3.5 text-center">مرات الحضور</th>
                        <th className="p-3.5 text-center">مرات الغياب</th>
                        <th className="p-3.5 text-center">نسبة الالتزام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {members.map(member => {
                        const totalPresent = allAttendanceRecords.filter(r => 
                          r.member_id === member.id && 
                          r.present && 
                          r.date >= reportStartDate && 
                          r.date <= reportEndDate
                        ).length;
                        const totalAbsent = allAttendanceRecords.filter(r => 
                          r.member_id === member.id && 
                          !r.present && 
                          r.date >= reportStartDate && 
                          r.date <= reportEndDate
                        ).length;
                        const totalClasses = totalPresent + totalAbsent;
                        const rate = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50">
                            <td className="p-3.5">{member.full_name}</td>
                            <td className="p-3.5 text-center text-emerald-600 font-bold">{totalPresent}</td>
                            <td className="p-3.5 text-center text-rose-600 font-bold">{totalAbsent}</td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                rate >= 50 ? 'bg-amber-50 text-amber-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                            لا يوجد مخدومين مسجلين بالأسرة بعد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-2.5 bg-[#002366] hover:bg-[#00174a] text-white font-bold rounded-xl transition-all shadow-md"
                >
                  إغلاق التقرير
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

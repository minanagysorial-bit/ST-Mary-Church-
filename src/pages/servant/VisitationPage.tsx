import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type FamilyMember, type VisitationLog } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  HeartHandshake,
  Calendar,
  UserCheck,
  Phone,
  Home,
  Church,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';

export const VisitationPage: React.FC = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<VisitationLog[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Date Range Filter States (From / To)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [visitType, setVisitType] = useState<'منزلية' | 'تليفونية' | 'كنسية'>('منزلية');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get logs
      const logsData = await api.getVisitationLogs(profile?.id);

      // 2. Get families to extract their children (makhdomeen)
      const allFamilies = await api.getFamilies();
      
      let myFamilyIds: string[] = [];
      try {
        const relations = await api.getFamilyServantsForAll();
        if (profile && profile.role === 'servant') {
          myFamilyIds = relations.filter(r => r.servant_id === profile.id).map(r => r.family_id);
        }
      } catch (err) {
        console.warn("family_servants table not ready or empty:", err);
      }

      // Filter families (servants see their own, admins/priests see all)
      let filteredFamilies = allFamilies;
      if (profile && profile.role === 'servant') {
        filteredFamilies = allFamilies.filter(f => 
          myFamilyIds.includes(f.id) || f.assigned_servant_id === profile?.id
        );
      }

      // Fetch family members for each of these families
      const membersPromises = filteredFamilies.map(f => api.getFamilyMembers(f.id));
      const membersLists = await Promise.all(membersPromises);
      const allFamilyMembers = membersLists.flat();

      // Deduplicate members
      const uniqueMembers = Array.from(new Map(allFamilyMembers.map(m => [m.id, m])).values());

      setLogs(logsData);
      setMembers(uniqueMembers);
    } catch (err: any) {
      console.error('Error fetching visitation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMsg('برجاء اختيار المخدوم');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.createVisitationLog({
        servant_id: profile?.id || '',
        member_id: selectedMemberId,
        group_id: null,
        visit_date: visitDate,
        visit_type: visitType,
        notes: notes.trim() || null
      });

      setSuccessMsg('تم تسجيل زيارة الافتقاد بنجاح');
      setSelectedMemberId('');
      setNotes('');
      setVisitDate(new Date().toISOString().split('T')[0]);

      // Refresh logs
      const updatedLogs = await api.getVisitationLogs(profile?.id);
      setLogs(updatedLogs);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ افتقاد الزيارة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت تأكد من حذف هذا السجل؟')) return;
    try {
      await api.deleteVisitationLog(id);
      setLogs(logs.filter(l => l.id !== id));
    } catch (err: any) {
      alert('فشل حذف السجل: ' + err.message);
    }
  };

  // Stats calculation
  const thisMonthLogs = logs.filter(l => {
    const d = new Date(l.visit_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const homeVisits = logs.filter(l => l.visit_type === 'منزلية').length;
  const phoneVisits = logs.filter(l => l.visit_type === 'تليفونية').length;
  const churchVisits = logs.filter(l => l.visit_type === 'كنسية').length;

  const setQuickRange = (type: 'this_month' | 'last_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    if (type === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (type === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prevMonth.getFullYear();
      const m = String(prevMonth.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      const lastDay = new Date(y, prevMonth.getMonth() + 1, 0).getDate();
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (type === 'last_30_days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredLogs = logs.filter(log => {
    // Resolve name for local searching
    const resolvedName = members.find(m => m.id === log.member_id)?.full_name || log.member_name || '';
    const matchesSearch = resolvedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || log.visit_type === filterType;
    
    // Date Range Matching (من - إلى)
    const matchesStartDate = !startDate || log.visit_date >= startDate;
    const matchesEndDate = !endDate || log.visit_date <= endDate;

    return matchesSearch && matchesFilter && matchesStartDate && matchesEndDate;
  });

  return (
    <DashboardLayout role={profile?.role as any || 'servant'}>
      <div className="space-y-8 font-cairo">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] to-[#002366] p-6 rounded-3xl text-white shadow-xl border border-[#d4af37]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-2xl text-[#fed65b]">سجل افتقاد الخادم</h1>
            </div>
            <p className="text-slate-300 text-sm">متابعة وتسجيل زيارات الافتقاد الرعوية وتوثيق التواصل مع أبناء الكنيسة</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
            <UserCheck className="w-5 h-5 text-[#fed65b]" />
            <span className="text-sm font-semibold">الخادم: {profile?.full_name || 'خادم الكنيسة'}</span>
          </div>
        </div>

        {/* Bento Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">افتفادات هذا الشهر</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{thisMonthLogs.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">افتفادات منزلية</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{homeVisits}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">افتفادات تليفونية</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{phoneVisits}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">متابعات كنسية</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{churchVisits}</h3>
            </div>
          </div>
        </div>

        {/* Main Grid: Form + History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* New Visitation Form Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-6 h-fit">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#00123a] text-[#fed65b] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-tajawal font-bold text-lg text-[#00123a]">تسجيل افتقاد جديد</h2>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Member Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">اختر المخدوم *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#002366] outline-none"
                  required
                >
                  <option value="">-- اختر المخدوم من القائمة --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.phone || 'بدون هاتف'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Visit Type Buttons */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">نوع الافتقاد</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitType('منزلية')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all ${
                      visitType === 'منزلية'
                        ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>منزلية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('تليفونية')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all ${
                      visitType === 'تليفونية'
                        ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>تليفونية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('كنسية')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all ${
                      visitType === 'كنسية'
                        ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Church className="w-4 h-4" />
                    <span>كنسية</span>
                  </button>
                </div>
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">تاريخ الافتقاد</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#002366] outline-none"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ملاحظات وطلبات صلاة</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب ملاحظات الزيرة، الموضوعات المثارة، أو طلبات الصلاة..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#002366] outline-none resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#00123a] to-[#002366] text-[#fed65b] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all border border-[#d4af37]/30 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>جاري الحفظ...</span>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>حفظ الافتقاد</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History List Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="font-tajawal font-bold text-lg text-[#00123a]">سجل الافتقادات السابقة</h2>
              </div>

              {/* Filters & Date Range Toggle */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
                    showDateFilter || startDate || endDate
                      ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="تحديد مدة من - إلى"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{startDate && endDate ? `${startDate} إلى ${endDate}` : 'تحديد مدة (من - إلى) 📅'}</span>
                </button>

                <div className="relative flex-1 sm:w-44">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث بالمخدوم..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                >
                  <option value="all">كل الأنواع</option>
                  <option value="منزلية">منزلية</option>
                  <option value="تليفونية">تليفونية</option>
                  <option value="كنسية">كنسية</option>
                </select>
              </div>
            </div>

            {/* Date Range Picker Expandable Box */}
            {showDateFilter && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fade-in text-xs font-tajawal">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">من تاريخ:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:border-[#002366]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">إلى تاريخ:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-slate-800 focus:outline-none focus:border-[#002366]"
                      />
                    </div>
                  </div>

                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => setQuickRange('all')}
                      className="text-xs text-rose-600 hover:underline font-bold self-end sm:self-center"
                    >
                      إلغاء تصفية المدة ✕
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400">فترات سريعة:</span>
                  <button
                    type="button"
                    onClick={() => setQuickRange('this_month')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors"
                  >
                    الشهر الحالي
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRange('last_month')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors"
                  >
                    الشهر السابق
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRange('last_30_days')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors"
                  >
                    آخر 30 يوم
                  </button>
                  {startDate && endDate && (
                    <span className="mr-auto text-[11px] font-bold text-[#002366] bg-blue-50 px-2.5 py-1 rounded-lg">
                      عدد الافتقادات في هذه الفترة: {filteredLogs.length} افتقاد
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* List Table / Cards */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold">جاري تحميل السجلات...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="font-bold text-slate-600">لا توجد افتقادات مسجلة</p>
                <p className="text-xs">قم بتسجيل أول افتقاد باستخدام النموذج المباشر</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => {
                  const kidName = members.find(m => m.id === log.member_id)?.full_name || log.member_name || 'مخدوم';
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#00123a]">{kidName}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            log.visit_type === 'منزلية'
                              ? 'bg-amber-100 text-amber-800'
                              : log.visit_type === 'تليفونية'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {log.visit_type}
                          </span>
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded-xl border border-slate-100 mt-1">
                            {log.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {log.visit_date}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(log.id)}
                        className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

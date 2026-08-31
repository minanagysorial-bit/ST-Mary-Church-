import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, CheckCircle, UserCheck, Plus, Calendar, Clock,
  MapPin, Phone, Heart, ClipboardList, BarChart2, Check, X, ShieldAlert
} from 'lucide-react';
import type { ChurchMember, MemberVisitation, VisitationLog } from '../../lib/database.types';

export const MemberVisitationPage: React.FC = () => {
  const { profile } = useAuth();
  
  // Data State
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [visitations, setVisitations] = useState<MemberVisitation[]>([]);
  const [ssLogs, setSsLogs] = useState<VisitationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'members' (Church Members) vs 'servants' (Sunday School Servant Stats)
  const [activeTab, setActiveTab] = useState<'members' | 'servants'>('members');

  // Log Visit Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitType, setVisitType] = useState<'منزلية' | 'تليفونية' | 'كنسية'>('منزلية');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, v, ss] = await Promise.all([
        api.getChurchMembers(),
        api.getMemberVisitations(),
        api.getVisitationLogs()
      ]);
      setMembers(m);
      setVisitations(v);
      setSsLogs(ss);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats for church members
  const memberLastVisitMap = visitations.reduce((acc, visit) => {
    if (!acc[visit.church_member_id] || new Date(visit.visit_date) > new Date(acc[visit.church_member_id].visit_date)) {
      acc[visit.church_member_id] = visit;
    }
    return acc;
  }, {} as Record<string, MemberVisitation & { priest_name?: string }>);

  // Compute Sunday School stats
  const servantStats = ssLogs.reduce((acc, log) => {
    const servantName = log.servant_name || 'خادم غير معروف';
    const sId = log.servant_id;
    if (!acc[sId]) {
      acc[sId] = {
        name: servantName,
        totalVisits: 0,
        lastVisitDate: null as string | null,
        groupName: log.group_name || 'بدون أسرة'
      };
    }
    acc[sId].totalVisits += 1;
    if (!acc[sId].lastVisitDate || new Date(log.visit_date) > new Date(acc[sId].lastVisitDate!)) {
      acc[sId].lastVisitDate = log.visit_date;
    }
    return acc;
  }, {} as Record<string, { name: string; totalVisits: number; lastVisitDate: string | null; groupName: string }>);

  // Autocomplete matching members
  const matchingMembers = nameInput.trim()
    ? members.filter(m => m.full_name.toLowerCase().includes(nameInput.trim().toLowerCase()))
    : [];

  const handleSelectMember = (m: ChurchMember) => {
    setNameInput(m.full_name);
    setSelectedMemberId(m.id);
    setPhoneInput(m.phone || '');
    setAddressInput(m.address || '');
    setShowSuggestions(false);
  };

  const handleLogVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setModalError('يرجى كتابة اسم الشخص المراد افتقاده.');
      return;
    }
    if (!profile?.id) return;

    setSaving(true);
    setModalError(null);
    try {
      let targetMemberId = selectedMemberId;
      if (!targetMemberId) {
        const found = members.find(m => m.full_name.trim().toLowerCase() === cleanName.toLowerCase());
        if (found) {
          targetMemberId = found.id;
        } else {
          // Automatically register as church member
          const created = await api.createChurchMember({
            full_name: cleanName,
            phone: phoneInput.trim() || 'بدون هاتف',
            address: addressInput.trim() || 'محرم بك، الإسكندرية',
            marital_status: 'أعزب'
          });
          targetMemberId = created.id;
        }
      }

      await api.createMemberVisitation({
        church_member_id: targetMemberId,
        visited_by: profile.id,
        visit_date: visitDate,
        visit_type: visitType,
        notes: notes.trim() || null
      });

      // Reset & refresh
      setShowLogModal(false);
      setNameInput('');
      setSelectedMemberId('');
      setPhoneInput('');
      setAddressInput('');
      setNotes('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setVisitType('منزلية');
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ أثناء حفظ الافتقاد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              سجل الافتقاد الرعوي الكنسي
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              متابعة وتسجيل زيارات شعب الكنيسة ومتابعة معدل افتقاد خدام مدارس الأحد للمخدومين
            </p>
          </div>
          
          {activeTab === 'members' && (
            <button
              onClick={() => setShowLogModal(true)}
              className="bg-[#fed65b] text-[#00113a] hover:bg-[#fed65b]/90 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل افتقاد جديد</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] w-fit">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold font-tajawal transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-[#002366] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>افتقاد شعب الكنيسة</span>
          </button>

          <button
            onClick={() => setActiveTab('servants')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold font-tajawal transition-all flex items-center gap-2 ${
              activeTab === 'servants'
                ? 'bg-[#002366] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>نشاط خدام مدارس الأحد</span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-bold border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            جاري تحميل تفاصيل الافتقاد...
          </div>
        ) : activeTab === 'members' ? (
          /* CHURCH MEMBERS VISITATION VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-[#002366]/5 text-[#002366] font-bold text-xs">
                    <tr>
                      <th className="p-4">اسم العضو بالكامل</th>
                      <th className="p-4">الهاتف</th>
                      <th className="p-4">نوع الزيارة الأخيرة</th>
                      <th className="p-4">بواسطة</th>
                      <th className="p-4 text-center">تاريخ آخر زيارة</th>
                      <th className="p-4">ملاحظات الافتقاد الأخيرة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-bold">
                          لا يوجد أعضاء في السجل بعد. يرجى إضافة أعضاء أو اعتماد طلبات تسجيل.
                        </td>
                      </tr>
                    ) : (
                      members.map(member => {
                        const lastVisit = memberLastVisitMap[member.id];
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-[#002366] text-xs">{member.full_name}</td>
                            <td className="p-4 text-xs">{member.phone}</td>
                            <td className="p-4 text-xs">
                              {lastVisit ? (
                                <span className="bg-[#d4af37]/10 text-[#002366] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#d4af37]/20">
                                  {lastVisit.visit_type}
                                </span>
                              ) : (
                                <span className="text-rose-500 text-[10px] font-bold">لم يفتقد بعد</span>
                              )}
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-500">
                              {lastVisit?.priest_name || '—'}
                            </td>
                            <td className="p-4 text-center text-xs text-slate-400">
                              {lastVisit ? new Date(lastVisit.visit_date).toLocaleDateString('ar-EG') : '—'}
                            </td>
                            <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={lastVisit?.notes || ''}>
                              {lastVisit?.notes || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* SUNDAY SCHOOL SERVANTS STATS VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-[#002366]/5 text-[#002366] font-bold text-xs">
                    <tr>
                      <th className="p-4">اسم الخادم</th>
                      <th className="p-4">أسرة الخدمة المسندة</th>
                      <th className="p-4 text-center">مجموع الافتقادات المسجلة</th>
                      <th className="p-4 text-center">تاريخ آخر افتقاد</th>
                      <th className="p-4 text-center">أداء الخدمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {Object.keys(servantStats).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-slate-400 font-bold">
                          لا توجد إحصائيات افتقاد مسجلة لخدام مدارس الأحد حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      Object.values(servantStats).map((stat, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-[#002366] text-xs">{stat.name}</td>
                          <td className="p-4 text-xs text-slate-500">{stat.groupName}</td>
                          <td className="p-4 text-center text-xs font-bold text-[#002366]">{stat.totalVisits}</td>
                          <td className="p-4 text-center text-xs text-slate-400">
                            {stat.lastVisitDate ? new Date(stat.lastVisitDate).toLocaleDateString('ar-EG') : '—'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              stat.totalVisits >= 5 ? 'bg-emerald-50 text-emerald-805 border border-emerald-100' :
                              stat.totalVisits >= 2 ? 'bg-amber-50 text-amber-805 border border-amber-100' :
                              'bg-rose-50 text-rose-805 border border-rose-100'
                            }`}>
                              {stat.totalVisits >= 5 ? 'نشط متميز' : stat.totalVisits >= 2 ? 'نشط' : 'يحتاج متابعة'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Log Visit Modal */}
        {showLogModal && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scaleUp">
              {/* Modal Header */}
              <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
                <h3 className="font-tajawal text-base font-extrabold">تسجيل افتقاد راعوي لشعب الكنسية</h3>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 text-white hover:text-amber-450 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleLogVisitSubmit} className="p-6 space-y-4">
                {modalError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold">
                    {modalError}
                  </div>
                )}

                {/* Member Name Autocomplete Input */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-700 block">
                    اسم المخدوم / الشخص المراد افتقاده *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم الشخص (مثال: مينا...)"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setSelectedMemberId('');
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#002366] outline-none bg-slate-50"
                  />

                  {/* Autocomplete Dropdown List */}
                  {showSuggestions && nameInput.trim().length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-scale-in">
                      {matchingMembers.length > 0 ? (
                        matchingMembers.map(m => (
                          <div
                            key={m.id}
                            onClick={() => handleSelectMember(m)}
                            className="p-3 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-center justify-between text-right"
                          >
                            <div>
                              <p className="font-bold text-xs text-[#002366]">{m.full_name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                {m.phone && <span>📞 {m.phone}</span>}
                                {m.address && <span>📍 {m.address}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              عضو مسجل
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={() => setShowSuggestions(false)}
                          className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-bold text-amber-800 flex items-center justify-between"
                        >
                          <span>➕ اسم جديد (سيتم حفظه وإضافته لسجل الكنيسة تلقائياً)</span>
                          <span className="text-[10px] text-slate-400">إغلاق</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone & Address Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">رقم الهاتف</label>
                    <input
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-[#002366] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">العنوان / المنطقة</label>
                    <input
                      type="text"
                      placeholder="محرم بك، الإسكندرية..."
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-[#002366] outline-none"
                    />
                  </div>
                </div>

                {/* Visit Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ الافتقاد</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                  />
                </div>

                {/* Visit Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">نوع الافتقاد</label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as 'منزلية' | 'تليفونية' | 'كنسية')}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                  >
                    <option value="منزلية">زيارة منزلية</option>
                    <option value="تليفونية">اتصال هاتفى</option>
                    <option value="كنسية">مقابلة شخصية</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">ملاحظات وطلبات الصلاة</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب أي ملاحظة رعوية هنا..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#002366] hover:bg-[#002366]/90 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm text-xs transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ الافتقاد'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-5 py-2 rounded-xl text-xs transition-all"
                  >
                    <span>إلغاء</span>
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

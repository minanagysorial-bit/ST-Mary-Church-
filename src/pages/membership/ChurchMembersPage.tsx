import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Search, UserPlus, Edit2, Check, X, ShieldAlert, Phone, MapPin, Calendar, Heart } from 'lucide-react';
import { api } from '../../lib/api';
import type { ChurchMember } from '../../lib/database.types';

export const ChurchMembersPage: React.FC = () => {
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');

  // Editing state
  const [editingMember, setEditingMember] = useState<ChurchMember | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    nationalId: '',
    age: '',
    maritalStatus: 'أعزب' as 'أعزب' | 'متزوج',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = () => {
    setLoading(true);
    api.getChurchMembers()
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEditClick = (member: ChurchMember) => {
    setEditingMember(member);
    setEditForm({
      fullName: member.full_name,
      phone: member.phone,
      address: member.address,
      nationalId: member.national_id || '',
      age: member.age ? String(member.age) : '',
      maritalStatus: member.marital_status,
      notes: member.notes || '',
    });
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editForm.fullName || !editForm.phone || !editForm.address) {
      setError('يرجى ملء الحقول الأساسية: الاسم، الهاتف، والعنوان.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.updateChurchMember(editingMember.id, {
        full_name: editForm.fullName,
        phone: editForm.phone,
        address: editForm.address,
        national_id: editForm.nationalId || null,
        age: editForm.age ? parseInt(editForm.age, 10) : null,
        marital_status: editForm.maritalStatus,
        notes: editForm.notes || null,
      });
      setEditingMember(null);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhone = m.phone.includes(phoneFilter);
    return matchesSearch && matchesPhone;
  });

  return (
    <DashboardLayout role="membership">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              سجل أعضاء الكنيسة الرسمي
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              عرض والتحقق وتعديل تفاصيل سجل العضوية الرئيسي لشعب الكنيسة
            </p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            العضوية المعتمدة
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name Search */}
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="البحث باسم العضو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-[#002366]/20 transition-all font-semibold"
            />
          </div>

          {/* Phone Search */}
          <div className="relative">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="البحث برقم الهاتف..."
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-[#002366]/20 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Members Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#002366]/5 text-[#002366] font-bold text-xs">
                <tr>
                  <th className="p-4">الاسم بالكامل</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">العنوان</th>
                  <th className="p-4 text-center">السن</th>
                  <th className="p-4 text-center">الحالة الاجتماعية</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-bold">جاري تحميل البيانات...</td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-bold">لم يتم العثور على أعضاء مطابقين للبحث.</td>
                  </tr>
                ) : (
                  filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-[#002366] text-xs">{member.full_name}</td>
                      <td className="p-4 text-xs">{member.phone}</td>
                      <td className="p-4 text-xs max-w-xs truncate" title={member.address}>{member.address}</td>
                      <td className="p-4 text-center text-xs">{member.age || '—'}</td>
                      <td className="p-4 text-center text-xs">{member.marital_status}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEditClick(member)}
                          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm inline-flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal (Beautiful Slide-over or Center Overlay) */}
        {editingMember && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-scaleUp">
              {/* Modal Header */}
              <div className="bg-[#002366] text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-tajawal text-base font-extrabold">تعديل بيانات العضو</h3>
                  <p className="text-[10px] text-amber-300 font-bold mt-0.5">{editingMember.full_name}</p>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-1 text-white hover:text-amber-450 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">الاسم بالكامل</label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">رقم الهاتف</label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block">العنوان بالكامل</label>
                    <input
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    />
                  </div>

                  {/* National ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">الرقم القومي</label>
                    <input
                      type="text"
                      maxLength={14}
                      value={editForm.nationalId}
                      onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">السن</label>
                    <input
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    />
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block">الحالة الاجتماعية</label>
                    <select
                      value={editForm.maritalStatus}
                      onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value as 'أعزب' | 'متزوج' })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                    >
                      <option value="أعزب">أعزب / عزباء</option>
                      <option value="متزوج">متزوج / متزوجة</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-500 block">ملاحظات إضافية</label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#002366] hover:bg-[#002366]/90 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm text-xs transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ البيانات الجديدة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 text-xs transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
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

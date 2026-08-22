import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Users, Search, Filter, Mail, Phone, Edit, Trash2, Plus, X, Check, AlertCircle } from 'lucide-react';
import { Member, api } from '../../lib/api';

export const MembersManagementPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await api.getMembers();
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setError('خطأ في تحميل كشوفات الأعضاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEditClick = (m: Member) => {
    setEditingId(m.id);
    setFullName(m.full_name);
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setService(m.service || '');
    setStatus(m.status as 'نشط' | 'غير نشط');
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setService('');
    setStatus('نشط');
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !service.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، الخدمة)');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        // Update operation
        await api.updateMember(editingId, {
          full_name: fullName,
          email: email || null,
          phone,
          service,
          status: status as any,
        });
        setSuccess('تم تحديث بيانات العضو بنجاح');
      } else {
        // Insert operation
        await api.createMember({
          full_name: fullName,
          email: email || null,
          phone,
          service,
          status: status as any,
          registration_date: new Date().toISOString().split('T')[0],
        });
        setSuccess('تم تسجيل العضو الجديد بنجاح');
      }

      // Reset form
      setShowForm(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setService('');
      setStatus('نشط');
      setEditingId(null);

      // Refresh list
      await fetchMembers();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حفظ بيانات العضو. تأكد من صحة المدخلات.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف العضو (${name}) نهائياً؟`)) return;
    setError(null);
    setSuccess(null);
    try {
      await api.deleteMember(id);
      setSuccess('تم حذف العضو بنجاح');
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حذف العضو من قاعدة البيانات');
    }
  };

  const filtered = members.filter(m => 
    (m.full_name?.includes(query)) || (m.phone?.includes(query)) || (m.service?.includes(query))
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة الأعضاء وشعب الكنيسة
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">قاعدة بيانات الأعضاء المسجلين والافتقاد</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative max-w-sm w-full font-cairo">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم العضو أو الهاتف أو الخدمة..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-[#002366] rounded-xl pr-10 pl-4 py-2.5 text-xs outline-none shadow-sm transition-all font-semibold"
              />
            </div>

            {/* Add member button */}
            <button
              onClick={handleAddNewClick}
              className="bg-[#002366] hover:bg-[#002366]/90 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-colors font-tajawal"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عضو جديد</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Form panel for Add/Edit Member */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">
                {editingId ? 'تعديل بيانات العضو' : 'تسجيل عضو جديد بقاعدة البيانات'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">الاسم بالكامل (مطلوب)</label>
                <input
                  type="text"
                  required
                  placeholder="مينا عماد غالي"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002366] font-semibold text-slate-800"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">رقم الهاتف (مطلوب)</label>
                <input
                  type="text"
                  required
                  placeholder="01234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002366] font-semibold text-slate-800"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  placeholder="member@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002366] font-semibold text-slate-800"
                />
              </div>

              {/* Service */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">اسم الخدمة أو الاجتماع التابع له (مطلوب)</label>
                <input
                  type="text"
                  required
                  placeholder="اجتماع الشباب / ثانوي أ"
                  value={service}
                  onChange={e => setService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002366] font-semibold text-slate-800"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">الحالة النشطة</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'نشط' | 'غير نشط')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#002366] font-bold text-slate-850 text-slate-800"
                >
                  <option value="نشط">نشط (Active)</option>
                  <option value="غير نشط">غير نشط (Inactive)</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-end pt-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-[#d4af37] hover:bg-[#fed65b] text-[#002366] font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingId ? 'حفظ التعديلات' : 'تسجيل العضو الآن'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">جاري تحميل بيانات الأعضاء...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">لا يوجد أعضاء مطابقين للبحث.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 text-slate-700">
                    <th className="p-4 rounded-r-xl">العضو</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">الخدمة / الاجتماع</th>
                    <th className="p-4">تاريخ الانضمام</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 rounded-l-xl text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-750">
                  {filtered.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-[#002366]">{m.full_name}</td>
                      <td className="p-4 text-slate-500">{m.email || '—'}</td>
                      <td className="p-4 text-slate-600 font-bold" dir="ltr">{m.phone}</td>
                      <td className="p-4 text-[#002366] font-bold">{m.service}</td>
                      <td className="p-4 text-slate-400">{m.registration_date}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${m.status === 'نشط' ? 'bg-emerald-50 text-emerald-808 text-emerald-708 border border-emerald-100' : 'bg-amber-50 text-amber-808 border border-amber-100'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-1 space-x-reverse">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditClick(m)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                          title="تعديل بيانات العضو"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(m.id, m.full_name)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف العضو نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

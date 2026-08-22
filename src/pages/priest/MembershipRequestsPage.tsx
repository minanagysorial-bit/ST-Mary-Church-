import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Check, X, ShieldAlert, Phone, MapPin, Calendar, Heart, ClipboardList, Send, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { MembershipRequest } from '../../lib/database.types';

export const MembershipRequestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Rejection reason dialog state
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    api.getMembershipRequests(activeTab)
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    if (!profile?.id) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في اعتماد هذا الطلب ونقله إلى سجل العضوية الرسمي؟')) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.approveMembershipRequest(id, profile.id);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء اعتماد الطلب.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingReqId(id);
    setRejectionNote('');
    setError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReqId || !profile?.id) return;
    if (!rejectionNote.trim()) {
      setError('يرجى تحديد سبب الرفض لتوضيحه لمقدم الطلب.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.rejectMembershipRequest(rejectingReqId, profile.id, rejectionNote.trim());
      setRejectingReqId(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفض الطلب.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              طلبات عضوية الكنيسة الجديدة
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              مراجعة طلبات التسجيل المقدمة من شعب الكنيسة واعتمادها أو توضيح ملحوظات استكمالها
            </p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            مراجعة الطلبات العامة
          </span>
        </div>

        {/* Action/Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs Filter */}
        <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold font-tajawal transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-[#002366] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>قيد المراجعة</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'pending' ? 'bg-amber-450 text-[#00113a]' : 'bg-slate-100 text-slate-650'
            }`}>
              {activeTab === 'pending' ? requests.length : '؟'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold font-tajawal transition-all ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            المقبولة والمعتمدة
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold font-tajawal transition-all ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            المرفوضة
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-bold border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              جاري تحميل الطلبات...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-bold border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">لا توجد طلبات عضوية في هذا القسم حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(req => (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between space-y-5 transition-shadow hover:shadow-md ${
                    req.status === 'approved' ? 'border-emerald-100' :
                    req.status === 'rejected' ? 'border-rose-100' : 'border-slate-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-tajawal text-base font-extrabold text-[#002366]">{req.full_name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {new Date(req.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-600 font-semibold pt-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span>الهاتف: {req.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span>العمر: {req.age || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span>الحالة الاجتماعية: {req.marital_status}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                        <span className="truncate" title={req.address}>العنوان: {req.address}</span>
                      </div>
                      {req.national_id && (
                        <div className="col-span-2 text-[#002366] font-bold">
                          الرقم القومي: {req.national_id}
                        </div>
                      )}
                    </div>

                    {/* Rejection Note display if rejected */}
                    {req.status === 'rejected' && req.review_note && (
                      <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 font-bold mt-2">
                        سبب الرفض: {req.review_note}
                      </div>
                    )}
                  </div>

                  {/* Actions for Pending */}
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50 justify-end">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95 disabled:bg-slate-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>موافقة وإضافة للسجل</span>
                      </button>

                      <button
                        onClick={() => handleRejectClick(req.id)}
                        disabled={actionLoading}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض الطلب</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejection Reason Modal */}
        {rejectingReqId && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scaleUp">
              {/* Modal Header */}
              <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
                <h3 className="font-tajawal text-base font-extrabold">تحديد سبب رفض طلب العضوية</h3>
                <button
                  onClick={() => setRejectingReqId(null)}
                  className="p-1 text-white hover:text-rose-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">سبب الرفض (سيظهر لمقدم الطلب لتعديله)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="يرجى كتابة سبب عدم قبول الطلب، مثل: الرقم القومي غير صحيح أو العنوان تنقصه تفاصيل..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    className="w-full text-xs border border-slate-205 rounded-xl px-3.5 py-3 focus:ring-1 focus:ring-rose-500/20 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'جاري الإرسال...' : 'تأكيد الرفض وإرسال تنبيه'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingReqId(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
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

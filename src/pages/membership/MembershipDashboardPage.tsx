import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ChurchMember, MembershipRequest } from '../../lib/database.types';

export const MembershipDashboardPage: React.FC = () => {
  const [membersCount, setMembersCount] = useState(0);
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getChurchMembers(),
      api.getMembershipRequests()
    ])
      .then(([m, r]) => {
        setMembersCount(m.length);
        setRequests(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');

  return (
    <DashboardLayout role="membership">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة تحكم شؤون العضوية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تسجيل وتعديل بيانات شعب الكنيسة ومتابعة إحصائيات الانضمام
            </p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            شؤون الأعضاء
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Members Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">إجمالي أعضاء الكنيسة</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <Users className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : membersCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-slate-500 font-bold">سجلات العضوية المفعلة</p>
          </div>

          {/* All Requests Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">إجمالي طلبات التسجيل</span>
              <div className="p-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <FileText className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : requests.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-slate-550 font-bold">من الموقع العام</p>
          </div>

          {/* Pending Requests Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">طلبات قيد المراجعة</span>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : pendingRequests.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-amber-600 font-bold">بانتظار موافقة الأب الكاهن</p>
          </div>

          {/* Approved Requests Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">طلبات تم اعتمادها</span>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : approvedRequests.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">أضيفت تلقائياً للعضوية</p>
          </div>
        </div>

        {/* Quick Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="font-tajawal text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3">آخر الطلبات المقدمة</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b border-slate-100 text-[#002366] font-bold text-xs">
                    <th className="py-2.5">الاسم</th>
                    <th className="py-2.5">الهاتف</th>
                    <th className="py-2.5 text-center">الحالة</th>
                    <th className="py-2.5 text-center">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-650">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-xs text-slate-400 font-bold">جاري تحميل البيانات...</td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-xs text-slate-400 font-bold">لا توجد طلبات عضوية مسجلة.</td>
                    </tr>
                  ) : (
                    requests.slice(0, 5).map(req => (
                      <tr key={req.id}>
                        <td className="py-3 font-bold text-[#002366] text-xs">{req.full_name}</td>
                        <td className="py-3 text-xs">{req.phone}</td>
                        <td className="py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            req.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {req.status === 'pending' ? 'جاري المراجعة' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                          </span>
                        </td>
                        <td className="py-3 text-center text-[10px] text-slate-400">{new Date(req.created_at).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3">إجراءات سريعة</h3>
              <p className="text-xs text-slate-600 font-semibold mt-2.5 leading-relaxed">
                بصفتك مسؤول شؤون العضوية، يمكنك إدارة قائمة الأعضاء والبحث فيهم أو التعديل الفوري على تفاصيل سكنهم واتصالهم.
              </p>
            </div>
            
            <div className="space-y-2 pt-4">
              <Link 
                to="/membership/members" 
                className="w-full bg-[#002366] text-white hover:bg-[#002366]/90 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
              >
                <Users className="w-3.5 h-3.5" />
                <span>إدارة قاعدة البيانات الرئيسية</span>
              </Link>
              <a 
                href="/membership/register" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>رابط التسجيل العام (في نافذة جديدة)</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

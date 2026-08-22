import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Users, BookOpen, MessageSquare, UserPlus, Heart, Bookmark } from 'lucide-react';
import { Member, api } from '../../lib/api';

export const AdminDashboardPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [sermonsCount, setSermonsCount] = useState<number>(0);
  const [prayersCount, setPrayersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMembers(),
      api.getSermons(),
      api.getPrayerRequests()
    ])
      .then(([m, s, p]) => {
        setMembers(m);
        setSermonsCount(s.length);
        setPrayersCount(p.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="admin">

      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة تحكم المشرف الرئيسي
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              إحصائيات الكنيسة ومتابعة النظام الإداري الموحد
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full border border-emerald-200 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>النظام متصل ونشط</span>
            </span>
          </div>
        </div>

        {/* Bento Metric Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">إجمالي الأعضاء المسجلين</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <Users className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : members.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span>▲ +٤٢</span>
              <span className="text-slate-400">هذا الشهر</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">العظات بالمكتبة الرقمية</span>
              <div className="p-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : sermonsCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-slate-500 font-bold">جميع الفئات والتصنيفات</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">طلبات الصلاة والرسائل</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <MessageSquare className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : prayersCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-[#002366] font-bold">تتطلب المتابعة والرد</p>
          </div>
        </div>

        {/* Registered Members Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <h2 className="font-tajawal text-xl font-extrabold text-[#002366]">
              سجل التسجيلات الحديثة للأعضاء
            </h2>
            <button className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 self-start sm:self-auto shadow-md shadow-[#002366]/10 transition-all">
              <UserPlus className="w-4 h-4" />
              <span>إضافة عضو جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-400 font-extrabold border-b border-slate-100">
                  <th className="p-4 rounded-r-xl">اسم العضو</th>
                  <th className="p-4">الخدمة / الاجتماع</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4">تاريخ التسجيل</th>
                  <th className="p-4 rounded-l-xl">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-[#002366]">{m.full_name}</td>
                    <td className="p-4 text-slate-600">{m.service}</td>
                    <td className="p-4 text-slate-600" dir="ltr">{m.phone}</td>
                    <td className="p-4 text-slate-400">{m.registration_date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${m.status === 'نشط' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

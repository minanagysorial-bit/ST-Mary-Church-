import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Landmark, TrendingUp, Calendar, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, Meeting, Project, FinancialRecord } from '../../lib/api';

export const BoardDashboardPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMeetings(),
      api.getProjects(),
      api.getFinancials()
    ])
      .then(([m, p, f]) => {
        setMeetings(m);
        setProjects(p);
        setFinancials(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const donationsSum = financials
    .filter(f => f.type === 'تبرع')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const expensesSum = financials
    .filter(f => f.type === 'مصروفات')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const activeProjectsCount = projects.filter(p => p.status === 'قيد التنفيذ').length;

  return (
    <DashboardLayout role="board">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة تحكم مجلس الكنيسة الموقر
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">إشراف ومتابعة الشؤون المالية والمجلس والمشروعات الجارية</p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            شعبة الإدارة والتنظيم الكنسي
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">إجمالي واردات التبرعات</span>
              <div className="p-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <Landmark className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : `${donationsSum.toLocaleString('ar-EG')} ج.م`}
            </p>
            <p className="text-[11px] text-[#002366] font-bold">حسب ميزانية الربع الحالي</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">الموازنة والمصروفات</span>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <TrendingUp className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : `${expensesSum.toLocaleString('ar-EG')} ج.م`}
            </p>
            <p className="text-[11px] text-slate-550 font-bold">بند مصروفات التشغيل والخدمات</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">المشاريع الإنشائية الجارية</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <ClipboardList className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : activeProjectsCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">صيانة وتجديد مستمرة</p>
          </div>
        </div>

        {/* Dashboard activities */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <h2 className="font-tajawal text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3">
            أهم قرارات ومتابعات المجلس
          </h2>
          <div className="space-y-4 text-xs font-semibold">
            {loading ? (
              <p className="text-slate-400 text-center py-4">جاري تحميل البيانات...</p>
            ) : meetings.length === 0 ? (
              <p className="text-slate-400 text-center py-4">لا توجد اجتماعات مسجلة حالياً.</p>
            ) : (
              meetings.slice(0, 3).map(m => (
                <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                  <div>
                    <p className="font-bold text-[#002366] text-sm">{m.title}</p>
                    <p className="text-slate-550 mt-1">تاريخ الاجتماع: {m.date} — مكان الاجتماع: {m.location}</p>
                  </div>
                  <span className={`font-bold px-3.5 py-1.5 rounded-full text-[10px] ${
                    m.status === 'مكتمل'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : m.status === 'ملغي'
                      ? 'bg-red-50 text-red-800 border border-red-100'
                      : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

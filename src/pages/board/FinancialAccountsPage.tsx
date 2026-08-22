import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Landmark, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { FinancialRecord, api } from '../../lib/api';

export const FinancialAccountsPage: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);

  useEffect(() => {
    api.getFinancials().then(setRecords).catch(console.error);
  }, []);

  return (
    <DashboardLayout role="board">
      <div className="space-y-8 font-cairo">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة الحسابات والتبرعات المالية
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">سجلات الوارد والمصروفات ومتابعة تبرعات إخوة الرب رقمياً</p>
          </div>
        </div>

        {/* Financial Records List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="border-b border-slate-50 pb-3 mb-4">
            <h3 className="font-tajawal font-extrabold text-base text-[#002366]">الحركات المالية المسجلة مؤخراً</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100">
                  <th className="p-4 rounded-r-xl">نوع الحركة</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">التفاصيل والبيان</th>
                  <th className="p-4 rounded-l-xl">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-[#002366]">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] ${r.type === 'تبرع' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                        {r.type === 'تبرع' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        <span>{r.type}</span>
                      </span>
                    </td>
                    <td className={`p-4 font-bold text-sm ${r.type === 'تبرع' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.amount.toLocaleString()} ج.م</td>
                    <td className="p-4 text-slate-500 font-bold">{r.description}</td>
                    <td className="p-4 text-slate-400 font-cairo">{r.date}</td>
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

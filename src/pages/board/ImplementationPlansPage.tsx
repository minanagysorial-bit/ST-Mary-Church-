import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Project, api } from '../../lib/api';

export const ImplementationPlansPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <DashboardLayout role="board">
      <div className="space-y-8 font-cairo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              خطط التنفيذ ومشروعات التطوير
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">متابعة صيانة وتجديدات الكنيسة والمنشآت الملحقة الخدمية</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h3 className="font-tajawal font-extrabold text-base text-[#002366]">{p.title}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${p.status === 'مكتمل' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                  {p.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>نسبة الإنجاز الفعلية</span>
                  <span className="text-[#002366]">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#002366] transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              <div className="pt-3 flex justify-between text-xs text-slate-550 font-bold border-t border-slate-50">
                <span>الميزانية المرصودة: <span className="text-[#d4af37]">{p.budget}</span></span>
                <span>تاريخ التسليم المتوقع: {p.target_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

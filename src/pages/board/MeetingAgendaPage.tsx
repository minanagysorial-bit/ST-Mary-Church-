import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Meeting, api } from '../../lib/api';

export const MeetingAgendaPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    api.getMeetings().then(setMeetings).catch(console.error);
  }, []);

  return (
    <DashboardLayout role="board">
      <div className="space-y-8 font-cairo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              أجندة المحاضر والاجتماعات الدوريّة
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">جدول مواعيد اجتماعات مجلس إدارة الكنيسة الموقر واللجان والقرارات الصادرة</p>
          </div>
        </div>

        <div className="space-y-4 animate-fadeIn">
          {meetings.map(m => (
            <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${m.status === 'مكتمل' ? 'bg-slate-50 text-slate-500 border-slate-205' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
                    {m.status}
                  </span>
                  <h3 className="font-tajawal font-extrabold text-base text-[#002366]">{m.title}</h3>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-[#d4af37]" /> {m.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#d4af37]" /> {m.location}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4 text-[#d4af37]" /> عدد الحضور: {m.attendees_count}</span>
                </div>
              </div>

              <button className="bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#002366]/10 transition-all self-start md:self-auto">
                استعراض محضر الاجتماع
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

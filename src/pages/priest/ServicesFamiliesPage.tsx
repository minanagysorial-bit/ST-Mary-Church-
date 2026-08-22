import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Users, Heart, CalendarDays, BookOpen, Plus, MapPin, ChevronLeft, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Family, PrayerRequest, Sermon } from '../../lib/database.types';
import { Link } from 'react-router-dom';

export const ServicesFamiliesPage: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFamilies(),
      api.getPrayerRequests(),
      api.getSermons()
    ])
      .then(([f, p, s]) => {
        setFamilies(f);
        setPrayers(p);
        setSermons(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingPrayers = prayers.filter(p => !p.is_read).length;

  // Timetable
  const pastoralServices = [
    { title: 'القداس الإلهي - الأحد', subtitle: 'الأحد صباحاً - المذبح الرئيسي' },
    { title: 'اجتماع دراسة الكتاب', subtitle: 'الثلاثاء مساءً - قاعة الاجتماعات' },
    { title: 'خدمة المرحلة الإعدادية', subtitle: 'الجمعة ظهراً - مبنى خدمات الشباب' },
    { title: 'قداس عيد الشهيد مارمينا', subtitle: 'الخميس صباحاً - مذبح القديس مارمينا' }
  ];

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة التحكم الرعوية
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              مرحباً بك يا قدس الأب، إليك ملخص الخدمة لهذا اليوم
            </p>
          </div>
        </div>

        {/* Dynamic Bento Box Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total pastoral schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-24 h-1 bg-[#d4af37]" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">إجمالي الخدمات المجدولة</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">٢٤</h4>
              </div>
              <div className="p-2.5 bg-[#002366]/5 rounded-xl">
                <CalendarDays className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold mt-4">
              <span>زيادة ١٥٪ عن الشهر الماضي</span>
            </div>
          </div>

          {/* Pending Prayer Requests */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-24 h-1 bg-amber-400" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">طلبات الصلاة المعلقة</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">
                  {loading ? '...' : String(pendingPrayers).padStart(2, '٠')}
                </h4>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Heart className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold mt-4">
              <span>بحاجة لمراجعة اليوم</span>
            </div>
          </div>
        </div>

        {/* 3-Column main section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Pastoral Families - 1 col width (takes 1st on RTL layout) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#d4af37]" />
              إدارة الأسر الرعوية
            </h3>
            
            <div className="space-y-4 text-xs font-semibold">
              {loading ? (
                <p className="text-slate-400 text-center py-4">جاري تحميل الأسر...</p>
              ) : families.length === 0 ? (
                <p className="text-slate-400 text-center py-4">لا توجد أسر رعوية مسجلة.</p>
              ) : (
                families.map(f => (
                  <div key={f.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl space-y-2 transition-all">
                    <p className="font-bold text-sm text-[#002366]">{f.head_name}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{f.area}</span>
                      </span>
                      <span className={f.last_visit_date ? 'text-emerald-700' : 'text-amber-700'}>
                        {f.last_visit_date ? `آخر زيارة: ${f.last_visit_date}` : 'بحاجة لزيارة'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Mass & Services timetable */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              جدول القداسات والخدمات
            </h3>
            
            <div className="space-y-4">
              {pastoralServices.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/70 hover:bg-slate-55 rounded-xl border border-slate-100 flex justify-between items-center transition-all">
                  <div>
                    <p className="font-bold text-sm text-[#002366]">{s.title}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">{s.subtitle}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Recently added sermons */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
            <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#d4af37]" />
              آخر العظات المضافة
            </h3>
            
            <div className="space-y-4">
              {loading ? (
                <p className="text-slate-400 text-center py-4">جاري التحميل...</p>
              ) : sermons.length === 0 ? (
                <p className="text-slate-400 text-center py-4">لا توجد عظات مضافة.</p>
              ) : (
                sermons.slice(0, 3).map(s => (
                  <div key={s.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                    <span className="bg-[#002366]/5 text-[#d4af37] px-2 py-0.5 rounded text-[10px] font-bold">
                      {s.speaker || 'روحانيات'}
                    </span>
                    <h4 className="font-bold text-sm text-[#002366] mt-2">{s.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {new Date(s.sermon_date || s.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Users,
  Church,
  UserCheck,
  Award,
  CalendarCheck,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Shield,
  Layers,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, type Family, type Profile, type ChurchServiceCategory, type ChurchService } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_SERVICE_CATEGORIES: ChurchServiceCategory[] = [
  'ابتدائي بنين',
  'ابتدائي بنات',
  'فتيان إعدادي',
  'فتيات إعدادي',
  'شباب ثانوي',
  'شابات ثانوي',
  'خدمة شباب جامعة',
  'خدمة شابات جامعة',
  'خريجين'
];

export const ServiceLeaderDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Stats
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedFamilies, fetchedProfiles, fetchedRelations] = await Promise.all([
        api.getFamilies(),
        api.getProfiles(),
        api.getFamilyServantsForAll().catch(() => [])
      ]);

      const relMap: Record<string, string[]> = {};
      fetchedRelations.forEach(r => {
        if (!relMap[r.family_id]) relMap[r.family_id] = [];
        relMap[r.family_id].push(r.servant_id);
      });

      setFamilies(fetchedFamilies);
      setProfiles(fetchedProfiles);
      setFamilyServantsMap(relMap);
    } catch (err) {
      console.error('Error fetching service leader data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allServants = profiles.filter(p => p.role === 'servant' || p.role === 'service_leader');
  const allPriests = profiles.filter(p => p.role === 'priest');

  // Filtered families
  const sundaySchoolFamilies = families.filter(f => f.family_type === 'sunday_school');
  const filteredFamilies = selectedCategory === 'الكل'
    ? sundaySchoolFamilies
    : sundaySchoolFamilies.filter(f => f.stage?.includes(selectedCategory) || f.area?.includes(selectedCategory));

  return (
    <DashboardLayout role="service_leader">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 border border-[#d4af37]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fed65b]/20 border border-[#fed65b]/40 text-[#fed65b] text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>لوحة أمين الخدمة الرسمية</span>
            </div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-white">
              أهلاً بك يا أستاذ {profile?.full_name || 'أمين الخدمة'} 🌟
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-xl leading-relaxed">
              إدارة خدمات وأسر التربية الكنسية، إنشاء الفصول وتحديد السن، وتعيين الخدام المسؤولين ومتابعة الحضور والافتقاد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/service-leader/families"
              className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>إنشاء أسرة / فصل جديد</span>
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">إجمالي الفصول والأسر</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{sundaySchoolFamilies.length}</h4>
              </div>
              <div className="p-3 bg-[#002366]/5 rounded-2xl text-[#002366]">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>موزعة على كافة المراحل</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">الخدام المسجلون</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{allServants.length}</h4>
              </div>
              <div className="p-3 bg-[#fed65b]/10 rounded-2xl text-[#002366]">
                <Users className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-4">
              خدام وأمناء الخدمات النشطون
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">الآباء الكهنة المشرفون</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">{allPriests.length}</h4>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
                <Church className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-4">
              متابعة وإرشاد روحي مستمر
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-slate-400 font-bold mb-1">المخدومون والأولاد</p>
                <h4 className="font-tajawal text-3xl font-extrabold text-[#002366]">
                  {sundaySchoolFamilies.reduce((sum, f) => sum + (f.members_count || 0), 0)}
                </h4>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-4">
              مسجلون في فصول الأسر
            </p>
          </div>
        </div>

        {/* 9 Approved Church Services Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-tajawal text-xl font-bold text-[#00174a]">
              أقسام وقطاعات الخدمة المعتمدة
            </h2>
            <Link
              to="/service-leader/families"
              className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
            >
              <span>إدارة كافة الأسر</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEFAULT_SERVICE_CATEGORIES.map(category => {
              const count = sundaySchoolFamilies.filter(f => f.stage?.includes(category) || f.area?.includes(category)).length;
              return (
                <div
                  key={category}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl">diversity_3</span>
                      </div>
                      <span className="bg-[#002366]/10 text-[#002366] text-xs font-extrabold px-3 py-1 rounded-full border border-[#002366]/20">
                        {count} فصول وأسر
                      </span>
                    </div>

                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      {category}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      يشرف عليها كاهن وأمين خدمة، وتضم فصول وأسر التربية الكنسية والخدام المخصصين.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/service-leader/families?category=${encodeURIComponent(category)}`}
                      className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
                    >
                      <span>عرض فصول {category}</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <Link
            to="/servant/attendance"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">تفقد الحضور الأسبوعي</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">تسجيل ومتابعة حضور المخدومين</p>
            </div>
          </Link>

          <Link
            to="/servant/points"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">نقاط مدارس الأحد 🌟</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">لوحة الشرف وتنافس الفصول</p>
            </div>
          </Link>

          <Link
            to="/servant/visitations"
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-tajawal text-sm font-bold text-[#00174a]">سجل الافتقاد والزيارات</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">متابعة الغائبين والحالات الخاصة</p>
            </div>
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
};

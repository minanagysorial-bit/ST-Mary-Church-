import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Users, Church, Calendar, Search, MapPin, Phone, 
  CheckCircle2, ExternalLink, Filter, ShieldCheck, Heart, 
  ChevronDown, ChevronUp, UserCheck, AlertTriangle, Layers, Stars
} from 'lucide-react';
import { api, type Family, type FamilyMember, type Profile, type ChurchServiceCategory } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ALL_CHURCH_SERVICE_CATEGORIES, 
  getPriestAssignedServices 
} from '../../lib/servicesAssignmentHelper';

export const ServicesFamiliesPage: React.FC = () => {
  const { profile } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, FamilyMember[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedService, setSelectedService] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allFamilies, profilesData, settings] = await Promise.all([
        api.getFamilies(),
        api.getProfiles(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);

      setSiteSettings(settings);

      // Profiles Map
      const profMap: Record<string, Profile> = {};
      profilesData.forEach(p => { profMap[p.id] = p; });
      setProfiles(profMap);

      // Fetch Family Servants
      const relMap: Record<string, string[]> = {};
      try {
        const relations = await api.getFamilyServantsForAll();
        relations.forEach(r => {
          if (!relMap[r.family_id]) relMap[r.family_id] = [];
          relMap[r.family_id].push(r.servant_id);
        });
      } catch (err) {
        console.warn('Family servants load notice:', err);
      }
      setFamilyServantsMap(relMap);

      // Fetch Members for all families
      const membersPromises = allFamilies.map(f => api.getFamilyMembers(f.id));
      const membersResults = await Promise.all(membersPromises);
      const mMap: Record<string, FamilyMember[]> = {};
      allFamilies.forEach((f, idx) => {
        mMap[f.id] = membersResults[idx] || [];
      });
      setFamilyMembers(mMap);

      setFamilies(allFamilies);

      // Auto-set selectedService if priest is assigned to specific services
      if (profile?.id) {
        const myAssigned = getPriestAssignedServices(profile.id, settings);
        if (myAssigned.length > 0) {
          setSelectedService(myAssigned[0]);
        }
      }
    } catch (err) {
      console.error('Error loading priest services families:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignedServices = profile?.id ? getPriestAssignedServices(profile.id, siteSettings) : [];

  // Filter families by service & search
  const filteredFamilies = families.filter(f => {
    const matchService = selectedService === 'الكل' || 
      (f.stage && f.stage.includes(selectedService)) || 
      (f.area && f.area.includes(selectedService)) ||
      (f.notes && f.notes.includes(selectedService));
      
    const kids = familyMembers[f.id] || [];
    const kidsText = kids.map(k => k.full_name).join(' ');
    const matchSearch = !searchTerm.trim() ||
      f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kidsText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.address && f.address.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchService && matchSearch;
  });

  // Calculate totals
  const activeFilteredKids = filteredFamilies.reduce((acc, f) => acc + (familyMembers[f.id]?.length || 0), 0);

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] via-[#002366] to-[#00174a] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#d4af37]/30">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fed65b] text-xs font-bold">
              <Church className="w-4 h-4 text-[#fed65b]" />
              <span>رعاية ومتابعة فصول وأسر التربية الكنسية</span>
            </div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-white">
              متابعة الخدمات وفصول الأسر الرعوية ⛪
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-2xl leading-relaxed">
              متابعة الأسر والمخدومين، تفقد كشوف الحضور والغياب، ومراجعة افتقاد الخدام لجميع فصول الكنيسة.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/servant/attendance"
              className="bg-[#fed65b] hover:bg-amber-300 text-[#00174a] font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>تفقد الحضور والغياب</span>
              <CheckCircle2 className="w-4 h-4 text-[#00174a]" />
            </Link>
            <Link
              to="/priest/member-visitation"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>سجل الافتقاد</span>
              <Heart className="w-4 h-4 text-[#fed65b]" />
            </Link>
            <Link
              to="/servant/visitation-map"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span>خريطة العناوين 🗺️</span>
            </Link>
          </div>
        </div>

        {/* Assigned Services Banner for Priest */}
        {assignedServices.length > 0 && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h3 className="font-tajawal text-sm font-extrabold text-amber-950">
                  الخدمات المسندة لقدسك من إدارة الكنيسة:
                </h3>
                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  قدسك مسند إليك الإشراف الرعوي على هذه القطاعات، ويمكنك متابعة أي خدمة أخرى في أي وقت.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignedServices.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedService(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedService === cat
                      ? 'bg-[#002366] text-[#fed65b] shadow-sm'
                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs text-slate-500 font-bold">إجمالي الأسر في العرض</p>
            <p className="text-2xl font-extrabold text-[#00174a] font-tajawal">{filteredFamilies.length} أسرة</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs text-slate-500 font-bold">إجمالي المخدومين (الأبناء)</p>
            <p className="text-2xl font-extrabold text-blue-800 font-tajawal">{activeFilteredKids} مخدوم</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs text-slate-500 font-bold">القطاع المعروض حالياً</p>
            <p className="text-lg font-extrabold text-amber-700 font-tajawal truncate">{selectedService}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <p className="text-xs text-slate-500 font-bold">إجمالي أسر الكنيسة المسجلة</p>
            <p className="text-2xl font-extrabold text-emerald-800 font-tajawal">{families.length} أسرة</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          
          {/* Services Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedService('الكل')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedService === 'الكل'
                  ? 'bg-[#002366] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              جميع الخدمات والأسر ({families.length})
            </button>
            {ALL_CHURCH_SERVICE_CATEGORIES.map(c => (
              <button
                key={c.category}
                onClick={() => setSelectedService(c.category)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedService === c.category
                    ? 'bg-[#002366] text-[#fed65b] shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم الأسرة أو المخدوم أو المنطقة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
            />
          </div>
        </div>

        {/* Families List */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل سجل الأسر والخدمات...</p>
          </div>
        ) : filteredFamilies.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">لا توجد أسر مسجلة في هذا القطاع</h3>
            <p className="text-xs text-slate-400">يمكن لأمناء الخدمة أو الأدمن إضافة فصول وأسر من لوحة التحكم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFamilies.map((fam) => {
              const kids = familyMembers[fam.id] || [];
              const servantIds = familyServantsMap[fam.id] || [];
              const assignedServants = servantIds.map(id => profiles[id]).filter(Boolean);
              const isExpanded = expandedFamilyId === fam.id;

              return (
                <div
                  key={fam.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#002366]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#002366]/10 text-[#002366] font-extrabold text-[10px]">
                          {fam.stage || fam.area || 'أسرة تربية كنسية'}
                        </span>
                        <h3 className="font-tajawal text-base font-extrabold text-slate-900">
                          {fam.head_name}
                        </h3>
                        {fam.address && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                            <span className="truncate">{fam.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-2xl shrink-0">
                        <span className="text-[10px] text-blue-800 font-bold block">المخدومين</span>
                        <span className="text-base font-extrabold text-blue-900 font-tajawal">{kids.length}</span>
                      </div>
                    </div>

                    {/* Assigned Servants */}
                    <div className="space-y-1 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#002366]" />
                        <span>الخدام المسؤولون ({assignedServants.length}):</span>
                      </span>
                      {assignedServants.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-bold">لم يتم تعيين خدام لهذه الأسرة بعد</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {assignedServants.map(s => (
                            <span key={s!.id} className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-800 border border-slate-200 shadow-xs">
                              {s!.full_name} {s!.phone ? `(${s!.phone})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expandable Kids List */}
                    {kids.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedFamilyId(isExpanded ? null : fam.id)}
                          className="text-[11px] font-bold text-[#002366] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'إخفاء أسماء المخدومين' : `عرض أسماء المخدومين (${kids.length})`}</span>
                        </button>

                        {isExpanded && (
                          <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-1.5 animate-scale-in text-xs">
                            {kids.map((kid, idx) => (
                              <div key={kid.id || idx} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0 font-medium">
                                <span className="font-bold text-slate-800">{kid.full_name}</span>
                                {kid.phone && (
                                  <span className="text-[10px] text-slate-500 font-mono" dir="ltr">{kid.phone}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Card Bottom Quick Actions for Priest */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to="/servant/attendance"
                      className="flex-1 bg-[#002366] hover:bg-[#00113a] text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#fed65b]" />
                      <span>تفقد الحضور</span>
                    </Link>
                    <Link
                      to="/priest/member-visitation"
                      className="bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs py-2 px-3 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-amber-800" />
                      <span>افتقاد</span>
                    </Link>
                    <Link
                      to="/servant/visitation-map"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-2.5 rounded-xl transition-colors cursor-pointer"
                      title="خريطة العنوان"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-700" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

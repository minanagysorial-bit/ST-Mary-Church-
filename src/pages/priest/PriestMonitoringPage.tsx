import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type ChurchService, type ServiceGroup, type VisitationLog, type Profile } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Church,
  Users,
  HeartHandshake,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronLeft,
  Activity,
  Layers,
  Phone,
  ShieldCheck,
  User,
  CalendarDays,
  UserCheck
} from 'lucide-react';

export const PriestMonitoringPage: React.FC = () => {
  const { profile } = useAuth();
  const [services, setServices] = useState<ChurchService[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [logs, setLogs] = useState<VisitationLog[]>([]);
  const [servants, setServants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedServantId, setSelectedServantId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('month'); // all, week, month, year
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expand states
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [expandedServants, setExpandedServants] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesData, groupsData, logsData] = await Promise.all([
        api.getChurchServices(),
        api.getServiceGroups(),
        api.getVisitationLogs()
      ]);
      setServices(servicesData);
      setGroups(groupsData);
      setLogs(logsData);

      // Fetch Servants directly since it's an admin/priest route
      const { data: servantsData } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['servant', 'admin', 'priest']); // Anyone who can visit
      
      if (servantsData) {
        setServants(servantsData as Profile[]);
      }

      if (servicesData.length > 0) {
        setExpandedServices({ [servicesData[0].id]: true });
      }
    } catch (err: any) {
      console.error('Error fetching priest monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceExpand = (id: string) => {
    setExpandedServices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleServantExpand = (id: string) => {
    setExpandedServants(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats Calculations
  const now = new Date();
  const thisMonthLogs = logs.filter(l => {
    const d = new Date(l.visit_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const getDaysAgo = (dateStr: string) => {
    const diffTime = Math.abs(now.getTime() - new Date(dateStr).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Date Filtering Logic
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const logDate = new Date(log.visit_date);
      if (dateRange === 'week') {
        return getDaysAgo(log.visit_date) <= 7;
      } else if (dateRange === 'month') {
        return getDaysAgo(log.visit_date) <= 30;
      } else if (dateRange === 'year') {
        return getDaysAgo(log.visit_date) <= 365;
      }
      return true;
    });
  };

  const activeLogs = getFilteredLogs();

  return (
    <DashboardLayout role={profile?.role === 'admin' ? 'admin' : 'priest'}>
      <div className="space-y-8 font-cairo">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] to-[#002366] p-6 rounded-3xl text-white shadow-xl border border-[#d4af37]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#fed65b]">
                <Church className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-2xl text-[#fed65b]">شاشة مراقبة الخدمات والافتقاد</h1>
            </div>
            <p className="text-slate-300 text-sm">متابعة شاملة لقدس الأب الكاهن لجميع المراحل، الأسر، ونشاط الخدام الرعوي</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-5 h-5 text-[#fed65b]" />
            <span className="text-sm font-semibold">قدس الأب المتابع</span>
          </div>
        </div>

        {/* Bento Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">إجمالي مراحل الخدمة</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{services.length} مرحلة</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">عدد أسر التربية الكنسية</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{groups.length} أسرة</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">الافتقادات هذا الشهر</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{thisMonthLogs.length} افتقاد</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">نشاط الخدام</p>
              <h3 className="text-2xl font-bold font-tajawal text-[#00123a]">{servants.length} خادم</h3>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث..."
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#002366]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 ml-1 hidden sm:block" />
            
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[#00123a] outline-none min-w-[140px] flex-1 md:flex-none"
            >
              <option value="all">جميع المراحل</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.gender})</option>
              ))}
            </select>

            <select
              value={selectedServantId}
              onChange={(e) => setSelectedServantId(e.target.value)}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[#00123a] outline-none min-w-[140px] flex-1 md:flex-none"
            >
              <option value="all">جميع الخدام</option>
              {servants.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[#00123a] outline-none min-w-[110px] flex-1 md:flex-none"
            >
              <option value="week">آخر 7 أيام</option>
              <option value="month">الشهر الحالي</option>
              <option value="year">السنة الحالية</option>
              <option value="all">الكل</option>
            </select>
          </div>
        </div>

        {/* Servant Visitation Performance & Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-tajawal font-bold text-lg text-[#00123a]">أداء الخدام وسجل الافتقادات</h2>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold">جاري تحميل بيانات المراقبة...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servants
                .filter(s => selectedServantId === 'all' || s.id === selectedServantId)
                .filter(s => s.full_name.includes(searchTerm))
                .sort((a,b) => {
                  // Sort by most recent active
                  const aLogs = activeLogs.filter(l => l.servant_id === a.id);
                  const bLogs = activeLogs.filter(l => l.servant_id === b.id);
                  const aDate = aLogs.length > 0 ? new Date(aLogs[0].visit_date).getTime() : 0;
                  const bDate = bLogs.length > 0 ? new Date(bLogs[0].visit_date).getTime() : 0;
                  return bDate - aDate; // Descending
                })
                .map(servant => {
                  const servantLogs = activeLogs.filter(l => l.servant_id === servant.id);
                  const lastVisit = servantLogs.length > 0 ? servantLogs[0] : null;
                  const daysSinceVisit = lastVisit ? getDaysAgo(lastVisit.visit_date) : null;
                  const isExpanded = !!expandedServants[servant.id];

                  // Status determination
                  let statusColor = "bg-rose-100 text-rose-800 border-rose-200";
                  let statusText = "خامل / يتطلب متابعة";
                  let Icon = AlertTriangle;

                  if (daysSinceVisit !== null) {
                    if (daysSinceVisit <= 7) {
                      statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      statusText = "نشط (آخر أسبوع)";
                      Icon = CheckCircle2;
                    } else if (daysSinceVisit <= 14) {
                      statusColor = "bg-amber-100 text-amber-800 border-amber-200";
                      statusText = "متوسط (أسبوعين)";
                      Icon = Clock;
                    }
                  }

                  return (
                    <div key={servant.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-[#002366]/30 transition-all">
                      <div 
                        onClick={() => toggleServantExpand(servant.id)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 shrink-0 rounded-full bg-slate-100 flex flex-col items-center justify-center font-bold text-slate-500 text-sm border-2 border-white shadow-sm overflow-hidden relative">
                            {servant.full_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-tajawal font-bold text-[#00123a] text-lg leading-tight">{servant.full_name}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="font-semibold text-slate-500">{servantLogs.length} افتقادات بالمدة المحددة</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${statusColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {statusText}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#002366]/5 group-hover:text-[#002366] transition-colors">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Timeline */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-2 sm:p-6 animate-fadeIn">
                          {servantLogs.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white text-slate-500 font-bold text-sm">
                              لا يوجد سجل افتقادات لهذا الخادم في المدة المحددة.
                            </div>
                          ) : (
                            <div className="relative border-r-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-4">
                              {servantLogs.map((log, idx) => (
                                <div key={log.id} className="relative pr-6">
                                  {/* Timeline Node */}
                                  <div className="absolute top-1 right-[-9px] w-4 h-4 rounded-full bg-white border-2 border-[#d4af37] shadow-sm"></div>
                                  
                                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-[#002366]/30 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-[#002366]">افتفد: {log.member_name}</span>
                                        <span className="px-2 py-0.5 bg-[#00174a] text-[#fed65b] text-[10px] rounded-lg font-bold">
                                          {log.visit_type}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span dir="ltr">{new Date(log.visit_date).toLocaleDateString('ar-EG')}</span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 leading-relaxed font-medium">
                                      {log.notes || 'لا يوجد ملاحظات مسجلة لهذا الافتقاد.'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

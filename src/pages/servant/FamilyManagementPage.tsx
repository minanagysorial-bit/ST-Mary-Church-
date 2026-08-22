import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Users, Check, MapPin, Search, X, PlusCircle, Church, Calendar, ChevronDown, ChevronUp, UserCircle, Settings, Trash2
} from 'lucide-react';
import { api, type Family, type FamilyMember, type FamilyServant, type Profile } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type FamilyTabType = 'church' | 'sunday_school';

export const FamilyManagementPage: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  
  const [activeTab, setActiveTab] = useState<FamilyTabType>('sunday_school');

  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, FamilyMember[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Servant permissions check
  const canManageFamilies = profile && (
    ['admin', 'super_admin', 'priest'].includes(profile.role) || 
    hasPermission('create_families')
  );

  // Family Servants Mapping state
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [showManageServantsModal, setShowManageServantsModal] = useState(false);
  const [selectedServantsForNewFamily, setSelectedServantsForNewFamily] = useState<string[]>([]);
  const [selectedServantsForEditFamily, setSelectedServantsForEditFamily] = useState<string[]>([]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  // Modals Visibility
  const [showAddMakhdoumModal, setShowAddMakhdoumModal] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  
  // Selection
  const [targetFamily, setTargetFamily] = useState<Family | null>(null);

  // Form States - New Family
  const [familyHeadName, setFamilyHeadName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyArea, setFamilyArea] = useState('');
  const [familyAddress, setFamilyAddress] = useState('');
  const [familyNotes, setFamilyNotes] = useState('');

  // Form States - New Makhdoum (FamilyMember)
  const [makhdoumName, setMakhdoumName] = useState('');
  const [makhdoumAge, setMakhdoumAge] = useState('');
  const [makhdoumStage, setMakhdoumStage] = useState('ابتدائي');
  const [makhdoumPhone, setMakhdoumPhone] = useState('');
  const [makhdoumPhone2, setMakhdoumPhone2] = useState('');
  const [makhdoumAddress, setMakhdoumAddress] = useState('');
  const [makhdoumBirthDate, setMakhdoumBirthDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all to simplify local filtering
      const fetchedFamilies = await api.getFamilies();
      
      const membersPromises = fetchedFamilies.map(f => api.getFamilyMembers(f.id));
      const membersResults = await Promise.all(membersPromises);
      
      const membersMap: Record<string, FamilyMember[]> = {};
      fetchedFamilies.forEach((f, index) => {
        membersMap[f.id] = membersResults[index];
      });

      const profilesData = await api.getProfiles();
      const profMap: Record<string, Profile> = {};
      if (profilesData) {
        profilesData.forEach(p => { profMap[p.id] = p; });
      }

      // Fetch family servants relations (wrapped in try/catch to prevent crash if table not created yet)
      const relationsMap: Record<string, string[]> = {};
      try {
        const familyServantsRelations = await api.getFamilyServantsForAll();
        familyServantsRelations.forEach(rel => {
          if (!relationsMap[rel.family_id]) {
            relationsMap[rel.family_id] = [];
          }
          relationsMap[rel.family_id].push(rel.servant_id);
        });
      } catch (tableErr) {
        console.warn("family_servants table may not exist yet:", tableErr);
      }

      setFamilies(fetchedFamilies);
      setFamilyMembers(membersMap);
      setProfiles(profMap);
      setFamilyServantsMap(relationsMap);
    } catch (err: any) {
      console.error(err);
      setError('خطأ في الاتصال بقاعدة البيانات؛ يرجى تحديث الصفحة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFamilies = families.filter(f => 
    f.family_type === activeTab &&
    (f.head_name.includes(searchQuery) ||
    f.area.includes(searchQuery) ||
    (f.notes && f.notes.includes(searchQuery)))
  );

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyHeadName.trim() || !familyAddress.trim() || !familyArea.trim()) {
      setError('برجاء ملء الحقول المطلوبة (اسم العائلة/الرب، المنطقة، العنوان)');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const newFamily = await api.createFamily({
        family_type: activeTab,
        head_name: familyHeadName,
        phone: familyPhone || null,
        area: familyArea,
        address: familyAddress,
        members_count: 0,
        notes: familyNotes || null,
        assigned_servant_id: profile?.id || null,
        service_area_id: null,
        last_visit_date: null
      });

      // Save selected servants to family_servants many-to-many table
      if (selectedServantsForNewFamily.length > 0) {
        const promises = selectedServantsForNewFamily.map(servantId => 
          api.assignServantToFamily(newFamily.id, servantId)
        );
        await Promise.all(promises);
      }

      setSuccess('تم إنشاء الأسرة بنجاح!');
      setShowAddFamilyModal(false);
      
      familyFormReset();
      setSelectedServantsForNewFamily([]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل حفظ الأسرة الجديدة.');
    }
  };

  const familyFormReset = () => {
    setFamilyHeadName('');
    setFamilyPhone('');
    setFamilyArea('');
    setFamilyAddress('');
    setFamilyNotes('');
  }

  const handleCreateMakhdoum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makhdoumName.trim() || !targetFamily) {
      setError('برجاء ملء الحقول الأساسية (الاسم بالكامل)');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      await api.createFamilyMember({
        family_id: targetFamily.id,
        full_name: makhdoumName,
        phone: makhdoumPhone || null,
        phone_2: makhdoumPhone2 || null,
        address: makhdoumAddress || null,
        birth_date: makhdoumBirthDate || null,
        age: makhdoumAge ? parseInt(makhdoumAge) : null,
        sunday_school_stage: makhdoumStage,
        notes: null
      });

      await api.updateFamily(targetFamily.id, {
        members_count: (targetFamily.members_count || 0) + 1
      });

      setSuccess(`تم إضافة الفرد بنجاح إلى أسرة أ/ ${targetFamily.head_name}`);
      setShowAddMakhdoumModal(false);
      
      setMakhdoumName('');
      setMakhdoumAge('');
      setMakhdoumPhone('');
      setMakhdoumPhone2('');
      setMakhdoumAddress('');
      setMakhdoumBirthDate('');
      setMakhdoumStage('ابتدائي');
      setTargetFamily(null);

      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل الإضافة.');
    }
  };

  const handleDeleteMember = async (memberId: string, family: Family) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفرد؟')) return;
    try {
      await api.deleteFamilyMember(memberId);
      await api.updateFamily(family.id, {
        members_count: Math.max((family.members_count || 1) - 1, 0)
      });
      fetchData();
    } catch (err: any) {
      alert('فشل عملية الحذف: ' + err.message);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الأسرة نهائياً بجميع مخدوميها؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.deleteFamily(familyId);
      setFamilies(prev => prev.filter(f => f.id !== familyId));
      setSuccess('تم حذف الأسرة بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حذف الأسرة');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openMakhdoumModal = (family: Family) => {
    setTargetFamily(family);
    setShowAddMakhdoumModal(true);
    setError(null);
    setSuccess(null);
  };

  const openManageServantsModal = (family: Family) => {
    setTargetFamily(family);
    setSelectedServantsForEditFamily(familyServantsMap[family.id] || []);
    setShowManageServantsModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveFamilyServants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFamily) return;

    try {
      setError(null);
      setSuccess(null);
      
      const originalServantIds = familyServantsMap[targetFamily.id] || [];
      const toAdd = selectedServantsForEditFamily.filter(id => !originalServantIds.includes(id));
      const toRemove = originalServantIds.filter(id => !selectedServantsForEditFamily.includes(id));

      const addPromises = toAdd.map(servantId => api.assignServantToFamily(targetFamily.id, servantId));
      const removePromises = toRemove.map(servantId => api.removeServantFromFamily(targetFamily.id, servantId));

      await Promise.all([...addPromises, ...removePromises]);

      setSuccess('تم تحديث قائمة الخدام بنجاح!');
      setShowManageServantsModal(false);
      setTargetFamily(null);
      setSelectedServantsForEditFamily([]);
      
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'فشل تحديث الخدام.');
    }
  };

  const toggleExpandFamily = (id: string) => {
    setExpandedFamilyId(expandedFamilyId === id ? null : id);
  };

  return (
    <DashboardLayout role={profile?.role as any || 'servant'}>
      <div className="space-y-6 font-cairo">

        {/* Alerts */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold p-4 rounded-xl flex items-center gap-2">
            <X className="w-5 h-5 text-rose-600 shrink-0 cursor-pointer" onClick={() => setError(null)} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold p-4 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 cursor-pointer" onClick={() => setSuccess(null)} />
            <span>{success}</span>
          </div>
        )}

        {/* Hero Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#002366] to-[#00123a] border border-[#d4af37]/30 flex items-center justify-center text-[#fed65b] shadow-sm">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-tajawal font-extrabold text-2xl text-[#002366]">إدارة الأسر والمخدومين</h1>
            <p className="text-sm text-slate-500 font-bold">تابع واهتم بأسر مدارس الأحد الموكلة إليك.</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mt-6">
          <div className="relative max-w-sm w-full font-cairo">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث عن أسرة مدارس أحد..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-2xl pr-12 pl-4 py-3 text-sm outline-none shadow-sm transition-all font-semibold text-slate-800"
            />
          </div>
          {canManageFamilies && (
            <button 
              onClick={() => { setShowAddFamilyModal(true); setError(null); setSuccess(null); familyFormReset(); }}
              className="bg-gradient-to-r from-[#002366] to-[#00123a] text-[#fed65b] font-bold text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 duration-200 shrink-0 w-full md:w-auto"
            >
              <PlusCircle className="w-5 h-5" />
              <span>إضافة أسرة جديدة</span>
            </button>
          )}
        </div>

        {/* Grid layout of Families */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-bold space-y-3">
              <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>جاري تحميل كشوف الأسر...</p>
            </div>
          ) : filteredFamilies.length === 0 ? (
             <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mb-2" />
              لا توجد كشوف مسجلة في هذا التصنيف مطابقة لبحثك.
            </div>
          ) : (
            filteredFamilies.map((f, idx) => {
              const isExpanded = expandedFamilyId === f.id;
              const members = familyMembers[f.id] || [];
              const servant = f.assigned_servant_id ? profiles[f.assigned_servant_id] : null;

              return (
                <div key={f.id} className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#002366] ring-1 ring-[#002366]' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                  {/* Family Card Header */}
                  <div 
                    title="انقر لعرض التفاصيل والأفراد"
                    className="p-5 cursor-pointer flex items-start gap-4 transition-colors hover:bg-slate-50"
                    onClick={() => toggleExpandFamily(f.id)}
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#00123a]/5 to-[#002366]/10 flex items-center justify-center text-[#002366] border border-[#002366]/10">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="flex-1 space-y-2 text-right">
                      <div className="flex justify-between items-start">
                        <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                          {`أسرة فصل: ${f.head_name}`}
                        </h3>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {f.area}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#fed65b]/20 text-[#735c00] px-2.5 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                          {f.members_count} أفراد مسجلين
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-fadeIn">
                      
                      {/* Family Meta Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold">الخدام المسؤولين عن الأسرة / الافتقاد</span>
                          <div className="font-bold text-sm text-[#002366] flex flex-wrap gap-2 items-center">
                            <UserCircle className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="flex-1">
                              {(familyServantsMap[f.id] || []).map(id => profiles[id]?.full_name).filter(Boolean).join('، ') || 'غير محدد'}
                            </span>
                            {canManageFamilies && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openManageServantsModal(f); }}
                                  className="text-xs text-[#d4af37] hover:text-[#bca031] font-bold hover:underline pr-2 flex items-center gap-1 border-r border-slate-200"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  <span>تعديل الخدام</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFamily(f.id); }}
                                  className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:underline pr-2 flex items-center gap-1 border-r border-slate-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف الأسرة</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold">تاريخ آخر افتقاد</span>
                          <span className="font-bold text-sm text-emerald-600 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {f.last_visit_date ? new Date(f.last_visit_date).toLocaleDateString('ar-EG') : 'لم يتم تسجيل افتقاد'}
                          </span>
                        </div>
                      </div>

                      {/* Members List */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-tajawal font-bold text-md text-[#00174a]">
                            الأفراد المنتمين للأسرة ({members.length})
                          </h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openMakhdoumModal(f); }}
                            className="bg-white border-2 border-[#002366] text-[#002366] hover:bg-[#002366] hover:text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all w-fit"
                          >
                            <PlusCircle className="w-4 h-4" />
                            إضافة فرد
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {members.map(member => (
                            <div key={member.id} className="bg-white p-4 justify-between border-l-4 border-l-[#d4af37] border-slate-200 border rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2 group hover:shadow-md transition-all shadow-sm">
                              <div>
                                <div className="font-bold text-sm text-[#00174a]">{member.full_name}</div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold mt-1.5">
                                  <span>{member.age ? `${member.age} سنة` : 'عمر غير مسجل'}</span>
                                  {member.birth_date && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span>ميلاد: {new Date(member.birth_date).toLocaleDateString('ar-EG')}</span>
                                    </>
                                  )}
                                  {activeTab === 'sunday_school' && member.sunday_school_stage && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-[#002366]">{member.sunday_school_stage}</span>
                                    </>
                                  )}
                                  {member.phone && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span dir="ltr">تليفون: {member.phone}</span>
                                    </>
                                  )}
                                  {member.phone_2 && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span dir="ltr">إضافي: {member.phone_2}</span>
                                    </>
                                  )}
                                  {member.address && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <span>العنوان: {member.address}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-start sm:justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
                                <button className="p-2 text-rose-500 hover:bg-rose-50 bg-white border border-rose-100 rounded-lg shadow-sm" title="حذف" onClick={() => handleDeleteMember(member.id, f)}>
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {members.length === 0 && (
                            <div className="text-center py-6 text-sm text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-white">
                              لم يتم تسجيل أفراد مسجلين بعد.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Add Target Family */}
        {showAddFamilyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
              <div className="p-6 bg-gradient-to-r from-[#00123a] to-[#002366] text-white flex justify-between items-center relative overflow-hidden">
                <div className="z-10">
                  <h3 className="font-tajawal font-bold text-xl text-[#fed65b]">
                    إنشاء أسرة مدارس أحد جديدة
                  </h3>
                  <p className="text-xs text-white/80 mt-1">يُرجى إدخال بيانات الأسرة والمتابعة</p>
                </div>
                <button 
                  onClick={() => setShowAddFamilyModal(false)}
                  className="z-10 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                <form onSubmit={handleCreateFamily} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">
                      اسم الأسرة / الفصل الدراسي *
                    </label>
                    <input
                      type="text"
                      required
                      value={familyHeadName}
                      onChange={e => setFamilyHeadName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                      placeholder="مثال: أسرة مارمينا / أولى إعدادي"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">
                      هاتف التواصل الرئيسي للأسرة (اختياري)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={familyPhone}
                      onChange={e => setFamilyPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">
                        الصف الدراسي / سنة كام *
                      </label>
                      <input
                        type="text"
                        required
                        value={familyArea}
                        onChange={e => setFamilyArea(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                        placeholder="مثال: أولى إعدادي / ثاني إعدادي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">
                        موقع الاجتماع / الفصل داخل الكنيسة *
                      </label>
                      <input
                        type="text"
                        required
                        value={familyAddress}
                        onChange={e => setFamilyAddress(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                        placeholder="مثال: مبنى الخدمات - الدور الثاني"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">تحديد الخدام المسؤولين عن الأسرة</label>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50">
                      {Object.values(profiles)
                        .filter(p => ['servant', 'admin', 'priest'].includes(p.role))
                        .map(servant => {
                          const isChecked = selectedServantsForNewFamily.includes(servant.id);
                          return (
                            <label key={servant.id} className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedServantsForNewFamily(prev => prev.filter(id => id !== servant.id));
                                  } else {
                                    setSelectedServantsForNewFamily(prev => [...prev, servant.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#002366] focus:ring-[#002366] border-slate-300"
                              />
                              <span>{servant.full_name} ({servant.role === 'servant' ? 'خادم' : servant.role === 'priest' ? 'كاهن' : 'أدمن'})</span>
                            </label>
                          );
                        })}
                      {Object.values(profiles).filter(p => ['servant', 'admin', 'priest'].includes(p.role)).length === 0 && (
                        <p className="text-xs text-slate-400 text-center font-bold">لا يوجد خدام مسجلين حالياً</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">ملاحظات أو احتياجات أسرية</label>
                    <textarea
                      value={familyNotes}
                      onChange={e => setFamilyNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all h-24 resize-none bg-slate-50 font-semibold"
                      placeholder="حالة خاصة، افتقاد مكثف..."
                    ></textarea>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setShowAddFamilyModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">إلغاء</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-[#002366] hover:bg-[#00174a] text-white font-bold rounded-xl transition-all shadow-md">تدشين الكشف</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Makhdoum */}
        {showAddMakhdoumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
              <div className="p-6 bg-gradient-to-r from-[#00123a] to-[#002366] text-white flex justify-between items-center">
                <div>
                  <h3 className="font-tajawal font-bold text-xl text-[#fed65b]">إضافة فرد جديد</h3>
                  <p className="text-xs text-white/80 mt-1">تضمين فرد إلى أسرة أ/ {targetFamily?.head_name}</p>
                </div>
                <button 
                  onClick={() => setShowAddMakhdoumModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                <form onSubmit={handleCreateMakhdoum} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">اسم الفرد بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={makhdoumName}
                      onChange={e => setMakhdoumName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">تاريخ الميلاد</label>
                      <input
                        type="date"
                        value={makhdoumBirthDate}
                        onChange={e => setMakhdoumBirthDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">العمر / السن (تلقائي/يدوي)</label>
                      <input
                        type="number"
                        value={makhdoumAge}
                        onChange={e => setMakhdoumAge(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                        placeholder="العمر بالسنوات"
                      />
                    </div>
                  </div>

                  {activeTab === 'sunday_school' && (
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">المرحلة الدراسية</label>
                      <select
                        value={makhdoumStage}
                        onChange={e => setMakhdoumStage(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold text-[#00123a]"
                      >
                        <option value="حضانة">حضانة</option>
                        <option value="ابتدائي">ابتدائي</option>
                        <option value="إعدادي">إعدادي</option>
                        <option value="ثانوي">ثانوي</option>
                        <option value="جامعة">جامعة وما بعده</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-2">العنوان السكني</label>
                    <input
                      type="text"
                      value={makhdoumAddress}
                      onChange={e => setMakhdoumAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold"
                      placeholder="الشارع، رقم العمارة، الشقة..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">رقم الموبايل 1 *</label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={makhdoumPhone}
                        onChange={e => setMakhdoumPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold text-right"
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#00123a] mb-2">رقم تليفون إضافي (اختياري)</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={makhdoumPhone2}
                        onChange={e => setMakhdoumPhone2(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all bg-slate-50 font-semibold text-right"
                        placeholder="مثال: رقم ولي الأمر"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setShowAddMakhdoumModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">إلغاء</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-[#002366] hover:bg-[#00174a] text-white font-bold rounded-xl transition-all shadow-md">إضافة الفرد</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Manage Servants */}
        {showManageServantsModal && targetFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
              <div className="p-6 bg-gradient-to-r from-[#00123a] to-[#002366] text-white flex justify-between items-center">
                <div>
                  <h3 className="font-tajawal font-bold text-xl text-[#fed65b]">إدارة خدام الأسرة</h3>
                  <p className="text-xs text-white/80 mt-1">تعديل الخدام المسؤولين عن أسرة: {targetFamily.head_name}</p>
                </div>
                <button 
                  onClick={() => setShowManageServantsModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                <form onSubmit={handleSaveFamilyServants} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#00123a] mb-3">اختر الخدام المسؤولين عن هذه الأسرة:</label>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50">
                      {Object.values(profiles)
                        .filter(p => ['servant', 'admin', 'priest'].includes(p.role))
                        .map(servant => {
                          const isChecked = selectedServantsForEditFamily.includes(servant.id);
                          return (
                            <label key={servant.id} className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm font-bold text-slate-700 select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedServantsForEditFamily(prev => prev.filter(id => id !== servant.id));
                                  } else {
                                    setSelectedServantsForEditFamily(prev => [...prev, servant.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#002366] focus:ring-[#002366] border-slate-300"
                              />
                              <span>{servant.full_name} ({servant.role === 'servant' ? 'خادم' : servant.role === 'priest' ? 'كاهن' : 'أدمن'})</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setShowManageServantsModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">إلغاء</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-[#002366] hover:bg-[#00174a] text-white font-bold rounded-xl transition-all shadow-md">حفظ وتحديث</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

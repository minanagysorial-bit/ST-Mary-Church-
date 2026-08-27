import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Users, Check, MapPin, Search, X, PlusCircle, Church, Calendar, ChevronDown, ChevronUp, UserCircle, Settings, Trash2,
  Phone, Sparkles, FolderPlus, Layers, ShieldCheck, Heart
} from 'lucide-react';
import { api, type Family, type FamilyMember, type FamilyServant, type Profile, type ChurchServiceCategory } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const SERVICE_CATEGORIES: ChurchServiceCategory[] = [
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

export const ServiceFamiliesManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'الكل';

  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, FamilyMember[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  // Modals
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [showManageServantsModal, setShowManageServantsModal] = useState(false);
  const [targetFamily, setTargetFamily] = useState<Family | null>(null);

  // Form - New Family / Class
  const [familyName, setFamilyName] = useState(''); // e.g. "أسرة البابا كيرلس"
  const [familyCategory, setFamilyCategory] = useState<ChurchServiceCategory>('ابتدائي بنين');
  const [familyStage, setFamilyStage] = useState('ثانية ابتدائي');
  const [familyAgeGroup, setFamilyAgeGroup] = useState('7 - 8 سنوات');
  const [familyArea, setFamilyArea] = useState('محرم بك');
  const [familyAddress, setFamilyAddress] = useState('مبنى الخدمات - الكنيسة');
  const [familyNotes, setFamilyNotes] = useState('');
  const [selectedServantsForNewFamily, setSelectedServantsForNewFamily] = useState<string[]>([]);
  const [selectedServantsForEditFamily, setSelectedServantsForEditFamily] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
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
        console.warn("family_servants error:", tableErr);
      }

      setFamilies(fetchedFamilies.filter(f => f.family_type === 'sunday_school'));
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

  const allServants = Object.values(profiles).filter(p => p.role === 'servant' || p.role === 'service_leader');

  const filteredFamilies = families.filter(f => {
    const matchesCategory = selectedCategory === 'الكل' || (f.stage && f.stage.includes(selectedCategory)) || (f.area && f.area.includes(selectedCategory));
    const matchesSearch = f.head_name.includes(searchQuery) || (f.stage && f.stage.includes(searchQuery)) || (f.notes && f.notes.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !familyStage.trim()) {
      setError('برجاء إدخال اسم الأسرة / الفصل والمرحلة الدراسية');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const stageFull = `${familyCategory} - ${familyStage} (${familyAgeGroup})`;
      const newFamily = await api.createFamily({
        family_type: 'sunday_school',
        head_name: familyName.trim(),
        phone: null,
        area: familyCategory,
        address: familyAddress || 'مبنى الخدمات',
        members_count: 0,
        notes: `المرحلة: ${stageFull}${familyNotes ? ' | ' + familyNotes : ''}`,
        assigned_servant_id: selectedServantsForNewFamily[0] || profile?.id || null,
        service_area_id: null,
        last_visit_date: null
      });

      if (selectedServantsForNewFamily.length > 0) {
        const promises = selectedServantsForNewFamily.map(servantId => 
          api.assignServantToFamily(newFamily.id, servantId)
        );
        await Promise.all(promises);
      }

      setSuccess(`تم إنشاء فصل / أسرة "${familyName}" وتعيين الخدام بنجاح ✨`);
      setShowAddFamilyModal(false);
      setFamilyName('');
      setFamilyNotes('');
      setSelectedServantsForNewFamily([]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إنشاء الأسرة');
    }
  };

  const handleSaveServantsAssignment = async (familyId: string) => {
    try {
      setError(null);
      setSuccess(null);
      const currentServants = familyServantsMap[familyId] || [];
      
      const toRemove = currentServants.filter(id => !selectedServantsForEditFamily.includes(id));
      const toAdd = selectedServantsForEditFamily.filter(id => !currentServants.includes(id));

      await Promise.all([
        ...toRemove.map(sId => api.removeServantFromFamily(familyId, sId)),
        ...toAdd.map(sId => api.assignServantToFamily(familyId, sId))
      ]);

      if (selectedServantsForEditFamily.length > 0) {
        await api.updateFamily(familyId, { assigned_servant_id: selectedServantsForEditFamily[0] });
      }

      setSuccess('تم تحديث الخدام المسؤولين عن الأسرة بنجاح ✨');
      setShowManageServantsModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ تعيينات الخدام');
    }
  };

  return (
    <DashboardLayout role="service_leader">
      <div className="space-y-6 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
              فصول وأسر التربية الكنسية
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              إنشاء الفصول وتحديد المراحل العمرية وتعيين الخدام المسؤولين عن كل أسرة
            </p>
          </div>

          <button
            onClick={() => setShowAddFamilyModal(true)}
            className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>إنشاء فصل / أسرة جديدة</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>✅ {success}</span>
          </div>
        )}

        {/* Filters and Category Chips */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم الأسرة، المرحلة الدراسية، أو الخادم المسئول..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] shadow-sm font-bold"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <span className="text-xs font-bold text-slate-500 shrink-0">الخدمة:</span>
            {['الكل', ...SERVICE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Families Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200">
            جاري تحميل الفصول والأسر...
          </div>
        ) : filteredFamilies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200">
            لا توجد أسر أو فصول مسجلة في هذا القسم. اضغط على زر "إنشاء فصل / أسرة جديدة" بالأعلى لإضافة فصل.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFamilies.map(fam => {
              const servantsIds = familyServantsMap[fam.id] || (fam.assigned_servant_id ? [fam.assigned_servant_id] : []);
              const assignedServants = servantsIds.map(id => profiles[id]).filter(Boolean);
              const members = familyMembers[fam.id] || [];
              const isExpanded = expandedFamilyId === fam.id;

              return (
                <div
                  key={fam.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="bg-[#002366]/10 text-[#002366] text-[11px] font-extrabold px-3 py-1 rounded-full border border-[#002366]/20">
                          {fam.area || 'خدمة عامة'}
                        </span>
                        <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                          {fam.head_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          {fam.notes || 'أسرة تربية كنسية مباركة'}
                        </p>
                      </div>

                      <div className="text-center p-2.5 bg-slate-50 border border-slate-100 rounded-2xl shrink-0">
                        <p className="text-[10px] text-slate-400 font-bold">المخدومين</p>
                        <p className="font-tajawal text-lg font-extrabold text-[#002366]">{members.length}</p>
                      </div>
                    </div>

                    {/* Assigned Servants */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>الخدام المسؤولين ({assignedServants.length}):</span>
                        </span>
                        <button
                          onClick={() => {
                            setTargetFamily(fam);
                            setSelectedServantsForEditFamily(servantsIds);
                            setShowManageServantsModal(true);
                          }}
                          className="text-[11px] font-bold text-[#002366] hover:underline"
                        >
                          تعديل الخدام
                        </button>
                      </div>

                      {assignedServants.length === 0 ? (
                        <p className="text-xs text-amber-700 font-semibold">⚠️ لم يتم تعيين خدام لهذه الأسرة بعد</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedServants.map(s => (
                            <span
                              key={s.id}
                              className="bg-white border border-slate-200 text-[#00174a] text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1"
                            >
                              <UserCircle className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>{s.full_name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expandable Members list */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
                        <h4 className="text-xs font-bold text-slate-700">قائمة أولاد ومخدومي الأسرة:</h4>
                        {members.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">لا يوجد أولاد مسجلين حتى الآن. يقوم خدام الأسرة بإضافتهم.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {members.map(m => (
                              <div key={m.id} className="p-2.5 bg-white border border-slate-100 rounded-xl text-xs space-y-1">
                                <p className="font-bold text-[#00174a]">{m.full_name}</p>
                                <p className="text-[10px] text-slate-400">{m.address || 'العنوان غير مسجل'}</p>
                                {m.phone && <p className="text-[10px] text-slate-500 font-mono">📞 {m.phone}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedFamilyId(isExpanded ? null : fam.id)}
                      className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'إخفاء المخدومين' : `عرض المخدومين (${members.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setTargetFamily(fam);
                        setSelectedServantsForEditFamily(servantsIds);
                        setShowManageServantsModal(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-[#00174a] rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>إدارة الخدام</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create New Family / Class */}
        {showAddFamilyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">إنشاء فصل / أسرة جديدة</h3>
                    <p className="text-xs text-slate-400 font-semibold">تحديد اسم الأسرة والمرحلة وتعيين الخدام</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddFamilyModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم الأسرة / الفصل (مثال: أسرة البابا كيرلس) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أسرة البابا كيرلس السادس"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">قسم الخدمة *</label>
                    <select
                      value={familyCategory}
                      onChange={(e) => setFamilyCategory(e.target.value as ChurchServiceCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    >
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المرحلة الدراسية *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ثانية ابتدائي"
                      value={familyStage}
                      onChange={(e) => setFamilyStage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المرحلة العمرية / السن</label>
                  <input
                    type="text"
                    placeholder="مثال: 7 - 8 سنوات"
                    value={familyAgeGroup}
                    onChange={(e) => setFamilyAgeGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                {/* Servant Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تعيين الخدام المسئولين عن الأسرة</label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50">
                    {allServants.map(s => {
                      const isSelected = selectedServantsForNewFamily.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-[#002366] text-[#fed65b] font-bold' : 'hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedServantsForNewFamily([...selectedServantsForNewFamily, s.id]);
                                } else {
                                  setSelectedServantsForNewFamily(selectedServantsForNewFamily.filter(id => id !== s.id));
                                }
                              }}
                              className="hidden"
                            />
                            <span>{s.full_name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات إضافية</label>
                  <textarea
                    rows={2}
                    placeholder="ملاحظات حول الأسرة أو الموعد..."
                    value={familyNotes}
                    onChange={(e) => setFamilyNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddFamilyModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    حفظ وإنشاء الأسرة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Servants Assignment */}
        {showManageServantsModal && targetFamily && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-tajawal text-base font-bold text-[#00174a]">
                    تعيين الخدام: {targetFamily.head_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">اختر الخدام المسؤولين عن إدارة هذه الأسرة</p>
                </div>
                <button
                  onClick={() => setShowManageServantsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                {allServants.map(s => {
                  const isSelected = selectedServantsForEditFamily.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                        isSelected ? 'bg-[#002366] text-[#fed65b] font-bold' : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServantsForEditFamily([...selectedServantsForEditFamily, s.id]);
                            } else {
                              setSelectedServantsForEditFamily(selectedServantsForEditFamily.filter(id => id !== s.id));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{s.full_name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4" />}
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManageServantsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveServantsAssignment(targetFamily.id)}
                  className="bg-[#002366] text-[#fed65b] text-xs font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  حفظ التعيينات
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

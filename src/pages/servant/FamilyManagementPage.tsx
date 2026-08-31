import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Users, Check, MapPin, Search, X, PlusCircle, Church, Calendar, ChevronDown, ChevronUp, UserCircle, Settings, Trash2,
  Phone, Sparkles, Award, UserPlus, Heart, FileText, CheckCircle2, Edit2
} from 'lucide-react';
import { api, type Family, type FamilyMember, type FamilyServant, type Profile } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const FamilyManagementPage: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Record<string, FamilyMember[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Servant permissions check
  const isManager = profile && ['admin', 'super_admin', 'priest', 'service_leader'].includes(profile.role);

  // Family Servants Mapping state
  const [familyServantsMap, setFamilyServantsMap] = useState<Record<string, string[]>>({});
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);

  // Modals Visibility
  const [showAddMakhdoumModal, setShowAddMakhdoumModal] = useState(false);
  const [showEditMakhdoumModal, setShowEditMakhdoumModal] = useState(false);
  const [targetFamily, setTargetFamily] = useState<Family | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form States - Detailed Makhdoum (FamilyMember)
  const [makhdoumName, setMakhdoumName] = useState('');
  const [makhdoumBirthDate, setMakhdoumBirthDate] = useState('');
  const [makhdoumAge, setMakhdoumAge] = useState('');
  const [makhdoumAddress, setMakhdoumAddress] = useState('');
  const [makhdoumParentPhone1, setMakhdoumParentPhone1] = useState('');
  const [makhdoumParentPhone2, setMakhdoumParentPhone2] = useState('');
  const [makhdoumPersonalPhone, setMakhdoumPersonalPhone] = useState('');
  const [makhdoumStage, setMakhdoumStage] = useState('ابتدائي');
  const [makhdoumNotes, setMakhdoumNotes] = useState('');

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
        console.warn("family_servants table may not exist yet:", tableErr);
      }

      // Filter families: If servant, show only his assigned families
      const sundaySchoolFamilies = fetchedFamilies.filter(f => f.family_type === 'sunday_school');
      
      let finalFamilies = sundaySchoolFamilies;
      if (profile && profile.role === 'servant') {
        const myAssigned = sundaySchoolFamilies.filter(f => 
          (relationsMap[f.id] && relationsMap[f.id].includes(profile.id)) ||
          f.assigned_servant_id === profile.id
        );
        if (myAssigned.length > 0) {
          finalFamilies = myAssigned;
          setExpandedFamilyId(myAssigned[0].id);
        }
      } else if (sundaySchoolFamilies.length > 0) {
        setExpandedFamilyId(sundaySchoolFamilies[0].id);
      }

      setFamilies(finalFamilies);
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
  }, [profile]);

  const filteredFamilies = families.filter(f => 
    f.head_name.includes(searchQuery) ||
    (f.notes && f.notes.includes(searchQuery)) ||
    (f.area && f.area.includes(searchQuery))
  );

  const handleAddMakhdoum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFamily) return;
    if (!makhdoumName.trim()) {
      setError('برجاء إدخال اسم المخدوم / الابن');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // Store detailed parent phones and address in notes/fields
      const fullNotes = [
        makhdoumParentPhone1 ? `رقم ولي الأمر 1: ${makhdoumParentPhone1}` : '',
        makhdoumParentPhone2 ? `رقم ولي الأمر 2: ${makhdoumParentPhone2}` : '',
        makhdoumNotes ? `ملاحظات: ${makhdoumNotes}` : ''
      ].filter(Boolean).join(' | ');

      const parsedAge = makhdoumAge ? parseInt(makhdoumAge, 10) : null;

      await api.createFamilyMember({
        family_id: targetFamily.id,
        full_name: makhdoumName.trim(),
        age: parsedAge,
        sunday_school_stage: makhdoumStage,
        phone: makhdoumPersonalPhone || makhdoumParentPhone1 || null,
        phone_2: makhdoumParentPhone2 || null,
        address: makhdoumAddress.trim() || targetFamily.address,
        birth_date: makhdoumBirthDate || null,
        notes: fullNotes || null
      });

      setSuccess(`تمت إضافة الابن / المخدوم "${makhdoumName}" إلى ${targetFamily.head_name} بنجاح ✨`);
      setShowAddMakhdoumModal(false);
      setMakhdoumName('');
      setMakhdoumBirthDate('');
      setMakhdoumAge('');
      setMakhdoumAddress('');
      setMakhdoumParentPhone1('');
      setMakhdoumParentPhone2('');
      setMakhdoumPersonalPhone('');
      setMakhdoumNotes('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إضافة المخدوم');
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المخدوم "${memberName}"؟`)) return;
    try {
      await api.deleteFamilyMember(memberId);
      setSuccess(`تم حذف المخدوم "${memberName}" بنجاح`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء حذف المخدوم');
    }
  };

  const handleOpenEditMember = (member: FamilyMember, fam: Family) => {
    setEditingMember(member);
    setTargetFamily(fam);
    setMakhdoumName(member.full_name || '');
    setMakhdoumBirthDate(member.birth_date || '');
    setMakhdoumAge(member.age ? String(member.age) : '');
    setMakhdoumAddress(member.address || '');
    setMakhdoumParentPhone1(member.phone || '');
    setMakhdoumParentPhone2(member.phone_2 || '');
    setMakhdoumStage(member.sunday_school_stage || fam.stage || 'ابتدائي');

    // Extract notes if formatted
    let cleanNotes = member.notes || '';
    if (cleanNotes.includes('ملاحظات: ')) {
      const parts = cleanNotes.split('ملاحظات: ');
      cleanNotes = parts[parts.length - 1];
    }
    setMakhdoumNotes(cleanNotes);
    setShowEditMakhdoumModal(true);
  };

  const handleUpdateMakhdoum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !targetFamily) return;
    if (!makhdoumName.trim()) {
      setError('برجاء إدخال اسم المخدوم / الابن');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const fullNotes = [
        makhdoumParentPhone1 ? `رقم ولي الأمر 1: ${makhdoumParentPhone1}` : '',
        makhdoumParentPhone2 ? `رقم ولي الأمر 2: ${makhdoumParentPhone2}` : '',
        makhdoumNotes ? `ملاحظات: ${makhdoumNotes}` : ''
      ].filter(Boolean).join(' | ');

      const parsedAge = makhdoumAge ? parseInt(makhdoumAge, 10) : null;

      await api.updateFamilyMember(editingMember.id, {
        full_name: makhdoumName.trim(),
        age: parsedAge,
        sunday_school_stage: makhdoumStage,
        phone: makhdoumParentPhone1 || null,
        phone_2: makhdoumParentPhone2 || null,
        address: makhdoumAddress.trim() || targetFamily.address,
        birth_date: makhdoumBirthDate || null,
        notes: fullNotes || null
      });

      setSuccess(`تم تعديل بيانات المخدوم "${makhdoumName}" بنجاح ✨`);
      setShowEditMakhdoumModal(false);
      setEditingMember(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تعديل بيانات المخدوم');
    }
  };

  return (
    <DashboardLayout role="servant">
      <div className="space-y-6 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
              أسرتي وفصلي ومخدومي
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              متابعة أبناء الأسرة المسندة إليك، تسجيل بياناتهم التفصيلية، الافتقاد، ونقاط الحضور
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/servant/attendance"
              className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>تسجيل الحضور</span>
            </Link>
            <Link
              to="/servant/points"
              className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>لوحة النقاط 🌟</span>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl">
            ✅ {success}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم الأسرة أو المخدوم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] shadow-sm font-bold"
          />
        </div>

        {/* Families List & Detailed Makhdoumeen Cards */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200">
            جاري تحميل أسرتك ومخدوميك...
          </div>
        ) : filteredFamilies.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 space-y-2">
            <p className="text-base text-[#00174a] font-bold">لم يتم تعيينك في أسرة أو فصل بعد</p>
            <p className="text-xs text-slate-500">يقوم أمين الخدمة بإضافتك إلى أسرة التربية الكنسية الخاصة بك لتتمكن من إضافة أولادك ومتابعتهم.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFamilies.map(fam => {
              const members = familyMembers[fam.id] || [];
              const servantsIds = familyServantsMap[fam.id] || (fam.assigned_servant_id ? [fam.assigned_servant_id] : []);
              const assignedServants = servantsIds.map(id => profiles[id]).filter(Boolean);
              const isExpanded = expandedFamilyId === fam.id;

              return (
                <div
                  key={fam.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6"
                >
                  {/* Family Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#002366] text-[#fed65b] text-xs font-extrabold px-3 py-1 rounded-full">
                          {fam.area || 'فصل التربية الكنسية'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {members.length} مخدوم مسجل
                        </span>
                      </div>
                      <h2 className="font-tajawal text-2xl font-extrabold text-[#00174a]">
                        {fam.head_name}
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        {fam.notes || 'أسرة تربية كنسية مباركة'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setTargetFamily(fam);
                        setShowAddMakhdoumModal(true);
                      }}
                      className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إضافة ابن / مخدوم للأسرة</span>
                    </button>
                  </div>

                  {/* Servants in this family */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl">
                    <Users className="w-4 h-4 text-[#d4af37]" />
                    <span>خدام الأسرة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedServants.map(s => (
                        <span key={s.id} className="bg-white border border-slate-200 text-[#00174a] px-2 py-0.5 rounded-lg text-xs">
                          {s.full_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Children / Makhdoumeen Grid */}
                  <div className="space-y-3">
                    <h3 className="font-tajawal text-base font-bold text-[#00174a]">
                      أولاد ومخدومي الفصل ({members.length})
                    </h3>

                    {members.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
                        <p className="text-xs text-slate-400 font-bold">لا يوجد مخدومين مضافين في هذه الأسرة حتى الآن.</p>
                        <button
                          onClick={() => {
                            setTargetFamily(fam);
                            setShowAddMakhdoumModal(true);
                          }}
                          className="text-xs font-bold text-[#002366] underline"
                        >
                          + اضغط هنا لإضافة أول مخدوم
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map(m => (
                          <div
                            key={m.id}
                            className="bg-slate-50 hover:bg-white rounded-2xl p-4 border border-slate-200 hover:border-[#002366] shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-tajawal text-base font-bold text-[#00174a]">
                                  {m.full_name}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditMember(m, fam)}
                                    className="text-slate-400 hover:text-[#002366] hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                    title="تعديل بيانات المخدوم"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#002366]" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(m.id, m.full_name)}
                                    className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                    title="حذف المخدوم"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1 text-xs text-slate-600 font-medium">
                                {m.birth_date && (
                                  <p className="flex items-center gap-1.5 text-slate-500">
                                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                                    <span>الميلاد: {m.birth_date} {m.age ? `(${m.age} سنة)` : ''}</span>
                                  </p>
                                )}

                                {m.address && (
                                  <p className="flex items-center gap-1.5 text-slate-500">
                                    <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                                    <span>{m.address}</span>
                                  </p>
                                )}

                                {m.phone && (
                                  <p className="flex items-center gap-1.5 font-mono text-slate-700">
                                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                    <a href={`tel:${m.phone}`} className="hover:underline">{m.phone}</a>
                                  </p>
                                )}

                                {m.phone_2 && (
                                  <p className="flex items-center gap-1.5 font-mono text-slate-700">
                                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                                    <a href={`tel:${m.phone_2}`} className="hover:underline">{m.phone_2}</a>
                                  </p>
                                )}

                                {m.notes && (
                                  <p className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100 mt-2">
                                    {m.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-[#002366]">
                              <Link to="/servant/attendance" className="hover:underline">
                                تسجيل الحضور
                              </Link>
                              <Link to="/servant/visitations" className="hover:underline text-emerald-700">
                                تسجيل افتقاد
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add Makhdoum with Full Details */}
        {showAddMakhdoumModal && targetFamily && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">إضافة ابن / مخدوم جديد</h3>
                    <p className="text-xs text-slate-400 font-semibold">{targetFamily.head_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddMakhdoumModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMakhdoum} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم الكامل للابن / المخدوم *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف مينا مجدي"
                    value={makhdoumName}
                    onChange={(e) => setMakhdoumName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الميلاد</label>
                    <input
                      type="date"
                      value={makhdoumBirthDate}
                      onChange={(e) => setMakhdoumBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السن (بالسنوات)</label>
                    <input
                      type="number"
                      placeholder="مثال: 8"
                      value={makhdoumAge}
                      onChange={(e) => setMakhdoumAge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="مثال: 15 شارع بوالينو - الدور الثالث شقة 6 - محرم بك"
                    value={makhdoumAddress}
                    onChange={(e) => setMakhdoumAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم ولي الأمر 1 (الأب / الأم)</label>
                    <input
                      type="tel"
                      placeholder="012xxxxxxxx"
                      value={makhdoumParentPhone1}
                      onChange={(e) => setMakhdoumParentPhone1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم ولي الأمر 2 / هاتف أرضي</label>
                    <input
                      type="tel"
                      placeholder="010xxxxxxxx"
                      value={makhdoumParentPhone2}
                      onChange={(e) => setMakhdoumParentPhone2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات خاصة ومتابعة روحية</label>
                  <textarea
                    rows={2}
                    placeholder="أب الاعتراف، الهوايات، الحالة الصحية، ملاحظات الافتقاد..."
                    value={makhdoumNotes}
                    onChange={(e) => setMakhdoumNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddMakhdoumModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    حفظ بيانات المخدوم
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Makhdoum */}
        {showEditMakhdoumModal && editingMember && targetFamily && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">تعديل بيانات المخدوم</h3>
                    <p className="text-xs text-slate-400 font-semibold">{targetFamily.head_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditMakhdoumModal(false);
                    setEditingMember(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateMakhdoum} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم الكامل للابن / المخدوم *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف مينا مجدي"
                    value={makhdoumName}
                    onChange={(e) => setMakhdoumName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الميلاد</label>
                    <input
                      type="date"
                      value={makhdoumBirthDate}
                      onChange={(e) => setMakhdoumBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السن (بالسنوات)</label>
                    <input
                      type="number"
                      placeholder="مثال: 8"
                      value={makhdoumAge}
                      onChange={(e) => setMakhdoumAge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="مثال: 15 شارع بوالينو - الدور الثالث شقة 6 - محرم بك"
                    value={makhdoumAddress}
                    onChange={(e) => setMakhdoumAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم ولي الأمر 1 (الأب / الأم)</label>
                    <input
                      type="tel"
                      placeholder="012xxxxxxxx"
                      value={makhdoumParentPhone1}
                      onChange={(e) => setMakhdoumParentPhone1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم ولي الأمر 2 / هاتف أرضي</label>
                    <input
                      type="tel"
                      placeholder="010xxxxxxxx"
                      value={makhdoumParentPhone2}
                      onChange={(e) => setMakhdoumParentPhone2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات خاصة ومتابعة روحية</label>
                  <textarea
                    rows={2}
                    placeholder="أب الاعتراف، الهوايات، الحالة الصحية، ملاحظات الافتقاد..."
                    value={makhdoumNotes}
                    onChange={(e) => setMakhdoumNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditMakhdoumModal(false);
                      setEditingMember(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

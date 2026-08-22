import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { Shield, Lock, UserCheck, Plus, Trash2, Award, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api, Profile, UserRole } from '../../lib/api';
import { adminCreateUser } from '../../lib/auth';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../../lib/permissions';
import { useToast } from '../../components/common/Toast';

export const PermissionsPage: React.FC = () => {
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for new user
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('servant');
  const [creationPermissions, setCreationPermissions] = useState<string[]>([]);

  // Expandable row state for users custom permissions management
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);

      const permsMap: Record<string, string[]> = {};
      const customizable = data.filter(p => p.role !== 'super_admin' && p.role !== 'admin');

      await Promise.all(
        customizable.map(async (p) => {
          try {
            const perms = await api.getUserPermissions(p.id);
            permsMap[p.id] = perms;
          } catch (err) {
            console.error(`Failed to fetch permissions for ${p.id}:`, err);
            permsMap[p.id] = [];
          }
        })
      );
      setUserPermissions(permsMap);
    } catch (err: any) {
      console.error(err);
      toast.error('خطأ في تحميل كشوفات الأدوار من قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    if (actionLoadingId) return;
    setActionLoadingId(profileId);
    try {
      await api.updateProfileRole(profileId, newRole);
      toast.success('تم تحديث صلاحيات الحساب بنجاح');
      
      if (newRole !== 'super_admin' && newRole !== 'admin') {
        setUserPermissions(prev => ({ ...prev, [profileId]: [] }));
      } else {
        setUserPermissions(prev => {
          const c = { ...prev };
          delete c[profileId];
          return c;
        });
      }

      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث صلاحيات الحساب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveName = async (id: string) => {
    if (!editingName.trim()) return;
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await api.updateProfile(id, { full_name: editingName });
      toast.success('تم تحديث الاسم بنجاح');
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, full_name: editingName } : p));
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الاسم');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (actionLoadingId) return;
    if (!window.confirm(`هل أنت متأكد من مسح حساب (${name})؟`)) return;
    setActionLoadingId(id);
    try {
      await api.deleteProfile(id);
      toast.success('تم مسح الحساب بنجاح');
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'فشل مسح الحساب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePermission = async (userId: string, permKey: string) => {
    if (actionLoadingId) return;
    setActionLoadingId(`${userId}-${permKey}`);
    const current = userPermissions[userId] || [];
    const updated = current.includes(permKey)
      ? current.filter(p => p !== permKey)
      : [...current, permKey];

    try {
      await api.setUserPermissions(userId, updated);
      setUserPermissions(prev => ({ ...prev, [userId]: updated }));
      toast.success('تم تحديث الصلاحية الفرعية بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الصلاحيات الفرعية');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleCreationPermission = (permKey: string) => {
    setCreationPermissions(prev =>
      prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (password.length < 6) {
        throw new Error('يجب ألا تقل كلمة المرور عن 6 أحرف');
      }

      const res = await adminCreateUser(email, password, fullName, role);
      
      if (creationPermissions.length > 0 && res.user?.id) {
        await api.setUserPermissions(res.user.id, creationPermissions);
      }

      toast.success(`تم إنشاء حساب ${fullName} بنجاح كـ (${getRoleLabel(role)})`);
      
      // Clear inputs
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('servant');
      setCreationPermissions([]);

      // Refresh list
      await fetchProfiles();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إنشاء الحساب. تأكد من صحة البيانات وعدم تكرار البريد.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.full_name.includes(searchTerm) ||
    p.email.includes(searchTerm) ||
    p.role.includes(searchTerm)
  );

  const getRoleBadgeClass = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'admin':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'priest':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'servant':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'board':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'مدير عام نظام';
      case 'admin':
        return 'مسؤول نظام';
      case 'priest':
        return 'كاهن';
      case 'servant':
        return 'خادم متابعة';
      case 'board':
        return 'عضو مجلس';
      case 'membership':
        return 'مسؤول عضوية';
      default:
        return r;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
          <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-tajawal text-2xl font-extrabold text-[#00174a]">
              إدارة المستخدمين والصلاحيات
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              أضف حسابات جديدة للكهنة والخدام وممثلي المجلس، وخصص صلاحياتهم الفرعية بدقة.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main User List Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
              
              {/* Search Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">
                  كشوفات الحسابات والخدام المسجلين
                </h3>
                <input
                  type="text"
                  placeholder="ابحث بالاسم، البريد، أو الدور..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2 text-xs text-slate-800 outline-none transition-colors font-semibold max-w-xs w-full"
                />
              </div>

              {loading ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-500 font-bold">جاري تحميل الحسابات والصلاحيات...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold border-b border-slate-100">
                        <th className="p-4">الاسم الكامل</th>
                        <th className="p-4">البريد الإلكتروني</th>
                        <th className="p-4">الرتبة / الدور الحالى</th>
                        <th className="p-4">تحديث الدور</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {filteredProfiles.map(p => (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-4">
                              {editingId === p.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingName}
                                    disabled={actionLoadingId === p.id}
                                    onChange={e => setEditingName(e.target.value)}
                                    className="border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-[#002366] bg-slate-50 focus:outline-none disabled:opacity-55"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveName(p.id)}
                                    disabled={actionLoadingId === p.id}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5 animate-pulse" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    disabled={actionLoadingId === p.id}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="block font-bold text-[#002366]">{p.full_name}</span>
                                  {p.email.toLowerCase() !== 'admin@stmary.church' && p.email.toLowerCase() !== 'admin@stmarychurch' && (
                                    <button
                                      onClick={() => {
                                        setEditingId(p.id);
                                        setEditingName(p.full_name);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-400 hover:text-[#002366] transition-opacity"
                                      title="تعديل الاسم"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">{p.id}</span>
                            </td>
                            <td className="p-4 text-slate-500 font-cairo">{p.email}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] border ${getRoleBadgeClass(p.role)}`}>
                                <span>{getRoleLabel(p.role)}</span>
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={p.role}
                                disabled={actionLoadingId === p.id || p.email.toLowerCase() === 'admin@stmary.church' || p.email.toLowerCase() === 'admin@stmarychurch'} 
                                onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#002366] disabled:opacity-50"
                              >
                                <option value="super_admin">مدير عام نظام (Super Admin)</option>
                                <option value="admin">مسؤول نظام (Admin)</option>
                                <option value="priest">كاهن الكنيسة (Priest)</option>
                                <option value="servant">خادم متابعة (Servant)</option>
                                <option value="board">عضو المجلس (Board)</option>
                                <option value="membership">مسؤول عضوية (Membership)</option>
                              </select>
                            </td>
                            <td className="p-4 flex items-center justify-center gap-2">
                              {p.role !== 'super_admin' && p.role !== 'admin' && (
                                <button
                                  type="button"
                                  disabled={actionLoadingId !== null}
                                  onClick={() => setExpandedProfileId(expandedProfileId === p.id ? null : p.id)}
                                  className="p-1.5 font-tajawal text-[10px] font-bold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1 disabled:opacity-55"
                                  title="تعديل الصلاحيات المخصصة"
                                >
                                  <span>صلاحيات خاصة</span>
                                  {expandedProfileId === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={actionLoadingId === p.id || p.email.toLowerCase() === 'admin@stmary.church' || p.email.toLowerCase() === 'admin@stmarychurch'} 
                                onClick={() => handleDeleteProfile(p.id, p.full_name)}
                                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                title="حذف الحساب"
                              >
                                <Trash2 className={`w-4 h-4 ${actionLoadingId === p.id ? 'animate-pulse' : ''}`} />
                              </button>
                            </td>
                          </tr>

                          {/* Dynamic checklist child row */}
                          {p.role !== 'super_admin' && p.role !== 'admin' && expandedProfileId === p.id && (
                            <tr>
                              <td colSpan={5} className="bg-amber-50/20 p-6 border-y border-amber-100/50">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-amber-800 border-b border-amber-100 pb-2">
                                    <Shield className="w-4 h-4" />
                                    <h4 className="font-tajawal font-extrabold text-xs">
                                      تخصيص الصلاحيات الفرعية للمستخدم ({p.full_name})
                                    </h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    {PERMISSION_GROUPS.map(group => (
                                      <div key={group.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                                        <h5 className="font-tajawal font-extrabold text-[11px] text-[#002366] border-b border-slate-50 pb-1.5">
                                          {group.label}
                                        </h5>
                                        <div className="space-y-2">
                                          {group.permissions.map(permKey => {
                                            const hasIt = (userPermissions[p.id] || []).includes(permKey);
                                            return (
                                              <label key={permKey} className="flex items-start gap-2.5 cursor-pointer select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={hasIt}
                                                  disabled={actionLoadingId !== null}
                                                  onChange={() => handleTogglePermission(p.id, permKey)}
                                                  className="mt-0.5 accent-[#d4af37] w-3.5 h-3.5 rounded border-slate-300 focus:ring-0 disabled:opacity-50"
                                                />
                                                <span className="text-[11px] text-slate-700 leading-tight">
                                                  {PERMISSION_LABELS[permKey] || permKey}
                                                </span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2">
                <h4 className="font-tajawal font-extrabold text-sm text-[#002366] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  دور قدس مجمع الكهنة
                </h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  صلاحيات مخصصة لكل قدس كاهن بشكل فريد. يمكن تمكين إدارة القداسات، الخدمة، الافتقاد، أو أدوات الكهنة الأخرى.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2">
                <h4 className="font-tajawal font-extrabold text-sm text-[#002366] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  دور الخادم المتابع
                </h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  تلقائياً يملك الصلاحيات الأساسية للخدمة: إدارة حضور وغياب المخدومين، فصول الخدمة، الافتقادات، والأسر.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-2">
                <h4 className="font-tajawal font-extrabold text-sm text-[#002366] flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-500" />
                  دور مجلس الكنيسة
                </h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  يملك الصلاحيات المالية للمجلس، إدارة المشاريع الإنشائية والتطويرية، وأجندات الاجتماعات الخاصة باللجنة.
                </p>
              </div>
            </div>
          </div>

          {/* Form to add a new account (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-[#002366] text-white rounded-3xl p-6 border border-[#d4af37]/20 shadow-xl space-y-5">
              <div className="space-y-2">
                <h3 className="font-tajawal font-extrabold text-lg text-[#fed65b] flex items-center gap-2">
                  <Plus className="w-5 h-5 bg-[#fed65b] text-[#002366] rounded-lg p-0.5" />
                  إضافة حساب خادم أو كاهن جديد
                </h3>
                <p className="text-[10px] text-slate-200 font-semibold leading-relaxed">
                  أدخل البيانات بدقة وسيتم إنشاء الحساب في Auth وتخزينه في Profiles وتعيين الدور الافتراضي.
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="مثال: الخادم جون ميلاد"
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@stmary.church"
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">كلمة المرور الافتراضية</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="لا تقل عن 6 أحرف"
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">رتبة / دور الحساب</label>
                  <select
                    value={role}
                    onChange={e => {
                      setRole(e.target.value as UserRole);
                      setCreationPermissions([]);
                    }}
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-semibold [&>option]:text-slate-800"
                  >
                    <option value="super_admin">مدير عام نظام (Super Admin)</option>
                    <option value="admin">مسؤول نظام (Admin)</option>
                    <option value="priest">كاهن الكنيسة (Priest)</option>
                    <option value="servant">خادم متابعة (Servant)</option>
                    <option value="board">عضو المجلس (Board)</option>
                    <option value="membership">مسؤول عضوية (Membership)</option>
                  </select>
                </div>

                {role !== 'super_admin' && role !== 'admin' && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="block text-xs font-bold text-[#fed65b]">
                      تعيين صلاحيات مبدئية خاصة:
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                      {PERMISSION_GROUPS.map(g => (
                        <div key={g.label} className="space-y-1">
                          <p className="text-[10px] text-slate-350 font-bold border-b border-white/5 pb-0.5">{g.label}</p>
                          {g.permissions.map(p => (
                            <label key={p} className="flex items-center gap-2 text-[10px] text-slate-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={creationPermissions.includes(p)}
                                onChange={() => handleToggleCreationPermission(p)}
                                className="accent-[#fed65b]"
                              />
                              <span>{PERMISSION_LABELS[p] || p}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب الآن'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

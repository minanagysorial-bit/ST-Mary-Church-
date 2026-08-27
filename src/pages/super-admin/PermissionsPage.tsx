import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Shield, Lock, UserCheck, Plus, Trash2, Award, Edit2, Check, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Key, Copy, Download, FileSpreadsheet, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { api, Profile, UserRole } from '../../lib/api';
import { adminCreateUser } from '../../lib/auth';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../../lib/permissions';
import { useToast } from '../../components/common/Toast';

interface SavedCredential {
  id?: string;
  full_name: string;
  email: string;
  initial_password: string;
  role: UserRole;
  created_at: string;
}

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
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<UserRole>('servant');
  const [creationPermissions, setCreationPermissions] = useState<string[]>([]);

  // Credentials Vault & Sheet Modal
  const [credentialsVault, setCredentialsVault] = useState<SavedCredential[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');

  // Expandable row state for users custom permissions management
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const [data, settings] = await Promise.all([
        api.getProfiles(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>))
      ]);

      setProfiles(data);

      // Load Saved Credentials Vault
      const rawVault = settings['admin_credentials_vault'];
      if (rawVault) {
        try {
          setCredentialsVault(JSON.parse(rawVault));
        } catch {
          loadLocalVault();
        }
      } else {
        loadLocalVault();
      }

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

  const loadLocalVault = () => {
    try {
      const local = localStorage.getItem('church_credentials_vault');
      if (local) {
        setCredentialsVault(JSON.parse(local));
      }
    } catch {}
  };

  const saveToVault = async (newCred: SavedCredential) => {
    const updated = [newCred, ...credentialsVault.filter(c => c.email.toLowerCase() !== newCred.email.toLowerCase())];
    setCredentialsVault(updated);
    localStorage.setItem('church_credentials_vault', JSON.stringify(updated));

    try {
      await api.updateSiteSettings({
        admin_credentials_vault: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Vault settings sync notice:', err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const generateStrongPassword = () => {
    const prefixes = ['StMary', 'Church', 'Saint', 'Spirit', 'Grace', 'Mercy', 'Coptic', 'Praise', 'Blessing', 'David'];
    const specialChars = ['#', '!', '$', '@', '%', '&', '*'];
    const randomWord = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const randomYear = new Date().getFullYear();
    const randomChars = Math.random().toString(36).substring(2, 6);
    const strongPass = `${randomWord}${randomSpecial}${randomYear}!${randomChars}`;
    setPassword(strongPass);
    setShowPassword(true);
    toast.success('تم توليد واقتراح كلمة مرور قوية بنجاح 🎲');
  };

  const copyToClipboard = (text: string, label = 'النص') => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label} إلى الحافظة بنجاح 📋`);
  };

  const copyWhatsAppFormat = (cred: SavedCredential) => {
    const msg = `سلام ونعمة يا ${cred.full_name} 🌟
إليك بيانات حسابك على منصة كنيسة السيدة العذراء مريم بمحرم بك:

📧 البريد الإلكتروني: ${cred.email}
🔑 كلمة المرور: ${cred.initial_password}
🏷️ الرتبة / الدور: ${getRoleLabel(cred.role)}

🔗 رابط تسجيل الدخول:
https://www.tibarthenos.com/login`;

    copyToClipboard(msg, 'رسالة بيانات الحساب');
  };

  const exportVaultToExcel = () => {
    if (credentialsVault.length === 0) {
      toast.error('لا توجد حسابات مسجلة في الكشف بعد');
      return;
    }

    const headers = ['الاسم الكامل', 'البريد الإلكتروني', 'كلمة المرور المبدئية', 'الرتبة / الدور', 'تاريخ الإنشاء'];
    const rows = credentialsVault.map(c => [
      c.full_name,
      c.email,
      c.initial_password,
      getRoleLabel(c.role),
      c.created_at
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `كشف_حسابات_وكلمات_مرور_الخدام_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف الحسابات وكلمات المرور بنجاح 📊');
  };

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

      // Save to Credentials Vault & Sheet
      await saveToVault({
        id: res.user?.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        initial_password: password,
        role: role,
        created_at: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
      });

      toast.success(`تم إنشاء حساب ${fullName} بنجاح وتسجيل كلمة المرور في الكشف ✨`);
      
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

  const filteredVault = credentialsVault.filter(c =>
    c.full_name.includes(vaultSearch) ||
    c.email.includes(vaultSearch) ||
    c.role.includes(vaultSearch)
  );

  const getRoleBadgeClass = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold';
      case 'admin':
        return 'bg-purple-50 border-purple-200 text-purple-700 font-bold';
      case 'priest':
        return 'bg-amber-50 border-amber-200 text-amber-700 font-bold';
      case 'service_leader':
        return 'bg-cyan-50 border-cyan-200 text-cyan-800 font-bold';
      case 'servant':
        return 'bg-blue-50 border-blue-200 text-blue-700 font-bold';
      case 'membership':
        return 'bg-teal-50 border-teal-200 text-teal-700 font-bold';
      case 'board':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'مدير عام نظام (Super Admin)';
      case 'admin':
        return 'مسؤول نظام (Admin)';
      case 'priest':
        return 'كاهن (Priest)';
      case 'service_leader':
        return 'أمين خدمة (Service Leader)';
      case 'servant':
        return 'خادم متابعة (Servant)';
      case 'membership':
        return 'مسؤول عضوية (Membership)';
      case 'board':
        return 'عضو مجلس (Board)';
      default:
        return r;
    }
  };

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-tajawal text-2xl font-extrabold text-[#00174a]">
                إدارة المستخدمين والصلاحيات
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                إنشاء الحسابات، اقتراح كلمات مرور قوية، وحفظ كشوفات وبيانات الدخول للخدام.
              </p>
            </div>
          </div>

          {/* Quick Open Credentials Vault Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVaultModal(true)}
              className="bg-[#fed65b] hover:bg-[#ffe088] text-[#00174a] font-extrabold text-xs px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>كشف كلمات المرور المسجلة ({credentialsVault.length})</span>
            </button>
          </div>
        </div>

        {/* 2 Column Layout (Left: Users list, Right: Add User Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main User List (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                <option value="service_leader">أمين خدمة (Service Leader)</option>
                                <option value="servant">خادم متابعة (Servant)</option>
                                <option value="membership">مسؤول عضوية (Membership)</option>
                                <option value="board">عضو المجلس (Board)</option>
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
                                    <Award className="w-4 h-4 text-amber-600" />
                                    <span className="text-xs font-extrabold font-tajawal">
                                      صلاحيات استثنائية لحساب: {p.full_name}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                                    {PERMISSION_GROUPS.map(group => (
                                      <div key={group.label} className="space-y-2 bg-white/60 p-3.5 rounded-xl border border-amber-100/60 shadow-xs">
                                        <h5 className="font-bold text-[#002366] text-[11px] border-b border-slate-100 pb-1">
                                          {group.label}
                                        </h5>
                                        <div className="space-y-1.5">
                                          {group.permissions.map(perm => {
                                            const isChecked = (userPermissions[p.id] || []).includes(perm);
                                            const isMutating = actionLoadingId === `${p.id}-${perm}`;
                                            return (
                                              <label
                                                key={perm}
                                                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                                                  isChecked ? 'bg-amber-100/50 text-[#002366] font-bold' : 'hover:bg-slate-50 text-slate-600'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    disabled={isMutating}
                                                    onChange={() => handleTogglePermission(p.id, perm)}
                                                    className="w-3.5 h-3.5 rounded text-[#002366] focus:ring-0 accent-[#002366] disabled:opacity-50"
                                                  />
                                                  <span className="text-[11px]">{PERMISSION_LABELS[perm] || perm}</span>
                                                </div>
                                                {isMutating && (
                                                  <div className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                                )}
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
                  توليد كلمة مرور قوية ورؤيتها ونسخها وحفظها في كشف كلمات المرور للنظام آلياً.
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="مثال: الخادم مينا نبيل"
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@stmary.church"
                    className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>

                {/* Password Input with Generator & Eye Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">كلمة المرور *</label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] font-extrabold text-[#fed65b] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>اقتراح كلمة مرور قوية 🎲</span>
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="كلمة المرور (6 أحرف فأكثر)"
                      className="w-full bg-white/10 border border-white/10 focus:border-[#fed65b] rounded-xl pr-4 pl-20 py-2.5 text-xs text-white outline-none transition-colors font-mono font-bold"
                    />
                    <div className="absolute left-2 flex items-center gap-1">
                      {password && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(password, 'كلمة المرور')}
                          className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
                          title="نسخ كلمة المرور"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200">رتبة / دور الحساب *</label>
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
                    <option value="service_leader">أمين خدمة (Service Leader)</option>
                    <option value="servant">خادم متابعة (Servant)</option>
                    <option value="membership">مسؤول عضوية (Membership)</option>
                    <option value="board">عضو المجلس (Board)</option>
                  </select>
                </div>

                {role !== 'super_admin' && role !== 'admin' && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="block text-xs font-bold text-[#fed65b]">
                      تعيين صلاحيات مبدئية خاصة:
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                      {PERMISSION_GROUPS.map(g => (
                        <div key={g.label} className="space-y-1">
                          <p className="text-[10px] text-slate-300 font-bold border-b border-white/5 pb-0.5">{g.label}</p>
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
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وحفظ البيانات'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Modal: Credentials Vault & Excel Sheet Export */}
        {showVaultModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-xl font-extrabold text-[#00174a]">
                      كشف حسابات وكلمات مرور الخدام (Credentials Vault)
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      سجل آمن لكلمات المرور المبدئية وبيانات الدخول المسجلة على السيستم مع إمكانية التصدير للإكسيل
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowVaultModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top Controls: Search + Export Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  value={vaultSearch}
                  onChange={e => setVaultSearch(e.target.value)}
                  className="w-full sm:max-w-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                />

                <button
                  onClick={exportVaultToExcel}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير الكشف إلى Excel / CSV</span>
                </button>
              </div>

              {/* Table of Credentials */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                {filteredVault.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold">
                    لا توجد حسابات مسجلة في الكشف بعد. ستظهر هنا أي حسابات جديدة يتم إنشاؤها بكلمات مرورها.
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">الاسم الكامل</th>
                        <th className="p-3">البريد الإلكتروني</th>
                        <th className="p-3">كلمة المرور</th>
                        <th className="p-3">الرتبة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredVault.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-[#00174a]">{c.full_name}</td>
                          <td className="p-3 font-mono text-slate-600">{c.email}</td>
                          <td className="p-3">
                            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-mono font-bold select-all">
                              {c.initial_password}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                              {getRoleLabel(c.role)}
                            </span>
                          </td>
                          <td className="p-3 flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => copyToClipboard(c.initial_password, 'كلمة المرور')}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="نسخ الباسورد فقط"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => copyWhatsAppFormat(c)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-1"
                              title="نسخ رسالة الترحيب وبيانات الدخول للواتساب"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">نسخ الرسالة</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400 font-bold">
                <span>إجمالي الحسابات المسجلة بالكشف: {filteredVault.length}</span>
                <button
                  onClick={() => setShowVaultModal(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

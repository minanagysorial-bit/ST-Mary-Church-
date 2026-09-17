import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  Shield, Lock, UserCheck, Plus, Trash2, Award, Edit2, Check, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Key, Copy, Download, FileSpreadsheet, Sparkles, RefreshCw, Layers, AlertTriangle, Save,
  History, Clock, User, Filter, Search, Printer, ArrowUpDown, CheckCircle2, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { api, Profile, UserRole, AdminActivityLog, type ChurchServiceCategory } from '../../lib/api';
import { adminCreateUser } from '../../lib/auth';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../../lib/permissions';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ALL_CHURCH_SERVICE_CATEGORIES, 
  getLeaderAssignedServices, 
  saveLeaderAssignedServices 
} from '../../lib/servicesAssignmentHelper';

interface SavedCredential {
  id?: string;
  full_name: string;
  email: string;
  initial_password: string;
  role: UserRole;
  created_at: string;
  created_by?: string;
}

export const PermissionsPage: React.FC = () => {
  const toast = useToast();
  const { profile: currentAdminProfile } = useAuth();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'vault' | 'logs'>('users');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

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
  const [creationAssignedServices, setCreationAssignedServices] = useState<ChurchServiceCategory[]>([]);

  // Assign Services Modal for Service Leader
  const [assigningLeaderProfile, setAssigningLeaderProfile] = useState<Profile | null>(null);
  const [modalAssignedServices, setModalAssignedServices] = useState<ChurchServiceCategory[]>([]);
  const [savingServiceAssignment, setSavingServiceAssignment] = useState(false);

  // Credentials Vault & Sheet
  const [credentialsVault, setCredentialsVault] = useState<SavedCredential[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultRoleFilter, setVaultRoleFilter] = useState<string>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Activity Log Filter states
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [selectedLogDetails, setSelectedLogDetails] = useState<AdminActivityLog | null>(null);

  // Expandable row state for users custom permissions management
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const [data, settings, logs] = await Promise.all([
        api.getProfiles(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>)),
        api.getAdminActivityLogs().catch(() => [] as AdminActivityLog[])
      ]);

      setProfiles(data);
      setSiteSettings(settings);
      setActivityLogs(logs);

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

  const refreshLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await api.getAdminActivityLogs();
      setActivityLogs(logs);
      toast.success('تم تحديث سجل النشاطات الإدارية 🔄');
    } catch (e) {
      toast.error('فشل تحديث سجل النشاطات');
    } finally {
      setLogsLoading(false);
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
https://www.tibarthenos.com/login

يرجى تسجيل الدخول والاطلاع على خدماتك وتغيير كلمة المرور من داخل ملفك الشخصي إذا أردت. ربنا يبارك في خدمتكم 🕊️`;

    copyToClipboard(msg, 'رسالة بيانات الحساب والواتساب');
  };

  const exportVaultToExcel = () => {
    if (credentialsVault.length === 0) {
      toast.error('لا توجد حسابات مسجلة في الشيت بعد');
      return;
    }

    const headers = ['م', 'الاسم الكامل', 'البريد الإلكتروني', 'كلمة المرور المبدئية', 'الرتبة / الدور', 'تاريخ الإنشاء', 'المنشئ'];
    const rows = credentialsVault.map((c, idx) => [
      idx + 1,
      c.full_name,
      c.email,
      c.initial_password,
      getRoleLabel(c.role),
      c.created_at,
      c.created_by || 'مسؤول النظام'
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `شيت_حسابات_وكلمات_مرور_الخدام_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير شيت الحسابات وكلمات المرور بنجاح 📊');
  };

  const exportLogsToExcel = () => {
    if (activityLogs.length === 0) {
      toast.error('لا توجد نشاطات مسجلة بعد');
      return;
    }

    const headers = ['التوقيت', 'المشرف المسؤول', 'نوع العملية', 'المستخدم المستهدف', 'البريد', 'تفاصيل النشاط'];
    const rows = activityLogs.map(l => [
      new Date(l.timestamp).toLocaleString('ar-EG'),
      l.admin_name,
      getActionTypeLabel(l.action_type),
      l.target_user_name || '-',
      l.target_user_email || '-',
      l.description
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_نشاطات_الأدمن_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير سجل نشاطات الأدمن بنجاح 📜');
  };

  const handleDeleteFromVault = async (emailToDelete: string) => {
    if (!window.confirm(`هل تريد حذف بيانات حساب (${emailToDelete}) من شيت كلمات المرور؟`)) return;
    const updated = credentialsVault.filter(c => c.email.toLowerCase() !== emailToDelete.toLowerCase());
    setCredentialsVault(updated);
    localStorage.setItem('church_credentials_vault', JSON.stringify(updated));
    try {
      await api.updateSiteSettings({ admin_credentials_vault: JSON.stringify(updated) });
      toast.success('تم حذف الحساب من شيت كلمات المرور بنجاح');
    } catch (e) {
      toast.error('فشل تحديث الشيت');
    }
  };

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    if (actionLoadingId) return;
    setActionLoadingId(profileId);
    const targetProfile = profiles.find(p => p.id === profileId);
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

      // Log Admin Activity
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'update_role',
        target_user_id: profileId,
        target_user_name: targetProfile?.full_name,
        target_user_email: targetProfile?.email,
        description: `قام بتغيير رتبة المستخدم (${targetProfile?.full_name || profileId}) من [${getRoleLabel(targetProfile?.role || 'servant')}] إلى [${getRoleLabel(newRole)}]`,
        details: {
          old_role: targetProfile?.role,
          new_role: newRole
        }
      });

      const updatedLogs = await api.getAdminActivityLogs();
      setActivityLogs(updatedLogs);
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
    const targetProfile = profiles.find(p => p.id === id);
    try {
      await api.updateProfile(id, { full_name: editingName });
      toast.success('تم تحديث الاسم بنجاح');
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, full_name: editingName } : p));

      // Log Activity
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'update_profile',
        target_user_id: id,
        target_user_name: editingName,
        target_user_email: targetProfile?.email,
        description: `قام بتعديل اسم المستخدم من (${targetProfile?.full_name}) إلى (${editingName})`,
        details: { old_name: targetProfile?.full_name, new_name: editingName }
      });

      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الاسم');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (actionLoadingId) return;
    if (!window.confirm(`هل أنت متأكد من مسح حساب (${name}) نهائياً؟`)) return;
    setActionLoadingId(id);
    const targetProfile = profiles.find(p => p.id === id);
    try {
      await api.deleteProfile(id);
      toast.success('تم مسح الحساب بنجاح');
      setProfiles(prev => prev.filter(p => p.id !== id));

      // Log Activity
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'delete_user',
        target_user_id: id,
        target_user_name: name,
        target_user_email: targetProfile?.email,
        description: `قام بحذف حساب المستخدم (${name}) برتبة [${getRoleLabel(targetProfile?.role || 'servant')}] نهائياً من المنصة`,
        details: { deleted_profile_id: id, email: targetProfile?.email }
      });

      const updatedLogs = await api.getAdminActivityLogs();
      setActivityLogs(updatedLogs);
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
    const targetProfile = profiles.find(p => p.id === userId);
    const isAdding = !current.includes(permKey);
    const updated = isAdding
      ? [...current, permKey]
      : current.filter(p => p !== permKey);

    try {
      await api.setUserPermissions(userId, updated);
      setUserPermissions(prev => ({ ...prev, [userId]: updated }));
      toast.success('تم تحديث الصلاحية الفرعية بنجاح');

      // Log Activity
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'update_permissions',
        target_user_id: userId,
        target_user_name: targetProfile?.full_name,
        target_user_email: targetProfile?.email,
        description: `قام ${isAdding ? 'بمنح' : 'بإلغاء'} صلاحية [${(PERMISSION_LABELS as Record<string, string>)[permKey] || permKey}] للمستخدم (${targetProfile?.full_name})`,
        details: {
          permission_key: permKey,
          action: isAdding ? 'granted' : 'revoked'
        }
      });
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
        try {
          await api.setUserPermissions(res.user.id, creationPermissions);
        } catch (permErr: any) {
          console.warn('Could not assign initial user permissions:', permErr);
        }
      }

      if (role === 'service_leader' && res.user?.id && creationAssignedServices.length > 0) {
        try {
          await saveLeaderAssignedServices(res.user.id, creationAssignedServices, siteSettings);
        } catch (servErr) {
          console.warn('Could not assign services on user creation:', servErr);
        }
      }

      // Save to Credentials Vault & Sheet
      const newCred: SavedCredential = {
        id: res.user?.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        initial_password: password,
        role: role,
        created_at: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' }),
        created_by: currentAdminProfile?.full_name || 'مسؤول النظام'
      };
      await saveToVault(newCred);

      // Log Activity to Audit Trail
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'create_user',
        target_user_id: res.user?.id,
        target_user_name: fullName.trim(),
        target_user_email: email.trim().toLowerCase(),
        description: `قام بإنشاء حساب جديد للمستخدم (${fullName.trim()}) برتبة [${getRoleLabel(role)}] وتم حفظ كلمة المرور في الشيت`,
        details: {
          role,
          permissions: creationPermissions,
          assigned_services: creationAssignedServices
        }
      });

      toast.success(`تم إنشاء حساب (${fullName}) بنجاح وتوثيق كلمة المرور في الشيت وسجل النشاطات ✨`);
      
      // Clear inputs
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('servant');
      setCreationPermissions([]);
      setCreationAssignedServices([]);

      await fetchProfiles();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إنشاء الحساب. تأكد من صحة البيانات وعدم تكرار البريد.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenAssignModal = (p: Profile) => {
    setAssigningLeaderProfile(p);
    const assigned = getLeaderAssignedServices(p.id, siteSettings);
    setModalAssignedServices(assigned);
  };

  const handleSaveLeaderServices = async () => {
    if (!assigningLeaderProfile) return;
    setSavingServiceAssignment(true);
    try {
      await saveLeaderAssignedServices(assigningLeaderProfile.id, modalAssignedServices, siteSettings);
      
      const updatedSettings = { ...siteSettings };
      updatedSettings[`service_leader_assigned_services_${assigningLeaderProfile.id}`] = JSON.stringify(modalAssignedServices);
      
      ALL_CHURCH_SERVICE_CATEGORIES.forEach(item => {
        const catKey = `service_assignment_${item.category}`;
        const raw = updatedSettings[catKey];
        let cfg = raw ? JSON.parse(raw) : { leader_ids: [] };
        let lIds = new Set(cfg.leader_ids || []);
        if (modalAssignedServices.includes(item.category)) lIds.add(assigningLeaderProfile.id);
        else lIds.delete(assigningLeaderProfile.id);
        cfg.leader_ids = Array.from(lIds);
        updatedSettings[catKey] = JSON.stringify(cfg);
      });

      setSiteSettings(updatedSettings);

      // Log Activity
      await api.logAdminActivity({
        admin_id: currentAdminProfile?.id || 'admin',
        admin_name: currentAdminProfile?.full_name || 'مسؤول النظام',
        admin_email: currentAdminProfile?.email || '',
        action_type: 'assign_services',
        target_user_id: assigningLeaderProfile.id,
        target_user_name: assigningLeaderProfile.full_name,
        target_user_email: assigningLeaderProfile.email,
        description: `قام بتعيين الخدمات المسندة لأمين الخدمة (${assigningLeaderProfile.full_name}): [${modalAssignedServices.length} خدمات مخصصة]`,
        details: {
          assigned_services: modalAssignedServices
        }
      });

      toast.success(`تم تحديث الخدمات المسندة لأمين الخدمة (${assigningLeaderProfile.full_name}) بنجاح ✨`);
      setAssigningLeaderProfile(null);
      const updatedLogs = await api.getAdminActivityLogs();
      setActivityLogs(updatedLogs);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ الخدمات المسندة');
    } finally {
      setSavingServiceAssignment(false);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.full_name.includes(searchTerm) ||
    p.email.includes(searchTerm) ||
    p.role.includes(searchTerm)
  );

  const filteredVault = credentialsVault.filter(c => {
    const matchesSearch = c.full_name.includes(vaultSearch) || c.email.includes(vaultSearch);
    const matchesRole = vaultRoleFilter === 'all' || c.role === vaultRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = activityLogs.filter(l => {
    const matchesSearch = 
      l.description.includes(logSearch) || 
      l.admin_name.includes(logSearch) || 
      (l.target_user_name && l.target_user_name.includes(logSearch)) ||
      (l.target_user_email && l.target_user_email.includes(logSearch));
    const matchesType = logTypeFilter === 'all' || l.action_type === logTypeFilter;
    return matchesSearch && matchesType;
  });

  const getRoleBadgeClass = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold';
      case 'admin':
        return 'bg-purple-50 border-purple-200 text-purple-700 font-bold';
      case 'priest':
        return 'bg-amber-50 border-amber-200 text-amber-800 font-bold';
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

  const getActionTypeBadge = (type: string) => {
    switch (type) {
      case 'create_user':
        return { label: 'إنشاء حساب جديد', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Plus };
      case 'update_role':
        return { label: 'تغيير رتبة/دور', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Award };
      case 'update_permissions':
        return { label: 'تعديل صلاحيات', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Shield };
      case 'assign_services':
        return { label: 'توزيع وتعيين خدمات', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Layers };
      case 'update_profile':
        return { label: 'تعديل بيانات', bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: Edit2 };
      case 'delete_user':
        return { label: 'حذف حساب', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: Trash2 };
      default:
        return { label: 'نشاط إداري', bg: 'bg-slate-50 text-slate-800 border-slate-200', icon: Clock };
    }
  };

  const getActionTypeLabel = (type: string) => {
    return getActionTypeBadge(type).label;
  };

  return (
    <DashboardLayout role={currentAdminProfile?.role || 'admin'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-tajawal text-2xl font-extrabold text-[#00174a]">
                إدارة المستخدمين والصلاحيات وسجل النشاطات
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                إنشاء الحسابات، تعيين الرتب والصلاحيات، شيت كلمات المرور، وتتبع سجل نشاطات الأدمن.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xs">
              <User className="w-4 h-4 text-[#002366]" />
              <span className="text-xs font-bold text-slate-600">المستخدمين:</span>
              <span className="font-black text-sm text-[#002366]">{profiles.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xs">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-600">بالشيت:</span>
              <span className="font-black text-sm text-amber-700">{credentialsVault.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xs">
              <History className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-600">النشاطات:</span>
              <span className="font-black text-sm text-emerald-700">{activityLogs.length}</span>
            </div>
          </div>
        </div>

        {/* ── 3 MODERN TABS BAR ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 rounded-2xl font-tajawal font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>إدارة الحسابات وتعيين الصلاحيات ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-5 py-3 rounded-2xl font-tajawal font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>شيت بيانات وكلمات مرور الخدام ({credentialsVault.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 rounded-2xl font-tajawal font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل نشاطات الأدمن (Activity Log) ({activityLogs.length})</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: USERS & PERMISSIONS MANAGEMENT
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main User List (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-tajawal font-black text-base text-[#002366]">
                      كشوفات المستخدمين والخدام المسجلين
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      تعديل الرتب، الصلاحيات الفرعية، والخدمات المسندة
                    </p>
                  </div>
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
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={e => setEditingName(e.target.value)}
                                      className="bg-white border border-[#002366] rounded-lg px-2 py-1 text-xs text-slate-900 outline-none"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveName(p.id)}
                                      disabled={actionLoadingId === p.id}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                      title="حفظ"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                      title="إلغاء"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-[#00174a]">{p.full_name}</span>
                                    <button
                                      onClick={() => {
                                        setEditingId(p.id);
                                        setEditingName(p.full_name);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity p-1 cursor-pointer"
                                      title="تعديل الاسم"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              <td className="p-4 font-mono text-xs text-slate-500">{p.email}</td>

                              <td className="p-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] border ${getRoleBadgeClass(p.role)}`}>
                                  {getRoleLabel(p.role)}
                                </span>
                              </td>

                              <td className="p-4">
                                <select
                                  disabled={actionLoadingId === p.id}
                                  value={p.role}
                                  onChange={e => handleRoleChange(p.id, e.target.value as UserRole)}
                                  className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none font-bold cursor-pointer disabled:opacity-50"
                                >
                                  <option value="servant">خادم متابعة (Servant)</option>
                                  <option value="service_leader">أمين خدمة (Service Leader)</option>
                                  <option value="priest">كاهن (Priest)</option>
                                  <option value="membership">مسؤول عضوية (Membership)</option>
                                  <option value="board">عضو مجلس (Board)</option>
                                  <option value="admin">مسؤول نظام (Admin)</option>
                                  <option value="super_admin">مدير عام نظام (Super Admin)</option>
                                </select>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  {p.role === 'service_leader' && (
                                    <button
                                      onClick={() => handleOpenAssignModal(p)}
                                      className="px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                                      title="تحديد المراحل والخدمات المسندة لأمين الخدمة"
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                      <span>الخدمات ({getLeaderAssignedServices(p.id, siteSettings).length})</span>
                                    </button>
                                  )}

                                  {p.role !== 'super_admin' && p.role !== 'admin' && (
                                    <button
                                      onClick={() => setExpandedProfileId(expandedProfileId === p.id ? null : p.id)}
                                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="تخصيص صلاحيات فرعية لهذا الخادم"
                                    >
                                      <Award className="w-3.5 h-3.5 text-[#002366]" />
                                      <span>الصلاحيات ({userPermissions[p.id]?.length || 0})</span>
                                      {expandedProfileId === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteProfile(p.id, p.full_name)}
                                    disabled={actionLoadingId === p.id}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                    title="مسح الحساب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {expandedProfileId === p.id && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={5} className="p-6 border-y border-slate-200">
                                  <div className="space-y-4 max-w-3xl mx-auto">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                      <h4 className="font-tajawal font-bold text-xs text-[#00174a] flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-[#d4af37]" />
                                        <span>تخصيص الصلاحيات الفرعية للحساب: ({p.full_name})</span>
                                      </h4>
                                      <span className="text-[11px] text-slate-500">
                                        تُمنح هذه الصلاحيات الإضافية فوق الصلاحيات الافتراضية للرتبة
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {PERMISSION_GROUPS.map(g => (
                                        <div key={g.label} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                                          <p className="text-xs font-black text-[#002366] border-b border-slate-100 pb-1">
                                            {g.label}
                                          </p>
                                          <div className="space-y-1.5">
                                            {g.permissions.map(permKey => {
                                              const hasPerm = (userPermissions[p.id] || []).includes(permKey);
                                              const loadingThis = actionLoadingId === `${p.id}-${permKey}`;
                                              return (
                                                <label
                                                  key={permKey}
                                                  className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer hover:text-black"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={hasPerm}
                                                    disabled={loadingThis}
                                                    onChange={() => handleTogglePermission(p.id, permKey)}
                                                    className="rounded border-slate-300 text-[#002366] focus:ring-0 accent-[#002366] cursor-pointer"
                                                  />
                                                  <span className={hasPerm ? 'text-[#002366] font-black' : ''}>
                                                    {(PERMISSION_LABELS as Record<string, string>)[permKey] || permKey}
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
            </div>

            {/* Side Card: Create New User Form (1/3 width) */}
            <div className="space-y-6">
              <div className="bg-[#00174a] text-white rounded-3xl p-6 sm:p-7 border border-[#d4af37]/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#fed65b] text-[#00174a] rounded-xl font-bold">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-tajawal font-black text-base text-[#fed65b]">
                        إنشاء حساب مستخدم جديد
                      </h3>
                      <p className="text-[11px] text-slate-300 font-semibold">
                        تعيين كلمة المرور والصلاحيات وحفظها بالشيت
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200">الاسم الكامل للخادم / المستخدم *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: بيتر ميخائيل جرجس"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 focus:border-[#fed65b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors font-bold placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200">البريد الإلكتروني للولوج *</label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="user@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 focus:border-[#fed65b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors font-mono placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-200">كلمة المرور المبدئية *</label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[11px] text-[#fed65b] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>توليد كلمة قوية 🎲</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        dir="ltr"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/15 focus:border-[#fed65b] rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white outline-none transition-colors font-mono font-bold select-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-200">الرتبة / الدور الأساسي *</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-900 border border-white/20 focus:border-[#fed65b] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-bold cursor-pointer"
                    >
                      <option value="servant">خادم متابعة (Servant)</option>
                      <option value="service_leader">أمين خدمة (Service Leader)</option>
                      <option value="priest">كاهن (Priest)</option>
                      <option value="membership">مسؤول عضوية (Membership)</option>
                      <option value="board">عضو مجلس (Board)</option>
                      <option value="admin">مسؤول نظام (Admin)</option>
                      <option value="super_admin">مدير عام نظام (Super Admin)</option>
                    </select>
                  </div>

                  {role === 'service_leader' && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="block text-xs font-bold text-[#fed65b]">
                        تحديد المراحل والخدمات المسندة لأمين الخدمة:
                      </label>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white/5 rounded-xl border border-white/5">
                        {ALL_CHURCH_SERVICE_CATEGORIES.map(cat => (
                          <label key={cat.category} className="flex items-center gap-2 text-[11px] text-slate-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={creationAssignedServices.includes(cat.category)}
                              onChange={() => {
                                setCreationAssignedServices(prev => 
                                  prev.includes(cat.category) 
                                    ? prev.filter(c => c !== cat.category) 
                                    : [...prev, cat.category]
                                );
                              }}
                              className="accent-[#fed65b] w-3.5 h-3.5"
                            />
                            <span className="font-semibold">{cat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

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
                                <span>{(PERMISSION_LABELS as Record<string, string>)[p] || p}</span>
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
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submitLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وتوثيق البيانات بالشيت'}</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: CREDENTIALS SHEET & VAULT
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'vault' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-tajawal text-xl font-extrabold text-[#00174a] flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-[#d4af37]" />
                  <span>شيت بيانات الحسابات وكلمات المرور الرسمية</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  سجل تفاعلي لكلمات المرور المبدئية لجميع الخدام، مع إمكانية التصدير للإكسيل والنسخ المباشر لرسائل الواتساب.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportVaultToExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير الشيت إلى Excel / CSV</span>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، البريد الإلكتروني..."
                  value={vaultSearch}
                  onChange={e => setVaultSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={vaultRoleFilter}
                  onChange={e => setVaultRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">كل الرتب والأدوار</option>
                  <option value="priest">كهنة (Priest)</option>
                  <option value="service_leader">أمناء خدمة (Service Leader)</option>
                  <option value="servant">خدام متابعة (Servant)</option>
                  <option value="membership">مسؤولي عضوية (Membership)</option>
                  <option value="board">أعضاء مجلس (Board)</option>
                  <option value="admin">مسؤولي نظام (Admin)</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              {filteredVault.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-bold space-y-2">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300" />
                  <p>لا توجد حسابات مطابقة في الشيت بعد.</p>
                  <p className="text-xs text-slate-400 font-semibold">أي حساب جديد يتم إنشاؤه سيُحفظ مباشرة في هذا الشيت بكلمة مروره.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#00174a] text-[#fed65b] font-tajawal font-bold border-b border-slate-200">
                        <th className="p-3.5 text-center w-12">#</th>
                        <th className="p-3.5">الاسم الكامل للخادم</th>
                        <th className="p-3.5">البريد الإلكتروني</th>
                        <th className="p-3.5">كلمة المرور المبدئية</th>
                        <th className="p-3.5">الرتبة / الدور</th>
                        <th className="p-3.5">تاريخ التسجيل</th>
                        <th className="p-3.5 text-center">إجراءات سريعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredVault.map((c, i) => {
                        const isPassVisible = visiblePasswords[c.email];
                        return (
                          <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3.5 text-center text-slate-400 font-mono">{i + 1}</td>
                            <td className="p-3.5 font-bold text-[#00174a]">{c.full_name}</td>
                            <td className="p-3.5 font-mono text-slate-600 select-all">{c.email}</td>
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl">
                                <span className="font-mono font-bold text-slate-900 select-all">
                                  {isPassVisible ? c.initial_password : '••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setVisiblePasswords(prev => ({ ...prev, [c.email]: !prev[c.email] }))}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  title={isPassVisible ? "إخفاء" : "إظهار كلمة المرور"}
                                >
                                  {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(c.initial_password, 'كلمة المرور')}
                                  className="text-slate-400 hover:text-[#002366] p-0.5 cursor-pointer"
                                  title="نسخ كلمة المرور"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getRoleBadgeClass(c.role)}`}>
                                {getRoleLabel(c.role)}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">{c.created_at}</td>
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => copyWhatsAppFormat(c)}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                  title="نسخ رسالة الترحيب وبيانات الدخول للواتساب"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">نسخ لواتساب</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteFromVault(c.email)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="حذف من الشيت"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-bold pt-2">
              <span>إجمالي الحسابات المسجلة بالشيت: {filteredVault.length} حساب</span>
              <span>تم حفظ البيانات محلياً وعلى سحابة الكنيسة بشكل آمن 🔒</span>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: ADMIN ACTIVITY LOGS & AUDIT TRAIL
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-tajawal text-xl font-extrabold text-[#00174a] flex items-center gap-2">
                  <History className="w-6 h-6 text-emerald-600" />
                  <span>سجل نشاطات وعمليات مسؤولي النظام (Activity Log & Audit Trail)</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  تتبع دقيق ومؤرخ لجميع العمليات الإدارية: من أنشأ حسابات، لمن أُنشئت، تعديل الرتب والصلاحيات، والتوقيت الزمني الدقيق.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={refreshLogs}
                  disabled={logsLoading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                  <span>تحديث السجل</span>
                </button>

                <button
                  onClick={exportLogsToExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير السجل إلى Excel</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث في سجل النشاطات (اسم الأدمن، اسم المستخدم، الوصف)..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={logTypeFilter}
                  onChange={e => setLogTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">كل أنواع العمليات</option>
                  <option value="create_user">إنشاء حسابات جديدة</option>
                  <option value="update_role">تعديل الرتب والأدوار</option>
                  <option value="update_permissions">تعديل الصلاحيات الفرعية</option>
                  <option value="assign_services">توزيع الخدمات</option>
                  <option value="update_profile">تعديل البيانات</option>
                  <option value="delete_user">حذف حسابات</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-bold space-y-2">
                  <History className="w-12 h-12 mx-auto text-slate-300" />
                  <p>لا توجد نشاطات مسجلة حتى الآن في السجل.</p>
                  <p className="text-xs text-slate-400 font-semibold">أي عملية إنشاء حساب أو تعديل صلاحيات يقوم بها الأدمن ستظهر هنا تلقائياً.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const badge = getActionTypeBadge(log.action_type);
                    const Icon = badge.icon;
                    return (
                      <div
                        key={log.id}
                        className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-2xl border ${badge.bg} shrink-0 shadow-2xs`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              
                              <span className="font-tajawal font-black text-xs text-[#00174a]">
                                المشرف: {log.admin_name}
                              </span>

                              {log.admin_email && (
                                <span className="font-mono text-[11px] text-slate-400">
                                  ({log.admin_email})
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                              {log.description}
                            </p>

                            {log.target_user_name && (
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                                <span>المستخدم المستهدف:</span>
                                <span className="text-[#002366] font-bold">{log.target_user_name}</span>
                                {log.target_user_email && <span className="font-mono">({log.target_user_email})</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <div className="text-left text-slate-400 text-xs font-semibold flex items-center gap-1.5" dir="ltr">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>

                          {log.details && Object.keys(log.details).length > 0 && (
                            <button
                              onClick={() => setSelectedLogDetails(log)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              title="عرض التفاصيل التقنية"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODALS
        ══════════════════════════════════════════════════════════════ */}

        {/* Modal: Activity Log Details Popup */}
        {selectedLogDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#002366] text-[#fed65b] rounded-xl font-bold">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-base font-extrabold text-[#00174a]">
                      تفاصيل النشاط الإداري
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {new Date(selectedLogDetails.timestamp).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">المشرف المسؤول:</span>
                    <span className="font-black text-[#00174a]">{selectedLogDetails.admin_name} ({selectedLogDetails.admin_email})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">نوع النشاط:</span>
                    <span className="font-black text-emerald-700">{getActionTypeLabel(selectedLogDetails.action_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">المستخدم المستهدف:</span>
                    <span className="font-black text-[#002366]">{selectedLogDetails.target_user_name || '-'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">الوصف:</label>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 leading-relaxed">
                    {selectedLogDetails.description}
                  </p>
                </div>

                {selectedLogDetails.details && Object.keys(selectedLogDetails.details).length > 0 && (
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold block">البيانات الإضافية (Metadata):</label>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40" dir="ltr">
                      {JSON.stringify(selectedLogDetails.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Assign Services to Service Leader */}
        {assigningLeaderProfile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-extrabold text-[#00174a]">
                      تحديد الخدمات المسندة لأمين الخدمة
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {assigningLeaderProfile.full_name} ({assigningLeaderProfile.email})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAssigningLeaderProfile(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    اختر المرحلة أو المراحل التي يشرف عليها هذا الأمين:
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setModalAssignedServices(ALL_CHURCH_SERVICE_CATEGORIES.map(c => c.category))}
                      className="text-cyan-700 hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setModalAssignedServices([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {ALL_CHURCH_SERVICE_CATEGORIES.map(cat => {
                    const isSelected = modalAssignedServices.includes(cat.category);
                    return (
                      <div
                        key={cat.category}
                        onClick={() => {
                          setModalAssignedServices(prev => 
                            isSelected ? prev.filter(c => c !== cat.category) : [...prev, cat.category]
                          );
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-50/80 border-cyan-500 text-cyan-950 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-cyan-600 text-xl">{cat.icon}</span>
                          <span className="text-xs">{cat.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-cyan-600 w-4 h-4"
                        />
                      </div>
                    );
                  })}
                </div>

                {modalAssignedServices.length === 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تنبيه: إذا لم يتم تحديد أي خدمة، لن تظهر أي أسر أو بيانات لهذا الأمين عند تسجيل دخوله.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningLeaderProfile(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={savingServiceAssignment}
                  onClick={handleSaveLeaderServices}
                  className="bg-[#002366] hover:bg-[#00174a] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#fed65b]" />
                  <span>{savingServiceAssignment ? 'جاري الحفظ...' : 'حفظ تعيين الخدمات'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

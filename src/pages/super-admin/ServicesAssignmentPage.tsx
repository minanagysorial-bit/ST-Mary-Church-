import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Shield,
  Church,
  Users,
  UserCheck,
  Edit2,
  Check,
  X,
  Plus,
  Save,
  ChevronLeft,
  Sparkles,
  Layers,
  CheckCircle2,
  FolderOpen,
  Calendar,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  UserPlus,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api, Profile, ChurchServiceCategory, Family, FamilyServant } from '../../lib/api';
import { adminCreateUser } from '../../lib/auth';
import { useToast } from '../../components/common/Toast';
import { 
  type DayOfWeekArabic, 
  type ServiceScheduleConfig,
  DEFAULT_SERVICE_SCHEDULES 
} from '../../lib/attendanceStatusHelper';
import {
  ChurchServiceItem,
  getAllChurchServices,
  saveCustomServices,
  deleteCustomService
} from '../../lib/servicesAssignmentHelper';

const DAYS_LIST: DayOfWeekArabic[] = [
  'الجمعة',
  'الأحد',
  'السبت',
  'الخميس',
  'الأربعاء',
  'الثلاثاء',
  'الإثنين'
];

const AVAILABLE_ICONS = [
  { label: 'بنين / أولاد', value: 'boy' },
  { label: 'بنات', value: 'girl' },
  { label: 'مدرسة / فصول', value: 'school' },
  { label: 'شباب / مجموعات', value: 'groups' },
  { label: 'شابات / لقاءات', value: 'groups_2' },
  { label: 'مكتبة / دراسة', value: 'local_library' },
  { label: 'خريجين / عمل', value: 'work' },
  { label: 'عرس / أسرة', value: 'favorite' },
  { label: 'كنيسة / هيكل', value: 'church' },
  { label: 'كتاب مقدس', value: 'auto_stories' },
  { label: 'ألحان وتسبيح', value: 'music_note' },
  { label: 'خدمة عامة', value: 'diversity_3' }
];

interface ExcelServantRow {
  index: number;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  isValid: boolean;
  errors: string[];
  status: 'pending' | 'creating' | 'created' | 'failed' | 'exists';
  statusMessage?: string;
}

export const ServicesAssignmentPage: React.FC = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'services' | 'excel_import' | 'distribution'>('services');

  // Core Data
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyServants, setFamilyServants] = useState<FamilyServant[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [allServices, setAllServices] = useState<ChurchServiceItem[]>([]);
  const [assignments, setAssignments] = useState<Record<string, ServiceScheduleConfig>>({});
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // Edit Service Modal State
  const [activeService, setActiveService] = useState<ChurchServiceItem | null>(null);
  const [selectedPriests, setSelectedPriests] = useState<string[]>([]);
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [serviceDay, setServiceDay] = useState<DayOfWeekArabic>('الجمعة');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [serviceNotes, setServiceNotes] = useState<string>('');

  // Add Custom Service Modal State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('school');
  const [newServiceDay, setNewServiceDay] = useState<DayOfWeekArabic>('الجمعة');
  const [newServiceStart, setNewServiceStart] = useState('09:00');
  const [newServiceEnd, setNewServiceEnd] = useState('11:30');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [creatingService, setCreatingService] = useState(false);

  // Excel Bulk Import States
  const [excelRows, setExcelRows] = useState<ExcelServantRow[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  // Distribution State
  const [servantFilter, setServantFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [servantSearchTerm, setServantSearchTerm] = useState('');
  const [assigningServant, setAssigningServant] = useState<Profile | null>(null);
  const [distTargetService, setDistTargetService] = useState<string>('');
  const [distTargetFamilyId, setDistTargetFamilyId] = useState<string>('');
  const [distNewFamilyName, setDistNewFamilyName] = useState<string>('');
  const [savingDistribution, setSavingDistribution] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profilesData, settings, famsData, famServantsData] = await Promise.all([
        api.getProfiles(),
        api.getSiteSettings().catch(() => ({} as Record<string, string>)),
        api.getFamilies().catch(() => []),
        api.getFamilyServantsForAll().catch(() => [])
      ]);

      setProfiles(profilesData);
      setFamilies(famsData);
      setFamilyServants(famServantsData);
      setSiteSettings(settings);

      const servicesList = getAllChurchServices(settings);
      setAllServices(servicesList);

      // Parse saved assignments from siteSettings or local defaults
      const configMap: Record<string, ServiceScheduleConfig> = {};
      servicesList.forEach(item => {
        const defaultSched = item.defaultDay
          ? { day: item.defaultDay, start: item.defaultStart || '09:00', end: item.defaultEnd || '11:30' }
          : (DEFAULT_SERVICE_SCHEDULES[item.category] || { day: 'الجمعة', start: '09:00', end: '11:30' });

        const raw = settings[`service_assignment_${item.category}`];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            configMap[item.category] = {
              priest_ids: parsed.priest_ids || [],
              leader_ids: parsed.leader_ids || [],
              day_of_week: parsed.day_of_week || defaultSched.day,
              start_time: parsed.start_time || defaultSched.start,
              end_time: parsed.end_time || defaultSched.end,
              notes: parsed.notes || ''
            };
          } catch {
            configMap[item.category] = {
              priest_ids: [],
              leader_ids: [],
              day_of_week: defaultSched.day,
              start_time: defaultSched.start,
              end_time: defaultSched.end
            };
          }
        } else {
          const local = localStorage.getItem(`church_service_assign_${item.category}`);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              configMap[item.category] = {
                priest_ids: parsed.priest_ids || [],
                leader_ids: parsed.leader_ids || [],
                day_of_week: parsed.day_of_week || defaultSched.day,
                start_time: parsed.start_time || defaultSched.start,
                end_time: parsed.end_time || defaultSched.end,
                notes: parsed.notes || ''
              };
            } catch {
              configMap[item.category] = {
                priest_ids: [],
                leader_ids: [],
                day_of_week: defaultSched.day,
                start_time: defaultSched.start,
                end_time: defaultSched.end
              };
            }
          } else {
            configMap[item.category] = {
              priest_ids: [],
              leader_ids: [],
              day_of_week: defaultSched.day,
              start_time: defaultSched.start,
              end_time: defaultSched.end
            };
          }
        }
      });

      setAssignments(configMap);
    } catch (err) {
      console.error('Error loading service assignments:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات الخدمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allPriests = profiles.filter(p => p.role === 'priest');
  const allServiceLeaders = profiles.filter(p => p.role === 'service_leader' || p.role === 'servant');
  const allServantsOnly = profiles.filter(p => p.role === 'servant');

  // Open Edit Service Modal
  const handleOpenEdit = (service: ChurchServiceItem) => {
    const defaultSched = service.defaultDay
      ? { day: service.defaultDay, start: service.defaultStart || '09:00', end: service.defaultEnd || '11:30' }
      : (DEFAULT_SERVICE_SCHEDULES[service.category] || { day: 'الجمعة', start: '09:00', end: '11:30' });

    const current = assignments[service.category] || { 
      priest_ids: [], 
      leader_ids: [],
      day_of_week: defaultSched.day,
      start_time: defaultSched.start,
      end_time: defaultSched.end
    };
    setActiveService(service);
    setSelectedPriests(current.priest_ids || []);
    setSelectedLeaders(current.leader_ids || []);
    setServiceDay(current.day_of_week || defaultSched.day);
    setStartTime(current.start_time || defaultSched.start);
    setEndTime(current.end_time || defaultSched.end);
    setServiceNotes(current.notes || '');
  };

  // Save Service Assignment
  const handleSaveAssignment = async (service: ChurchServiceItem) => {
    setSavingCategory(service.category);
    const config: ServiceScheduleConfig = {
      priest_ids: selectedPriests,
      leader_ids: selectedLeaders,
      day_of_week: serviceDay,
      start_time: startTime,
      end_time: endTime,
      notes: serviceNotes.trim()
    };

    try {
      const key = `service_assignment_${service.category}`;
      const syncUpdates: Record<string, string> = { [key]: JSON.stringify(config) };

      allServiceLeaders.forEach(leader => {
        const directKey = `service_leader_assigned_services_${leader.id}`;
        const currentServices = new Set<string>();
        allServices.forEach(c => {
          if (c.category === service.category) {
            if (selectedLeaders.includes(leader.id)) currentServices.add(c.category);
          } else {
            const otherConfig = assignments[c.category];
            if (otherConfig?.leader_ids?.includes(leader.id)) {
              currentServices.add(c.category);
            }
          }
        });
        syncUpdates[directKey] = JSON.stringify(Array.from(currentServices));
      });

      allPriests.forEach(priest => {
        const directKey = `priest_assigned_services_${priest.id}`;
        const currentServices = new Set<string>();
        allServices.forEach(c => {
          if (c.category === service.category) {
            if (selectedPriests.includes(priest.id)) currentServices.add(c.category);
          } else {
            const otherConfig = assignments[c.category];
            if (otherConfig?.priest_ids?.includes(priest.id)) {
              currentServices.add(c.category);
            }
          }
        });
        syncUpdates[directKey] = JSON.stringify(Array.from(currentServices));
      });

      await api.updateSiteSettings(syncUpdates);
      localStorage.setItem(`church_service_assign_${service.category}`, JSON.stringify(config));

      setAssignments(prev => ({ ...prev, [service.category]: config }));
      toast.success(`تم حفظ موعد وتعيين مشرفي وأمناء ${service.category} بنجاح ✨`);
      setActiveService(null);
    } catch (err: any) {
      console.warn('API save warning, saving locally:', err);
      localStorage.setItem(`church_service_assign_${service.category}`, JSON.stringify(config));
      setAssignments(prev => ({ ...prev, [service.category]: config }));
      toast.success(`تم حفظ تعيينات ومواعيد ${service.category} بنجاح`);
      setActiveService(null);
    } finally {
      setSavingCategory(null);
    }
  };

  // Add New Custom Service
  const handleCreateCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      toast.error('يرجى كتابة اسم الخدمة الجديدة');
      return;
    }

    const trimmedName = newServiceName.trim();
    if (allServices.some(s => s.category.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('هذه الخدمة موجودة بالفعل');
      return;
    }

    setCreatingService(true);
    try {
      const newServiceItem: ChurchServiceItem = {
        id: 'serv_' + Date.now(),
        category: trimmedName,
        label: trimmedName,
        icon: newServiceIcon,
        description: newServiceDesc.trim() || `خدمة ${trimmedName} الكنسية (${newServiceDay} ${newServiceStart})`,
        isCustom: true,
        defaultDay: newServiceDay,
        defaultStart: newServiceStart,
        defaultEnd: newServiceEnd
      };

      const updatedList = [...allServices, newServiceItem];
      await saveCustomServices(updatedList, siteSettings);

      // Save initial schedule
      const initSchedule: ServiceScheduleConfig = {
        priest_ids: [],
        leader_ids: [],
        day_of_week: newServiceDay,
        start_time: newServiceStart,
        end_time: newServiceEnd,
        notes: newServiceDesc.trim()
      };
      await api.updateSiteSettings({
        [`service_assignment_${trimmedName}`]: JSON.stringify(initSchedule)
      });

      setAllServices(updatedList);
      setAssignments(prev => ({ ...prev, [trimmedName]: initSchedule }));

      toast.success(`تمت إضافة خدمة "${trimmedName}" بنجاح! يمكنك الآن تعيين مسؤوليها.`);
      setShowAddServiceModal(false);
      setNewServiceName('');
      setNewServiceDesc('');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إضافة الخدمة: ' + err.message);
    } finally {
      setCreatingService(false);
    }
  };

  // Delete Custom Service
  const handleDeleteCustomService = async (service: ChurchServiceItem) => {
    if (!window.confirm(`هل أنت متأكد من حذف خدمة "${service.category}" نهائياً من النظام؟`)) return;
    try {
      await deleteCustomService(service.category, siteSettings);
      const updatedList = allServices.filter(s => s.category !== service.category);
      setAllServices(updatedList);
      toast.success(`تم حذف خدمة "${service.category}" بنجاح`);
    } catch (err: any) {
      toast.error('فشل حذف الخدمة: ' + err.message);
    }
  };

  // ==========================================
  // EXCEL BULK IMPORT LOGIC
  // ==========================================

  // Download Sample Template (Excel .xlsx)
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'الاسم الكامل': 'خادم مينا جورج فكري',
        'رقم التليفون': '01223344556',
        'البريد الإلكتروني': 'mina.george@stmary.church',
        'كلمة المرور': 'Servant@2026'
      },
      {
        'الاسم الكامل': 'تاسوني مارينا يوسف بولس',
        'رقم التليفون': '01012345678',
        'البريد الإلكتروني': 'marina.youssef@stmary.church',
        'كلمة المرور': 'Servant@2026'
      },
      {
        'الاسم الكامل': 'خادم بيتر سمير عزيز',
        'رقم التليفون': '01198765432',
        'البريد الإلكتروني': 'peter.samir@stmary.church',
        'كلمة المرور': 'Servant@2026'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    // Set column widths
    worksheet['!cols'] = [
      { wch: 28 }, // Name
      { wch: 16 }, // Phone
      { wch: 32 }, // Email
      { wch: 18 }  // Password
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الخدام الجدد');
    XLSX.writeFile(workbook, 'قالب_استيراد_الخدام_كنيسة_العذراء_محرم_بك.xlsx');
    toast.success('تم تحميل قالب الإكسيل بنجاح 📥');
  };

  // Handle File Upload and Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          toast.error('الملف المرفوع فارغ ولا يحتوي على أي صفوف');
          return;
        }

        const existingEmails = new Set(profiles.map(p => (p.email || '').toLowerCase().trim()));

        const parsedRows: ExcelServantRow[] = rawJson.map((row, idx) => {
          // Normalize column headers
          const fullName = String(
            row['الاسم الكامل'] || row['الاسم'] || row['اسم الخادم'] || row['name'] || row['fullName'] || row['full_name'] || ''
          ).trim();

          const phone = String(
            row['رقم التليفون'] || row['الموبايل'] || row['الهاتف'] || row['phone'] || row['mobile'] || ''
          ).replace(/\s+/g, '').trim();

          let email = String(
            row['البريد الإلكتروني'] || row['الإيميل'] || row['البريد'] || row['email'] || ''
          ).toLowerCase().trim();

          const password = String(
            row['كلمة المرور'] || row['الباسورد'] || row['الرقم السري'] || row['password'] || 'Servant@2026'
          ).trim();

          // Auto-generate email if missing
          if (!email && fullName) {
            const cleanSlug = fullName.replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '').slice(0, 10);
            email = `servant.${cleanSlug}.${Date.now().toString().slice(-4)}@stmary.church`.toLowerCase();
          }

          const errors: string[] = [];
          if (!fullName) errors.push('اسم الخادم مفقود');
          if (password.length < 6) errors.push('كلمة المرور يجب أن تكون 6 خانات على الأقل');
          if (existingEmails.has(email)) errors.push('البريد الإلكتروني مسجل بحساب سابق');

          const isValid = errors.length === 0;

          return {
            index: idx + 1,
            fullName,
            phone,
            email,
            password: password || 'Servant@2026',
            isValid,
            errors,
            status: errors.includes('البريد الإلكتروني مسجل بحساب سابق') ? 'exists' : 'pending'
          };
        });

        setExcelRows(parsedRows);
        toast.success(`تمت قراءة ${parsedRows.length} صف من ملف الإكسيل بنجاح!`);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        toast.error('حدث خطأ في قراءة ملف الإكسيل: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Batch Creation of Accounts
  const handleExecuteBatchImport = async () => {
    const validRows = excelRows.filter(r => r.isValid && r.status !== 'created');
    if (validRows.length === 0) {
      toast.error('لا توجد صفوف صالحة للإنشاء. يرجى مراجعة بيانات الجدول.');
      return;
    }

    setIsProcessingImport(true);
    setImportProgress({ current: 0, total: validRows.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    const updatedRows = [...excelRows];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const rowIndex = updatedRows.findIndex(r => r.index === row.index);

      if (rowIndex !== -1) {
        updatedRows[rowIndex].status = 'creating';
        setExcelRows([...updatedRows]);
      }

      try {
        await adminCreateUser(
          row.email,
          row.password,
          row.fullName,
          'servant',
          row.phone
        );

        if (rowIndex !== -1) {
          updatedRows[rowIndex].status = 'created';
          updatedRows[rowIndex].statusMessage = 'تم إنشاء الحساب وتفعيله بنجاح ✅';
        }
        successCount++;
      } catch (err: any) {
        console.error(`Failed to create user ${row.email}:`, err);
        if (rowIndex !== -1) {
          updatedRows[rowIndex].status = 'failed';
          updatedRows[rowIndex].statusMessage = err.message || 'فشل إنشاء الحساب';
        }
        failedCount++;
      }

      setImportProgress({
        current: i + 1,
        total: validRows.length,
        success: successCount,
        failed: failedCount
      });
      setExcelRows([...updatedRows]);
    }

    setIsProcessingImport(false);
    await loadData();

    if (successCount > 0) {
      toast.success(`تم بنجاح إنشاء وتفعيل ${successCount} حساب خادم جديد! 🎉`);
    }
    if (failedCount > 0) {
      toast.error(`تعذر إنشاء ${failedCount} حساب. راجع رسائل الخطأ في الجدول.`);
    }
  };

  // ==========================================
  // SERVANTS DISTRIBUTION LOGIC
  // ==========================================

  // Check if servant is assigned to any family/service
  const getServantAssignment = (servantId: string) => {
    const assignedRel = familyServants.filter(rel => rel.servant_id === servantId);
    const assignedFamDirect = families.filter(f => f.assigned_servant_id === servantId);
    
    const allFamIds = new Set<string>();
    assignedRel.forEach(r => allFamIds.add(r.family_id));
    assignedFamDirect.forEach(f => allFamIds.add(f.id));

    const matchedFamilies = families.filter(f => allFamIds.has(f.id));
    return matchedFamilies;
  };

  const handleOpenAssignModal = (servant: Profile) => {
    setAssigningServant(servant);
    const currentFams = getServantAssignment(servant.id);
    if (currentFams.length > 0) {
      const first = currentFams[0];
      setDistTargetService(first.stage || first.area || allServices[0]?.category || '');
      setDistTargetFamilyId(first.id);
    } else {
      setDistTargetService(allServices[0]?.category || '');
      setDistTargetFamilyId('');
    }
    setDistNewFamilyName('');
  };

  const handleSaveServantDistribution = async () => {
    if (!assigningServant) return;
    if (!distTargetService) {
      toast.error('يرجى اختيار الخدمة الكنسية');
      return;
    }

    setSavingDistribution(true);
    try {
      let finalFamilyId = distTargetFamilyId;

      // If creating a new family
      if (!finalFamilyId && distNewFamilyName.trim()) {
        const newFam = await api.createFamily({
          head_name: distNewFamilyName.trim(),
          phone: assigningServant.phone || '',
          address: 'كنيسة السيدة العذراء بمحرم بك',
          area: distTargetService,
          stage: distTargetService,
          family_type: 'sunday_school',
          assigned_servant_id: assigningServant.id,
          members_count: 0,
          service_area_id: null,
          last_visit_date: null,
          notes: `أسرة تابعة لخدمة ${distTargetService} - الخادم المسؤول: ${assigningServant.full_name}`
        });
        finalFamilyId = newFam.id;
      }

      if (!finalFamilyId) {
        toast.error('يرجى اختيار أسرة المخدومين أو كتابة اسم أسرة جديدة');
        setSavingDistribution(false);
        return;
      }

      // 1. Assign via api.assignServantToFamily & update family assigned_servant_id
      try {
        await api.assignServantToFamily(finalFamilyId, assigningServant.id);
      } catch (e) {
        console.warn('assignServantToFamily notice:', e);
      }

      await api.updateFamily(finalFamilyId, {
        assigned_servant_id: assigningServant.id,
        stage: distTargetService,
        area: distTargetService,
        family_type: 'sunday_school'
      });

      toast.success(`تم تسكين الخادم "${assigningServant.full_name}" في خدمة "${distTargetService}" بنجاح ✨`);
      setAssigningServant(null);
      await loadData();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تسكين الخادم: ' + err.message);
    } finally {
      setSavingDistribution(false);
    }
  };

  const handleUnassignServant = async (servantId: string, familyId: string, servantName: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء تسكين الخادم (${servantName}) من هذه الأسرة؟`)) return;
    try {
      await api.removeServantFromFamily(familyId, servantId);
      const fam = families.find(f => f.id === familyId);
      if (fam && fam.assigned_servant_id === servantId) {
        await api.updateFamily(familyId, { assigned_servant_id: null });
      }
      toast.success('تم إلغاء التسكين بنجاح. سيظهر حساب الخادم فارغاً لحين إعادة تسكينه.');
      await loadData();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إلغاء التسكين: ' + err.message);
    }
  };

  // Filtered servants for distribution tab
  const filteredServants = allServantsOnly.filter(s => {
    const currentFams = getServantAssignment(s.id);
    const isAssigned = currentFams.length > 0;

    if (servantFilter === 'unassigned' && isAssigned) return false;
    if (servantFilter === 'assigned' && !isAssigned) return false;

    if (servantSearchTerm.trim()) {
      const q = servantSearchTerm.toLowerCase();
      const matchName = s.full_name.toLowerCase().includes(q);
      const matchEmail = (s.email || '').toLowerCase().includes(q);
      const matchPhone = (s.phone || '').includes(q);
      return matchName || matchEmail || matchPhone;
    }

    return true;
  });

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
                إدارة الخدمات الكنسية واستيراد وتسكين الخدام
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                إضافة خدمات جديدة • استيراد وتوليد حسابات الخدام من إكسيل • تسكين الخدام في الخدمات والأسر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="bg-[#fed65b] hover:bg-amber-400 text-[#00174a] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خدمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'services'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-blue-950/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Church className="w-4 h-4" />
            <span>قطاعات ومواعيد الخدمات ({allServices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('excel_import')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'excel_import'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-blue-950/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد وتوليد حسابات الخدام من إكسيل (Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'distribution'
                ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-blue-950/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>توزيع وتسكين الخدام على الخدمات والأسر ({allServantsOnly.length})</span>
          </button>
        </div>

        {/* TAB 1: CHURCH SERVICES & SCHEDULES */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-bold border border-slate-200 shadow-sm">
                جاري تحميل قطاعات الخدمات والمسؤولين والمواعيد...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allServices.map(service => {
                  const defaultSched = service.defaultDay
                    ? { day: service.defaultDay, start: service.defaultStart || '09:00', end: service.defaultEnd || '11:30' }
                    : (DEFAULT_SERVICE_SCHEDULES[service.category] || { day: 'الجمعة', start: '09:00', end: '11:30' });

                  const current = assignments[service.category] || { 
                    priest_ids: [], 
                    leader_ids: [],
                    day_of_week: defaultSched.day,
                    start_time: defaultSched.start,
                    end_time: defaultSched.end 
                  };

                  const assignedPriests = (current.priest_ids || []).map(id => profiles.find(p => p.id === id)).filter(Boolean);
                  const assignedLeaders = (current.leader_ids || []).map(id => profiles.find(p => p.id === id)).filter(Boolean);

                  return (
                    <div
                      key={service.category}
                      className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#002366] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group relative"
                    >
                      {service.isCustom && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5">
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                            خدمة مخصصة ✨
                          </span>
                          <button
                            onClick={() => handleDeleteCustomService(service)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف هذه الخدمة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-2xl">{service.icon}</span>
                          </div>
                          {!service.isCustom && (
                            <button
                              onClick={() => handleOpenEdit(service)}
                              className="bg-slate-100 hover:bg-[#002366] text-[#002366] hover:text-[#fed65b] p-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                              title="تعديل وتعيين المسؤولين والمواعيد"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                            {service.category}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                            {service.description}
                          </p>
                        </div>

                        {/* Schedule Badge */}
                        <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs font-bold text-blue-900">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-blue-700" />
                            <span>يوم: {current.day_of_week || defaultSched.day}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-blue-800 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{current.start_time || defaultSched.start} - {current.end_time || defaultSched.end}</span>
                          </span>
                        </div>

                        {/* Assigned Priests */}
                        <div className="space-y-1.5 p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                            <span className="flex items-center gap-1">
                              <Church className="w-3.5 h-3.5 text-amber-700" />
                              <span>الآباء الكهنة المشرفون ({assignedPriests.length}):</span>
                            </span>
                          </div>
                          {assignedPriests.length === 0 ? (
                            <p className="text-[11px] text-amber-700 italic">لم يتم تعيين كاهن مشرف بعد</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedPriests.map(p => (
                                <span key={p!.id} className="bg-white border border-amber-200 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                                  {p!.full_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned Service Leaders */}
                        <div className="space-y-1.5 p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100">
                          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-900">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-cyan-700" />
                              <span>أمناء الخدمة المسؤولون ({assignedLeaders.length}):</span>
                            </span>
                          </div>
                          {assignedLeaders.length === 0 ? (
                            <p className="text-[11px] text-cyan-700 italic">لم يتم تعيين أمين خدمة بعد</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedLeaders.map(l => (
                                <span key={l!.id} className="bg-white border border-cyan-200 text-cyan-900 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                                  {l!.full_name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {current.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            💡 {current.notes}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="w-full bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل المواعيد والمسؤولين</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXCEL BULK IMPORT */}
        {activeTab === 'excel_import' && (
          <div className="space-y-6">
            {/* Explanatory Hero Card */}
            <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <span className="bg-[#fed65b] text-[#00174a] text-xs font-extrabold px-3 py-1 rounded-full inline-block">
                    ميزة الأتمتة الإدارية الذكية ⚡
                  </span>
                  <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#fed65b]">
                    رفع وتوليد حسابات الخدام دفعة واحدة عبر ملف الإكسيل
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
                    قم بتحميل القالب الجاهز، املأ أسماء الخدام وأرقام هواتفهم وإيميلاتهم، ثم ارفع الملف وسيقوم النظام بتوليد وتفعيل حساباتهم فوراً، لتتمكن من تسكينهم في الأسر والخدمات بكل سهولة.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={handleDownloadTemplate}
                    className="bg-[#fed65b] hover:bg-amber-400 text-[#00174a] font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل قالب الإكسيل (Template .xlsx)</span>
                  </button>

                  <label className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer border border-white/20 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#fed65b]" />
                    <span>رفع ملف الخدام المكتمل</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Live Preview and Execution Table */}
            {excelRows.length > 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a] flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>معاينة بيانات الخدام المراد إنشاؤهم ({excelRows.length} خادم)</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      تم فحص البيانات والتأكد من صحتها. انقر على زر البدء لتوليد الحسابات.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExcelRows([])}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                    >
                      إلغاء ومسح الجدول
                    </button>

                    <button
                      onClick={handleExecuteBatchImport}
                      disabled={isProcessingImport}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessingImport ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري إنشاء الحسابات ({importProgress.current}/{importProgress.total})...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>بدء توليد وتفعيل الحسابات الآن ✨</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar during execution */}
                {isProcessingImport && (
                  <div className="space-y-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <span>نسبة تقدم إنشاء الحسابات:</span>
                      <span>{Math.round((importProgress.current / importProgress.total) * 100)}% ({importProgress.current} من {importProgress.total})</span>
                    </div>
                    <div className="w-full h-3 bg-emerald-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="p-3">#</th>
                        <th className="p-3">اسم الخادم</th>
                        <th className="p-3">رقم الهاتف</th>
                        <th className="p-3">البريد الإلكتروني</th>
                        <th className="p-3">كلمة المرور المؤقتة</th>
                        <th className="p-3 text-center">حالة الفحص والتوليد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelRows.map(row => (
                        <tr key={row.index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono text-slate-400 font-bold">{row.index}</td>
                          <td className="p-3 font-bold text-slate-900">{row.fullName || '—'}</td>
                          <td className="p-3 font-mono text-slate-700">{row.phone || '—'}</td>
                          <td className="p-3 font-mono text-slate-600 dir-ltr text-right">{row.email}</td>
                          <td className="p-3 font-mono text-slate-500">{row.password}</td>
                          <td className="p-3 text-center">
                            {row.status === 'created' ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تم الإنشاء بنجاح</span>
                              </span>
                            ) : row.status === 'creating' ? (
                              <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1 animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري الإنشاء...</span>
                              </span>
                            ) : row.status === 'failed' ? (
                              <span className="bg-rose-100 text-rose-800 text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1" title={row.statusMessage}>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>فشل: {row.statusMessage || 'خطأ'}</span>
                              </span>
                            ) : row.isValid ? (
                              <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>جاهز للإنشاء</span>
                              </span>
                            ) : (
                              <span className="bg-rose-100 text-rose-800 text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1" title={row.errors.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{row.errors[0]}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold">
                    بعد الانتهاء من التوليد، انتقل لتبويب "توزيع وتسكين الخدام" لربط كل خادم بأسرته وخدمته.
                  </span>
                  <button
                    onClick={() => setActiveTab('distribution')}
                    className="bg-[#002366] text-[#fed65b] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <span>الانتقال لتوزيع الخدام</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h4 className="font-tajawal text-base font-bold text-slate-800">
                  لم يتم رفع ملف إكسيل بعد
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  حمل القالب من الزر أعلاه واملأ بيانات الخدام، ثم اضغط على "رفع ملف الخدام المكتمل" لعرض المعاينة والبدء في الإنشاء التلقائي.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SERVANTS DISTRIBUTION & FAMILY ASSIGNMENT */}
        {activeTab === 'distribution' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setServantFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    servantFilter === 'all'
                      ? 'bg-[#002366] text-[#fed65b]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الخدام ({allServantsOnly.length})
                </button>

                <button
                  onClick={() => setServantFilter('unassigned')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    servantFilter === 'unassigned'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>غير مسكنين في خدمة/أسرة 🔴 ({allServantsOnly.filter(s => getServantAssignment(s.id).length === 0).length})</span>
                </button>

                <button
                  onClick={() => setServantFilter('assigned')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    servantFilter === 'assigned'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>مسكنين في خدمة وأسرة 🟢 ({allServantsOnly.filter(s => getServantAssignment(s.id).length > 0).length})</span>
                </button>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="بحث باسم الخادم أو الهاتف..."
                  value={servantSearchTerm}
                  onChange={(e) => setServantSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                />
              </div>
            </div>

            {/* Servants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServants.map(servant => {
                const assignedFams = getServantAssignment(servant.id);
                const isAssigned = assignedFams.length > 0;

                return (
                  <div
                    key={servant.id}
                    className={`bg-white rounded-3xl p-5 border shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                      isAssigned
                        ? 'border-slate-200 hover:border-[#002366]'
                        : 'border-rose-300 bg-rose-50/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                            isAssigned ? 'bg-[#00174a] text-[#fed65b]' : 'bg-rose-600 text-white'
                          }`}>
                            {servant.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-tajawal text-sm font-extrabold text-slate-900">
                              {servant.full_name}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {servant.phone || 'بدون هاتف'}
                            </p>
                          </div>
                        </div>

                        {isAssigned ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            مسكن 🟢
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300 animate-pulse">
                            غير مسكن 🔴
                          </span>
                        )}
                      </div>

                      {/* Assignment Details */}
                      {isAssigned ? (
                        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                          {assignedFams.map(fam => (
                            <div key={fam.id} className="flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-[#002366] block">
                                  {fam.stage || fam.area || 'خدمة كنسية'}
                                </span>
                                <span className="text-[11px] text-slate-600 font-semibold">
                                  أسرة: {fam.head_name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnassignServant(servant.id, fam.id, servant.full_name)}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold hover:underline"
                                title="إلغاء التسكين"
                              >
                                إلغاء
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 font-semibold leading-relaxed">
                          ⚠️ هذا الخادم يرى حسابه فارغاً تماماً لحين تسكينه في خدمة وأسرة محددة.
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenAssignModal(servant)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          isAssigned
                            ? 'bg-slate-100 hover:bg-[#002366] text-[#002366] hover:text-[#fed65b]'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isAssigned ? 'تعديل أو إضافة أسرة أخرى' : 'تسكين الخادم في خدمة وأسرة الآن'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredServants.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 font-bold">
                لا توجد نتائج مطابقة لبحثك في الخدام
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 1: ADD NEW CUSTOM SERVICE */}
        {/* ========================================== */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      إضافة خدمة كنسية جديدة
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">إنشاء قطاع خدمة جديد وتحديد مواعيده وأيقونته</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomService} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الخدمة الكنسية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خدمة حضانة ملائكة، كورال سانتا ماريا..."
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">أيقونة الخدمة</label>
                  <select
                    value={newServiceIcon}
                    onChange={(e) => setNewServiceIcon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                  >
                    {AVAILABLE_ICONS.map(i => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">يوم الخدمة *</label>
                    <select
                      value={newServiceDay}
                      onChange={(e) => setNewServiceDay(e.target.value as DayOfWeekArabic)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                    >
                      {DAYS_LIST.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وقت البدء *</label>
                    <input
                      type="time"
                      value={newServiceStart}
                      onChange={(e) => setNewServiceStart(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وقت الانتهاء *</label>
                    <input
                      type="time"
                      value={newServiceEnd}
                      onChange={(e) => setNewServiceEnd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وصف وأهداف الخدمة</label>
                  <textarea
                    rows={2}
                    placeholder="وصف مختصر لمكان إقامة الخدمة والفئة المستهدفة..."
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={creatingService}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{creatingService ? 'جاري الإضافة...' : 'حفظ وإنشاء الخدمة'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 2: EDIT SERVICE SCHEDULE & LEADERS */}
        {/* ========================================== */}
        {activeService && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      إعدادات ومسؤولي: {activeService.category}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">تحديد يوم وتوقيت الخدمة والمشرفين والأمناء</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveService(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* 1. Schedule Day & Time Window */}
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-700" />
                    <span>مواعيد إقامة الخدمة ومهلة تسجيل الغياب ⏰</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">يوم الخدمة *</label>
                      <select
                        value={serviceDay}
                        onChange={(e) => setServiceDay(e.target.value as DayOfWeekArabic)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                      >
                        {DAYS_LIST.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">وقت البدء *</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">المهلة القصوى (انتهاء) *</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-[#002366]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-800 font-semibold">
                    🔴 إذا انقضت المهلة المحددة ولم يقم الخادم برفع الحضور والغياب، سيتم إظهار علامة حمراء وإرسال تنبيه آلي للأمين والكاهن.
                  </p>
                </div>

                {/* 2. Priests Assignment */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#00174a] flex items-center gap-1.5">
                    <Church className="w-4 h-4 text-amber-600" />
                    <span>الآباء الكهنة المشرفون على الخدمة:</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                    {allPriests.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">لا يوجد حسابات برتبة كاهن مسجلة بالنظام</p>
                    ) : (
                      allPriests.map(p => {
                        const isSelected = selectedPriests.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPriests([...selectedPriests, p.id]);
                                  } else {
                                    setSelectedPriests(selectedPriests.filter(id => id !== p.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span>{p.full_name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-800" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Service Leaders Assignment */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#00174a] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>أمناء الخدمة المسؤولون:</span>
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1.5 bg-slate-50">
                    {allServiceLeaders.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2">لا يوجد حسابات خدام مسجلة</p>
                    ) : (
                      allServiceLeaders.map(l => {
                        const isSelected = selectedLeaders.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-cyan-100 text-cyan-900 font-bold border border-cyan-300' : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeaders([...selectedLeaders, l.id]);
                                  } else {
                                    setSelectedLeaders(selectedLeaders.filter(id => id !== l.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span>{l.full_name} ({l.role === 'service_leader' ? 'أمين خدمة' : 'خادم'})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-800" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات وتوجيهات خاصة بالخدمة</label>
                  <textarea
                    rows={2}
                    placeholder="ملاحظات حول أهداف الخدمة أو مكان الإقامة..."
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveService(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={savingCategory !== null}
                    onClick={() => handleSaveAssignment(activeService)}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCategory ? 'جاري الحفظ...' : 'حفظ المواعيد والتعيينات'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 3: ASSIGN SERVANT TO SERVICE & FAMILY */}
        {/* ========================================== */}
        {assigningServant && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      تسكين الخادم: {assigningServant.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">ربط الخادم بالخدمة الكنسية وأسرة المخدومين</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssigningServant(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Step 1: Select Service Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الخطوة 1: اختيار الخدمة الكنسية *
                  </label>
                  <select
                    value={distTargetService}
                    onChange={(e) => {
                      setDistTargetService(e.target.value);
                      setDistTargetFamilyId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                  >
                    {allServices.map(s => (
                      <option key={s.category} value={s.category}>{s.category}</option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Existing Family or Create New */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الخطوة 2: اختيار أسرة المخدومين التابعة لهذه الخدمة *
                  </label>
                  
                  {(() => {
                    const serviceFamilies = families.filter(f => 
                      (f.stage && f.stage.includes(distTargetService)) || 
                      (f.area && f.area.includes(distTargetService)) ||
                      f.family_type === 'sunday_school'
                    );

                    return (
                      <select
                        value={distTargetFamilyId}
                        onChange={(e) => setDistTargetFamilyId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                      >
                        <option value="">-- اختر أسرة مخدومين مسجلة أو اكتب أسرة جديدة بالأسفل --</option>
                        {serviceFamilies.map(f => (
                          <option key={f.id} value={f.id}>
                            أسرة: {f.head_name} {f.stage ? `(${f.stage})` : ''}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* Optional: Create New Family Name if not in list */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أو إنشاء اسم أسرة وفصل جديد لهذا الخادم:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: أسرة مارجرجس - رابعة ابتدائي بنين"
                    value={distNewFamilyName}
                    onChange={(e) => {
                      setDistNewFamilyName(e.target.value);
                      if (e.target.value) setDistTargetFamilyId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold leading-relaxed">
                  💡 بمجرد التسكين، ستظهر لهذا الخادم فقط بيانات مخدومي هذه الأسرة والغياب والافتقاد ونقاط المعرض الخاصة بهم.
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAssigningServant(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={savingDistribution}
                    onClick={handleSaveServantDistribution}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingDistribution ? 'جاري التسكين...' : 'تأكيد التسكين والربط'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

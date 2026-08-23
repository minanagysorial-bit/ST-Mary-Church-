import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import {
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
  Heart,
  ClipboardList,
  Send,
  AlertTriangle,
  Eye,
  CreditCard,
  User,
  BookOpen,
  Briefcase,
  Download,
  Printer,
  FileText,
  Users,
  Maximize2,
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { MembershipRequest } from '../../lib/database.types';

interface ParsedDetails {
  cleanAddress: string;
  area: string;
  landmark: string;
  confessionPriest: string;
  birthDate: string;
  education: string;
  job: string;
  workPlace: string;
  chronicDiseases: string;
  email: string;
  secondaryPhone: string;
  familyMembers: Array<{ name: string; relation: string; stage: string }>;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  baptismUrl: string | null;
}

export const MembershipRequestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering Tab
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Selected Request for Full Application Modal
  const [selectedReq, setSelectedReq] = useState<MembershipRequest | null>(null);

  // Image Lightbox / Fullscreen state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection reason dialog state
  const [rejectingReqId, setRejectingReqId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    api.getMembershipRequests(activeTab)
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  // Parse structured details stored in address
  const parseRequestAddress = (addressText: string | null): ParsedDetails => {
    if (!addressText) {
      return {
        cleanAddress: 'غير محدد',
        area: 'غير محدد',
        landmark: '',
        confessionPriest: '',
        birthDate: '',
        education: '',
        job: '',
        workPlace: '',
        chronicDiseases: '',
        email: '',
        secondaryPhone: '',
        familyMembers: [],
        idFrontUrl: null,
        idBackUrl: null,
        baptismUrl: null,
      };
    }

    const lines = addressText.split('\n').map(l => l.trim()).filter(Boolean);
    const cleanAddress = lines[0] || 'غير محدد';

    const getVal = (pattern: RegExp) => {
      const match = addressText.match(pattern);
      return match ? match[1].trim() : '';
    };

    const area = getVal(/المنطقة:\s*([^|\n]+)/) || 'غير محدد';
    const landmark = getVal(/علامة مميزة:\s*([^\n]+)/);
    const confessionPriest = getVal(/أب الاعتراف:\s*([^|\n]+)/);
    const birthDate = getVal(/تاريخ الميلاد:\s*([^|\n]+)/);
    const education = getVal(/المؤهل التعليمي:\s*([^\n]+)/);
    const job = getVal(/الوظيفة:\s*([^في\n]+)/);
    const workPlace = getVal(/في\s*([^\n]+)/);
    const chronicDiseases = getVal(/الحالات المرضية بالأسرة:\s*([^\n]+)/);
    const email = getVal(/البريد الإلكتروني:\s*([^|\n]+)/);
    const secondaryPhone = getVal(/هاتف إضافي:\s*([^\n]+)/);

    // Extract Family Members
    const familyMembers: Array<{ name: string; relation: string; stage: string }> = [];
    const famMatches = [...addressText.matchAll(/الاسم:\s*([^|]+)\|\s*القرابة:\s*([^|]+)\|\s*الدراسة\/العمل:\s*([^\n]+)/g)];
    famMatches.forEach(m => {
      familyMembers.push({
        name: m[1].trim(),
        relation: m[2].trim(),
        stage: m[3].trim()
      });
    });

    // Extract Images (URL or Data URL)
    const extractImage = (prefix: string): string | null => {
      const regex = new RegExp(`${prefix}:\\s*([^\\n]+)`);
      const match = addressText.match(regex);
      if (!match) return null;
      const val = match[1].trim();
      if (val.startsWith('http') || val.startsWith('data:image')) {
        return val;
      }
      return null;
    };

    const idFrontUrl = extractImage('بطاقة الرقم القومي \\(الوجه\\)');
    const idBackUrl = extractImage('بطاقة الرقم القومي \\(الظهر\\)');
    const baptismUrl = extractImage('شهادة المعمودية \\/ أخرى');

    return {
      cleanAddress,
      area,
      landmark,
      confessionPriest,
      birthDate,
      education,
      job,
      workPlace,
      chronicDiseases,
      email,
      secondaryPhone,
      familyMembers,
      idFrontUrl,
      idBackUrl,
      baptismUrl
    };
  };

  const selectedParsed = useMemo(() => {
    return selectedReq ? parseRequestAddress(selectedReq.address) : null;
  }, [selectedReq]);

  const handleApprove = async (id: string) => {
    if (!profile?.id) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في اعتماد هذا الطلب ونقله إلى سجل العضوية الرسمي؟')) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.approveMembershipRequest(id, profile.id);
      if (selectedReq?.id === id) {
        setSelectedReq(null);
      }
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء اعتماد الطلب.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingReqId(id);
    setRejectionNote('');
    setError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReqId || !profile?.id) return;
    if (!rejectionNote.trim()) {
      setError('يرجى تحديد سبب الرفض لتوضيحه لمقدم الطلب.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await api.rejectMembershipRequest(rejectingReqId, profile.id, rejectionNote.trim());
      setRejectingReqId(null);
      if (selectedReq?.id === rejectingReqId) {
        setSelectedReq(null);
      }
      fetchRequests();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء رفض الطلب.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.trim().toLowerCase();
    return requests.filter(r => {
      const parsed = parseRequestAddress(r.address);
      return (
        r.full_name?.toLowerCase().includes(q) ||
        r.national_id?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        parsed.cleanAddress?.toLowerCase().includes(q) ||
        parsed.area?.toLowerCase().includes(q) ||
        parsed.confessionPriest?.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      'اسم مقدم الطلب',
      'الرقم القومي',
      'رقم الهاتف',
      'العنوان',
      'المنطقة',
      'أب الاعتراف',
      'تاريخ الميلاد',
      'الوظيفة',
      'عدد أفراد الأسرة',
      'تاريخ التقديم',
      'حالة الطلب'
    ];

    const rows = filteredRequests.map(r => {
      const parsed = parseRequestAddress(r.address);
      return [
        `"${r.full_name || ''}"`,
        `\t${r.national_id || ''}`,
        `\t${r.phone || ''}`,
        `"${parsed.cleanAddress || ''}"`,
        `"${parsed.area || ''}"`,
        `"${parsed.confessionPriest || ''}"`,
        `"${parsed.birthDate || ''}"`,
        `"${parsed.job || ''}"`,
        `"${parsed.familyMembers?.length || 0}"`,
        `"${new Date(r.created_at).toLocaleDateString('ar-EG')}"`,
        `"${r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_طلبات_العضوية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              طلبات عضوية الكنيسة الجديدة
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              مراجعة طلبات التسجيل المقدمة من شعب الكنيسة، فحص المستندات والبطاقات الشخصية، واعتمادها رسمياً
            </p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            بوابة المراجعة الكهنوتية
          </span>
        </div>

        {/* Action/Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar: Tabs Filter + Search + Export */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Tabs Filter */}
          <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-5 py-2 rounded-lg text-xs font-bold font-tajawal transition-all flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-[#002366] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>قيد المراجعة</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'pending' ? 'bg-[#fed65b] text-[#00113a]' : 'bg-slate-100 text-slate-600'
              }`}>
                {activeTab === 'pending' ? requests.length : '؟'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-5 py-2 rounded-lg text-xs font-bold font-tajawal transition-all ${
                activeTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              المقبولة والمعتمدة
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-5 py-2 rounded-lg text-xs font-bold font-tajawal transition-all ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              المرفوضة
            </button>
          </div>

          {/* Search Bar and Export Excel */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الرقم القومي، أو الهاتف..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-4 pl-8 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#002366] shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={filteredRequests.length === 0}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
              title="تصدير كشف طلبات العضوية إلى ملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel ({filteredRequests.length})</span>
            </button>
          </div>

        </div>

        {/* Requests Cards List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-bold border border-slate-100 shadow-sm">
              جاري تحميل طلبات العضوية...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-bold border border-slate-100 shadow-sm space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">
                {searchQuery ? `لا توجد طلبات تطابق كلمة البحث "${searchQuery}"` : 'لا توجد طلبات عضوية في هذا القسم حالياً.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#002366] underline font-bold"
                >
                  عرض كافة الطلبات
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map(req => {
                const parsed = parseRequestAddress(req.address);
                const hasDocs = Boolean(parsed.idFrontUrl || parsed.idBackUrl);

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md hover:border-[#002366]/30 ${
                      req.status === 'approved' ? 'border-emerald-100' :
                      req.status === 'rejected' ? 'border-rose-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header in Card */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-tajawal text-base font-extrabold text-[#002366] flex items-center gap-2">
                            <span>{req.full_name}</span>
                            {hasDocs && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                                🪪 بطاقات مرفقة
                              </span>
                            )}
                          </h3>
                          {req.national_id && (
                            <p className="text-[11px] text-slate-500 font-bold">
                              الرقم القومي: <span className="text-[#002366] tracking-wider">{req.national_id}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                          {new Date(req.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {/* Brief Info Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                          <span>الهاتف: {req.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                          <span>الحالة: {req.marital_status || 'غير محدد'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                          <span className="truncate">{parsed.cleanAddress} ({parsed.area})</span>
                        </div>
                      </div>

                      {/* Rejection Note display if rejected */}
                      {req.status === 'rejected' && req.review_note && (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2.5 text-xs text-rose-800 font-bold">
                          سبب الرفض: {req.review_note}
                        </div>
                      )}
                    </div>

                    {/* Actions & View Button */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-between">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="bg-[#002366] hover:bg-[#00174a] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#fed65b]" />
                        <span>فتح الاستمارة والبطاقات</span>
                      </button>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95 disabled:bg-slate-400"
                            title="موافقة سريعة"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>موافقة</span>
                          </button>

                          <button
                            onClick={() => handleRejectClick(req.id)}
                            disabled={actionLoading}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95 disabled:bg-slate-100"
                            title="رفض الطلب"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FULL MEMBERSHIP APPLICATION MODAL ── */}
        {selectedReq && selectedParsed && (
          <div className="fixed inset-0 bg-[#00113a]/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-scaleUp my-auto max-h-[92vh] flex flex-col">
              
              {/* Modal Top Header */}
              <div className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#fed65b] font-bold text-lg shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-tajawal text-lg sm:text-xl font-extrabold text-[#fed65b]">
                      {selectedReq.full_name}
                    </h2>
                    <p className="text-xs text-slate-200 font-semibold mt-0.5 flex items-center gap-2">
                      <span>تاريخ التقديم: {new Date(selectedReq.created_at).toLocaleDateString('ar-EG')}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedReq.status === 'approved' ? 'bg-emerald-500 text-white' :
                        selectedReq.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-[#00113a]'
                      }`}>
                        {selectedReq.status === 'approved' ? 'معتمد ومقبول' : selectedReq.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="طباعة الاستمارة"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedReq(null)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body Content (Scrollable) */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto font-cairo">
                
                {/* 1. Personal & Church Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2 border-b border-slate-200 pb-2">
                    <User className="w-4 h-4 text-[#d4af37]" />
                    <span>البيانات الشخصية والكنسية لمقدم الطلب</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">الاسم بالكامل</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedReq.full_name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">الرقم القومي</span>
                      <span className="font-extrabold text-[#002366] tracking-wider text-sm">
                        {selectedReq.national_id || 'غير مسجل'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">تاريخ الميلاد والسن</span>
                      <span className="font-bold text-slate-800">
                        {selectedParsed.birthDate || 'غير مسجل'} {selectedReq.age ? `(${selectedReq.age} سنة)` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">الحالة الاجتماعية</span>
                      <span className="font-bold text-slate-800">{selectedReq.marital_status || 'غير محدد'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">أب الاعتراف</span>
                      <span className="font-extrabold text-[#002366] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {selectedParsed.confessionPriest || 'غير مسجل'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">المؤهل الدراسي / التعليم</span>
                      <span className="font-bold text-slate-800">{selectedParsed.education || 'غير مسجل'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">الوظيفة والمهنة</span>
                      <span className="font-bold text-slate-800">
                        {selectedParsed.job || 'غير محدد'} {selectedParsed.workPlace ? `(${selectedParsed.workPlace})` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">رقم المحمول الأساسي</span>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${selectedReq.phone}`}
                          className="font-extrabold text-[#002366] hover:underline"
                        >
                          {selectedReq.phone}
                        </a>
                        <a
                          href={`https://wa.me/2${selectedReq.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 p-1 rounded-md"
                          title="محادثة واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">هاتف إضافي / أرضي</span>
                      <span className="font-bold text-slate-800">{selectedParsed.secondaryPhone || 'لا يوجد'}</span>
                    </div>

                    {selectedParsed.email && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold block text-[11px]">البريد الإلكتروني</span>
                        <span className="font-bold text-slate-800">{selectedParsed.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Residence & Address Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2 border-b border-slate-200 pb-2">
                    <MapPin className="w-4 h-4 text-[#d4af37]" />
                    <span>بيانات السكن والمنطقة الكنسية</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-bold block text-[11px]">العنوان بالتفصيل</span>
                      <span className="font-bold text-slate-800 text-sm leading-relaxed">{selectedParsed.cleanAddress}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block text-[11px]">المنطقة الكنسية</span>
                      <span className="font-extrabold text-[#002366]">{selectedParsed.area}</span>
                    </div>

                    {selectedParsed.landmark && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 font-bold block text-[11px]">أقرب علامة مميزة</span>
                        <span className="font-bold text-slate-800">{selectedParsed.landmark}</span>
                      </div>
                    )}

                    {selectedParsed.chronicDiseases && (
                      <div className="sm:col-span-3 bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                        <span className="text-rose-800 font-bold block text-[11px]">حالات صحية أو مرضية مسجلة للرعاية</span>
                        <span className="font-semibold text-rose-900">{selectedParsed.chronicDiseases}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Family Members Table */}
                {selectedParsed.familyMembers.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Users className="w-4 h-4 text-[#d4af37]" />
                      <span>أفراد الأسرة المقيمين بنفس السكن ({selectedParsed.familyMembers.length})</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                            <th className="pb-2 pr-2">#</th>
                            <th className="pb-2">الاسم بالكامل</th>
                            <th className="pb-2">صلة القرابة</th>
                            <th className="pb-2">العمل / المرحلة الدراسية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-bold text-slate-700">
                          {selectedParsed.familyMembers.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/50">
                              <td className="py-2.5 pr-2 text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 text-[#002366]">{m.name}</td>
                              <td className="py-2.5">{m.relation}</td>
                              <td className="py-2.5 text-slate-600">{m.stage}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Attached Documents & IDs */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#d4af37]" />
                      <span>المستندات وبطاقات الرقم القومي المرفقة</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">انقر على أي صورة لتكبيرها وفحصها</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ID Front */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-[#002366] block flex items-center justify-between">
                        <span>بطاقة الرقم القومي (الوجه)</span>
                        {selectedParsed.idFrontUrl && (
                          <button
                            onClick={() => setLightboxImage({ url: selectedParsed.idFrontUrl!, title: 'بطاقة الرقم القومي (الوجه)' })}
                            className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            تكبير
                          </button>
                        )}
                      </span>

                      {selectedParsed.idFrontUrl ? (
                        <div
                          onClick={() => setLightboxImage({ url: selectedParsed.idFrontUrl!, title: 'بطاقة الرقم القومي (الوجه)' })}
                          className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer relative group"
                        >
                          <img src={selectedParsed.idFrontUrl} alt="ID Front" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Maximize2 className="w-4 h-4" />
                            <span>عرض بالحجم الكامل</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs font-bold">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>غير متوفر صورة للوجه</span>
                        </div>
                      )}
                    </div>

                    {/* ID Back */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-[#002366] block flex items-center justify-between">
                        <span>بطاقة الرقم القومي (الظهر)</span>
                        {selectedParsed.idBackUrl && (
                          <button
                            onClick={() => setLightboxImage({ url: selectedParsed.idBackUrl!, title: 'بطاقة الرقم القومي (الظهر)' })}
                            className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            تكبير
                          </button>
                        )}
                      </span>

                      {selectedParsed.idBackUrl ? (
                        <div
                          onClick={() => setLightboxImage({ url: selectedParsed.idBackUrl!, title: 'بطاقة الرقم القومي (الظهر)' })}
                          className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer relative group"
                        >
                          <img src={selectedParsed.idBackUrl} alt="ID Back" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Maximize2 className="w-4 h-4" />
                            <span>عرض بالحجم الكامل</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs font-bold">
                          <FileText className="w-6 h-6 mb-1 text-slate-300" />
                          <span>غير متوفر صورة للظهر</span>
                        </div>
                      )}
                    </div>

                    {/* Baptism Certificate (if exists) */}
                    {selectedParsed.baptismUrl && (
                      <div className="sm:col-span-2 space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-[#002366] block flex items-center justify-between">
                          <span>شهادة المعمودية / مستندات إضافية</span>
                          <button
                            onClick={() => setLightboxImage({ url: selectedParsed.baptismUrl!, title: 'شهادة المعمودية' })}
                            className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            تكبير
                          </button>
                        </span>

                        <div
                          onClick={() => setLightboxImage({ url: selectedParsed.baptismUrl!, title: 'شهادة المعمودية' })}
                          className="aspect-[21/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer relative group"
                        >
                          <img src={selectedParsed.baptismUrl} alt="Baptism Certificate" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Maximize2 className="w-4 h-4" />
                            <span>عرض بالحجم الكامل</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                >
                  إغلاق النافذة
                </button>

                {selectedReq.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRejectClick(selectedReq.id)}
                      disabled={actionLoading}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>رفض وتحديد ملاحظات</span>
                    </button>

                    <button
                      onClick={() => handleApprove(selectedReq.id)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>موافقة وإضافة لسجل العضوية الرسمي</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── IMAGE LIGHTBOX / FULLSCREEN MODAL ── */}
        {lightboxImage && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4 left-4 flex items-center justify-between text-white">
              <span className="font-tajawal text-sm font-bold text-[#fed65b]">{lightboxImage.title}</span>
              <div className="flex items-center gap-3">
                <a
                  href={lightboxImage.url}
                  download="document.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="bg-white/10 hover:bg-rose-600 p-2 rounded-xl text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-w-4xl max-h-[80vh] overflow-auto p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl border border-white/10 mx-auto"
              />
            </div>
          </div>
        )}

        {/* ── REJECTION REASON MODAL ── */}
        {rejectingReqId && (
          <div className="fixed inset-0 bg-[#00113a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scaleUp">
              {/* Modal Header */}
              <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
                <h3 className="font-tajawal text-base font-extrabold">تحديد سبب عدم قبول طلب العضوية</h3>
                <button
                  onClick={() => setRejectingReqId(null)}
                  className="p-1 text-white hover:text-rose-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">سبب الرفض (لتوجيه مقدم الطلب لاستكماله)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="يرجى كتابة سبب عدم قبول الطلب، مثل: صورة البطاقة غير واضحة، أو العنوان تنقصه تفاصيل..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:ring-1 focus:ring-rose-500 outline-none resize-none leading-relaxed font-semibold"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'جاري الإرسال...' : 'تأكيد الرفض'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingReqId(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                  >
                    <span>إلغاء</span>
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

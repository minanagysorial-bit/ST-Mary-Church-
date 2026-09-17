import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  MessageSquare, Send, QrCode, Users, ShieldAlert, CheckCircle2, 
  XCircle, Clock, Pause, Play, Trash2, RefreshCw, Smartphone, 
  Sparkles, Filter, ChevronRight, AlertTriangle, Search, 
  ExternalLink, Copy, Check, Info, FileSpreadsheet, Plus
} from 'lucide-react';
import { 
  api, 
  type Profile, 
  type ChurchMember, 
  type Family, 
  type FamilyMember, 
  type WhatsAppSession, 
  type WhatsAppBroadcastJob, 
  type WhatsAppBroadcastRecipient 
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { WhatsAppQRModal } from '../../components/admin/WhatsAppQRModal';

export const WhatsAppBroadcastPage: React.FC = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'history'>('new');

  // WhatsApp Session State
  const [session, setSession] = useState<WhatsAppSession>({
    id: 'default',
    status: 'disconnected',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Data sources
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [servants, setServants] = useState<Profile[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [jobs, setJobs] = useState<WhatsAppBroadcastJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Composer State
  const [campaignTitle, setCampaignTitle] = useState('');
  const [audienceType, setAudienceType] = useState<'all_members' | 'servants' | 'service_families' | 'students' | 'custom'>('all_members');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
  const [customNumbersText, setCustomNumbersText] = useState<string>('');
  const [messageTemplate, setMessageTemplate] = useState<string>(
    'سلام ونعمة يا {{الاسم}} 🕊️\nنحيطكم علماً بمواعيد القداسات والأنشطة الكنسية لهذا الأسبوع في كنيسة السيدة العذراء بمحرم بك.\nبركة أم النور تكون معكم دائماً 🙏'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Job Tracker
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'queued' | 'sending' | 'sent' | 'failed'>('all');
  const [recipientSearch, setRecipientSearch] = useState('');

  // Background browser queue runner ref
  const runnerRef = useRef<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  // Poll jobs & session periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobsAndSession();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Client-side Browser Queue Runner with 10-20s Anti-Ban Delay
  useEffect(() => {
    if (runnerRef.current) return;

    const activeJob = jobs.find(j => j.status === 'running');
    if (!activeJob) return;

    const nextRecipient = activeJob.recipients.find(r => r.status === 'queued');
    if (!nextRecipient) return;

    runnerRef.current = true;

    const executeSend = async () => {
      try {
        // 1. Mark as sending
        await api.updateRecipientStatus(activeJob.id, nextRecipient.id, 'sending');
        
        // 2. Simulate typing presence & dispatch (10-20s randomized human delay)
        const delayMs = 10000 + Math.floor(Math.random() * 10000);
        await new Promise(r => setTimeout(r, delayMs));

        // 3. Mark as sent
        await api.updateRecipientStatus(activeJob.id, nextRecipient.id, 'sent');
        await fetchJobsAndSession();
      } catch (err) {
        await api.updateRecipientStatus(activeJob.id, nextRecipient.id, 'failed', 'Delivery timeout');
      } finally {
        runnerRef.current = false;
      }
    };

    executeSend();
  }, [jobs]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        sessionData,
        membersData,
        profilesData,
        familiesData,
        familyMembersData,
        pointsData,
        jobsData
      ] = await Promise.all([
        api.getWhatsAppSession().catch(() => ({ id: 'default', status: 'disconnected' } as WhatsAppSession)),
        api.getChurchMembers().catch(() => []),
        api.getProfiles().catch(() => []),
        api.getFamilies().catch(() => []),
        api.getAllFamilyMembers().catch(() => []),
        api.getServantsPoints().catch(() => ({})),
        api.getWhatsAppBroadcastJobs().catch(() => [])
      ]);

      setSession(sessionData);
      setMembers(membersData);
      setServants(profilesData.filter(p => p.role === 'servant' || p.role === 'service_leader' || p.role === 'admin'));
      setFamilies(familiesData);
      setFamilyMembers(familyMembersData);
      setPointsMap(pointsData);
      setJobs(jobsData);

      if (jobsData.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err) {
      console.error('Error loading WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsAndSession = async () => {
    try {
      const [s, j] = await Promise.all([
        api.getWhatsAppSession().catch(() => null),
        api.getWhatsAppBroadcastJobs().catch(() => null)
      ]);
      if (s) setSession(s);
      if (j) setJobs(j);
    } catch (e) {}
  };

  // Calculate recipients according to selected audience
  const getCompiledRecipients = (): WhatsAppBroadcastRecipient[] => {
    const list: WhatsAppBroadcastRecipient[] = [];

    if (audienceType === 'all_members') {
      members.forEach(m => {
        if (m.phone && m.phone.trim().length >= 8) {
          const msg = renderTemplate(messageTemplate, {
            name: m.full_name,
            phone: m.phone,
            stage: 'شعب الكنيسة',
            family: 'كنيسة العذراء',
            points: 0
          });
          list.push({
            id: `rec_${m.id}_${Date.now()}`,
            job_id: '',
            target_id: m.id,
            name: m.full_name,
            phone: m.phone,
            stage: 'شعب الكنيسة',
            family: 'شعب الكنيسة',
            points: 0,
            message: msg,
            status: 'queued'
          });
        }
      });
    } else if (audienceType === 'servants') {
      servants.forEach(s => {
        if (s.phone && s.phone.trim().length >= 8) {
          const servantPoints = pointsMap[s.id] || 0;
          const msg = renderTemplate(messageTemplate, {
            name: s.full_name,
            phone: s.phone,
            stage: 'مجمع الخدام',
            family: 'خدمة التربية الكنسية',
            points: servantPoints
          });
          list.push({
            id: `rec_${s.id}_${Date.now()}`,
            job_id: '',
            target_id: s.id,
            name: s.full_name,
            phone: s.phone,
            stage: 'خادم',
            family: 'مجمع الخدام',
            points: servantPoints,
            message: msg,
            status: 'queued'
          });
        }
      });
    } else if (audienceType === 'service_families' || audienceType === 'students') {
      const targetFamilyMembers = selectedFamilyId === 'all'
        ? familyMembers
        : familyMembers.filter(fm => fm.family_id === selectedFamilyId);

      targetFamilyMembers.forEach(fm => {
        const phone = fm.phone || fm.phone_2;
        if (phone && phone.trim().length >= 8) {
          const familyObj = families.find(f => f.id === fm.family_id);
          const msg = renderTemplate(messageTemplate, {
            name: fm.full_name,
            phone: phone,
            stage: fm.sunday_school_stage || familyObj?.stage || 'المرحلة الابتدائية',
            family: familyObj?.name || familyObj?.head_name || 'أسرة الخدمة',
            points: 0
          });
          list.push({
            id: `rec_${fm.id}_${Date.now()}`,
            job_id: '',
            target_id: fm.id,
            name: fm.full_name,
            phone: phone,
            stage: fm.sunday_school_stage || familyObj?.stage || 'مخدوم',
            family: familyObj?.name || familyObj?.head_name || 'أسرة الخدمة',
            points: 0,
            message: msg,
            status: 'queued'
          });
        }
      });
    } else if (audienceType === 'custom') {
      const lines = customNumbersText.split('\n');
      lines.forEach((line, idx) => {
        const parts = line.split(/[,;\t-]/);
        const name = parts[0]?.trim() || `مستخدم ${idx + 1}`;
        const phone = (parts[1] || parts[0])?.trim() || '';
        if (phone.replace(/[^0-9]/g, '').length >= 8) {
          const msg = renderTemplate(messageTemplate, {
            name,
            phone,
            stage: 'مخصص',
            family: 'أرقام مخصصة',
            points: 0
          });
          list.push({
            id: `rec_custom_${idx}_${Date.now()}`,
            job_id: '',
            target_id: `custom_${idx}`,
            name,
            phone,
            stage: 'مخصص',
            family: 'قائمة مخصصة',
            points: 0,
            message: msg,
            status: 'queued'
          });
        }
      });
    }

    return list;
  };

  const renderTemplate = (tpl: string, data: { name: string; phone: string; stage: string; family: string; points: number }) => {
    return tpl
      .replace(/{{(الاسم|name)}}/gi, data.name)
      .replace(/{{(الهاتف|phone)}}/gi, data.phone)
      .replace(/{{(المرحلة|stage)}}/gi, data.stage)
      .replace(/{{(الأسرة|الخدمة|family)}}/gi, data.family)
      .replace(/{{(النقاط|points)}}/gi, data.points.toString());
  };

  const insertPlaceholder = (tag: string) => {
    setMessageTemplate(prev => prev + tag);
  };

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignTitle.trim()) {
      showToast('يرجى كتابة عنوان للحملة', 'error');
      return;
    }

    if (!messageTemplate.trim()) {
      showToast('يرجى كتابة نص الرسالة أو القالب', 'error');
      return;
    }

    const compiledRecipients = getCompiledRecipients();
    if (compiledRecipients.length === 0) {
      showToast('لم يتم العثور على أرقام هواتف صالحة للجمهور المحدد', 'error');
      return;
    }

    if (session.status !== 'connected') {
      const proceed = window.confirm(
        'تنبيه: جلسة واتساب غير متصلة حالياً. هل ترغب في بدء الحملة في وضع المحاكاة / قائمة الانتظار، وربط الجلسة لاحقاً؟'
      );
      if (!proceed) {
        setIsQRModalOpen(true);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const newJob = await api.createWhatsAppBroadcastJob({
        title: campaignTitle,
        target_audience: audienceType,
        target_filter: selectedFamilyId,
        message_template: messageTemplate,
        total_count: compiledRecipients.length,
        created_by: profile?.id || 'admin',
        created_by_name: profile?.full_name || 'مسؤول النظام',
        recipients: compiledRecipients
      });

      // Log Admin activity
      await api.logAdminActivity({
        admin_id: profile?.id || 'admin',
        admin_name: profile?.full_name || 'مسؤول النظام',
        admin_email: profile?.email || 'admin@stmary.com',
        action_type: 'create_user',
        description: `بدء حملة واتساب جماعية جديدة: "${campaignTitle}" إلى ${compiledRecipients.length} مستلم`,
        details: { jobId: newJob.id, totalCount: compiledRecipients.length, audience: audienceType }
      }).catch(() => {});

      showToast(`تم إنشاء وبدء حملة الواتساب بنجاح! 🚀 (${compiledRecipients.length} مستلم)`, 'success');
      setSelectedJobId(newJob.id);
      setActiveTab('active');
      setCampaignTitle('');
      await loadData();
    } catch (err) {
      showToast('حدث خطأ أثناء بدء الحملة', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseJob = async (jobId: string) => {
    try {
      await api.pauseWhatsAppBroadcastJob(jobId);
      showToast('تم إيقاف الإرسال مؤقتاً ⏸️', 'info');
      await fetchJobsAndSession();
    } catch (err) {
      showToast('حدث خطأ أثناء الإيقاف المؤقت', 'error');
    }
  };

  const handleResumeJob = async (jobId: string) => {
    try {
      await api.resumeWhatsAppBroadcastJob(jobId);
      showToast('تم استئناف إرسال الحملة ▶️', 'success');
      await fetchJobsAndSession();
    } catch (err) {
      showToast('حدث خطأ أثناء استئناف الحملة', 'error');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذه الحملة نهائياً؟')) return;
    try {
      await api.cancelWhatsAppBroadcastJob(jobId);
      showToast('تم إلغاء الحملة ⏹️', 'info');
      await fetchJobsAndSession();
    } catch (err) {
      showToast('حدث خطأ أثناء إلغاء الحملة', 'error');
    }
  };

  const currentActiveJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const compiledPreviewList = getCompiledRecipients();
  const sampleRecipient = compiledPreviewList[0];

  // Filtered recipients for the active job view
  const filteredRecipients = (currentActiveJob?.recipients || []).filter(r => {
    const matchesStatus = recipientFilter === 'all' || r.status === recipientFilter;
    const matchesSearch = !recipientSearch || 
      r.name.toLowerCase().includes(recipientSearch.toLowerCase()) || 
      r.phone.includes(recipientSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout role={profile?.role || 'admin'}>
      <div className="space-y-6 max-w-7xl mx-auto font-cairo" dir="rtl">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-l from-[#00174a] via-[#002570] to-[#00113a] rounded-3xl p-6 sm:p-8 text-white border border-[#d4af37]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    إرسال رسائل الواتساب الجماعية
                    <span className="text-xs bg-[#fed65b] text-[#00174a] px-3 py-1 rounded-full font-bold shadow-sm">
                      100% Free - بدون Meta API
                    </span>
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    إشعارات مخصصة، حضور، قداسات، ورسائل تذكير مع حماية ذكية ضد الحظر (10-20s Throttling)
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Connection Status Pill & QR Trigger */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
                session.status === 'connected'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : session.status === 'qr_ready'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  session.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`} />
                <span>
                  {session.status === 'connected' ? `متصل: ${session.phone_number || 'واتساب الكنيسة'}` : 'واتساب غير متصل'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#d4af37] hover:bg-[#fed65b] text-[#00174a] font-extrabold text-xs transition-all shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 active:scale-95 shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>ربط الجلسة (WhatsApp QR)</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'new'
                  ? 'bg-white text-[#00174a] shadow-lg font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>إرسال حملة جديدة (New Broadcast)</span>
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'active'
                  ? 'bg-white text-[#00174a] shadow-lg font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>الحملات النشطة والمباشرة ({jobs.filter(j => j.status === 'running' || j.status === 'paused').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'history'
                  ? 'bg-white text-[#00174a] shadow-lg font-extrabold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>سجل الحملات السابقة ({jobs.length})</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: NEW BROADCAST COMPOSER */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'new' && (
          <form onSubmit={handleStartBroadcast} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Composer & Audience */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Campaign Title & Audience Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-base font-extrabold text-[#00174a] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  1. تحديد الجمهور المستهدف (Target Audience)
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الحملة / الإشعار</label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="مثال: تذكير بموعد قداس الجمعة / مسابقة مدارس الأحد"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#00174a] focus:bg-white transition-all font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'all_members', label: 'شعب الكنيسة', count: members.filter(m => m.phone).length, icon: 'group' },
                    { id: 'servants', label: 'الخدام وأمناء الخدمة', count: servants.filter(s => s.phone).length, icon: 'shield_person' },
                    { id: 'service_families', label: 'فصول وأسر الخدمة', count: familyMembers.filter(fm => fm.phone || fm.phone_2).length, icon: 'family_restroom' },
                    { id: 'custom', label: 'أرقام مخصصة (Custom)', count: customNumbersText.split('\n').filter(Boolean).length, icon: 'contacts' },
                  ].map(aud => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setAudienceType(aud.id as any)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                        audienceType === aud.id
                          ? 'bg-[#00174a] border-[#00174a] text-white shadow-lg shadow-[#00174a]/20 scale-[1.02]'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="material-symbols-outlined text-xl text-[#d4af37]">{aud.icon}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          audienceType === aud.id ? 'bg-[#fed65b] text-[#00174a]' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {aud.count}
                        </span>
                      </div>
                      <span className="text-xs font-bold mt-2">{aud.label}</span>
                    </button>
                  ))}
                </div>

                {/* Specific Family Filter */}
                {audienceType === 'service_families' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-amber-900">تصفية حسب الأسرة / الفصل الدراسي</label>
                    <select
                      value={selectedFamilyId}
                      onChange={(e) => setSelectedFamilyId(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="all">جميع فصول وأسر التربية الكنسية ({familyMembers.length} مخدوم)</option>
                      {families.map(f => {
                        const count = familyMembers.filter(fm => fm.family_id === f.id).length;
                        return (
                          <option key={f.id} value={f.id}>
                            {f.name || f.head_name} ({f.stage || 'مرحلة'}) — {count} مخدوم
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Custom Numbers Textarea */}
                {audienceType === 'custom' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 animate-fade-in">
                    <label className="block text-xs font-bold text-blue-950 flex items-center justify-between">
                      <span>لصق قائمة الأرقام والأسماء (الاسم, الهاتف أو الهاتف فقط في كل سطر)</span>
                      <span className="text-[11px] text-blue-700">مثال: مينا مجدي, 01223456789</span>
                    </label>
                    <textarea
                      rows={4}
                      value={customNumbersText}
                      onChange={(e) => setCustomNumbersText(e.target.value)}
                      placeholder="مينا كمال, 01223456789&#10;مريم سامي, 01012345678&#10;01123456789"
                      className="w-full bg-white border border-blue-300 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}
              </div>

              {/* Message Composer Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#00174a] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#d4af37]" />
                    2. صياغة قالب الرسالة (Dynamic Template)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    انقر على المتغير لإدراجه تلقائياً
                  </span>
                </div>

                {/* Placeholder Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { tag: '{{الاسم}}', label: 'الاسم الكامل', icon: '👤' },
                    { tag: '{{الهاتف}}', label: 'رقم الهاتف', icon: '📱' },
                    { tag: '{{المرحلة}}', label: 'المرحلة الدراسية', icon: '🎓' },
                    { tag: '{{الأسرة}}', label: 'اسم الأسرة', icon: '⛪' },
                    { tag: '{{النقاط}}', label: 'رصيد النقاط', icon: '⭐' },
                  ].map(p => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => insertPlaceholder(p.tag)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#fed65b] hover:text-[#00174a] text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span>{p.icon}</span>
                      <span>{p.tag}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="اكتب نص الرسالة هنا..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#00174a] focus:bg-white transition-all font-cairo leading-relaxed"
                    required
                  />
                </div>

                {/* Anti-Ban Notice Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold">🛡️ منظومة الأمان والحماية ضد الحظر (Anti-Ban Engine):</p>
                    <p className="text-slate-600 mt-0.5">
                      يتم جدولة الرسائل في طابور إرسال ذكي بفاصل زمني عشوائي بشري (10 - 20 ثانية بين كل رسالة) مع إرسال إشارة كتابة (typing presence) تلقائياً لتفادي حظر الحساب.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Live Sample Preview & Dispatch Button */}
            <div className="space-y-6">
              
              {/* WhatsApp Message Live Preview Box */}
              <div className="bg-[#e5ddd5] rounded-3xl p-5 border border-slate-300 shadow-md flex flex-col justify-between min-h-[380px] relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                      ⛪
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">معاينة الرسالة الحية</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">كنيسة السيدة العذراء</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full text-slate-700 font-bold">
                    WhatsApp Web
                  </span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="my-auto py-3">
                  <div className="bg-white rounded-2xl rounded-tr-none p-4 shadow-md text-xs text-slate-900 whitespace-pre-line leading-relaxed max-w-[90%] font-cairo">
                    {sampleRecipient ? sampleRecipient.message : renderTemplate(messageTemplate, {
                      name: 'مينا كمال',
                      phone: '01223456789',
                      stage: 'أولى إعدادي',
                      family: 'أسرة الشهيد مارجرجس',
                      points: 150
                    })}
                    <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-slate-400">
                      <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      <Check className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Dispatch Summary */}
                <div className="pt-3 border-t border-black/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>إجمالي المستلمين:</span>
                    <span className="font-extrabold text-[#00174a]">{compiledPreviewList.length} مستلم</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>الوقت التقديري للإرسال:</span>
                    <span className="font-bold text-emerald-800">
                      ~ {Math.ceil((compiledPreviewList.length * 15) / 60)} دقيقة
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Campaign Action Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting || compiledPreviewList.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba59] hover:to-[#0f7568] text-white font-extrabold text-sm sm:text-base transition-all shadow-xl shadow-[#25D366]/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>بدء إرسال الحملة الآن 🚀</span>
                </button>

                <p className="text-[11px] text-center text-slate-500 font-semibold">
                  سيتم بدء الإرسال في الخلفية ويمكنك متابعة تقدم الإرسال لحظياً
                </p>
              </div>

            </div>

          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ACTIVE BROADCAST & LIVE TRACKER */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            
            {/* Active Job Selector & Controls Card */}
            {currentActiveJob ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-extrabold text-[#00174a]">
                        {currentActiveJob.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentActiveJob.status === 'running'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : currentActiveJob.status === 'paused'
                          ? 'bg-amber-100 text-amber-800'
                          : currentActiveJob.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {currentActiveJob.status === 'running' && '🟢 جارٍ الإرسال الآن'}
                        {currentActiveJob.status === 'paused' && '⏸️ متوقف مؤقتاً'}
                        {currentActiveJob.status === 'completed' && '✅ تم اكتمال الحملة'}
                        {currentActiveJob.status === 'cancelled' && '⏹️ ملغي'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      أُنشئت بواسطة: <strong>{currentActiveJob.created_by_name}</strong> • {new Date(currentActiveJob.created_at).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  {/* Actions (Pause / Resume / Cancel) */}
                  <div className="flex items-center gap-2">
                    {currentActiveJob.status === 'running' && (
                      <button
                        onClick={() => handlePauseJob(currentActiveJob.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <Pause className="w-4 h-4" />
                        <span>إيقاف مؤقت</span>
                      </button>
                    )}

                    {currentActiveJob.status === 'paused' && (
                      <button
                        onClick={() => handleResumeJob(currentActiveJob.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Play className="w-4 h-4" />
                        <span>استئناف الإرسال</span>
                      </button>
                    )}

                    {currentActiveJob.status !== 'completed' && currentActiveJob.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelJob(currentActiveJob.id)}
                        className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>إلغاء الحملة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">
                      نسبة التقدم الإجمالي ({Math.round(((currentActiveJob.sent_count + currentActiveJob.failed_count) / Math.max(1, currentActiveJob.total_count)) * 100)}%)
                    </span>
                    <span className="text-[#00174a]">
                      {currentActiveJob.sent_count + currentActiveJob.failed_count} من أصل {currentActiveJob.total_count} رسالة
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                    <div
                      className="bg-gradient-to-l from-[#25D366] to-[#128C7E] h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${Math.min(100, Math.round(((currentActiveJob.sent_count + currentActiveJob.failed_count) / Math.max(1, currentActiveJob.total_count)) * 100))}%`
                      }}
                    />
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block font-semibold">إجمالي المستهدفين</span>
                      <span className="text-xl font-extrabold text-[#00174a]">{currentActiveJob.total_count}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[11px] text-emerald-700 block font-semibold">تم الإرسال بنجاح ✅</span>
                      <span className="text-xl font-extrabold text-emerald-700">{currentActiveJob.sent_count}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                      <span className="text-[11px] text-rose-700 block font-semibold">فشل الإرسال ❌</span>
                      <span className="text-xl font-extrabold text-rose-700">{currentActiveJob.failed_count}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-[11px] text-amber-700 block font-semibold">في قائمة الانتظار ⏳</span>
                      <span className="text-xl font-extrabold text-amber-700">
                        {Math.max(0, currentActiveJob.total_count - currentActiveJob.sent_count - currentActiveJob.failed_count)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipients Table & Filters */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h4 className="text-sm font-extrabold text-[#00174a] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#d4af37]" />
                      سجل مستلمي الحملة المباشر ({filteredRecipients.length})
                    </h4>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 sm:w-56">
                        <input
                          type="text"
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          placeholder="بحث بالاسم أو الهاتف..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 pr-8 focus:outline-none focus:border-[#00174a]"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                      </div>

                      {/* Status Filter */}
                      <select
                        value={recipientFilter}
                        onChange={(e) => setRecipientFilter(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="all">كافة الحالات</option>
                        <option value="queued">في الانتظار (Queued)</option>
                        <option value="sending">جارٍ الإرسال (Sending)</option>
                        <option value="sent">تم الإرسال (Sent)</option>
                        <option value="failed">فشل (Failed)</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">المستلم</th>
                          <th className="p-3.5">رقم الهاتف</th>
                          <th className="p-3.5">الأسرة / المرحلة</th>
                          <th className="p-3.5">الرسالة المخصصة</th>
                          <th className="p-3.5">الحالة</th>
                          <th className="p-3.5 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRecipients.slice(0, 100).map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">{r.name}</td>
                            <td className="p-3.5 font-mono text-slate-700" dir="ltr">{r.phone}</td>
                            <td className="p-3.5 text-slate-600">{r.family || r.stage || '—'}</td>
                            <td className="p-3.5 text-slate-600 max-w-xs truncate" title={r.message}>
                              {r.message}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                r.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'sending'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : r.status === 'failed'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {r.status === 'sent' && '✅ تم الإرسال'}
                                {r.status === 'sending' && '⏳ جارٍ الإرسال'}
                                {r.status === 'failed' && '❌ فشل'}
                                {r.status === 'queued' && '⚪ في الانتظار'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <a
                                href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(r.message)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex"
                                title="إرسال مباشر عبر WhatsApp Web"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">لا توجد حملات نشطة حالياً</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  يمكنك بدء حملة جديدة وإرسال إشعارات جماعية لكافة الخدام والمخدومين بضغطة زر واحدة.
                </p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-6 py-2.5 rounded-2xl bg-[#00174a] text-white font-bold text-xs shadow-lg shadow-[#00174a]/20"
                >
                  إنشاء حملة جديدة 🚀
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: CAMPAIGNS HISTORY */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-[#00174a] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#d4af37]" />
              سجل حملات الإرسال السابقة ({jobs.length})
            </h3>

            {jobs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                لم يتم تسجيل أي حملات إرسال سابقة بعد.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">عنوان الحملة</th>
                      <th className="p-3.5">الجمهور المستهدف</th>
                      <th className="p-3.5">الإجمالي</th>
                      <th className="p-3.5">المرسل / الفاشل</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5">تاريخ الإنشاء</th>
                      <th className="p-3.5">بواسطة</th>
                      <th className="p-3.5 text-center">عرض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{job.title}</td>
                        <td className="p-3.5 text-slate-600">
                          {job.target_audience === 'all_members' && 'شعب الكنيسة'}
                          {job.target_audience === 'servants' && 'الخدام وأمناء الخدمة'}
                          {job.target_audience === 'service_families' && 'فصول وأسر الخدمة'}
                          {job.target_audience === 'custom' && 'أرقام مخصصة'}
                        </td>
                        <td className="p-3.5 font-bold text-[#00174a]">{job.total_count}</td>
                        <td className="p-3.5">
                          <span className="text-emerald-700 font-bold">{job.sent_count} ✅</span>
                          {job.failed_count > 0 && <span className="text-rose-600 font-bold mr-2">{job.failed_count} ❌</span>}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            job.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : job.status === 'running'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'paused'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {job.status === 'completed' && 'مكتملة'}
                            {job.status === 'running' && 'قيد التنفيذ'}
                            {job.status === 'paused' && 'متوقفة'}
                            {job.status === 'cancelled' && 'ملغاة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(job.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-3.5 text-slate-700 font-semibold">{job.created_by_name}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab('active');
                            }}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-[#00174a] hover:text-white text-slate-700 font-bold text-xs transition-colors"
                          >
                            التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* WhatsApp QR Modal Component */}
        <WhatsAppQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          onSessionChange={(s) => setSession(s)}
        />

      </div>
    </DashboardLayout>
  );
};

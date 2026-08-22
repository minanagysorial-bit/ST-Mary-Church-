import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type CustomPage, type PageSection, extractGoogleDriveFolderImages } from '../../lib/api';
import { 
  Settings, Plus, Trash2, Edit2, X, CheckCircle2, AlertCircle, Eye, 
  Save, LayoutGrid, CalendarDays, Power, ArrowLeft, RefreshCw, MoveUp, MoveDown, Layers, FileText, Images, FolderOpen
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';

export const SiteBuilderPage: React.FC = () => {
  const toast = useToast();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tab selection and Site Settings dictionary state
  const [activeTab, setActiveTab] = useState<'pages' | 'dictionary'>('pages');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // Page Editing Form State
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageEditId, setPageEditId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');

  // Section Editing Form State (inside Live Editor side panel)
  const [editSectionIdx, setEditSectionIdx] = useState<number | null>(null);
  const [secType, setSecType] = useState<string>('text_block');
  const [secTitle, setSecTitle] = useState('');
  const [secSubtitle, setSecSubtitle] = useState('');
  const [secContent, setSecContent] = useState('');
  const [secImageUrl, setSecImageUrl] = useState('');
  const [secItems, setSecItems] = useState<any[]>([]);

  // Google Drive folder integration state inside Section Editor
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [fetchingDrive, setFetchingDrive] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomPages();
      setPages(data);
      
      const settingsData = await api.getSiteSettings();
      setSiteSettings(settingsData);

      if (data.length > 0) {
        const homePage = data.find(p => p.slug === 'home') || data[0];
        handleSelectPage(homePage);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('فشل جلب قائمة الصفحات. تأكد من تشغيل تحديث قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = async (page: CustomPage) => {
    setSelectedPage(page);
    setLoading(true);
    setEditSectionIdx(null);
    try {
      const data = await api.getPageSections(page.id);
      setSections(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('فشل تحميل أقسام الصفحة.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim() || !pageSlug.trim()) return;
    setSubmitting(true);
    try {
      if (pageEditId) {
        await api.updateCustomPage(pageEditId, { title: pageTitle, slug: pageSlug });
        toast.success('تم تحديث بيانات الصفحة بنجاح.');
      } else {
        const newPage = await api.createCustomPage({ title: pageTitle, slug: pageSlug, is_active: true });
        setPages(prev => [...prev, newPage]);
        handleSelectPage(newPage);
        toast.success('تم إنشاء الصفحة بنجاح.');
      }
      setShowPageModal(false);
      fetchPages();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الصفحة.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (slugsProtected.includes(title)) {
      toast.error('لا يمكن حذف هذه الصفحة الأساسية.');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف صفحة "${title}" وكافة أقسامها نهائياً؟`)) return;
    try {
      await api.deleteCustomPage(id);
      setPages(prev => prev.filter(p => p.id !== id));
      if (selectedPage?.id === id) {
        setSelectedPage(null);
        setSections([]);
      }
      toast.success('تم حذف الصفحة بنجاح.');
    } catch (err: any) {
      toast.error('خطأ أثناء حذف الصفحة: ' + err.message);
    }
  };

  // Section builders
  const handleAddSection = (type: string) => {
    const newSec: PageSection = {
      id: 'temp-' + Date.now(),
      page_id: selectedPage?.id || '',
      section_type: type,
      title: type === 'hero' ? 'عنوان الصفحة الرئيسي' : type === 'gallery' ? 'معرض صور الأنشطة' : 'عنوان القسم الجديد',
      subtitle: type === 'hero' ? 'بمحرم بك' : '',
      content: type === 'hero' ? 'وصف أو شعار الصفحة الترحيبي هنا' : 'اكتب نصوص هذا القسم هنا...',
      image_url: type === 'hero' ? '/church.jpeg' : '',
      items: type === 'cards_grid' ? [
        { title: 'بطاقة ١', desc: 'تفاصيل البطاقة الأولى', image: '/history_1.jpg', link: '#' }
      ] : [],
      sort_order: sections.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updatedSections = [...sections, newSec];
    setSections(updatedSections);
    handleOpenEditSection(sections.length, newSec);
  };

  const handleOpenEditSection = (index: number, sec: PageSection) => {
    setEditSectionIdx(index);
    setSecType(sec.section_type);
    setSecTitle(sec.title || '');
    setSecSubtitle(sec.subtitle || '');
    setSecContent(sec.content || '');
    setSecImageUrl(sec.image_url || '');
    setSecItems(sec.items || []);
    setDriveFolderUrl('');
  };

  // INSTANT FIELD UPDATER FOR SMOOTH INTERACTION
  const handleUpdateField = (field: keyof PageSection, value: any) => {
    if (editSectionIdx === null) return;
    
    // Update local editor form states
    if (field === 'title') setSecTitle(value);
    if (field === 'subtitle') setSecSubtitle(value);
    if (field === 'content') setSecContent(value);
    if (field === 'image_url') setSecImageUrl(value);
    if (field === 'items') setSecItems(value);

    // Instantly update the main array so the preview updates on the fly
    setSections(prev => prev.map((s, idx) => idx === editSectionIdx ? {
      ...s,
      [field]: value
    } : s));
  };

  const handleFetchDriveImagesForSection = async () => {
    if (!driveFolderUrl.trim()) return;
    setFetchingDrive(true);
    setErrorMsg('');
    try {
      const extractedUrls = await extractGoogleDriveFolderImages(driveFolderUrl);
      handleUpdateField('items', extractedUrls);
      setSuccessMsg(`تم سحب (${extractedUrls.length}) صورة بنجاح من مجلد Google Drive للمعاينة.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل سحب الصور. تأكد من أن الرابط صحيح والمجلد عام.');
    } finally {
      setFetchingDrive(false);
    }
  };

  const handleRemoveSection = (index: number) => {
    if (!window.confirm('هل تود إزالة هذا القسم من قائمة العرض مؤقتاً؟')) return;
    setSections(prev => prev.filter((_, idx) => idx !== index));
    setEditSectionIdx(null);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated);
    if (editSectionIdx === index) {
      setEditSectionIdx(targetIdx);
    } else if (editSectionIdx === targetIdx) {
      setEditSectionIdx(index);
    }
  };

  const handleUpdateSetting = (key: string, value: string) => {
    setSiteSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Publish Page Sections to Database
  const handlePublishPage = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'dictionary') {
        await api.updateSiteSettings(siteSettings);
        toast.success('تم حفظ وتحديث نصوص وقاموس الكلمات للموقع العام بنجاح!');
      } else {
        if (!selectedPage) return;
        const normalized = sections.map((sec, idx) => ({
          page_id: selectedPage.id,
          section_type: sec.section_type,
          title: sec.title,
          subtitle: sec.subtitle,
          content: sec.content,
          image_url: sec.image_url,
          items: sec.items || [],
          sort_order: idx
        }));

        await api.savePageSections(selectedPage.id, normalized);
        toast.success('تم حفظ وتحديث أقسام الصفحة بنجاح ونشرها على الموقع العام!');
        handleSelectPage(selectedPage);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء حفظ التغييرات.');
    } finally {
      setSubmitting(false);
    }
  };

  // Card grid items functions
  const handleAddGridItem = () => {
    const updatedItems = [...secItems, { title: 'عنوان بطاقة جديد', desc: 'تفاصيل البطاقة الجديدة', image: '/history_1.jpg', link: '#' }];
    handleUpdateField('items', updatedItems);
  };

  const handleRemoveGridItem = (idx: number) => {
    const updatedItems = secItems.filter((_, i) => i !== idx);
    handleUpdateField('items', updatedItems);
  };

  const handleGridItemChange = (idx: number, field: string, value: string) => {
    const updatedItems = secItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    handleUpdateField('items', updatedItems);
  };

  const slugsProtected = ['home', 'about'];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#00174a] p-6 rounded-3xl text-white shadow-xl border-b-4 border-[#fed65b]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#fed65b]">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-xl sm:text-2xl text-[#fed65b]">باني الصفحات ومحرر الموقع (CMS)</h1>
            </div>
            <p className="text-slate-350 text-xs">تحكم ديناميكياً بهيكل ومحتوى صفحات الموقع كاملة وصمم أقسامك بكل حرية مع المعاينة الحية</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setPageEditId(null);
                setPageTitle('');
                setPageSlug('');
                setShowPageModal(true);
              }}
              className="bg-[#fed65b] text-[#00174a] hover:bg-[#ffdf80] font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>إضافة صفحة جديدة</span>
            </button>
          </div>
        </div>

        {/* Global Messages */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-250 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-250 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-650 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Editor Main Switch Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-5 py-2.5 font-tajawal font-bold text-xs rounded-t-2xl border-t border-x transition-all -mb-px ${
              activeTab === 'pages' 
                ? 'bg-white border-slate-200 text-[#002366] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            باني الصفحات والأقسام (Pages Builder)
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-5 py-2.5 font-tajawal font-bold text-xs rounded-t-2xl border-t border-x transition-all -mb-px ${
              activeTab === 'dictionary' 
                ? 'bg-white border-slate-200 text-[#002366] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            تعديل نصوص ونماذج الموقع (Site Texts CMS)
          </button>
        </div>

        {activeTab === 'dictionary' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left panel: Dictionary forms */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-right">
                <div>
                  <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">قاموس الكلمات والنصوص العام</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">عدل أي جملة أو شعار أو نصوص النماذج للموقع كاملاً</p>
                </div>
                <button
                  onClick={handlePublishPage}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow disabled:opacity-55"
                >
                  <Save className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                  <span>{submitting ? 'جاري الحفظ والنشـر...' : 'حفظ ونشر التغييرات'}</span>
                </button>
              </div>

              <div className="space-y-5 text-right overflow-y-auto max-h-[65vh] pr-1">
                
                {/* Sermons Library */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-2">صفحة مكتبة العظات والكلمات</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">العنوان الرئيسي للمكتبة</label>
                      <input 
                        type="text"
                        value={siteSettings.sermons_title || 'مكتبة العظات والكلمات الروحية'}
                        onChange={e => handleUpdateSetting('sermons_title', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">العنوان الفرعي للمكتبة</label>
                      <textarea 
                        value={siteSettings.sermons_subtitle || 'سجل روحي متجدد لعظات ودروس آباء الكنيسة الأجلاء بمحرم بك'}
                        onChange={e => handleUpdateSetting('sermons_subtitle', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] h-14 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Prayer Request Modal */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-2">نموذج طلب صلاة على المذبح</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">عنوان النموذج</label>
                      <input 
                        type="text"
                        value={siteSettings.prayer_title || 'اطلب صلاة على المذبح'}
                        onChange={e => handleUpdateSetting('prayer_title', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">وصف وتعليمات النموذج</label>
                      <textarea 
                        value={siteSettings.prayer_subtitle || 'نؤمن بقوة الصلاة المرفوعة على المذبح المقدس. اكتب طلبتك وسيقوم الآباء الكهنة بذكر اسمك بكل سرية وعمق.'}
                        onChange={e => handleUpdateSetting('prayer_subtitle', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Membership Registration */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-2">بوابة تسجيل العضوية والأسر</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">العنوان الرئيسي للبوابة</label>
                      <input 
                        type="text"
                        value={siteSettings.membership_title || 'بوابة تسجيل العضوية الكنسية'}
                        onChange={e => handleUpdateSetting('membership_title', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">وصف البوابة</label>
                      <textarea 
                        value={siteSettings.membership_subtitle || 'يرجى ملء البيانات وتسجيل بيانات أسرتك لتسهيل الافتقاد والتثبيت ومتابعة الخدمات الروحية الكنسية.'}
                        onChange={e => handleUpdateSetting('membership_subtitle', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Stream Settings */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-right">
                  <h4 className="text-xs font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-2 flex items-center justify-between">
                    <span>إعدادات البث المباشر الكنسي</span>
                    <span className="text-[9px] bg-red-500 text-white font-tajawal px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Live</span>
                  </h4>
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between bg-white/60 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-650">تفعيل حالة البث المباشر الآن:</span>
                      <select
                        value={siteSettings.live_stream_active || 'false'}
                        onChange={e => handleUpdateSetting('live_stream_active', e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-[#002366] font-bold"
                      >
                        <option value="false">مغلق (لا يوجد بث نشط)</option>
                        <option value="true">مفتوح (بث مباشر نشط)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">رابط يوتيوب للبث (YouTube Video Embed Link)</label>
                      <input 
                        type="text"
                        value={siteSettings.live_stream_youtube_url || ''}
                        onChange={e => handleUpdateSetting('live_stream_youtube_url', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">عنوان البث الحالي</label>
                      <input 
                        type="text"
                        value={siteSettings.live_stream_title || ''}
                        onChange={e => handleUpdateSetting('live_stream_title', e.target.value)}
                        placeholder="القداس الإلهي الإلهي - الأحد..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">تفاصيل ووصف البث</label>
                      <textarea 
                        value={siteSettings.live_stream_description || ''}
                        onChange={e => handleUpdateSetting('live_stream_description', e.target.value)}
                        placeholder="صلوات القداس الإلهي، تفاصيل المناسبة الروحية..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] h-14 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Servants and Priests Drive / Curriculums Resources */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-right">
                  <h4 className="text-xs font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-2">ملفات ومناهج الخدمة (الخدام والكهنة)</h4>
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">رابط فولدر درايف العام للخدام (Google Drive Folder)</label>
                      <input 
                        type="text"
                        value={siteSettings.servant_drive_url || ''}
                        onChange={e => handleUpdateSetting('servant_drive_url', e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">رابط منهج حضانة (الملائكة) PDF</label>
                      <input 
                        type="text"
                        value={siteSettings.curriculum_infants_url || ''}
                        onChange={e => handleUpdateSetting('curriculum_infants_url', e.target.value)}
                        placeholder="رابط التحميل المباشر..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">رابط منهج ابتدائي PDF</label>
                      <input 
                        type="text"
                        value={siteSettings.curriculum_primary_url || ''}
                        onChange={e => handleUpdateSetting('curriculum_primary_url', e.target.value)}
                        placeholder="رابط التحميل المباشر..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold">رابط منهج إعدادي وثانوي PDF</label>
                      <input 
                        type="text"
                        value={siteSettings.curriculum_prep_url || ''}
                        onChange={e => handleUpdateSetting('curriculum_prep_url', e.target.value)}
                        placeholder="رابط التحميل المباشر..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#002366] font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right panel: Dictionary mock live preview */}
            <div className="lg:col-span-7 bg-[#fcfbf9] border border-slate-200 rounded-3xl p-6 shadow-inner space-y-6">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-right">
                <h3 className="font-tajawal font-extrabold text-sm text-[#002366] flex items-center gap-2">
                  <Eye className="w-4.5 h-4.5 text-[#d4af37]" />
                  <span>معاينة حية وتوضيحية للتغييرات</span>
                </h3>
              </div>

              <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-1">
                {/* Mock Sermons Header */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-right space-y-2 shadow-sm">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">شكل صفحة مكتبة العظات</span>
                  <h1 className="font-tajawal text-lg font-bold text-[#00174a]">{siteSettings.sermons_title || 'مكتبة العظات والكلمات الروحية'}</h1>
                  <p className="text-xs text-slate-500">{siteSettings.sermons_subtitle || 'سجل روحي متجدد لعظات ودروس آباء الكنيسة الأجلاء بمحرم بك'}</p>
                </div>

                {/* Mock Prayer Modal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-right space-y-3 shadow-sm max-w-md mx-auto">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">شكل نموذج طلب صلاة</span>
                  <h2 className="font-tajawal text-base font-bold text-[#002366]">{siteSettings.prayer_title || 'اطلب صلاة على المذبح'}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{siteSettings.prayer_subtitle || 'نؤمن بقوة الصلاة المرفوعة على المذبح المقدس. اكتب طلبتك وسيقوم الآباء الكهنة بذكر اسمك بكل سرية وعمق.'}</p>
                  <div className="h-8 bg-slate-50 rounded-lg border border-slate-100" />
                  <div className="h-16 bg-slate-50 rounded-lg border border-slate-100" />
                </div>

                {/* Mock Membership Portal */}
                <div className="bg-[#00113a] text-white p-6 rounded-2xl border border-[#d4af37]/35 text-center space-y-3 shadow-sm">
                  <span className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded font-bold block w-fit mx-auto">شكل بوابة تسجيل العضوية</span>
                  <h1 className="font-tajawal text-base font-bold text-[#fed65b]">{siteSettings.membership_title || 'بوابة تسجيل العضوية الكنسية'}</h1>
                  <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed">{siteSettings.membership_subtitle || 'يرجى ملء البيانات وتسجيل بيانات أسرتك لتسهيل الافتقاد والتثبيت ومتابعة الخدمات الروحية الكنسية.'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Pages Tabs List */}
            <div className="flex flex-wrap items-center gap-2 bg-white/60 border border-slate-200 p-2.5 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 pr-2">اختر الصفحة للتعديل:</span>
              {pages.map(page => (
                <div key={page.id} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-sm transition-all ${
                  selectedPage?.id === page.id ? 'bg-[#002366] text-[#fed65b] border-[#002366]' : 'bg-white text-slate-660 border-slate-200/80 hover:bg-slate-50'
                }`}>
                  <button
                    onClick={() => handleSelectPage(page)}
                    className="text-xs font-bold transition-all"
                  >
                    {page.title} ({page.slug})
                  </button>
                  {!slugsProtected.includes(page.slug) && (
                    <button
                      onClick={() => handleDeletePage(page.id, page.title)}
                      className={`p-0.5 rounded transition-colors ${selectedPage?.id === page.id ? 'text-[#fed65b] hover:bg-white/10' : 'text-rose-500 hover:bg-rose-50'}`}
                      title="حذف الصفحة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedPage && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 1. Left panel: Page Structure & Layout Editor (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sections list inside selected page */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/85 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-right">
                  <div>
                    <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">أقسام صفحة ({selectedPage.title})</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">يمكنك ترتيب الأقسام وتعديل محتواها لحظياً</p>
                  </div>
                  <button
                    onClick={handlePublishPage}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow disabled:opacity-55"
                  >
                    <Save className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                    <span>{submitting ? 'جاري الحفظ والنشـر...' : 'حفظ ونشر التغييرات'}</span>
                  </button>
                </div>

                {/* List of active sections */}
                <div className="space-y-2.5">
                  {sections.map((sec, idx) => (
                    <div 
                      key={sec.id}
                      onClick={() => handleOpenEditSection(idx, sec)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        editSectionIdx === idx 
                          ? 'bg-[#002366]/5 border-[#002366]/40 shadow-sm' 
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-right">
                        <span className="text-[10px] bg-slate-200 text-slate-650 w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#002366]">{sec.title || 'بدون عنوان'}</p>
                          <p className="text-[9px] text-[#d4af37] font-bold">نوع القسم: {sec.section_type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}
                          className="p-1 text-slate-500 hover:text-[#002366]"
                          title="نقل لأعلى"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}
                          className="p-1 text-slate-500 hover:text-[#002366]"
                          title="نقل لأسفل"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveSection(idx); }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="إزالة القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {sections.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
                      الصفحة فارغة حالياً. أضف قسماً من الأسفل.
                    </div>
                  )}
                </div>

                {/* Section Adders Panel */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-450 text-right">إضافة قسم جديد للصفحة:</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <button
                      onClick={() => handleAddSection('hero')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>رئيسي (Hero)</span>
                    </button>
                    <button
                      onClick={() => handleAddSection('text_block')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>فقرة نصية (Text)</span>
                    </button>
                    <button
                      onClick={() => handleAddSection('cards_grid')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-purple-500" />
                      <span>شبكة بطاقات (Grid)</span>
                    </button>
                    <button
                      onClick={() => handleAddSection('gallery')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <Images className="w-3.5 h-3.5 text-emerald-500" />
                      <span>معرض صور (Gallery)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Side Panel Editor (Form settings for the selected section) */}
              {editSectionIdx !== null && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex justify-between items-center text-right">
                    <h4 className="font-tajawal font-bold text-xs text-[#002366]">تعديل محتوى القسم رقم ({editSectionIdx + 1})</h4>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                      مزامنة حية ومباشرة
                    </span>
                  </div>

                  <div className="space-y-4 text-slate-700 text-right">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">العنوان الرئيسي للقسم</label>
                      <input 
                        type="text"
                        value={secTitle}
                        onChange={e => handleUpdateField('title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">العنوان الفرعي للقسم</label>
                      <input 
                        type="text"
                        value={secSubtitle}
                        onChange={e => handleUpdateField('subtitle', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    {secType === 'hero' || secType === 'text_block' ? (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">المحتوى النصي للقسم (نصوص ومقالات)</label>
                        <textarea 
                          value={secContent}
                          onChange={e => handleUpdateField('content', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none resize-none h-28"
                        />
                      </div>
                    ) : null}

                    {secType === 'hero' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">رابط صورة الخلفية للقسم</label>
                        <input 
                          type="text"
                          value={secImageUrl}
                          onChange={e => handleUpdateField('image_url', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-mono"
                        />
                      </div>
                    )}

                    {secType === 'cards_grid' && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-[#002366]">عناصر شبكة البطاقات (Cards List)</label>
                          <button
                            type="button"
                            onClick={handleAddGridItem}
                            className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-1 rounded hover:bg-slate-200 text-slate-700"
                          >
                            + إضافة بطاقة
                          </button>
                        </div>
                        
                        <div className="space-y-3.5 max-h-52 overflow-y-auto pr-1">
                          {secItems.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2 relative">
                              <button
                                type="button"
                                onClick={() => handleRemoveGridItem(idx)}
                                className="absolute top-2 left-2 text-rose-500 hover:bg-rose-50 p-0.5 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="space-y-1">
                                <input 
                                  type="text"
                                  value={item.title || ''}
                                  placeholder="عنوان البطاقة"
                                  onChange={e => handleGridItemChange(idx, 'title', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none font-bold"
                                />
                                <input 
                                  type="text"
                                  value={item.desc || ''}
                                  placeholder="وصف تفصيلي للبطاقة"
                                  onChange={e => handleGridItemChange(idx, 'desc', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none"
                                />
                                <input 
                                  type="text"
                                  value={item.image || ''}
                                  placeholder="رابط الصورة"
                                  onChange={e => handleGridItemChange(idx, 'image', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none font-mono text-[10px]"
                                />
                                <input 
                                  type="text"
                                  value={item.link || ''}
                                  placeholder="رابط التوجيه (أو /about/history)"
                                  onChange={e => handleGridItemChange(idx, 'link', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none font-mono text-[10px]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {secType === 'gallery' && (
                      <div className="space-y-4 pt-2 border-t border-[#002366]/10">
                        
                        {/* Bulk Google Drive folder extractor */}
                        <div className="bg-[#fed65b]/10 border border-[#d4af37]/25 p-4 rounded-2xl space-y-3">
                          <label className="block text-xs font-bold text-[#002366] font-tajawal flex items-center gap-1.5">
                            <FolderOpen className="w-4 h-4 text-[#d4af37]" />
                            <span>سحب سريع للصور من مجلد Google Drive:</span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              value={driveFolderUrl}
                              onChange={e => setDriveFolderUrl(e.target.value)}
                              placeholder="رابط المجلد العام على Google Drive"
                              className="flex-1 bg-white border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-[11px] outline-none"
                            />
                            <button
                              type="button"
                              disabled={fetchingDrive || !driveFolderUrl}
                              onClick={handleFetchDriveImagesForSection}
                              className="bg-[#002366] hover:bg-[#00174a] text-white disabled:opacity-50 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                            >
                              {fetchingDrive ? 'سحب...' : 'سحب الصور'}
                            </button>
                          </div>
                          <p className="text-[9px] text-[#002366]/70 leading-normal font-semibold">
                            * تأكد من ضبط مشاركة مجلد Google Drive لتكون "عامة أو أي شخص لديه الرابط يمكنه العرض".
                          </p>
                        </div>

                        {/* List of direct image URL strings */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-700">روابط صور المعرض الحالي ({secItems.length})</label>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = [...secItems, ''];
                                handleUpdateField('items', updatedItems);
                              }}
                              className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-1 rounded"
                            >
                              + إضافة رابط يدوي
                            </button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {secItems.map((item, idx) => {
                              const val = typeof item === 'string' ? item : item.image_url || item.image || '';
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <input 
                                    type="url"
                                    value={val}
                                    onChange={e => {
                                      const updated = [...secItems];
                                      updated[idx] = e.target.value;
                                      handleUpdateField('items', updated);
                                    }}
                                    placeholder={`رابط الصورة رقم ${idx + 1}`}
                                    className="flex-1 bg-slate-50 border border-slate-250 rounded-lg px-2 py-1.5 text-[11px] outline-none font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = secItems.filter((_, i) => i !== idx);
                                      handleUpdateField('items', updated);
                                    }}
                                    className="text-rose-500 hover:bg-rose-55 p-1 rounded"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Right panel: WYSIWYG Live Canvas Preview of Page (7 cols) */}
            <div className="lg:col-span-7 bg-[#fcfbf9] border border-slate-250/80 rounded-3xl p-6 shadow-inner space-y-6 flex flex-col justify-between">
              
              <div>
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-right">
                  <h3 className="font-tajawal font-extrabold text-sm text-[#002366] flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-[#d4af37]" />
                    <span>المعاينة الحية للصفحة ({selectedPage.title})</span>
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                {/* Live rendered dynamic canvas */}
                <div className="space-y-8 mt-6 max-h-[80vh] overflow-y-auto pr-1 border border-slate-250/60 rounded-2xl bg-white p-4 shadow-sm">
                  
                  {sections.map((sec, idx) => {
                    if (sec.section_type === 'hero') {
                      return (
                        <div 
                          key={sec.id}
                          className="relative min-h-[220px] flex items-center justify-center bg-[#00113a] overflow-hidden text-white rounded-2xl text-center p-6 border-b-2 border-[#d4af37]"
                        >
                          <div 
                            className="absolute inset-0 bg-cover z-0 opacity-40" 
                            style={{ 
                              backgroundImage: `url('${sec.image_url || '/church.jpeg'}')`,
                              backgroundPosition: "center bottom"
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#00113a]/90 via-[#00113a]/50 to-[#00113a]/90 z-10" />
                          
                          <div className="relative z-20 space-y-2">
                            <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-white">
                              {sec.title || 'عنوان رئيسي'}
                            </h2>
                            <p className="text-[#fed65b] font-bold text-sm">
                              {sec.subtitle || 'تفاصيل فرعية'}
                            </p>
                            <p className="text-[10px] text-slate-350 max-w-sm mx-auto leading-relaxed pt-1">
                              {sec.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (sec.section_type === 'text_block') {
                      return (
                        <div key={sec.id} className="bg-[#fbf9f8] p-5 rounded-2xl border border-slate-200/60 text-right space-y-2">
                          {sec.title && (
                            <h3 className="font-tajawal font-extrabold text-sm text-[#002366] border-r-2 border-[#d4af37] pr-2">
                              {sec.title}
                            </h3>
                          )}
                          {sec.subtitle && (
                            <p className="text-[10px] text-[#d4af37] font-bold">{sec.subtitle}</p>
                          )}
                          <p className="text-xs text-slate-650 leading-relaxed pt-1 whitespace-pre-line">
                            {sec.content}
                          </p>
                        </div>
                      );
                    }

                    if (sec.section_type === 'cards_grid') {
                      return (
                        <div key={sec.id} className="space-y-4 text-right">
                          <div>
                            <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">{sec.title || 'مجموعات وبطاقات'}</h3>
                            <p className="text-[10px] text-slate-400 font-bold">{sec.subtitle}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {(sec.items || []).map((item: any, cIdx: number) => (
                              <div key={cIdx} className="bg-[#fbf9f8] rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm flex flex-col justify-between h-[220px]">
                                <div className="h-20 bg-slate-100 overflow-hidden relative">
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3 text-right flex-grow flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-tajawal font-extrabold text-xs text-[#002366] line-clamp-1">{item.title}</h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal">{item.desc}</p>
                                  </div>
                                  <span className="text-[9px] text-[#d4af37] font-bold pt-2 block">استكشف القسم ➜</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (sec.section_type === 'gallery') {
                      const imgs = sec.items || [];
                      return (
                        <div key={sec.id} className="space-y-4 text-right">
                          <div>
                            <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">{sec.title || 'معرض الصور'}</h3>
                            <p className="text-[10px] text-slate-400 font-bold">{sec.subtitle}</p>
                          </div>
                          
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {imgs.map((imgUrl: any, imgIdx: number) => {
                              const url = typeof imgUrl === 'string' ? imgUrl : imgUrl.image_url || imgUrl.image || '';
                              if (!url) return null;
                              return (
                                <div key={imgIdx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                  <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                  
                  {sections.length === 0 && (
                    <div className="py-20 text-center text-slate-450 font-bold text-xs">
                      رتب أقسامك من المحرر لتشاهد المعاينة الحية فورياً هنا!
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-6 bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                📌 **معلومة للناشر**: هذه المعاينة حية ومباشرة. استخدام زر "حفظ ونشر التغييرات" لتحديث قاعدة البيانات وتطبيق المظهر العام للموقع.
              </div>
            </div>

          </div>
        )}
          </>
        )}

        {/* Create/Edit Page Modal */}
        {showPageModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#00174a] text-white">
                <h2 className="font-tajawal font-bold text-sm flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#fed65b]" />
                  {pageEditId ? 'تعديل بيانات الصفحة' : 'إنشاء صفحة ديناميكية جديدة'}
                </h2>
                <button 
                  onClick={() => setShowPageModal(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-full transition-colors hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePage} className="p-6 space-y-4 text-slate-700 text-right">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">عنوان الصفحة باللغة العربية *</label>
                  <input 
                    type="text"
                    required
                    value={pageTitle}
                    onChange={e => setPageTitle(e.target.value)}
                    placeholder="مثال: الخدمات والأنشطة"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رابط الصفحة (Slug بالإنجليزية) *</label>
                  <input 
                    type="text"
                    required
                    value={pageSlug}
                    onChange={e => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="مثال: services"
                    disabled={!!pageEditId && slugsProtected.includes(pageSlug)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-mono"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-grow bg-[#00174a] text-[#fed65b] font-bold py-2.5 rounded-xl hover:bg-[#002366] transition-all shadow-md text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ الصفحة</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPageModal(false)}
                    className="bg-white border border-slate-200 text-slate-650 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-xs"
                  >
                    <span className="text-slate-600 font-bold">إلغاء</span>
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

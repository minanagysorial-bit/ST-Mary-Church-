import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  BookOpen, Plus, Search, Filter, Trash2, Edit2, ExternalLink, 
  Download, Check, X, FileText, Folder, RefreshCw, Sparkles, HelpCircle, Eye
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export interface ChurchCurriculum {
  id: string;
  title: string;
  stage: 'حضانة' | 'ابتدائي' | 'إعدادي' | 'ثانوي' | 'جامعة' | 'خريجين' | 'عام';
  description: string;
  drive_url: string;
  file_type: 'PDF' | 'PowerPoint' | 'Word' | 'Folder' | 'رابط خارجي';
  term?: string;
  created_at: string;
  updated_at?: string;
}

const DEFAULT_CURRICULUMS: ChurchCurriculum[] = [
  {
    id: 'curr-1',
    title: 'منهج مرحلة حضانة (الملائكة) - قصص العهد القديم والجديد',
    stage: 'حضانة',
    description: 'تحضير قصص شيقة تفاعلية مع وسائل إيضاح وتلوين مجسمة للأطفال.',
    drive_url: 'https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo?usp=drive_link',
    file_type: 'PDF',
    term: 'السنوي',
    created_at: new Date().toISOString()
  },
  {
    id: 'curr-2',
    title: 'منهج مرحلة ابتدائي - العقيدة والطقوس وتاريخ الكنيسة',
    stage: 'ابتدائي',
    description: 'منهج العقيدة والطقوس المبسط والأنشطة والمسابقات لسنوات الابتدائي (1-6).',
    drive_url: 'https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo?usp=drive_link',
    file_type: 'PDF',
    term: 'الترم الأول والثاني',
    created_at: new Date().toISOString()
  },
  {
    id: 'curr-3',
    title: 'منهج مرحلة إعدادي - دراسات كتابية وبناء الشخصية المسيحية',
    stage: 'إعدادي',
    description: 'دراسات في العهدين وسير الآباء والرد على التساؤلات المعاصرة للفتيان والفتيات.',
    drive_url: 'https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo?usp=drive_link',
    file_type: 'PDF',
    term: 'السنوي',
    created_at: new Date().toISOString()
  },
  {
    id: 'curr-4',
    title: 'منهج مرحلة ثانوي - الدفاعيات والحياة المعاصرة',
    stage: 'ثانوي',
    description: 'موضوعات الإيمان والأخلاقيات والشهادة للمسيح في المجتمع الجامعي والمدرسي.',
    drive_url: 'https://drive.google.com/drive/folders/1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo?usp=drive_link',
    file_type: 'PowerPoint',
    term: 'السنوي',
    created_at: new Date().toISOString()
  }
];

export const formatDriveUrl = (url: string): { previewUrl: string; downloadUrl: string; isFolder: boolean } => {
  if (!url) return { previewUrl: '', downloadUrl: '', isFolder: false };
  const trimmed = url.trim();

  // Check if folder
  if (trimmed.includes('/folders/')) {
    return { previewUrl: trimmed, downloadUrl: trimmed, isFolder: true };
  }

  // Extract file ID from standard Google Drive links:
  // e.g. drive.google.com/file/d/FILE_ID/view... or id=FILE_ID
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = matchFile ? matchFile[1] : (matchId ? matchId[1] : null);

  if (fileId) {
    return {
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      isFolder: false
    };
  }

  return { previewUrl: trimmed, downloadUrl: trimmed, isFolder: false };
};

export const CurriculumManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [curriculums, setCurriculums] = useState<ChurchCurriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('الكل');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChurchCurriculum | null>(null);
  const [previewingItem, setPreviewingItem] = useState<ChurchCurriculum | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formStage, setFormStage] = useState<ChurchCurriculum['stage']>('ابتدائي');
  const [formDescription, setFormDescription] = useState('');
  const [formDriveUrl, setFormDriveUrl] = useState('');
  const [formFileType, setFormFileType] = useState<ChurchCurriculum['file_type']>('PDF');
  const [formTerm, setFormTerm] = useState('السنوي');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    setLoading(true);
    try {
      const settings = await api.getSiteSettings();
      if (settings && settings['church_curriculums']) {
        try {
          const parsed = JSON.parse(settings['church_curriculums']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCurriculums(parsed);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Check localStorage fallback
      const local = localStorage.getItem('church_curriculums_cache');
      if (local) {
        setCurriculums(JSON.parse(local));
      } else {
        setCurriculums(DEFAULT_CURRICULUMS);
        saveCurriculumsToStorage(DEFAULT_CURRICULUMS);
      }
    } catch (err: any) {
      console.warn('Using default curricula:', err);
      setCurriculums(DEFAULT_CURRICULUMS);
    } finally {
      setLoading(false);
    }
  };

  const saveCurriculumsToStorage = async (updated: ChurchCurriculum[]) => {
    setSaving(true);
    try {
      localStorage.setItem('church_curriculums_cache', JSON.stringify(updated));
      await api.updateSiteSettings({
        church_curriculums: JSON.stringify(updated)
      });
      setMessage({ text: 'تم حفظ وتحديث المناهج بنجاح ✨', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'تم الحفظ محلياً (حدث خطأ في الاتصال بقاعدة البيانات)', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormStage('ابتدائي');
    setFormDescription('');
    setFormDriveUrl('');
    setFormFileType('PDF');
    setFormTerm('السنوي');
    setShowModal(true);
  };

  const handleOpenEdit = (item: ChurchCurriculum) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormStage(item.stage);
    setFormDescription(item.description || '');
    setFormDriveUrl(item.drive_url || '');
    setFormFileType(item.file_type || 'PDF');
    setFormTerm(item.term || 'السنوي');
    setShowModal(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنهج: "${title}"؟`)) return;
    const updated = curriculums.filter(c => c.id !== id);
    setCurriculums(updated);
    saveCurriculumsToStorage(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('برجاء كتابة عنوان المنهج');
      return;
    }
    if (!formDriveUrl.trim()) {
      alert('برجاء وضع رابط ملف أو مجلد جوجل درايف');
      return;
    }

    let updated: ChurchCurriculum[];
    if (editingItem) {
      updated = curriculums.map(c => c.id === editingItem.id ? {
        ...c,
        title: formTitle.trim(),
        stage: formStage,
        description: formDescription.trim(),
        drive_url: formDriveUrl.trim(),
        file_type: formFileType,
        term: formTerm,
        updated_at: new Date().toISOString()
      } : c);
    } else {
      const newItem: ChurchCurriculum = {
        id: 'curr-' + Date.now(),
        title: formTitle.trim(),
        stage: formStage,
        description: formDescription.trim(),
        drive_url: formDriveUrl.trim(),
        file_type: formFileType,
        term: formTerm,
        created_at: new Date().toISOString()
      };
      updated = [newItem, ...curriculums];
    }

    setCurriculums(updated);
    saveCurriculumsToStorage(updated);
    setShowModal(false);
  };

  const filteredCurriculums = curriculums.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'الكل' || c.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <DashboardLayout role="super_admin">
      <div className="space-y-6 text-right font-cairo" dir="rtl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#00174a] text-[#fed65b]">
                <BookOpen className="w-6 h-6" />
              </span>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#00174a]">
                إدارة مناهج التربية الكنسية ودرايف
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              إضافة وتعديل مناهج الكنيسة وسحب الملفات من Google Drive لتظهر للخدام في حقيبة الأدوات
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منهج جديد</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-2xl text-xs font-bold border animate-fade-in ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم المنهج أو المرحلة أو الكلمات المفتاحية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#002366]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#002366]"
            >
              <option value="الكل">كل المراحل</option>
              <option value="حضانة">حضانة</option>
              <option value="ابتدائي">ابتدائي</option>
              <option value="إعدادي">إعدادي</option>
              <option value="ثانوي">ثانوي</option>
              <option value="جامعة">جامعة</option>
              <option value="خريجين">خريجين</option>
              <option value="عام">عام</option>
            </select>
          </div>
        </div>

        {/* Curriculums Cards Grid */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل المناهج الدراسية...</p>
          </div>
        ) : filteredCurriculums.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">لا توجد مناهج مضافة مطابقة للبحث</p>
            <button
              onClick={handleOpenAdd}
              className="text-xs font-bold text-[#002366] underline"
            >
              + إضافة أول منهج دراسي
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCurriculums.map(c => {
              const { previewUrl, downloadUrl, isFolder } = formatDriveUrl(c.drive_url);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#002366] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-blue-50 text-[#002366] font-bold text-[11px] px-2.5 py-1 rounded-lg border border-blue-100">
                        مرحلة {c.stage}
                      </span>
                      <span className="bg-amber-50 text-amber-800 font-bold text-[11px] px-2 py-0.5 rounded-md">
                        {c.file_type} {c.term ? `• ${c.term}` : ''}
                      </span>
                    </div>

                    <h3 className="font-tajawal text-base font-bold text-[#00174a] leading-snug">
                      {c.title}
                    </h3>

                    {c.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Drive Link button */}
                      <a
                        href={c.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-slate-50 hover:bg-[#002366] hover:text-[#fed65b] text-slate-700 py-2 px-3 rounded-xl border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح في Google Drive</span>
                      </a>

                      {!isFolder && (
                        <button
                          onClick={() => setPreviewingItem(c)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                          title="معاينة الملف"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-slate-600 hover:text-[#002366] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="text-rose-400 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add/Edit Curriculum */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-right animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tajawal text-lg font-bold text-[#00174a]">
                      {editingItem ? 'تعديل المنهج الدراسي' : 'إضافة منهج جديد'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">ربط المنهج بملف أو مجلد من Google Drive</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    عنوان المنهج الدراسي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: منهج الصف الرابع الابتدائي - النصف الأول"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">المرحلة الدراسية</label>
                    <select
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    >
                      <option value="حضانة">حضانة</option>
                      <option value="ابتدائي">ابتدائي</option>
                      <option value="إعدادي">إعدادي</option>
                      <option value="ثانوي">ثانوي</option>
                      <option value="جامعة">جامعة</option>
                      <option value="خريجين">خريجين</option>
                      <option value="عام">عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الملف</label>
                    <select
                      value={formFileType}
                      onChange={(e) => setFormFileType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                    >
                      <option value="PDF">مستند PDF</option>
                      <option value="PowerPoint">عرض بوربوينت PPT</option>
                      <option value="Word">مستند Word</option>
                      <option value="Folder">مجلد Google Drive كامل</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رابط Google Drive (الملف أو المجلد) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/... أو https://drive.google.com/drive/folders/..."
                    value={formDriveUrl}
                    onChange={(e) => setFormDriveUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold font-mono focus:outline-none focus:border-[#002366]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    انسخ رابط المشاركة (Share Link) من جوجل درايف وتأكد من تفعيل صلاحية "Anyone with the link can view".
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الفصل الدراسي / التوقيت</label>
                  <input
                    type="text"
                    placeholder="مثال: الترم الأول / سنوي 2026"
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف ومحتوى المنهج</label>
                  <textarea
                    rows={3}
                    placeholder="أهداف المنهج، الوحدات، الآيات المحفوظة، الأنشطة المرفقة..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingItem ? 'حفظ التعديلات' : 'إضافة المنهج'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Preview Drive PDF */}
        {previewingItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] p-6 flex flex-col space-y-4 shadow-2xl border border-slate-100 animate-scale-in" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#002366]" />
                  <h3 className="font-tajawal text-base font-bold text-[#00174a]">
                    معاينة: {previewingItem.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewingItem.drive_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح في درايف</span>
                  </a>
                  <button
                    onClick={() => setPreviewingItem(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden relative">
                <iframe
                  src={formatDriveUrl(previewingItem.drive_url).previewUrl}
                  className="w-full h-full border-0"
                  title={previewingItem.title}
                  allow="autoplay"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

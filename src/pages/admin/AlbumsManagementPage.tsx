import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type MemoryAlbum, extractGoogleDriveFolderImages, convertDriveUrl, parseImageTransform } from '../../lib/api';
import { 
  Images, Plus, Trash2, Edit2, X, CheckCircle2, AlertCircle, Eye, 
  Save, Calendar, Link as LinkIcon, ArrowLeft, RefreshCw, FolderOpen, Sliders
} from 'lucide-react';

export const AlbumsManagementPage: React.FC = () => {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State (Real-time state for live preview)
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverOffsetX, setCoverOffsetX] = useState('50'); // 0-100%
  const [coverOffsetY, setCoverOffsetY] = useState('50'); // 0-100%
  const [coverZoom, setCoverZoom] = useState('1'); // scale factor
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  
  // Google Drive folder integration state
  const [pullMethod, setPullMethod] = useState<'folder' | 'links'>('folder');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [fetchingDrive, setFetchingDrive] = useState(false);

  // Editor screen toggling (since side-by-side preview is best in edit mode)
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await api.getMemoryAlbums();
      setAlbums(data);

      const settings = await api.getSiteSettings();
      if (settings && settings.youtube_api_key) {
        setGoogleApiKey(settings.youtube_api_key);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل تحميل ألبومات الصور أو الإعدادات من قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setTitle('ألبوم تذكاري جديد');
    setEventDate('عام ٢٠٢٦م');
    setCoverImageUrl('https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800');
    setCoverOffsetX('50');
    setCoverOffsetY('50');
    setCoverZoom('1');
    setImageUrls(['https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800']);
    setDriveFolderUrl('');
    setBulkLinksText('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleOpenEdit = (album: MemoryAlbum) => {
    const { rawUrl, offsetX, offsetY, zoom } = parseImageTransform(album.cover_image_url);
    setEditId(album.id);
    setTitle(album.title);
    setEventDate(album.event_date);
    setCoverImageUrl(rawUrl);
    setCoverOffsetX(offsetX);
    setCoverOffsetY(offsetY);
    setCoverZoom(zoom);
    setImageUrls(album.image_urls.length > 0 ? album.image_urls : ['']);
    setDriveFolderUrl('');
    setBulkLinksText('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };
  const handleAddImageUrlInput = () => {
    setImageUrls(prev => [...prev, '']);
  };

  const handleRemoveImageUrlInput = (index: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageUrlChange = (index: number, val: string) => {
    setImageUrls(prev => prev.map((url, idx) => idx === index ? val : url));
  };

  const handleParseBulkLinks = () => {
    if (!bulkLinksText.trim()) return;
    
    setErrorMsg('');
    setSuccessMsg('');

    // Check if user pasted a folder link instead of individual image links
    const isFolderLink = bulkLinksText.includes('/folders/') || bulkLinksText.includes('/drive/folders/');
    if (isFolderLink) {
      setErrorMsg('⚠️ تنبيه: يبدو أنك قمت بلصق رابط "مجلد" كامل هنا. هذا التبويب مخصص للصق روابط الصور الفردية المنسوخة معاً. لرفع مجلد كامل يرجى الانتقال لتبويب (سحب بمجلد كامل) أو نسخ روابط الصور الفردية ولصقها هنا.');
      return;
    }

    const lines = bulkLinksText.split('\n');
    const extractedUrls: string[] = [];

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      const dMatch = cleanLine.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      const idMatch = cleanLine.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      
      if (dMatch && dMatch[1]) {
        const fileId = dMatch[1].split('/')[0].split('?')[0].split('&')[0];
        extractedUrls.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
      } else if (idMatch && idMatch[1]) {
        const fileId = idMatch[1].split('/')[0].split('?')[0].split('&')[0];
        extractedUrls.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
      } else if (cleanLine.startsWith('http') && (cleanLine.includes('unsplash.com') || cleanLine.match(/\.(jpeg|jpg|gif|png|webp|svg)/i))) {
        extractedUrls.push(cleanLine);
      }
    });

    if (extractedUrls.length > 0) {
      if (!coverImageUrl || coverImageUrl.includes('unsplash.com')) {
        setCoverImageUrl(extractedUrls[0]);
      }
      setImageUrls(extractedUrls);
      setSuccessMsg(`تم استخراج وتحويل (${extractedUrls.length}) صورة بنجاح للمعاينة الحية.`);
      setBulkLinksText('');
    } else {
      setErrorMsg('لم يتم العثور على أي روابط صالحة لملفات Google Drive. يرجى التأكد من الروابط المدخلة.');
    }
  };

  const handleFetchDriveImages = async () => {
    if (!driveFolderUrl.trim()) return;
    setFetchingDrive(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const extractedUrls = await extractGoogleDriveFolderImages(driveFolderUrl, googleApiKey);
      if (extractedUrls.length > 0) {
        if (!coverImageUrl || coverImageUrl.includes('unsplash.com')) {
          setCoverImageUrl(extractedUrls[0]);
        }
        setImageUrls(extractedUrls);
        setSuccessMsg(`تم سحب (${extractedUrls.length}) صورة بنجاح من مجلد Google Drive للمعاينة الحية.`);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || 'فشل سحب الصور.';
      if (friendlyError.toLowerCase().includes('networkerror') || friendlyError.includes('Failed to fetch')) {
        friendlyError = 'فشل الاتصال بـ Google Drive (NetworkError). هذا الحظر يحدث بسبب قيود شبكات الإنترنت المحلية بمصر. يرجى استخدام "الخيار الثاني: لصق روابط متعددة" المتاح بالأسفل كحل بديل فوري وسهل!';
      }
      setErrorMsg(friendlyError);
    } finally {
      setFetchingDrive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate.trim() || !coverImageUrl.trim()) {
      setErrorMsg('برجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    const filteredUrls = imageUrls.filter(url => url.trim() !== '');
    if (filteredUrls.length === 0) {
      setErrorMsg('يجب إضافة صورة واحدة على الأقل للألبوم.');
      return;
    }

    const finalCoverUrl = `${convertDriveUrl(coverImageUrl)}#x=${coverOffsetX}&y=${coverOffsetY}&z=${coverZoom}`;
    const convertedImageUrls = filteredUrls.map(convertDriveUrl);

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editId) {
        await api.updateMemoryAlbum(editId, {
          title,
          event_date: eventDate,
          cover_image_url: finalCoverUrl,
          image_urls: convertedImageUrls
        });
        setSuccessMsg('تم تحديث الألبوم ونشره بنجاح.');
      } else {
        await api.createMemoryAlbum({
          title,
          event_date: eventDate,
          cover_image_url: finalCoverUrl,
          image_urls: convertedImageUrls
        });
        setSuccessMsg('تم إنشاء الألبوم الجديد ونشره بنجاح.');
      }
      setIsEditing(false);
      fetchAlbums();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الألبوم في قاعدة البيانات.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف ألبوم "${name}" نهائياً؟`)) return;
    try {
      await api.deleteMemoryAlbum(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
      setSuccessMsg('تم حذف الألبوم بنجاح.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert('فشل حذف الألبوم: ' + err.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#00174a] p-6 rounded-3xl text-white shadow-xl border-b-4 border-[#fed65b]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#fed65b]">
                <Images className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-xl sm:text-2xl text-[#fed65b]">إدارة ألبومات الذاكرة</h1>
            </div>
            <p className="text-slate-350 text-xs">إدارة ألبومات الصور لصفحة "أيام في ذاكرة الكنيسة" باستخدام روابط خارجية (مثل Google Drive)</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isEditing ? (
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع للقائمة</span>
              </button>
            ) : (
              <button 
                onClick={handleOpenCreate}
                className="bg-[#fed65b] text-[#00174a] hover:bg-[#ffdf80] font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>إنشاء ألبوم جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Messaging */}
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

        {isEditing ? (
          /* Editor Layout with Real-Time Side-by-Side WYSIWYG Preview */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Left: Input Form Panel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h2 className="font-tajawal font-extrabold text-base text-[#002366] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#d4af37]" />
                  <span>{editId ? 'تعديل بيانات الألبوم' : 'إنشاء ألبوم جديد'}</span>
                </h2>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-bold">
                  تحديث حي للمعاينة
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>عنوان الألبوم التذكاري *</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: وضع حجر الأساس للكنيسة عام ١٩٣٤م"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ المناسبة / الحقبة الزمنية *</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    placeholder="مثال: ٢٥ يناير ١٩٣٤م أو عام ١٩٣٤م"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>رابط صورة الغلاف (خارجي) *</span>
                  </label>
                  <input 
                    type="url"
                    required
                    value={coverImageUrl}
                    onChange={e => setCoverImageUrl(e.target.value)}
                    placeholder="ضع رابط الصورة المباشر من Google Drive أو موقع خارجي"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all font-mono"
                  />
                </div>
                {/* Cover image offset & zoom controls */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-[#002366] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#d4af37]" />
                      <span>تظبيط موضع وتكبير الغلاف (Live Adjust)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">يمين/شمال + فوق/تحت + زووم</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>إزاحة أفقية (يمين / شمال)</span>
                        <span className="font-mono text-[#002366]">{coverOffsetX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={coverOffsetX}
                        onChange={e => setCoverOffsetX(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002366]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>إزاحة رأسية (أعلى / أسفل)</span>
                        <span className="font-mono text-[#002366]">{coverOffsetY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={coverOffsetY}
                        onChange={e => setCoverOffsetY(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002366]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>تكبير وتصغير (Zoom)</span>
                        <span className="font-mono text-[#002366]">{coverZoom}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={coverZoom}
                        onChange={e => setCoverZoom(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Drive Integration Tabs Card */}
                <div className="bg-[#fed65b]/10 border border-[#d4af37]/25 p-4 rounded-2xl space-y-4">
                  {/* Tab Header Switcher */}
                  <div className="flex bg-white/70 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPullMethod('folder')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        pullMethod === 'folder'
                          ? 'bg-[#002366] text-[#fed65b] shadow-sm'
                          : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      سحب بمجلد كامل (Folder Link)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPullMethod('links')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        pullMethod === 'links'
                          ? 'bg-[#002366] text-[#fed65b] shadow-sm'
                          : 'text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      لصق روابط متعددة (Paste Links)
                    </button>
                  </div>

                  {pullMethod === 'folder' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#002366] font-tajawal flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-[#d4af37]" />
                        <span>سحب سريع من مجلد Google Drive:</span>
                      </label>
                      <input 
                        type="url"
                        value={driveFolderUrl}
                        onChange={e => setDriveFolderUrl(e.target.value)}
                        placeholder="رابط مجلد Google Drive (مشاركة عامة)"
                        className="w-full bg-white border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                      <button
                        type="button"
                        disabled={fetchingDrive || !driveFolderUrl.trim()}
                        onClick={handleFetchDriveImages}
                        className="w-full bg-[#002366] hover:bg-[#00174a] text-[#fed65b] disabled:opacity-50 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        {fetchingDrive ? 'جاري سحب الصور من جوجل درايف...' : 'سحب الصور من مجلد الدرايف'}
                      </button>
                      <p className="text-[9px] text-[#002366]/70 leading-normal font-semibold">
                        * يرجى تفعيل Google Drive API في حسابك ليعمل الاتصال المباشر. في حال حدوث NetworkError بسبب مزودي الخدمة المحليين، استخدم خيار "لصق روابط متعددة" المجاورة للتجاوز الفوري.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#002366] font-tajawal flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-[#d4af37]" />
                        <span>إضافة مجموعة صور دفعة واحدة:</span>
                      </label>
                      <textarea 
                        rows={3}
                        value={bulkLinksText}
                        onChange={e => setBulkLinksText(e.target.value)}
                        placeholder="انسخ روابط المشاركة للصور من جوجل درايف والصقها هنا (رابط واحد في كل سطر)"
                        className="w-full bg-white border border-slate-200 focus:border-[#002366] rounded-xl px-3.5 py-2.5 text-xs outline-none resize-y font-mono"
                      />
                      <button
                        type="button"
                        disabled={!bulkLinksText.trim()}
                        onClick={handleParseBulkLinks}
                        className="w-full bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>استخراج وتحويل الروابط</span>
                      </button>
                      <p className="text-[9px] text-[#002366]/70 leading-normal font-semibold">
                        * حدد صورك في Google Drive، اضغط بالزر الأيمن واختر "مشاركة -&gt; نسخ الروابط"، ثم الصقها هنا. يعمل محلياً بالكامل.
                      </p>
                    </div>
                  )}
                </div>

                {/* External Images Array List */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#002366] flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-[#d4af37]" />
                      <span>روابط صور المعرض الحالية ({imageUrls.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddImageUrlInput}
                      className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة رابط يدوي</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 w-5 text-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="url"
                          required
                          value={url}
                          placeholder={`رابط الصورة رقم ${index + 1}`}
                          onChange={e => handleImageUrlChange(index, e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs outline-none font-mono"
                        />
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrlInput(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                            title="حذف الرابط"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save and Publish Action button */}
                <div className="pt-5 border-t border-slate-100 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-grow bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'جاري الحفظ والنشر...' : 'حفظ ونشر الألبوم (Publish)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-white border border-slate-200 text-slate-600 font-bold px-5 py-3 rounded-xl hover:bg-slate-50 text-xs sm:text-sm"
                  >
                    إلغاء التعديل
                  </button>
                </div>
              </form>
            </div>

            {/* Right: WYSIWYG Live Preview Panel */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 shadow-inner space-y-6 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-[#d4af37]" />
                    <span>المعاينة الحية والمرئية (WYSIWYG Live Preview)</span>
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">
                  هذا النموذج يعكس تماماً شكل الألبوم في موقع كنيسة العذراء بمحرم بك فور كتابته وقبل الحفظ.
                </p>

                {/* 1. Card Grid Preview */}
                <div className="space-y-3 mt-6">
                  <h4 className="font-tajawal font-extrabold text-xs text-[#d4af37] border-r-2 border-[#d4af37] pr-2">
                    أولاً: بطاقة الألبوم في القائمة الرئيسة
                  </h4>
                  
                  <div className="max-w-xs mx-auto">
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                        <img 
                          src={convertDriveUrl(coverImageUrl) || 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800'} 
                          alt="Cover Preview" 
                          className="w-full h-full object-cover transition-transform duration-300" 
                          style={{ objectPosition: `${coverOffsetX}% ${coverOffsetY}%`, transform: `scale(${coverZoom})` }} 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-[#00174a]/85 border border-[#d4af37]/40 text-[#fed65b] text-[9px] font-bold px-2 py-0.5 rounded-md">
                          {eventDate || 'التاريخ'}
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-right">
                        <h4 className="font-tajawal font-extrabold text-sm text-[#002366] line-clamp-1">
                          {title || 'عنوان الألبوم التذكاري'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold">يحتوي على ({imageUrls.filter(u => u.trim() !== '').length}) صورة تذكارية</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Gallery Grid Preview */}
                <div className="space-y-3 mt-8">
                  <h4 className="font-tajawal font-extrabold text-xs text-[#d4af37] border-r-2 border-[#d4af37] pr-2">
                    ثانياً: شبكة الصور داخل الألبوم عند فتحه
                  </h4>
                  
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between text-right">
                      <div>
                        <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">{title || 'عنوان الألبوم'}</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{eventDate}</p>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        معرض الصور
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {imageUrls.filter(u => u.trim() !== '').map((url, idx) => (
                        <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 relative group">
                          <img 
                            src={convertDriveUrl(url)} 
                            alt={`Preview ${idx}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#002366]/5 border border-[#002366]/10 p-4 rounded-2xl text-[11px] text-slate-500 font-semibold leading-relaxed mt-6">
                💡 **ملاحظة للمشرف**: تأكد من أن روابط الصور المرفوعة تنتهي بامتداد مباشر أو أنها روابط Google Drive مفرزة ومعدّة للمشاركة العامة لضمان تحميلها للشعب بدون قيود.
              </div>
            </div>

          </div>
        ) : (
          /* Albums List Grid view */
          <>
            {loading ? (
              <div className="py-20 text-center text-slate-450 font-bold space-y-3">
                <RefreshCw className="w-8 h-8 text-[#002366] animate-spin mx-auto" />
                <p>جاري تحميل ألبومات الصور...</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="bg-white p-16 rounded-3xl border border-dashed border-[#c5c6d2] text-center text-slate-400 font-bold">
                <Images className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>لا يوجد ألبومات صور مسجلة حالياً. قم بإنشاء أول ألبوم الآن!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map(album => {
                  const { convertedUrl, styles } = parseImageTransform(album.cover_image_url);
                  return (
                    <div 
                      key={album.id} 
                      className="bg-white rounded-3xl border border-slate-250/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                    >
                      <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                        <img 
                          src={convertedUrl} 
                          alt={album.title} 
                          className="w-full h-full object-cover transition-transform duration-300"
                          style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-[#00174a]/90 text-[#fed65b] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#d4af37]/30">
                          {album.event_date}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between text-right">
                        <div className="space-y-1 mb-4">
                          <h3 className="font-tajawal font-extrabold text-sm text-[#002366] leading-snug line-clamp-2">
                            {album.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold">
                            يحتوي على ({album.image_urls?.length || 0}) صورة
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                          <button 
                            onClick={() => handleOpenEdit(album)}
                            className="px-3 py-1.5 rounded-xl border border-[#002366]/20 bg-[#002366]/5 hover:bg-[#002366]/10 text-[#002366] font-bold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل الألبوم</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteAlbum(album.id, album.title)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all"
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
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

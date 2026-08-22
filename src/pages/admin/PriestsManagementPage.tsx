import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type Priest, convertDriveUrl, parseImageTransform } from '../../lib/api';
import { 
  Users, Plus, Trash2, Edit2, X, CheckCircle2, AlertCircle, Eye, 
  Save, Shield, Award, Heart, Cross, ArrowLeft, RefreshCw, MoveUp, MoveDown, 
  Sliders, Crop, Move, ZoomIn, ZoomOut, RotateCcw, ArrowUp, ArrowDown, ArrowRight,
  Maximize2
} from 'lucide-react';

export const PriestsManagementPage: React.FC = () => {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageOffsetX, setImageOffsetX] = useState('50');
  const [imageOffsetY, setImageOffsetY] = useState('50');
  const [imageZoom, setImageZoom] = useState('1');
  const [cropAspect, setCropAspect] = useState<'portrait' | 'square' | 'circle'>('portrait');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [status, setStatus] = useState<'active' | 'reposed' | 'martyr'>('active');
  const [ordainedDate, setOrdainedDate] = useState('');
  const [reposedDate, setReposedDate] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetchPriests();
  }, []);

  const fetchPriests = async () => {
    setLoading(true);
    try {
      const data = await api.getPriests();
      setPriests(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('فشل تحميل قائمة الآباء الكهنة.');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startX: parseFloat(imageOffsetX) || 50,
      startY: parseFloat(imageOffsetY) || 50,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Sensitivity factor
    const sensitivity = 0.25;
    const newX = Math.max(0, Math.min(100, Math.round(dragStart.startX - deltaX * sensitivity)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStart.startY - deltaY * sensitivity)));
    
    setImageOffsetX(newX.toString());
    setImageOffsetY(newY.toString());
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const currentZoom = parseFloat(imageZoom) || 1;
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newZoom = Math.max(0.5, Math.min(3, Math.round((currentZoom + delta) * 100) / 100));
    setImageZoom(newZoom.toString());
  };

  const handleShiftStep = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    if (direction === 'up') setImageOffsetY(prev => Math.max(0, parseFloat(prev) - step).toString());
    if (direction === 'down') setImageOffsetY(prev => Math.min(100, parseFloat(prev) + step).toString());
    if (direction === 'left') setImageOffsetX(prev => Math.max(0, parseFloat(prev) - step).toString());
    if (direction === 'right') setImageOffsetX(prev => Math.min(100, parseFloat(prev) + step).toString());
  };

  const handleZoomStep = (delta: number) => {
    const current = parseFloat(imageZoom) || 1;
    const next = Math.max(0.5, Math.min(3, Math.round((current + delta) * 10) / 10));
    setImageZoom(next.toString());
  };

  const handleResetCrop = () => {
    setImageOffsetX('50');
    setImageOffsetY('50');
    setImageZoom('1');
  };

  const handleOpenModal = (priest?: Priest) => {
    if (priest) {
      const { rawUrl, offsetX, offsetY, zoom } = parseImageTransform(priest.image_url);
      setEditId(priest.id);
      setName(priest.name);
      setTitle(priest.title || '');
      setImageUrl(rawUrl);
      setImageOffsetX(offsetX);
      setImageOffsetY(offsetY);
      setImageZoom(zoom);
      setStatus(priest.status);
      setOrdainedDate(priest.ordained_date || '');
      setReposedDate(priest.reposed_date || '');
      setBio(priest.bio || '');
    } else {
      setEditId(null);
      setName('');
      setTitle('');
      setImageUrl('');
      setImageOffsetX('50');
      setImageOffsetY('50');
      setImageZoom('1');
      setStatus('active');
      setOrdainedDate('');
      setReposedDate('');
      setBio('');
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('الرجاء إدخال اسم الأب الكاهن.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const finalImageUrl = imageUrl.trim() 
        ? `${convertDriveUrl(imageUrl)}#x=${imageOffsetX}&y=${imageOffsetY}&z=${imageZoom}`
        : null;

      const payload = {
        name,
        title: title || null,
        image_url: finalImageUrl,
        status,
        ordained_date: ordainedDate || null,
        reposed_date: reposedDate || null,
        bio: bio || null,
        sort_order: editId ? (priests.find(p => p.id === editId)?.sort_order || 0) : priests.length
      };

      if (editId) {
        await api.updatePriest(editId, payload);
        setSuccessMsg('تم تحديث بيانات الأب الكاهن بنجاح.');
      } else {
        await api.createPriest(payload);
        setSuccessMsg('تم إضافة الأب الكاهن بنجاح.');
      }
      setShowModal(false);
      fetchPriests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الأب الكاهن "${name}" نهائياً؟`)) return;
    try {
      await api.deletePriest(id);
      setPriests(prev => prev.filter(p => p.id !== id));
      setSuccessMsg('تم الحذف بنجاح.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === priests.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...priests];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Instantly update UI
    setPriests(updated);

    // Save to database
    try {
      await Promise.all(
        updated.map((priest, idx) => 
          api.updatePriest(priest.id, { sort_order: idx })
        )
      );
    } catch (err) {
      console.error('Error saving priests sort order:', err);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo">
        
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#00174a] p-6 rounded-3xl text-white shadow-xl border-b-4 border-[#fed65b]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#fed65b]">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="font-tajawal font-bold text-xl sm:text-2xl text-[#fed65b]">إدارة الآباء الكهنة</h1>
            </div>
            <p className="text-slate-350 text-xs">إضافة وتعديل وحذف بيانات وصور مجمع الآباء الكهنة (الحاليين والراحلين والشهداء)</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#fed65b] text-[#00174a] hover:bg-[#ffdf80] font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>كاهن جديد</span>
          </button>
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

        {/* Priests Grid & Reorder List */}
        {loading ? (
          <div className="py-20 text-center text-slate-450 font-bold space-y-3">
            <RefreshCw className="w-8 h-8 text-[#002366] animate-spin mx-auto" />
            <p>جاري تحميل قائمة الآباء الكهنة...</p>
          </div>
        ) : priests.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-[#c5c6d2] text-center text-slate-400 font-bold">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>لا يوجد كهنة مسجلين حالياً. اضغط "كاهن جديد" للبدء.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priests.map((priest, idx) => {
              const { convertedUrl, styles } = parseImageTransform(priest.image_url);
              return (
                <div 
                  key={priest.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-4 items-start text-right">
                    {/* Photo or status indicator */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 relative flex items-center justify-center">
                      {convertedUrl ? (
                        <img 
                          src={convertedUrl} 
                          alt={priest.name} 
                          className="w-full h-full object-cover transition-transform duration-300"
                          style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                          referrerPolicy="no-referrer"
                        />
                      ) : priest.status === 'martyr' ? (
                        <div className="w-full h-full bg-rose-50 text-rose-650 flex flex-col items-center justify-center relative">
                          <Shield className="w-6 h-6" />
                          <Cross className="w-3 h-3 text-[#d4af37] absolute top-[44%]" />
                        </div>
                      ) : priest.status === 'reposed' ? (
                        <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Cross className="w-7 h-7" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-[#002366]/5 text-[#002366] flex items-center justify-center">
                          <Award className="w-8 h-8" />
                        </div>
                      )}
                      
                      <span className={`absolute bottom-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded shadow ${
                        priest.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        priest.status === 'martyr' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-200 text-slate-800'
                      }`}>
                        {priest.status === 'active' ? 'حالي' :
                         priest.status === 'martyr' ? 'شهيد' : 'راحل'}
                      </span>
                    </div>

                    {/* Priest details */}
                    <div className="space-y-1">
                      <h3 className="font-tajawal font-bold text-sm text-[#002366]">{priest.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold leading-normal">{priest.title || 'كاهن كنيسة السيدة العذراء'}</p>
                      {priest.ordained_date && (
                        <p className="text-[9px] text-[#d4af37] font-bold">الرسامة: {priest.ordained_date}</p>
                      )}
                      {priest.reposed_date && (
                        <p className="text-[9px] text-rose-600 font-bold">النياحة: {priest.reposed_date}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio text snippet */}
                  {priest.bio && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-4 text-right bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {priest.bio}
                    </p>
                  )}

                  {/* Actions and Sorting */}
                  <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 disabled:opacity-40"
                        title="نقل لأعلى"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === priests.length - 1}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 disabled:opacity-40"
                        title="نقل لأسفل"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(priest)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#002366]/20 bg-[#002366]/5 hover:bg-[#002366]/10 text-[#002366] font-bold text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(priest.id, priest.name)}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1"
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

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden mt-10 mb-10">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#00174a] text-white">
                <h2 className="font-tajawal font-bold text-sm flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#fed65b]" />
                  {editId ? 'تعديل بيانات الأب الكاهن' : 'إضافة أب كاهن جديد'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-full transition-colors hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700 text-right">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اسم الأب الكاهن *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="مثال: القمص / يوسف مجلى"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الرتبة والخدمة (اللقب)</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: أول كاهن رُسم على مذبح الكنيسة"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">حالة الخدمة</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all"
                    >
                      <option value="active">حالي (يخدم بالكنيسة)</option>
                      <option value="reposed">راحل (تنيح في الرب)</option>
                      <option value="martyr">شهيد (نال إكليل الشهادة)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رابط الصورة (أو Drive)</label>
                    <input 
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="رابط مباشر أو Google Drive"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Interactive Visual Cropper & Framing Studio */}
                {imageUrl.trim() && (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-4 shadow-inner">
                    {/* Cropper Header & Aspect Ratio Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-[#002366] flex items-center gap-1.5 font-tajawal">
                        <Crop className="w-4 h-4 text-[#d4af37]" />
                        <span>استوديو قص وتأطير صورة الكاهن (Crop & Framing)</span>
                      </span>

                      {/* Framing Ratio Presets */}
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => setCropAspect('portrait')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            cropAspect === 'portrait' ? 'bg-[#002366] text-[#fed65b] shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          بورتريه (٣:٤)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropAspect('square')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            cropAspect === 'square' ? 'bg-[#002366] text-[#fed65b] shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          مربع (١:١)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropAspect('circle')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            cropAspect === 'circle' ? 'bg-[#002366] text-[#fed65b] shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          دائري
                        </button>
                      </div>
                    </div>

                    {/* Interactive Drag & Drop Viewport & Controls */}
                    <div className="flex flex-col md:flex-row items-center gap-5">
                      
                      {/* Visual Crop Box with Mouse Drag & Wheel Support */}
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onWheel={handleWheel}
                          className={`relative overflow-hidden border-2 border-[#d4af37] bg-slate-900 shadow-md select-none transition-all ${
                            cropAspect === 'portrait' ? 'w-32 h-44 rounded-2xl' :
                            cropAspect === 'circle' ? 'w-36 h-36 rounded-full' :
                            'w-36 h-36 rounded-2xl'
                          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                          title="انقر واسحب بالفأرة للتحريك في أي اتجاه، أو استخدم بكرة الفأرة للتكبير والتصغير"
                        >
                          {/* Image under crop */}
                          <img 
                            src={convertDriveUrl(imageUrl)} 
                            alt="Crop Preview" 
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                            style={{ 
                              objectPosition: `${imageOffsetX}% ${imageOffsetY}%`, 
                              transform: `scale(${imageZoom})` 
                            }}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                            }}
                          />

                          {/* Rule-of-thirds Grid Overlay */}
                          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                            <div className="border-r border-b border-white/60" />
                            <div className="border-r border-b border-white/60" />
                            <div className="border-b border-white/60" />
                            <div className="border-r border-b border-white/60" />
                            <div className="border-r border-b border-white/60" />
                            <div className="border-b border-white/60" />
                            <div className="border-r border-white/60" />
                            <div className="border-r border-white/60" />
                            <div />
                          </div>

                          {/* Live dragging badge */}
                          {isDragging && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                              <Move className="w-6 h-6 text-[#fed65b] animate-pulse" />
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                          <Move className="w-3 h-3 text-[#d4af37]" />
                          <span>اسحب بالفأرة للتحريك • بالبكرة للزووم</span>
                        </span>
                      </div>

                      {/* Directional Pad, Zoom & Precision Sliders */}
                      <div className="flex-1 w-full space-y-3">
                        
                        {/* Directional Quick Action Pad */}
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500">تحريك سريع:</span>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleShiftStep('up')}
                              className="p-1.5 bg-slate-100 hover:bg-[#002366] hover:text-white rounded-lg transition-colors"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftStep('down')}
                              className="p-1.5 bg-slate-100 hover:bg-[#002366] hover:text-white rounded-lg transition-colors"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftStep('right')}
                              className="p-1.5 bg-slate-100 hover:bg-[#002366] hover:text-white rounded-lg transition-colors"
                              title="تحريك لليمين"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftStep('left')}
                              className="p-1.5 bg-slate-100 hover:bg-[#002366] hover:text-white rounded-lg transition-colors"
                              title="تحريك لليسار"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            <div className="h-4 w-px bg-slate-200 mx-1" />

                            <button
                              type="button"
                              onClick={() => handleZoomStep(0.1)}
                              className="p-1.5 bg-slate-100 hover:bg-[#d4af37] hover:text-[#00174a] rounded-lg transition-colors"
                              title="تكبير (+)"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoomStep(-0.1)}
                              className="p-1.5 bg-slate-100 hover:bg-[#d4af37] hover:text-[#00174a] rounded-lg transition-colors"
                              title="تصغير (-)"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleResetCrop}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                              title="إعادة ضبط الموضع والزووم"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Precision Sliders */}
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>إزاحة أفقية (يمين ↔ شمال - X)</span>
                              <span className="font-mono text-[#002366]">{imageOffsetX}%</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={imageOffsetX}
                              onChange={e => setImageOffsetX(e.target.value)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002366]"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>إزاحة رأسية (أعلى ↕ أسفل - Y)</span>
                              <span className="font-mono text-[#002366]">{imageOffsetY}%</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={imageOffsetY}
                              onChange={e => setImageOffsetY(e.target.value)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002366]"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>تكبير وتصغير (Zoom)</span>
                              <span className="font-mono text-[#002366]">{imageZoom}x</span>
                            </div>
                            <input 
                              type="range"
                              min="0.5"
                              max="3"
                              step="0.05"
                              value={imageZoom}
                              onChange={e => setImageZoom(e.target.value)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">تاريخ الرسامة</label>
                    <input 
                      type="text"
                      value={ordainedDate}
                      onChange={e => setOrdainedDate(e.target.value)}
                      placeholder="مثال: ١٦ يونيو ١٩٩٥م"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">تاريخ النياحة / الشهادة</label>
                    <input 
                      type="text"
                      value={reposedDate}
                      onChange={e => setReposedDate(e.target.value)}
                      placeholder="مثال: ٧ أبريل ٢٠٢٢م"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">السيرة الذاتية ونبذة عن حياته</label>
                  <textarea 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="اكتب تفاصيل سيرة الأب الكاهن ونبذة عن خدمته..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2 text-xs outline-none h-24 resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-grow bg-[#00174a] text-[#fed65b] font-bold py-2.5 rounded-xl hover:bg-[#002366] transition-all shadow-md text-xs flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'جاري الحفظ...' : 'حفظ ونشر التغييرات'}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="bg-white border border-slate-200 text-slate-650 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-xs"
                  >
                    إلغاء
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

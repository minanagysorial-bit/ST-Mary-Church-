import React, { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  MessageCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Home, 
  FileText, 
  Sparkles,
  Send,
  MapPin
} from 'lucide-react';
import type { Family, FamilyMember } from '../../lib/database.types';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';

interface FamilyQuickMapModalProps {
  family: Family | null;
  isOpen: boolean;
  onClose: () => void;
  onVisitationLogged?: (familyId: string, visitDate: string) => void;
  onStartEditLocation?: (family: Family) => void;
}

export const FamilyQuickMapModal: React.FC<FamilyQuickMapModalProps> = ({
  family,
  isOpen,
  onClose,
  onVisitationLogged,
  onStartEditLocation
}) => {
  const { profile } = useAuth();
  const toast = useToast();
  const [showLogForm, setShowLogForm] = useState(false);
  const [visitType, setVisitType] = useState<'منزلية' | 'تليفونية' | 'كنسية'>('منزلية');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Kids / Makhdoumeen state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  useEffect(() => {
    if (!family || !isOpen) return;
    const fetchKids = async () => {
      setLoadingMembers(true);
      try {
        const kids = await api.getFamilyMembers(family.id);
        setFamilyMembers(kids);
        if (kids.length > 0) {
          setSelectedMemberId(kids[0].id);
        } else {
          setSelectedMemberId('');
        }
      } catch (err) {
        console.warn('Failed to load family members for map modal:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchKids();
  }, [family, isOpen]);

  if (!isOpen || !family) return null;

  // Calculate days since last visit
  let daysSince = 999;
  let statusText = 'لم تُفتقد من قبل (عاجل)';
  let statusColor = 'bg-rose-50 text-rose-800 border-rose-200';

  if (family.last_visit_date) {
    const diff = Math.floor((Date.now() - new Date(family.last_visit_date).getTime()) / (1000 * 60 * 60 * 24));
    daysSince = diff;
    if (diff <= 30) {
      statusText = `تم الافتقاد منذ ${diff} يوم ✅`;
      statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (diff <= 60) {
      statusText = `مر ${diff} يوم (تحتاج متابعة) 🟡`;
      statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
    } else {
      statusText = `متأخرة منذ ${diff} يوم (عاجل) 🔴`;
      statusColor = 'bg-rose-50 text-rose-800 border-rose-200';
    }
  }

  const handleSaveVisitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    try {
      let targetMemberId = selectedMemberId;

      // If no member exists yet in this family, create one automatically to satisfy foreign key constraint
      if (!targetMemberId) {
        try {
          const autoMember = await api.createFamilyMember({
            family_id: family.id,
            full_name: family.head_name || 'مخدوم الأسرة',
            age: 10,
            sunday_school_stage: (family as any).stage || family.area || 'ابتدائي',
            phone: family.phone || '',
            phone_2: '',
            birth_date: '',
            address: family.address || '',
            notes: 'تم إنشاؤه تلقائياً لتوثيق سجل الافتقاد'
          });
          targetMemberId = autoMember.id;
        } catch (mErr: any) {
          console.warn('Could not auto-create member:', mErr);
        }
      }

      if (!targetMemberId) {
        throw new Error('يرجى اختيار المخدوم المفتقد أو التأكد من إضافة أفراد للأسرة');
      }

      // 1. Create log with valid family_member ID
      const chosenMember = familyMembers.find(m => m.id === targetMemberId);
      const memberDisplayName = chosenMember ? chosenMember.full_name : family.head_name;

      await api.createVisitationLog({
        servant_id: profile.id,
        member_id: targetMemberId,
        group_id: null,
        visit_date: visitDate,
        visit_type: visitType,
        notes: `افتقاد للمخدوم: ${memberDisplayName} (أسرة ${family.head_name}) — ${notes}`
      });

      // 2. Update family last_visit_date
      await api.updateFamily(family.id, {
        last_visit_date: visitDate
      });

      toast.success(`تم تسجيل تقرير افتقاد ${memberDisplayName} بنجاح ✝️✨`);
      if (onVisitationLogged) {
        onVisitationLogged(family.id, visitDate);
      }
      setShowLogForm(false);
      onClose();
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const cleanPhone = family.phone ? family.phone.replace(/[^0-9+]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone}`
    : null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-cairo" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-fade-in text-right">
        
        {/* Header */}
        <div className="bg-[#00174a] text-white p-5 flex items-center justify-between border-b-2 border-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 flex items-center justify-center text-[#fed65b] border border-[#d4af37]/40">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#fed65b] uppercase">بيانات أسرة المخدوم</span>
              <h2 className="text-base font-extrabold text-white leading-tight">أسرة أ/ {family.head_name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Status Badge */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${statusColor}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{statusText}</span>
            </div>
            {family.last_visit_date && (
              <span className="text-[10px] opacity-75 font-mono">{family.last_visit_date}</span>
            )}
          </div>

          {/* Details Grid */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-100 text-xs">
            {family.address && (
              <div className="flex items-start gap-2 text-slate-700">
                <Home className="w-4 h-4 text-[#002366] shrink-0 mt-0.5" />
                <span className="font-semibold">{family.address}</span>
              </div>
            )}
            {family.phone && (
              <div className="flex items-center gap-2 text-slate-700 font-mono">
                <Phone className="w-4 h-4 text-[#002366] shrink-0" />
                <span className="font-bold">{family.phone}</span>
              </div>
            )}
            {family.notes && (
              <div className="flex items-start gap-2 text-slate-600 border-t border-slate-200/60 pt-2 text-[11px]">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{family.notes.replace(/\[GEO:[-\d.]+,[-\d.]+\]/g, '').trim()}</span>
              </div>
            )}
          </div>

          {/* Edit Location on Map Button */}
          {onStartEditLocation && (
            <button
              type="button"
              onClick={() => {
                onStartEditLocation(family);
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 text-amber-900 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              <MapPin className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>تعديل وضبط موقع المنزل على الخريطة 📍</span>
            </button>
          )}

          {/* Kids / Makhdoumeen List */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#002366] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>أبناء ومخدومي الأسرة ({familyMembers.length})</span>
              </span>
            </div>

            {loadingMembers ? (
              <div className="py-2 text-center text-slate-400 text-xs font-bold">جاري تحميل بيانات المخدومين...</div>
            ) : familyMembers.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 text-center font-bold">
                لا يوجد أبناء مسجلين بالأسرة حتى الآن
              </div>
            ) : (
              <div className="space-y-2">
                {familyMembers.map(m => {
                  const kidPhone = m.phone ? m.phone.replace(/[^0-9+]/g, '') : '';
                  const kidWa = kidPhone ? `https://wa.me/${kidPhone.startsWith('0') ? '2' + kidPhone : kidPhone}` : null;
                  return (
                    <div key={m.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs transition-colors">
                      <div>
                        <p className="font-extrabold text-slate-800">{m.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {m.sunday_school_stage || 'مخدوم'} {m.age ? `• ${m.age} سنة` : ''}
                          {m.address ? ` • 📍 ${m.address}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {kidPhone && (
                          <a href={`tel:${kidPhone}`} className="p-1.5 bg-[#002366] text-white rounded-lg hover:bg-black transition-colors" title="اتصال">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {kidWa && (
                          <a href={kidWa} target="_blank" rel="noreferrer" className="p-1.5 bg-[#25D366] text-white rounded-lg hover:bg-[#1faa4e] transition-colors" title="واتساب">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {cleanPhone ? (
              <a
                href={`tel:${cleanPhone}`}
                className="bg-[#002366] hover:bg-[#00174a] text-white font-extrabold text-xs py-3 px-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone className="w-4 h-4 text-[#fed65b]" />
                <span>اتصال هاتفياً</span>
              </a>
            ) : (
              <button disabled className="bg-slate-100 text-slate-400 font-bold text-xs py-3 px-3 rounded-2xl cursor-not-allowed">
                لا يوجد هاتف
              </button>
            )}

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs py-3 px-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب</span>
              </a>
            ) : (
              <button disabled className="bg-slate-100 text-slate-400 font-bold text-xs py-3 px-3 rounded-2xl cursor-not-allowed">
                لا يوجد واتساب
              </button>
            )}
          </div>

          {/* Quick Log Visitation Toggle */}
          {!showLogForm ? (
            <button
              onClick={() => setShowLogForm(true)}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-extrabold text-xs py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تسجيل افتقاد جديد للأسرة ✍️</span>
            </button>
          ) : (
            <form onSubmit={handleSaveVisitation} className="bg-slate-50 border border-[#d4af37]/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-extrabold text-[#002366]">تقرير الافتقاد السريع</span>
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  إلغاء
                </button>
              </div>

              {/* Select Member to visit */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">اختر المخدوم المفتقد: *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                >
                  {familyMembers.length > 0 ? (
                    familyMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.sunday_school_stage || 'مخدوم'})
                      </option>
                    ))
                  ) : (
                    <option value="">{family.head_name} (تسجيل باسم عائل الأسرة)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">نوع الزيارة:</label>
                  <select
                    value={visitType}
                    onChange={(e: any) => setVisitType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  >
                    <option value="منزلية">منزلية 🏠</option>
                    <option value="تليفونية">تليفونية 📞</option>
                    <option value="كنسية">في الكنيسة ⛪</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">تاريخ الزيارة:</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">ملاحظات وطلبات الأسرة:</label>
                <textarea
                  rows={2}
                  placeholder="اكتب ملاحظات الزيارة أو طلبات الصلاة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#002366]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#002366] hover:bg-[#00174a] text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-[#fed65b]" />
                )}
                <span>حفظ الافتقاد وتحديث التاريخ</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

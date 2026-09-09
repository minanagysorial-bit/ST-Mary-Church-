import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  User,
  Home,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  Send,
  HelpCircle,
  Building
} from 'lucide-react';
import { api } from '../../lib/api';

interface VisitationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitationRequestModal: React.FC<VisitationRequestModalProps> = ({ isOpen, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [reason, setReason] = useState('افتقاد دوري للأسرة 🏠');
  const [preferredTime, setPreferredTime] = useState('مساءً (5 م - 9 م) 🌙');
  const [notes, setNotes] = useState('');

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Convert Arabic/Eastern numbers to English digits
  const normalizeDigits = (val: string) => {
    return val
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/\s+/g, '')
      .replace(/[-+]/g, '');
  };

  const cleanPhone = normalizeDigits(phone);
  // Egyptian Mobile number validation: exactly 11 digits starting with 010, 011, 012, or 015
  const isPhoneValid = /^01[0125][0-9]{8}$/.test(cleanPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage('يرجى إدخال الاسم ثلاثي على الأقل.');
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage('يرجى إدخال رقم تليفون محمول صحيح مكون من 11 رقم يبدأ بـ (010 أو 011 أو 012 أو 015).');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage('يرجى كتابة العنوان بالتفصيل (اسم الشارع، رقم العمارة، الشقة، الدور).');
      return;
    }

    if (!landmark.trim()) {
      setErrorMessage('يرجى كتابة علامة مميزة بجوار العنوان لتسهيل الوصول للمنزل.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitVisitationRequest({
        name: fullName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        landmark: landmark.trim(),
        reason,
        preferredTime,
        notes: notes.trim()
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء إرسال طلب الافتقاد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAddress('');
    setLandmark('');
    setReason('افتقاد دوري للأسرة 🏠');
    setPreferredTime('مساءً (5 م - 9 م) 🌙');
    setNotes('');
    setPhoneTouched(false);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00113a]/75 backdrop-blur-sm p-4 animate-fade-in font-cairo overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border-2 border-[#d4af37]/50 my-auto animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00174a] text-white p-5 sm:p-6 flex items-center justify-between border-b-2 border-[#d4af37]/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#00174a] flex items-center justify-center border border-[#d4af37]/50">
                <Home className="w-6 h-6 text-[#fed65b]" />
              </div>
            </div>
            <div>
              <h3 className="font-tajawal font-black text-lg sm:text-xl text-[#fed65b]">
                طلب افتقاد كنسي وزيارة راعي
              </h3>
              <p className="text-xs text-slate-200 font-semibold mt-0.5">
                كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="py-10 text-center space-y-4 animate-tab-transition">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 text-emerald-500" viewBox="0 0 52 52">
                  <circle className="text-emerald-100" strokeWidth="3" stroke="currentColor" fill="none" cx="26" cy="26" r="23" />
                  <path className="animate-checkmark-draw text-emerald-600" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" fill="none" d="M14 27l8 8 16-16" />
                </svg>
              </div>
              <h4 className="font-tajawal font-black text-2xl text-[#00174a]">تم تسجيل طلب الافتقاد بنجاح! 🕊️</h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
                "أَنَا هُوَ الرَّاعِي الصَّالِحُ".. تم رفع طلب الافتقاد إلى الآباء الكهنة وخدام الافتقاد بالكنيسة، وسيتم التواصل معكم لترتيب الزيارة في أقرب وقت.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm font-black flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#d4af37]" />
                  <span>الاسم بالكامل (ثلاثي أو رباعي) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف ميخائيل بطرس"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all"
                />
              </div>

              {/* 2. Phone Number with Live Egyptian Validation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#d4af37]" />
                    <span>رقم التليفون المحمول (11 رقم) *</span>
                  </label>
                  {phoneTouched && (
                    <span className={`text-[11px] font-black ${isPhoneValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPhoneValid ? '✓ رقم صحيح' : '⚠️ رقم غير صحيح (مطلوب 11 رقم)'}
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!phoneTouched) setPhoneTouched(true);
                  }}
                  className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-black text-slate-900 outline-none transition-all text-right ${
                    phoneTouched && !isPhoneValid
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600'
                      : phoneTouched && isPhoneValid
                      ? 'border-emerald-400 bg-emerald-50/30 focus:border-emerald-600'
                      : 'border-slate-200 focus:border-[#002366] focus:bg-white'
                  }`}
                />
                <p className="text-[11px] text-slate-500 font-semibold">
                  يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015 لتسهيل اتصال الأب الكاهن والخادم.
                </p>
              </div>

              {/* 3. Detailed Address */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#d4af37]" />
                  <span>العنوان بالتفصيل (الشارع، العمارة، الشقة، الدور) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محرم بك - شارع الرصافة - عمارة 15 - الدور الثالث - شقة 7"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all"
                />
              </div>

              {/* 4. Landmark */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#d4af37]" />
                  <span>علامة مميزة للعنوان *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بجوار صيدلية الدكتور مينا / أمام مدرسة الأقباط"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all"
                />
              </div>

              {/* 5. Reason for Visitation Presets */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block">
                  سبب أو نوع الافتقاد:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'افتقاد دوري للأسرة 🏠',
                    'مريض ويحتاج صلاة وقنديل 🌿',
                    'بركة منزل جديد ✝️',
                    'تعزية ومساندة 🕊️',
                    'جلسة إرشاد واعتراف 📖',
                    'طلب خاص / أخرى'
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setReason(item)}
                      className={`p-2.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer text-center ${
                        reason === item
                          ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Preferred Time */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d4af37]" />
                  <span>الموعد المفضل للزيارة:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    'صباحاً (10 ص - 1 م) ☀️',
                    'مساءً (5 م - 9 م) 🌙',
                    'أي وقت مناسب لقدس أبونا 🕊️'
                  ].map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setPreferredTime(timeOption)}
                      className={`p-2.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer text-center ${
                        preferredTime === timeOption
                          ? 'bg-[#002366] text-[#fed65b] border-[#d4af37] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Extra Notes */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block">
                  ملاحظات إضافية لقدس الأب الكاهن (اختياري):
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل أخرى أو توضيحات خاصة بالزيارة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#002366] focus:bg-white transition-all"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 border border-amber-400"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال طلب الافتقاد الآن 🕊️'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

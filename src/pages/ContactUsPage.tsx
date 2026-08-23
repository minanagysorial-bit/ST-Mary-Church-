import React, { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { Phone, MapPin, Send, MessageSquare, HeartHandshake, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { validateEgyptianPhone, validateFullName } from '../lib/validation';

export const ContactUsPage: React.FC = () => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Errors state
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; message?: string }>({});

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 11);
    setPhone(cleaned);

    if (cleaned.length === 11) {
      const res = validateEgyptianPhone(cleaned);
      if (res.isValid) {
        setFieldErrors(prev => {
          const { phone: _, ...rest } = prev;
          return rest;
        });
      } else {
        setFieldErrors(prev => ({ ...prev, phone: res.error || 'رقم الهاتف غير صحيح.' }));
      }
    } else if (cleaned.length > 0 && cleaned.length < 11) {
      setFieldErrors(prev => ({ ...prev, phone: `يجب إدخال 11 رقماً (المتبقي ${11 - cleaned.length} أرقام)` }));
    } else {
      setFieldErrors(prev => {
        const { phone: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors(prev => {
        const { name: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; phone?: string; message?: string } = {};

    // 1. Name validation
    const nameRes = validateFullName(name);
    if (!nameRes.isValid) {
      errors.name = nameRes.error;
    }

    // 2. Phone validation
    const phoneRes = validateEgyptianPhone(phone);
    if (!phoneRes.isValid) {
      errors.phone = phoneRes.error;
    }

    // 3. Message validation
    if (!message.trim()) {
      errors.message = 'يرجى كتابة نص الرسالة أو الاستفسار.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(errors.phone || errors.name || 'يرجى تصحيح الأخطاء قبل إرسال الرسالة.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitContactMessage(name.trim(), phone.trim(), message.trim());
      toast.showToast('تم إرسال رسالتك بنجاح! سيتواصل معك أحد الآباء أو الخدام قريباً.', 'success');
      setName('');
      setPhone('');
      setMessage('');
      setFieldErrors({});
    } catch (err: any) {
      console.error('Failed to submit contact message:', err);
      toast.error('حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-12 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>تواصل معنا - كنيسة السيدة العذراء مريم بمحرم بك | الأقباط الأرثوذكس</title>
        <meta name="description" content="اتصل بكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. أرقام التليفونات، الموقع الجغرافي، ونموذج إرسال طلبات الصلاة والافتقاد." />
        <meta name="keywords" content="تليفون كنيسة محرم بك, عنوان كنيسة محرم بك, تواصل معنا العذراء مريم" />
        <link rel="canonical" href="https://www.tibarthenos.com/contact-us" />
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-[#002366]/5 text-[#002366] rounded-full border border-[#002366]/10 shadow-md">
            <HeartHandshake className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="font-tajawal text-3xl sm:text-4xl font-extrabold text-[#00174a]">
            تواصل معنا
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            نسعد دائماً باستقبال رسائلكم، استفساراتكم، وطلباتكم وسيقوم المسؤولون بالتواصل معكم في أقرب وقت.
          </p>
          <div className="w-16 h-0.5 bg-[#d4af37] mx-auto rounded-full" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Info Card Panel (5 Cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#00113a] to-[#002366] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden border border-[#d4af37]/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent)] pointer-events-none" />
            
            <div className="space-y-6 relative z-10 text-right">
              <h2 className="font-tajawal text-xl font-extrabold text-[#fed65b] border-r-4 border-[#d4af37] pr-3">
                بيانات الاتصال
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                كنيسة السيدة العذراء مريم بمحرم بك هي بيت الله المفتوح للجميع. لا تتردد في الاتصال بنا.
              </p>

              <div className="space-y-5 pt-4 text-xs font-bold">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 text-[#fed65b] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-[10px] font-tajawal mb-0.5">العنوان الكنسي</h4>
                    <p className="text-white">
                      شارع الراضى - محرم بك اسكندرية
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 text-[#fed65b] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-[10px] font-tajawal mb-0.5">رقم التليفون</h4>
                    <p className="text-white dir-ltr text-right font-mono text-sm">033925050</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center text-[10px] text-slate-300 font-bold relative z-10">
              «اِسْأَلُوا تُعْطَوْا. اُطْلُبُوا تَجِدُوا. اِقْرَعُوا يُفْتَحْ لَكُمْ» (مت ٧: ٧)
            </div>
          </div>

          {/* Form Panel (7 Cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl flex flex-col justify-between">
            <div className="space-y-4 text-right">
              <h3 className="font-tajawal text-lg font-extrabold text-[#002366] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#d4af37]" />
                <span>أرسل رسالة أو استفسار</span>
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                يرجى كتابة الاسم ورقم الهاتف بوضوح لتسهيل الرد والمتابعة معك.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6 text-right">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#002366]" />
                  <span>الاسم بالكامل *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="أدخل اسمك ثلاثياً أو رباعياً"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold ${
                    fieldErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Phone with Validation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#002366]" />
                    <span>رقم الهاتف المحمول (11 رقم) *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (010, 011, 012, 015)
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono font-bold ${
                    fieldErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
                {phone.length === 11 && !fieldErrors.phone && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>رقم هاتف صحيح ومكتمل بنجاح</span>
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">الرسالة أو الطلب *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) {
                      setFieldErrors(prev => {
                        const { message: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder="اكتب رسالتك أو استفسارك أو طلبك هنا..."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors h-28 resize-none font-semibold ${
                    fieldErrors.message ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                  }`}
                />
                {fieldErrors.message && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.message}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#002366] text-[#fed65b] font-bold text-xs py-3.5 rounded-xl hover:bg-[#00174a] transition-all flex items-center justify-center gap-2 shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span>جاري الإرسال...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال الرسالة الآن</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

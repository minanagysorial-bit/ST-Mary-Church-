import React, { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { Mail, Phone, MapPin, Send, MessageSquare, HeartHandshake } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const ContactUsPage: React.FC = () => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('يرجى ملء جميع حقول النموذج المطلوبة.');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitContactMessage(name.trim(), phone.trim(), message.trim());
      toast.showToast('تم إرسال رسالتك بنجاح! سيتواصل معك أحد الآباء أو الخدام قريباً.', 'success');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      console.error('Failed to submit contact message:', err);
      toast.error('حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-12 px-4 sm:px-6 lg:px-8 font-cairo">
      <Helmet>
        <title>تواصل معنا - كنيسة السيدة العذراء مريم بمحرم بك | الأقباط الأرثوذكس</title>
        <meta name="description" content="اتصل بكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. أرقام التليفونات، الموقع الجغرافي، ونموذج إرسال طلبات الصلاة والافتقاد." />
        <meta name="keywords" content="تليفون كنيسة محرم بك, عنوان كنيسة محرم بك, تواصل معنا العذراء مريم" />
        <link rel="canonical" href={`${window.location.origin}/contact-us`} />
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
                      محرم بك، شارع الكنيسة، الإسكندرية، مصر
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 text-[#fed65b] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-[10px] font-tajawal mb-0.5">أرقام التليفونات</h4>
                    <p className="text-white dir-ltr text-right">03 - 4950000</p>
                    <p className="text-white dir-ltr text-right">03 - 4950001</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 text-[#fed65b] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-200 text-[10px] font-tajawal mb-0.5">البريد الإلكتروني</h4>
                    <p className="text-white font-mono">info@stmarymoharambek.org</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center text-[10px] text-slate-350 font-bold relative z-10">
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
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">الرسالة أو الطلب *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك أو استفسارك أو طلبك هنا..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors h-28 resize-none font-semibold"
                />
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

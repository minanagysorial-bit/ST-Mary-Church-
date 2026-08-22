import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cross, ChevronLeft, ChevronRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    email: '',
    confessionFather: 'القمص يوحنا رمزي',
    address: '',
    area: 'محرم بك',
    education: '',
    job: '',
    churchService: 'خدمة الشباب',
    interests: [] as string[]
  });

  const handleCheckbox = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createMember({
        full_name: formData.fullName,
        email: formData.email || null,
        phone: formData.phone,
        national_id: formData.nationalId || null,
        confession_father: formData.confessionFather,
        address: formData.address || null,
        area: formData.area || null,
        education: formData.education || null,
        job: formData.job || null,
        service: formData.churchService,
        interests: formData.interests.length > 0 ? formData.interests : null,
        status: 'قيد الانتظار',
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold mx-auto border border-[#d4af37]">
          <Cross className="w-6 h-6" />
        </div>
        <h1 className="font-tajawal text-3xl font-extrabold text-[#00174a]">
          بوابة تسجيل بيانات الأعضاء والأسر
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          تأكيد الربط والتواصل الروحي مع كنيسة السيدة العذراء مريم بمحرم بك
        </p>
      </div>

      {/* Steps Indicator Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between relative">
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-[#002366]' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-slate-400'}`}>1</div>
          <span className="hidden sm:inline">البيانات الأساسية</span>
        </div>

        <div className="flex-1 h-0.5 bg-slate-200 mx-3">
          <div className={`h-full bg-[#002366] transition-all ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`} />
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-[#002366]' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-slate-400'}`}>2</div>
          <span className="hidden sm:inline">العنوان والافتقاد</span>
        </div>

        <div className="flex-1 h-0.5 bg-slate-200 mx-3">
          <div className={`h-full bg-[#002366] transition-all ${step <= 2 ? 'w-0' : 'w-full'}`} />
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-[#002366]' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${step === 3 ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-slate-400'}`}>3</div>
          <span className="hidden sm:inline">الاهتمامات والتأكيد</span>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto animate-bounce" />
            <h2 className="font-tajawal text-2xl font-bold text-[#00174a]">
              تم تسجيل بياناتك بنجاح!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              نشكرك على التجاوب. تم إضافة ملفك إلى سجلات الخدمة والافتقاد بكنيسة العذراء بمحرم بك، وسيتواصل معك الأب المتابع قريباً.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="bg-[#002366] text-[#fed65b] font-bold text-xs px-6 py-3 rounded-xl shadow"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleComplete} className="space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-tajawal font-bold text-lg text-[#00174a] border-b pb-2">
                  الخطوة الأولى: البيانات الشخصية والأساسية
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك الرباعي"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الرقم القومي (14 رقم)</label>
                    <input
                      type="text"
                      placeholder="29900000000000"
                      value={formData.nationalId}
                      onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01200000000"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">أب الاعتراف *</label>
                  <select
                    value={formData.confessionFather}
                    onChange={e => setFormData({ ...formData, confessionFather: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  >
                    <option value="القمص يوحنا رمزي">القمص يوحنا رمزي</option>
                    <option value="القس بيشوي كمال">القس بيشوي كمال</option>
                    <option value="الأنبا باسيليوس">الأنبا باسيليوس</option>
                    <option value="أب اعتراف آخر خارج الكنيسة">أب اعتراف آخر خارج الكنيسة</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { if (formData.fullName && formData.phone) setStep(2); else alert('يرجى كتابة الاسم ورقم الموبايل'); }}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2"
                  >
                    <span>الانتقال للخطوة التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Address & Location */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-tajawal font-bold text-lg text-[#00174a] border-b pb-2">
                  الخطوة الثانية: السكن ومكان الخدمة والافتقاد
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المنطقة السكنية *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: محرم بك - شارع الرصافة"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المؤهل الدراسي / الكلية</label>
                    <input
                      type="text"
                      placeholder="مثال: بكالوريوس هندسة / طالب"
                      value={formData.education}
                      onChange={e => setFormData({ ...formData, education: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الخدمة الحالية بالكنيسة</label>
                  <select
                    value={formData.churchService}
                    onChange={e => setFormData({ ...formData, churchService: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#002366]"
                  >
                    <option value="خدمة الشباب">خدمة الشباب والإعدادي</option>
                    <option value="مدارس الأحد">مدارس الأحد أطفال</option>
                    <option value="الشمامسة والحان">خدمة الشمامسة والألحان</option>
                    <option value="اجتماع السيدات">اجتماع السيدات والأسرة</option>
                    <option value="إخوة الرب والخدمات الاجتماعية">إخوة الرب والخدمات الاجتماعية</option>
                    <option value="لا توجد خدمة حالياً">لا توجد خدمة حالياً (مخدوم)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الرجوع للخطوة الأولى</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-[#002366] hover:bg-[#00113a] text-[#fed65b] font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2"
                  >
                    <span>الانتقال للخطوة الأخيرة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Interests & Confirmation */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-tajawal font-bold text-lg text-[#00174a] border-b pb-2">
                  الخطوة الثالثة: الاهتمامات والتأكيد النهائي
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    اختر الأنشطة والخدمات التي تود الاشتراك بها:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                    {['الكورال والموسيقى الكنسية', 'المكتبة والقراءة الروحية', 'أنشطة الكشافة والرحلات', 'المساعدات الطبية والإفطارات', 'تحضير الدروس والخدمات الرقمية'].map(item => (
                      <label key={item} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(item)}
                          onChange={() => handleCheckbox(item)}
                          className="w-4 h-4 text-[#002366] rounded"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[#fbf9f8] p-4 rounded-2xl border border-[#d4af37]/40 text-xs space-y-1">
                  <p className="font-bold text-[#002366]">إقرار وتأكيد البيانات:</p>
                  <p className="text-slate-600">
                    أتعهد بأن كافة البيانات المدخلة صحيحة وهي لاستخدام الخدمة الكنسية فقط تحت إشراف آباء كنيسة السيدة العذراء بمحرم بك.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الرجوع للخطوة الثانية</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span>جاري إرسال البيانات...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>إرسال وتأكيد التسجيل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>

    </div>
  );
};

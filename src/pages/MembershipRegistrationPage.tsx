import React, { useState } from 'react';
import { api } from '../lib/api';
import { User, Phone, MapPin, CreditCard, Calendar, Heart, ShieldCheck, Plus, Trash2, ArrowRight, ArrowLeft, Upload, BookOpen, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useToast } from '../components/common/Toast';

interface FamilyMember {
  name: string;
  relation: string;
  stage: string;
}

export const MembershipRegistrationPage: React.FC = () => {
  const toast = useToast();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<'أعزب' | 'متزوج'>('أعزب');
  const [confessionPriest, setConfessionPriest] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('');

  // Step 2 State
  const [detailedAddress, setDetailedAddress] = useState('');
  const [area, setArea] = useState('محرم بك');
  const [customArea, setCustomArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([{ name: '', relation: '', stage: '' }]);

  // Step 3 State
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [baptismFile, setBaptismFile] = useState<File | null>(null);

  // Helper for adding family members
  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relation: '', stage: '' }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setError('يرجى إدخال الاسم بالكامل كما في البطاقة.');
        setStep(1);
        return false;
      }
      if (!phone.trim()) {
        setError('يرجى إدخال رقم الهاتف المحمول.');
        setStep(1);
        return false;
      }
      if (!birthDate) {
        setError('يرجى تحديد تاريخ الميلاد.');
        setStep(1);
        return false;
      }
      if (!confessionPriest.trim()) {
        setError('يرجى إدخال اسم أب الاعتراف.');
        setStep(1);
        return false;
      }
      if (!education.trim()) {
        setError('يرجى إدخال المؤهل الدراسي أو التخصص.');
        setStep(1);
        return false;
      }
    } else if (currentStep === 2) {
      if (!detailedAddress.trim()) {
        setError('يرجى إدخال العنوان بالتفصيل.');
        setStep(2);
        return false;
      }
      if (!landmark.trim()) {
        setError('يرجى إدخال أقرب علامة مميزة.');
        setStep(2);
        return false;
      }
      if (!jobTitle.trim()) {
        setError('يرجى إدخال الوظيفة الحالية.');
        setStep(2);
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    setError(null);

    // Calculate age from birthDate
    let age = null;
    if (birthDate) {
      const birthYear = new Date(birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }

    // Format all extra data into the address text block
    const finalArea = area === 'أخرى' ? customArea.trim() : area;
    const filteredFamily = familyMembers.filter(m => m.name.trim() !== '');
    
    const formattedAddress = `
${detailedAddress.trim()}
المنطقة: ${finalArea} | علامة مميزة: ${landmark.trim()}
أب الاعتراف: ${confessionPriest.trim()} | تاريخ الميلاد: ${birthDate}
المؤهل التعليمي: ${education.trim()}
الوظيفة: ${jobTitle.trim()} في ${workPlace.trim() || 'غير محدد'}
الحالات المرضية بالأسرة: ${chronicDiseases.trim() || 'لا يوجد'}
البريد الإلكتروني: ${email.trim() || 'غير محدد'} | هاتف إضافي: ${secondaryPhone.trim() || 'لا يوجد'}
أفراد الأسرة المقيمين بالسكن:
${filteredFamily.length > 0 
  ? filteredFamily.map((m, i) => `   [${i+1}] الاسم: ${m.name} | القرابة: ${m.relation} | الدراسة/العمل: ${m.stage}`).join('\n')
  : '   لا يوجد أفراد مسجلين'}
المستندات المرفقة:
- صورة الرقم القومي (الوجه): ${idFront ? idFront.name : 'مرفقة'}
- صورة الرقم القومي (الظهر): ${idBack ? idBack.name : 'مرفقة'}
- شهادة المعمودية / أخرى: ${baptismFile ? baptismFile.name : 'لم ترفق'}
`.trim();

    try {
      await api.submitMembershipRequest({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: formattedAddress,
        national_id: nationalId.trim() || null,
        age,
        marital_status: maritalStatus,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إرسال طلبك، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-16 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>بوابة التسجيل للعضوية الكنسية - كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content="سجل طلب عضويتك الكنسية بالمنصة الرقمية الموحدة لكنيسة السيدة العذراء بمحرم بك، الإسكندرية." />
        <link rel="canonical" href={`${window.location.origin}/membership/register`} />
      </Helmet>

      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl mx-auto">
        {/* Header Block */}
        <div className="p-8 border-b border-slate-100 bg-[#002366] text-center relative text-white">
          <div className="w-16 h-16 bg-white text-[#002366] rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              church
            </span>
          </div>
          <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b]">بوابة تسجيل العضوية الكنسية</h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed font-semibold">
            كنيسة السيدة العذراء مريم بمحرم بك - الإسكندرية
          </p>
        </div>

        {success ? (
          <div className="p-8 sm:p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="font-tajawal text-2xl font-bold text-slate-800">تم إرسال طلبك بنجاح!</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-bold">
                نشكر محبتكم لتسجيل بياناتكم. لقد تم تسليم الملف بالكامل للجنة العضوية الكنسية وسيقوم الآباء الكهنة بمراجعته واعتماده قريباً.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#002366] text-white hover:text-[#fed65b] text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              العودة للصفحة الرئيسية
            </Link>
          </div>
        ) : (
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Step Progress Indicator */}
            <div className="relative mb-8 px-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full">
                <div 
                  className="h-full bg-[#d4af37] transition-all duration-300 rounded-full" 
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
              <div className="relative flex justify-between items-center">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex flex-col items-center gap-1.5 bg-white px-2 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                      step >= s 
                        ? 'bg-[#002366] text-white border-[#d4af37]' 
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}>
                      {s}
                    </div>
                    <span className={`text-[10px] font-bold ${step >= s ? 'text-[#002366]' : 'text-slate-400'}`}>
                      {s === 1 ? 'البيانات الأساسية' : s === 2 ? 'بيانات العائلة والسكن' : 'رفع المستندات'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-bold leading-normal">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-slate-700">
              
              {/* --- STEP 1: Basic Personal Info --- */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-3 mb-4">
                    البيانات الأساسية لمقدم الطلب
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#002366]" />
                        الاسم بالكامل (كما في البطاقة) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="أدخل الاسم رباعي"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* National ID */}
                    <div className="space-y-1.5">
                      <label className="text-slate-655 font-bold block flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#002366]" />
                        الرقم القومي (14 رقم)
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="أدخل الرقم القومي الخاص بك"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#002366]" />
                        تاريخ الميلاد *
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none text-right font-bold"
                      />
                    </div>

                    {/* Marital Status */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#002366]" />
                        الحالة الاجتماعية *
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setMaritalStatus('أعزب')}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                            maritalStatus === 'أعزب'
                              ? 'bg-[#002366] text-white border-[#002366] shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          أعزب / عزباء
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaritalStatus('متزوج')}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                            maritalStatus === 'متزوج'
                              ? 'bg-[#002366] text-white border-[#002366] shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          متزوج / متزوجة
                        </button>
                      </div>
                    </div>

                    {/* Father Confessor */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#002366]" />
                        أب الاعتراف *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="اسم الكاهن أب اعترافك"
                        value={confessionPriest}
                        onChange={(e) => setConfessionPriest(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#002366]" />
                        رقم الهاتف المحمول (واتساب) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01xxxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Secondary Phone */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#002366]" />
                        هاتف إضافي للأسرة
                      </label>
                      <input
                        type="tel"
                        placeholder="رقم أرضي أو هاتف آخر"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Education */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#002366]" />
                        المؤهل الدراسي / التعليم الحالي *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: بكالوريوس تجارة / طالب بكلية..."
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#002366]" />
                        البريد الإلكتروني (اختياري)
                      </label>
                      <input
                        type="email"
                        placeholder="example@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- STEP 2: Family Info & Address --- */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-3 mb-4">
                    بيانات السكن وعائلة السكن
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
                    {/* Detailed Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#002366]" />
                        العنوان بالتفصيل *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="الشارع، رقم العقار، الدور، الشقة"
                        value={detailedAddress}
                        onChange={(e) => setDetailedAddress(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Area */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block">المنطقة الكنسية *</label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold text-slate-700"
                      >
                        <option value="محرم بك">محرم بك</option>
                        <option value="غبريال">غبريال</option>
                        <option value="وسط المدينة">وسط المدينة</option>
                        <option value="أخرى">أخرى (كتابة يدوية)</option>
                      </select>
                    </div>

                    {/* Custom Area */}
                    {area === 'أخرى' && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-slate-550 font-bold block">اكتب اسم المنطقة الكنسية *</label>
                        <input
                          type="text"
                          required
                          placeholder="المنطقة..."
                          value={customArea}
                          onChange={(e) => setCustomArea(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                        />
                      </div>
                    )}

                    {/* Landmark */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#002366]" />
                        أقرب علامة مميزة *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: بجوار صيدلية..."
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Job Title */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-[#002366]" />
                        الوظيفة الحالية *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="المسمى الوظيفي"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Work Place */}
                    <div className="space-y-1.5">
                      <label className="text-slate-650 font-bold block flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-[#002366]" />
                        جهة العمل
                      </label>
                      <input
                        type="text"
                        placeholder="اسم الشركة أو المؤسسة"
                        value={workPlace}
                        onChange={(e) => setWorkPlace(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      />
                    </div>

                    {/* Chronic diseases */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-slate-650 font-bold block">هل يوجد حالات مرضية مزمنة بالأسرة؟</label>
                      <textarea
                        rows={2}
                        placeholder="اذكر التفاصيل إن وجدت لتفعيل خدمات الرعاية الصحية والطبية الكنسية"
                        value={chronicDiseases}
                        onChange={(e) => setChronicDiseases(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none resize-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Family Members Rows */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="font-tajawal text-sm font-extrabold text-[#002366] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#d4af37]" />
                      <span>أفراد الأسرة المقيمين بنفس السكن</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {familyMembers.map((member, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold">الاسم بالكامل</label>
                            <input
                              type="text"
                              placeholder="اسم الفرد"
                              value={member.name}
                              onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold">صلة القرابة</label>
                            <input
                              type="text"
                              placeholder="ابن، ابنة، زوجة، إلخ"
                              value={member.relation}
                              onChange={(e) => updateFamilyMember(idx, 'relation', e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold"
                            />
                          </div>

                          <div className="flex gap-2 items-center">
                            <div className="space-y-1 flex-grow">
                              <label className="text-[10px] text-slate-500 font-bold">العمل/الدراسة</label>
                              <input
                                type="text"
                                placeholder="المرحلة الدراسية أو العمل"
                                value={member.stage}
                                onChange={(e) => updateFamilyMember(idx, 'stage', e.target.value)}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold"
                              />
                            </div>
                            {familyMembers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFamilyMember(idx)}
                                className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-colors shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addFamilyMember}
                      className="text-xs font-bold text-[#002366] hover:text-[#d4af37] flex items-center gap-1.5 pt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة فرد آخر من العائلة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* --- STEP 3: Document Uploads --- */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="font-tajawal text-base sm:text-lg font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-3 mb-4">
                    رفع الوثائق والمستندات (تأكيد الهوية)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-bold max-w-lg leading-relaxed">
                    يرجى إرفاق صور واضحة من بطاقة الرقم القومي لضمان صحة البيانات المكتوبة في الدفاتر الرسمية للكنيسة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold">
                    {/* ID Front */}
                    <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-[#002366] transition-all cursor-pointer relative block">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-bold text-slate-700 block">بطاقة الرقم القومي (الوجه) *</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">تأكد من وضوح الصورة</span>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIdFront(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {idFront && (
                        <div className="mt-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl py-1 px-3 text-[10px] font-bold max-w-full truncate z-20">
                          محدد: {idFront.name}
                        </div>
                      )}
                    </label>

                    {/* ID Back */}
                    <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-[#002366] transition-all cursor-pointer relative block">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-bold text-slate-700 block">بطاقة الرقم القومي (الظهر) *</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">تأكد من وضوح الأرقام</span>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIdBack(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {idBack && (
                        <div className="mt-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl py-1 px-3 text-[10px] font-bold max-w-full truncate z-20">
                          محدد: {idBack.name}
                        </div>
                      )}
                    </label>

                    {/* Baptism Certificate */}
                    <label className="sm:col-span-2 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-[#002366] transition-all cursor-pointer relative block">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-bold text-slate-700 block">شهادة المعمودية / مستندات إضافية</span>
                      <span className="text-[10px] text-slate-400 mt-1 block">اختياري لتوثيق السجل الكنسي</span>
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBaptismFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {baptismFile && (
                        <div className="mt-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl py-1 px-3 text-[10px] font-bold max-w-full truncate z-20">
                          محدد: {baptismFile.name}
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mt-4 text-[10px] sm:text-xs font-semibold leading-relaxed text-amber-800">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p>جميع البيانات والمستندات المرفوعة مشفرة بالكامل على خوادم الكنيسة المؤمنة، ويقتصر الاطلاع عليها على الأب الكاهن ولجنة العضوية الكنسية المختصة فقط.</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons Row */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800 transition-colors py-2 px-4 rounded-xl border border-slate-200"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#002366]/10 active:scale-95 transition-all"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] hover:from-[#c29f2d] hover:to-[#eec045] disabled:bg-slate-200 disabled:text-slate-400 font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب التسجيل'}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
};

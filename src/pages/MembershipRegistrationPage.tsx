import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Heart,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Upload,
  BookOpen,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  validateEgyptianNationalId,
  validateEgyptianPhone,
  validateFullName,
  validateEmail,
  validateAddress
} from '../lib/validation';
import { uploadMembershipDocument } from '../lib/fileUpload';

interface FamilyMember {
  name: string;
  relation: string;
  stage: string;
}

export const MembershipRegistrationPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Field validation errors state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State - Step 1
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<'أعزب' | 'متزوج'>('أعزب');
  const [confessionPriest, setConfessionPriest] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('');
  const [nationalIdInfo, setNationalIdInfo] = useState<{ governorate?: string; gender?: string } | null>(null);

  // Form State - Step 2
  const [detailedAddress, setDetailedAddress] = useState('');
  const [area, setArea] = useState('محرم بك');
  const [customArea, setCustomArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [workPlace, setWorkPlace] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([{ name: '', relation: '', stage: '' }]);

  // Form State - Step 3 (Documents)
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [baptismFile, setBaptismFile] = useState<File | null>(null);
  const [baptismPreview, setBaptismPreview] = useState<string | null>(null);

  // Auto-generate preview URLs
  useEffect(() => {
    if (idFront) {
      const url = URL.createObjectURL(idFront);
      setIdFrontPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setIdFrontPreview(null);
    }
  }, [idFront]);

  useEffect(() => {
    if (idBack) {
      const url = URL.createObjectURL(idBack);
      setIdBackPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setIdBackPreview(null);
    }
  }, [idBack]);

  useEffect(() => {
    if (baptismFile) {
      const url = URL.createObjectURL(baptismFile);
      setIdBaptismPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setIdBaptismPreview(null);
    }
  }, [baptismFile]);

  const setIdBaptismPreview = (url: string | null) => {
    setBaptismPreview(url);
  };

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

  // Real-time National ID handler with Auto-BirthDate derivation
  const handleNationalIdChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 14);
    setNationalId(cleaned);

    if (cleaned.length === 14) {
      const res = validateEgyptianNationalId(cleaned);
      if (res.isValid && res.birthDate) {
        setBirthDate(res.birthDate);
        setNationalIdInfo({ governorate: res.governorate, gender: res.gender });
        setFieldErrors(prev => {
          const { nationalId: _, ...rest } = prev;
          return rest;
        });
      } else {
        setNationalIdInfo(null);
        setFieldErrors(prev => ({ ...prev, nationalId: res.error || 'الرقم القومي غير صالح.' }));
      }
    } else if (cleaned.length > 0 && cleaned.length < 14) {
      setNationalIdInfo(null);
      setFieldErrors(prev => ({ ...prev, nationalId: 'يجب كتابة 14 رقماً (المتبقي ' + (14 - cleaned.length) + ' أرقام)' }));
    } else {
      setNationalIdInfo(null);
      setFieldErrors(prev => {
        const { nationalId: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};
    setGeneralError(null);

    if (currentStep === 1) {
      // 1. Full Name
      const nameRes = validateFullName(fullName);
      if (!nameRes.isValid) errors.fullName = nameRes.error!;

      // 2. National ID
      if (nationalId.trim()) {
        const nidRes = validateEgyptianNationalId(nationalId);
        if (!nidRes.isValid) errors.nationalId = nidRes.error!;
      }

      // 3. Phone
      const phoneRes = validateEgyptianPhone(phone);
      if (!phoneRes.isValid) errors.phone = phoneRes.error!;

      // 4. Secondary Phone (optional)
      if (secondaryPhone.trim()) {
        const cleanedSec = secondaryPhone.replace(/[\s-]/g, '');
        if (cleanedSec.length < 8 || cleanedSec.length > 11 || !/^[0-9]+$/.test(cleanedSec)) {
          errors.secondaryPhone = 'يرجى إدخال رقم هاتف إضافي صحيح (أرضي أو محمول).';
        }
      }

      // 5. Birth Date
      if (!birthDate) {
        errors.birthDate = 'يرجى تحديد تاريخ الميلاد.';
      }

      // 6. Confession Priest
      if (!confessionPriest.trim()) {
        errors.confessionPriest = 'يرجى إدخال اسم أب الاعتراف.';
      }

      // 7. Education
      if (!education.trim()) {
        errors.education = 'يرجى إدخال المؤهل الدراسي أو التخصص.';
      }

      // 8. Email (optional)
      if (email.trim()) {
        const emailRes = validateEmail(email);
        if (!emailRes.isValid) errors.email = emailRes.error!;
      }
    } else if (currentStep === 2) {
      // Address
      const addrRes = validateAddress(detailedAddress);
      if (!addrRes.isValid) errors.detailedAddress = addrRes.error!;

      // Landmark
      if (!landmark.trim()) {
        errors.landmark = 'يرجى كتابة أقرب علامة مميزة لتسهيل الافتقاد.';
      }

      // Custom Area
      if (area === 'أخرى' && !customArea.trim()) {
        errors.customArea = 'يرجى كتابة اسم المنطقة.';
      }

      // Job Title
      if (!jobTitle.trim()) {
        errors.jobTitle = 'يرجى إدخال المسمى الوظيفي أو (طالب / لا يعمل).';
      }
    } else if (currentStep === 3) {
      // Required documents
      if (!idFront) {
        errors.idFront = 'يرجى إرفاق صورة وجه بطاقة الرقم القومي.';
      }
      if (!idBack) {
        errors.idBack = 'يرجى إرفاق صورة ظهر بطاقة الرقم القومي.';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('يرجى تصحيح الحقول المحددة باللون الأحمر قبل المتابعة.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setGeneralError(null);
    setFieldErrors({});
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setLoading(true);
    setGeneralError(null);
    setUploadPercent(10);
    setUploadStage('جاري تجهيز وضغط المستندات...');

    try {
      const folderName = `${fullName.trim()} - ${nationalId.trim() || phone.trim()}`;
      let idFrontUrl = '';
      let idBackUrl = '';
      let baptismUrl = '';

      // 1. Upload ID Front
      if (idFront) {
        setUploadStage('جاري رفع وجه بطاقة الرقم القومي...');
        setUploadPercent(30);
        idFrontUrl = await uploadMembershipDocument(idFront, folderName, 'id_front', (msg, pct) => {
          setUploadStage(msg);
          setUploadPercent(20 + Math.round(pct * 0.25));
        });
      }

      // 2. Upload ID Back
      if (idBack) {
        setUploadStage('جاري رفع ظهر بطاقة الرقم القومي...');
        setUploadPercent(60);
        idBackUrl = await uploadMembershipDocument(idBack, folderName, 'id_back', (msg, pct) => {
          setUploadStage(msg);
          setUploadPercent(50 + Math.round(pct * 0.25));
        });
      }

      // 3. Upload Baptism Certificate (if provided)
      if (baptismFile) {
        setUploadStage('جاري رفع شهادة المعمودية...');
        setUploadPercent(80);
        baptismUrl = await uploadMembershipDocument(baptismFile, folderName, 'baptism', (msg, pct) => {
          setUploadStage(msg);
          setUploadPercent(75 + Math.round(pct * 0.15));
        });
      }

      setUploadStage('جاري حفظ وتأكيد طلب العضوية...');
      setUploadPercent(95);

      // Calculate age from birthDate
      let age = null;
      if (birthDate) {
        const birthYear = new Date(birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      const finalArea = area === 'أخرى' ? customArea.trim() : area;
      const filteredFamily = familyMembers.filter(m => m.name.trim() !== '');

      const formattedAddress = `
${detailedAddress.trim()}
المنطقة: ${finalArea} | علامة مميزة: ${landmark.trim()}
أب الاعتراف: ${confessionPriest.trim()} | تاريخ الميلاد: ${birthDate} (${nationalIdInfo?.governorate || 'المحافظة غير مسجلة'})
المؤهل التعليمي: ${education.trim()}
الوظيفة: ${jobTitle.trim()} في ${workPlace.trim() || 'غير محدد'}
الحالات المرضية بالأسرة: ${chronicDiseases.trim() || 'لا يوجد'}
البريد الإلكتروني: ${email.trim() || 'غير محدد'} | هاتف إضافي: ${secondaryPhone.trim() || 'لا يوجد'}
أفراد الأسرة المقيمين بالسكن:
${filteredFamily.length > 0 
  ? filteredFamily.map((m, i) => `   [${i+1}] الاسم: ${m.name} | القرابة: ${m.relation} | الدراسة/العمل: ${m.stage}`).join('\n')
  : '   لا يوجد أفراد مسجلين'}

المستندات المحفوظة:
- بطاقة الرقم القومي (الوجه): ${idFrontUrl ? idFrontUrl : 'مرفقة: ' + (idFront?.name || '')}
- بطاقة الرقم القومي (الظهر): ${idBackUrl ? idBackUrl : 'مرفقة: ' + (idBack?.name || '')}
- شهادة المعمودية / أخرى: ${baptismUrl ? baptismUrl : (baptismFile ? 'مرفقة: ' + baptismFile.name : 'لم ترفق')}
`.trim();

      await api.submitMembershipRequest({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: formattedAddress,
        national_id: nationalId.trim() || null,
        age,
        marital_status: maritalStatus,
      });

      setUploadPercent(100);
      setUploadStage('تم إرسال وحفظ الطلب والمستندات بنجاح!');
      setTimeout(() => {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error('Submission error:', err);
      setGeneralError(err.message || 'حدث خطأ أثناء إرسال طلبك، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f8] via-[#f5f3f3] to-[#e4e2e2] py-16 px-4 sm:px-6 lg:px-8 font-cairo text-right" dir="rtl">
      <Helmet>
        <title>بوابة التسجيل للعضوية الكنسية - كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content="سجل طلب عضويتك الكنسية بالمنصة الرقمية الموحدة لكنيسة السيدة العذراء بمحرم بك، الإسكندرية." />
        <link rel="canonical" href="https://www.tibarthenos.com/membership/register" />
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
          <div className="p-8 sm:p-16 text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="font-tajawal text-2xl font-bold text-slate-800">تم إرسال وحفظ طلبك بنجاح!</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed font-bold">
                نشكر محبتكم لتسجيل بياناتكم ورفع المستندات. لقد تم تسليم الملف بالكامل للجنة العضوية الكنسية وسيقوم الآباء الكهنة بمراجعته واعتماده قريباً.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 bg-[#002366] text-white hover:text-[#fed65b] text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
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

            {generalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-bold leading-normal flex items-center gap-2 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Upload Progress Modal/Overlay during Submit */}
            {loading && (
              <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-bold text-[#002366]">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#002366]" />
                    {uploadStage}
                  </span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#002366] to-[#d4af37] transition-all duration-300 rounded-full"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-semibold text-center">
                  يرجى الانتظار وعدم إغلاق الصفحة أثناء حفظ الملفات...
                </p>
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
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#002366]" />
                        الاسم بالكامل (ثلاثي أو رباعي كما في البطاقة) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: مينا مجدي جرجس رزق"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (fieldErrors.fullName) {
                            setFieldErrors(prev => {
                              const { fullName: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* National ID */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#002366]" />
                          الرقم القومي (14 رقم)
                        </span>
                        {nationalIdInfo && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {nationalIdInfo.governorate} • {nationalIdInfo.gender}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="أدخل الرقم القومي 14 رقم"
                        value={nationalId}
                        onChange={(e) => handleNationalIdChange(e.target.value)}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.nationalId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.nationalId && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.nationalId}
                        </p>
                      )}
                      {nationalId.length === 14 && !fieldErrors.nationalId && (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          تم استخراج تاريخ الميلاد والمحافظة تلقائياً بنجاح!
                        </p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#002366]" />
                        تاريخ الميلاد *
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => {
                          setBirthDate(e.target.value);
                          if (fieldErrors.birthDate) {
                            setFieldErrors(prev => {
                              const { birthDate: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none text-right font-bold transition-colors ${
                          fieldErrors.birthDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.birthDate && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.birthDate}
                        </p>
                      )}
                    </div>

                    {/* Marital Status */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
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
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#002366]" />
                        أب الاعتراف *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="اسم الكاهن أب اعترافك"
                        value={confessionPriest}
                        onChange={(e) => {
                          setConfessionPriest(e.target.value);
                          if (fieldErrors.confessionPriest) {
                            setFieldErrors(prev => {
                              const { confessionPriest: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.confessionPriest ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.confessionPriest && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.confessionPriest}
                        </p>
                      )}
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#002366]" />
                        رقم الهاتف المحمول (11 رقم) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="010xxxxxxxx أو 011 / 012 / 015"
                        value={phone}
                        onChange={(e) => {
                          const p = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                          setPhone(p);
                          if (fieldErrors.phone) {
                            setFieldErrors(prev => {
                              const { phone: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.phone && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Secondary Phone */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#002366]" />
                        هاتف إضافي للأسرة (أرضي أو محمول - اختياري)
                      </label>
                      <input
                        type="tel"
                        placeholder="رقم أرضي أو هاتف إضافي"
                        value={secondaryPhone}
                        onChange={(e) => {
                          setSecondaryPhone(e.target.value);
                          if (fieldErrors.secondaryPhone) {
                            setFieldErrors(prev => {
                              const { secondaryPhone: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.secondaryPhone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.secondaryPhone && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.secondaryPhone}
                        </p>
                      )}
                    </div>

                    {/* Education */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#002366]" />
                        المؤهل الدراسي / التعليم الحالي *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: بكالوريوس هندسة / طالب بالثانوية العامة"
                        value={education}
                        onChange={(e) => {
                          setEducation(e.target.value);
                          if (fieldErrors.education) {
                            setFieldErrors(prev => {
                              const { education: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.education ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.education && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.education}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#002366]" />
                        البريد الإلكتروني (اختياري)
                      </label>
                      <input
                        type="email"
                        placeholder="example@domain.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) {
                            setFieldErrors(prev => {
                              const { email: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.email}
                        </p>
                      )}
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
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#002366]" />
                        العنوان بالتفصيل (الشارع، رقم العقار، الدور، الشقة) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: شارع الراضي - عقار 12 - الدور الثالث - شقة 5"
                        value={detailedAddress}
                        onChange={(e) => {
                          setDetailedAddress(e.target.value);
                          if (fieldErrors.detailedAddress) {
                            setFieldErrors(prev => {
                              const { detailedAddress: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.detailedAddress ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.detailedAddress && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.detailedAddress}
                        </p>
                      )}
                    </div>

                    {/* Area */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block">المنطقة الكنسية *</label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                      >
                        <option value="محرم بك">محرم بك</option>
                        <option value="الرصافة">الرصافة</option>
                        <option value="بوالينو">بوالينو</option>
                        <option value="منطقة الراضي">منطقة الراضي</option>
                        <option value="غربال">غربال</option>
                        <option value="عرفان">عرفان</option>
                        <option value="أمبروزو">أمبروزو</option>
                        <option value="أخرى">منطقة أخرى (حددها أدناه)</option>
                      </select>
                    </div>

                    {/* Landmark */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block">أقرب علامة مميزة للسكن *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: بجوار صيدلية... / أمام مدرسة..."
                        value={landmark}
                        onChange={(e) => {
                          setLandmark(e.target.value);
                          if (fieldErrors.landmark) {
                            setFieldErrors(prev => {
                              const { landmark: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.landmark ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.landmark && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.landmark}
                        </p>
                      )}
                    </div>

                    {/* Custom Area (if selected أخرى) */}
                    {area === 'أخرى' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-slate-700 font-bold block">اسم المنطقة الأخرى *</label>
                        <input
                          type="text"
                          required
                          placeholder="اكتب اسم منطقتك السكنية"
                          value={customArea}
                          onChange={(e) => setCustomArea(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#002366] focus:border-[#002366] outline-none font-bold"
                        />
                      </div>
                    )}

                    {/* Job Title */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-[#002366]" />
                        الوظيفة الحالية / المهنة *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="المسمى الوظيفي أو (طالب / لا يعمل)"
                        value={jobTitle}
                        onChange={(e) => {
                          setJobTitle(e.target.value);
                          if (fieldErrors.jobTitle) {
                            setFieldErrors(prev => {
                              const { jobTitle: _, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className={`w-full text-xs bg-slate-50 border rounded-xl px-4 py-3 outline-none font-bold transition-colors ${
                          fieldErrors.jobTitle ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-[#002366]'
                        }`}
                      />
                      {fieldErrors.jobTitle && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.jobTitle}
                        </p>
                      )}
                    </div>

                    {/* Work Place */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-[#002366]" />
                        جهة العمل / الشركة (اختياري)
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
                      <label className="text-slate-700 font-bold block">هل يوجد حالات مرضية مزمنة بالأسرة؟</label>
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
                  <p className="text-xs text-slate-600 font-bold max-w-lg leading-relaxed">
                    يرجى إرفاق صور واضحة من بطاقة الرقم القومي لضمان صحة البيانات المكتوبة في الدفاتر الرسمية للكنيسة ومطابقتها.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold">
                    
                    {/* ID Front */}
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-slate-200 hover:border-[#002366] rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-all relative overflow-hidden">
                        {idFrontPreview ? (
                          <div className="space-y-3 w-full">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                              <img src={idFrontPreview} alt="ID Front" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                {idFront?.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIdFront(null)}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"
                              >
                                <Trash2 className="w-3 h-3" />
                                تغيير الصورة
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="font-bold text-slate-700 block">بطاقة الرقم القومي (الوجه) *</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">اضغط لاختيار صورة واضحة</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              required
                              onChange={(e) => {
                                setIdFront(e.target.files?.[0] || null);
                                if (fieldErrors.idFront) {
                                  setFieldErrors(prev => {
                                    const { idFront: _, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {fieldErrors.idFront && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.idFront}
                        </p>
                      )}
                    </div>

                    {/* ID Back */}
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-slate-200 hover:border-[#002366] rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-all relative overflow-hidden">
                        {idBackPreview ? (
                          <div className="space-y-3 w-full">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                              <img src={idBackPreview} alt="ID Back" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                                {idBack?.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIdBack(null)}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"
                              >
                                <Trash2 className="w-3 h-3" />
                                تغيير الصورة
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="font-bold text-slate-700 block">بطاقة الرقم القومي (الظهر) *</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">تأكد من وضوح العنوان والأرقام</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              required
                              onChange={(e) => {
                                setIdBack(e.target.files?.[0] || null);
                                if (fieldErrors.idBack) {
                                  setFieldErrors(prev => {
                                    const { idBack: _, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {fieldErrors.idBack && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.idBack}
                        </p>
                      )}
                    </div>

                    {/* Baptism Certificate (Optional) */}
                    <div className="sm:col-span-2 space-y-2">
                      <div className="border-2 border-dashed border-slate-200 hover:border-[#002366] rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-all relative overflow-hidden">
                        {baptismPreview ? (
                          <div className="space-y-3 w-full max-w-sm mx-auto">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                              <img src={baptismPreview} alt="Baptism Certificate" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-700 truncate">
                                {baptismFile?.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setBaptismFile(null)}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"
                              >
                                <Trash2 className="w-3 h-3" />
                                حذف
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="font-bold text-slate-700 block">شهادة المعمودية / مستندات إضافية (اختياري)</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">اختياري لتوثيق السجل الكنسي</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => setBaptismFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

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
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors py-2.5 px-4 rounded-xl border border-slate-200 disabled:opacity-50"
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
                    className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] hover:from-[#c29f2d] hover:to-[#eec045] disabled:bg-slate-200 disabled:text-slate-400 font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#00174a]" />
                        <span>جاري الرفع والحفظ...</span>
                      </>
                    ) : (
                      <span>تأكيد وإرسال طلب العضوية</span>
                    )}
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

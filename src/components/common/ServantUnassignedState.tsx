import React from 'react';
import { ShieldAlert, Users, PhoneCall, Info, Sparkles, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServantUnassignedStateProps {
  servantName?: string;
  pageTitle?: string;
}

export const ServantUnassignedState: React.FC<ServantUnassignedStateProps> = ({
  servantName,
  pageTitle = 'هذه الصفحة'
}) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 font-cairo text-right animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden">
        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-[#00174a] via-[#002366] to-[#00113a] text-white p-8 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-[#fed65b] text-[#00174a] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/20">
            <ShieldAlert className="w-10 h-10 animate-pulse text-[#00174a]" />
          </div>
          
          <span className="bg-[#fed65b]/20 text-[#fed65b] text-xs font-extrabold px-3.5 py-1 rounded-full border border-[#fed65b]/40 inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تنبيه نظام الخدمة الكنسية</span>
          </span>

          <h2 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#fed65b] leading-tight">
            أنت غير مضاف في أي خدمة أو أسرة حالياً
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-2 max-w-xl mx-auto leading-relaxed">
            أهلاً بك يا خادم المسيح المبارك {servantName ? `(${servantName})` : ''} ✝️
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 space-y-3">
            <h4 className="font-tajawal text-sm font-extrabold flex items-center gap-2 text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>لماذا تظهر لك هذه الشاشة؟</span>
            </h4>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed">
              بحسب لائحة وقواعد التربية الكنسية لكنيسة السيدة العذراء مريم بمحرم بك، يتم تخصيص بيانات المخدومين والغياب والافتقاد ونقاط المعرض لكل خادم بناءً على <span className="font-bold underline">الخدمة والأسرة المسندة إليه فقط</span>.
            </p>
            <p className="text-xs text-amber-900 font-semibold leading-relaxed">
              طالما لم يتم تسكينك بعد في أسرة داخل خدمتك، تظل بيانات {pageTitle} فارغة ومحمية لحين قيام أمين الخدمة أو الإدارة بربط حسابك.
            </p>
          </div>

          {/* Steps to activate */}
          <div className="space-y-3">
            <h4 className="font-tajawal text-sm font-extrabold text-[#00174a]">
              خطوات تفعيل وتسكين حسابك في الخدمة:
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-[#002366] font-bold">
                  <span className="w-6 h-6 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs">1</span>
                  <span>التواصل مع أمين الخدمة</span>
                </div>
                <p className="text-slate-600 font-semibold">
                  أبلغ أمين خدمتك (مرحلة ابتدائي، إعدادي، ثانوي، إلخ) بأن حسابك مسجل ويحتاج للتسكين في أسرة محددة.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-[#002366] font-bold">
                  <span className="w-6 h-6 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs">2</span>
                  <span>الربط والتسكين الفوري</span>
                </div>
                <p className="text-slate-600 font-semibold">
                  يقوم أمين الخدمة أو إدارة الكنيسة باختيار اسمك وتعيينك في فصل وأسرة المخدومين الخاصة بك.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/servant/tools"
              className="w-full sm:w-auto bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <span>الانتقال لأدوات ومكتبة الخادم العامة</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <span className="text-[11px] text-slate-400 font-bold">
              كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

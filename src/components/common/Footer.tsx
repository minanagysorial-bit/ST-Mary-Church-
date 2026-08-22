import React, { useState, useEffect } from 'react';
import { Cross, MapPin, Phone, Mail, Clock, Heart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getSiteSettings()
      .then(setSettings)
      .catch(err => console.error("Error loading footer settings:", err));
  }, []);

  const footerAbout = settings.footer_about || "كنيسة السيدة العذراء مريم الأرثوذكسية بمحرم بك - الإسكندرية. منبر مكرس للبناء الروحي والتعليم الأرثوذكسي والخدمة المجتمعية.";
  const footerPhone = settings.footer_phone || "+20 3 4950000";
  const footerEmail = settings.footer_email || "info@stmarymoharambek.org";
  const footerAddress = settings.footer_address || "شارع الكنيسة، محرم بك، الإسكندرية، جمهورية مصر العربية";
  
  // Parse schedules dynamically or use default
  const scheduleText = settings.footer_schedule || "القداس الأول (الأحد) @ 6:00 ص - 8:00 ص | القداس الثاني (الأحد) @ 8:00 ص - 10:30 ص | قداس الأربعاء @ 7:00 ص - 9:00 ص | اجتماع الشباب (الجمعة) @ 6:30 م - 8:30 م";
  const schedules = scheduleText.split('|').map(s => {
    const parts = s.split('@');
    return {
      title: parts[0]?.trim() || "",
      time: parts[1]?.trim() || ""
    };
  }).filter(s => s.title && s.time);

  return (
    <footer className="bg-gradient-to-b from-[#00174a] to-[#000814] text-white border-t-4 border-[#d4af37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-right">
          
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-[#fed65b] text-[#00174a] flex items-center justify-center font-bold">
                <Cross className="w-5 h-5" />
              </div>
              <h2 className="font-tajawal text-xl font-bold text-[#fed65b]">
                كنيسة العذراء مريم
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              {footerAbout}
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-[#fed65b] justify-start">
              <Shield className="w-4 h-4" />
              <span className="font-semibold">المنصة الرقمية الموحدة ٢٠٢٦</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="font-tajawal text-lg font-bold text-[#fed65b] border-b border-[#d4af37]/30 pb-2">
              روابط سريعة
            </h3>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/" className="text-slate-300 hover:text-[#fed65b] transition-colors flex items-center justify-start gap-2">
                  <span>• الصفحة الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link to="/liturgies-schedule" className="text-slate-300 hover:text-[#fed65b] transition-colors flex items-center justify-start gap-2">
                  <span>• مواعيد القداسات</span>
                </Link>
              </li>
              <li>
                <Link to="/sermons" className="text-slate-300 hover:text-[#fed65b] transition-colors flex items-center justify-start gap-2">
                  <span>• مكتبة العظات والكلمات الروحية</span>
                </Link>
              </li>
              <li>
                <Link to="/membership" className="text-slate-300 hover:text-[#fed65b] transition-colors flex items-center justify-start gap-2">
                  <span>• بوابة تسجيل بيانات الأعضاء</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-[#fed65b] transition-colors flex items-center justify-start gap-2">
                  <span>• بوابة الدخول للخدام والآباء الكهنة</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Location */}
          <div className="space-y-3">
            <h3 className="font-tajawal text-lg font-bold text-[#fed65b] border-b border-[#d4af37]/30 pb-2">
              التواصل والأرشيف
            </h3>
            <div className="space-y-2 text-xs text-slate-300 font-semibold">
              <div className="flex items-start gap-2 justify-start">
                <MapPin className="w-4 h-4 text-[#fed65b] shrink-0 mt-0.5" />
                <span>{footerAddress}</span>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <Phone className="w-4 h-4 text-[#fed65b] shrink-0" />
                <span dir="ltr">{footerPhone}</span>
              </div>
              <a 
                href="https://www.facebook.com/al.3dra" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 justify-start hover:text-[#fed65b] transition-colors"
              >
                <FacebookIcon className="w-4 h-4 text-[#fed65b] shrink-0" />
                <span>صفحتنا الرسمية على فيسبوك</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Rights */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold">© {new Date().getFullYear()} كنيسة السيدة العذراء مريم بمحرم بك - جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1 text-[#fed65b]">
            <span className="font-bold">بنعمة ربنا وبركة العذراء مريم</span>
            <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
          </div>
        </div>
      </div>
    </footer>
  );
};

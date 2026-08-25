import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, Cross, Sparkles, Award } from 'lucide-react';
import type { Member } from '../../lib/database.types';

interface StudentIdCardModalProps {
  student: Member | null;
  points?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  points = 0,
  isOpen,
  onClose
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (student) {
      const qrData = JSON.stringify({
        type: 'SUNDAY_SCHOOL_STUDENT',
        id: student.id,
        name: student.full_name,
        service: student.service || 'مدارس الأحد'
      });

      QRCode.toDataURL(qrData, {
        width: 320,
        margin: 1,
        color: {
          dark: '#00174a',
          light: '#ffffff'
        }
      }).then(url => setQrUrl(url)).catch(console.error);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-cairo" dir="rtl">
      <div className="bg-[#00174a] text-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-[#d4af37]/60 overflow-hidden relative animate-fade-in">
        
        {/* Top Gold Accent */}
        <div className="h-2 bg-gradient-to-r from-[#d4af37] via-[#fed65b] to-[#d4af37]" />

        {/* Modal Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#d4af37]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#fed65b]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">بطاقة مخدوم مدارس الأحد 🌟</h3>
              <p className="text-[10px] text-slate-300">كود QR لتسجيل الحضور والنقاط أسبوعياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={cardRef}
            className="w-full max-w-[340px] bg-gradient-to-br from-[#002366] via-[#00174a] to-[#0b1026] rounded-3xl p-5 border-2 border-[#d4af37] shadow-2xl text-center relative overflow-hidden space-y-4"
          >
            {/* Background Cross Watermark */}
            <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
              <Cross className="w-48 h-48 text-[#fed65b]" />
            </div>

            {/* Church Header */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-3">
              <div className="text-right">
                <p className="text-[9px] font-bold text-[#fed65b] tracking-wider uppercase">كنيسة السيدة العذراء مريم</p>
                <p className="text-[11px] font-extrabold text-white">محرم بك — الإسكندرية</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#fed65b] border border-[#d4af37]/40">
                <Cross className="w-4 h-4" />
              </div>
            </div>

            {/* Student Info */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-[#d4af37]/20 border border-[#d4af37]/40 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-[#fed65b]">
                <Sparkles className="w-3 h-3" />
                <span>{student.service || 'مدارس الأحد'}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white leading-tight">{student.full_name}</h2>
              {student.education && (
                <p className="text-xs text-slate-300 font-semibold">{student.education}</p>
              )}
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl shadow-inner inline-block border-2 border-[#d4af37]/40">
              {qrUrl ? (
                <img src={qrUrl} alt="Student QR Code" className="w-36 h-36 object-contain mx-auto" />
              ) : (
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  جارٍ التوليد...
                </div>
              )}
            </div>

            {/* Points Badge & ID */}
            <div className="bg-white/10 rounded-2xl p-2.5 flex items-center justify-around border border-white/10 text-xs">
              <div>
                <p className="text-[10px] text-slate-300 font-medium">رصيد النقاط</p>
                <p className="text-sm font-extrabold text-[#fed65b]">⭐️ {points} نقطة</p>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <p className="text-[10px] text-slate-300 font-medium">كود المخدوم</p>
                <p className="text-xs font-mono font-bold text-white">{student.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Spiritual Quote */}
            <p className="text-[9px] text-[#fed65b]/90 italic font-semibold pt-1 border-t border-[#d4af37]/20">
              «أَمَّا أَنَا وَبَيْتِي فَنَعْبُدُ الرَّبَّ» (يش ٢٤: ١٥)
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-[#00113a] border-t border-[#d4af37]/20 flex items-center gap-3">
          {qrUrl && (
            <a
              href={qrUrl}
              download={`كود_مدارس_الأحد_${student.full_name.replace(/\s+/g, '_')}.png`}
              className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Download className="w-4 h-4" />
              <span>حفظ الباركود كصورة</span>
            </a>
          )}
          <button
            onClick={handlePrint}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>

      </div>
    </div>
  );
};

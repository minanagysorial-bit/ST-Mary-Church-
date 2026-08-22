import React from 'react';

export const DashboardFooter: React.FC = () => {
  return (
    <footer
      className="bg-[#f5f3f3] border-t border-[#c5c6d2] flex justify-between items-center p-4 mt-auto font-cairo"
      dir="rtl"
    >
      <div className="text-xs text-[#444650]">
        © 2026 كنيسة العذراء مريم بمحرم بك - جميع الحقوق محفوظة
      </div>
      <div className="flex gap-4">
        <a className="text-xs text-[#444650] hover:text-[#735c00] transition-colors" href="#">
          الدعم الفني
        </a>
        <a className="text-xs text-[#444650] hover:text-[#735c00] transition-colors" href="#">
          سياسة الخصوصية
        </a>
      </div>
    </footer>
  );
};

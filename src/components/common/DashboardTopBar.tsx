import React from 'react';
import { Menu } from 'lucide-react';

interface DashboardTopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({ onToggleMobileSidebar }) => {
  return (
    <header
      className="bg-[#fbf9f8]/95 backdrop-blur-md border-b border-[#c5c6d2]/50 flex justify-between items-center h-16 px-4 sm:px-6 md:px-8 sticky top-0 z-30 w-full font-cairo shadow-sm"
      dir="rtl"
    >
      {/* Right side: Mobile Menu Trigger + Context info */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-white border border-[#c5c6d2]/60 text-[#00113a] hover:bg-[#00113a]/5 shadow-sm transition-all flex items-center justify-center"
            title="فتح القائمة الجانبية"
            type="button"
          >
            <Menu className="w-5 h-5 text-[#00113a]" />
          </button>
        )}
      </div>

      {/* Center: Title */}
      <div className="font-tajawal text-base sm:text-xl font-bold text-[#00113a] tracking-wide truncate">
        لوحة التحكم المركزية
      </div>

      {/* Left side: Search + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative w-40 sm:w-56 lg:w-64 hidden sm:block">
          <span className="material-symbols-outlined absolute right-3 top-2 text-[#444650] text-[20px]">
            search
          </span>
          <input
            className="w-full bg-[#f5f3f3] border border-[#c5c6d2] rounded-full py-1.5 pr-9 pl-4 focus:outline-none focus:border-[#00113a] text-xs text-[#1b1c1c] transition-colors font-cairo"
            placeholder="بحث في النظام..."
            type="text"
          />
        </div>
        <button 
          className="text-[#444650] hover:text-[#00113a] transition-colors cursor-pointer p-2 rounded-full hover:bg-[#e4e2e2]"
          title="الإشعارات"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
        </button>
        <button 
          className="text-[#444650] hover:text-[#00113a] transition-colors cursor-pointer p-2 rounded-full hover:bg-[#e4e2e2]"
          title="الحساب الشخصي"
        >
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
};


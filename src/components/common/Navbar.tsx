import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cross, Menu, X, User } from 'lucide-react';
import { api } from '../../lib/api';

interface NavbarProps {
  onOpenPrayerModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPrayerModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const [tickerAnnouncements, setTickerAnnouncements] = useState<string[]>([]);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);

  useEffect(() => {
    api.getActiveAnnouncements()
      .then(data => {
        const texts = data.map(a => a.title + (a.content ? `: ${a.content}` : ''));
        if (texts.length === 0) {
          setTickerAnnouncements(['مرحباً بكم في المنصة الرقمية الموحدة لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية']);
        } else {
          setTickerAnnouncements(texts);
        }
      })
      .catch(() => {
        setTickerAnnouncements(['مرحباً بكم في المنصة الرقمية الموحدة لكنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية']);
      });

    // Check Live Stream Status
    api.getSiteSettings()
      .then(async (settings) => {
        const mode = settings.live_stream_mode || 'manual';
        const channelId = settings.youtube_channel_id;

        if (mode === 'auto' && channelId) {
          setIsLiveActive(true);
        } else {
          setIsLiveActive(settings.live_stream_active === 'true');
        }
      })
      .catch(() => {
        setIsLiveActive(false);
      });
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 w-full bg-[#00174a]/90 backdrop-blur-md border-b border-[#d4af37]/30 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#fed65b] p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-[#00174a] flex items-center justify-center border border-[#d4af37]/50">
                <Cross className="w-6 h-6 text-[#fed65b]" />
              </div>
            </div>
            <div className="text-right">
              <h1 className="font-tajawal text-md sm:text-lg font-bold tracking-tight text-white group-hover:text-[#fed65b] transition-colors leading-tight">
                كنيسة السيدة العذراء مريم
              </h1>
              <p className="text-[10px] text-[#fed65b]/90 font-medium mt-0.5">محرم بك - الإسكندرية</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                isActive('/')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                location.pathname.startsWith('/about')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              عن الكنيسة
            </Link>
            <Link
              to="/liturgies-schedule"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                isActive('/liturgies-schedule')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              مواعيد القداسات
            </Link>
            <Link
              to="/sermons"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                isActive('/sermons')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              مكتبة العظات
            </Link>
            <Link
              to="/membership/register"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                isActive('/membership/register')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              العضوية
            </Link>
            <Link
              to="/live-stream"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                isActive('/live-stream') || isActive('/live')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>بث مباشر</span>
              {isLiveActive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"></span>
                </span>
              )}
            </Link>
            <Link
              to="/contact-us"
              className={`px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                isActive('/contact-us')
                  ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 shadow-inner'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              تواصل معنا
            </Link>
          </nav>

          {/* Actions CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-1.5 transform hover:-translate-y-0.5"
            >
              <User className="w-4 h-4" />
              <span>دخول للنظام</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/login"
              className="bg-[#fed65b] text-[#00174a] p-2 rounded-lg font-bold text-xs"
              title="دخول للنظام"
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#00113a]/95 backdrop-blur-xl border-b border-[#d4af37]/30 px-4 pt-3 pb-6 space-y-2 animate-fade-in text-right font-cairo shadow-2xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            الرئيسية
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              location.pathname.startsWith('/about') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            عن الكنيسة
          </Link>
          <Link
            to="/liturgies-schedule"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/liturgies-schedule') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            مواعيد القداسات
          </Link>
          <Link
            to="/sermons"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/sermons') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            مكتبة العظات
          </Link>
          <Link
            to="/membership/register"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/membership/register') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            تسجيل العضوية
          </Link>
          <Link
            to="/live-stream"
            onClick={() => setMobileMenuOpen(false)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
              isActive('/live-stream') || isActive('/live') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            <span>بث مباشر</span>
            {isLiveActive && (
              <span className="flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/40 text-rose-400 text-[10px] px-2 py-0.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>مباشر الآن</span>
              </span>
            )}
          </Link>
          <Link
            to="/contact-us"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isActive('/contact-us') ? 'bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            تواصل معنا
          </Link>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenPrayerModal(); }}
              className="w-full text-center bg-white/10 hover:bg-white/20 text-[#fed65b] border border-[#fed65b]/40 font-bold text-xs py-2.5 rounded-xl transition-all"
            >
              طلب صلاة على المذبح
            </button>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gradient-to-r from-[#d4af37] to-[#fed65b] text-[#00174a] font-bold text-xs py-2.5 rounded-xl shadow-md"
            >
              تسجيل الدخول للنظام الإداري
            </Link>
          </div>
        </div>
      )}
    </header>

    {/* Moving Announcements Ticker Bar */}
    {location.pathname === '/' && (
      <div className="w-full bg-[#ffffff] border-b border-[#d4af37]/35 text-[#00174a] py-2.5 relative z-30 overflow-hidden flex items-center shadow-md select-none" dir="rtl">
        {/* News Label Badge */}
        <div className="bg-[#002366] text-white px-3.5 py-1 mr-4 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 z-10 shadow-sm border border-[#d4af37]/35 font-tajawal">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] animate-pulse shrink-0" />
          <span>إعلانات الكنيسة</span>
        </div>
        
        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden relative mr-2">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee-ltr {
              0% { transform: translate3d(-100%, 0, 0); }
              100% { transform: translate3d(100vw, 0, 0); }
            }
            .animate-marquee-ltr {
              display: inline-block;
              animation: marquee-ltr 80s linear infinite;
            }
            .animate-marquee-ltr:hover {
              animation-play-state: paused;
              cursor: pointer;
            }
          `}} />
          <div className="animate-marquee-ltr whitespace-nowrap pl-6 text-sm sm:text-base font-extrabold font-cairo text-[#00113a] tracking-wide">
            {tickerAnnouncements.join('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0✦\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0')}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

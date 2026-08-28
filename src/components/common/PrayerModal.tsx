import React, { useState } from 'react';
import { X, HeartHandshake, Send, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface PrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrayerModal: React.FC<PrayerModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [type, setType] = useState<'تراحيم' | 'طلبة'>('تراحيم');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const finalName = name.trim() ? `${name.trim()} (${type})` : `أحد الأبناء (${type})`;
      await api.submitPrayerRequest(finalName, request.trim());
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName('');
        setRequest('');
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء إرسال طلب الصلاة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in font-cairo" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#d4af37]/40">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-5 flex items-center justify-between border-b border-[#d4af37]/30">
          <div className="flex items-center gap-3">
            {/* 🕯️ Realistic Animated Church Candle */}
            <div className="relative flex flex-col items-center justify-end h-10 w-6 shrink-0 pt-1">
              <div className="w-3 h-5 bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-100 rounded-full animate-candle-flame shadow-[0_0_12px_rgba(254,180,20,0.8)]" />
              <div className="w-2 h-3.5 bg-amber-50 rounded-xs border border-amber-200/50" />
            </div>

            <div>
              <h3 className="font-tajawal font-bold text-lg text-[#fed65b]">طلب صلاة على المذبح المقدس</h3>
              <p className="text-xs text-slate-300">نرفع طلبك وتضرعك في القداسات الإلهية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors btn-bounce"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-4 animate-tab-transition">
              {/* ✨ Animated SVG Checkmark */}
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 text-emerald-500" viewBox="0 0 52 52">
                  <circle className="text-emerald-100" strokeWidth="3" stroke="currentColor" fill="none" cx="26" cy="26" r="23" />
                  <path className="animate-checkmark-draw text-emerald-600" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" fill="none" d="M14 27l8 8 16-16" />
                </svg>
              </div>
              <h4 className="font-tajawal font-bold text-xl text-[#00174a]">تم استلام طلب الصلاة بنجاح</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                "صَلاَةُ الْبَارِّ تَقْتَدِرُ كَثِيرًا فِي فِعْلِهَا". سيتم ذكر طلبك في المذبح الإلهي.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  نوع طلب الصلاة
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('تراحيم')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 btn-bounce ${
                      type === 'تراحيم'
                        ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-md ring-2 ring-[#d4af37]/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🕯️</span>
                    <span>تراحيم (عن المنتقلين)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('طلبة')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 btn-bounce ${
                      type === 'طلبة'
                        ? 'bg-[#002366] text-[#fed65b] border-[#002366] shadow-md ring-2 ring-[#d4af37]/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🙏</span>
                    <span>طلبة (شفاء وبركة)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسمك أو اسم من تطلب الصلاة لأجله"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تفاصيل طلب الصلاة *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب طلب الصلاة هنا ليتم رفعه على المذبح المقدّس..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#002366] resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-750 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#002366] to-[#00174a] text-[#fed65b] font-bold text-xs px-6 py-2.5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'جاري الإرسال...' : 'إرسال الطلب الآن'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

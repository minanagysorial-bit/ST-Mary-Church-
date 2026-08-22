import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { MessageSquare, Check, X, ShieldAlert, Clock, RefreshCw, Lightbulb, Calendar, Send } from 'lucide-react';
import { api } from '../../lib/api';
import type { MembershipComment } from '../../lib/database.types';

export const MembershipCommentsPage: React.FC = () => {
  const [comments, setComments] = useState<MembershipComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});

  const fetchComments = () => {
    setLoading(true);
    api.getMembershipComments()
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'مقبول' | 'مرفوض' | 'مؤجل') => {
    try {
      await api.updateMembershipComment(id, { status: newStatus });
      fetchComments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = (commentId: string) => {
    if (!replyText[commentId]?.trim()) return;
    // Mock replying logic (console or store)
    console.log(`Replying to ${commentId}: ${replyText[commentId]}`);
    alert('تم إرسال الرد بنجاح للأب الكاهن/الخادم');
    setReplyText(prev => ({ ...prev, [commentId]: '' }));
  };

  const pendingRequests = comments.filter(c => c.status === 'قيد المراجعة');
  const otherComments = comments.filter(c => c.status !== 'قيد المراجعة');

  // Static event calendar matching Stitch
  const upcomingEvents = [
    { month: 'أكتوبر', day: '٢٥', title: 'اجتماع الشباب العام', time: 'الساعة ٧:٠٠ مساءً' },
    { month: 'أكتوبر', day: '٢٧', title: 'نهضة الشهيد مارمينا', time: 'القداس الإلهي' }
  ];

  return (
    <DashboardLayout role="priest">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              إدارة العضوية والآراء
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              متابعة طلبات الانضمام الجديدة والتواصل مع شعب الكنيسة
            </p>
          </div>
          <button 
            onClick={fetchComments}
            className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-650 transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* 2-Column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Columns - 2 col width: Membership Comments & requests */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pending Requests */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
                طلبات العضوية المعلقة
              </h3>
              
              <div className="space-y-4">
                {loading ? (
                  <p className="text-slate-400 text-center py-4 text-xs font-bold">جاري تحميل طلبات العضوية...</p>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 text-xs font-bold">لا توجد طلبات انضمام معلقة حالياً.</p>
                ) : (
                  pendingRequests.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50/75 border border-slate-100 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/50 pb-2">
                        <div>
                          <p className="font-bold text-sm text-[#002366]">{c.applicant_name}</p>
                        </div>
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
                          معلق قيد المراجعة
                        </span>
                      </div>
                      
                      <div className="text-xs font-semibold text-slate-600 leading-relaxed">
                        <p><span className="text-slate-400 font-bold">الخدمة المطلوبة:</span> {c.requested_service}</p>
                        <p className="mt-1"><span className="text-slate-400 font-bold">أب الاعتراف المختار:</span> {c.confession_father || 'غير محدد'}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 font-tajawal text-xs">
                        <button 
                          onClick={() => handleUpdateStatus(c.id, 'مقبول')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> 
                          <span>اعتماد وانضمام فوري</span>
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(c.id, 'مؤجل')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" /> 
                          <span>تأجيل</span>
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(c.id, 'مرفوض')}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> 
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments and Opinions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                التعليقات والآراء
              </h3>
              
              <div className="space-y-4">
                {loading ? (
                  <p className="text-slate-400 text-center py-4 text-xs font-bold">جاري تحميل الآراء...</p>
                ) : otherComments.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-sm font-bold text-[#002366]">إيريني سامي</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">عن عظة: "قوة الصلاة" — منذ ساعتين</p>
                    <p className="text-xs text-slate-600 font-semibold mt-2.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      عظة معزية جداً يا أبونا، نشكرك على تعبك. هل من الممكن توفير ملف PDF للتأملات المذكورة في العظة؟
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="اكتب رداً على هذا التعليق..." 
                        className="flex-1 text-xs border border-slate-205 rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                      />
                      <button className="bg-[#002366] text-white p-2 rounded-xl hover:bg-[#002366]/90 transition-all shadow-sm">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  otherComments.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                        <div>
                          <p className="font-bold text-sm text-[#002366]">{c.applicant_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">عن عظة: {c.requested_service} — {new Date(c.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          c.status === 'مقبول' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                        {c.requested_service || 'عظة رائعة جداً ونشكر قدس الأب الكاهن والخدام على هذا المجهود المبارك.'}
                      </p>
                      
                      {/* Active Reply Form */}
                      <div className="mt-3 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="اكتب رداً على هذا التعليق..."
                          value={replyText[c.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply(c.id)}
                          className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#002366]/20 outline-none"
                        />
                        <button 
                          onClick={() => handleSendReply(c.id)}
                          className="bg-[#002366] text-white p-2.5 rounded-xl hover:bg-[#002366]/90 transition-all shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column - 1 col width: Analytics & Event alerts */}
          <div className="space-y-6">
            
            {/* Weekly activity tips */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#d4af37]" />
                نصيحة للإدارة الرعوية
              </h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                التفاعل السريع مع تعليقات الشعب يزيد من روح الترابط في الكنيسة. حاول الرد على الاستفسارات العامة ومبادرات الشباب خلال 24 ساعة.
              </p>
              <div className="bg-[#002366]/5 rounded-xl p-3 text-[10px] text-slate-500 font-bold border border-[#002366]/10">
                💡 التحديث الفوري لحالات طلب العضوية يرسل إشعاراً إلكترونياً ترحيبياً تلقائياً للأعضاء.
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
              <h3 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#d4af37]" />
                أحداث قادمة
              </h3>
              
              <div className="space-y-4">
                {upcomingEvents.map((evt, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-3 bg-slate-50/70 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all">
                    <div className="bg-[#002366] text-white text-center w-12 py-2 rounded-xl shrink-0">
                      <p className="font-tajawal text-sm font-extrabold leading-none">{evt.day}</p>
                      <p className="text-[9px] font-bold mt-1.5 opacity-80">{evt.month}</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#002366]">{evt.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{evt.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

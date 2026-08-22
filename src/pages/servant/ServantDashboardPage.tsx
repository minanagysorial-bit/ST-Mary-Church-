import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { BookOpen, Users, Calendar, CheckSquare, Heart, Plus, Trash2, Download, Search, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Family, Sermon, Member } from '../../lib/database.types';
import { useToast } from '../../components/common/Toast';

export const ServantDashboardPage: React.FC = () => {
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [sermonsCount, setSermonsCount] = useState<number>(0);
  const [students, setStudents] = useState<Member[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Student quick addition form states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentStage, setStudentStage] = useState('ابتدائي');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServantDashboardData = async () => {
    try {
      const [f, s, m, settings] = await Promise.all([
        api.getFamilies(),
        api.getSermons(),
        api.getSundaySchoolStudents(),
        api.getSiteSettings(),
      ]);
      setFamilies(f);
      setSermonsCount(s.length);
      setStudents(m);
      setSiteSettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServantDashboardData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) {
      toast.error('يرجى كتابة الاسم ورقم الهاتف للمخدوم.');
      return;
    }
    setSavingStudent(true);
    try {
      const ageNum = parseInt(studentAge) || 0;
      const newStudent = await api.createMember({
        full_name: studentName.trim(),
        phone: studentPhone.trim(),
        email: null,
        service: studentStage,
        education: studentAge ? `${studentAge} سنة` : null,
        status: 'نشط',
        address: ''
      });
      setStudents(prev => [newStudent, ...prev]);
      toast.success('تمت إضافة المخدوم بنجاح!');
      setShowAddStudentModal(false);
      setStudentName('');
      setStudentPhone('');
      setStudentAge('');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إضافة المخدوم: ' + err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (deletingId) return;
    if (!window.confirm(`هل أنت متأكد من إزالة المخدوم (${name})؟`)) return;
    setDeletingId(id);
    try {
      await api.deleteMember(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('تمت إزالة المخدوم بنجاح');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الإزالة: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const visitedCount = families.filter(f => f.last_visit_date !== null).length;
  const visitPercentage = families.length > 0 ? Math.round((visitedCount / families.length) * 100) : 0;
  const urgentVisitations = families.filter(f => !f.last_visit_date).slice(0, 2);

  return (
    <DashboardLayout role="servant">
      <div className="space-y-8 font-cairo">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              لوحة تحكم الخادم المتابع
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">إعداد وتحضير مناهج مدارس الأحد ومتابعة افتقاد وغياب المخدومين</p>
          </div>
          <span className="bg-[#002366]/5 text-[#d4af37] border border-[#d4af37]/20 text-xs font-bold px-4 py-2 rounded-full font-tajawal self-start sm:self-auto shadow-sm">
            نظام الافتقاد الرقمي
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">الأسر المستهدفة بالافتقاد</span>
              <div className="p-2 bg-[#002366]/5 rounded-xl border border-[#002366]/10">
                <Users className="w-5 h-5 text-[#002366]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : families.length.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-slate-550 font-bold">بمنطقة الخدمة المحددة</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#d4af37]/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">تم افتقادهم</span>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <Heart className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : visitedCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">نسبة إنجاز {visitPercentage.toLocaleString('ar-EG')}٪</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400">دروس التحضير المرفوعة</span>
              <div className="p-2 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
              </div>
            </div>
            <p className="font-tajawal text-3xl font-extrabold text-[#002366]">
              {loading ? '...' : sermonsCount.toLocaleString('ar-EG')}
            </p>
            <p className="text-[11px] text-[#002366] font-bold">منهج النصف الأول</p>
          </div>
        </div>

        {/* Quick action card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
          
          {/* Left panel: urgent tasks & dynamic curriculums (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
              <h2 className="font-tajawal text-lg font-extrabold text-[#002366] border-b border-slate-100 pb-3">
                المهام الأسبوعية العاجلة للخدمة
              </h2>
              <div className="space-y-3.5 text-xs font-semibold">
                {loading ? (
                  <p className="text-slate-400 text-center py-4">جاري التحميل...</p>
                ) : urgentVisitations.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">لا توجد مهام عاجلة. جميع الأسر تم افتقادها!</p>
                ) : (
                  urgentVisitations.map(f => (
                    <div key={f.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                      <CheckSquare className="w-5 h-5 text-[#d4af37] shrink-0" />
                      <div>
                        <p className="font-bold text-[#002366]">افتكاد أسرة أ/ {f.head_name}</p>
                        <p className="text-slate-550 mt-0.5">المنطقة والشارع: {f.area} — الحالة مستعجلة</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic Curriculums Download */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="font-tajawal text-base font-extrabold text-[#002366] border-b border-slate-100 pb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
                <span>مناهج وأدلة الخدمة الرقمية</span>
              </h2>
              
              <div className="space-y-3 text-xs font-bold font-tajawal">
                {/* infants */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج الملائكة (حضانة)</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">قصص تفاعلية، تلوين ووسائل إيضاح مجسمة.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_infants_url || '#'}
                    onClick={e => !siteSettings.curriculum_infants_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {/* primary */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج ابتدائي</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">دروس العقيدة والطقوس المبسط والأنشطة والمسابقات.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_primary_url || '#'}
                    onClick={e => !siteSettings.curriculum_primary_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                {/* prep/sec */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-slate-700 font-extrabold">منهج إعدادي وثانوي</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-relaxed font-cairo">دراسات كتابية، دفاعيات مبسطة وحلقات نقاش اجتماعية.</p>
                  </div>
                  <a
                    href={siteSettings.curriculum_prep_url || '#'}
                    onClick={e => !siteSettings.curriculum_prep_url && (e.preventDefault(), alert('رابط المنهج غير متاح حالياً. يرجى مراجعة المسؤول.'))}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] p-2 rounded-lg transition-colors shadow"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Sunday School students CRUD (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-tajawal font-extrabold text-base text-[#002366] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span>سجل الطلاب والمخدومين (الولاد)</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">إجمالي المسجلين: {students.length} طالب</p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={e => setStudentSearchTerm(e.target.value)}
                  placeholder="بحث عن طالب..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] outline-none focus:border-[#002366] font-semibold w-full sm:w-44"
                />
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-bold text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب</span>
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-slate-400 text-xs py-12 font-bold">جاري تحميل سجل المخدومين...</p>
            ) : students.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-12 font-bold">لا يوجد مخدومين مسجلين بسجلك حالياً.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 font-tajawal">
                      <th className="p-3 rounded-r-xl">الاسم</th>
                      <th className="p-3">المرحلة</th>
                      <th className="p-3">العمر</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3 rounded-l-xl text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {students
                      .filter(s => s.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                      .map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-[#002366]">{s.full_name}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {s.service || 'غير محدد'}
                            </span>
                          </td>
                          <td className="p-3">{s.education || '—'}</td>
                          <td className="p-3 font-mono">{s.phone}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.full_name)}
                              disabled={deletingId === s.id}
                              className="text-rose-500 hover:bg-rose-50 p-1 rounded disabled:opacity-40"
                              title="حذف الطالب"
                            >
                              <Trash2 className={`w-4 h-4 ${deletingId === s.id ? 'animate-pulse' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-right font-cairo">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#00174a] text-white">
              <h2 className="font-tajawal font-bold text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-[#fed65b]" />
                <span>إضافة مخدوم جديد لمدارس الأحد</span>
              </h2>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-350 hover:text-white p-1 rounded-full transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4 text-slate-700">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">اسم المخدوم بالكامل *</label>
                <input 
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="مثال: يوحنا أمجد فريد"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">رقم الهاتف الموبايل *</label>
                <input 
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={e => setStudentPhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">العمر (سنوات)</label>
                  <input 
                    type="number"
                    value={studentAge}
                    onChange={e => setStudentAge(e.target.value)}
                    placeholder="مثال: 12"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">المرحلة الدراسية</label>
                  <select
                    value={studentStage}
                    onChange={e => setStudentStage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-bold"
                  >
                    <option value="حضانة">حضانة (الملائكة)</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="إعدادي">إعدادي</option>
                    <option value="ثانوي">ثانوي</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  disabled={savingStudent}
                  className="flex-grow bg-[#00174a] text-[#fed65b] font-bold py-2.5 rounded-xl hover:bg-[#002366] transition-all shadow-md text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingStudent ? 'جاري الحفظ...' : 'إضافة المخدوم'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddStudentModal(false)}
                  className="bg-white border border-slate-200 text-slate-650 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 text-xs"
                >
                  <span>إلغاء</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

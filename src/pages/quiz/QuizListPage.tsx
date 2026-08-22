import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type Quiz, type QuizQuestionOption } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Plus,
  Play,
  Trash2,
  Clock,
  Sparkles,
  HelpCircle,
  Trophy,
  Users,
  Search,
  CheckCircle2,
  X,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

export const QuizListPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Quiz Form State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [questions, setQuestions] = useState<Array<{
    question_text: string;
    question_type: 'quiz' | 'mcq' | 'true_false' | 'type_answer' | 'blur_image' | 'poll' | 'slider';
    image_url: string;
    time_limit: number;
    points: number;
    options: QuizQuestionOption[];
  }>>([
    {
      question_text: 'سؤال 1: من هو أول من بنى الفلك؟',
      question_type: 'quiz',
      image_url: '',
      time_limit: 20,
      points: 1000,
      options: [
        { id: '1', text: 'نوح النبي', is_correct: true, color: '#e21b3c' },
        { id: '2', text: 'إبراهيم الخليل', is_correct: false, color: '#1368ce' },
        { id: '3', text: 'موسى النبي', is_correct: false, color: '#d89e00' },
        { id: '4', text: 'داود الملك', is_correct: false, color: '#26890c' },
      ]
    }
  ]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

// Helper to compress uploaded images via Canvas (Max 800px, 70% quality JPEG)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) return;

    try {
      const formattedQuestions = questions.map((q, idx) => {
        // Map types safely to 'mcq' or 'true_false' to satisfy Supabase CHECK constraint
        let dbType = q.question_type;
        if (dbType !== 'mcq' && dbType !== 'true_false') {
          dbType = 'mcq';
        }
        return {
          ...q,
          question_type: dbType,
          position: idx,
          image_url: q.image_url.trim() || null
        };
      });

      const newQuiz = await api.createQuiz(
        {
          title: quizTitle.trim(),
          description: quizDesc.trim() || null,
          created_by: profile?.id || null
        },
        formattedQuestions
      );
      setIsModalOpen(false);
      setQuizTitle('');
      setQuizDesc('');
      fetchQuizzes();
    } catch (err: any) {
      console.error('Error creating quiz:', err);
      alert(`حدث خطأ أثناء إنشاء المسابقة: ${err.message || err.details || JSON.stringify(err)}`);
    }
  };

  const handleStartGame = async (quizId: string) => {
    try {
      const session = await api.createQuizSession(quizId, profile?.id);
      navigate(`/quiz/host/${session.id}`);
    } catch (err) {
      console.error('Error starting game:', err);
      alert('فشل بدء الجلسة التفاعلية');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('هل أنت تأكد من حذف هذه المسابقة؟')) return;
    try {
      await api.deleteQuiz(quizId);
      fetchQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: `سؤال ${prev.length + 1}`,
        question_type: 'quiz',
        image_url: '',
        time_limit: 20,
        points: 1000,
        options: [
          { id: '1', text: 'خيار 1 (صحيح)', is_correct: true, color: '#e21b3c' },
          { id: '2', text: 'خيار 2', is_correct: false, color: '#1368ce' },
          { id: '3', text: 'خيار 3', is_correct: false, color: '#d89e00' },
          { id: '4', text: 'خيار 4', is_correct: false, color: '#26890c' },
        ]
      }
    ]);
  };

  return (
    <DashboardLayout role={profile?.role === 'admin' ? 'admin' : profile?.role === 'priest' ? 'priest' : 'servant'}>
      <div className="space-y-8 font-cairo">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#00123a] via-[#002366] to-[#00123a] p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-[#d4af37]/30">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#fed65b]">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <h1 className="font-tajawal font-black text-2xl sm:text-3xl text-[#fed65b]">منصة التنافس التفاعلي (كاهوت الكنيسة)</h1>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              مسابقات روحية وتفاعلية مباشرة للمخدومين بأسلوب كاهوت التنافسي المباشر بالرموز والألوان.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/quiz/play"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              دخول لاعب (رمز PIN)
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm bg-[#d4af37] hover:bg-[#c39e2d] text-[#00123a] shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إنشاء مسابقة جديدة
            </button>
          </div>
        </div>

        {/* Quizzes List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-tajawal font-bold text-xl text-[#00123a] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#d4af37]" />
              المسابقات الروحية المتاحة
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في المسابقات..."
                className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#002366]"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold">جاري تحميل المسابقات...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-[#d4af37]/10 text-[#d4af37] rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-tajawal font-bold text-lg text-[#00123a]">لا توجد مسابقات حالياً</h3>
              <p className="text-slate-400 text-xs">قم بإنشاء مسابقة روحية تفاعلية جديدة لبدء التحدي مع مخدوميك</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded-2xl font-bold text-xs bg-[#00123a] text-white hover:bg-[#002366] transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#d4af37]" />
                إنشاء أول مسابقة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes
                .filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(quiz => (
                  <div key={quiz.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-[11px] rounded-xl flex items-center gap-1">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          تفاعلي مباشر
                        </span>

                        {(profile?.role === 'admin' || profile?.role === 'priest' || quiz.created_by === profile?.id) && (
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <h3 className="font-tajawal font-bold text-lg text-[#00123a] line-clamp-1">{quiz.title}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">{quiz.description || 'مسابقة روحية تشمل أسئلة كتابية وطقسية.'}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(quiz.created_at).toLocaleDateString('ar-EG')}
                      </span>

                      <button
                        onClick={() => handleStartGame(quiz.id)}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-[#00123a] to-[#002366] text-[#fed65b] hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-[#fed65b]" />
                        بدء المسابقة
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Modal Create Quiz */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative border border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-1">
                <h3 className="font-tajawal font-bold text-xl text-[#00123a] flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-[#d4af37]" />
                  إنشاء مسابقة كاهوت جديدة
                </h3>
                <p className="text-xs text-slate-400 font-semibold">أدخل عنوان المسابقة والأسئلة التفاعلية</p>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المسابقة</label>
                    <input
                      type="text"
                      required
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="مثال: مسابقة سفر التكيوين والطقس الكنسي"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الوصف أو التفاصيل</label>
                    <input
                      type="text"
                      value={quizDesc}
                      onChange={(e) => setQuizDesc(e.target.value)}
                      placeholder="وصف مختصر لموضوع المسابقة..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#002366]"
                    />
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold font-tajawal text-sm text-[#00123a]">قائمة الأسئلة ({questions.length})</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-xs font-bold text-[#002366] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> إضافة سؤال جديد
                    </button>
                  </div>

                  <div className="space-y-4 max-h-60 overflow-y-auto pl-2">
                    {questions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#00123a]">السؤال {idx + 1}</span>
                          <span className="text-[10px] font-bold text-slate-400">{q.time_limit} ثانية</span>
                        </div>

                        <input
                          type="text"
                          required
                          value={q.question_text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          placeholder="نص السؤال..."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">نوع السؤال</label>
                            <select
                              value={q.question_type}
                              onChange={(e) => {
                                const type = e.target.value as any;
                                setQuestions(prev => prev.map((item, i) => {
                                  if (i !== idx) return item;
                                  let opts = item.options;
                                  if (type === 'true_false') {
                                    opts = [
                                      { id: '1', text: 'صواب (صح)', is_correct: true, color: '#1368ce' },
                                      { id: '2', text: 'خطأ', is_correct: false, color: '#e21b3c' }
                                    ];
                                  } else if (type === 'type_answer') {
                                    opts = [
                                      { id: '1', text: 'الإجابة النموذجية الصحيحة', is_correct: true, color: '#26890c' }
                                    ];
                                  }
                                  return { ...item, question_type: type, options: opts };
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              <option value="quiz">اختيار متعدد (Quiz MCQ)</option>
                              <option value="true_false">صواب أو خطأ (True / False)</option>
                              <option value="type_answer">كتابة إجابة نصية (Type Answer)</option>
                              <option value="blur_image">تدرج وضوح الصورة (Blur Image)</option>
                              <option value="poll">استطلاع رأي (Poll)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">صورة السؤال (اختياري)</label>
                            
                            <div className="space-y-2">
                              {/* File Upload Button */}
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all">
                                  <ImageIcon className="w-4 h-4 text-[#46178f]" />
                                  <span>رفع صورة من الجهاز...</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const compressedBase64 = await compressImage(file);
                                          setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, image_url: compressedBase64 } : item));
                                        } catch (err) {
                                          console.error('Failed to compress image:', err);
                                        }
                                      }
                                    }}
                                  />
                                </label>

                                {q.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, image_url: '' } : item));
                                    }}
                                    className="text-rose-600 hover:text-rose-700 text-xs font-bold px-2 py-1 bg-rose-50 rounded-lg border border-rose-200"
                                  >
                                    حذف الصورة
                                  </button>
                                )}
                              </div>

                              {/* Image Preview Thumbnail if attached */}
                              {q.image_url && (
                                <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-slate-300 shadow-sm">
                                  <img src={q.image_url} alt="Question Preview" className="w-full h-full object-cover" />
                                </div>
                              )}

                              {/* Alternative URL Input */}
                              <input
                                type="url"
                                value={q.image_url?.startsWith('data:') ? '' : q.image_url}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, image_url: url } : item));
                                }}
                                placeholder="أو ادخل رابط صورة خارجي (https://...)"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={opt.is_correct}
                                onChange={() => {
                                  setQuestions(prev => prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    return {
                                      ...item,
                                      options: item.options.map((o, oi) => ({ ...o, is_correct: oi === oIdx }))
                                    };
                                  }));
                                }}
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuestions(prev => prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    return {
                                      ...item,
                                      options: item.options.map((o, oi) => oi === oIdx ? { ...o, text: val } : o)
                                    };
                                  }));
                                }}
                                className="w-full text-xs font-semibold outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl font-bold text-xs bg-[#00123a] text-white hover:bg-[#002366]"
                  >
                    حفظ ونشر المسابقة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

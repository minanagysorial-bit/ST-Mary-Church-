import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, type QuizSession, type QuizQuestion, type QuizPlayer } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  Gamepad2,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';

const toPlayerQuestion = (q: QuizQuestion): QuizQuestion => ({
  ...q,
  options: (q.options || []).map(opt => ({
    id: opt.id,
    text: opt.text,
    is_correct: false,
    color: opt.color,
  })),
});

type BroadcastQuestionPayload = {
  id?: string;
  question_id?: string;
  question_text?: string;
  question_type?: QuizQuestion['question_type'];
  options?: Array<{ id: string; text: string }>;
  points?: number;
  time_limit?: number;
  image_url?: string | null;
};

export const QuizPlayerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState(searchParams.get('pin') || '');
  const [nickname, setNickname] = useState('');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [player, setPlayer] = useState<QuizPlayer | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const questionsRef = React.useRef<QuizQuestion[]>([]);
  const playerIdRef = React.useRef<string | null>(null);
  const lastStartedQuestionRef = React.useRef<string | null>(null);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    playerIdRef.current = player?.id ?? null;
  }, [player?.id]);

  const applyQuestionStart = React.useCallback((
    qIdx: number,
    broadcastQuestion?: BroadcastQuestionPayload
  ) => {
    const localQ = questionsRef.current[qIdx];
    const broadcastId = broadcastQuestion?.question_id || broadcastQuestion?.id;
    const nextQuestion = broadcastId
      ? {
          id: broadcastId,
          quiz_id: localQ?.quiz_id || '',
          question_text: broadcastQuestion?.question_text || localQ?.question_text || '',
          question_type: (broadcastQuestion?.question_type || localQ?.question_type || 'quiz') as QuizQuestion['question_type'],
          options: (broadcastQuestion?.options || localQ?.options || []).map(opt => ({
            id: opt.id,
            text: opt.text,
            is_correct: false,
          })),
          points: broadcastQuestion?.points ?? localQ?.points ?? 1000,
          time_limit: broadcastQuestion?.time_limit ?? localQ?.time_limit ?? 20,
          position: qIdx,
          image_url: broadcastQuestion?.image_url ?? localQ?.image_url ?? null,
          created_at: localQ?.created_at || '',
        }
      : localQ
        ? toPlayerQuestion(localQ)
        : null;

    if (!nextQuestion) {
      console.warn('QUESTION_START ignored: missing question at index', qIdx);
      return;
    }

    // type_answer may have no options; other types need choices
    if (nextQuestion.question_type !== 'type_answer' && !nextQuestion.options?.length) {
      console.warn('QUESTION_START ignored: missing options at index', qIdx);
      return;
    }

    setSession(prev => prev
      ? { ...prev, status: 'question_active', current_question_index: qIdx }
      : null
    );
    setCurrentQuestion(nextQuestion);

    // Don't wipe an in-progress answer if the same question is synced again
    if (lastStartedQuestionRef.current !== nextQuestion.id) {
      lastStartedQuestionRef.current = nextQuestion.id;
      setHasAnswered(false);
      setLastAnswerCorrect(null);
      setTypedAnswer('');
    }
  }, []);

  const syncFromSessionRow = React.useCallback((latest: QuizSession) => {
    setSession(prev => prev ? { ...prev, ...latest } : latest);

    if (latest.status === 'get_ready') {
      lastStartedQuestionRef.current = null;
      setHasAnswered(false);
      setLastAnswerCorrect(null);
      setTypedAnswer('');
      return;
    }

    if (latest.status === 'question_active') {
      applyQuestionStart(latest.current_question_index || 0);
    }
  }, [applyQuestionStart]);

  // Reconnection and session states recovery
  useEffect(() => {
    const recoverSessionData = async () => {
      const storedPlayerStr = sessionStorage.getItem('quiz_player');
      const storedSessionStr = sessionStorage.getItem('quiz_session');
      if (storedPlayerStr && storedSessionStr) {
        try {
          const parsedPlayer = JSON.parse(storedPlayerStr);
          const parsedSession = JSON.parse(storedSessionStr);

          // Get latest session details from database
          const latestSess = await api.getQuizSessionById(parsedSession.id);
          if (latestSess && latestSess.status !== 'finished') {
            setPlayer(parsedPlayer);

            // Fetch questions list to sync count and active state
            const { questions: qs } = await api.getQuizWithQuestions(latestSess.quiz_id);
            setQuestions(qs);
            questionsRef.current = qs;
            setTotalQuestionsCount(qs.length);

            syncFromSessionRow(latestSess);

            if (qs.length > 0 && latestSess.status === 'question_active') {
              const activeQ = qs[latestSess.current_question_index || 0];
              if (activeQ) {
                const answers = await api.getSessionAnswers(latestSess.id);
                const pastAns = answers.find(
                  a => a.player_id === parsedPlayer.id && a.question_id === activeQ.id
                );
                if (pastAns) {
                  setHasAnswered(true);
                  setLastAnswerCorrect(pastAns.is_correct);
                  setPointsEarned(pastAns.points_earned);
                }
              }
            }
          } else {
            // Room finished, clear storage
            sessionStorage.removeItem('quiz_player');
            sessionStorage.removeItem('quiz_session');
          }
        } catch (err) {
          console.error('Failed to recover player credentials:', err);
        }
      }
    };
    recoverSessionData();
  }, [syncFromSessionRow]);

  // Realtime Broadcast + session row sync (broadcast alone is unreliable)
  useEffect(() => {
    if (!session?.id || !playerIdRef.current) return;

    const sessionId = session.id;
    const playerId = playerIdRef.current;
    const nickname = player?.nickname;

    const channel = supabase.channel(`quiz_session_${sessionId}`, {
      config: {
        broadcast: { ack: true },
        presence: {
          key: playerId,
        },
      },
    });

    channel
      .on('broadcast', { event: 'GET_READY' }, (payload: any) => {
        const data = payload?.payload ?? payload;
        const qIdx = data?.current_question_index ?? 0;
        lastStartedQuestionRef.current = null;
        setSession(prev => prev ? { ...prev, status: 'get_ready', current_question_index: qIdx } : null);
        setHasAnswered(false);
        setLastAnswerCorrect(null);
        setTypedAnswer('');
      })
      .on('broadcast', { event: 'QUESTION_START' }, (payload: any) => {
        const data = payload?.payload ?? payload;
        applyQuestionStart(data?.current_question_index ?? 0, {
          id: data?.question_id,
          question_type: data?.question_type,
          options: data?.options,
          points: data?.points,
          time_limit: data?.time_limit,
          image_url: data?.image_url,
          question_text: data?.question_text,
        });
      })
      .on('broadcast', { event: 'QUESTION_END' }, () => {
        setHasAnswered(true);
      })
      .on('broadcast', { event: 'LEADERBOARD' }, () => {
        setSession(prev => prev ? { ...prev, status: 'question_leaderboard' } : null);
      })
      .on('broadcast', { event: 'GAME_FINISHED' }, () => {
        setSession(prev => prev ? { ...prev, status: 'finished' } : null);
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quiz_sessions', filter: `id=eq.${sessionId}` },
        (payload: any) => {
          const row = payload.new as QuizSession | undefined;
          if (row) syncFromSessionRow(row);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && nickname) {
          await channel.track({ player_id: playerId, nickname });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, player?.id, player?.nickname, applyQuestionStart, syncFromSessionRow]);

  // Polling fallback while waiting / get_ready so players never miss question_active
  useEffect(() => {
    if (!session?.id || !player) return;
    if (session.status !== 'waiting' && session.status !== 'get_ready') return;

    let cancelled = false;
    const tick = async () => {
      try {
        const latest = await api.getQuizSessionById(session.id);
        if (!cancelled && latest) syncFromSessionRow(latest);
      } catch (err) {
        console.error('Session poll failed:', err);
      }
    };

    const interval = setInterval(tick, 1000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.id, session?.status, player, syncFromSessionRow]);

  // Handle joining game and saving info to storage for reconnect support
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pin.trim() || !nickname.trim()) return;

    setLoading(true);
    try {
      const sess = await api.getQuizSessionByPin(pin.trim());
      if (!sess) {
        setErrorMsg('رمز اللعبة (PIN) غير صحيح أو انتهت الجلسة');
        setLoading(false);
        return;
      }

      if (sess.status !== 'waiting') {
        setErrorMsg('المسابقة بدأت بالفعل ولا يمكن الدخول إليها حالياً');
        setLoading(false);
        return;
      }

      const newPlayer = await api.joinQuizSession(sess.id, nickname.trim());
      setSession(sess);
      setPlayer(newPlayer);

      // Save credentials in sessionStorage
      sessionStorage.setItem('quiz_player', JSON.stringify(newPlayer));
      sessionStorage.setItem('quiz_session', JSON.stringify(sess));

      // Load quiz questions for local fallback when broadcast is missed
      const { questions: qs } = await api.getQuizWithQuestions(sess.quiz_id);
      setQuestions(qs);
      questionsRef.current = qs;
      setTotalQuestionsCount(qs.length);
      if (qs.length > 0) {
        setCurrentQuestion(toPlayerQuestion(qs[sess.current_question_index || 0]));
      }
    } catch (err: any) {
      console.error('Error joining game:', err);
      setErrorMsg('تعذر الانضمام للعبة، قد يكون اسمك المستعار مستخدماً بالفعل');
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer handler calling the postgres server rpc
  const handleSelectOption = async (optionIdx: number) => {
    if (!session || !player || !currentQuestion || hasAnswered) return;

    setHasAnswered(true);
    const selectedOption = currentQuestion.options[optionIdx];

    try {
      const result = await api.submitAnswerRPC(
        session.id,
        player.id,
        currentQuestion.id,
        selectedOption?.text || ''
      );

      setLastAnswerCorrect(result.is_correct);
      setPointsEarned(result.points_earned);

      // Update local player state
      setPlayer(prev => prev ? { ...prev, score: prev.score + result.points_earned } : null);

      // Update player state in sessionStorage
      const savedPlayer = sessionStorage.getItem('quiz_player');
      if (savedPlayer) {
        const parsed = JSON.parse(savedPlayer);
        parsed.score += result.points_earned;
        sessionStorage.setItem('quiz_player', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleTypedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim() || !session || !player || !currentQuestion || hasAnswered) return;

    setHasAnswered(true);

    try {
      const result = await api.submitAnswerRPC(
        session.id,
        player.id,
        currentQuestion.id,
        typedAnswer.trim()
      );

      setLastAnswerCorrect(result.is_correct);
      setPointsEarned(result.points_earned);

      // Update local player state
      setPlayer(prev => prev ? { ...prev, score: prev.score + result.points_earned } : null);

      // Update player state in sessionStorage
      const savedPlayer = sessionStorage.getItem('quiz_player');
      if (savedPlayer) {
        const parsed = JSON.parse(savedPlayer);
        parsed.score += result.points_earned;
        sessionStorage.setItem('quiz_player', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Error submitting word answer:', err);
    }
  };

  const cleanUpFinishedSession = () => {
    sessionStorage.removeItem('quiz_player');
    sessionStorage.removeItem('quiz_session');
    navigate('/quiz');
  };

  // Kahoot Classic Buttons styles & layouts
  const optionButtons = [
    { bg: 'bg-[#e21b3c] active:bg-[#c11532]', shape: '🔺', label: 'أحمر' },
    { bg: 'bg-[#1368ce] active:bg-[#0f54a8]', shape: '🔷', label: 'أزرق' },
    { bg: 'bg-[#d89e00] active:bg-[#b58400]', shape: '🟡', label: 'أصفر' },
    { bg: 'bg-[#26890c] active:bg-[#1e6d09]', shape: '🟢', label: 'أخضر' },
  ];

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-cairo flex flex-col justify-between p-4 sm:p-6 select-none" dir="rtl">
      
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-[#fed65b]" />
          <span className="font-tajawal font-bold text-base text-white">كاهوت العذراء مريم</span>
        </div>

        {player && (
          <div className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>النقاط:</span>
            <span className="font-mono text-[#fed65b] text-sm">{player.score}</span>
          </div>
        )}
      </header>

      {/* STEP 1: JOIN FORM */}
      {!player && (
        <main className="my-auto max-w-sm w-full mx-auto space-y-6 text-center">
          
          <div className="space-y-2">
            <div className="w-16 h-16 bg-[#d4af37] text-[#00123a] rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="font-tajawal font-black text-3xl text-[#fed65b]">انضمام للمسابقة الروحية</h1>
            <p className="text-xs text-slate-300">أدخل رمز اللعبة والمعرف الخاص بك لبدء اللعب</p>
          </div>

          <form onSubmit={handleJoinGame} className="bg-white text-[#00123a] p-6 rounded-3xl shadow-2xl space-y-4 text-right">
            
            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-2xl text-xs font-bold text-center border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز اللعبة (GAME PIN)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل الرمز المكون من 6 أرقام"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center font-mono font-black text-2xl tracking-widest text-[#00123a] outline-none focus:ring-2 focus:ring-[#002366]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم المستعار (Nickname)</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="اسمك أو لقبك بداخل المسابقة..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-[#00123a] outline-none focus:ring-2 focus:ring-[#002366]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl hover:scale-105 transition-all"
            >
              {loading ? 'جاري الانضمام...' : 'دخول المسابقة 🚀'}
            </button>

          </form>

        </main>
      )}

      {/* STEP 2: WAITING LOBBY IN GAME */}
      {player && session?.status === 'waiting' && (
        <main className="my-auto max-w-md w-full mx-auto text-center space-y-6">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-emerald-400 text-[#00123a] rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-tajawal font-black text-2xl text-white">أنت متصل بالمسابقة!</h2>
            <div className="bg-white/20 py-2 px-4 rounded-2xl font-bold text-lg text-[#fed65b]">
              {player.nickname}
            </div>
            <p className="text-xs text-slate-300 font-semibold animate-pulse">
              انظر للشاشة الرئيسية، في انتظار بدء الخادم للمسابقة...
            </p>
          </div>
        </main>
      )}

      {/* STEP 2.5: GET READY INTRO SCREEN */}
      {player && session?.status === 'get_ready' && (
        <main className="my-auto max-w-md w-full mx-auto text-center space-y-6">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-[#fed65b] text-[#00123a] rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="font-tajawal font-black text-2xl text-white">استعد للسؤال... 🚀</h2>
            <p className="text-xs text-slate-300 font-semibold">ركز في الشاشة الرئيسية واستعد للاختيار السريع!</p>
          </div>
        </main>
      )}

      {/* STEP 3: ACTIVE QUESTION (KAHOOT 4-COLOR BUTTONS OR TEXT INPUT) */}
      {player && session?.status === 'question_active' && currentQuestion && (
        <main className="my-auto max-w-md w-full mx-auto space-y-6">
          
          {!hasAnswered ? (
            <div className="space-y-4 text-center">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs font-bold text-slate-200">
                السؤال {session.current_question_index + 1} من {totalQuestionsCount}
              </div>

              {currentQuestion.question_type === 'type_answer' ? (
                /* Type Answer Input Box */
                <form onSubmit={handleTypedSubmit} className="bg-white text-[#00123a] p-6 rounded-3xl shadow-2xl space-y-4 text-right">
                  <label className="block text-xs font-bold text-slate-700">اكتب الإجابة النصية:</label>
                  <input
                    type="text"
                    required
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-[#00123a] outline-none focus:ring-2 focus:ring-[#002366]"
                  />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl font-black text-base bg-emerald-500 text-white shadow-xl hover:scale-105 transition-all"
                  >
                    إرسال الإجابة 🚀
                  </button>
                </form>
              ) : (
                /* Colored Shape Buttons */
                <div className={`grid ${currentQuestion.question_type === 'true_false' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {currentQuestion.options.map((opt, idx) => {
                    const btnStyle = optionButtons[idx % 4];
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(idx)}
                        className={`${btnStyle.bg} ${currentQuestion.question_type === 'true_false' ? 'h-32 sm:h-36' : 'h-40 sm:h-48'} rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 text-white border-b-8 border-black/20`}
                      >
                        <span className="text-4xl">{btnStyle.shape}</span>
                        <span className="font-tajawal font-bold text-lg line-clamp-2 px-2">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Answer Submitted Waiting Screen */
            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-[#fed65b] text-[#00123a] rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-tajawal font-black text-2xl text-white">تم تسجيل إجابتك!</h3>
              <p className="text-xs text-slate-300 font-semibold">في انتظار انتهاء الوقت وعرض النتيجة للشاشة...</p>
            </div>
          )}

        </main>
      )}

      {/* STEP 4: QUESTION LEADERBOARD / FEEDBACK */}
      {player && session?.status === 'question_leaderboard' && (
        <main className="my-auto max-w-md w-full mx-auto text-center space-y-6">
          <div className={`p-8 rounded-3xl shadow-2xl space-y-4 text-white border-4 ${
            lastAnswerCorrect === true
              ? 'bg-emerald-600 border-emerald-400'
              : lastAnswerCorrect === false
              ? 'bg-rose-600 border-rose-400'
              : 'bg-indigo-700 border-indigo-500'
          }`}>
            {lastAnswerCorrect === true ? (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto animate-bounce" />
                <h2 className="font-tajawal font-black text-3xl">إجابة صحيحة! 🎉</h2>
                <p className="font-mono font-bold text-xl text-[#fed65b]">+{pointsEarned} نقطة</p>
              </>
            ) : lastAnswerCorrect === false ? (
              <>
                <XCircle className="w-16 h-16 mx-auto" />
                <h2 className="font-tajawal font-black text-3xl">إجابة خاطئة! ❌</h2>
                <p className="text-xs text-slate-200">حاول التركيز في السؤال التالي!</p>
              </>
            ) : (
              <>
                <Clock className="w-16 h-16 mx-auto" />
                <h2 className="font-tajawal font-black text-2xl">انتهى وقت السؤال!</h2>
              </>
            )}

            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold">
              <span>إجمالي نقاطك الحالية:</span>
              <span className="font-mono text-lg text-[#fed65b]">{player.score}</span>
            </div>
          </div>
        </main>
      )}

      {/* STEP 5: GAME FINISHED */}
      {player && session?.status === 'finished' && (
        <main className="my-auto max-w-md w-full mx-auto text-center space-y-6">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-4">
            <Trophy className="w-16 h-16 text-[#fed65b] mx-auto" />
            <h2 className="font-tajawal font-black text-3xl text-white">انتهت المسابقة الروحية!</h2>
            <p className="text-sm text-slate-200">النقاط الكلية: <strong className="font-mono text-xl text-[#fed65b]">{player.score}</strong></p>
            <button
              onClick={cleanUpFinishedSession}
              className="w-full py-3 rounded-2xl font-bold text-sm bg-white text-[#00123a] hover:bg-slate-100"
            >
              الصفحة الرئيسية للمسابقات
            </button>
          </div>
        </main>
      )}

      <footer className="text-center text-[10px] text-slate-400">
        كنيسة السيدة العذراء مريم بمحرم بك - مركز الخدمة الرقمي
      </footer>

    </div>
  );
};

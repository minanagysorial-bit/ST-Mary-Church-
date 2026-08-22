import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type QuizSession, type Quiz, type QuizQuestion, type QuizPlayer, type QuizAnswer } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  Trophy,
  Users,
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Crown,
  Volume2,
  Share2,
  Zap
} from 'lucide-react';

export const QuizHostPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<QuizSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [showingLeaderboardList, setShowingLeaderboardList] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set());
  const broadcastChannelRef = React.useRef<any>(null);

  // Background Lobby Audio Handling
  useEffect(() => {
    if (session?.status === 'waiting') {
      audioRef.current = new Audio('/audio/zingoo-lobby.mp3');
      audioRef.current.loop = true;
      audioRef.current.muted = isAudioMuted;
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked until user interaction:', e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [session?.status]);

  const toggleMute = () => {
    setIsAudioMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  };

  // Fetch initial session, quiz, and questions
  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const sess = await api.getQuizSessionById(sessionId!);
      if (!sess) return;
      setSession(sess);

      const { quiz: q, questions: qs } = await api.getQuizWithQuestions(sess.quiz_id);
      setQuiz(q);
      setQuestions(qs);

      const pList = await api.getSessionPlayers(sess.id);
      setPlayers(pList);

      setLoading(false);
    } catch (err) {
      console.error('Error loading host session:', err);
    }
  };

  // Realtime Subscriptions for players, answers, presence, and broadcasts
  useEffect(() => {
    if (!session?.id) return;

    // Fetch initial list of players and answers to load correctly on refresh
    api.getSessionPlayers(session.id).then(setPlayers);
    api.getSessionAnswers(session.id).then(setAnswers);

    // Create a single unified channel for the quiz room
    const channel = supabase.channel(`quiz_session_${session.id}`, {
      config: {
        broadcast: { ack: true },
        presence: {
          key: 'host',
        },
      },
    });

    broadcastChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_players', filter: `session_id=eq.${session.id}` },
        async () => {
          const updatedPlayers = await api.getSessionPlayers(session.id);
          setPlayers(updatedPlayers);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_answers', filter: `session_id=eq.${session.id}` },
        async () => {
          const updatedAnswers = await api.getSessionAnswers(session.id);
          setAnswers(updatedAnswers);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.nickname) {
              online.add(p.nickname);
            }
          });
        });
        setOnlinePlayers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'host' });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      broadcastChannelRef.current = null;
    };
  }, [session?.id]);

  const [getReadyCount, setGetReadyCount] = useState<number>(3);
  const activatingQuestionRef = React.useRef(false);

  // Auto-skip timer when ALL online/joined players have answered!
  useEffect(() => {
    const currentQ = questions[session?.current_question_index || 0];
    if (!currentQ || session?.status !== 'question_active' || !timerActive) return;

    const currentQAnswersCount = answers.filter(a => a.question_id === currentQ.id).length;
    const activePlayersCount = players.length;

    if (activePlayersCount > 0 && currentQAnswersCount >= activePlayersCount) {
      console.log('All players in the room answered! Auto-skipping timer...');
      handleQuestionEnd();
    }
  }, [answers, players, session?.status, timerActive, session?.current_question_index, questions]);

  // Countdown timer logic for active question
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleQuestionEnd();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const sendBroadcast = async (event: string, payload: Record<string, unknown>) => {
    const channel = broadcastChannelRef.current;
    if (!channel) {
      console.error('Broadcast channel missing for event:', event);
      return;
    }
    const message = { type: 'broadcast' as const, event, payload };
    let result = await channel.send(message);
    if (result !== 'ok') {
      console.warn(`Broadcast ${event} failed (${result}), retrying...`);
      await new Promise(r => setTimeout(r, 150));
      result = await channel.send(message);
    }
    if (result !== 'ok') {
      console.error(`Broadcast ${event} failed after retry:`, result);
    }
  };

  const activateCurrentQuestion = async () => {
    if (!session) return;
    const qIdx = session.current_question_index || 0;
    const q = questions[qIdx];
    if (!q) {
      console.error('Cannot activate question: question missing at index', qIdx);
      return;
    }

    const startPayload = {
      current_question_index: qIdx,
      question_id: q.id,
      question_text: q.question_text,
      time_limit: q.time_limit,
      points: q.points,
      question_type: q.question_type,
      options: (q.options || []).map(opt => ({ id: opt.id, text: opt.text })),
      image_url: q.image_url
    };

    // Broadcast first so players aren't blocked by DB latency/failures
    await sendBroadcast('QUESTION_START', startPayload);

    setSession(prev => prev ? { ...prev, status: 'question_active' } : null);
    setTimeLeft(q.time_limit || 20);
    setTimerActive(true);

    try {
      await api.updateQuizSessionStatus(session.id, 'question_active', qIdx);
    } catch (err) {
      console.error('Failed to persist question_active status (continuing locally):', err);
    }
  };

  // Get Ready countdown → then activate question (outside setState to avoid stuck-at-0)
  useEffect(() => {
    if (session?.status !== 'get_ready') {
      activatingQuestionRef.current = false;
      return;
    }

    let cancelled = false;
    activatingQuestionRef.current = false;
    setGetReadyCount(3);

    const runCountdown = async () => {
      for (let count = 3; count >= 1; count--) {
        if (cancelled) return;
        setGetReadyCount(count);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (cancelled) return;

      setGetReadyCount(0);
      if (activatingQuestionRef.current) return;
      activatingQuestionRef.current = true;

      try {
        await activateCurrentQuestion();
      } catch (err) {
        console.error('Failed to activate question after countdown:', err);
        activatingQuestionRef.current = false;
      }
    };

    void runCountdown();
    return () => {
      cancelled = true;
    };
  }, [session?.status, session?.current_question_index, questions]);

  const handleStartGame = async () => {
    if (!session) return;
    try {
      await api.updateQuizSessionStatus(session.id, 'get_ready', 0);
      setSession(prev => prev ? { ...prev, status: 'get_ready', current_question_index: 0 } : null);
      await sendBroadcast('GET_READY', { current_question_index: 0 });
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleQuestionEnd = async () => {
    if (!session) return;
    setTimerActive(false);
    setTimeLeft(0);
    setShowingLeaderboardList(false); // Display answer charts first on Host Screen

    try {
      await api.updateQuizSessionStatus(session.id, 'question_leaderboard');
      setSession(prev => prev ? { ...prev, status: 'question_leaderboard' } : null);
      await sendBroadcast('QUESTION_END', { current_question_index: session.current_question_index });

      // Refresh players scores to display leaderboard
      const pList = await api.getSessionPlayers(session.id);
      setPlayers(pList);
    } catch (err) {
      console.error('Failed to end question:', err);
    }
  };

  const handleRevealLeaderboard = () => {
    setShowingLeaderboardList(true);
    void sendBroadcast('LEADERBOARD', {});
  };

  const handleNextQuestion = async () => {
    if (!session) return;
    const nextIdx = session.current_question_index + 1;
    if (nextIdx < questions.length) {
      try {
        await api.updateQuizSessionStatus(session.id, 'get_ready', nextIdx);
        setSession(prev => prev ? { ...prev, status: 'get_ready', current_question_index: nextIdx } : null);
        await sendBroadcast('GET_READY', { current_question_index: nextIdx });
      } catch (err) {
        console.error('Failed to load next question:', err);
      }
    } else {
      try {
        await api.updateQuizSessionStatus(session.id, 'finished');
        setSession(prev => prev ? { ...prev, status: 'finished' } : null);
        await sendBroadcast('GAME_FINISHED', {});
      } catch (err) {
        console.error('Failed to finish game:', err);
      }
    }
  };

  if (loading || !session || !quiz) {
    return (
      <div className="min-h-screen bg-[#46178f] flex items-center justify-center text-white font-cairo" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold font-tajawal">جاري تحميل غرفة المسابقة...</h2>
        </div>
      </div>
    );
  }

  const currentQ = questions[session.current_question_index];
  const joinUrl = `${window.location.origin}/quiz/play?pin=${session.pin}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

  // Kahoot Classic Option Colors & Icons
  const optionStyles = [
    { bg: 'bg-[#e21b3c]', border: 'border-[#c11532]', shape: '🔺', label: 'أحمر' },
    { bg: 'bg-[#1368ce]', border: 'border-[#0f54a8]', shape: '🔷', label: 'أزرق' },
    { bg: 'bg-[#d89e00]', border: 'border-[#b58400]', shape: '🟡', label: 'أصفر' },
    { bg: 'bg-[#26890c]', border: 'border-[#1e6d09]', shape: '🟢', label: 'أخضر' },
  ];

  return (
    <div className="min-h-screen bg-[#46178f] text-white font-cairo select-none overflow-x-hidden flex flex-col justify-between" dir="rtl">
      
      {/* Top Header */}
      <header className="p-4 sm:p-6 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#d4af37] text-[#00123a] flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-tajawal font-bold text-lg text-white">{quiz.title}</h1>
            <p className="text-xs text-slate-300">منصة كاهوت الرقمية - كنيسة العذراء مريم بمحرم بك</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
            title={isAudioMuted ? "تشغيل الموسيقى" : "كتم الموسيقى"}
          >
            <Volume2 className={`w-5 h-5 ${isAudioMuted ? 'opacity-40' : 'text-[#fed65b] animate-pulse'}`} />
          </button>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] text-slate-300 block font-bold">رمز الدخول PIN</span>
            <span className="font-mono font-black text-2xl tracking-widest text-[#fed65b]">{session.pin}</span>
          </div>
        </div>
      </header>

      {/* STAGE 1: LOBBY (WAITING FOR PLAYERS) */}
      {session.status === 'waiting' && (
        <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-5xl mx-auto w-full space-y-8 my-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl w-full">
            
            {/* Left QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4 text-center border-b md:border-b-0 md:border-l border-white/10 pb-6 md:pb-0 md:pl-6">
              <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-[#d4af37]">
                <img src={qrCodeUrl} alt="Join QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-bold">امسح الكود بالكاميرا للدخول مباشرة</p>
                <p className="text-sm font-bold text-[#fed65b] mt-1 font-mono">{joinUrl}</p>
              </div>
            </div>

            {/* Right PIN Big Display & Controls */}
            <div className="space-y-6 text-center md:text-right">
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#d4af37]/20 text-[#fed65b] border border-[#d4af37]/40 inline-block">
                  غرفة الانتظار المباشرة
                </span>
                <h2 className="font-tajawal font-black text-4xl text-white">ادخل على الهاتف بالرمز</h2>
                <div className="bg-white/20 p-6 rounded-3xl border border-white/30 text-center space-y-1">
                  <span className="text-xs text-slate-300 block font-bold">GAME PIN</span>
                  <span className="font-mono font-black text-5xl sm:text-6xl tracking-widest text-[#fed65b] drop-shadow-md">
                    {session.pin}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Users className="w-5 h-5 text-[#fed65b]" />
                  <span>اللاعبون المنضمون: <strong className="text-2xl text-[#fed65b]">{players.length}</strong></span>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={players.length === 0}
                  className={`px-8 py-4 rounded-2xl font-black text-base shadow-2xl flex items-center gap-3 transition-all ${
                    players.length > 0
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:scale-105 text-[#00123a]'
                      : 'bg-slate-500/50 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-6 h-6 fill-[#00123a]" />
                  ابدأ المسابقة الآن
                </button>
              </div>
            </div>

          </div>

          {/* Joined Players Grid */}
          <div className="w-full space-y-4">
            <h3 className="font-tajawal font-bold text-lg text-slate-200 text-center">اللاعبون المتواجدون بالشاشة</h3>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              {players.length === 0 ? (
                <p className="text-slate-400 text-sm font-semibold animate-pulse">في انتظار دخول المتسابقين...</p>
              ) : (
                players.map(player => {
                  const isOnline = onlinePlayers.has(player.nickname);
                  return (
                    <div key={player.id} className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-white font-bold text-sm flex items-center gap-2 shadow-lg animate-bounce">
                      <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`}></span>
                      <span>{player.nickname}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </main>
      )}

      {/* STAGE 1.5: GET READY / QUESTION INTRO SCREEN */}
      {session.status === 'get_ready' && currentQ && (
        <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full my-auto space-y-8 text-center">
          
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl space-y-6 w-full">
            
            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full text-xs font-black bg-[#d4af37] text-[#00123a] shadow-lg inline-block">
                السؤال {session.current_question_index + 1} من {questions.length}
              </span>
              
              <h2 className="font-tajawal font-black text-3xl sm:text-4xl text-white pt-2">
                {currentQ.question_type === 'true_false' ? '⚡ صواب أو خطأ' :
                 currentQ.question_type === 'type_answer' ? '✍️ اكتب الإجابة النصية' :
                 currentQ.question_type === 'blur_image' ? '🖼️ خمن الصورة (Blur Image)' :
                 currentQ.question_type === 'poll' ? '📊 استطلاع رأي (Poll)' :
                 '🔺 🔷 اختيار متعدد (Quiz MCQ)'}
              </h2>

              <p className="text-sm text-slate-300 font-bold max-w-lg mx-auto">
                {currentQ.question_text}
              </p>
            </div>

            {/* Countdown Animated Circle */}
            <div className="w-28 h-28 rounded-full bg-[#fed65b] text-[#00123a] flex items-center justify-center mx-auto shadow-2xl animate-pulse border-4 border-white">
              <span className="font-mono font-black text-6xl">{getReadyCount}</span>
            </div>

            <p className="text-xs text-slate-300 font-semibold">استعد لتسجيل إجابتك السريعة!</p>

          </div>

        </main>
      )}

      {/* STAGE 2: ACTIVE QUESTION SCREEN */}
      {session.status === 'question_active' && currentQ && (
        <main className="flex-1 p-6 flex flex-col justify-between max-w-6xl mx-auto w-full my-auto space-y-6">
          
          {/* Question Text Card */}
          <div className="bg-white text-[#00123a] p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-3 border-4 border-[#d4af37]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>السؤال {session.current_question_index + 1} من {questions.length}</span>
              <span className="bg-[#46178f] text-white px-3 py-1 rounded-full">{currentQ.points} نقطة</span>
            </div>

            <h2 className="font-tajawal font-black text-xl sm:text-3xl leading-tight">
              {currentQ.question_text}
            </h2>

            {/* Optional Question Image / Blur Image */}
            {currentQ.image_url && (
              <div className="max-w-xs sm:max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-slate-200 shadow-md">
                <img
                  src={currentQ.image_url}
                  alt="Question Attachment"
                  className="w-full h-44 sm:h-56 object-cover transition-all duration-500"
                  style={{
                    filter: currentQ.question_type === 'blur_image'
                      ? `blur(${Math.min(20, (timeLeft / (currentQ.time_limit || 20)) * 25)}px)`
                      : 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Timer & Answers Received Progress */}
          <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#d4af37] text-[#00123a] flex items-center justify-center font-mono font-black text-xl">
                {timeLeft}
              </div>
              <span className="text-xs text-slate-300 font-bold">الوقت المتبقي (ثانية)</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-200">إجابات الاستجابة:</span>
              <span className="font-mono font-black text-2xl text-[#fed65b] bg-white/10 px-4 py-1 rounded-xl">
                {answers.filter(a => a.question_id === currentQ.id).length} / {players.length}
              </span>
            </div>

            <button
              onClick={handleQuestionEnd}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-white/20 hover:bg-white/30 text-white"
            >
              إنهاء وتخطي السؤال
            </button>
          </div>

          {/* Options Grid 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, idx) => {
              const style = optionStyles[idx % 4];
              return (
                <div
                  key={opt.id}
                  className={`${style.bg} ${style.border} border-b-8 p-6 rounded-3xl shadow-xl flex items-center gap-4 text-white`}
                >
                  <span className="text-3xl">{style.shape}</span>
                  <span className="font-tajawal font-bold text-xl sm:text-2xl">{opt.text}</span>
                </div>
              );
            })}
          </div>

        </main>
      )}

      {/* STAGE 3: QUESTION LEADERBOARD */}
      {session.status === 'question_leaderboard' && (
        <main className="flex-1 p-6 flex flex-col justify-between max-w-4xl mx-auto w-full my-auto space-y-8">
          
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl space-y-6 text-center">
            
            {!showingLeaderboardList ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fed65b]/20 text-[#fed65b] border border-[#fed65b]/30">
                    إحصائيات إجابات اللاعبين
                  </span>
                  <h2 className="font-tajawal font-black text-3xl text-white">نتائج السؤال الحالي</h2>
                </div>

                {/* Display Correct Option */}
                {currentQ?.question_type !== 'poll' && (
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-tajawal font-bold text-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>الإجابة الصحيحة هي:</span>
                    <strong>
                      {currentQ?.options?.find(o => o.is_correct)?.text || 'غير محدد'}
                    </strong>
                  </div>
                )}

                {/* Vertical Distribution Bars */}
                <div className="space-y-4 text-right">
                  {currentQ?.options?.map((opt, idx) => {
                    const style = optionStyles[idx % 4];
                    const currentQAnswers = answers.filter(a => a.question_id === currentQ.id);
                    const optAnswersCount = currentQAnswers.filter(a => a.answer === opt.text).length;
                    const totalAnswersCount = currentQAnswers.length;
                    const percent = totalAnswersCount > 0 ? (optAnswersCount / totalAnswersCount) * 100 : 0;

                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{style.shape} {opt.text} {opt.is_correct && currentQ.question_type !== 'poll' && ' (صحيحة ✅)'}</span>
                          <span>{optAnswersCount} لاعب ({Math.round(percent)}%)</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/5">
                          <div
                            className={`h-full ${style.bg} transition-all duration-1000`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleRevealLeaderboard}
                    className="px-8 py-4 rounded-2xl font-black text-base bg-[#fed65b] text-[#00123a] shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                  >
                    عرض ترتيب المتسابقين
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    جدول النقاط والترتيب الحالي
                  </span>
                  <h2 className="font-tajawal font-black text-3xl text-[#fed65b]">أفضل المتسابقين أداءً</h2>
                </div>

                {/* Top 5 Leaderboard List (Sorted descending) */}
                <div className="space-y-3">
                  {[...players]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((player, idx) => (
                      <div
                        key={player.id}
                        className="bg-white/20 p-4 rounded-2xl flex items-center justify-between border border-white/20 text-white font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-[#d4af37] text-[#00123a]' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-lg">{player.nickname}</span>
                        </div>

                        <span className="font-mono text-xl text-[#fed65b]">{player.score} نقطة</span>
                      </div>
                    ))}
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    onClick={handleNextQuestion}
                    className="px-8 py-4 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-400 to-teal-500 text-[#00123a] shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                  >
                    {session.current_question_index + 1 < questions.length ? 'الانتقال للسؤال التالي' : 'عرض المنصة النهائية والفائزين'}
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>
      )}

      {/* STAGE 4: FINAL PODIUM */}
      {session.status === 'finished' && (
        <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full my-auto space-y-8 text-center">
          
          <div className="space-y-3">
            <div className="w-16 h-16 bg-[#d4af37] text-[#00123a] rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Crown className="w-10 h-10" />
            </div>
            <h2 className="font-tajawal font-black text-4xl text-[#fed65b]">منصة التتويج والفائزين!</h2>
            <p className="text-slate-300 text-sm font-semibold">تهانينا لجميع أبطال المسابقة الروحية</p>
          </div>

          {/* Podium Visual */}
          <div className="flex items-end justify-center gap-4 w-full max-w-xl pt-10">
            {/* 2nd Place */}
            {[...players].sort((a,b)=>b.score-a.score)[1] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-white/20 p-3 rounded-2xl mb-2 font-bold text-center border border-white/20 w-full">
                  <p className="text-xs text-slate-300">المركز 2</p>
                  <p className="font-bold text-sm text-white truncate">{[...players].sort((a,b)=>b.score-a.score)[1].nickname}</p>
                  <p className="text-xs text-[#fed65b] font-mono">{[...players].sort((a,b)=>b.score-a.score)[1].score} نقطة</p>
                </div>
                <div className="w-full h-36 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-2xl flex items-center justify-center font-black text-2xl text-slate-900 shadow-xl">
                  2
                </div>
              </div>
            )}

            {/* 1st Place */}
            {[...players].sort((a,b)=>b.score-a.score)[0] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-[#d4af37] text-[#00123a] p-4 rounded-2xl mb-2 font-bold text-center shadow-2xl w-full border-2 border-white">
                  <Crown className="w-6 h-6 mx-auto text-[#00123a] mb-1" />
                  <p className="text-xs font-black">المركز 1 (البطل)</p>
                  <p className="font-black text-base truncate">{[...players].sort((a,b)=>b.score-a.score)[0].nickname}</p>
                  <p className="text-xs font-mono font-bold">{[...players].sort((a,b)=>b.score-a.score)[0].score} نقطة</p>
                </div>
                <div className="w-full h-48 bg-gradient-to-t from-[#d4af37] to-[#fed65b] rounded-t-2xl flex items-center justify-center font-black text-3xl text-[#00123a] shadow-2xl">
                  1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {[...players].sort((a,b)=>b.score-a.score)[2] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-white/20 p-3 rounded-2xl mb-2 font-bold text-center border border-white/20 w-full">
                  <p className="text-xs text-slate-300">المركز 3</p>
                  <p className="font-bold text-sm text-white truncate">{[...players].sort((a,b)=>b.score-a.score)[2].nickname}</p>
                  <p className="text-xs text-[#fed65b] font-mono">{[...players].sort((a,b)=>b.score-a.score)[2].score} نقطة</p>
                </div>
                <div className="w-full h-28 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl">
                  3
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/quiz')}
            className="px-8 py-3.5 rounded-2xl font-bold text-sm bg-white text-[#00123a] hover:bg-slate-100 shadow-xl"
          >
            العودة لكتالوج المسابقات
          </button>

        </main>
      )}

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 border-t border-white/10">
        St. Mary Moharam Bek Digital Hub &copy; 2026 Kahoot Gamification Engine
      </footer>

    </div>
  );
};

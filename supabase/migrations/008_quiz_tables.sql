-- ===================================================================
-- MIGRATION 008: Kahoot Interactive Quiz System
-- ===================================================================

-- 1. Quizzes
CREATE TABLE public.quizzes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Quiz Questions
CREATE TABLE public.quiz_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id       UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'quiz' CHECK (question_type IN ('quiz', 'mcq', 'true_false', 'type_answer', 'blur_image', 'poll', 'slider')),
  options       JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of { id, text, is_correct, color }
  time_limit    INT NOT NULL DEFAULT 20, -- in seconds
  points        INT NOT NULL DEFAULT 1000,
  position      INT NOT NULL DEFAULT 0,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Quiz Sessions (Active Game Sessions)
CREATE TABLE public.quiz_sessions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id                UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  pin                    TEXT NOT NULL UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'get_ready', 'question_active', 'question_leaderboard', 'finished')),
  current_question_index INT NOT NULL DEFAULT 0,
  host_id                UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Quiz Players
CREATE TABLE public.quiz_players (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,
  avatar_url TEXT,
  score      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, nickname)
);

-- 5. Quiz Answers
CREATE TABLE public.quiz_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.quiz_players(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer        TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  time_taken    FLOAT NOT NULL DEFAULT 0,
  points_earned INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id, question_id)
);

-- ===================================================================
-- INDEXES & REALTIME ENABLING
-- ===================================================================
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, position);
CREATE INDEX idx_quiz_sessions_pin ON public.quiz_sessions(pin);
CREATE INDEX idx_quiz_players_session ON public.quiz_players(session_id);
CREATE INDEX idx_quiz_answers_session ON public.quiz_answers(session_id);

-- Enable Supabase Realtime for game lobby & play
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quizzes_update" ON public.quizzes FOR UPDATE USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest'));
CREATE POLICY "quizzes_delete" ON public.quizzes FOR DELETE USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'priest'));

CREATE POLICY "questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_insert" ON public.quiz_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "questions_update" ON public.quiz_questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "questions_delete" ON public.quiz_questions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "sessions_select" ON public.quiz_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON public.quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON public.quiz_sessions FOR UPDATE USING (true);

CREATE POLICY "players_select" ON public.quiz_players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON public.quiz_players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON public.quiz_players FOR UPDATE USING (true);

CREATE POLICY "answers_select" ON public.quiz_answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON public.quiz_answers FOR INSERT WITH CHECK (true);

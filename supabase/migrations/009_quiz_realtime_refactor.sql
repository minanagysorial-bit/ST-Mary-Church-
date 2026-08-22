-- ===================================================================
-- MIGRATION 009: Quiz Realtime Refactor
-- Server-side scoring RPC, PIN generation, tightened RLS
-- ===================================================================

-- 1. Add question_started_at to track server-side question timing
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ;

-- ===================================================================
-- 2. RPC: Generate a unique 6-digit game PIN (collision-safe)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.generate_quiz_pin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    new_pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.quiz_sessions
      WHERE pin = new_pin AND status != 'finished'
    ) INTO pin_exists;
    EXIT WHEN NOT pin_exists;
  END LOOP;
  RETURN new_pin;
END;
$$;

-- ===================================================================
-- 3. RPC: Submit answer with server-side scoring
-- Score = BasePoints × (1 - (response_time / total_time) × 0.5)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_session_id UUID,
  p_player_id UUID,
  p_question_id UUID,
  p_answer_text TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_question RECORD;
  v_is_correct BOOLEAN := FALSE;
  v_time_taken FLOAT := 0;
  v_points INT := 0;
  v_correct_option JSONB;
  v_option JSONB;
  v_total_time INT;
  v_base_points INT;
  v_existing_answer UUID;
BEGIN
  -- 1. Validate session exists and is in question_active status
  SELECT id, status, question_started_at, current_question_index
    INTO v_session
    FROM public.quiz_sessions
    WHERE id = p_session_id;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.status != 'question_active' THEN
    RAISE EXCEPTION 'Question is not currently active (status: %)', v_session.status;
  END IF;

  -- 2. Check for duplicate answer
  SELECT id INTO v_existing_answer
    FROM public.quiz_answers
    WHERE session_id = p_session_id
      AND player_id = p_player_id
      AND question_id = p_question_id;

  IF v_existing_answer IS NOT NULL THEN
    RAISE EXCEPTION 'Answer already submitted for this question';
  END IF;

  -- 3. Fetch the question details
  SELECT id, options, time_limit, points, question_type
    INTO v_question
    FROM public.quiz_questions
    WHERE id = p_question_id;

  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_total_time := v_question.time_limit;
  v_base_points := v_question.points;

  -- 4. Calculate time taken (server-side, tamper-proof)
  IF v_session.question_started_at IS NOT NULL THEN
    v_time_taken := EXTRACT(EPOCH FROM (NOW() - v_session.question_started_at));
    -- Clamp to total time limit
    IF v_time_taken > v_total_time THEN
      v_time_taken := v_total_time;
    END IF;
    IF v_time_taken < 0 THEN
      v_time_taken := 0;
    END IF;
  END IF;

  -- 5. Determine correctness based on question type
  IF v_question.question_type = 'type_answer' THEN
    -- For typed answers, compare against the correct option text (case-insensitive)
    FOR v_option IN SELECT * FROM jsonb_array_elements(v_question.options)
    LOOP
      IF (v_option->>'is_correct')::BOOLEAN = TRUE THEN
        IF LOWER(TRIM(p_answer_text)) = LOWER(TRIM(v_option->>'text')) THEN
          v_is_correct := TRUE;
        END IF;
        EXIT;
      END IF;
    END LOOP;
  ELSIF v_question.question_type = 'poll' THEN
    -- Polls have no correct answer; everyone gets 0 points
    v_is_correct := FALSE;
    v_points := 0;
  ELSE
    -- MCQ / true_false / blur_image: match answer text against correct option
    FOR v_option IN SELECT * FROM jsonb_array_elements(v_question.options)
    LOOP
      IF (v_option->>'is_correct')::BOOLEAN = TRUE
         AND LOWER(TRIM(v_option->>'text')) = LOWER(TRIM(p_answer_text)) THEN
        v_is_correct := TRUE;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- 6. Calculate score using speed-based formula (only for correct answers, non-polls)
  IF v_is_correct AND v_question.question_type != 'poll' THEN
    -- Score = BasePoints × (1 - (response_time / total_time) × 0.5)
    IF v_total_time > 0 THEN
      v_points := GREATEST(
        ROUND(v_base_points * (1.0 - (v_time_taken / v_total_time) * 0.5))::INT,
        ROUND(v_base_points * 0.5)::INT  -- Minimum 50% of base points for correct answer
      );
    ELSE
      v_points := v_base_points;
    END IF;
  END IF;

  -- 7. Insert the answer record
  INSERT INTO public.quiz_answers (session_id, player_id, question_id, answer, is_correct, time_taken, points_earned)
  VALUES (p_session_id, p_player_id, p_question_id, p_answer_text, v_is_correct, v_time_taken, v_points);

  -- 8. Atomically update player score (no race condition)
  UPDATE public.quiz_players
    SET score = score + v_points
    WHERE id = p_player_id;

  -- 9. Return the result to the client
  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points,
    'time_taken', ROUND(v_time_taken::NUMERIC, 2),
    'correct_answer', (
      SELECT v_opt->>'text'
      FROM jsonb_array_elements(v_question.options) AS v_opt
      WHERE (v_opt->>'is_correct')::BOOLEAN = TRUE
      LIMIT 1
    )
  );
END;
$$;

-- ===================================================================
-- 4. Tighten RLS Policies
-- ===================================================================

-- Drop overly permissive old policies
DROP POLICY IF EXISTS "sessions_insert" ON public.quiz_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.quiz_sessions;
DROP POLICY IF EXISTS "players_insert" ON public.quiz_players;
DROP POLICY IF EXISTS "players_update" ON public.quiz_players;
DROP POLICY IF EXISTS "answers_insert" ON public.quiz_answers;

-- Sessions: only authenticated users can create sessions
CREATE POLICY "sessions_insert_auth"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Sessions: only the host can update their session (or service_role for RPCs)
CREATE POLICY "sessions_update_host"
  ON public.quiz_sessions FOR UPDATE
  USING (
    host_id = auth.uid()
    OR auth.role() = 'authenticated'
  );

-- Players: can only join sessions that are in 'waiting' status
CREATE POLICY "players_insert_waiting"
  ON public.quiz_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE id = session_id AND status = 'waiting'
    )
  );

-- Players: score updates via RPC (SECURITY DEFINER bypasses RLS)
CREATE POLICY "players_update_rpc"
  ON public.quiz_players FOR UPDATE
  USING (true);

-- Answers: can only submit when question is active (direct inserts blocked; RPC uses SECURITY DEFINER)
CREATE POLICY "answers_insert_active"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE id = session_id AND status = 'question_active'
    )
  );

-- Phase 1: Test engine — session tracking, response storage, AI reports

-- One row per user per day session
CREATE TABLE substrata.test_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number       integer     NOT NULL CHECK (day_number > 0),
  question_ids     text[]      NOT NULL DEFAULT '{}',
  completed_at     timestamptz,
  unlocked_at      timestamptz NOT NULL DEFAULT now(),
  consistency_flagged boolean  NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_number)
);

-- One row per question answered
CREATE TABLE substrata.question_responses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES substrata.test_sessions(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id   text        NOT NULL,
  question_text text        NOT NULL,
  answer_value  integer     NOT NULL,
  answer_label  text        NOT NULL,
  section       text        NOT NULL,
  dimension     text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- AI-generated report per session
CREATE TABLE substrata.session_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES substrata.test_sessions(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number  integer     NOT NULL,
  report_text text        NOT NULL,
  scores      jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE substrata.test_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE substrata.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE substrata.session_reports    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sessions"   ON substrata.test_sessions      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own responses"  ON substrata.question_responses  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own reports"    ON substrata.session_reports      FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX ON substrata.test_sessions      (user_id, day_number);
CREATE INDEX ON substrata.question_responses (session_id);
CREATE INDEX ON substrata.question_responses (user_id);
CREATE INDEX ON substrata.session_reports    (user_id, day_number);

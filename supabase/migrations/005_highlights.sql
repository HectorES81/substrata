-- User highlights from analysis text
-- Three action types: personal note, context correction for AI, concept exploration

CREATE TABLE substrata.highlights (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number    integer     NOT NULL,
  section       text        NOT NULL,
  text          text        NOT NULL,
  note          text,              -- personal reflection (shown in saved notes)
  context       text,             -- AI correction fed back into future sessions
  concept_name  text,             -- AI-identified concept name
  concept_text  text,             -- AI concept explanation
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE substrata.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own highlights" ON substrata.highlights FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON substrata.highlights TO anon, authenticated, service_role;

CREATE INDEX ON substrata.highlights (user_id, day_number);

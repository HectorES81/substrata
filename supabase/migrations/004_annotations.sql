-- User annotations per section — context added after reading AI interpretation
-- Fed back into subsequent session prompts

CREATE TABLE substrata.section_annotations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer     NOT NULL,
  section    text        NOT NULL,
  annotation text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_number, section)
);

ALTER TABLE substrata.section_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own annotations" ON substrata.section_annotations FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON substrata.section_annotations TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA substrata GRANT ALL ON TABLES TO anon, authenticated, service_role;

CREATE INDEX ON substrata.section_annotations (user_id, day_number);

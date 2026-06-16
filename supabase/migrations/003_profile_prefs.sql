-- User preferences: language mode, reading layout, demographic context
-- All stored on substrata.profiles

ALTER TABLE substrata.profiles
  ADD COLUMN IF NOT EXISTS language_mode   text NOT NULL DEFAULT 'direct'
    CHECK (language_mode IN ('plain', 'direct', 'clinical')),
  ADD COLUMN IF NOT EXISTS reading_prefs   jsonb NOT NULL DEFAULT '{}',
  -- Demographic context (set before Day 1, shapes AI framing)
  ADD COLUMN IF NOT EXISTS relationship_status text
    CHECK (relationship_status IN ('single_looking', 'single_not_looking', 'partnered', 'married', 'open', 'complicated', 'prefer_not')),
  ADD COLUMN IF NOT EXISTS age_range       text
    CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  ADD COLUMN IF NOT EXISTS gender_identity text,   -- free text
  ADD COLUMN IF NOT EXISTS has_kids        boolean,
  ADD COLUMN IF NOT EXISTS life_focus      text
    CHECK (life_focus IN ('self_development', 'finding_partner', 'relationship_growth', 'career', 'other')),
  ADD COLUMN IF NOT EXISTS context_set     boolean NOT NULL DEFAULT false;

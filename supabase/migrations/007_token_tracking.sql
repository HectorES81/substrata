-- Track cumulative AI output tokens per user for the $1 spending cap
ALTER TABLE substrata.profiles
  ADD COLUMN IF NOT EXISTS ai_tokens_used integer NOT NULL DEFAULT 0;

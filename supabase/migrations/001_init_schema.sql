-- ============================================================
-- Substrata — Initial Schema
-- Schema: substrata
-- ============================================================

CREATE SCHEMA IF NOT EXISTS substrata;

-- ============================================================
-- profiles
-- Extends auth.users with Substrata-specific identity data.
-- One row per user. Created on first login.
-- ============================================================

CREATE TABLE substrata.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         text UNIQUE,
  display_name     text,
  confidence_score numeric(5,2) NOT NULL DEFAULT 0,
  sessions_count   integer NOT NULL DEFAULT 0,
  is_discoverable  boolean NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE substrata.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users manage own profile"
  ON substrata.profiles FOR ALL
  USING (auth.uid() = id);

-- Public profiles are readable by authenticated users (for UID sharing / bookmarks)
CREATE POLICY "Authenticated users can view discoverable profiles"
  ON substrata.profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_discoverable = true);

CREATE INDEX profiles_username_idx ON substrata.profiles(username);
CREATE INDEX profiles_confidence_idx ON substrata.profiles(confidence_score);

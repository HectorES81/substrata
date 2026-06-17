-- Replace the catch-all FOR ALL policy with explicit policies.
-- FOR ALL with only USING doesn't guarantee WITH CHECK semantics on INSERT
-- in all PostgREST versions — explicit INSERT policy is unambiguous.

DROP POLICY IF EXISTS "Users manage own profile" ON substrata.profiles;
DROP POLICY IF EXISTS "Authenticated users can view discoverable profiles" ON substrata.profiles;

CREATE POLICY "profiles_select" ON substrata.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR (auth.role() = 'authenticated' AND is_discoverable = true)
  );

CREATE POLICY "profiles_insert" ON substrata.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON substrata.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create a profile row when a new user signs up.
-- SECURITY DEFINER so the trigger can write to substrata.profiles regardless of caller role.
CREATE OR REPLACE FUNCTION public.handle_new_substrata_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO substrata.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_substrata ON auth.users;
CREATE TRIGGER on_auth_user_created_substrata
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_substrata_user();

-- Backfill: ensure every existing auth user has a profiles row
INSERT INTO substrata.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

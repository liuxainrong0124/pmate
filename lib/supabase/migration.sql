-- Pulse Supabase Migration
-- Run this in the Supabase SQL Editor: https://aunvhqabytvfcbfgtbkd.supabase.co

-- ── 1. User profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  avatar_url TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Requirements pool ──
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  module TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'done', 'cancelled')),
  assignee TEXT DEFAULT '',
  impact INTEGER DEFAULT 5 CHECK (impact BETWEEN 1 AND 10),
  effort INTEGER DEFAULT 5 CHECK (effort BETWEEN 1 AND 10),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Todos ──
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  module TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Activities ──
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  content TEXT DEFAULT '',
  participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Experiments ──
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'ended')),
  hypothesis TEXT DEFAULT '',
  goal_metric TEXT DEFAULT '',
  group_a TEXT DEFAULT '',
  group_b TEXT DEFAULT '',
  traffic_split INTEGER DEFAULT 50,
  planned_days INTEGER DEFAULT 14,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  sample_a INTEGER DEFAULT 0,
  sample_b INTEGER DEFAULT 0,
  value_a DOUBLE PRECISION DEFAULT 0,
  value_b DOUBLE PRECISION DEFAULT 0,
  lift DOUBLE PRECISION DEFAULT 0,
  confidence DOUBLE PRECISION DEFAULT 0,
  conclusion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. Versions ──
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_dev', 'released')),
  planned_date TEXT DEFAULT '',
  assignee TEXT DEFAULT '',
  requirement_ids TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  release_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7. Feedback ──
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  source TEXT DEFAULT '',
  category TEXT DEFAULT '',
  sentiment TEXT DEFAULT '' CHECK (sentiment IN ('positive', 'negative', 'neutral', '')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 8. Operation logs ──
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 9. Metric data (for cross-device data insights) ──
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  current_value DOUBLE PRECISION DEFAULT 0,
  previous_value DOUBLE PRECISION DEFAULT 0,
  change_percent DOUBLE PRECISION DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 10. Alert settings (per user) ──
CREATE TABLE IF NOT EXISTS alert_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  threshold DOUBLE PRECISION DEFAULT 10,
  auto_refresh BOOLEAN DEFAULT false,
  refresh_interval_minutes INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 11. Content / push copy history ──
CREATE TABLE IF NOT EXISTS content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  target_segment TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  style TEXT DEFAULT '',
  generated_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 12. Documents (PRD, specs, etc.) ──
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'prd' CHECK (type IN ('prd', 'spec', 'note')),
  module TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- RLS POLICIES: users can only access their own data
-- ═══════════════════════════════════════════════

-- Helper: enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'requirements', 'todos', 'activities', 'experiments',
        'versions', 'feedback', 'operation_logs', 'metrics',
        'alert_settings', 'content_history', 'documents'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Profiles: users can read all, insert own, update own
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Generic CRUD policies for all user-owned tables
-- Each table has user_id column; users can only CRUD their own rows

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'requirements', 'todos', 'activities', 'experiments',
        'versions', 'feedback', 'operation_logs', 'metrics',
        'alert_settings', 'content_history', 'documents'
      )
  LOOP
    -- SELECT own rows
    EXECUTE format(
      'CREATE POLICY "Users select own" ON %I FOR SELECT USING (auth.uid() = user_id)',
      tbl
    );
    -- INSERT own rows
    EXECUTE format(
      'CREATE POLICY "Users insert own" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)',
      tbl
    );
    -- UPDATE own rows
    EXECUTE format(
      'CREATE POLICY "Users update own" ON %I FOR UPDATE USING (auth.uid() = user_id)',
      tbl
    );
    -- DELETE own rows
    EXECUTE format(
      'CREATE POLICY "Users delete own" ON %I FOR DELETE USING (auth.uid() = user_id)',
      tbl
    );
  END LOOP;
END $$;

-- ── Triggers: auto-update updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'requirements', 'todos', 'activities', 'experiments',
        'versions', 'documents', 'metrics', 'alert_settings'
      )
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl
    );
  END LOOP;
END $$;

-- ── Trigger: auto-create profile on signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

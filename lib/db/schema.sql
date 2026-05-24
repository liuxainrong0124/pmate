-- PMate Database Schema

-- Feedback analysis history
CREATE TABLE feedback_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRD generation history
CREATE TABLE prd_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  description TEXT NOT NULL,
  template TEXT NOT NULL,
  prd_markdown TEXT NOT NULL,
  suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates for version management
CREATE TABLE prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'prd')),
  version INT NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_user_created ON feedback_history(user_id, created_at DESC);
CREATE INDEX idx_prd_user_created ON prd_history(user_id, created_at DESC);
CREATE INDEX idx_prompt_type_active ON prompt_templates(type, is_active);

-- Row Level Security
ALTER TABLE feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback" ON feedback_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own PRDs" ON prd_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PRDs" ON prd_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read active prompts" ON prompt_templates
  FOR SELECT USING (is_active = true);

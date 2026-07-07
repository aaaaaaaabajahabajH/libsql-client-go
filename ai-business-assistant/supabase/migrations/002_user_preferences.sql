-- ============================================================
-- M10 — User Preferences & Extended Profile
-- ============================================================

-- Extend profiles with additional fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username  TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS bio       TEXT,
  ADD COLUMN IF NOT EXISTS country   TEXT,
  ADD COLUMN IF NOT EXISTS timezone  TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length
    CHECK (username IS NULL OR char_length(username) BETWEEN 3 AND 30),
  ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]+$'),
  ADD CONSTRAINT profiles_bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 500),
  ADD CONSTRAINT profiles_job_title_length
    CHECK (job_title IS NULL OR char_length(job_title) <= 100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON public.profiles(username)
  WHERE username IS NOT NULL;

-- ============================================================
-- TABLE: user_preferences
-- One row per user; stores AI prefs, notification settings,
-- app theme/language, and workspace metadata.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID         NOT NULL UNIQUE
                                    REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- AI preferences
  ai_provider          TEXT         NOT NULL DEFAULT 'openai',
  ai_model             TEXT         NOT NULL DEFAULT 'gpt-4o',
  temperature          NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  max_tokens           INTEGER      NOT NULL DEFAULT 2048,
  default_language     TEXT         NOT NULL DEFAULT 'English',
  writing_tone         TEXT         NOT NULL DEFAULT 'professional',
  -- App preferences
  theme                TEXT         NOT NULL DEFAULT 'system',
  app_language         TEXT         NOT NULL DEFAULT 'en',
  -- Notification preferences
  notify_marketing     BOOLEAN      NOT NULL DEFAULT true,
  notify_billing       BOOLEAN      NOT NULL DEFAULT true,
  notify_ai_completion BOOLEAN      NOT NULL DEFAULT false,
  notify_security      BOOLEAN      NOT NULL DEFAULT true,
  -- Workspace
  workspace_name       TEXT,
  workspace_logo_url   TEXT,
  -- Timestamps
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT user_prefs_temperature_range CHECK (temperature BETWEEN 0 AND 1),
  CONSTRAINT user_prefs_max_tokens_range  CHECK (max_tokens BETWEEN 256 AND 16384),
  CONSTRAINT user_prefs_theme_valid       CHECK (theme IN ('light', 'dark', 'system')),
  CONSTRAINT user_prefs_tone_valid        CHECK (writing_tone IN ('professional','casual','friendly','formal','persuasive'))
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_self_all"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Supabase Storage: avatars bucket
-- ============================================================
-- Run this separately in the Supabase dashboard or via Storage API:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'avatars', 'avatars', true, 2097152,
--   ARRAY['image/jpeg','image/png','image/webp','image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "avatar_self_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "avatar_self_update" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "avatar_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

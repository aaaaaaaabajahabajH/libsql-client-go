-- Migration 004: Email logs, email queue, in-app notifications
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- 1. Email logs — every attempted send is recorded here
CREATE TABLE IF NOT EXISTS email_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type          TEXT NOT NULL,
  to_address          TEXT NOT NULL,
  subject             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','sent','failed','bounced')),
  provider_message_id TEXT,
  error_message       TEXT,
  retry_count         INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS email_logs_user_id_idx   ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS email_logs_status_idx    ON email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_type_idx      ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS email_logs_created_idx   ON email_logs(created_at DESC);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — accessed only via service role

-- 2. Email queue — background retry queue
CREATE TABLE IF NOT EXISTS email_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type    TEXT NOT NULL,
  to_address    TEXT NOT NULL,
  subject       TEXT NOT NULL,
  html_body     TEXT NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  retry_count   INT NOT NULL DEFAULT 0,
  max_retries   INT NOT NULL DEFAULT 3,
  status        TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','processing','sent','failed')),
  scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_queue_status_idx     ON email_queue(status);
CREATE INDEX IF NOT EXISTS email_queue_scheduled_idx  ON email_queue(scheduled_at);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — accessed only via service role

-- 3. In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('billing','ai','security','product')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_idx    ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages notifications"
  ON notifications FOR ALL
  USING (true)
  WITH CHECK (true);

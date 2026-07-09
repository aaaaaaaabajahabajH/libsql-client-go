-- Migration 003: Admin role & logs
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- 1. Add role + suspension to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'superadmin')),
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type    TEXT NOT NULL CHECK (log_type IN ('activity','auth','billing','ai','error')),
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS admin_logs_type_idx        ON admin_logs(log_type);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx  ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_user_id_idx     ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx    ON admin_logs(admin_id);

-- RLS: only service role can access admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
-- No public policies — access only via service role (admin server actions)

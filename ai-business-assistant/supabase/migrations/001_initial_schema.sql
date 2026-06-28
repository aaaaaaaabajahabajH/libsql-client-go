-- ============================================================
-- AI Business Assistant — Initial Database Schema
-- ============================================================
-- Run order: this is the single source-of-truth migration.
-- Apply via: supabase db push  (local)
--            supabase db push --linked  (remote preview)
-- ============================================================

-- UUID generation (used by uuid_generate_v4 fallback; gen_random_uuid is built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1 — ENUM TYPES
-- ============================================================

CREATE TYPE public.plan_type AS ENUM (
  'free',
  'starter',
  'pro',
  'enterprise'
);

-- Mirrors Stripe subscription status values exactly (US spelling: "canceled")
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid'
);

CREATE TYPE public.tool_type AS ENUM (
  'social-media',
  'product-description',
  'blog-writer',
  'email-writer',
  'invoice-generator',
  'translator'
);

-- ============================================================
-- SECTION 2 — UTILITY TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECTION 3 — TABLE: profiles
-- One row per auth.users entry; created automatically on signup.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  company     TEXT,
  website     TEXT,
  plan        public.plan_type NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR char_length(full_name) <= 200),
  CONSTRAINT profiles_website_length   CHECK (website   IS NULL OR char_length(website)   <= 2048)
);

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SECTION 4 — TABLE: subscriptions
-- One row per user; updated by the Stripe webhook Edge Function.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                    public.plan_type         NOT NULL DEFAULT 'free',
  status                  public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id      TEXT        UNIQUE,
  stripe_subscription_id  TEXT        UNIQUE,
  stripe_price_id         TEXT,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial indexes keep lookups fast without indexing NULLs
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status)
  WHERE status <> 'canceled';

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SECTION 5 — TABLE: credits
-- One row per user (enforced by UNIQUE constraint on user_id).
-- All mutations must go through deduct_credits() or reset_monthly_credits()
-- to maintain consistency under concurrent requests.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.credits (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance            INTEGER     NOT NULL DEFAULT 50,
  monthly_allowance  INTEGER     NOT NULL DEFAULT 50,
  total_used         INTEGER     NOT NULL DEFAULT 0,
  -- next reset timestamp; computed to the first of the following month at midnight UTC
  reset_at           TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + INTERVAL '1 month'),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT credits_balance_non_negative    CHECK (balance >= 0),
  CONSTRAINT credits_total_used_non_negative CHECK (total_used >= 0),
  CONSTRAINT credits_allowance_positive      CHECK (monthly_allowance > 0)
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);

-- Only index rows whose reset is imminent; used by the monthly cron Edge Function
CREATE INDEX IF NOT EXISTS idx_credits_reset_at
  ON public.credits(reset_at)
  WHERE reset_at <= now() + INTERVAL '2 days';

CREATE TRIGGER trg_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SECTION 6 — TABLE: history
-- Immutable append-only log; no UPDATE policy is granted.
-- input stores the raw form values as JSON for auditability.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool         public.tool_type NOT NULL,
  title        TEXT        NOT NULL,
  input        JSONB       NOT NULL DEFAULT '{}',
  output       TEXT        NOT NULL,
  credits_used INTEGER     NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT history_credits_used_positive CHECK (credits_used > 0),
  CONSTRAINT history_title_length          CHECK (char_length(title) BETWEEN 1 AND 500),
  CONSTRAINT history_output_not_empty      CHECK (char_length(output) > 0)
);

CREATE INDEX IF NOT EXISTS idx_history_user_created
  ON public.history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_user_tool
  ON public.history(user_id, tool);

-- GIN index on input JSONB enables contains (@>) queries
CREATE INDEX IF NOT EXISTS idx_history_input
  ON public.history USING GIN(input);

-- ============================================================
-- SECTION 7 — TABLE: saved_documents
-- User-curated subset of history; supports tags and favorites.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- history_id is nullable; documents can be created independently of history
  history_id   UUID        REFERENCES public.history(id) ON DELETE SET NULL,
  tool         public.tool_type NOT NULL,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  tags         TEXT[]      NOT NULL DEFAULT '{}',
  is_favorite  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT saved_documents_title_length
    CHECK (char_length(title) BETWEEN 1 AND 500),
  CONSTRAINT saved_documents_content_not_empty
    CHECK (char_length(content) > 0)
);

CREATE INDEX IF NOT EXISTS idx_saved_documents_user_updated
  ON public.saved_documents(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_documents_user_tool
  ON public.saved_documents(user_id, tool);

-- Partial index: only index the rows that are favorites (typically a small subset)
CREATE INDEX IF NOT EXISTS idx_saved_documents_favorites
  ON public.saved_documents(user_id)
  WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_saved_documents_history
  ON public.saved_documents(history_id)
  WHERE history_id IS NOT NULL;

-- GIN index enables array overlap (&&) and contains (@>) queries on tags
CREATE INDEX IF NOT EXISTS idx_saved_documents_tags
  ON public.saved_documents USING GIN(tags);

CREATE TRIGGER trg_saved_documents_updated_at
  BEFORE UPDATE ON public.saved_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SECTION 8 — FUNCTION: handle_new_user()
-- Fires on INSERT to auth.users; provisions all three rows
-- (profile, credits wallet, free subscription) in a single
-- transaction so partial state is never visible to the app.
-- SECURITY DEFINER runs as the DB owner (bypasses RLS safely).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits (user_id, balance, monthly_allowance, total_used)
  VALUES (NEW.id, 50, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 9 — FUNCTION: deduct_credits(user_id, amount)
-- Atomically deducts credits inside a single transaction.
-- Uses SELECT … FOR UPDATE to serialize concurrent calls for
-- the same user — prevents over-spending under load.
-- Returns TRUE on success, FALSE when balance is insufficient.
-- ============================================================

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount  INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_credits: amount must be positive (got %)', p_amount;
  END IF;

  SELECT balance
    INTO v_balance
    FROM public.credits
   WHERE user_id = p_user_id
     FOR UPDATE;                    -- row-level lock; waits if another call is in progress

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deduct_credits: no credits row found for user %', p_user_id;
  END IF;

  IF v_balance < p_amount THEN
    RETURN FALSE;                   -- insufficient — caller should surface an error to the user
  END IF;

  UPDATE public.credits
     SET balance    = balance    - p_amount,
         total_used = total_used + p_amount
   WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- SECTION 10 — FUNCTION: reset_monthly_credits(user_id, new_allowance?)
-- Called by the monthly cron Edge Function for each user.
-- Pass new_allowance to change the plan limit at the same time
-- (e.g., after a plan upgrade is reflected in credits).
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_credits(
  p_user_id       UUID,
  p_new_allowance INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.credits
     SET balance           = COALESCE(p_new_allowance, monthly_allowance),
         monthly_allowance = COALESCE(p_new_allowance, monthly_allowance),
         total_used        = 0,
         reset_at          = date_trunc('month', now()) + INTERVAL '1 month'
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reset_monthly_credits: no credits row for user %', p_user_id;
  END IF;
END;
$$;

-- ============================================================
-- SECTION 11 — FUNCTION: update_user_plan(user_id, plan)
-- Upgrades/downgrades a user's plan in profiles and adjusts
-- the credits allowance atomically. Called from the Stripe
-- webhook handler after a subscription status change.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_plan(
  p_user_id UUID,
  p_plan    public.plan_type
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowance INTEGER;
BEGIN
  v_allowance := CASE p_plan
    WHEN 'free'       THEN 50
    WHEN 'starter'    THEN 1000
    WHEN 'pro'        THEN 5000
    WHEN 'enterprise' THEN 20000
    ELSE 50
  END;

  UPDATE public.profiles
     SET plan = p_plan
   WHERE id = p_user_id;

  -- On upgrade: top-up balance to the new allowance if it is higher.
  -- On downgrade: preserve remaining balance (do not clawback mid-cycle).
  UPDATE public.credits
     SET monthly_allowance = v_allowance,
         balance           = GREATEST(balance, v_allowance)
   WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- SECTION 12 — ROW LEVEL SECURITY
-- All tables are locked down by default; explicit policies grant
-- minimum necessary access to the authenticated role only.
-- SECURITY DEFINER functions bypass RLS intentionally.
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

-- profiles --
CREATE POLICY "profiles: select own row"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own row"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- subscriptions --
CREATE POLICY "subscriptions: select own row"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- credits (read-only via RLS; mutations go through SECURITY DEFINER functions) --
CREATE POLICY "credits: select own row"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id);

-- history --
CREATE POLICY "history: select own rows"
  ON public.history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "history: insert own rows"
  ON public.history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "history: delete own rows"
  ON public.history FOR DELETE
  USING (auth.uid() = user_id);

-- saved_documents --
CREATE POLICY "saved_documents: select own rows"
  ON public.saved_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_documents: insert own rows"
  ON public.saved_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_documents: update own rows"
  ON public.saved_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_documents: delete own rows"
  ON public.saved_documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SECTION 13 — VIEW: plan_limits
-- Static reference data; never mutated after migration.
-- Used by the app to render pricing info without a round-trip.
-- ============================================================

CREATE OR REPLACE VIEW public.plan_limits AS
SELECT
  'free'::public.plan_type       AS plan,
  50                             AS monthly_credits,
  7                              AS history_retention_days   -- NULL = unlimited
UNION ALL
SELECT 'starter',  1000, 90
UNION ALL
SELECT 'pro',      5000, NULL
UNION ALL
SELECT 'enterprise', 20000, NULL;

REVOKE INSERT, UPDATE, DELETE ON public.plan_limits FROM authenticated, anon;

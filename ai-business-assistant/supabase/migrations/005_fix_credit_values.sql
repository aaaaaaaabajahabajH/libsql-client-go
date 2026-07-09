-- Migration 005: Align credit values with application constants
-- JS constants: free=20, starter=500, pro=999_999, enterprise=999_999
-- Previous SQL values were: free=50, starter=1000, pro=5000, enterprise=20000

-- Fix the credits table defaults for new free-plan users
ALTER TABLE public.credits
  ALTER COLUMN balance SET DEFAULT 20,
  ALTER COLUMN monthly_allowance SET DEFAULT 20;

-- Fix handle_new_user() to provision 20 credits (free plan) instead of 50
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
  VALUES (NEW.id, 20, 20, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Fix update_user_plan() to use the same values as the application constants
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
  -- Values must match STRIPE_PLAN_CREDITS in lib/stripe/config.ts
  v_allowance := CASE p_plan
    WHEN 'free'       THEN 20
    WHEN 'starter'    THEN 500
    WHEN 'pro'        THEN 999999
    WHEN 'enterprise' THEN 999999
    ELSE 20
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

-- Fix the plan_limits view to reflect correct credit values
CREATE OR REPLACE VIEW public.plan_limits AS
SELECT
  'free'::public.plan_type AS plan,
  20                        AS monthly_credits,
  7                         AS history_retention_days
UNION ALL
SELECT 'starter',  500,    90
UNION ALL
SELECT 'pro',      999999, NULL
UNION ALL
SELECT 'enterprise', 999999, NULL;

REVOKE INSERT, UPDATE, DELETE ON public.plan_limits FROM authenticated, anon;

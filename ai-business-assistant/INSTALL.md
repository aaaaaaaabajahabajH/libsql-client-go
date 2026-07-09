# Installation Guide

## System Requirements

- **Node.js** 20 or later (`node --version`)
- **npm** 10 or later (`npm --version`)
- **Git** (for cloning)
- A **Supabase** project (free tier works)
- A **Stripe** account with a product and price configured
- A **Resend** account with a verified sending domain
- An **OpenAI** API key

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/ai-business-assistant.git
cd ai-business-assistant
```

## Step 2 — Install dependencies

```bash
npm install
```

## Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in **all required variables**. The required set is:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (after creating endpoint) |
| `RESEND_API_KEY` | Resend → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API keys |

Analytics variables (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `SENTRY_DSN`) are optional — omit them and those features are silently disabled.

## Step 4 — Run database migrations

Open your Supabase project → **SQL Editor**, then run each migration file **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_billing.sql`
3. `supabase/migrations/003_admin.sql`
4. `supabase/migrations/004_email_notifications.sql`

Alternatively, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Step 5 — Configure Stripe products

1. Create a **Starter** product in Stripe with a monthly price of **$12**
2. Create a **Pro** product with a monthly price of **$25**
3. Add both price IDs to `.env.local`:
   ```
   STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
   STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
   ```

## Step 6 — Configure Stripe webhook (for local development)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret it prints and set it as `STRIPE_WEBHOOK_SECRET`.

## Step 7 — Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Verify the installation

Visit these endpoints to confirm everything is working:

- `http://localhost:3000` — landing page renders
- `http://localhost:3000/api/health` — returns `{"status":"ok"}`
- `http://localhost:3000/login` — auth form renders
- Register an account → you should receive a welcome email (if Resend is configured)

---

## Running tests

```bash
# Unit tests
npm test

# Unit tests with coverage report
npm run test:coverage

# E2E tests (requires the dev server to be running on port 3000)
npm run test:e2e
```

---

## Troubleshooting

**Build fails with missing env var errors**
: Make sure `.env.local` exists and all required variables are set. Run `npm run type-check` to see which env vars are missing.

**Supabase RLS errors in the browser console**
: Your Supabase policies may not match the schema. Re-run the migrations or check the policies in Supabase → Authentication → Policies.

**Stripe webhooks not arriving locally**
: Confirm `stripe listen` is running and the `STRIPE_WEBHOOK_SECRET` in `.env.local` matches what `stripe listen` printed.

**Email not sending**
: Check `RESEND_API_KEY` is set and your domain is verified in the Resend dashboard. Also confirm `EMAIL_FROM` uses your verified domain.

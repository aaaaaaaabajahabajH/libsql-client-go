# Deployment Guide

This guide covers deploying AI Business Assistant to Vercel (recommended), Docker / Google Cloud Run, and describes the required environment configuration.

---

## Environment Variables Reference

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server only, never exposed |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | Resend API key (`re_...`) |
| `OPENAI_API_KEY` | OpenAI API key (`sk-...`) |

### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public deployment URL | `http://localhost:3000` |
| `EMAIL_FROM` | Sender address for transactional emails | `noreply@yourdomain.com` |
| `SENTRY_DSN` | Sentry DSN for error monitoring | — |
| `SENTRY_AUTH_TOKEN` | For source map upload during build | — |
| `SENTRY_ORG` | Sentry organisation slug | — |
| `SENTRY_PROJECT` | Sentry project slug | — |
| `CRON_SECRET` | Protects `/api/email/process` | — |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (`G-...`) | — |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (`phc_...`) | — |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingest host | `https://us.i.posthog.com` |

### Stripe Price IDs

| Variable | Description |
|---|---|
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Monthly price ID for Starter plan |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Monthly price ID for Pro plan |

---

## Deployment Option 1: Vercel (Recommended)

Vercel provides zero-config Next.js hosting with automatic SSL, global CDN, and preview deployments.

### Initial Setup

```bash
npm i -g vercel
vercel login
vercel link          # link local directory to a Vercel project
```

### Set Environment Variables

```bash
# Set each required variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ...repeat for all required variables
```

Or set them in the Vercel Dashboard → Project → Settings → Environment Variables.

### Deploy

```bash
vercel --prod
```

Subsequent deploys happen automatically when you push to `main` via the GitHub Actions workflow (see `.github/workflows/ci.yml`).

### Vercel Cron Job

Add to `vercel.json` (create in project root):

```json
{
  "crons": [
    {
      "path": "/api/email/process",
      "schedule": "* * * * *"
    }
  ]
}
```

Vercel Cron automatically adds the `Authorization` header using `CRON_SECRET`.

---

## Deployment Option 2: Docker / Google Cloud Run

### Build the Docker Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.yourdomain.com \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  --build-arg NEXT_PUBLIC_POSTHOG_KEY=phc_... \
  -t gcr.io/your-project/ai-business-assistant:latest \
  .
```

`NEXT_PUBLIC_*` variables are baked into the image at build time (they are embedded in the JS bundle). Runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc.) are **never** baked in — they are injected via environment at container start.

### Push to Google Container Registry

```bash
docker push gcr.io/your-project/ai-business-assistant:latest
```

### Deploy to Google Cloud Run

```bash
gcloud run deploy ai-business-assistant \
  --image gcr.io/your-project/ai-business-assistant:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,RESEND_API_KEY=resend-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,CRON_SECRET=cron-secret:latest" \
  --set-env-vars="NODE_ENV=production"
```

Store secrets in [Google Secret Manager](https://cloud.google.com/secret-manager) and reference them with `--set-secrets`.

### Cloud Run Cron Job (Cloud Scheduler)

```bash
gcloud scheduler jobs create http email-queue-processor \
  --schedule "* * * * *" \
  --uri https://your-cloud-run-url/api/email/process \
  --http-method POST \
  --headers "Authorization=Bearer your-cron-secret" \
  --oidc-service-account-email your-sa@project.iam.gserviceaccount.com
```

### Run with Docker Compose (local or self-hosted)

```bash
# Copy and fill in environment variables
cp .env.example .env.local

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

## Supabase Setup

### Apply Migrations

```bash
# Using Supabase CLI
supabase link --project-ref your-project-ref
supabase db push

# Or manually via Supabase Dashboard → SQL Editor
```

Run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_billing.sql`
3. `supabase/migrations/003_admin.sql`
4. `supabase/migrations/004_email_notifications.sql`

### Create the First Admin

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
WHERE email = 'admin@yourdomain.com';
```

### Auth Configuration

Supabase Dashboard → Authentication → Settings:
- **Site URL**: your production domain
- **Redirect URLs**: include your production domain
- **Email confirmations**: enable for production

---

## Stripe Setup

1. Create products and prices in Stripe Dashboard (live mode)
2. Copy price IDs to `STRIPE_STARTER_MONTHLY_PRICE_ID` and `STRIPE_PRO_MONTHLY_PRICE_ID`
3. Create a webhook endpoint at `https://yourdomain.com/api/webhooks/stripe` with these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## CI/CD (GitHub Actions)

The workflow in `.github/workflows/ci.yml` runs automatically:

| Trigger | Jobs that run |
|---|---|
| Pull request to `main` or `develop` | Lint → Type check → Unit tests |
| Push to `main` | Above + Build + E2E tests + Vercel deploy + Docker image push |

### Required GitHub Secrets

Set in GitHub → Repository → Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | From Vercel → Account → Tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Used in E2E test job |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used in E2E test job |
| `NEXT_PUBLIC_APP_URL` | Used in Docker build |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Used in Docker build |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Used in Docker build |
| `NEXT_PUBLIC_POSTHOG_KEY` | Used in Docker build |

---

## Health Check

The health endpoint is always available at `/api/health`:

```bash
curl https://yourdomain.com/api/health
# {"status":"ok","services":{"database":"ok","environment":"ok"},"version":"1.0.0"}
```

Returns HTTP 503 with `{"status":"degraded"}` when a dependency is unavailable.

Configure your uptime monitor to poll this endpoint every 1–5 minutes.

---

## Post-Deployment Checklist

See [docs/launch-checklist.md](docs/launch-checklist.md) for the full launch checklist.

Quick smoke test:
- [ ] `GET /api/health` → 200
- [ ] Landing page loads
- [ ] Register an account → welcome email received
- [ ] Upgrade to Starter via Stripe Checkout
- [ ] Run an AI generation → credits deducted correctly
- [ ] Cancel subscription via Customer Portal

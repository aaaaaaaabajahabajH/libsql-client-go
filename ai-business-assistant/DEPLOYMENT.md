# Deployment Guide

## Prerequisites

- Node.js 20+
- A Supabase project (free tier works for getting started)
- A Stripe account (for billing)
- A Resend account (for transactional emails)
- Optional: Sentry project (for error monitoring)

---

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values.

### Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only, never expose) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | Resend API key (`re_...`) |

### Optional

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployment | `http://localhost:3000` |
| `EMAIL_FROM` | Sender address for transactional emails | `noreply@yourdomain.com` |
| `SENTRY_DSN` | Sentry DSN for error monitoring | — |
| `CRON_SECRET` | Secret token to protect the email queue cron endpoint | — |
| `NODE_ENV` | `production` or `development` | `development` |

### Stripe Price IDs (if using billing)

| Variable | Description |
|---|---|
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Price ID for the Starter plan |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID for the Pro plan |

---

## 2. Supabase Setup

### Run Migrations

Apply all migrations in order from `supabase/migrations/`:

```bash
# Using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard > SQL Editor
```

Migrations:
- `001_initial_schema.sql` — core tables (users, plans, credits, generations, documents)
- `002_billing.sql` — billing tables (subscriptions, invoices)
- `003_admin.sql` — admin support tables
- `004_email_notifications.sql` — email_logs, email_queue, notifications

### Row Level Security

All tables have RLS enabled. The migrations include the necessary policies. Verify in Supabase Dashboard > Authentication > Policies.

### Auth Configuration

In Supabase Dashboard > Authentication > Settings:
- Set **Site URL** to your production domain
- Add your production domain to **Redirect URLs**
- Enable **Email confirmations** if desired
- Configure email templates (or rely on Resend via app-level sending)

---

## 3. Stripe Setup

### Products and Prices

Create products and prices in Stripe Dashboard:
1. Create a **Starter** product with a monthly recurring price of $12
2. Create a **Pro** product with a monthly recurring price of $25
3. Copy the price IDs (`price_...`) into the environment variables above

### Webhook

1. In Stripe Dashboard > Developers > Webhooks, add a new endpoint:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
2. Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`

---

## 4. Resend Setup

1. Sign up at [resend.com](https://resend.com) and verify your sending domain
2. Create an API key and set it as `RESEND_API_KEY`
3. Update `EMAIL_FROM` to use your verified domain (e.g., `hello@yourdomain.com`)

---

## 5. Email Queue Cron Job

The email queue (`/api/email/process`) must be called periodically to process queued emails.

### Vercel Cron (recommended on Vercel)

Add to `vercel.json`:

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

The endpoint is protected by the `Authorization: Bearer <CRON_SECRET>` header. Vercel sets this automatically when using Vercel Cron.

### Other Platforms

Use any external cron service (e.g., cron-job.org, Railway cron, GitHub Actions) to POST to:

```
POST https://yourdomain.com/api/email/process
Authorization: Bearer <CRON_SECRET>
```

---

## 6. Sentry Setup (optional but recommended)

1. Create a project at [sentry.io](https://sentry.io)
2. Copy the DSN and set it as `SENTRY_DSN`
3. Set `SENTRY_ORG` and `SENTRY_PROJECT` if you want source map uploads

Source maps are automatically uploaded during `next build` when Sentry environment variables are set.

---

## 7. Deploy

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard under Project > Settings > Environment Variables.

### Other Platforms (Railway, Render, Fly.io)

```bash
npm run build
npm start
```

Ensure `NODE_ENV=production` is set and all required environment variables are available at runtime.

---

## 8. Post-Deployment Checklist

- [ ] Visit `/api/health` — should return `{"status":"ok"}`
- [ ] Test sign-up and email verification flow
- [ ] Test Stripe checkout with a test card
- [ ] Confirm Stripe webhook is receiving events (Stripe Dashboard > Webhooks > recent deliveries)
- [ ] Send a test transactional email
- [ ] Check Sentry dashboard for any startup errors
- [ ] Review Supabase logs for any RLS policy violations

---

## 9. Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running dev server)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

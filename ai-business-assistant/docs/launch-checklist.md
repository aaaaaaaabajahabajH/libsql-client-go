# Production Launch Checklist

Work through this list top-to-bottom before going live. Each item should be explicitly verified — not assumed.

---

## Infrastructure

- [ ] **Domain registered** and DNS records configured (A/CNAME pointing to hosting)
- [ ] **SSL certificate** verified — `https://yourdomain.com` loads without certificate warning
- [ ] **HTTPS redirect** — `http://` requests are permanently redirected to `https://`
- [ ] `NEXT_PUBLIC_APP_URL` set to the production domain (e.g. `https://app.yourdomain.com`)

---

## Supabase

- [ ] **Production project created** — separate from any development project
- [ ] All four migrations applied in order to the production database:
  - [ ] `001_initial_schema.sql`
  - [ ] `002_billing.sql`
  - [ ] `003_admin.sql`
  - [ ] `004_email_notifications.sql`
- [ ] **RLS policies** verified — table policies visible in Supabase → Authentication → Policies
- [ ] **Site URL** set in Supabase → Authentication → Settings → Site URL
- [ ] **Redirect URLs** include the production domain
- [ ] **Service role key** stored as a secret in the hosting platform — never in the codebase
- [ ] **Connection pooling** enabled for production traffic (Supabase → Settings → Database → Connection pooling)
- [ ] First admin user created: run `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE email = 'you@example.com';`

---

## Stripe

- [ ] **Live mode** enabled — verify keys start with `pk_live_` / `sk_live_`
- [ ] Starter product created with live price ID → set as `STRIPE_STARTER_MONTHLY_PRICE_ID`
- [ ] Pro product created with live price ID → set as `STRIPE_PRO_MONTHLY_PRICE_ID`
- [ ] **Webhook endpoint** created in Stripe → Developers → Webhooks:
  - URL: `https://yourdomain.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` (`whsec_...`) matches the live webhook endpoint's signing secret
- [ ] Stripe Customer Portal configured (Stripe → Settings → Billing → Customer Portal)
- [ ] **Test a real purchase** end-to-end before announcing launch

---

## Email (Resend)

- [ ] **Sending domain verified** in Resend (DNS records added and propagated)
- [ ] `EMAIL_FROM` uses the verified domain (e.g. `hello@yourdomain.com`)
- [ ] `RESEND_API_KEY` is the production API key
- [ ] Welcome email delivered (register a test account and verify receipt)
- [ ] Password reset email delivered end-to-end

---

## AI Provider

- [ ] **OpenAI production API key** set as `OPENAI_API_KEY`
- [ ] **Usage limits** configured in the OpenAI dashboard to cap monthly spend
- [ ] Test AI generation for each of the 6 tools

---

## Email Queue Cron

- [ ] `CRON_SECRET` is a strong random value (≥32 characters)
- [ ] Cron job scheduled to POST to `/api/email/process` every minute with `Authorization: Bearer <CRON_SECRET>`
- [ ] Cron job delivers successfully — check `email_queue` table has no stuck `queued` rows

---

## Error Monitoring (Sentry)

- [ ] **Production Sentry project** created
- [ ] `SENTRY_DSN` set in production environment
- [ ] Source map uploads configured (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`)
- [ ] Trigger a test error and confirm it appears in Sentry → Issues

---

## Analytics

- [ ] **Google Analytics 4** property created and `NEXT_PUBLIC_GA_MEASUREMENT_ID` set
- [ ] **PostHog** project created, `NEXT_PUBLIC_POSTHOG_KEY` set
- [ ] Both analytics providers receive events — open GA4 Realtime and PostHog Live Events

---

## Uptime Monitoring

- [ ] **Uptime monitor** configured (Better Uptime, UptimeRobot, etc.) on `https://yourdomain.com/api/health`
- [ ] Alert notifications configured (email / Slack / PagerDuty)
- [ ] `/api/health` returns `{"status":"ok"}` on the production URL

---

## SEO & Crawling

- [ ] `NEXT_PUBLIC_APP_URL` correct so `/robots.txt` and `/sitemap.xml` use the right domain
- [ ] Visit `https://yourdomain.com/robots.txt` — confirms dashboard/api routes are disallowed
- [ ] Visit `https://yourdomain.com/sitemap.xml` — lists public pages
- [ ] Submit sitemap to Google Search Console
- [ ] Open Graph image (`/og-image.png`) exists and loads (1200×630px recommended)
- [ ] Test social preview via [opengraph.xyz](https://www.opengraph.xyz/)

---

## Security Review

- [ ] No secrets committed to git — run `git log --all --full-diff -p | grep -i "sk_live\|whsec\|service_role"` to verify
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not in any client bundle — verify with `npm run build && grep -r "service_role" .next/static` (should return nothing)
- [ ] Rate limiting verified — hit `/api/generate` 25 times rapidly and confirm 429 responses
- [ ] Stripe webhook signature verified — tamper with the body and confirm 400 response
- [ ] CSP header present — check response headers in browser DevTools → Network → Headers

---

## Performance

- [ ] Lighthouse score ≥ 90 for Performance, Accessibility, Best Practices, SEO on the landing page
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Images served in AVIF/WebP format
- [ ] Font loads without FOUT (preload enabled)

---

## Backups

- [ ] Supabase automatic backups enabled (Pro plan or above)
- [ ] Backup retention policy confirmed (see [backup-strategy.md](./backup-strategy.md))
- [ ] Manual backup taken before launch: Supabase → Settings → Database → Backups

---

## CI/CD

- [ ] GitHub Actions pipeline passing on `main`
- [ ] Required secrets set in GitHub → Settings → Secrets and variables → Actions: `VERCEL_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] A push to `main` triggers automatic deployment
- [ ] Deployment rolls back cleanly if the build fails

---

## Documentation

- [ ] `README.md` reflects the production domain and accurate plan pricing
- [ ] `CHANGELOG.md` updated with the release date
- [ ] `DEPLOYMENT.md` reviewed for accuracy

---

## Soft Launch

1. Invite 3–5 beta testers to register
2. Have each tester complete: signup → email verification → upgrade to Starter → run AI tool → cancel subscription
3. Verify all Stripe webhook events processed in the Stripe dashboard
4. Check Sentry for any unhandled errors during the beta period
5. Check PostHog / GA4 for expected event flow

---

## Go Live

- [ ] All checklist items above checked
- [ ] Beta testers gave thumbs-up
- [ ] Team notified of launch time
- [ ] Monitoring dashboards open and watched for first 2 hours post-launch

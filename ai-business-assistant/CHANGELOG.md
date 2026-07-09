# Changelog

All notable changes to AI Business Assistant are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-07-09

Initial production release. Version 1.0.0 is the first publicly deployable version of AI Business Assistant.

### Added

#### Core Application
- Next.js 15 App Router with route groups `(auth)`, `(dashboard)`, `(admin)`
- TypeScript 5 with strict mode throughout — zero `any` types
- Tailwind CSS 3 + shadcn/ui component library with dark/light theme support
- Responsive design supporting mobile, tablet, and desktop viewports

#### Authentication (M1–M2)
- Email + password authentication via Supabase Auth
- Registration with email verification
- Login, logout, session refresh
- Forgot password / reset password flows
- Auth middleware protecting all `/dashboard/*`, `/settings/*`, `/admin/*` routes

#### Landing & Marketing (M3)
- Full landing page: Hero, Features, How It Works, Dashboard Preview, Testimonials, Pricing Preview, FAQ, CTA
- Public pricing page with billing toggle (monthly)
- `/robots.txt` and `/sitemap.xml` via Next.js Metadata API
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (Organization + SoftwareApplication)
- Web manifest (`/manifest.json`)

#### Dashboard (M4–M5)
- Sidebar navigation with collapsible mobile drawer
- Dashboard home with stats cards (credits, generations this month, documents, streak)
- Generation history with search, filter by tool, pagination, copy/download
- Document library with save, rename, delete, full-text search
- User profile with avatar upload (Supabase Storage), name/email editing

#### AI Tools (M6)
- Six production AI tools powered by OpenAI GPT-4o via Vercel AI SDK:
  - Social Media Generator (Twitter, LinkedIn, Instagram)
  - Product Description Writer
  - Blog Writer (SEO-optimised)
  - Email Writer (campaigns and transactional)
  - Invoice Generator (structured business documents)
  - Text Translator (50+ languages)
- Real-time streaming output
- Credit deduction per generation
- Copy and download (Markdown / text) output

#### Billing & Subscriptions (M7)
- Stripe Checkout integration
- Stripe Customer Portal for self-serve plan management
- Stripe webhook handler (checkout completed, subscription events, invoice events)
- Plan upgrade / downgrade / cancel flows
- Credit reset on billing cycle renewal
- Free / Starter ($12/mo) / Pro ($25/mo) tiers

#### Settings & Profile (M8–M10)
- Account settings: name, email, password change
- Workspace settings: display name, timezone, language
- Billing tab: current plan, usage bar, upgrade CTA, portal link
- Security tab: active sessions, security log
- Admin dashboard: user management, revenue analytics, email logs

#### Admin (M11)
- Role-based access control (`user` / `admin`)
- Admin user list with plan filter, search, ban/unban
- Revenue and usage analytics charts (Recharts)
- Email log viewer with status, retry controls

#### Email & Notifications (M12)
- Resend as primary email provider with swappable `EmailProvider` interface
- 10 transactional email templates: welcome, verify email, password reset, subscription activated/cancelled, payment success/failure, credits reset, weekly summary, AI completed
- Email queue with exponential backoff retry (up to 3 attempts)
- In-app notification centre: bell dropdown + `/notifications` full page
- Notification types: billing, AI, security, product
- `email_logs`, `email_queue`, `notifications` database tables with RLS

#### Production Hardening (M13)
- `AppError` hierarchy with typed error codes and HTTP status codes
- Zod environment variable validation at startup
- Structured JSON logger (production) / human-readable (dev)
- Input sanitization: HTML escaping, URL allow-listing, SQL wildcard escaping, filename sanitization, email/UUID validation
- In-memory sliding-window rate limiting (60 API / 10 auth / 20 AI per window)
- Sentry integration: client, server, edge runtimes + CSP-safe tunnel route
- Static Content-Security-Policy with environment-aware `unsafe-eval`/HSTS
- Full security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (prod)
- Segment-level error boundaries for root, dashboard, and admin
- `/api/health` endpoint with database ping and environment check
- 86 Vitest unit tests across errors, sanitize, rate-limit, middleware-auth, constants
- Playwright E2E tests: auth flows and public pages

#### Deployment & Launch (M14)
- Google Analytics 4 integration via `next/script`
- PostHog integration with React Provider — page views, 18 typed event types
- `trackEvent()` unified analytics function (GA4 + PostHog)
- Multi-stage `Dockerfile` with non-root user and `HEALTHCHECK`
- `docker-compose.yml` for container deployments
- GitHub Actions CI/CD pipeline: lint → type-check → unit tests → build → E2E → Vercel deploy → Docker image push
- `output: standalone` Next.js build for minimal Docker images
- `README.md`, `INSTALL.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- `docs/launch-checklist.md` and `docs/backup-strategy.md`

### Security
- All user inputs sanitized before storage
- SQL injection prevention via parameterised Supabase queries and sanitizeSearchQuery
- XSS protection via escapeHtml + CSP `script-src`
- CSRF: Server Actions enforce same-origin; Stripe webhook uses signature verification
- Secrets never exposed to the browser or baked into Docker images
- Rate limiting on all public API endpoints

---

## [Unreleased]

Nothing yet — contributions welcome via pull request.

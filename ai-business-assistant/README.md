# AI Business Assistant

> Production-ready AI SaaS — generate content, write emails, build invoices, translate text and more with a credit-based subscription.

[![CI](https://github.com/your-org/ai-business-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-business-assistant/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it does

AI Business Assistant gives your users access to six AI-powered tools through a clean, modern interface. Users buy credits (via Stripe) and spend them to generate content. Admins manage users, monitor usage, and view revenue analytics.

| Tool | Credits |
|---|---|
| Social Media Generator | 5 |
| Product Description | 5 |
| Blog Writer | 10 |
| Email Writer | 5 |
| Invoice Generator | 3 |
| Text Translator | 3 |

---

## Plans

| | Free | Starter | Pro |
|---|---|---|---|
| Price | $0/mo | $12/mo | $25/mo |
| Credits | 20 | 500 | Unlimited |
| History | 7 days | 90 days | Unlimited |
| All 6 tools | ✓ | ✓ | ✓ |
| Save documents | — | ✓ | ✓ |
| Priority generation | — | ✓ | ✓ |
| API access | — | — | ✓ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, Streaming) |
| Language | TypeScript 5 — strict mode throughout |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Payments | Stripe (checkout, billing portal, webhooks) |
| AI | OpenAI GPT-4o via Vercel AI SDK (streaming) |
| Email | Resend (10 transactional templates, queue + retry) |
| Monitoring | Sentry (client + server + edge) |
| Analytics | Google Analytics 4 + PostHog |
| Testing | Vitest (86 unit tests) + Playwright (E2E) |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/ai-business-assistant.git
cd ai-business-assistant
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, STRIPE_*, RESEND_API_KEY, OPENAI_API_KEY

# 3. Run database migrations
# Supabase Dashboard → SQL Editor → run supabase/migrations/ in order

# 4. Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker

```bash
# Build image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t ai-business-assistant .

# Run with docker-compose
cp .env.example .env.local   # fill in secrets
docker-compose up
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Unit tests + coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run validate` | type-check + lint + format |

---

## Project Structure

```
ai-business-assistant/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, register, forgot/reset password
│   ├── (dashboard)/            # Protected user area
│   │   ├── dashboard/          # Home, stats, recent history
│   │   ├── generate/           # AI tool pages
│   │   ├── history/            # Generation history
│   │   ├── documents/          # Saved documents
│   │   ├── notifications/      # Notification centre
│   │   ├── profile/            # User profile
│   │   └── settings/           # Billing, workspace, security
│   ├── (admin)/                # Admin area (role-gated)
│   ├── api/                    # API routes
│   │   ├── generate/           # Streaming AI endpoint
│   │   ├── health/             # Health check
│   │   ├── email/process/      # Email queue cron
│   │   └── webhooks/stripe/    # Stripe webhook handler
│   ├── pricing/                # Public pricing page
│   ├── robots.ts               # /robots.txt
│   ├── sitemap.ts              # /sitemap.xml
│   └── manifest.ts             # /manifest.json
├── components/
│   ├── analytics/              # GA4 + PostHog wrappers
│   ├── auth/                   # Auth forms
│   ├── dashboard/              # Header, sidebar
│   ├── landing/                # Marketing page sections
│   ├── notifications/          # Bell dropdown, notification list
│   ├── pricing/                # Plan cards, billing toggle
│   └── ui/                     # shadcn/ui primitives
├── actions/                    # Server Actions
├── services/                   # Business logic (email, notifications)
├── lib/
│   ├── analytics.ts            # Unified GA4 + PostHog event tracking
│   ├── email/                  # Email provider abstraction + templates
│   ├── errors.ts               # AppError hierarchy
│   ├── env.ts                  # Zod env validation
│   ├── logger.ts               # Structured JSON logger
│   ├── rate-limit.ts           # Sliding-window rate limiter
│   ├── sanitize.ts             # Input sanitization
│   └── supabase/               # Supabase client factories
├── middleware.ts               # Auth + request-id + IP headers
├── types/                      # TypeScript types
├── utils/constants.ts          # Plans, tools, routes
├── supabase/migrations/        # SQL migrations (run in order)
├── __tests__/unit/             # 86 Vitest unit tests
├── e2e/                        # Playwright E2E tests
├── Dockerfile                  # Multi-stage production image
├── docker-compose.yml          # Local container setup
└── .github/workflows/ci.yml   # CI/CD pipeline
```

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions covering Vercel, Docker, and Google Cloud Run.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

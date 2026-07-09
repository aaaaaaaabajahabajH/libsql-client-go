# Architecture Overview

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe |
| Email | Resend |
| AI | OpenAI (GPT-4o) via Vercel AI SDK |
| Monitoring | Sentry |
| Styling | Tailwind CSS + shadcn/ui |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Directory Structure

```
ai-business-assistant/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group — no sidebar
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/            # Authenticated user area
│   │   ├── layout.tsx          # Sidebar + header layout
│   │   ├── dashboard/          # Main dashboard
│   │   ├── generate/           # AI generation tool pages
│   │   ├── history/            # Generation history
│   │   ├── documents/          # Saved documents
│   │   ├── notifications/      # Notification center
│   │   ├── profile/            # User profile
│   │   └── settings/           # Account settings (billing, workspace)
│   ├── (admin)/                # Admin area (role-gated)
│   │   ├── layout.tsx
│   │   └── admin/              # User management, analytics, email logs
│   ├── api/                    # API routes
│   │   ├── generate/           # AI streaming endpoint
│   │   ├── health/             # Health check
│   │   ├── email/process/      # Email queue processor (cron)
│   │   └── webhooks/stripe/    # Stripe webhook handler
│   ├── pricing/                # Public pricing page
│   ├── error.tsx               # Root error boundary
│   ├── layout.tsx              # Root layout (fonts, JSON-LD, Sentry)
│   └── page.tsx                # Landing page
│
├── components/
│   ├── auth/                   # Login, register, forgot-password forms
│   ├── dashboard/              # Header, sidebar, stats cards
│   ├── landing/                # Hero, features, pricing preview, footer
│   ├── notifications/          # Bell dropdown, notification item
│   ├── pricing/                # Plan cards, comparison table, billing toggle
│   └── ui/                     # shadcn/ui primitives
│
├── actions/                    # Next.js Server Actions
│   ├── auth.ts                 # loginAction, registerAction, logoutAction
│   ├── generate.ts             # generateAction (AI)
│   ├── billing.ts              # createCheckoutSession, createPortalSession
│   └── notifications.ts        # fetch, markRead, delete
│
├── services/                   # Business logic (server-side only)
│   ├── email.ts                # sendWelcomeEmail, sendPasswordResetEmail, etc.
│   └── notifications.ts        # createNotification, listNotifications, etc.
│
├── lib/                        # Pure utilities
│   ├── supabase/               # Supabase client factories
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server component client (RLS-aware)
│   │   └── admin.ts            # Service role client (bypasses RLS)
│   ├── email/                  # Email infrastructure
│   │   ├── provider.ts         # EmailProvider interface
│   │   ├── resend.ts           # Resend implementation
│   │   ├── index.ts            # Singleton factory
│   │   ├── queue.ts            # Queue & retry logic
│   │   └── templates/          # HTML email templates
│   ├── errors.ts               # AppError hierarchy
│   ├── logger.ts               # Structured logger
│   ├── sanitize.ts             # Input sanitization helpers
│   ├── rate-limit.ts           # In-memory sliding window rate limiter
│   └── env.ts                  # Zod env validation
│
├── middleware.ts               # Auth + request-id + IP headers
├── middleware/
│   └── auth.ts                 # Route classification helpers
│
├── types/
│   ├── database.ts             # Supabase row types, enums
│   └── index.ts                # Domain types (PlanConfig, ToolConfig, etc.)
│
├── utils/
│   └── constants.ts            # App constants (plans, tools, routes)
│
├── supabase/
│   └── migrations/             # SQL migration files
│
├── __tests__/
│   └── unit/                   # Vitest unit tests
│
└── e2e/                        # Playwright E2E tests
```

---

## Authentication Flow

1. User submits the login form → `loginAction` server action
2. Server action calls `supabase.auth.signInWithPassword()`
3. Supabase sets an `sb-*` cookie via SSR helpers
4. `middleware.ts` reads the session cookie on every request
5. If unauthenticated and route is protected → redirect to `/login`
6. Server components call `createClient()` — the Supabase SSR client reads the cookie automatically, so all queries respect Row Level Security policies for the logged-in user

---

## Data Access Layers

| Client | Where used | Auth |
|---|---|---|
| `createClient()` | Server components, Server Actions | Uses session cookie; respects RLS |
| `createAdminClient()` | Stripe webhook, cron jobs, admin API routes | Service role; bypasses RLS |

Never use `createAdminClient()` inside server components or actions that handle user data — always use `createClient()` so RLS is enforced.

---

## AI Generation Pipeline

```
User selects tool + fills form
        ↓
generateAction (Server Action)
        ↓
Check credits remaining (Supabase RLS query)
        ↓
Deduct credits (Supabase RPC)
        ↓
Build system prompt + user prompt
        ↓
streamText() via Vercel AI SDK → OpenAI GPT-4o
        ↓
Stream tokens back to client
        ↓
On completion: save generation to DB, optionally notify user
```

---

## Email Architecture

Emails use an abstraction layer (`EmailProvider` interface) so the provider can be swapped without changing call sites:

```
sendWelcomeEmail()           ← services/email.ts
        ↓
sendAndLog()                 ← logs to email_logs, handles retry
        ↓
getEmailProvider().send()    ← lib/email/index.ts (singleton)
        ↓
ResendProvider.send()        ← lib/email/resend.ts
        ↓
Resend API
```

Failed sends are written to the `email_queue` table and retried by the `/api/email/process` cron endpoint with exponential backoff.

---

## Security Model

- **CSP**: Static Content-Security-Policy headers in `next.config.ts`. `'unsafe-inline'` is required for Tailwind + Next.js hydration.
- **Rate limiting**: In-memory sliding window per IP in Node.js API routes. The AI endpoint allows 20 req/min; auth endpoints allow 10 per 15 min.
- **Input sanitization**: All user-supplied strings pass through `lib/sanitize.ts` before storage or display.
- **CSRF**: Next.js Server Actions use the `Origin` header check automatically (same-origin requirement). Stripe webhook uses signature verification (`stripe.webhooks.constructEvent`).
- **Admin routes**: Protected by checking `user.role === 'admin'` in both middleware and at the data-access layer.

---

## Monitoring

- **Sentry**: Captures unhandled exceptions (`onRequestError` hook), client errors (`sentry.client.config.ts`), and React error boundaries.
- **Health check**: `GET /api/health` returns database connectivity status and environment health. Used by uptime monitors.
- **Structured logging**: `lib/logger.ts` emits JSON in production, human-readable in dev. All API route handlers log requests and errors.

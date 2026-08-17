# InvoiceAI

منصة SaaS لإنشاء وإدارة الفواتير وعروض الأسعار لأصحاب المشاريع الصغيرة، مع مساعد
ذكاء اصطناعي يحوّل جملة واحدة إلى بند فاتورة منظم.

This is a standalone project living at the repo root's `invoiceai/` directory,
independent from the Go driver and the other apps in this repo (`ghyari-platform/`,
`ghiyari/`, `ai-business-assistant/`, `vibe-coding-assistant/`). It has its own
`package.json`, dependencies, and deploy target (Vercel).

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (`new-york` style, CSS-variable theming, light/dark)
- Supabase (Postgres + Auth + RLS)
- Stripe (subscription billing)
- OpenAI API (server-side only, powers `/dashboard/ai-assistant`)
- Zod + React Hook Form

## Getting started

```bash
cd invoiceai
npm install
cp .env.local.example .env.local   # fill in Supabase/Stripe/OpenAI keys
npm run dev                         # http://localhost:3000
```

Useful scripts: `npm run type-check`, `npm run lint`, `npm run build`,
`npm run format`.

## Project structure

```
app/
  (public)/            /            landing page
  (public)/pricing/    /pricing
  (auth)/login/        /login
  (auth)/register/     /register
  (auth)/forgot-password/
  (dashboard)/dashboard/
    invoices/, invoices/new/, invoices/[id]/
    customers/, customers/[id]/
    quotes/
    ai-assistant/
    settings/
    billing/
components/
  ui/                  shadcn/ui primitives (button, card, input, label, sonner)
  theme-provider.tsx   next-themes wrapper
  placeholder-page.tsx temporary stand-in used by not-yet-built routes
lib/
  utils.ts             cn() className helper
  constants.ts          plans, currencies, invoice/quote status enums
types/
  index.ts             hand-written domain types (Invoice, Customer, Quote, ...)
```

Route groups (`(public)`, `(auth)`, `(dashboard)`) don't affect the URL — they
only let each area have its own layout without a shared shell.

## Status: Phase 1 — structure scaffold

What exists right now:

- Every route named in the product spec exists and builds (`npm run build`
  produces all 16 routes, `npm run type-check` and `npm run lint` are clean).
- Design tokens for light/dark mode in `app/globals.css` (neutral base +
  a single indigo brand accent — intentionally low-color per the "premium,
  simple" brief).
- Arabic (IBM Plex Sans Arabic) and Latin (Inter) fonts wired up; root layout
  currently defaults to `lang="ar" dir="rtl"` — see the `TODO(phase: i18n/...)`
  comment in `app/layout.tsx`. Real locale routing + a language switcher is
  planned for the Dashboard-layout/Settings phase, not built yet.
- Every dashboard/auth/pricing route is a `PlaceholderPage` stub, not the real
  feature — that's intentional; each is replaced in its own phase below.

What is **not** built yet (by design — next phases, one at a time):

1. Supabase schema (`profiles`, `companies`, `customers`, `invoices`,
   `invoice_items`, `quotes`, `quote_items`, `subscriptions`, `usage`) + RLS.
2. Authentication (Supabase Auth, session handling, protected routes,
   `middleware.ts`).
3. Real dashboard layout (sidebar, mobile nav, org/user menu).
4. Landing page content.
5. Customers / Invoices / Invoice Builder / PDF generation / Quotes / AI
   Assistant / Settings / Billing (Stripe) feature implementations.

### Known follow-up: dependency versions

`npm audit` currently reports 3 high-severity advisories, all inside Next.js's
own transitive deps (`postcss`, `sharp` used by the built-in image optimizer).
The fix requires Next.js 16, a breaking major bump we haven't evaluated against
this App Router setup yet — tracked as a deliberate follow-up rather than
applied blindly. Re-run `npm audit` before shipping to production.

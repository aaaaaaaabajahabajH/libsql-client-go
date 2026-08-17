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
supabase/
  migrations/          SQL migrations (source of truth for the schema)
```

Route groups (`(public)`, `(auth)`, `(dashboard)`) don't affect the URL — they
only let each area have its own layout without a shared shell.

## Database schema

`supabase/migrations/20260817090000_initial_schema.sql` creates all 9 tables
from the spec (`profiles`, `companies`, `customers`, `invoices`,
`invoice_items`, `quotes`, `quote_items`, `subscriptions`, `usage`) plus:

- **RLS on every table**, scoped to `auth.uid()` — one user can never read or
  write another user's rows. Verified with a two-user isolation test (see
  below), not just written and assumed correct.
- **Atomic auto-numbering** (`INV-000001`, `QUO-000001`, ...) via a per-company
  sequence counter, incremented inside the insert trigger so concurrent
  invoice creation can't race to the same number.
- **Usage tracking + plan-limit enforcement**: every invoice insert increments
  a monthly `usage` counter; a `BEFORE INSERT` trigger rejects the insert once
  a Free (5/mo) or Starter (100/mo) plan hits its limit (Pro is unlimited).
  This is defense-in-depth — the Billing/Invoices phase should still check the
  limit in the app first and show a friendly upgrade prompt instead of letting
  a request hit this trigger.
- **New-user bootstrap**: an `auth.users` insert trigger creates the matching
  `profiles` row and a `subscriptions` row on the Free plan automatically.
- **`invoice_items`/`quote_items` ownership can't be spoofed**: `user_id` on
  each line item is derived server-side from the parent invoice/quote in a
  `BEFORE INSERT` trigger, never trusted from client input.
- **Public share links** (`invoices.share_token` / `quotes.share_token`)
  without relaxing RLS: `get_shared_invoice(token)` / `get_shared_quote(token)`
  are `SECURITY DEFINER` RPCs, callable by `anon`, that look up a single
  document by its unguessable token and strip `user_id` from the result. RLS
  on the base tables stays owner-only.

This migration was validated end-to-end against a real local Postgres 16
instance before being committed (not just eyeballed): ran the full file with
`ON_ERROR_STOP`, simulated a signup, created a company/customer/invoices,
confirmed auto-numbering incremented correctly, confirmed the usage counter
and the 6th free-plan invoice was rejected, confirmed a second user could not
see or read the first user's rows under RLS as the `authenticated` role, and
confirmed the share-token RPC returns full invoice JSON to the `anon` role
while direct table access for `anon` stays denied.

To apply it to a Supabase project: paste the file into the SQL Editor, or
`supabase link` + `supabase db push` once the CLI is installed. After
applying, regenerate types with
`supabase gen types typescript --project-id <ref> > types/database.ts`.

## Status: Phase 2 — Supabase schema

Phase 1 (structure scaffold — see below) plus the schema above. Still not
built (by design — next phases, one at a time):

1. Authentication (Supabase Auth, session handling, protected routes,
   `middleware.ts`) — wires the app up to the schema above.
2. Real dashboard layout (sidebar, mobile nav, org/user menu).
3. Landing page content.
4. Customers / Invoices / Invoice Builder / PDF generation / Quotes / AI
   Assistant / Settings / Billing (Stripe) feature implementations.

### Phase 1 — structure scaffold

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
  feature — that's intentional; each is replaced in its own phase.

### Known follow-up: dependency versions

`npm audit` currently reports 3 high-severity advisories, all inside Next.js's
own transitive deps (`postcss`, `sharp` used by the built-in image optimizer).
The fix requires Next.js 16, a breaking major bump we haven't evaluated against
this App Router setup yet — tracked as a deliberate follow-up rather than
applied blindly. Re-run `npm audit` before shipping to production.

# AI Business Assistant

A production-ready AI SaaS that gives businesses superpowers — generate content,
write emails, build invoices, translate text, and more with a single credit-based
subscription.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & DB | Supabase (PostgreSQL) |
| Forms | React Hook Form + Zod |
| Server Logic | Next.js Server Actions |
| Themes | next-themes (dark / light) |
| Icons | Lucide React |

## Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# → Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run the database migration
# Open your Supabase project → SQL Editor → paste supabase/migrations/001_schema.sql

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format with Prettier |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run validate` | type-check + lint + format check |

## Project Structure

```
ai-business-assistant/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Unauthenticated route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/        # Authenticated route group
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── tools/
│   │       ├── social-media/
│   │       ├── product-description/
│   │       ├── blog-writer/
│   │       ├── email-writer/
│   │       ├── invoice-generator/
│   │       └── translator/
│   ├── pricing/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── sitemap.ts
│   ├── robots.ts
│   └── manifest.ts
├── actions/                # Next.js Server Actions
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── auth/               # Auth-specific components
│   ├── dashboard/          # Dashboard layout components
│   ├── landing/            # Landing page sections
│   ├── tools/              # AI tool components
│   └── shared/             # Globally shared components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── supabase/           # Supabase client factory
│   └── utils.ts            # cn() and other utilities
├── services/               # Business logic (thin wrappers)
├── styles/
│   └── globals.css
├── supabase/
│   └── migrations/
├── types/
│   ├── database.ts         # Supabase generated types
│   └── index.ts            # App-level types
└── utils/                  # Pure utility functions
```

## Plans

| | Free | Starter | Pro |
|---|---|---|---|
| Price | $0 | $19/mo | $49/mo |
| Credits | 50 | 1,000 | 5,000 |
| History | 7 days | 90 days | Unlimited |
| Tools | All 6 | All 6 | All 6 |
| Save docs | — | ✓ | ✓ |
| API access | — | — | ✓ |

## License

MIT

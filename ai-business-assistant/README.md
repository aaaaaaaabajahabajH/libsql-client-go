# AI Business Assistant

A production-ready AI SaaS built with Next.js 15, Supabase, Shadcn UI, and Tailwind CSS.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth & Database**: Supabase
- **Icons**: Lucide React

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Run development server
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

Run the migration in your Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
```

## Project Structure

```
app/
  (auth)/login          # Login page
  (auth)/register       # Register page
  (dashboard)/          # Protected dashboard layout
    dashboard/          # Main dashboard
    profile/            # User profile
    settings/           # App settings
  pricing/              # Pricing page
  page.tsx              # Landing page

components/
  ui/                   # Shadcn UI primitives
  auth/                 # Login/Register forms
  dashboard/            # Sidebar, Header, Stats, Tools grid
  landing/              # Hero, Features, Testimonials, CTA
  layout/               # Navbar, Footer

lib/
  supabase/client.ts    # Browser Supabase client
  supabase/server.ts    # Server Supabase client
  utils.ts              # Shared utilities

supabase/
  migrations/           # SQL migrations

types/
  index.ts              # TypeScript types + Database schema
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Main dashboard |
| `/dashboard/profile` | User profile |
| `/dashboard/settings` | Settings |
| `/pricing` | Pricing plans |

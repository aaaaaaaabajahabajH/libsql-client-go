# Supabase Edge Functions

Edge Functions run in a Deno environment at the edge, close to your users.

## Planned functions

| Function | Purpose | Milestone |
|---|---|---|
| `stripe-webhook` | Handle Stripe payment events (subscription created, updated, cancelled) | M10 |
| `reset-credits` | Monthly cron job — reset all users' credit balances based on their plan | M11 |

## Developing locally

```bash
# Start the local Supabase stack
supabase start

# Serve a specific function
supabase functions serve stripe-webhook --env-file .env.local

# Deploy to production
supabase functions deploy stripe-webhook
```

## Environment variables

Edge Functions read secrets from Supabase secrets (not .env files).
Set them with:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

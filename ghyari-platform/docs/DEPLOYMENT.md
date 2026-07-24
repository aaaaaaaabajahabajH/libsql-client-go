# Deployment · Production Runbook

The reference procedure for taking Ghyari from `main` to serving real users. Read this once end to end before your first deploy — it's short by design.

---

## 1 · Pre-flight checklist

Before pointing DNS at anything:

- [ ] `GIN_MODE=release` set in the production env
- [ ] `JWT_SECRET` set from `scripts/generate-secrets.sh` (≥ 32 chars, cryptographically random)
- [ ] `DATABASE_URL` points to Turso (not `file:/tmp/…`) with an auth token
- [ ] `ANTHROPIC_API_KEY` set if AI Radar is enabled
- [ ] `CORS_ORIGINS` restricts to `https://ghyari.sa` (and staging domain if any) — never `*`
- [ ] TLS terminates in front of the API (Cloudflare, Nginx, Fly.io, etc.). Never expose the Go binary directly on :80/:443.
- [ ] Health check hits `/health` (returns `{"status":"healthy"}` when DB is reachable)
- [ ] Prometheus scrapes `/metrics`
- [ ] Backups scheduled for the DB (Turso does this daily; snapshot cadence documented per environment)
- [ ] Sentry DSN (or your logger of choice) collects unhandled panics

The API code **panics on startup** if `GIN_MODE=release` and `JWT_SECRET` is unset or matches the well-known dev default — this is intentional. Don't try to bypass it.

---

## 2 · Generate secrets

```bash
./scripts/generate-secrets.sh
```

Copy the output into your secret manager. **Do not** save the raw output to disk — the script warns on stderr for this reason. Suggested targets:

| Platform | Command |
|----------|---------|
| Fly.io | `./scripts/generate-secrets.sh \| grep = \| xargs -I{} fly secrets set {}` |
| Railway | `./scripts/generate-secrets.sh \| grep = \| xargs -I{} railway variables set {}` |
| AWS | `aws secretsmanager put-secret-value --secret-id ghyari-prod --secret-string file://<(./scripts/generate-secrets.sh)` |
| Kubernetes | `kubectl create secret generic ghyari-secrets --from-env-file=<(./scripts/generate-secrets.sh)` |

If a secret ever leaks: rotate immediately — every previously-issued JWT becomes invalid, so users get logged out (acceptable).

---

## 3 · Build

```bash
make prod-build          # or: cd backend && CGO_ENABLED=0 go build -ldflags="-s -w" -o /tmp/ghyari-api .
```

Verify:

```bash
make prod-check          # runs go vet + tsc --noEmit + validates env vars
```

Frontend:

```bash
cd frontend && VITE_API_URL=https://api.ghyari.sa/api/v1 npm run build
```

Mobile: see [`../mobile/APP_STORE_GUIDE.md`](../mobile/APP_STORE_GUIDE.md).

---

## 4 · Deploy — pick your target

### Fly.io (recommended for the API)

```bash
fly launch --no-deploy      # once, on first setup
# fly.toml already has [[services]] on :8080, health check on /health
fly secrets set $(./scripts/generate-secrets.sh | grep = | tr '\n' ' ')
fly deploy
```

### Docker (any host)

```bash
docker build -t ghyari-api ./backend
docker run -d --name ghyari-api \
  -e GIN_MODE=release \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e DATABASE_URL='libsql://…?authToken=…' \
  -p 8080:8080 \
  ghyari-api
```

### Frontend (Cloudflare Pages)

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name ghyari-web
```

### Mobile (App Store)

```bash
cd mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

Full checklist: [`mobile/APP_STORE_GUIDE.md`](../mobile/APP_STORE_GUIDE.md).

---

## 5 · Post-deploy verification

Run these from any external host (your laptop):

```bash
# 1. Health
curl -sf https://api.ghyari.sa/health | jq
#   → {"status":"healthy"} within 200ms

# 2. Response signals security headers
curl -sI https://api.ghyari.sa/health | grep -Ei 'strict-transport|x-content|x-frame'
#   → all three present in release mode

# 3. Products load
curl -s https://api.ghyari.sa/api/v1/products?limit=1 | jq '.data | length'
#   → 1

# 4. Auth failure path (401, not 500)
curl -sX POST https://api.ghyari.sa/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@x","password":"x"}' -o /dev/null -w '%{http_code}\n'
#   → 401

# 5. Metrics reachable (internal only — restrict this to your monitoring network)
curl -s https://api.ghyari.sa/metrics | head -5
```

If any of these fail, roll back before debugging in place.

---

## 6 · Rollback

```bash
# Fly.io — one previous release
fly releases
fly deploy --image registry.fly.io/ghyari-api:deployment-XXXXX

# Docker — start the previous tag
docker stop ghyari-api && docker rm ghyari-api
docker run -d --name ghyari-api ghyari-api:PREVIOUS_SHA
```

DB migrations are **additive only** (never `DROP` or `ALTER … DROP` — see [`../CONTRIBUTING.md`](../CONTRIBUTING.md)), so rolling back the binary alone is safe. Never roll back the DB.

---

## 7 · Monitoring — what to watch

| Signal | Threshold | Meaning |
|--------|-----------|---------|
| `/health` reachable | any failure | wake the on-call |
| `ghyari_http_requests_total{status=~"5.."}` rate | > 1/min sustained | server error spike |
| `ghyari_http_request_duration_seconds` p95 | > 500ms sustained | slow DB or query regression |
| `ghyari_db_query_duration_seconds` p95 | > 200ms sustained | index missing or DB pressure |
| Panic recovered | any | unhandled path — Sentry alert |

k6 baseline (weekly, from CI):

```bash
k6 run --vus 50 --duration 2m scripts/k6/load_test.js
```

Expected: p95 < 500ms on `/products`, error rate < 1%.

---

## 8 · Secret rotation

**Cadence:** every 90 days, or immediately on suspected leak.

```bash
NEW=$(openssl rand -hex 32)
fly secrets set JWT_SECRET="$NEW"
# All in-flight tokens become invalid — clients need to log in again.
# There is no dual-key window today (planned; see docs/ROADMAP.md).
```

Prefer to do this during a low-traffic window and post a maintenance note if the user base is large enough to notice.

---

## 9 · Backups

- **DB (Turso):** daily managed snapshots for 30 days on the paid tier. Set the retention on your account.
- **Uploaded assets (product images, distributor logos):** currently referenced but not stored by the API — hosted on the CDN of your choice. Configure lifecycle rules there.
- **Recovery test:** every quarter, restore the latest snapshot to a staging DB and hit `/products?limit=1`.

---

## 10 · Cost sketch (order-of-magnitude, USD)

| Item | Provider | Monthly |
|------|----------|---------|
| API compute (2× shared-cpu-1x) | Fly.io | ~$5 |
| DB | Turso (Hobby → Scaler) | $0 → $29 |
| Frontend hosting | Cloudflare Pages | $0 |
| CDN + WAF | Cloudflare | $0 |
| Domain | Namecheap/Google | ~$1 |
| Anthropic API (AI Radar) | Anthropic | usage-based (~$5-20 at low volume) |
| Apple Developer | Apple | $99/year |
| Sentry / observability | Sentry (Team) | $0 → $26 |

Order-of-magnitude for a small production deployment: **$15–90/month** all-in, before ad spend.

---

## 11 · Incident playbook

1. **Confirm** — is `/health` really down, or a monitor false-positive? Try from two networks.
2. **Comm** — post the status update (Twitter/X, in-app banner) before you start fixing.
3. **Rollback** first, debug in staging second. Never debug on a bleeding service.
4. **Postmortem** — same day. Include timeline, root cause, and one concrete prevention item.

Emergency contacts and paging rules live in your team's runbook, not here.

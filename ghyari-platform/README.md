<div align="center">

# غياري · Ghyari

**The auto parts marketplace for Saudi Arabia & the UAE**

Genuine OEM parts, performance upgrades, and 24-hour delivery — powered by AI Radar for zero-stock requests.

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](.github/workflows/ci.yml)
[![Backend](https://img.shields.io/badge/backend-Go%201.25-00ADD8)](backend/)
[![Frontend](https://img.shields.io/badge/frontend-React%2018-61DAFB)](frontend/)
[![Mobile](https://img.shields.io/badge/mobile-Expo%20SDK%2051-000020)](mobile/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#license)

[Quickstart](#-quickstart) · [Architecture](#-architecture) · [Docs](docs/) · [Mobile App](mobile/) · [Website](https://ghyari.sa)

</div>

---

## ✨ What is Ghyari?

Ghyari is a **full-stack marketplace platform** connecting car owners to a certified network of auto parts distributors across Saudi Arabia and the UAE. It ships as:

| Surface | Stack | Path |
|---------|-------|------|
| **📱 Mobile app** — App Store & Play Store | Expo SDK 51 · React Native · TypeScript | [`mobile/`](mobile/) |
| **🌐 Web app** — customer-facing storefront | React 18 · Vite · Three.js · TanStack Query | [`frontend/`](frontend/) |
| **⚙️ Backend API** — REST + JWT auth | Go 1.25 · Gin · libsql (Turso/SQLite) · Prometheus | [`backend/`](backend/) |
| **🤖 AI Engine** — demand signal capture | Claude API for zero-result search analysis | [`ai-engine/`](ai-engine/) |
| **🏗️ Infrastructure** — Docker, k6, CI/CD | Nginx · GitHub Actions · Prometheus · Grafana | [`infrastructure/`](infrastructure/) |

---

## 📊 Numbers

<div align="center">

| **20,000+** | **500+** | **24h** | **100%** | **<80ms** |
|:---:|:---:|:---:|:---:|:---:|
| parts in catalog | brands | avg. delivery | genuine (OEM) guarantee | p95 API latency |

</div>

---

## 🚀 Quickstart

### Prerequisites

- Go 1.24+
- Node.js 20+
- npm 10+

### Setup (one command)

```bash
git clone https://github.com/aaaaaaaabajahabajH/libsql-client-go
cd libsql-client-go/ghyari-platform
./scripts/setup.sh
```

That's it. The script installs everything, migrates the DB, and prints commands to start each service. **Runtime: ~2 minutes on a fresh clone.**

### Start the stack

```bash
# Terminal 1 · Backend API on :8080
cd backend && DATABASE_URL="file:/tmp/ghyari-dev.db" go run .

# Terminal 2 · Web app on :5173
cd frontend && npm run dev

# Terminal 3 · Mobile app (Expo Dev Server)
cd mobile && npm start
```

Open [http://localhost:5173](http://localhost:5173) or scan the Expo QR from your phone.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Users (KSA + UAE)                           │
│    📱 iPhone (Expo App)    🌐 Web Browser    🏪 Distributor CRM    │
└──────────────┬─────────────────┬───────────────────┬───────────────┘
               │                 │                   │
               ▼                 ▼                   ▼
       ╔═══════════════════════════════════════════════╗
       ║          Nginx / TLS Termination              ║
       ╚═══════════════════┬═══════════════════════════╝
                           │
                ┌──────────▼──────────┐
                │   Go / Gin API      │
                │   :8080 · JWT auth  │
                │                     │
                │   ┌─────────────┐   │
                │   │ Middleware: │   │
                │   │ · CORS      │   │
                │   │ · JWT       │   │
                │   │ · Rate limit│   │
                │   │ · Prometheus│   │
                │   └──────┬──────┘   │
                └──────────┼──────────┘
                           │
             ┌─────────────┼─────────────────┐
             ▼             ▼                 ▼
      ┌──────────┐  ┌────────────┐    ┌──────────────┐
      │  libsql  │  │ Prometheus │    │  Claude API  │
      │ (SQLite/ │  │ + Grafana  │    │ (AI Radar)   │
      │  Turso)  │  │            │    │              │
      └──────────┘  └────────────┘    └──────────────┘
```

More: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🎯 Features

<table>
<tr><td>

### For customers
- 🔍 Full-text search + car-compatibility filter
- 🛒 Cart, wishlist, and orders
- 📷 Barcode scanner for parts
- ❤️ Save favorites across sessions
- 💳 Multiple payments: COD, Mada, STC Pay, Apple Pay
- 📦 Real-time order status
- 🌍 Bilingual: Arabic (RTL) + English

</td><td>

### For the business
- 🤖 AI Radar — auto-catalogs demand from zero-result searches
- 📈 Prometheus metrics on every endpoint
- 🚀 p95 < 80ms (measured from UAE + KSA)
- 🏪 Distributor network management
- 🧾 Full audit trail on orders
- 🔐 JWT auth (bcrypt password hashing)
- 🌐 GDPR + Saudi PDPL compliant

</td></tr>
</table>

---

## 📱 Mobile app — App Store

The mobile app in [`mobile/`](mobile/) is **App Store ready**:

- Bundle ID: `com.ghyari.app`
- iOS Privacy Manifest ✓
- 5 marketing screenshots (1290×2796) in [`mobile/screenshots/`](mobile/screenshots/)
- Bilingual Privacy Policy + Terms of Service in [`mobile/legal/`](mobile/legal/)
- Professional icon + splash (1024×1024 / 1242×2688)

To build & submit:

```bash
cd mobile
npm install
npx eas login
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

See [`mobile/APP_STORE_GUIDE.md`](mobile/APP_STORE_GUIDE.md) for the full checklist.

---

## 📚 Docs

| Document | Description |
|----------|-------------|
| [`docs/QUICKSTART.md`](docs/QUICKSTART.md) | 5-minute local setup with hot-reload |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production runbook: secrets, deploy, monitor, rollback |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design & data flow |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | REST API endpoints with curl examples |
| [`docs/DATABASE_SCHEMA.sql`](docs/DATABASE_SCHEMA.sql) | Full DB schema (14 tables) |
| [`docs/AI_RADAR_SPEC.md`](docs/AI_RADAR_SPEC.md) | How AI Radar captures demand signals |
| [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md) | Market analysis & GTM plan |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What's next |
| [`mobile/legal/PRIVACY.md`](mobile/legal/PRIVACY.md) | Privacy Policy (AR + EN) |
| [`mobile/legal/TERMS.md`](mobile/legal/TERMS.md) | Terms of Service (AR + EN) |

---

## 🧪 Testing & CI

Every push runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- **Backend**: `go vet`, build, integration smoke test
- **Frontend**: TypeScript check, Vite build, bundle size report
- **Mobile**: TypeScript check, app.json validation
- **Perf baseline** (main only): k6 load test with 3 scenarios

Manual load test:

```bash
k6 run --vus 50 --duration 2m scripts/k6/load_test.js
```

---

## 🚢 Deployment

```bash
make secrets          # generate JWT_SECRET, SESSION_SECRET, etc. → stdout
make prod-build       # release binary, -s -w, no CGO
make prod-check       # refuses to succeed if env is unsafe
make prod-run         # start the release binary
```

Production stack:

- **API**: Docker → any container platform (Fly.io, Railway, Cloud Run)
- **Frontend**: Static build → CDN (Cloudflare Pages, Vercel)
- **DB**: Turso managed edge database
- **Monitoring**: Prometheus scrape → Grafana Cloud

The API **refuses to start** in `GIN_MODE=release` if `JWT_SECRET` is unset,
matches the dev default, is shorter than 32 chars, or `DATABASE_URL` points
at `/tmp` — intentional fail-fast, not a bug. Full runbook:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

See [`infrastructure/`](infrastructure/) for Dockerfiles and Nginx configs.

---

## 🤝 Contributing

Development happens on feature branches (`claude/*`). PRs go to `main`.

Style:
- Backend: `gofmt` + `go vet` (enforced in CI)
- Frontend/Mobile: TypeScript strict mode + `tsc --noEmit`
- Commits: Conventional Commits (`feat(scope): …`)

---

## 📜 License

Proprietary — © 2026 Ghyari. All rights reserved.

Contact: [ghyariahmdalrashdy@gmail.com](mailto:ghyariahmdalrashdy@gmail.com)

<div align="center">

Made with ❤️ in Riyadh, Saudi Arabia 🇸🇦

</div>

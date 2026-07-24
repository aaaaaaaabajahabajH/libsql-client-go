# Quickstart · بدء سريع

> Get the entire Ghyari stack running locally in **5 minutes**.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Go   | 1.24+  | [go.dev/dl](https://go.dev/dl/) |
| Node | 20+    | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| npm  | 10+    | Comes with Node |
| Docker _(optional, for prod-like)_ | 24+ | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |

Verify:

```bash
go version   # go1.24+
node --version   # v20+
npm --version    # 10+
```

---

## Setup — One command

Run the setup script from the repo root:

```bash
cd ghyari-platform
./scripts/setup.sh
```

**What it does** (2 minutes on a fresh clone):

1. ✓ Preflight — verifies Go / Node / npm
2. ✓ Builds Go API binary → `/tmp/ghyari-api`
3. ✓ Migrates SQLite database → `/tmp/ghyari-dev.db`
4. ✓ Seeds sample data (products, categories, cars)
5. ✓ Installs frontend + mobile npm packages
6. ✓ Copies `.env.example` → `.env` where missing
7. ✓ Prints run commands for each service

---

## Run each service

Open 3 terminals:

### <sub>Terminal 1</sub> · Backend API — port 8080

```bash
cd backend
DATABASE_URL="file:/tmp/ghyari-dev.db" go run .
```

You should see:

```text
[INFO] libsql connected: /tmp/ghyari-dev.db
[INFO] migrated 14 tables
[INFO] gin listening on :8080
```

Test:

```bash
curl -s http://localhost:8080/health | jq
# → {"status":"healthy","db":"ok","uptime":"…"}
```

### <sub>Terminal 2</sub> · Web app — port 5173

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### <sub>Terminal 3</sub> · Mobile app — Expo

```bash
cd mobile
npm start
```

- Press `i` to open iOS Simulator (requires Xcode)
- Press `a` to open Android Emulator (requires Android Studio)
- Or scan the QR with the **Expo Go** app on your phone

---

## Try the API

### List products

```bash
curl -s "http://localhost:8080/api/v1/products?limit=3" | jq '.data[] | {name_ar, price, brand}'
```

### Search

```bash
curl -s "http://localhost:8080/api/v1/products/search?q=فرامل" | jq '.data | length'
```

### Register + login

```bash
# Register
TOKEN=$(curl -sX POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@ghyari.sa","password":"Test1234","name":"عميل تجريبي"}' \
  | jq -r '.token')

# Use token
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/cart | jq
```

Full endpoint list: [`docs/API_REFERENCE.md`](API_REFERENCE.md)

---

## Common tasks

### Reset the database

```bash
rm /tmp/ghyari-dev.db
./scripts/setup.sh   # re-runs migration + seed
```

### Run tests

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npx tsc --noEmit

# Mobile
cd mobile && npx tsc --noEmit
```

### Load test the API

```bash
# Requires k6: brew install k6 (macOS) or via https://k6.io/
k6 run --vus 50 --duration 30s scripts/k6/load_test.js
```

Expected thresholds:

| Endpoint | p95 | p99 |
|----------|-----|-----|
| `/products` | < 500 ms | < 1 s |
| `/products/search` | < 800 ms | < 1.5 s |
| `/health` | < 20 ms | < 50 ms |

---

## Troubleshooting

<details>
<summary><strong>Port 8080 already in use</strong></summary>

Change it via env var:

```bash
PORT=8090 DATABASE_URL="file:/tmp/ghyari-dev.db" go run .
```

Then update `frontend/.env` and `mobile/.env` to point to the new port.
</details>

<details>
<summary><strong>Mobile: "Cannot find module" on Expo start</strong></summary>

Clear the cache and reinstall:

```bash
cd mobile
rm -rf node_modules .expo
npm install
npx expo start --clear
```
</details>

<details>
<summary><strong>SQLite locked errors</strong></summary>

The default DB uses WAL mode, but if you see `SQLITE_BUSY`:

```bash
# Kill any hanging Go processes
pkill -f ghyari-api
# Remove journal files
rm /tmp/ghyari-dev.db-shm /tmp/ghyari-dev.db-wal 2>/dev/null
```
</details>

<details>
<summary><strong>Mobile app can't reach the API</strong></summary>

If running the mobile app on a physical device, `localhost` refers to the phone itself. Use your machine's LAN IP:

```bash
# Find your IP
ipconfig getifaddr en0   # macOS
hostname -I | awk '{print $1}'   # Linux

# Then edit mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api/v1
```
</details>

---

## Next steps

- 📱 **Ship the mobile app** → [`mobile/APP_STORE_GUIDE.md`](../mobile/APP_STORE_GUIDE.md)
- 🚢 **Deploy to production** → [`infrastructure/`](../infrastructure/)
- 🤖 **How AI Radar works** → [`docs/AI_RADAR_SPEC.md`](AI_RADAR_SPEC.md)
- 🏗️ **System design** → [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
- 🌐 **Production site** → [ghyari.sa](https://ghyari.sa)

---

<div align="center">

Need help? Open an issue or email **support@ghyari.sa**.

</div>

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repository contains two unrelated codebases living side by side:

1. **`libsql` / root module** (`github.com/tursodatabase/libsql-client-go`) — the upstream Go
   `database/sql` driver for libSQL/Turso. This is the original project and its public API surface.
2. **`ghyari-platform/`** — a separate, self-contained automotive-parts e-commerce application
   (Go backend + React frontend + AI worker) that was added on top of the driver repo and consumes
   it as a dependency via a `replace` directive. It has its own Go modules, its own docs, and its
   own deployment pipeline; treat it as an independent project rooted at that directory, not as
   part of the driver's public API.

When making changes, check which of the two you're in — `go.mod` at the repo root belongs to the
driver, while `ghyari-platform/backend/go.mod` and `ghyari-platform/ai-engine/go.mod` are separate
modules with their own dependencies.

---

## Part 1: libsql-client-go (the driver)

### What it is

A Go `database/sql`-compatible driver (`sql.Register("libsql", ...)`) for connecting to:
- **libSQL/Turso servers** over HTTP(S) via the Hrana v2 protocol (`libsql://`, `http(s)://`)
- **libSQL/Turso servers** over WebSockets via Hrana (`ws(s)://`)
- **Local SQLite files** (`file://`), by delegating to a registered `sqlite`/`sqlite3` driver

### Architecture

```
libsql/sql.go                    Driver{} + Option/config, URL scheme dispatch, connector setup
libsql/internal/http/            HTTP(S) transport
  driver.go                       thin entry point -> hranaV2
  hranaV2/hranaV2.go              Conn/Stmt/Rows implementing database/sql/driver, pipelines requests
  shared/                         statement.go, rows.go, result.go — shared between http and ws paths
libsql/internal/ws/              WebSocket transport
  driver.go                       Conn/Stmt/Rows implementing database/sql/driver over a websocket
  websockets.go                   connection/session management, request/response correlation
libsql/internal/hrana/           Wire-protocol types for the Hrana v2 protocol
  stmt.go, batch.go, value.go, pipeline_request.go, pipeline_response.go, stream_request.go,
  stream_result.go, stmt_result.go, batch_result.go
                                  JSON request/response payloads shared by both http and ws backends
```

Key flow: `libsql.Driver.Open` / `libsql.NewConnector` parses the DSN, decides which of the three
backends (`http`, `ws`, `file`) to use based on URL scheme, and validates auth/TLS query
parameters (rejecting raw `auth_token`/`authToken`/`jwt`/`tls` params in favor of `WithAuthToken`/
`WithTls` options or their query-string equivalents handled internally). Both `http` and `ws`
backends ultimately encode/decode the same Hrana v2 JSON structures from `internal/hrana`, but
`http` sends them as a batched pipeline (`hranaV2`) while `ws` maintains a persistent socket
session (`websockets.go`). `internal/http/shared` holds `Rows`/`Statement`/`Result` types common to
both, so behavioral fixes to row/column/value handling generally belong there, not duplicated per
transport.

### URL scheme rules worth knowing

- `libsql://` auto-resolves to `https://`/`wss://` unless TLS is explicitly disabled (and then
  requires an explicit port).
- `wss://`/`https://` cannot opt out of TLS; `ws://`/`http://` cannot opt into it — these are hard
  errors, not silently ignored.
- Auth tokens/JWTs must be passed via `WithAuthToken(...)` (or the `NewConnector` option), not as
  URL query parameters — the driver explicitly errors if `auth_token`, `authToken`, or `jwt` show
  up in the DSN passed to `NewConnector` (the classic `sql.Open` path via `Driver.Open` still
  accepts them as query params for backwards compatibility, see `extractJwt`/`extractTls`).

### Common commands

Run everything from the repo root (module `github.com/tursodatabase/libsql-client-go`).

```bash
# Build
go build -v ./...

# Format check (CI fails if this reports anything)
gofmt -s -l .

# Vet
go vet -v ./...

# Lint (same linters as CI: errcheck, gosimple, govet, ineffassign, staticcheck, typecheck, unused)
golangci-lint run

# sql.Rows/Stmt Close-check vet tool used in CI
go install github.com/ryanrolds/sqlclosecheck@latest
go vet -vettool=$(go env GOPATH)/bin/sqlclosecheck ./...
```

### Tests

Integration tests live in `tests/http` and `tests/ws` (not under `libsql/`) and require a running
libSQL server (`sqld`) — they read `LIBSQL_TEST_HTTP_DB_URL` and `LIBSQL_TEST_WS_DB_URL`. CI runs
`ghcr.io/tursodatabase/libsql-server:latest` on `localhost:8080` as a service container. Locally:

```bash
docker run -p 8080:8080 ghcr.io/tursodatabase/libsql-server:latest

export LIBSQL_TEST_HTTP_DB_URL="http://127.0.0.1:8080"
export LIBSQL_TEST_WS_DB_URL="ws://127.0.0.1:8080"

# Full suite — CI runs with -parallel 1 because tests share the same sqld instance/state
go test -v -parallel 1 ./...

# Single package
go test -v -parallel 1 ./tests/http/...
go test -v -parallel 1 ./tests/ws/...

# Unit tests that don't need a live server (protocol encoding, etc.)
go test ./libsql/internal/hrana/...
go test ./libsql/internal/http/shared/...

# Single test
go test -run TestName ./tests/http/...
```

### CI (`.github/workflows/go.yml`)

Runs on Go `1.20` and the latest `1.x` against a live `sqld` service container, in this order:
`gofmt -s -l .` → `go get ./...` → `go vet` → `sqlclosecheck` → `golangci-lint` → `go build` →
`go test -parallel 1`. Match this locally before pushing.

### Examples

`examples/` is its own Go module (separate `go.mod`) with runnable samples, e.g.
`examples/sql/counter/main.go`. Run with `go run` from inside `examples/`.

---

## Part 2: ghyari-platform

An Arabic-first automotive parts e-commerce platform (غياري). Independent from the driver code
above except that its Go services import this repo's `libsql` package via a local `replace`
directive (`replace github.com/tursodatabase/libsql-client-go => ../../`), so changes to the driver
here can be exercised end-to-end through this app.

### Layout

```
ghyari-platform/
  backend/          Go + Gin REST API, module github.com/ghyari/api (own go.mod, go 1.23)
    main.go          server bootstrap: env validation, libsql connection, migrations/seed, routes
    internal/db/     migrate.go, seed.go
    internal/handlers/  products, cars, auth, ai_radar, upload, stubs (per-resource Gin handlers)
    internal/middleware/ auth (JWT) + role-based access, logging
    internal/models/    product, ai_radar
    internal/storage/   gcs.go — Google Cloud Storage client for uploads
  ai-engine/        Separate Go module github.com/ghyari/ai-engine — AI Radar background worker
                    (Redis + libsql, no HTTP server of its own)
  frontend/         React 18 + TypeScript + Vite, Three.js/@react-three 3D UI, Tailwind, RTL/Arabic
                    i18n (react-i18next), TanStack Query, Zustand, Zod
  infrastructure/   docker-compose.yml (api + frontend + redis + ai-radar worker + nginx),
                    nginx.conf, gcloud/ (cloudbuild.yaml, cloudrun.yaml)
  scripts/          deploy.sh, setup-gcloud.sh, seed_data.sql
  docs/             ARCHITECTURE.md, AI_RADAR_SPEC.md, DATABASE_SCHEMA.sql, PRODUCT_STRATEGY.md,
                    ROADMAP.md — read ARCHITECTURE.md first for the full service breakdown,
                    DB schema, and design system; treat it as the source of truth for intended
                    design (some of it, e.g. multi-service split, is aspirational/roadmap rather
                    than fully implemented in backend/ today)
  .env.example      Required environment variables (Arabic-commented) — DATABASE_URL,
                    DATABASE_AUTH_TOKEN, JWT_SECRET, ANTHROPIC_API_KEY, ALLOWED_ORIGINS,
                    REDIS_URL, SCAN_INTERVAL, GCS_BUCKET, GCS_CDN_BASE
```

### Backend architecture

`backend/main.go` is a single Gin process (not yet split into the microservices described in
`docs/ARCHITECTURE.md`):
- Opens `libsql` via `database/sql` using `DATABASE_URL`/`DATABASE_AUTH_TOKEN`; defaults to a local
  `file:./ghyari_local.db` when unset.
- In `GIN_MODE=release`, hard-fails startup if `DATABASE_URL`, `JWT_SECRET`, or `ANTHROPIC_API_KEY`
  are missing, or if `JWT_SECRET` is still the placeholder value.
- Runs `db.Migrate` then `db.Seed` on startup (seed failures only warn, don't fail startup).
- Optionally wires a GCS client (`storage.NewGCSClient`) when `GCS_BUCKET` is set, for the
  upload handlers.
- Routes are grouped under `/api/v1`: public `auth`/`products`/`cars`/`categories`/`distributors`,
  a `protected` group behind `middleware.RequireAuth()` (cart, orders, AI radar submission), and an
  `admin` group behind `RequireAuth()` + `RequireRole("admin")` (product/distributor/order
  management, AI radar analytics, uploads).
- `GET /health` pings the DB and reports service status — used by Docker Compose healthchecks and
  the Cloud Run deploy workflow's post-deploy check.

### Common commands

```bash
# Backend (from ghyari-platform/backend)
go build ./...
go run .
go test ./...

# AI engine (from ghyari-platform/ai-engine)
go build ./...

# Frontend (from ghyari-platform/frontend)
npm install
npm run dev       # vite dev server
npm run build      # tsc && vite build
npm run lint        # eslint src --ext ts,tsx
npm run preview

# Full local stack (from ghyari-platform/infrastructure)
docker compose up --build
```

### Deployment

`.github/workflows/deploy-gcloud.yml` triggers on pushes to `main` that touch `ghyari-platform/**`
(or manual dispatch). It builds and pushes `backend` and `frontend` Docker images to Google
Artifact Registry, deploys the API via `gcloud run services replace` using
`infrastructure/gcloud/cloudrun.yaml`, deploys the frontend via `deploy-cloudrun` action, then
polls `/health` on the deployed API. This is a real, live deployment pipeline (Workload Identity
Federation, specific GCP project ID hardcoded in the workflow) — treat changes to it as
infrastructure changes, not routine code edits.

### Conventions

- User-facing strings, error messages, and log lines in the backend are frequently bilingual
  (Arabic + English, e.g. `"❌ متغير البيئة المطلوب غير موجود: %s"`); follow this pattern when
  adding new user-facing messages rather than switching the codebase to English-only.
- The frontend is RTL-first (Arabic primary locale) with English secondary via `react-i18next`.

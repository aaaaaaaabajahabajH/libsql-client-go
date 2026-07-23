# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repository actually contains two unrelated projects living side by side:

1. **`libsql-client-go`** (repo root, `libsql/`, `tests/`, `examples/`) — the upstream Turso/libSQL `database/sql` driver for Go. This is the original OSS project the repo is named after.
2. **`ghyari-platform/`** (`ghyari-platform/`) — a separate, unrelated Arabic automotive-parts e-commerce platform (غياري) that was built inside this repo as an application that *consumes* the driver above via a `replace` directive. It has its own Go modules, a React/Three.js frontend, an AI worker, and its own CI/deploy pipeline.

Treat these as two independent codebases sharing one git history. Changes to one almost never require touching the other — check which one a task concerns before assuming shared conventions apply.

---

## Part 1: `libsql-client-go` (the driver)

### Commands

```bash
# Format check (CI fails if this reports anything)
gofmt -s -l .

# Vet
go vet -v ./...

# Extra vet check used in CI (flags unclosed *sql.Rows/*sql.Stmt)
go install github.com/ryanrolds/sqlclosecheck@latest
go vet -vettool=$(go env GOPATH)/bin/sqlclosecheck ./...

# Lint (config in .golangci.yml: errcheck, gosimple, govet, ineffassign, staticcheck, typecheck, unused)
golangci-lint run

# Build
go build -v ./...

# Test (integration tests require a running libsql server, and CI runs them
# non-parallel because they share the same server)
LIBSQL_TEST_HTTP_DB_URL="http://127.0.0.1:8080" \
LIBSQL_TEST_WS_DB_URL="ws://127.0.0.1:8080" \
go test -v -parallel 1 ./...

# Single package / single test
go test -v ./libsql/internal/hrana/...
go test -v -run TestName ./tests/http/...
```

The HTTP/WS integration tests (`tests/http`, `tests/ws`) need a real libsql server. CI starts one via the `ghcr.io/tursodatabase/libsql-server:latest` Docker service on port 8080 (see `.github/workflows/go.yml`). Locally, run that same image and export the two `LIBSQL_TEST_*_DB_URL` env vars before running tests, otherwise those packages will fail or skip.

The `examples/` module is a separate Go module (`examples/go.mod`) with its own `replace github.com/tursodatabase/libsql-client-go => ../`, so `go build ./...` at the repo root does not build it — `cd examples && go build ./...` if you need to verify it.

### Architecture

The driver implements the standard `database/sql/driver` interfaces and dispatches to one of three backends based on the URL scheme, all wired up in `libsql/sql.go`:

- **`libsql://` / `https://` / `http://`** → `libsql/internal/http` → `libsql/internal/http/hranaV2` — talks to a Hrana-over-HTTP endpoint using the pipelined/batch request format defined in `libsql/internal/hrana` (`pipeline_request.go`, `pipeline_response.go`, `stream_request.go`, `stream_result.go`, `batch.go`). `libsql/internal/http/shared` builds the actual `driver.Rows`/`driver.Result` from parsed responses.
- **`wss://` / `ws://`** → `libsql/internal/ws` — talks to the same Hrana protocol but over a persistent WebSocket (`websockets.go`), using `nhooyr.io/websocket`.
- **`file://`** → delegates straight to whatever `sqlite`/`sqlite3` driver is registered via `sql.Register` (e.g. `modernc.org/sqlite`) — this package does not implement local SQLite itself.

Key conventions in `libsql/sql.go` worth knowing before changing connection/auth handling:
- Auth tokens must be passed via `WithAuthToken`/`?authToken=` — the code explicitly rejects `auth_token`, `authToken`, `jwt`, and `tls` as raw query params in `NewConnector`'s path (but still supports `auth_token`/`jwt`/`tls` as query params in the legacy `Driver.Open` path via `extractJwt`/`extractTls`). Any unrecognized query parameter is a hard error.
- TLS is inferred from scheme (`libsql://` → https by default, `ws/http` → no TLS, `wss/https` → TLS required) and it's an error to contradict the scheme's implied TLS via `WithTls`/`?tls=`.
- `WithProxy` only works for HTTP(S); proxying `ws://`/`wss://` is explicitly unsupported.

`libsql/internal/hrana` is protocol-encoding-only (no I/O): value encoding/decoding (`value.go`), statement/batch payload shapes, and their `_test.go` counterparts. When adding support for a new SQL value type or Hrana feature, that package plus `libsql/internal/http/shared` and `libsql/internal/ws/websockets.go` are usually the three places to update in tandem — the HTTP and WS backends each have their own copy of parameter conversion and result decoding rather than sharing one implementation.

---

## Part 2: `ghyari-platform/` (the application)

An independent multi-service app that depends on the driver above via `replace ... => ../../` in each Go module's `go.mod`, so local changes to the driver are picked up immediately without a `go.mod` version bump.

### Layout

- `backend/` — Go/Gin REST API (module `github.com/ghyari/api`, Go 1.23). Entry point `main.go` wires DB connection, migrations/seed (`internal/db`), handlers (`internal/handlers`), auth/role middleware (`internal/middleware`), and GCS upload storage (`internal/storage`).
- `ai-engine/` — standalone Go worker (module `github.com/ghyari/ai-engine`) that calls the Claude/Anthropic API to analyze customer demand signals ("AI Radar") and polls on `SCAN_INTERVAL`.
- `frontend/` — React 18 + TypeScript + Vite + Three.js/`@react-three/fiber` SPA with Arabic/English i18n (`react-i18next`) and RTL support.
- `infrastructure/` — `docker-compose.yml` (api + frontend + redis + ai-radar + nginx), `nginx.conf`, and `gcloud/` (Cloud Run service specs, Cloud Build config).
- `docs/` — architecture, product strategy, DB schema and roadmap docs (see `docs/ARCHITECTURE.md` for the full system diagram and service breakdown).
- `scripts/` — `deploy.sh`, `setup-gcloud.sh`, `seed_data.sql`.

### Commands

```bash
# Backend
cd ghyari-platform/backend
go build ./...
go vet ./...
go run .                    # serves on :8080, defaults to file:./ghyari_local.db if DATABASE_URL unset

# AI engine
cd ghyari-platform/ai-engine
go build ./...

# Frontend
cd ghyari-platform/frontend
npm install
npm run dev                 # vite dev server
npm run build                # tsc && vite build
npm run lint                 # eslint src --ext ts,tsx

# Full local stack
cd ghyari-platform/infrastructure
cp ../.env.example .env      # then fill in real values
docker compose up --build
```

There are currently no `_test.go` files under `ghyari-platform/` — treat any test-writing task here as adding new coverage from scratch, not extending an existing suite.

### Conventions and gotchas

- **Bilingual (Arabic/English) throughout**: error messages, log lines, and doc comments frequently pair Arabic and English (e.g. `main.go`'s startup validation logs, the 404 handler body, `.env.example` comments). Match this style rather than switching handlers to English-only.
- **Startup env validation is `GIN_MODE=release`-gated**: `main.go` only enforces `DATABASE_URL`, `JWT_SECRET`, and `ANTHROPIC_API_KEY` (and rejects the placeholder `JWT_SECRET` value) when running in release mode, so local/dev mode intentionally tolerates missing/placeholder secrets.
- **CORS allowlist** comes from `ALLOWED_ORIGINS` (comma-separated), defaulting to `localhost:5173`/`localhost:3000` for dev.
- **Route structure** in `backend/main.go` is grouped by auth level: public (`/api/v1/products`, `/categories`, `/distributors`, `/cars`), authenticated (`protected` group: cart, orders, AI request submission), and admin-only (`admin` group, requiring `middleware.RequireRole("admin")`) — follow this three-tier grouping when adding new endpoints rather than adding ad-hoc middleware checks.
- **Deployment is Cloud Run based**: `.github/workflows/deploy-gcloud.yml` triggers only on pushes to `main` that touch `ghyari-platform/**`, builds both Docker images (`backend/Dockerfile`, `frontend/Dockerfile`), pushes to Artifact Registry, deploys via `infrastructure/gcloud/cloudrun.yaml`/`deploy-cloudrun`, then health-checks `/health`. This workflow is entirely separate from the driver's `go.yml` CI and does not run for changes outside `ghyari-platform/`.
- **Database**: uses this repo's own `libsql` driver against Turso in production and a local `file:./ghyari_local.db` SQLite file in dev — `db.Migrate`/`db.Seed` in `backend/internal/db` run automatically on every backend startup.

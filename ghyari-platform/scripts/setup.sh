#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Ghyari Platform — One-Command Setup
# Inspired by `pd init connect` and `create-next-app`
#
# Usage: ./scripts/setup.sh
#
# What it does:
#   1. Checks required tools (Go, Node, npm)
#   2. Installs backend dependencies + builds
#   3. Runs database migration + seeds sample data
#   4. Installs frontend dependencies
#   5. Installs mobile dependencies
#   6. Copies .env.example → .env for each subproject
#   7. Prints a "next steps" guide
#
# Runtime: ~2 minutes on a fresh clone
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── ANSI colors ─────────────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
RESET='\033[0m'

log()   { printf "${BLUE}▸${RESET} %s\n" "$*"; }
ok()    { printf "${GREEN}✓${RESET} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${RESET} %s\n" "$*"; }
err()   { printf "${RED}✗${RESET} %s\n" "$*" >&2; }
step()  { printf "\n${BOLD}${CYAN}══ %s ══${RESET}\n" "$*"; }

# ── Root dir (script may be invoked from anywhere) ──────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Banner ──────────────────────────────────────────────────────────────────
cat <<'BANNER'

  ██████╗ ██╗  ██╗██╗   ██╗ █████╗ ██████╗ ██╗
 ██╔════╝ ██║  ██║╚██╗ ██╔╝██╔══██╗██╔══██╗██║
 ██║  ███╗███████║ ╚████╔╝ ███████║██████╔╝██║
 ██║   ██║██╔══██║  ╚██╔╝  ██╔══██║██╔══██╗██║
 ╚██████╔╝██║  ██║   ██║   ██║  ██║██║  ██║██║
  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝

  Auto Parts Marketplace · KSA & UAE
  https://ghyari.sa

BANNER

# ── Step 1: Preflight ──────────────────────────────────────────────────────
step "1/6 · Preflight"

MISSING=0
check_cmd() {
  local cmd="$1"
  local min_version="${2:-}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "$cmd not found${min_version:+ (need $min_version+)}"
    MISSING=$((MISSING + 1))
  else
    local v
    v=$("$cmd" --version 2>&1 | head -1)
    ok "$cmd — $v"
  fi
}
check_cmd go "1.24"
check_cmd node "20"
check_cmd npm "10"

if [ $MISSING -gt 0 ]; then
  err "$MISSING required tool(s) missing. Install them and try again."
  echo
  echo "  Go:    https://go.dev/dl/"
  echo "  Node:  https://nodejs.org/ (or use nvm/fnm/asdf)"
  exit 1
fi

# ── Step 2: Backend ────────────────────────────────────────────────────────
step "2/6 · Backend (Go API)"

cd "$ROOT/backend"
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  ok "Created backend/.env from example"
else
  ok "backend/.env exists — kept"
fi

log "Downloading Go modules..."
go mod download
ok "Go modules ready"

log "Building API binary → /tmp/ghyari-api"
CGO_ENABLED=0 go build -ldflags="-s -w" -o /tmp/ghyari-api .
BINARY_SIZE=$(du -h /tmp/ghyari-api | cut -f1)
ok "Built /tmp/ghyari-api ($BINARY_SIZE)"

# ── Step 3: Database ───────────────────────────────────────────────────────
step "3/6 · Database (SQLite via libsql)"

DB_PATH="/tmp/ghyari-dev.db"
if [ -f "$DB_PATH" ]; then
  warn "Existing DB at $DB_PATH — backing up to $DB_PATH.bak"
  mv "$DB_PATH" "$DB_PATH.bak"
fi

log "Migrating schema..."
DATABASE_URL="file:$DB_PATH" /tmp/ghyari-api &
API_PID=$!
sleep 3
if kill -0 $API_PID 2>/dev/null; then
  kill $API_PID
  wait $API_PID 2>/dev/null || true
  ok "Schema migrated → $DB_PATH"
else
  err "API failed to start — schema migration may have failed"
fi

if [ -f "$ROOT/scripts/seed_data.sql" ]; then
  log "Seeding sample data..."
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_PATH" < "$ROOT/scripts/seed_data.sql" 2>/dev/null || warn "Seed had warnings"
    ok "Sample data seeded"
  else
    warn "sqlite3 CLI not found — skipping seed (install: apt-get install sqlite3)"
  fi
fi

# ── Step 4: Frontend ───────────────────────────────────────────────────────
step "4/6 · Frontend (React + Vite)"

cd "$ROOT/frontend"
if [ ! -f .env ]; then
  cat > .env <<EOF
VITE_API_URL=http://localhost:8080/api/v1
EOF
  ok "Created frontend/.env"
fi

log "Installing npm dependencies..."
npm install --prefer-offline --no-audit --no-fund --loglevel=error
ok "Frontend dependencies installed"

# ── Step 5: Mobile ─────────────────────────────────────────────────────────
step "5/6 · Mobile (Expo + React Native)"

cd "$ROOT/mobile"
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  ok "Created mobile/.env from example"
fi

log "Installing Expo dependencies..."
npm install --prefer-offline --no-audit --no-fund --loglevel=error
ok "Mobile dependencies installed"

# ── Step 6: Summary + Next Steps ───────────────────────────────────────────
step "6/6 · Ready 🎉"

cat <<EOF

  ${GREEN}${BOLD}Setup complete!${RESET}

  ${BOLD}Start the stack:${RESET}

    ${CYAN}# Terminal 1 · Backend (port 8080)${RESET}
    cd backend && DATABASE_URL="file:$DB_PATH" go run .

    ${CYAN}# Terminal 2 · Frontend (port 5173)${RESET}
    cd frontend && npm run dev

    ${CYAN}# Terminal 3 · Mobile (Expo Dev Server)${RESET}
    cd mobile && npm start

  ${BOLD}Endpoints:${RESET}

    API health:   http://localhost:8080/health
    Metrics:      http://localhost:8080/metrics
    Web app:      http://localhost:5173
    Mobile:       scan the QR from expo

  ${BOLD}Docs:${RESET}

    Quickstart:     docs/QUICKSTART.md
    Architecture:   docs/ARCHITECTURE.md
    API Reference:  docs/API_REFERENCE.md

  ${DIM}Ghyari · ${RESET}${BLUE}https://ghyari.sa${RESET}

EOF

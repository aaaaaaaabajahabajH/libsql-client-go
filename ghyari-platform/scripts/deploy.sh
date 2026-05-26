#!/usr/bin/env bash
# deploy.sh — Ghyari platform deployment script
# Usage: ./scripts/deploy.sh [--env staging|production]
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
DEPLOY_ENV="${1:-production}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
COMPOSE_FILE="$REPO_ROOT/infrastructure/docker-compose.yml"
HEALTH_URL="http://localhost:8080/health"
METRICS_URL="http://localhost:8080/metrics"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { echo "❌ $*" >&2; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
log "🔍 Pre-flight checks (env=$DEPLOY_ENV)..."
command -v docker >/dev/null || fail "Docker not installed"
command -v docker-compose >/dev/null || fail "docker-compose not installed"
[[ -f "$REPO_ROOT/.env" ]] || fail ".env file missing — copy .env.example and fill values"

# ── Build backend ─────────────────────────────────────────────────────────────
log "🔨 Building backend..."
cd "$BACKEND_DIR"
CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ghyari-api . || fail "Backend build failed"
BACKEND_SIZE=$(du -sh ghyari-api | cut -f1)
log "   ✅ Backend binary: $BACKEND_SIZE"

# ── Build frontend ────────────────────────────────────────────────────────────
log "🎨 Building frontend..."
cd "$FRONTEND_DIR"
npm ci --frozen-lockfile --silent
npx tsc --noEmit || fail "TypeScript errors found"
npm run build || fail "Frontend build failed"
FRONTEND_SIZE=$(du -sh dist | cut -f1)
log "   ✅ Frontend dist: $FRONTEND_SIZE"
cd "$REPO_ROOT"

# ── Docker build & up ─────────────────────────────────────────────────────────
log "🐳 Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --parallel

log "🚀 Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# ── Health check ──────────────────────────────────────────────────────────────
log "💓 Waiting for health check..."
RETRIES=15
for i in $(seq 1 $RETRIES); do
  STATUS=$(curl -sf "$HEALTH_URL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
  if [[ "$STATUS" == "healthy" ]]; then
    log "   ✅ API is healthy"
    break
  fi
  if [[ $i -eq $RETRIES ]]; then
    fail "API health check timed out after ${RETRIES}s"
  fi
  sleep 2
done

# ── Smoke tests ───────────────────────────────────────────────────────────────
log "🧪 Running smoke tests..."
test_endpoint() {
  local label="$1" url="$2" expected_field="$3"
  local result
  result=$(curl -sf "$url" 2>/dev/null) || { log "   ❌ FAIL: $label"; return 1; }
  echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$expected_field' in d, 'missing $expected_field'" \
    && log "   ✅ $label" \
    || { log "   ❌ FAIL: $label — field '$expected_field' missing"; return 1; }
}

test_endpoint "Health"       "$HEALTH_URL"               "status"
test_endpoint "Products"     "http://localhost:8080/api/v1/products"     "data"
test_endpoint "Categories"   "http://localhost:8080/api/v1/categories"   "categories"
test_endpoint "Cars"         "http://localhost:8080/api/v1/cars"         "brands"
curl -sf "$METRICS_URL" | grep -q "ghyari_http_requests_total" \
  && log "   ✅ Prometheus metrics" \
  || log "   ⚠️  Prometheus metrics not yet scraped (requests needed)"

# ── Performance snapshot ──────────────────────────────────────────────────────
log "⚡ Quick latency snapshot (10 requests each)..."
measure() {
  local url="$1" label="$2"
  local total=0
  for _ in $(seq 1 10); do
    ms=$(curl -sf -o /dev/null -w "%{time_total}" "$url" 2>/dev/null || echo "0")
    total=$(python3 -c "print($total + $ms)")
  done
  avg=$(python3 -c "print(round($total / 10 * 1000, 1))")
  log "   $label: ${avg}ms avg"
}
measure "http://localhost:8080/health"                       "  /health    "
measure "http://localhost:8080/api/v1/products?limit=10"     "  /products  "
measure "http://localhost:8080/api/v1/categories"            "  /categories"

log ""
log "✅ Deploy complete! ($DEPLOY_ENV)"
log "   API:     http://localhost:8080"
log "   Metrics: $METRICS_URL"
log "   Frontend: http://localhost:3000"

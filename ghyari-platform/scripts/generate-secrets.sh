#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Ghyari — Production Secret Generator
#
# Outputs a .env block with freshly generated cryptographic secrets.
# Nothing is written to disk — YOU pipe it wherever secrets belong
# (Fly.io secrets, Railway variables, AWS Secrets Manager, 1Password, etc.).
#
# Usage:
#   ./scripts/generate-secrets.sh              # print to stdout
#   ./scripts/generate-secrets.sh > /tmp/env   # careful — plaintext on disk
#
# For deploy platforms:
#   ./scripts/generate-secrets.sh | grep = | xargs -I{} fly secrets set {}
#   ./scripts/generate-secrets.sh | grep = | xargs -I{} railway variables set {}
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Prefer openssl; fall back to /dev/urandom if unavailable.
gen_hex() {
  local bytes="$1"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    head -c "$bytes" /dev/urandom | od -A n -t x1 | tr -d ' \n'
  fi
}

BOLD='\033[1m'
DIM='\033[2m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# All warnings go to stderr so `> file` or `| xargs` gets a clean stdout.
warn() { printf "${YELLOW}%s${RESET}\n" "$*" >&2; }
err()  { printf "${RED}%s${RESET}\n"    "$*" >&2; }

JWT_SECRET=$(gen_hex 32)                # 256 bits — HS256 signing
SESSION_SECRET=$(gen_hex 32)            # 256 bits — session cookies (future)
ADMIN_BOOTSTRAP=$(gen_hex 16)           # short-lived admin bootstrap token

# ── Warnings to stderr ──────────────────────────────────────────────────────
{
  printf "\n${BOLD}⚠  Store these in a secret manager. Do not commit.${RESET}\n"
  printf "${DIM}    Suggested targets:\n"
  printf "      · Fly.io:      fly secrets set JWT_SECRET=…\n"
  printf "      · Railway:     railway variables set JWT_SECRET=…\n"
  printf "      · AWS:         aws secretsmanager put-secret-value …\n"
  printf "      · Cloudflare:  wrangler secret put JWT_SECRET\n"
  printf "      · Kubernetes:  kubectl create secret generic ghyari-secrets …\n${RESET}"
  echo
} >&2

# ── Machine-parseable output on stdout ──────────────────────────────────────
cat <<EOF
# Ghyari production secrets — generated $(date -u +'%Y-%m-%dT%H:%M:%SZ')
# NEVER COMMIT THIS FILE. Add to your secret manager and delete the local copy.

GIN_MODE=release
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ADMIN_BOOTSTRAP_TOKEN=${ADMIN_BOOTSTRAP}
EOF

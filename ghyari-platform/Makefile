# Ghyari Platform · Makefile
# Common tasks so developers don't hunt through docs.
# Run `make` (no args) or `make help` for the menu.

.PHONY: help setup dev prod-build prod-check prod-run secrets test clean

BINARY := /tmp/ghyari-api
DB     := /tmp/ghyari-dev.db

# Default target — pretty menu
help:
	@printf "\n\033[1mGhyari Platform\033[0m — targets:\n\n"
	@printf "  \033[36msetup\033[0m         One-command onboarding (calls ./scripts/setup.sh)\n"
	@printf "  \033[36mdev\033[0m           Run the API in debug mode with a local SQLite\n"
	@printf "  \033[36mtest\033[0m          go vet + tsc --noEmit across backend, frontend, mobile\n"
	@printf "  \033[36msecrets\033[0m       Generate fresh production secrets → stdout\n"
	@printf "  \033[36mprod-build\033[0m    Build the release API binary (-s -w, no CGO)\n"
	@printf "  \033[36mprod-check\033[0m    Verify build + required prod env vars are set\n"
	@printf "  \033[36mprod-run\033[0m      Run the release binary (fails if JWT_SECRET missing)\n"
	@printf "  \033[36mclean\033[0m         Remove build artefacts, local DB, and caches\n\n"

setup:
	@./scripts/setup.sh

dev:
	@cd backend && DATABASE_URL="file:$(DB)" GIN_MODE=debug go run .

test:
	@echo "▸ Backend"
	@cd backend && go vet ./...
	@echo "▸ Frontend"
	@cd frontend && npx tsc --noEmit
	@echo "▸ Mobile"
	@cd mobile && npx tsc --noEmit
	@echo "✅ all clean"

secrets:
	@./scripts/generate-secrets.sh

prod-build:
	@echo "▸ Building release binary..."
	@cd backend && CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o $(BINARY) .
	@printf "✅ %s  (%s)\n" "$(BINARY)" "$$(du -h $(BINARY) | cut -f1)"

# Refuses to succeed if the environment isn't safe for production.
prod-check:
	@echo "▸ Preflight checks for production..."
	@test -x $(BINARY) || (echo "❌ Binary missing — run 'make prod-build' first" && exit 1)
	@test "$$GIN_MODE" = "release" || (echo "❌ GIN_MODE must be 'release' (got: '$$GIN_MODE')" && exit 1)
	@test -n "$$JWT_SECRET" || (echo "❌ JWT_SECRET is unset — run 'make secrets'" && exit 1)
	@test "$$JWT_SECRET" != "ghyari-dev-secret-change-in-production-minimum-32-chars" || \
		(echo "❌ JWT_SECRET is the dev default — run 'make secrets' and use the output" && exit 1)
	@test $${#JWT_SECRET} -ge 32 || (echo "❌ JWT_SECRET must be ≥ 32 chars" && exit 1)
	@test -n "$$DATABASE_URL" || (echo "❌ DATABASE_URL is unset" && exit 1)
	@echo "$$DATABASE_URL" | grep -q "^file:/tmp/" && \
		(echo "⚠️  DATABASE_URL points to /tmp — refusing to run in production" && exit 1) || true
	@echo "✅ Production preflight passed"

prod-run: prod-check
	@echo "▸ Starting Ghyari API in release mode..."
	@$(BINARY)

clean:
	@rm -f $(BINARY) $(DB) $(DB)-shm $(DB)-wal
	@rm -rf frontend/dist mobile/.expo
	@echo "✅ cleaned build artefacts and local DB"

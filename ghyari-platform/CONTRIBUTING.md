# Contributing to Ghyari

Thanks for taking the time to contribute. This guide is short by design — read it once and you're ready.

## Development flow

1. Branch from `main`. Use the format `claude/<slug>` (e.g. `claude/add-wishlist-sync`).
2. Make changes. Write tests where behavior is non-trivial.
3. Run local checks (below).
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/).
5. Push and open a PR against `main`. CI must pass.

## Local checks — run before pushing

| Component | Check | Command |
|-----------|-------|---------|
| Backend   | Vet + build | `cd backend && go vet ./... && go build .` |
| Backend   | Tests | `cd backend && go test ./...` |
| Frontend  | Types | `cd frontend && npx tsc --noEmit` |
| Frontend  | Build | `cd frontend && npm run build` |
| Mobile    | Types | `cd mobile && npx tsc --noEmit` |
| Mobile    | App config | `cd mobile && node -e "require('./app.json')"` |

CI runs all of these on every push — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Commit message style

```
<type>(<scope>): <short summary in imperative mood>

<optional body — the WHY, not the WHAT>

<optional footer — Co-Authored-By, Closes #123, etc.>
```

Types: `feat` · `fix` · `refactor` · `perf` · `docs` · `test` · `chore` · `build` · `ci`.

Scopes commonly used: `backend` · `frontend` · `mobile` · `ai-engine` · `infra` · `docs`.

Examples:

```
feat(mobile): add barcode scanner with expo-camera
fix(backend): return 404 instead of 500 for missing product
docs(api): add curl examples for cart endpoints
```

## Code style

**Go**
- Formatted with `gofmt` (enforced in CI)
- Errors returned, never swallowed — wrap with `fmt.Errorf("context: %w", err)`
- One package per directory; internal packages under `internal/`
- Handlers thin — logic in `service/` or `db/`

**TypeScript (frontend + mobile)**
- `strict: true` in `tsconfig.json`
- Prefer functional components + hooks
- API calls go through the client in `src/api/client.ts` — never `fetch` inline
- Styles: inline `StyleSheet.create` (mobile) or Tailwind classes (web)

**SQL**
- Migrations are additive only — never `DROP` or `ALTER … DROP` in a migration
- New columns use `COALESCE(col, default)` in `SELECT` to keep the schema forward-compatible

## Reviewing PRs

- One approving review is enough to merge
- Reviewers focus on **correctness**, **security**, and **user impact** — not personal style
- CI green is required

## Reporting bugs / requesting features

Open a GitHub issue with:
- **Bugs** — steps to reproduce, expected vs actual, screenshots if UI
- **Features** — the user problem you're solving, then the proposed solution

Security issues: **do not** open a public issue. Email `security@ghyari.sa`.

## License

By contributing you agree that your work is licensed under the project's proprietary license.

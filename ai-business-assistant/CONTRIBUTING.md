# Contributing

Thank you for your interest in contributing to AI Business Assistant.

## Development Setup

Follow the [Installation Guide](INSTALL.md) to get a local environment running.

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production — always deployable |
| `develop` | Integration branch for features |
| `feature/*` | Individual feature work |
| `fix/*` | Bug fixes |
| `release/*` | Release preparation |

Work on `feature/*` branches cut from `develop`. Open pull requests targeting `develop`.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(billing): add annual pricing toggle
fix(auth): handle expired session cookie gracefully
test(sanitize): add edge cases for sanitizeUrl
```

## Code Standards

- **TypeScript strict** — no `any`, no `@ts-ignore`
- **No unused imports** — CI will catch them
- **No TODO comments** — open a GitHub issue instead
- **No placeholder code** — every merged commit should be production-ready
- **Comments only for non-obvious WHY** — not what the code does

## Pull Request Process

1. Open a PR against `develop` with a clear description
2. CI must pass: lint, type-check, unit tests, build
3. All new features should include unit tests
4. Request a review from a maintainer
5. Squash-merge after approval

## Testing

```bash
# Before opening a PR, run:
npm run validate        # type-check + lint + format
npm test                # unit tests (must all pass)
npm run test:e2e        # E2E tests (requires running server)
```

Adding new features? Write tests in `__tests__/unit/` for utility code and `e2e/` for user flows.

## Database Changes

All schema changes must:
1. Be in a new numbered migration file: `supabase/migrations/00N_description.sql`
2. Include RLS policies for every new table
3. Be tested against a local Supabase instance before opening the PR

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Environment (OS, Node version, browser)
- Relevant error messages or screenshots

## Security Issues

Do **not** open a public issue for security vulnerabilities. Email `security@yourdomain.com` instead.

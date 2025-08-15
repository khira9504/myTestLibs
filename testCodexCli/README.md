# Node.js + Playwright Scaffold

This repo is configured for Playwright E2E tests with TypeScript.

## Quickstart

1. Install deps and browsers: `make setup`
2. Run tests: `make test`
3. UI mode: `make dev`

## Structure

- `tests/e2e/` – Playwright tests
- `playwright.config.ts` – Playwright configuration
- `docs/` – Notes and how-tos
- `.github/workflows/ci.yml` – CI to lint/type-check/test

## Scripts

- `make setup` – `npm ci` + install browsers
- `make test` – run Playwright tests
- `make lint` / `make format` – ESLint + Prettier
- `make dev` – Playwright UI mode


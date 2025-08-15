Playwright Setup
================

Commands
--------

- setup: `make setup` (or `npm run setup`)
- run tests: `make test`
- UI mode: `make dev` (or `npm run test:ui`)
- lint/format: `make lint` / `make format`

Notes
-----

- Base URL can be configured via `PLAYWRIGHT_BASE_URL`.
- Reports are written to `playwright-report/` and `test-results/`.
- In CI, tests run with `--reporter=line` and retries enabled.


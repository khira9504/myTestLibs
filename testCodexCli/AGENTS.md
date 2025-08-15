# Repository Guidelines

## Project Structure & Module Organization
- Root layout: keep source in `src/`, tests in `tests/`, docs in `docs/`, and helper scripts in `scripts/`. Add a `Makefile` (or `package.json`/`pyproject.toml`) at the root.
- Examples:
  - `src/` – application/library code (e.g., `src/core/`, `src/cli/`).
  - `tests/` – mirrors `src/` (e.g., `tests/core/`, `tests/cli/`).
  - `docs/` – architecture notes, ADRs, diagrams.
  - `.github/workflows/` – CI definitions (lint, test, build).

## Build, Test, and Development Commands
- Preferred entry points via Make:
  - `make setup` – install toolchain and dependencies.
  - `make build` – compile/package the project.
  - `make test` – run the full test suite with coverage.
  - `make lint` / `make format` – static checks and auto-formatting.
  - `make dev` – run a local watch/dev server if applicable.
- If using Node.js: `npm ci`, `npm run build`, `npm test` (Jest/Vitest), `npm run lint`, `npm run format`.
- If using Python: `uv pip install -r requirements.txt` or `pip install -e .[dev]`, `pytest -q`, `ruff check`, `black .`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces for JS/TS; 4 spaces for Python.
- Files/dirs: `kebab-case` (JS/TS) or `snake_case` (Python). Classes: `PascalCase`. Functions/vars: `camelCase` (JS/TS) or `snake_case` (Python).
- Linters/formatters:
  - JS/TS: ESLint + Prettier; TypeScript strict mode on.
  - Python: Ruff + Black; type-check with MyPy or Pyright.

## Testing Guidelines
- Frameworks: Jest/Vitest (JS/TS) or Pytest (Python). Target ≥80% line coverage.
- Naming: `tests/**/*.spec.ts` or `tests/test_*.py` mirroring `src/`.
- Run: `make test` (preferred) or tool-specific commands above. Add focused unit tests with clear Arrange–Act–Assert structure.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Keep changes scoped and atomic.
- PRs: include a concise description, linked issues (`Closes #123`), screenshots for UI changes, and any migration notes. Ensure CI is green and `make lint format test` passes.

## Security & Configuration Tips
- Do not commit secrets. Store local settings in `.env.local`; provide a non-sensitive `.env.example`.
- Review licenses for new dependencies; prefer well-maintained, permissive packages.

## Agent-Specific Instructions
- Keep changes minimal and localized; avoid drive-by refactors.
- Update docs/tests alongside code; run linters/formatters before proposing changes.
- If creating new modules, follow the structure and naming conventions above.

# Feature: Code Quality, Linting, and Pre-commit Self-Healing

> **Status**: `partial` — infrastructure deployed, codebase cleanup pending

Pre-commit linting, formatting, and complexity enforcement pipeline with auto-fix capabilities. Husky gates commits on passing checks; lint-staged runs only on staged files. ESLint strict rules + Prettier formatting + complexity thresholds run before every commit.

## What

Install and configure ESLint (strict, beyond Next.js defaults), Prettier, complexity checking, Husky pre-commit hooks, and lint-staged so every commit is automatically linted, formatted, and complexity-checked — with auto-fix applied where possible. No commit lands that breaks the rules.

## Acceptance Criteria

- [x] `npm run lint` runs ESLint with strict rules and flags existing violations (44 errors, 22 warnings across 23 files on current codebase)
      Verify: `npm run lint 2>&1 | grep -E 'errors|warnings'`
- [x] `npm run format:check` reports formatting violations without modifying files
      Verify: `npm run format:check`
- [x] `npm run format` auto-fixes formatting violations
      Verify: `npm run format && npm run format:check`
- [x] ESLint config enforces `complexity` rule (max cyclomatic complexity ≤ 10) and `max-lines-per-function` ≤ 80
      Verify: `grep 'complexity' eslint.config.mjs && grep 'max-lines-per-function' eslint.config.mjs`
- [x] `npx husky init` creates `.husky/pre-commit` hook
      Verify: `test -x .husky/pre-commit`
- [x] Pre-commit hook runs `npx lint-staged`
      Verify: `grep 'lint-staged' .husky/pre-commit`
- [x] lint-staged runs ESLint fix + Prettier write on staged `*.{ts,tsx,js,jsx}` files
      Verify: `grep 'eslint --fix' .lintstagedrc.json && grep 'prettier --write' .lintstagedrc.json`
- [x] `npm run lint` and `npm run format:check` are invocable as standalone scripts in `package.json`
      Verify: `node -e "const p=require('./package.json'); console.log(p.scripts.lint, p.scripts['format:check'])"`

## TDD

Execute each acceptance criterion as a Red → Green → Anchor loop, per `wiki::red-green-tdd::mental-model`.

## Details

### Constraints

- Must not break existing `next lint` integration — ESLint config must work with Next.js 15 built-in lint
- Must use flat config format (`eslint.config.mjs`) — ESLint 9+, compatible with Next.js 15
- Prettier must integrate with ESLint via `eslint-config-prettier` to avoid rule conflicts
- Complexity thresholds are conservative (10 cyclomatic, 80 lines/function) — can tighten later
- Husky v9+ (`npx husky init` pattern)
- lint-staged configured via `.lintstagedrc.json` at project root

### Out of Scope

- CI pipeline configuration (Vercel/GitHub Actions) — this feature only gates at commit time
- Test coverage thresholds (separate feature when test infra matures)
- TypeScript strictness beyond existing `tsconfig.json` strict mode
- Secret scanning / SAST tools
- Custom ESLint plugin development

---

## Dependencies

### Feature Dependencies

- None (self-contained tooling feature)

### External Dependencies

- `eslint` — already present via Next.js
- `prettier` — new
- `eslint-config-prettier` — new
- `husky` — new
- `lint-staged` — new

---

## Technical Considerations

### Performance

- lint-staged limits checks to staged files only → fast pre-commit
- Complexity rule is AST-level, negligible overhead

### Security

- Husky hooks live in `.husky/` — committed to repo, shared across team
- No secrets in config files

### Backward Compatibility

- Existing `next lint` script preserved; ESLint flat config compatible with Next.js 15.4
- Prettier initial format will cause a large diff — accept as one-time normalization
- Existing `npm test` (vitest) and `npm run dev` unaffected

---

## Glossary

| Location                                   | Type   | Description                                                                       |
| ------------------------------------------ | ------ | --------------------------------------------------------------------------------- |
| `code::eslint.config.mjs`                  | source | Flat ESLint configuration with strict rules, complexity, and Prettier integration |
| `code::.prettierrc`                        | source | Prettier formatting rules (matching conventions.md: 2-space, double quotes)       |
| `code::.lintstagedrc.json`                 | source | lint-staged configuration: ESLint fix + Prettier for staged files                 |
| `code::.husky/pre-commit`                  | source | Husky pre-commit hook invoking lint-staged                                        |
| `code::package.json::scripts.lint`         | source | `next lint` — preserved                                                           |
| `code::package.json::scripts.format`       | source | `prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"`                         |
| `code::package.json::scripts.format:check` | source | `prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"`                         |
| `code::package.json::scripts.prepare`      | source | `husky` — auto-installs hooks on `npm install`                                    |
| `wiki::red-green-tdd::mental-model`        | wiki   | Red → Green → Anchor loop for acceptance criteria                                 |

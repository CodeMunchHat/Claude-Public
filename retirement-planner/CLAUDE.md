# Retirement Planner — working notes

Static site: open `index.html` from disk. No build, no server, no network at runtime.

## Status (2026-11-07)
v1 complete on branch `ccr-4bb89399-hym1o2`. Questionnaire (7 steps) -> engine -> plan page with charts -> Download PDF. JSON save/load. Sample inputs in `sample/cheltsey_drew.json`.

## Layout
- `js/engine/` pure calculation (load order: tables, debt, goals, allocation, projection, waterfall, index). `Planner.buildPlan(inputs)`.
- `js/ui/` questionnaire.js, storage.js, app.js (form + wiring); plan.js (results, charts, icon sprite, injected CSS); pdf.js (jsPDF, vendored in `js/vendor/`).
- `CONTRACT.md` input/output JSON shapes. `RULES.md` every threshold and formula. `PRD.md` scope and decisions.

## Tests
- `node --test test/` engine unit + regression (balance 913,517 / wait 557,625 on the sample stream).
- `node test/ui.questionnaire.mjs`, `node test/ui.plan.mjs` Playwright checks (375 and 1024 widths, PDF pages). Playwright at `/opt/node-tools/node_modules/playwright` in cloud; locally `npm i -D playwright` and `npx playwright install chromium`.

## Rules of the project
- Build tasks run as Sonnet subagents; main session reviews and commits.
- Icons over words where a common icon exists; inline SVG sprites (`q-icon-*` questionnaire, `icon-*` plan).
- Chart palette: dataviz reference set (blue, orange, aqua, yellow), validated light and dark.
- Never commit family financial data beyond the anonymized sample.

## Open items
- Hosting undecided; `.github/workflows/pages.yml` deploys `retirement-planner/` to GitHub Pages from `main` once Pages is set to "GitHub Actions" in repo Settings.
- Engine: Roth-first rule can starve a house goal on tight cash flow; review whether house priority should override.
- Dark mode and print verification pass in progress (see last commit).

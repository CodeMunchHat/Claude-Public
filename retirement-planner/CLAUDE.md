# Retirement Planner — working notes

Static site: open `index.html` from disk. No build, no server, no network at runtime.

## Status (2026-11-07)
v1 complete on branch `ccr-4bb89399-hym1o2`. Questionnaire (7 steps) -> engine -> plan page with charts -> Download PDF. JSON save/load. Sample inputs in `sample/cheltsey_drew.json`.

## Layout
- `js/engine/` pure calculation (load order: tables, debt, goals, allocation, projection, waterfall, index). `Planner.buildPlan(inputs)`.
- `js/ui/` questionnaire.js, storage.js, app.js (form + wiring); plan.js (results, charts, icon sprite, injected CSS); pdf.js (jsPDF, vendored in `js/vendor/`).
- `js/ui/crypto.js` `window.PlanCrypto` {encrypt, decrypt, isEncrypted}: passphrase encryption of the saved inputs file (Web Crypto only). Loads before storage.js.
- `CONTRACT.md` input/output JSON shapes. `RULES.md` every threshold and formula. `PRD.md` scope and decisions.

## Tests
- `node --test test/` engine unit + regression (balance 913,517 / wait 557,625 on the sample stream).
- `node test/ui.questionnaire.mjs`, `node test/ui.plan.mjs` Playwright checks (375 and 1024 widths, PDF pages). Playwright at `/opt/node-tools/node_modules/playwright` in cloud; locally `npm i -D playwright` and `npx playwright install chromium`.

## Rules of the project
- Build tasks run as Sonnet subagents; main session reviews and commits.
- Icons over words where a common icon exists; inline SVG sprites (`q-icon-*` questionnaire, `icon-*` plan).
- Chart palette: dataviz reference set (blue, orange, aqua, yellow), validated light and dark.
- Saved inputs files are encrypted with a user passphrase (PBKDF2-SHA256 200k + AES-256-GCM, envelope `rp-enc-1`); plain JSON files still load, and the save dialog offers "Save without encryption". Needs crypto.subtle (https or localhost; may be missing on file://).
- Never commit family financial data beyond the anonymized sample.

## Open items
- Hosting undecided; `.github/workflows/pages.yml` deploys `retirement-planner/` to GitHub Pages from `main` once Pages is set to "GitHub Actions" in repo Settings.
- Engine: Roth-first rule can starve a house goal on tight cash flow; review whether house priority should override.
- Light mode: white labels on colored segment bars are 2.8 to 4.4:1; set `--pv-onfill` for light to a dark ink in plan.js to fix.

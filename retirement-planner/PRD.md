# PRD: Retirement Planner Website

Status: DRAFT v2, decisions recorded 2026-11-07. Awaiting final sign-off.

## 1. Problem
People starting their careers (like Cheltsey and Drew) have no simple, trustworthy, no-sales-pitch tool that takes their real situation (income, accounts, debt, goals) and returns a concrete, ordered plan: what to do first, how much to save where, and what retirement looks like at the end. Existing calculators either do one thing (a compound-interest widget) or are lead-generation funnels for advisors and products.

## 2. Success criteria
- A couple with zero financial experience can finish the questionnaire in under 10 minutes without outside help.
- Output is a prioritized, dollar-specific action plan (not generic tips), plus a year-by-year retirement projection.
- Every number in the plan is traceable to an input or a stated assumption, and changing an input updates the plan instantly.
- Works on a phone. No account, no email capture, no data leaves the browser.
- Produces the same recommendations as the Cheltsey & Drew plan when given their inputs (regression test).

## 3. Users
- Primary: individuals and couples, 20s to 40s, US-based, W-2 income, little or no investing experience.
- Secondary: a family member or mentor (you) walking them through it.

## 4. Scope

### In scope (v1)
Questionnaire, in sections, one screen each:
1. Household: 1 or 2 earners, married or not, names (optional), ages, planned retirement age(s), state (for state income tax and no-tax states like TN). No dependents field; kids are a future goal only.
2. Income: gross salary per person, pay frequency, expected raises.
3. Retirement accounts per person: type (401k / 403b / 457b / TSP / pension / IRA / Roth IRA / HSA / taxable), current balance, current contribution %, employer match formula (e.g., 100% up to 3%, 50% up to 6%), pension contribution % and vesting years if applicable, Roth option available.
4. Cash: checking/savings balances, monthly expenses, current emergency fund.
5. Debt: per debt, type (credit card, car, student federal, student private, personal, mortgage), balance, APR, minimum payment. Flag public-service employment for PSLF.
6. Goals: house (target price, timeline, down payment %), kids, grad school, other (name, amount, year). Risk tolerance (3-question check).
7. Other income at retirement: Social Security estimate (link to ssa.gov), pension estimate.

Plan engine (pure functions, no backend):
- Priority waterfall: starter emergency fund -> employer match -> high-interest debt (>~7-8% APR) -> full emergency fund (3-6 months, 3 with two stable incomes) -> Roth IRA / HSA -> raise 401k to 15% total -> taxable / goal funds.
- Roth vs Traditional recommendation from marginal federal bracket (2026 brackets, MFJ or single) plus state tax.
- Debt payoff schedule: avalanche by default, snowball as a toggle; months to payoff and total interest per debt.
- Goal funding: monthly savings needed for each goal using safe-asset yield; flags when goals and retirement saving exceed available cash flow and shows the tradeoff.
- Retirement projection: year-by-year, today's dollars, with/without pension, income replacement %, cost-of-waiting comparison. Monte Carlo is out of scope for v1 (a simple best/base/worst using three return assumptions instead).
- Allocation suggestion: target-date fund or 3-fund mix, by age and risk answers; concrete low-cost fund examples by provider.
- Contribution limits table (2026 official, 2027 projected, flagged as projected) with validation so no recommendation exceeds a limit.
- Protection checklist: beneficiaries, disability, term life triggers, wills.

Output:
- "Your plan" page: situation summary, 90-day checklist, ordered phases with dollar amounts and dates, accounts to open, what to invest in, projection chart, items to verify.
- Print / Save as PDF via browser print styles.
- Export/import inputs as a JSON file so they can save and return (no server). No localStorage, no share links.

### Out of scope (v1)
- User accounts, server-side storage, email.
- Linking to real bank/brokerage accounts (Plaid etc.).
- Tax filing detail beyond marginal bracket (no AMT, credits beyond the Saver's Credit flag, itemizing).
- Monte Carlo simulation, Social Security benefit calculation (user enters the ssa.gov estimate).
- Non-US tax systems.
- Advice on specific individual stocks, crypto, or real estate investing.

## 5. Constraints
- Static site: plain HTML/CSS/JS, no framework, no build step. Hosting decided later (GitHub Pages or a Hostinger domain); must run from a folder by opening index.html.
- No external data calls at runtime. All tables (brackets, limits) are embedded with a "last updated" date and a source.
- Accessible: keyboard navigable, labels on every input, readable at phone width.
- Plain language: 8th-grade reading level; every term has a one-line tooltip.
- Audience v1: family and friends. Tennessee is the default state but all states selectable. Short educational footer kept because the URL is public.
- Everything under version control in CodeMunchHat/Claude-Public on branch ccr-4bb89399-hym1o2.

## 6. Plan
1. Sign-off on this PRD.
2. Write RULES.md (thresholds, formulas, tables) as the engine is built; validate against the Cheltsey & Drew numbers.
3. Build engine as plain JS modules with unit tests (node test runner, no framework).
4. Build questionnaire UI and plan page.
5. Print styles, JSON export/import.
6. Test on phone widths, run accessibility pass, deploy to GitHub Pages.

Estimate: engine spec + engine 1 session, UI 1-2 sessions, polish/deploy 1 session.

## 7. Decisions (2026-11-07)
- Stack: static HTML/JS, no framework.
- Hosting: decide later.
- Persistence: JSON download/upload only.
- Audience: family and friends.
- Household: 1 or 2 earners, no dependents field.
- Depth: full waterfall with debt payoff and goal funding schedules.
- Pension: user enters estimated pension income; vesting-years warning only.
- Process: PRD sign-off is enough; rules documented in RULES.md alongside the code.

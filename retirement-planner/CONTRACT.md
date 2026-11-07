# Data contract: questionnaire -> engine -> plan page

All three parts are built against this file. Do not change shapes without updating this document.

## Files and layout
```
retirement-planner/
  index.html          questionnaire (multi-step) and plan page in one static page
  css/style.css
  js/engine/          pure functions, no DOM, ES modules
    tables.js         tax brackets, contribution limits, thresholds (with "updated" dates and sources)
    waterfall.js      priority phases
    debt.js           payoff schedules (avalanche / snowball)
    goals.js          goal funding math
    projection.js     year-by-year retirement projection
    allocation.js     investment mix suggestion
    index.js          buildPlan(inputs) -> plan
  js/ui/              questionnaire, plan rendering, JSON save/load, PDF export
  test/               node:test unit tests for the engine (run: node --test test/)
  RULES.md            every threshold and formula in plain English
  PRD.md, CONTRACT.md
```
No framework, no build step, no runtime network calls. `index.html` must work opened from disk (file://), so use a single `<script type="module">` entry only if it works from file:// in Chrome/Edge; otherwise concatenate classic scripts. Safer default: classic scripts, with engine modules exposed on `window.Planner`.

## Inputs (JSON saved/loaded by the user)
```json
{
  "version": 1,
  "household": {
    "earners": 2,
    "married": true,
    "state": "TN",
    "people": [
      { "name": "Cheltsey", "age": 28, "retireAge": 65, "salary": 42500, "raisePct": 0.0, "publicService": true },
      { "name": "Drew", "age": 28, "retireAge": 65, "salary": 42500, "raisePct": 0.0, "publicService": false }
    ]
  },
  "accounts": [
    { "owner": 0, "type": "pension", "balance": 0, "contribPct": 0.06, "vestYears": 5, "yearsWorked": 1.5, "estIncomeAtRetirement": 20000 },
    { "owner": 1, "type": "401k", "balance": 0, "contribPct": 0.0, "matchPct": 1.0, "matchUpToPct": 0.03, "rothOption": true }
  ],
  "cash": { "checking": 1500, "savings": 500, "monthlyExpenses": 4500, "emergencyFund": 0 },
  "debts": [
    { "name": "Visa", "type": "credit_card", "balance": 5000, "apr": 0.22, "minPayment": 150 },
    { "name": "Car", "type": "auto", "balance": 12000, "apr": 0.065, "minPayment": 300 }
  ],
  "goals": [
    { "type": "house", "name": "First home", "targetPrice": 300000, "downPct": 0.05, "closingPct": 0.03, "years": 5, "saved": 0 },
    { "type": "other", "name": "Grad school", "amount": 10000, "years": 3, "saved": 0 }
  ],
  "risk": { "dropReaction": "hold_or_buy", "horizonComfort": "long", "experience": "none" },
  "assumptions": {
    "realReturn": 0.05, "safeYield": 0.0357, "withdrawalRate": 0.04,
    "socialSecurityAtRetirement": 35000, "waitYearsComparison": 10, "payoffMethod": "avalanche",
    "extraMonthlyCash": null
  }
}
```
- `accounts[].type` in: `401k, 403b, 457b, tsp, pension, trad_ira, roth_ira, hsa, taxable`.
- `debts[].type` in: `credit_card, auto, student_federal, student_private, personal, mortgage, other`.
- `goals[].type` in: `house, kids, grad_school, other`. House uses targetPrice/downPct/closingPct; others use amount.
- `risk.dropReaction` in: `hold_or_buy, nervous_hold, sell`.
- Percentages stored as fractions (0.06 = 6%). Money in whole dollars. All projections in today's dollars.
- `assumptions.extraMonthlyCash`: null = engine estimates free cash flow from take-home minus expenses minus debt minimums; a number overrides it.

## Engine output: `buildPlan(inputs)`
```json
{
  "summary": { "combinedIncome": 85000, "filingStatus": "mfj", "marginalFederal": 0.12, "stateRate": 0, "takeHomeMonthly": 5600, "freeCashMonthly": 650, "rothRecommended": true, "warnings": ["..."] , "verify": ["..."] },
  "ninetyDays": [ { "who": "Drew", "text": "Set 401(k) contribution to 3% to capture the full match.", "when": "this_week" } ],
  "phases": [
    { "id": "starter_ef", "title": "Starter emergency fund", "target": 2000, "monthly": 300, "months": 7, "startMonth": 0, "endMonth": 7, "why": "...", "steps": ["..."] },
    { "id": "match", ... }, { "id": "high_debt", ... }, { "id": "full_ef", ... }, { "id": "roth_hsa", ... }, { "id": "retire_15", ... }, { "id": "goals_taxable", ... }
  ],
  "debt": { "method": "avalanche", "order": [ { "name": "Visa", "months": 21, "interest": 1300, "payment": 300 } ], "totalInterest": 1800, "debtFreeMonth": 34, "snowballAlt": { "totalInterest": 1900, "debtFreeMonth": 34 } },
  "goals": [ { "name": "First home", "cashNeeded": 24000, "monthly": 366, "startMonth": 12, "feasible": true, "note": "..." } ],
  "accounts": [ { "priority": 1, "owner": "Drew", "account": "401(k) (Roth option)", "action": "Contribute 3% now; raise to 12% after house", "limit2026": 24500 } ],
  "allocation": { "stockPct": 0.9, "bondPct": 0.1, "option": "target_date", "targetYear": 2065, "examples": [ { "provider": "Fidelity", "fund": "FFIJX" } ], "note": "..." },
  "projection": {
    "years": [ { "year": 1, "age": 28, "phase": "before_house", "pay": 85000, "contrib": 5525, "match": 0, "start": 0, "growth": 0, "end": 5525, "waitEnd": 0 } ],
    "balanceAtRetirement": 913517, "incomeFromInvestments": 36541, "pension": 20000, "socialSecurity": 35000,
    "totalIncome": 91541, "replacementPct": 1.077, "withoutPension": 71541, "withoutPensionPct": 0.842,
    "waitBalance": 557625, "costOfWaiting": 355892,
    "scenarios": { "worst": { "realReturn": 0.03, "balance": 0 }, "base": {...}, "best": { "realReturn": 0.07, "balance": 0 } }
  },
  "protection": [ { "item": "Beneficiaries", "text": "Name each other on every account." } ],
  "limits": { "updated": "2026-11-07", "y2026": { "k401": 24500, "ira": 7500, "hsaFamily": 8750, "hsaSingle": 4400 }, "y2027projected": { "k401": 25500, "ira": 7500 } }
}
```
Numbers above are the Cheltsey & Drew regression values (from the spreadsheet calculator): with the sample inputs, `balanceAtRetirement` must be about 913,500 and `waitBalance` about 557,600 (within 1%).

## UI responsibilities
- Questionnaire: one section per screen, back/next, validation, tooltips, "Save inputs (JSON)" and "Load inputs" at every step, "Build my plan" at the end.
- Plan page: renders every block of the engine output; "Edit answers" returns to the questionnaire with values intact; "Download PDF" produces a multi-page PDF (jsPDF + autotable vendored locally in `js/vendor/`, no CDN at runtime) laid out like the Cheltsey & Drew plan; print stylesheet as fallback.
- Phone width (375px) must work with no horizontal scroll.

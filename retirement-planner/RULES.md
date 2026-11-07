# RULES: every threshold and formula in the engine

All money is whole dollars (rounded only at output). All percentages are fractions in the code. Everything is in today's dollars (real returns, so inflation is already taken out). Tables live in `js/engine/tables.js` with an "updated" date. Tax tables were last updated 2026-11-07; 2027 limits are projections.

## 1. Taxes
- **2026 federal brackets (IRS values).** Single: 10% to $12,400; 12% to $50,400; 22% to $105,700; 24% to $201,775; 32% to $256,225; 35% to $640,600; 37% above. Married filing jointly: 10% to $24,800; 12% to $100,800; 22% to $211,400; 24% to $403,550; 32% to $512,450; 35% to $768,700; 37% above. Income exactly at a bracket top is taxed in the lower bracket.
- **2026 standard deduction (IRS values):** single $16,100; married filing jointly $32,200. Married households file jointly on combined income; unmarried people are taxed separately and the highest marginal rate is used.
- **Taxable income** = gross pay - pre-tax retirement contributions - standard deduction (never below 0). Pre-tax contributions are the current contribution percent on 401(k)/403(b)/457(b)/TSP accounts plus pension contribution percent. Simplification: even Roth contributions are treated as pre-tax here, because the questionnaire does not say which is used today.
- **State income tax** = a flat effective rate by state (table in `tables.js`) times (gross - pre-tax contributions). TN, TX, FL, WA, NV, SD, WY, AK and NH are 0. Other rates are rounded averages for middle incomes, good enough for a plan, not a tax return. An unknown state code uses 4%.
- **Roth vs Traditional** is driven by the marginal federal bracket only: 12% or lower = Roth; 24% or higher = Traditional; 22% = "either, lean Roth" (counted as Roth recommended). Reason: pay tax at a low rate now, avoid paying it at a high rate later, and the reverse. State tax does not change the call.
- **Take-home per month** = (gross - federal tax - state tax - 7.65% FICA - pre-tax retirement contributions) / 12. FICA is Social Security 6.2% + Medicare 1.45%; the Social Security wage cap and the additional Medicare tax are ignored.
- Not modeled: AMT, credits (including the Saver's Credit), itemizing, Roth IRA income phase-outs, deductibility limits on Traditional IRAs.

## 2. Free cash flow
- **Free cash per month** = take-home - monthly expenses - sum of minimum payments on debts with a balance, minus the after-tax cost of any employer-match payroll change (see rule 3, match). Reason: it is the only money that can actually be assigned a job.
- If `assumptions.extraMonthlyCash` is a number, that number is used as free cash as-is (the user knows their budget), and the match adjustment is not subtracted again.
- If free cash is 0 or less: a warning is added, every phase's monthly amount and months are 0, every phase gets a "cut expenses first" step (and the dollar gap to close), and the plan is still produced.

## 3. Waterfall phases (order is fixed)
Each phase has target, monthly, months, startMonth, endMonth, why, steps. Months count from today. Phases are sequential in time: each starts when the one before it ends. Skipped phases have `skipped: true`, 0 months, and a reason.
1. **Starter emergency fund.** Target $2,000, or $1,000 if there is one earner with income under $40,000. Reason: stops a small surprise from becoming new debt. Existing emergency fund counts. Funded by all free cash; months = ceiling(shortfall / free cash).
2. **Employer match.** For every 401(k)/403(b)/457(b)/TSP with a match, contribute at least `matchUpToPct` of pay immediately. Reason: an instant 50% to 100% return. This is a payroll change, not a free-cash allocation, so it is on the timeline at month 0 with 0 months. Its monthly figure is the increase in the person's contribution. Take-home falls by the increase times (1 - marginal federal rate - state rate), since contributions are pre-tax; that reduction comes out of free cash. If the person already contributes at least the match percent, nothing changes. One step per person.
3. **High-interest debt.** Debts with APR 7% or higher (threshold in `tables.js`; reason: guaranteed return beats expected investing return) get all free cash beyond minimums, using `assumptions.payoffMethod` (avalanche = highest APR first, default; snowball = smallest balance first). Debts under 7% get minimums only. When a high-interest debt is paid off, its minimum payment is added to the free cash available to the later phases (the "roll forward"). Only minimums of high-interest debts are rolled; freed minimums from low-rate debts later on are ignored (conservative).
4. **Full emergency fund.** Target = monthly expenses x 3 if two earners, x 6 if one. Reason: with two paychecks one job loss still leaves an income. If the existing fund (or the funded starter amount) already meets it, the phase is skipped with a note.
5. **Roth IRA (or Traditional if recommended) and HSA.** IRA up to the IRA limit ($7,500 in 2026) for each earner; HSA if the user has an HSA account (family limit $8,750 if married, $4,400 if single; family coverage is assumed for married people). IRAs come first, HSA second. Free cash is shared with goals (rule 5). Roth MAGI limits are not checked.
6. **Raise retirement saving to 15%.** The household target is 15% of gross pay counting pension contribution percent and employer match. Per person, out-of-pocket % = max(0, 15% - pension % - match %). Starts after the house goal year if there is a house goal, otherwise right after the earlier phases. Reason: the usual guideline; the house goal comes first because a home down payment has a hard date. Split: IRA first (up to the limit), then workplace plan (up to $24,500). Anything above those limits is capped and flagged as belonging in a taxable account. Where this needs more than free cash covers, the phase says so.
7. **Goals and taxable.** Goal savings plus anything left over (leftover goes to a taxable index fund, or extra payments on low-rate debt once goals are covered).

Timeline details: goals and the Roth/HSA phase start when the full emergency fund phase ends (which is when the high-interest debt phase ends if the emergency fund is already full). Open-ended phases (Roth/HSA, 15%) run to the oldest person's retirement.

## 4. Debt schedule (`debt.js`)
- Monthly simulation up to 600 months. Each month, interest = balance x APR / 12 is added, minimums are paid on every debt, and everything else (extra cash plus payments freed by paid-off debts) goes to the target debt among those at 7% or higher. Debts under 7% only get minimums, until they are gone.
- Output per debt: months to payoff, total interest, and peak monthly payment. Also debt-free month, total interest, and the totals for the other method (`alt`; `snowballAlt` always holds the snowball totals).
- Guard: if the minimum payment is less than one month of interest, the debt is flagged "payment too low" and a warning is added.
- Example: $5,000 at 22% with $300 a month pays off in 21 months with about $1,000 interest.

## 5. Goals (`goals.js`)
- **House cash** = target price x (down payment % + closing cost %). Other goals use their `amount`.
- **Monthly needed** (future value of an annuity): with i = safe yield / 12 and n months, g = (1+i)^n, monthly = (cash - saved x g) x i / (g - 1). Example: $24,000 in 60 months at 3.57% with nothing saved = about $366.
- Goal saving starts at the end of the emergency-fund phases (startMonth). Goals and the Roth/HSA share the same free cash (after debt payoff), and the plan allocates them **jointly, one month at a time**, so the total in any month never exceeds free cash.
- **Order each month:** (1) any goal due within 24 months of the start month is funded first at its required monthly (capped at free cash), in deadline order; (2) the Roth/HSA is reserved next: min(50% of free cash, IRA limit x earners + HSA limit, per month), or, when a priority goal took money first, min(50% of what remains, those limits); (3) remaining goals share what is left in deadline order (earliest first), each taking min(required monthly, remaining); (4) anything still unspent goes to the Roth/HSA up to its limits, then to the 15% retirement step.
- **Required monthly** is re-solved each month from the goal's current balance and months left (annuity formula above, balance growing at the safe yield). So when an earlier goal ends, its money rolls into later goals that are behind (catch-up), then the Roth/HSA up to the limit, then retire_15.
- **Feasible?** A goal is feasible if its simulated balance reaches the cash needed by the deadline. If not: `feasible` is false, `monthly` is what it actually gets at the start, `requiredMonthly` is the full amount, `delayMonths` is the smallest delay (solving the annuity for n at the average amount it actually gets), and the note says "delay by about N months, or lower the target to $X, or pause the Roth IRA to free $Y a month". X is what the money actually saved reaches (for a house, divided by down + closing %); Y is the Roth/HSA amount that could close the starting gap.
- The month-by-month plan is output as `cashSchedule` (month, freeCash, roth, hsa, retire15, goals[]). Roth/HSA and retire_15 are open-ended: `ongoing: true` and endMonth is the retirement month.
- **PSLF.** If anyone is marked public service and there is a federal student loan, a flag is set: keep the minimum, use an income-driven plan, certify employment every year.

## 6. Projection (`projection.js`)
- One row per year until the oldest person's retirement age (retire age - age). A person stops contributing once they reach their own retirement age.
- Pay for year y = salary x (1 + raisePct)^(y-1) (real raise).
- growth = start x real return; end = start + growth + contribution + employer match. Contributions are added at year-end (year 1 has no growth).
- **Before the house goal year**: out-of-pocket contributions = the employee percent that captures the match (or the current percent if higher) x pay, plus the IRA deposits the waterfall produces (monthly amount x months active that year). **After**: pay x (15% - pension % - match %). Pension contribution percent is NOT added to the balance (a pension is a promise, not an account). The HSA is not counted toward the projection (conservative).
- Starting balance = all account balances except pensions.
- **Wait series:** same contributions, but zero for the first `waitYearsComparison` years. Cost of waiting = balance - waitBalance.
- **Scenarios:** same contributions at real return 3%, the base return, and 7%.
- **Retirement income** = balance x withdrawal rate + pension (sum of estimates) + Social Security (household total entered). Replacement % = total / today's combined income. Without-pension variants drop the pension.
- Regression: 37 working years, first 5 at $5,525, then $10,200, 5% real gives $913,517; waiting 10 years gives $557,625 (tested).

## 7. Allocation (`allocation.js`)
- Stocks: 90% if the user would hold or buy in a drop, 80% if nervous but holding, 60% if they would sell. Bonds = the rest. Reason: the less likely someone is to stay put in a crash, the less stock they should hold.
- Target-date year = round((current year + years to retirement) / 5) x 5, using the average years to retirement across people. Three-fund split: 70% of stocks to U.S., 30% to international.
- Example funds (Fidelity FFIJX/FSKAX/FTIHX/FXNAX, Vanguard VFFVX/VTSAX/VTIAX/VBTLX, Schwab SWYOX/SWTSX/SWISX/SWAGX) are labeled as examples; look for fees under 0.20%. A pension adds a note that it acts like a bond allocation.

## 8. Accounts list
- Priority order: match accounts, then IRAs, then HSA, then raising other workplace plans, then pension notes. Limits: 2026 401(k)/403(b)/457(b)/TSP $24,500; IRA $7,500; HSA $8,750 family / $4,400 single. 2027 projected (flagged as projected, not official): 401(k) $25,500, IRA $7,500. The plan never recommends above a limit.
- A pension with years worked less than vest years gets "not vested for X more years; if you leave, roll the refund to an IRA" and a warning.

## 9. Ninety days
Items tagged `this_week`, `this_month`, `months_2_3`: payroll match change for each person below the match; HR questions for pension unknowns or unknown match; a budget check (or a cut-expenses task when free cash is 0 or less); listing debts and setting autopay; opening a high-yield savings or money market account; beneficiaries; PSLF paperwork; extra debt payment; opening the IRA; goal savings accounts; checking pay stubs.

## 10. Protection list
Beneficiaries; disability insurance; term life when married with a house goal, or there is a kids goal; wills and powers of attorney; health plan comparison; PSLF when it applies.

## 11. Verify list
Items left at 0/null that matter: unknown employer match, unknown pension estimate/vesting/years, Social Security estimate (get it at ssa.gov/myaccount), zero expenses, debts with 0 APR or minimum, HSA eligibility, and the tax estimate assumptions.

## 12. Warnings (summary.warnings)
Negative or zero free cash; debt payment too low; goal cannot be fully funded; contributions above a limit (current contribution above $24,500, or the 15% target needs more than a limit allows); pension not vested; projected retirement income under 70% of today's income.

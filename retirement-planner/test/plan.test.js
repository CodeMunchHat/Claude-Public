const test = require('node:test');
const assert = require('node:assert');
const { buildPlan } = require('../js/engine/index.js');

const sample = () => ({
  version: 1,
  household: { earners: 2, married: true, state: 'TN', people: [
    { name: 'Cheltsey', age: 28, retireAge: 65, salary: 42500, raisePct: 0.0, publicService: true },
    { name: 'Drew', age: 28, retireAge: 65, salary: 42500, raisePct: 0.0, publicService: false } ] },
  accounts: [
    { owner: 0, type: 'pension', balance: 0, contribPct: 0.06, vestYears: 5, yearsWorked: 1.5, estIncomeAtRetirement: 20000 },
    { owner: 1, type: '401k', balance: 0, contribPct: 0.0, matchPct: 1.0, matchUpToPct: 0.03, rothOption: true } ],
  cash: { checking: 1500, savings: 500, monthlyExpenses: 4500, emergencyFund: 0 },
  debts: [
    { name: 'Visa', type: 'credit_card', balance: 5000, apr: 0.22, minPayment: 150 },
    { name: 'Car', type: 'auto', balance: 12000, apr: 0.065, minPayment: 300 } ],
  goals: [
    { type: 'house', name: 'First home', targetPrice: 300000, downPct: 0.05, closingPct: 0.03, years: 5, saved: 0 },
    { type: 'other', name: 'Grad school', amount: 10000, years: 3, saved: 0 } ],
  risk: { dropReaction: 'hold_or_buy', horizonComfort: 'long', experience: 'none' },
  assumptions: { realReturn: 0.05, safeYield: 0.0357, withdrawalRate: 0.04, socialSecurityAtRetirement: 35000, waitYearsComparison: 10, payoffMethod: 'avalanche', extraMonthlyCash: null }
});

function walk(v, path, cb) {
  if (typeof v === 'number') cb(v, path);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, path + '[' + i + ']', cb));
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], path + '.' + k, cb));
}

test('sample plan: shape, no NaN, phases non-negative', () => {
  const p = buildPlan(sample(), { currentYear: 2026 });
  ['summary', 'ninetyDays', 'phases', 'debt', 'goals', 'accounts', 'allocation', 'projection', 'protection', 'limits'].forEach((k) => assert.ok(p[k], k));
  assert.deepStrictEqual(p.phases.map((x) => x.id), ['starter_ef', 'match', 'high_debt', 'full_ef', 'roth_hsa', 'retire_15', 'goals_taxable']);
  walk(p, 'plan', (n, path) => assert.ok(Number.isFinite(n), 'bad number at ' + path));
  p.phases.forEach((ph) => {
    ['target', 'monthly', 'months', 'startMonth', 'endMonth'].forEach((k) => assert.ok(ph[k] >= 0, ph.id + '.' + k));
    assert.ok(ph.endMonth >= ph.startMonth);
    assert.ok(ph.why && Array.isArray(ph.steps));
  });
  assert.strictEqual(p.summary.filingStatus, 'mfj');
  assert.strictEqual(p.summary.marginalFederal, 0.12);
  assert.strictEqual(p.summary.rothRecommended, true);
  assert.strictEqual(p.summary.stateRate, 0);
  assert.strictEqual(p.allocation.stockPct, 0.9);
  assert.strictEqual(p.allocation.targetYear, 2065);
  assert.strictEqual(p.projection.years.length, 37);
  assert.strictEqual(p.projection.years[0].pay, 85000);
  assert.strictEqual(p.projection.pension, 20000);
  assert.ok(p.accounts.every((a) => a.limit2026 == null || a.limit2026 >= 7500));
});

test('regression via buildPlan: no match, tuned extra cash gives the regression streams', () => {
  const inp = sample();
  inp.accounts[1].matchPct = 0; inp.accounts[1].matchUpToPct = 0;
  inp.goals = [{ type: 'house', name: 'First home', targetPrice: 300000, downPct: 0.05, closingPct: 0.03, years: 5, saved: 0 }];
  inp.assumptions.extraMonthlyCash = 1000;
  const p = buildPlan(inp, { currentYear: 2026 });
  // after the house, out-of-pocket is 12% of pay = 10,200 (15% minus 3% pension share across the household)
  assert.strictEqual(p.projection.years[5].contrib, 10200);
  assert.strictEqual(p.projection.years[5].phase, 'after_house');
  assert.strictEqual(p.projection.years[4].phase, 'before_house');
});

test('negative free cash: warning, zero monthly amounts, still a plan', () => {
  const inp = sample();
  inp.cash.monthlyExpenses = 9000;
  const p = buildPlan(inp, { currentYear: 2026 });
  assert.ok(p.summary.freeCashMonthly < 0);
  assert.ok(p.summary.warnings.some((w) => /free cash/i.test(w)));
  p.phases.filter((x) => x.id !== 'match').forEach((ph) => assert.strictEqual(ph.monthly, 0));
  walk(p, 'plan', (n, path) => assert.ok(Number.isFinite(n), path));
});

test('single earner, big salary, traditional recommended, limits respected', () => {
  const p = buildPlan({
    household: { earners: 1, married: false, state: 'CA', people: [{ name: 'Alex', age: 35, retireAge: 65, salary: 300000, raisePct: 0.01, publicService: false }] },
    accounts: [{ owner: 0, type: '401k', balance: 100000, contribPct: 0.05, matchPct: 0.5, matchUpToPct: 0.06 }, { owner: 0, type: 'hsa', balance: 0 }],
    cash: { monthlyExpenses: 6000, emergencyFund: 50000 }, debts: [], goals: [], risk: { dropReaction: 'sell' },
    assumptions: { socialSecurityAtRetirement: 40000 }
  }, { currentYear: 2026 });
  assert.strictEqual(p.summary.rothRecommended, false);
  assert.strictEqual(p.allocation.stockPct, 0.6);
  assert.ok(p.accounts.every((a) => a.limit2026 == null || a.limit2026 <= 24500));
  walk(p, 'plan', (n, path) => assert.ok(Number.isFinite(n), path));
});

test('PSLF flag and goal infeasible warning', () => {
  const inp = sample();
  inp.debts.push({ name: 'Fed loan', type: 'student_federal', balance: 20000, apr: 0.05, minPayment: 200 });
  const p = buildPlan(inp, { currentYear: 2026 });
  assert.strictEqual(p.summary.pslf, true);
  assert.ok(p.protection.some((x) => /PSLF/.test(x.item)));
  assert.ok(p.summary.warnings.some((w) => /Goal/.test(w)));
  assert.ok(p.goals.some((g) => g.feasible === false && /To fix it/.test(g.note)));
});

test('empty-ish inputs do not throw', () => {
  const p = buildPlan({}, { currentYear: 2026 });
  walk(p, 'plan', (n, path) => assert.ok(Number.isFinite(n), path));
});

test('joint allocation: Roth gets money, totals never exceed free cash, house reports feasible or a delay', () => {
  const p = buildPlan(sample(), { currentYear: 2026 });
  const roth = p.phases.find((x) => x.id === 'roth_hsa');
  assert.ok(roth.monthly > 0, 'roth monthly ' + roth.monthly);
  assert.strictEqual(roth.ongoing, true);
  assert.strictEqual(roth.endMonth, 37 * 12);
  assert.strictEqual(p.phases.find((x) => x.id === 'retire_15').ongoing, true);
  assert.ok(p.cashSchedule.length > 0);
  p.cashSchedule.forEach((m) => {
    if (m.month >= roth.startMonth) assert.ok(m.roth > 0 || m.freeCash <= 0, 'roth > 0 at month ' + m.month);
    const total = m.roth + m.hsa + m.retire15 + m.goals.reduce((s, g) => s + g.amount, 0);
    assert.ok(total <= m.freeCash, `month ${m.month}: ${total} > ${m.freeCash}`);
  });
  const house = p.goals.find((g) => g.type === 'house');
  assert.ok(house.feasible === true || (Number.isInteger(house.delayMonths) && house.delayMonths > 0), 'house feasible or concrete delay');
  // goals are ordered by deadline in the schedule: earlier deadline listed first
  assert.strictEqual(p.cashSchedule[0].goals[0].name, 'Grad school');
});

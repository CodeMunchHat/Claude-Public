const test = require('node:test');
const assert = require('node:assert');
const G = require('../js/engine/goals.js');

test('24,000 over 60 months at 3.57%, nothing saved, is about 366/month', () => {
  const m = G.monthlyNeeded(24000, 60, 0.0357, 0);
  assert.ok(Math.abs(m - 366) < 2, 'got ' + m);
});

test('saved money grows and reduces the monthly need', () => {
  assert.ok(G.monthlyNeeded(24000, 60, 0.0357, 5000) < G.monthlyNeeded(24000, 60, 0.0357, 0));
  assert.strictEqual(G.monthlyNeeded(1000, 12, 0.03, 5000), 0);
});

test('house cash = price * (down + closing)', () => {
  assert.strictEqual(G.cashNeeded({ type: 'house', targetPrice: 300000, downPct: 0.05, closingPct: 0.03 }), 24000);
  assert.strictEqual(G.cashNeeded({ type: 'other', amount: 10000 }), 10000);
});

test('cashFromMonthly inverts monthlyNeeded', () => {
  const m = G.monthlyNeeded(24000, 60, 0.0357, 1000);
  assert.ok(Math.abs(G.cashFromMonthly(m, 60, 0.0357, 1000) - 24000) < 0.01);
});

test('starting later shrinks the months and raises the monthly', () => {
  const goal = { type: 'other', amount: 10000, years: 3, saved: 0 };
  const a = G.needs([goal], 0, 0.0357)[0], b = G.needs([goal], 12, 0.0357)[0];
  assert.strictEqual(a.months, 36); assert.strictEqual(b.months, 24);
  assert.ok(b.required > a.required);
});

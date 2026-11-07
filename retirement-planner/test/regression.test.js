const test = require('node:test');
const assert = require('node:assert');
const { series } = require('../js/engine/projection.js');

function within(actual, expected, pct) {
  assert.ok(Math.abs(actual - expected) / expected <= pct, `expected ${actual} within ${pct * 100}% of ${expected}`);
}

test('regression: 37 working years, 5 at 5,525 then 10,200, 5% real', () => {
  const contribs = Array.from({ length: 37 }, (_, i) => (i < 5 ? 5525 : 10200));
  const base = series(0, 0.05, contribs, null, 0);
  within(base.balance, 913517, 0.01);
  const wait = series(0, 0.05, contribs, null, 10);
  within(wait.balance, 557625, 0.01);
  assert.strictEqual(base.rows[0].end, 5525); // year 1: no growth on a zero start
});

test('series: end = start + growth + contrib', () => {
  const s = series(1000, 0.05, [100, 100], null, 0);
  assert.strictEqual(s.rows[0].end, 1000 + 50 + 100);
  assert.ok(Math.abs(s.balance - (1150 * 1.05 + 100)) < 1e-9);
});

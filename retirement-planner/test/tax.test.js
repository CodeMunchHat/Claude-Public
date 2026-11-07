const test = require('node:test');
const assert = require('node:assert');
const T = require('../js/engine/tables.js');

test('2026 standard deductions', () => {
  assert.strictEqual(T.standardDeduction.single, 16100);
  assert.strictEqual(T.standardDeduction.mfj, 32200);
});

test('marginal bracket selection', () => {
  assert.strictEqual(T.marginalRate(50250, 'mfj'), 0.12);
  assert.strictEqual(T.marginalRate(24800, 'mfj'), 0.10); // top of bracket stays in lower one
  assert.strictEqual(T.marginalRate(24801, 'mfj'), 0.12);
  assert.strictEqual(T.marginalRate(60000, 'single'), 0.22);
  assert.strictEqual(T.marginalRate(150000, 'single'), 0.24);
  assert.strictEqual(T.marginalRate(1000000, 'mfj'), 0.37);
  assert.strictEqual(T.marginalRate(0, 'single'), 0.10);
});

test('federal tax math (MFJ 85k gross, 2,550 pretax)', () => {
  const ti = T.taxableIncome(85000, 2550, 'mfj');
  assert.strictEqual(ti, 50250);
  assert.ok(Math.abs(T.federalTax(ti, 'mfj') - (2480 + 0.12 * (50250 - 24800))) < 1e-6);
});

test('Roth vs Traditional advice', () => {
  assert.strictEqual(T.rothAdvice(0.10), 'roth');
  assert.strictEqual(T.rothAdvice(0.12), 'roth');
  assert.strictEqual(T.rothAdvice(0.22), 'either_lean_roth');
  assert.strictEqual(T.rothAdvice(0.24), 'traditional');
  assert.strictEqual(T.rothAdvice(0.35), 'traditional');
});

test('state rates', () => {
  ['TN', 'TX', 'FL', 'WA', 'NV', 'SD', 'WY', 'AK', 'NH'].forEach((s) => assert.strictEqual(T.stateRate(s), 0));
  assert.ok(T.stateRate('CA') > 0);
});

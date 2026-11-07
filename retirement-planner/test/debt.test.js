const test = require('node:test');
const assert = require('node:assert');
const { schedule } = require('../js/engine/debt.js');

test('5,000 at 22% APR with 300/month pays off in 21 months', () => {
  const s = schedule([{ name: 'Visa', balance: 5000, apr: 0.22, minPayment: 150 }], 150, 'avalanche');
  assert.strictEqual(s.order[0].months, 21);
  // true interest for these inputs is about 1,030 (the brief said about 1,300)
  assert.ok(s.order[0].interest > 1000 && s.order[0].interest < 1100, 'interest ' + s.order[0].interest);
  assert.strictEqual(s.debtFreeMonth, 21);
  assert.strictEqual(s.order[0].payment, 300);
});

test('avalanche targets highest APR, snowball smallest balance; both totals returned', () => {
  const debts = [
    { name: 'Big', balance: 8000, apr: 0.2, minPayment: 160 },
    { name: 'Small', balance: 1000, apr: 0.12, minPayment: 30 }
  ];
  const av = schedule(debts, 300, 'avalanche');
  const sn = schedule(debts, 300, 'snowball');
  const month = (s, n) => s.order.find((o) => o.name === n).months;
  assert.ok(month(sn, 'Small') < month(av, 'Small'));
  assert.ok(av.totalInterest <= sn.totalInterest);
  assert.strictEqual(av.alt.method, 'snowball');
  assert.strictEqual(av.alt.totalInterest, sn.totalInterest);
  assert.strictEqual(sn.alt.method, 'avalanche');
});

test('debts under 7% APR get minimum only', () => {
  const s = schedule([
    { name: 'Card', balance: 1000, apr: 0.2, minPayment: 25 },
    { name: 'Car', balance: 12000, apr: 0.065, minPayment: 300 }
  ], 500, 'avalanche');
  const car = s.order.find((o) => o.name === 'Car');
  assert.strictEqual(car.payment, 300);
  assert.ok(s.highDebtEndMonth < car.months);
});

test('payment too low is flagged', () => {
  const s = schedule([{ name: 'Bad', balance: 10000, apr: 0.24, minPayment: 100 }], 0, 'avalanche');
  assert.strictEqual(s.order[0].flag, 'payment too low');
  assert.ok(Number.isFinite(s.order[0].months));
});

test('no debts', () => {
  const s = schedule([], 100, 'avalanche');
  assert.strictEqual(s.debtFreeMonth, 0);
  assert.strictEqual(s.totalInterest, 0);
});

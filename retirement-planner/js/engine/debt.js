/* Debt payoff schedules (avalanche / snowball). */
(function (root) {
  var CAP = 600;

  function run(debts, extra, method, opts) {
    var thr = opts.threshold != null ? opts.threshold : 0.07;
    var start = opts.startMonth || 0;
    var items = [];
    debts.forEach(function (d) {
      if (!(d.balance > 0)) return;
      var apr = d.apr || 0, min = d.minPayment || 0;
      items.push({
        name: d.name, type: d.type, apr: apr, bal: d.balance, startBal: d.balance, min: min,
        elig: opts.allEligible || apr >= thr, interest: 0, months: 0, maxPay: 0, done: false,
        tooLow: min < d.balance * apr / 12 - 1e-9, firstInterest: d.balance * apr / 12
      });
    });
    var minSum = items.reduce(function (s, x) { return s + x.min; }, 0);
    var m, i;
    for (m = 1; m <= CAP; m++) {
      var active = items.filter(function (x) { return !x.done; });
      if (!active.length) break;
      var budget = minSum + (m - 1 >= start ? Math.max(0, extra) : 0);
      active.forEach(function (x) {
        var int = x.bal * x.apr / 12;
        x.bal += int; x.interest += int; x.pay = 0;
      });
      active.forEach(function (x) {
        var p = Math.min(x.min, x.bal);
        x.bal -= p; x.pay = p; budget -= p;
      });
      // freed and extra money goes to eligible debts by method
      var targets = active.filter(function (x) { return x.elig && x.bal > 0.005; });
      targets.sort(function (a, b) {
        if (method === 'snowball') return a.bal - b.bal || b.apr - a.apr;
        return b.apr - a.apr || a.bal - b.bal;
      });
      for (i = 0; i < targets.length && budget > 0.005; i++) {
        var q = Math.min(budget, targets[i].bal);
        targets[i].bal -= q; targets[i].pay += q; budget -= q;
      }
      active.forEach(function (x) {
        if (x.pay > x.maxPay) x.maxPay = x.pay;
        if (x.bal <= 0.005) { x.done = true; x.months = m; }
      });
    }
    var order = items.map(function (x) {
      if (!x.done) x.months = CAP;
      var o = {
        name: x.name, apr: x.apr, months: x.months, interest: Math.round(x.interest), payment: Math.round(x.maxPay),
        paidOff: x.done
      };
      if (x.tooLow || !x.done) {
        o.flag = 'payment too low';
        o.detail = x.name + ': the minimum payment (' + Math.round(x.min) + '/mo) does not cover the monthly interest (about ' +
          Math.round(x.firstInterest) + '). Pay more or the balance will not shrink.';
      }
      o._elig = x.elig;
      return o;
    });
    order.sort(function (a, b) { return a.months - b.months || a.name.localeCompare(b.name); });
    var highEnd = start;
    order.forEach(function (o) { if (o._elig && o.months > highEnd) highEnd = o.months; });
    var any = order.some(function (o) { return o._elig; });
    order.forEach(function (o) { delete o._elig; });
    return {
      method: method,
      order: order,
      totalInterest: Math.round(order.reduce(function (s, o) { return s + o.interest; }, 0)),
      debtFreeMonth: order.reduce(function (mx, o) { return Math.max(mx, o.months); }, 0),
      highDebtEndMonth: any ? highEnd : start,
      minSum: minSum
    };
  }

  /**
   * schedule(debts, extraMonthly, method, opts)
   * Debts below opts.threshold (default 0.07 APR) get minimums only; freed payments roll to the remaining
   * eligible debts. opts.startMonth: extra money begins at that month. Returns the chosen method plus the alternative.
   */
  function schedule(debts, extraMonthly, method, opts) {
    opts = opts || {};
    method = method === 'snowball' ? 'snowball' : 'avalanche';
    var other = method === 'avalanche' ? 'snowball' : 'avalanche';
    var main = run(debts || [], extraMonthly || 0, method, opts);
    var alt = run(debts || [], extraMonthly || 0, other, opts);
    main.alt = { method: other, totalInterest: alt.totalInterest, debtFreeMonth: alt.debtFreeMonth, highDebtEndMonth: alt.highDebtEndMonth };
    var snow = method === 'snowball' ? main : alt;
    main.snowballAlt = { totalInterest: snow.totalInterest, debtFreeMonth: snow.debtFreeMonth };
    return main;
  }

  var api = { schedule: schedule };
  root.Planner = root.Planner || {};
  root.Planner.debt = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

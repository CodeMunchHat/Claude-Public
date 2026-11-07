/* Year-by-year retirement projection in today's dollars (real returns). */
(function (root) {
  // Low-level series. contribs[i] / matches[i] are dollars added at the END of year i+1.
  // Growth = start * realReturn; end = start + growth + contrib + match. skipFirst zeroes the first N years of deposits.
  function series(startBalance, realReturn, contribs, matches, skipFirst) {
    var bal = startBalance || 0, rows = [], i;
    skipFirst = skipFirst || 0;
    for (i = 0; i < contribs.length; i++) {
      var c = i < skipFirst ? 0 : (contribs[i] || 0);
      var m = i < skipFirst ? 0 : ((matches && matches[i]) || 0);
      var g = bal * realReturn;
      rows.push({ start: bal, growth: g, contrib: c, match: m, end: bal + g + c + m });
      bal = bal + g + c + m;
    }
    return { rows: rows, balance: bal };
  }

  function r0(x) { return Math.round(x); }

  /**
   * build(n, plan) -> projection block.
   * plan: { houseYears, persons: [{ preEmpPct, matchPctEff, rothMonthly, rothStartMonth, afterOopPct }] }
   * n: normalized inputs (people, accounts, assumptions, combinedIncome).
   */
  function build(n, plan) {
    var A = n.assumptions, people = n.people;
    var oldest = people.reduce(function (b, p) { return p.age > b.age ? p : b; }, people[0]);
    var N = Math.max(1, Math.round(oldest.retireAge - oldest.age));
    var startBal = n.accounts.reduce(function (s, a) { return s + (a.type === 'pension' ? 0 : (a.balance || 0)); }, 0);
    var contribs = [], matches = [], pays = [], phases = [], y;
    for (y = 1; y <= N; y++) {
      var c = 0, m = 0, pay = 0;
      people.forEach(function (p, idx) {
        if (!(p.age + (y - 1) < p.retireAge)) return;
        var pp = plan.persons[idx];
        var thisPay = p.salary * Math.pow(1 + p.raisePct, y - 1);
        pay += thisPay;
        m += thisPay * pp.matchPctEff;
        if (y <= plan.houseYears) {
          c += thisPay * pp.preEmpPct;
        } else {
          c += thisPay * pp.afterOopPct;
        }
      });
      if (pay > 0 && y <= plan.houseYears && plan.extraByYear) c += plan.extraByYear[y - 1] || 0;
      contribs.push(c); matches.push(m); pays.push(pay);
      phases.push(y <= plan.houseYears ? 'before_house' : 'after_house');
    }
    var base = series(startBal, A.realReturn, contribs, matches, 0);
    var wait = series(startBal, A.realReturn, contribs, matches, A.waitYearsComparison);
    var rows = base.rows.map(function (r, i) {
      return {
        year: i + 1, age: oldest.age + i, phase: phases[i], pay: r0(pays[i]), contrib: r0(r.contrib), match: r0(r.match),
        start: r0(r.start), growth: r0(r.growth), end: r0(r.end), waitEnd: r0(wait.rows[i].end)
      };
    });
    var bal = base.balance;
    var income = bal * A.withdrawalRate;
    var pension = n.accounts.reduce(function (s, a) { return s + (a.type === 'pension' ? (a.estIncomeAtRetirement || 0) : 0); }, 0);
    var ss = A.socialSecurityAtRetirement || 0;
    var total = income + pension + ss, without = income + ss;
    var denom = n.combinedIncome > 0 ? n.combinedIncome : 1;
    function scen(rate) { return { realReturn: rate, balance: r0(series(startBal, rate, contribs, matches, 0).balance) }; }
    return {
      years: rows,
      startBalance: r0(startBal),
      balanceAtRetirement: r0(bal),
      incomeFromInvestments: r0(income),
      pension: r0(pension),
      socialSecurity: r0(ss),
      totalIncome: r0(total),
      replacementPct: Math.round(total / denom * 1000) / 1000,
      withoutPension: r0(without),
      withoutPensionPct: Math.round(without / denom * 1000) / 1000,
      waitYears: A.waitYearsComparison,
      waitBalance: r0(wait.balance),
      costOfWaiting: r0(bal - wait.balance),
      scenarios: { worst: scen(0.03), base: { realReturn: A.realReturn, balance: r0(bal) }, best: scen(0.07) }
    };
  }

  var api = { series: series, build: build };
  root.Planner = root.Planner || {};
  root.Planner.projection = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

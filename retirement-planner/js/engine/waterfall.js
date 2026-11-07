/* Priority waterfall: free cash flow -> ordered phases on a month timeline. */
(function (root) {
  if (typeof require === 'function' && typeof module !== 'undefined') {
    require('./tables.js'); require('./debt.js'); require('./goals.js');
  }
  var P = root.Planner;

  function sum(arr, f) { return arr.reduce(function (s, x) { return s + f(x); }, 0); }
  function r(x) { return Math.round(x); }

  function build(n, tax) {
    var T = P.tables, D = P.debt, G = P.goals, M = T.money, lim = T.limits.y2026, A = n.assumptions;
    var warnings = [];
    var people = n.people;
    var oldest = people.reduce(function (b, p) { return p.age > b.age ? p : b; }, people[0]);
    var horizonMonths = Math.max(1, Math.round(oldest.retireAge - oldest.age)) * 12;
    var isWork = function (a) { return T.workplaceTypes.indexOf(a.type) >= 0; };

    // ---- employer match (payroll change, not a free-cash allocation)
    var matchRows = [];
    n.accounts.forEach(function (a) {
      if (!isWork(a) || !(a.matchPct > 0) || !(a.matchUpToPct > 0)) return;
      var p = people[a.owner], cur = a.contribPct || 0, tgt = Math.max(cur, a.matchUpToPct);
      matchRows.push({
        acct: a, person: p, cur: cur, tgt: tgt, raise: Math.max(0, a.matchUpToPct - cur),
        empAnnual: tgt * p.salary, employerAnnual: a.matchPct * Math.min(tgt, a.matchUpToPct) * p.salary
      });
    });
    var matchRaiseMonthly = sum(matchRows, function (m) { return m.raise * m.person.salary / 12; });
    var matchTakeHomeHit = matchRaiseMonthly * (1 - tax.marginal - tax.stateRate); // pre-tax: Uncle Sam covers part

    // ---- free cash flow
    var minSum = sum(n.debts, function (d) { return d.balance > 0 ? (d.minPayment || 0) : 0; });
    var F;
    if (typeof A.extraMonthlyCash === 'number') F = A.extraMonthlyCash;
    else F = tax.takeHomeMonthly - matchTakeHomeHit - n.cash.monthlyExpenses - minSum;
    F = Math.round(F);
    var Fe = Math.max(0, F);
    if (F <= 0) {
      warnings.push('Your estimated free cash flow is ' + M(F) + ' a month (take-home minus expenses minus minimum debt payments). Every dollar-amount in the plan is $0 until you cut expenses or raise income. Start with the budget step in your 90-day list.');
    }

    var phases = [], t = 0;
    var existing = n.cash.emergencyFund || 0;

    // ---- 1. starter emergency fund
    var starterTarget = (n.earners === 1 && n.gross < 40000) ? 1000 : 2000;
    var sNeed = Math.max(0, starterTarget - existing);
    var starter = { id: 'starter_ef', title: 'Starter emergency fund', target: starterTarget, monthly: 0, months: 0, startMonth: 0, endMonth: 0, why: '', steps: [] };
    if (sNeed === 0) {
      starter.skipped = true;
      starter.why = 'You already have ' + M(existing) + ' set aside, which covers the ' + M(starterTarget) + ' starter cushion. It keeps a car repair from landing on a credit card.';
    } else if (Fe > 0) {
      starter.monthly = Math.min(Fe, sNeed);
      starter.months = Math.ceil(sNeed / Fe);
      starter.endMonth = starter.months;
      starter.why = 'A small cushion first means a surprise bill does not push you back into debt. ' + M(starterTarget) + ' is enough to start; the bigger fund comes later.';
      starter.steps = ['Open a separate high-yield savings account just for emergencies.',
        'Move ' + M(starter.monthly) + ' a month into it (set up an automatic transfer on payday) until it holds ' + M(starterTarget) + '.'];
      t = starter.endMonth;
    } else {
      starter.why = 'A small cushion comes first, but there is no free cash yet. Fix the budget gap, then fund ' + M(starterTarget) + '.';
      starter.steps = ['Cut expenses or raise income until free cash is above $0.'];
    }
    var starterFunded = sNeed === 0 || Fe > 0;

    // ---- 2. match
    var match = { id: 'match', title: 'Capture the full employer match', target: r(sum(matchRows, function (m) { return m.empAnnual; })), monthly: r(matchRaiseMonthly), months: 0, startMonth: 0, endMonth: 0, why: '', steps: [] };
    if (!matchRows.length) {
      match.skipped = true; match.target = 0; match.monthly = 0;
      match.why = 'No employer match was entered. If your employer offers one, it is free money and goes first, so ask HR.';
    } else {
      match.why = 'An employer match is an instant 50% to 100% return. Nothing else on this list beats it, so it is done on your very next paycheck by changing a payroll setting.';
      matchRows.forEach(function (m) {
        if (m.raise > 0) {
          match.steps.push(m.person.name + ': change your ' + T.workplaceLabel(m.acct.type) + ' contribution from ' + T.pct(m.cur, 1) + ' to ' + T.pct(m.tgt, 1) + ' of pay (about ' + M(m.empAnnual) + ' a year). Your employer adds up to ' + M(m.employerAnnual) + ' a year.' + (m.acct.rothOption && tax.rothAdvice !== 'traditional' ? ' Choose the Roth option if you have it.' : ''));
        } else {
          match.steps.push(m.person.name + ': you already contribute ' + T.pct(m.cur, 1) + ', which captures the full match (' + M(m.employerAnnual) + ' a year from your employer). Keep it.');
        }
      });
      if (matchRaiseMonthly > 0) match.steps.push('This lowers your take-home by about ' + M(matchTakeHomeHit) + ' a month after tax savings; that is already subtracted from your free cash.');
    }

    // ---- 3. high-interest debt
    var thr = T.highAprThreshold;
    var highDebts = n.debts.filter(function (d) { return d.balance > 0 && (d.apr || 0) >= thr; });
    var sched = D.schedule(n.debts, Fe, A.payoffMethod, { startMonth: t, threshold: thr });
    var hd = { id: 'high_debt', title: 'Pay off high-interest debt', target: r(sum(highDebts, function (d) { return d.balance; })), monthly: 0, months: 0, startMonth: t, endMonth: t, why: '', steps: [] };
    var Fe2 = Fe;
    if (!highDebts.length) {
      hd.skipped = true;
      hd.why = 'No debts at ' + T.pct(thr) + ' APR or higher, so nothing here needs to be rushed.';
    } else {
      hd.why = 'Debt at ' + T.pct(thr) + ' or more costs more than investing usually earns, so paying it off is a guaranteed return. Minimums go to every debt; all free cash goes to the target debt (' + (A.payoffMethod === 'snowball' ? 'smallest balance first' : 'highest rate first') + ').';
      if (Fe > 0) {
        hd.monthly = Fe;
        hd.endMonth = Math.max(t, sched.highDebtEndMonth);
        hd.months = hd.endMonth - t;
        Fe2 = Fe + sum(highDebts, function (d) { return d.minPayment || 0; });
        t = hd.endMonth;
      } else {
        hd.steps.push('Pay the minimums on every debt and fix the budget gap first.');
      }
      sched.order.forEach(function (o) {
        var d = n.debts.filter(function (x) { return x.name === o.name; })[0];
        if (d && (d.apr || 0) >= thr) hd.steps.push(o.name + ' (' + T.pct(d.apr, 1) + ' APR): paying about ' + M(o.payment) + ' a month, gone in ' + o.months + ' months, ' + M(o.interest) + ' interest.');
      });
      hd.steps.push('When a debt is paid off, add its old payment to the next one so the total stays the same.');
    }
    n.debts.forEach(function (d) {
      if (d.balance > 0 && (d.apr || 0) < thr && hd.steps) hd.steps.push(d.name + ' (' + T.pct(d.apr || 0, 1) + ' APR) is under ' + T.pct(thr) + ': pay only the minimum (' + M(d.minPayment || 0) + ') for now.');
    });
    sched.order.forEach(function (o) { if (o.flag) warnings.push(o.detail ? 'Payment too low: ' + o.detail : 'Payment too low on ' + o.name + '.'); });

    // ---- 4. full emergency fund
    var efTarget = n.cash.monthlyExpenses * (n.earners >= 2 ? 3 : 6);
    var have = starterFunded && Fe > 0 ? Math.max(existing, starterTarget) : existing;
    var efNeed = Math.max(0, efTarget - have);
    var ef = { id: 'full_ef', title: 'Full emergency fund', target: r(efTarget), monthly: 0, months: 0, startMonth: t, endMonth: t, why: '', steps: [] };
    if (efNeed === 0) {
      ef.skipped = true;
      ef.why = efTarget === 0 ? 'No monthly expenses were entered, so no target could be set.' : 'You already have at least ' + M(efTarget) + ' set aside (' + (n.earners >= 2 ? '3' : '6') + ' months of expenses), so this step is done.';
    } else {
      ef.why = (n.earners >= 2 ? 'With two incomes, 3 months of expenses is a reasonable cushion (one job loss still leaves one paycheck).' : 'With one income, 6 months of expenses protects you if that income stops.') + ' Target: ' + M(efTarget) + '.';
      if (Fe2 > 0) {
        ef.monthly = Math.min(Fe2, efNeed);
        ef.months = Math.ceil(efNeed / Fe2);
        ef.endMonth = t + ef.months;
        t = ef.endMonth;
        ef.steps = ['Keep adding ' + M(ef.monthly) + ' a month to the same savings account until it reaches ' + M(efTarget) + '.', 'Keep it in a high-yield savings or money market account, not in the stock market.'];
      } else ef.steps = ['No free cash yet; this starts once the budget gap is closed.'];
    }

    // ---- 5/7. Roth/HSA and goals share free cash from here
    var gStart = t;
    var needs = G.needs(n.goals, gStart, A.safeYield);
    var goalFirst = needs.some(function (x) { return x.months <= 24; });
    var earnerIdx = [];
    people.forEach(function (p, i) { if (p.salary > 0) earnerIdx.push(i); });
    var iraWant = earnerIdx.length * lim.ira / 12;
    var hasHsa = n.accounts.some(function (a) { return a.type === 'hsa'; });
    var hsaLimit = n.married ? lim.hsaFamily : lim.hsaSingle;
    var hsaWant = hasHsa ? hsaLimit / 12 : 0;
    var R = iraWant + hsaWant, Gsum = sum(needs, function (x) { return x.required; });
    var rothAlloc = 0, goalPay = 0, leftover = 0;
    if (Fe2 > 0) {
      if (goalFirst) {
        goalPay = Math.min(Gsum, Fe2); rothAlloc = Math.min(R, Fe2 - goalPay); leftover = Fe2 - goalPay - rothAlloc;
      } else {
        rothAlloc = Math.min(R, 0.5 * Fe2);
        var avail = Fe2 - rothAlloc;
        goalPay = Math.min(Gsum, avail);
        var left = avail - goalPay, more = Math.min(left, R - rothAlloc);
        rothAlloc += more; leftover = left - more;
      }
    }
    var rothIRA = Math.min(iraWant, rothAlloc), hsa = rothAlloc - rothIRA;
    var iraName = tax.rothAdvice === 'traditional' ? 'Traditional IRA' : 'Roth IRA';

    var roth = { id: 'roth_hsa', title: iraName + (hasHsa ? ' and HSA' : ''), target: r(R * 12), monthly: r(rothAlloc), months: 0, startMonth: t, endMonth: t, why: '', steps: [] };
    roth.why = (tax.rothAdvice === 'traditional' ? 'At your tax bracket (' + T.pct(tax.marginal) + '), a Traditional IRA/pre-tax account saves more tax today. ' : 'At your tax bracket (' + T.pct(tax.marginal) + '), paying tax now through a Roth is the better deal. ') +
      'IRAs have low fees and a wide choice of funds, and' + (hasHsa ? ' an HSA is the only account with a tax break going in, growing, and coming out for medical costs.' : ' the limit is ' + M(lim.ira) + ' per person for 2026.') +
      (goalFirst ? ' One of your goals is within 24 months, so goals are funded first and this gets the rest.' : ' This gets up to half of your free cash; goals get the rest.');
    if (Fe2 > 0) {
      roth.months = Math.max(0, horizonMonths - t); roth.endMonth = t + roth.months;
      roth.steps.push('Open a ' + iraName + ' for each of you at a low-cost broker (Fidelity, Vanguard or Schwab) and set up an automatic monthly deposit.');
      if (rothIRA > 0) roth.steps.push('Total to IRAs: ' + M(rothIRA) + ' a month' + (earnerIdx.length > 1 ? ' (' + M(rothIRA / earnerIdx.length) + ' each)' : '') + '. 2026 limit: ' + M(lim.ira) + ' per person per year.');
      if (hasHsa) roth.steps.push(hsa > 0 ? 'HSA: ' + M(hsa) + ' a month. 2026 limit: ' + M(hsaLimit) + ' (' + (n.married ? 'family' : 'single') + ' coverage). Invest the balance once it is above your plan minimum.' : 'HSA: nothing left after the IRA right now; add to it as free cash grows. 2026 limit: ' + M(hsaLimit) + '.');
    } else roth.steps.push('No free cash yet; this starts once the budget gap is closed.');

    // goals
    var scale = Gsum > 0 ? goalPay / Gsum : 1;
    var goalOut = needs.map(function (x) {
      var g = x.goal, monthly = x.required * scale;
      var feasible = Fe2 > 0 ? (goalPay >= Gsum - 0.5) : x.required <= 0.5;
      var note;
      var yieldTxt = T.pct(A.safeYield, 2) + ' safe yield';
      if (x.required <= 0.5) note = 'Cash needed ' + M(x.cash) + ' is already covered by what you have set aside.';
      else if (feasible) {
        note = 'Save ' + M(monthly) + ' a month from month ' + gStart + ' for ' + x.months + ' months in a savings account, money market or CD (' + yieldTxt + ') to reach ' + M(x.cash) + '.' +
          (g.type === 'house' ? ' That is ' + T.pct(g.downPct, 1) + ' down plus ' + T.pct(g.closingPct, 1) + ' closing on ' + M(g.targetPrice) + '.' : '');
        if (goalFirst && x.months <= 24) note += ' This goal is within 24 months, so it is funded before the Roth IRA.';
      } else {
        var delay = G.delayToFit(x.cash, x.months, monthly, A.safeYield, x.saved);
        var fitCash = G.cashFromMonthly(monthly, x.months, A.safeYield, x.saved);
        note = 'Needs ' + M(x.required) + ' a month but only ' + M(monthly) + ' fits in your free cash after the Roth/HSA share. ' +
          (x.late ? 'Your emergency fund and debt payoff finish after this goal date. ' : '') +
          'Tradeoff: ' + (delay != null && delay > 0 ? 'delay the goal by about ' + delay + ' months' : 'push the date back') +
          (g.type === 'house' && (g.downPct + g.closingPct) > 0 ? ', or lower the price to about ' + M(Math.floor(fitCash / (g.downPct + g.closingPct) / 1000) * 1000) : ', or lower the amount to about ' + M(Math.floor(fitCash / 100) * 100)) +
          (goalFirst ? '.' : ', or cut the Roth/HSA share (but retirement saving early is worth a lot).');
        warnings.push('Goal "' + x.name + '" cannot be fully funded on time: it needs ' + M(x.required) + ' a month and about ' + M(monthly) + ' fits.');
      }
      return {
        name: x.name, type: x.type, cashNeeded: r(x.cash), monthly: r(monthly), requiredMonthly: r(x.required),
        startMonth: gStart, months: x.months, targetMonth: x.totalMonths, feasible: feasible, note: note
      };
    });

    // PSLF
    var pslfPeople = people.filter(function (p) { return p.publicService; }).map(function (p) { return p.name; });
    var pslf = pslfPeople.length > 0 && n.debts.some(function (d) { return d.type === 'student_federal' && d.balance > 0; });

    // ---- contribution plan (feeds projection and account advice)
    var houseGoals = n.goals.filter(function (g) { return g.type === 'house'; });
    var houseYears = houseGoals.length ? Math.round(Math.max.apply(null, houseGoals.map(function (g) { return g.years || 0; }))) : 0;
    var persons = people.map(function (p, idx) {
      var accts = n.accounts.filter(function (a) { return a.owner === idx; });
      var pre = 0, mEff = 0, pen = 0, hasWork = false;
      accts.forEach(function (a) {
        if (isWork(a)) {
          hasWork = true;
          var matched = a.matchPct > 0 && a.matchUpToPct > 0, cur = a.contribPct || 0;
          pre += matched ? Math.max(cur, a.matchUpToPct) : cur;
          if (matched) mEff += a.matchPct * Math.min(Math.max(cur, a.matchUpToPct), a.matchUpToPct);
        }
        if (a.type === 'pension') pen += a.contribPct || 0;
      });
      var oopPct = p.salary > 0 ? Math.max(0, T.retireTargetPct - pen - mEff) : 0;
      var oop = oopPct * p.salary;
      var ira = Math.min(lim.ira, oop);
      var wp = oop - ira, excess = 0;
      if (hasWork && wp > lim.k401) { excess = wp - lim.k401; wp = lim.k401; }
      if (!hasWork) { excess = wp; wp = 0; }
      var roMonthly = p.salary > 0 && earnerIdx.length ? rothIRA / earnerIdx.length : 0;
      return {
        preEmpPct: pre, matchPctEff: mEff, pensionPct: pen, rothMonthly: roMonthly, rothStartMonth: roth.startMonth, afterOopPct: oopPct,
        detail: { hasWorkplace: hasWork, oopDollars: oop, iraAfter: ira, workplaceAfterDollars: wp, workplaceAfterPct: p.salary > 0 ? wp / p.salary : 0, excessDollars: excess }
      };
    });
    persons.forEach(function (pp, i) {
      if (pp.detail.excessDollars > 0.5) {
        warnings.push(people[i].name + (pp.detail.hasWorkplace ? ': reaching 15% would need more than the ' + M(lim.k401) + ' 2026 workplace-plan limit' : ': there is no workplace plan to hold the rest of the 15% target') +
          '. The plan caps accounts at their limits; the extra ' + M(pp.detail.excessDollars) + ' a year belongs in a taxable brokerage account.');
      }
    });

    // retire_15
    var preAnn = 0, afterAnn = 0, afterAnnPlus = 0;
    people.forEach(function (p, i) { preAnn += p.salary * persons[i].preEmpPct + persons[i].rothMonthly * 12; afterAnn += persons[i].afterOopPct * p.salary; });
    var r15 = { id: 'retire_15', title: 'Raise retirement saving to 15%', target: r(T.retireTargetPct * n.gross), monthly: r(Math.max(0, afterAnn - preAnn) / 12), months: 0, startMonth: houseYears > 0 ? houseYears * 12 : t, endMonth: 0, why: '', steps: [] };
    if (F <= 0) r15.monthly = 0;
    r15.months = Math.max(0, horizonMonths - r15.startMonth);
    r15.endMonth = r15.startMonth + r15.months;
    r15.why = 'Saving about 15% of gross pay (counting pension contributions and employer match) is the usual target for a comfortable retirement. ' +
      (houseYears > 0 ? 'It starts after your house goal (about year ' + houseYears + ') so the down payment is not delayed.' : 'It starts now since there is no house goal.');
    people.forEach(function (p, i) {
      var d = persons[i].detail;
      if (p.salary <= 0) return;
      var parts = [];
      if (persons[i].pensionPct > 0) parts.push('pension ' + T.pct(persons[i].pensionPct, 1));
      if (persons[i].matchPctEff > 0) parts.push('employer match ' + T.pct(persons[i].matchPctEff, 1));
      r15.steps.push(p.name + ': ' + (parts.length ? parts.join(' + ') + ' already counts, so ' : '') + 'you personally need ' + T.pct(persons[i].afterOopPct, 1) + ' of pay (' + M(d.oopDollars) + ' a year)' +
        (d.iraAfter > 0 ? ': ' + M(d.iraAfter) + ' to the IRA' : '') + (d.workplaceAfterDollars > 0 ? (d.iraAfter > 0 ? ', ' : ': ') + M(d.workplaceAfterDollars) + ' (' + T.pct(d.workplaceAfterPct, 1) + ') to the workplace plan' : '') + '.');
    });
    var affordable = Fe2 + preAnn / 12 >= afterAnn / 12 - 0.5;
    if (!affordable && F > 0) r15.steps.push('Heads up: this is more than your current free cash covers. Save as much as you can toward it and raise it with each pay raise.');
    r15.steps.push('Raise by 1 percentage point every time you get a raise until you reach the target.');

    // goals_taxable
    var gEndMax = goalOut.length ? Math.max.apply(null, goalOut.map(function (g) { return g.targetMonth; })) : 0;
    var gt = { id: 'goals_taxable', title: 'Goals and taxable investing', target: r(sum(goalOut, function (g) { return g.cashNeeded; })), monthly: r(goalPay + leftover), months: 0, startMonth: t, endMonth: t, why: '', steps: [] };
    gt.months = goalOut.length ? Math.max(0, gEndMax - t) : Math.max(0, horizonMonths - t);
    gt.endMonth = t + gt.months;
    gt.why = 'Money you need within about 5 years should not be in stocks, so goal funds go in savings, money market or CDs. Anything left after goals goes to a regular (taxable) brokerage account.';
    goalOut.forEach(function (g) { gt.steps.push(g.name + ': ' + M(g.monthly) + ' a month into a dedicated savings account' + (g.feasible ? '.' : ' (partial; see tradeoff).')); });
    if (leftover > 0.5) gt.steps.push('Left over: ' + M(leftover) + ' a month. Put it in a taxable index fund, or pay extra on debts under ' + T.pct(thr) + ' once your goals are covered.');
    if (!goalOut.length && !(leftover > 0.5)) gt.steps.push('No goals entered and no cash left over right now.');
    if (pslf) gt.steps.push('PSLF flag: ' + pslfPeople.join(' and ') + ' work(s) in public service with federal student loans. Do NOT rush those loans; use an income-driven plan, certify employment each year at studentaid.gov, and keep the minimum.');

    phases.push(starter, match, hd, ef, roth, r15, gt);
    if (F <= 0) {
      phases.forEach(function (ph) {
        if (ph.id !== 'match') { ph.monthly = 0; ph.months = 0; ph.endMonth = ph.startMonth; }
        if (!ph.skipped) ph.steps.unshift('Cut expenses first: free cash is ' + M(F) + ' a month, so there is nothing to allocate here yet. Find at least ' + M(1 - F) + ' a month in the budget (subscriptions, dining out, car and insurance shopping) or raise income.');
      });
    }

    return {
      freeCashMonthly: F, freeCashAfterDebtPayoff: r(Fe2), warnings: warnings, phases: phases,
      debt: sched, goals: goalOut,
      contribPlan: { houseYears: houseYears, persons: persons },
      derived: { matchRows: matchRows, rothIRA: rothIRA, hsa: hsa, rothAlloc: rothAlloc, goalFirst: goalFirst, goalPay: goalPay, leftover: leftover, horizonMonths: horizonMonths, matchTakeHomeHit: matchTakeHomeHit, pslf: pslf, pslfPeople: pslfPeople, earnerIdx: earnerIdx, hasHsa: hsaWant > 0, hsaLimit: hsaLimit, gStart: gStart, iraName: iraName, houseYears: houseYears }
    };
  }

  var api = { build: build };
  root.Planner = root.Planner || {};
  root.Planner.waterfall = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

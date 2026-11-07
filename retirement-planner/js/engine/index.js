/* buildPlan(inputs) -> plan. Assembles tax, waterfall, projection, allocation and advice lists. */
(function (root) {
  if (typeof require === 'function' && typeof module !== 'undefined') {
    require('./tables.js'); require('./debt.js'); require('./goals.js');
    require('./waterfall.js'); require('./projection.js'); require('./allocation.js');
  }
  var P = root.Planner;
  var LABEL = { '401k': '401(k)', '403b': '403(b)', '457b': '457(b)', tsp: 'TSP' };

  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }

  function normalize(inp, currentYear) {
    inp = inp || {};
    var h = inp.household || {};
    var people = (h.people || []).map(function (p, i) {
      p = p || {};
      return { name: p.name || ('Person ' + (i + 1)), age: num(p.age, 30), retireAge: num(p.retireAge, 65), salary: Math.max(0, num(p.salary, 0)), raisePct: num(p.raisePct, 0), publicService: !!p.publicService };
    });
    if (!people.length) people = [{ name: 'You', age: 30, retireAge: 65, salary: 0, raisePct: 0, publicService: false }];
    var gross = people.reduce(function (s, p) { return s + p.salary; }, 0);
    var a = inp.assumptions || {};
    var assumptions = {
      realReturn: num(a.realReturn, 0.05), safeYield: num(a.safeYield, 0.0357), withdrawalRate: num(a.withdrawalRate, 0.04),
      socialSecurityAtRetirement: num(a.socialSecurityAtRetirement, 0), waitYearsComparison: Math.max(0, Math.round(num(a.waitYearsComparison, 10))),
      payoffMethod: a.payoffMethod === 'snowball' ? 'snowball' : 'avalanche',
      extraMonthlyCash: (typeof a.extraMonthlyCash === 'number' && isFinite(a.extraMonthlyCash)) ? a.extraMonthlyCash : null
    };
    var c = inp.cash || {};
    return {
      currentYear: currentYear,
      earners: Math.round(num(h.earners, 0)) || people.filter(function (p) { return p.salary > 0; }).length || 1,
      married: !!h.married, state: h.state || 'TN', people: people, gross: gross, combinedIncome: gross,
      accounts: (inp.accounts || []).map(function (x) {
        var owner = Math.min(Math.max(0, Math.round(num(x.owner, 0))), people.length - 1);
        return {
          owner: owner, type: x.type, balance: Math.max(0, num(x.balance, 0)), contribPct: Math.max(0, num(x.contribPct, 0)),
          matchPct: Math.max(0, num(x.matchPct, 0)), matchUpToPct: Math.max(0, num(x.matchUpToPct, 0)), rothOption: !!x.rothOption,
          vestYears: x.vestYears == null ? null : num(x.vestYears, null), yearsWorked: x.yearsWorked == null ? null : num(x.yearsWorked, null),
          estIncomeAtRetirement: Math.max(0, num(x.estIncomeAtRetirement, 0))
        };
      }),
      cash: { checking: num(c.checking, 0), savings: num(c.savings, 0), monthlyExpenses: Math.max(0, num(c.monthlyExpenses, 0)), emergencyFund: Math.max(0, num(c.emergencyFund, 0)) },
      debts: (inp.debts || []).map(function (d, i) {
        return { name: d.name || ('Debt ' + (i + 1)), type: d.type || 'other', balance: Math.max(0, num(d.balance, 0)), apr: Math.max(0, num(d.apr, 0)), minPayment: Math.max(0, num(d.minPayment, 0)) };
      }),
      goals: (inp.goals || []).map(function (g) {
        return { type: g.type || 'other', name: g.name || g.type || 'Goal', targetPrice: num(g.targetPrice, 0), downPct: num(g.downPct, 0), closingPct: num(g.closingPct, 0), amount: num(g.amount, 0), years: Math.max(0, num(g.years, 0)), saved: Math.max(0, num(g.saved, 0)) };
      }),
      risk: inp.risk || { dropReaction: 'nervous_hold' },
      assumptions: assumptions
    };
  }

  function computeTax(n) {
    var T = P.tables, status = T.filingStatus(n.married);
    var pretax = n.people.map(function () { return 0; });
    n.accounts.forEach(function (a) {
      var p = n.people[a.owner];
      if (T.workplaceTypes.indexOf(a.type) >= 0 || a.type === 'pension') pretax[a.owner] += (a.contribPct || 0) * p.salary;
    });
    var units = n.married ? [{ gross: n.gross, pretax: pretax.reduce(function (s, x) { return s + x; }, 0) }] :
      n.people.map(function (p, i) { return { gross: p.salary, pretax: pretax[i] }; });
    var fed = 0, marginal = 0;
    units.forEach(function (u) {
      if (u.gross <= 0) return;
      var ti = T.taxableIncome(u.gross, u.pretax, status);
      fed += T.federalTax(ti, status);
      marginal = Math.max(marginal, T.marginalRate(ti, status));
    });
    if (!marginal) marginal = T.brackets[status][0][1];
    var sr = T.stateRate(n.state);
    var totalPre = pretax.reduce(function (s, x) { return s + x; }, 0);
    var state = sr * Math.max(0, n.gross - totalPre);
    var fica = T.fica * n.gross;
    var take = (n.gross - fed - state - fica - totalPre) / 12;
    var advice = T.rothAdvice(marginal);
    return { status: status, pretax: totalPre, federal: fed, state: state, fica: fica, takeHomeMonthly: take, marginal: marginal, stateRate: sr, rothAdvice: advice, rothRecommended: advice !== 'traditional' };
  }

  function acctLabel(a, tax) {
    var base = LABEL[a.type] || a.type;
    if (a.rothOption) return base + (tax.rothAdvice === 'traditional' ? ' (pre-tax; Roth option available)' : ' (Roth option)');
    return base;
  }

  function buildAccounts(n, wf, tax, warnings) {
    var T = P.tables, M = T.money, lim = T.limits.y2026, l27 = T.limits.y2027projected;
    var rows = [], persons = wf.contribPlan.persons, d = wf.derived, hy = d.houseYears;
    var when = hy > 0 ? 'after the house goal (about year ' + hy + ')' : 'now';
    function add(owner, account, action, limit, limit27, extra) {
      var o = { priority: 0, owner: owner, account: account, action: action, limit2026: limit, limit2027projected: limit27, limit2027Note: 'projected, not official' };
      if (extra) for (var k in extra) o[k] = extra[k];
      rows.push(o);
    }
    function isWork(a) { return T.workplaceTypes.indexOf(a.type) >= 0; }
    var done = {};
    n.people.forEach(function (p, i) {
      var accts = n.accounts.filter(function (a) { return a.owner === i && isWork(a); });
      var primary = accts.filter(function (a) { return a.matchPct > 0 && a.matchUpToPct > 0; })[0];
      if (!primary || !(p.salary > 0)) return;
      var pp = persons[i], after = pp.detail.workplaceAfterPct, pre = pp.preEmpPct;
      if (pre * p.salary > lim.k401) { warnings.push(p.name + ': current workplace contribution is above the ' + M(lim.k401) + ' 2026 limit. Lower it so you do not over-contribute.'); }
      var text = 'Contribute ' + T.pct(Math.max(primary.contribPct, primary.matchUpToPct), 1) + ' of pay now to capture the full match';
      if (after > pre + 0.0005) text += '; raise to ' + T.pct(after, 1) + ' ' + when;
      else text += ' (that is already about as high as the plan needs)';
      text += '.';
      add(p.name, acctLabel(primary, tax), text, lim.k401, l27.k401);
      done[accts.indexOf(primary) + '_' + i] = true;
    });
    n.people.forEach(function (p, i) {
      if (!(p.salary > 0)) return;
      var pp = persons[i], name = tax.rothAdvice === 'traditional' ? 'Traditional IRA' : 'Roth IRA';
      var monthly = Math.min(pp.rothMonthly, lim.ira / 12);
      var after = pp.detail.iraAfter;
      var act = (monthly > 0 ? 'Deposit ' + M(monthly) + ' a month starting about month ' + pp.rothStartMonth : 'Open it now; start deposits once free cash allows (after debt and emergency fund)') +
        (hy > 0 && after > monthly * 12 + 1 ? '; up to ' + M(after) + ' a year after the house goal' : '') + '. Never more than ' + M(lim.ira) + ' a year.';
      add(p.name, name, act, lim.ira, l27.ira);
    });
    if (d.hasHsa) {
      n.accounts.filter(function (a) { return a.type === 'hsa'; }).slice(0, 1).forEach(function (a) {
        add(n.people[a.owner].name, 'HSA', (d.hsa > 0 ? 'Deposit ' + M(d.hsa) + ' a month' : 'Add what you can once the IRA is funded') + '. You must have a high-deductible health plan to contribute. Limit ' + M(d.hsaLimit) + ' for 2026 (' + (n.married ? 'family' : 'single') + ').', d.hsaLimit, l27.hsaFamily);
      });
    }
    n.people.forEach(function (p, i) {
      var accts = n.accounts.filter(function (a) { return a.owner === i && isWork(a); });
      var primary = accts.filter(function (a) { return !(a.matchPct > 0 && a.matchUpToPct > 0); })[0];
      var hasMatched = accts.some(function (a) { return a.matchPct > 0 && a.matchUpToPct > 0; });
      if (!primary || hasMatched || !(p.salary > 0)) return;
      var pp = persons[i], after = pp.detail.workplaceAfterPct, pre = pp.preEmpPct;
      add(p.name, acctLabel(primary, tax), 'Now ' + T.pct(pre, 1) + (after > pre + 0.0005 ? '; raise to ' + T.pct(after, 1) + ' ' + when : '; keep it there') + '. Maximum ' + M(lim.k401) + ' a year.', lim.k401, l27.k401);
    });
    n.accounts.forEach(function (a) {
      if (a.type !== 'pension') return;
      var p = n.people[a.owner], txt = 'Automatic ' + T.pct(a.contribPct, 1) + ' payroll contribution; it counts toward your 15% but is not part of your invested balance.';
      if (a.vestYears != null && a.yearsWorked != null && a.yearsWorked < a.vestYears) {
        var left = Math.round((a.vestYears - a.yearsWorked) * 10) / 10;
        txt += ' Not vested for ' + left + ' more years; if you leave, roll the refund to an IRA.';
        warnings.push(p.name + "'s pension is not vested for " + left + ' more years. If you leave before then, roll any refund of your contributions into an IRA.');
      }
      add(p.name, 'Pension', txt, null, null);
    });
    rows.forEach(function (r, i) { r.priority = i + 1; });
    return rows;
  }

  function buildNinety(n, wf, tax) {
    var T = P.tables, M = T.money, items = [], d = wf.derived, F = wf.freeCashMonthly;
    function add(who, text, when) { items.push({ who: who, text: text, when: when }); }
    d.matchRows.forEach(function (m) {
      if (m.raise > 0) add(m.person.name, 'Set your ' + (LABEL[m.acct.type] || m.acct.type) + ' contribution to ' + T.pct(m.tgt, 1) + ' to capture the full match (now ' + T.pct(m.cur, 1) + ').', 'this_week');
    });
    n.accounts.forEach(function (a) {
      var p = n.people[a.owner];
      if (T.workplaceTypes.indexOf(a.type) >= 0 && !(a.matchPct > 0 && a.matchUpToPct > 0)) add(p.name, 'Ask HR whether your employer matches ' + (LABEL[a.type] || a.type) + ' contributions, and up to what percent.', 'this_week');
      if (a.type === 'pension') {
        var unk = [];
        if (!a.estIncomeAtRetirement) unk.push('your estimated yearly benefit at ' + p.retireAge);
        if (a.vestYears == null || a.vestYears === 0) unk.push('the vesting schedule');
        if (a.yearsWorked == null) unk.push('how many years of service you have');
        if (unk.length || a.vestYears != null) add(p.name, 'Ask HR about the pension: ' + (unk.length ? unk.join(', ') + ', ' : '') + 'whether contributions are refunded if you leave, early-retirement rules, and cost-of-living adjustments.', 'this_week');
      }
    });
    if (F <= 0) add('Household', 'Free cash is ' + M(F) + ' a month. Review the last 3 months of statements and find ' + M(1 - F) + ' a month to cut before anything else.', 'this_week');
    else add('Household', 'Track spending for 30 days against your ' + M(n.cash.monthlyExpenses) + ' monthly expenses so the free-cash number is real.', 'this_week');
    var live = n.debts.filter(function (d2) { return d2.balance > 0; });
    if (live.length) add('Household', 'List every debt with balance, rate and minimum (' + live.map(function (x) { return x.name + ' ' + M(x.balance) + ' at ' + T.pct(x.apr, 1); }).join('; ') + '). Turn on autopay for all minimums.', 'this_month');
    add('Household', 'Open a high-yield savings or money market account for the emergency fund' + (wf.phases[0].monthly > 0 ? ' and automate ' + M(wf.phases[0].monthly) + ' on each payday.' : '.'), 'this_month');
    add('Household', 'Name beneficiaries on every retirement account, HSA and bank account (and update them after life changes).', 'this_month');
    if (d.pslf) add(d.pslfPeople.join(' and '), 'PSLF: confirm your employer qualifies, enroll in an income-driven plan, and submit the employment certification at studentaid.gov.', 'this_month');
    var hd = wf.phases[2];
    if (!hd.skipped && hd.monthly > 0) add('Household', 'Send ' + M(hd.monthly) + ' a month extra to your target debt (' + (wf.debt.order[0] ? wf.debt.order[0].name : 'highest rate') + ') after the starter fund is built.', 'months_2_3');
    add('Household', 'Open a ' + d.iraName + (d.earnerIdx.length > 1 ? ' for each of you' : '') + ' at Fidelity, Vanguard or Schwab and pick the target-date fund (see Investments).', 'months_2_3');
    n.goals.forEach(function (g) { add('Household', 'Open a separate savings account named "' + g.name + '" so goal money stays apart from everyday cash.', 'months_2_3'); });
    add('Household', 'Check your next two pay stubs to confirm the payroll changes took effect and take-home matches the plan.', 'months_2_3');
    return items;
  }

  function buildProtection(n, wf) {
    var out = [];
    var hasHouse = n.goals.some(function (g) { return g.type === 'house'; });
    var hasKids = n.goals.some(function (g) { return g.type === 'kids'; });
    out.push({ item: 'Beneficiaries', text: 'Name beneficiaries (each other, if married) on every retirement account, HSA, bank account and life policy. Beneficiary forms override a will.' });
    out.push({ item: 'Disability insurance', text: 'Your paycheck is your biggest asset. Check whether your employer offers long-term disability; if not, price an individual policy covering about 60% of income.' });
    if ((n.married && hasHouse) || hasKids) out.push({ item: 'Term life insurance', text: 'With ' + (hasKids ? 'kids planned' : 'a spouse and a mortgage ahead') + ', buy a 20 to 30 year term policy worth roughly 10 times income for each person who earns. Avoid whole or universal life for now.' });
    out.push({ item: 'Wills and powers of attorney', text: 'Write a simple will, a financial power of attorney and a healthcare directive for each adult. Many states allow low-cost online forms.' });
    out.push({ item: 'Health plan comparison', text: 'At open enrollment compare total yearly cost (premiums plus deductible and out-of-pocket maximum) for each plan, not just the premium. A high-deductible plan unlocks an HSA.' });
    if (wf.derived.pslf) out.push({ item: 'PSLF (Public Service Loan Forgiveness)', text: wf.derived.pslfPeople.join(' and ') + ': federal student loans may be forgiven after 120 qualifying payments while working for a government or qualifying nonprofit employer. Keep the minimum, stay on an eligible plan and certify employment every year.' });
    return out;
  }

  function buildVerify(n, wf, tax) {
    var T = P.tables, M = T.money, v = [];
    n.accounts.forEach(function (a) {
      var p = n.people[a.owner];
      if (T.workplaceTypes.indexOf(a.type) >= 0 && !(a.matchPct > 0 && a.matchUpToPct > 0)) v.push(p.name + ': employer match is unknown or zero. Confirm with HR; a match would change the plan.');
      if (a.type === 'pension') {
        if (!a.estIncomeAtRetirement) v.push(p.name + ': pension income estimate is blank, so the plan counts $0 from it. Ask HR for a benefit estimate.');
        if (a.vestYears == null || a.vestYears === 0) v.push(p.name + ': pension vesting years not entered. Ask HR how many years until you are vested.');
        if (a.yearsWorked == null) v.push(p.name + ': years worked toward the pension not entered.');
      }
      if (a.type === 'hsa') v.push('HSA contributions require a qualifying high-deductible health plan. Confirm yours qualifies.');
    });
    if (!(n.assumptions.socialSecurityAtRetirement > 0)) v.push('Social Security estimate is $0. Get your estimate at ssa.gov/myaccount and enter it (household total, in today\'s dollars).');
    else v.push('Social Security: the plan uses ' + M(n.assumptions.socialSecurityAtRetirement) + ' a year. Check each person\'s estimate at ssa.gov/myaccount.');
    if (!(n.cash.monthlyExpenses > 0)) v.push('Monthly expenses are $0, so free cash and the emergency fund target are not meaningful. Enter your real spending.');
    n.debts.forEach(function (d) {
      if (d.balance > 0 && !(d.apr > 0)) v.push(d.name + ': APR is 0 or blank. Confirm the interest rate.');
      if (d.balance > 0 && !(d.minPayment > 0)) v.push(d.name + ': minimum payment is 0 or blank. Confirm it.');
    });
    v.push('Tax figures are estimates: 2026 federal brackets, a flat average state rate for ' + n.state + ' (' + T.pct(tax.stateRate, 1) + '), and 7.65% FICA. Your real paycheck will differ.');
    v.push('2027 contribution limits shown are projections, not official.');
    return v;
  }

  function buildPlan(inputs, opts) {
    var P2 = root.Planner;
    var year = (opts && opts.currentYear) || (inputs && inputs.currentYear) || new Date().getFullYear();
    var n = normalize(inputs, year);
    var T = P2.tables;
    var tax = computeTax(n);
    var wf = P2.waterfall.build(n, tax);
    var proj = P2.projection.build(n, wf.contribPlan);
    var warnings = wf.warnings.slice();
    var accounts = buildAccounts(n, wf, tax, warnings);
    if (proj.replacementPct < 0.70) warnings.push('Projected retirement income replaces only ' + T.pct(proj.replacementPct, 0) + ' of today\'s income (target 70% or more). Consider saving more, retiring later, or planning for a lower cost of living.');
    var retireYears = n.people.reduce(function (s, p) { return s + (p.retireAge - p.age); }, 0) / n.people.length;
    var alloc = P2.allocation.build({ dropReaction: (n.risk && n.risk.dropReaction) || 'nervous_hold', currentYear: year, yearsToRetire: retireYears, hasPension: n.accounts.some(function (a) { return a.type === 'pension'; }) });
    var verify = buildVerify(n, wf, tax);
    var sched = wf.debt;
    var debt = {
      method: sched.method,
      order: sched.order.map(function (o) { var x = { name: o.name, months: o.months, interest: o.interest, payment: o.payment }; if (o.flag) x.flag = o.flag; if (o.detail) x.detail = o.detail; return x; }),
      totalInterest: sched.totalInterest, debtFreeMonth: sched.debtFreeMonth,
      snowballAlt: sched.snowballAlt, alt: sched.alt
    };
    return {
      summary: {
        combinedIncome: Math.round(n.gross), filingStatus: tax.status, marginalFederal: tax.marginal, stateRate: tax.stateRate,
        federalTaxAnnual: Math.round(tax.federal), stateTaxAnnual: Math.round(tax.state),
        takeHomeMonthly: Math.round(tax.takeHomeMonthly), freeCashMonthly: Math.round(wf.freeCashMonthly),
        rothRecommended: tax.rothRecommended, rothAdvice: tax.rothAdvice, pslf: wf.derived.pslf,
        warnings: warnings, verify: verify
      },
      ninetyDays: buildNinety(n, wf, tax),
      phases: wf.phases,
      debt: debt,
      goals: wf.goals,
      accounts: accounts,
      allocation: alloc,
      projection: proj,
      protection: buildProtection(n, wf),
      limits: { updated: T.updated, source: T.source, y2026: T.limits.y2026, y2027projected: T.limits.y2027projected }
    };
  }

  var api = { buildPlan: buildPlan, normalize: normalize, computeTax: computeTax };
  root.Planner = root.Planner || {};
  root.Planner.buildPlan = buildPlan;
  root.Planner.index = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

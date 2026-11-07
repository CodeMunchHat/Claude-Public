/* Multi-step questionnaire. Builds the CONTRACT.md inputs object (version 1). */
(function () {
  'use strict';

  var EXAMPLE = {"version":1,"household":{"earners":2,"married":true,"state":"TN","people":[{"name":"Cheltsey","age":28,"retireAge":65,"salary":42500,"raisePct":0,"publicService":true},{"name":"Drew","age":28,"retireAge":65,"salary":42500,"raisePct":0,"publicService":false}]},"accounts":[{"owner":0,"type":"pension","balance":0,"contribPct":0.06,"vestYears":5,"yearsWorked":1.5,"estIncomeAtRetirement":20000},{"owner":1,"type":"401k","balance":0,"contribPct":0,"matchPct":1,"matchUpToPct":0.03,"rothOption":true}],"cash":{"checking":1500,"savings":500,"monthlyExpenses":4500,"emergencyFund":0},"debts":[{"name":"Visa","type":"credit_card","balance":5000,"apr":0.22,"minPayment":150},{"name":"Car","type":"auto","balance":12000,"apr":0.065,"minPayment":300}],"goals":[{"type":"house","name":"First home","targetPrice":300000,"downPct":0.05,"closingPct":0.03,"years":5,"saved":0},{"type":"other","name":"Grad school","amount":10000,"years":3,"saved":0}],"risk":{"dropReaction":"hold_or_buy","horizonComfort":"long","experience":"none"},"assumptions":{"realReturn":0.05,"safeYield":0.0357,"withdrawalRate":0.04,"socialSecurityAtRetirement":35000,"waitYearsComparison":10,"payoffMethod":"avalanche","extraMonthlyCash":null}};

  var STATES = [['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  var ACCT_TYPES = [['401k','401(k)'],['403b','403(b)'],['457b','457(b)'],['tsp','TSP (federal Thrift Savings Plan)'],['pension','Pension'],['trad_ira','Traditional IRA'],['roth_ira','Roth IRA'],['hsa','HSA (Health Savings Account)'],['taxable','Taxable brokerage account']];
  var MATCH_TYPES = ['401k', '403b', '457b', 'tsp'];
  var DEBT_TYPES = [['credit_card','Credit card'],['auto','Car loan'],['student_federal','Student loan (federal)'],['student_private','Student loan (private)'],['personal','Personal loan'],['mortgage','Mortgage'],['other','Other']];
  var GOAL_TYPES = [['house','Buy a house'],['kids','Kids'],['grad_school','Grad school'],['other','Other']];
  var GOAL_NAMES = { house: 'First home', kids: 'Kids', grad_school: 'Grad school', other: 'Other goal' };
  var STEPS = ['Household', 'Retirement accounts', 'Cash', 'Debts', 'Goals', 'Risk', 'Assumptions and review'];

  var TIP = {
    k401: '401(k): a retirement savings account offered by a private employer. Money goes in from your paycheck before or after tax, and grows until you retire.',
    k403: '403(b): like a 401(k), but offered by schools, hospitals and nonprofits.',
    k457: '457(b): like a 401(k), offered by state and local governments. Often has no early-withdrawal penalty.',
    tsp: 'TSP (Thrift Savings Plan): the 401(k)-style plan for federal employees and the military.',
    pension: 'Pension: a paycheck your employer promises to pay you each year in retirement, usually based on pay and years worked.',
    ira: 'IRA (Individual Retirement Account): a retirement account you open yourself at a brokerage, separate from any employer.',
    roth: 'Roth: you pay tax on the money now, and it then grows and comes out tax-free in retirement. Traditional is the opposite: a tax break now, tax later.',
    hsa: 'HSA (Health Savings Account): a tax-advantaged account for medical costs, available with a high-deductible health plan. Unused money rolls over and can be invested.',
    taxable: 'Taxable brokerage account: a regular investment account with no special tax break and no withdrawal limits.',
    match: 'Employer match: free money your employer adds when you contribute. "100% up to 3%" means they add $1 for every $1 you put in, until the total is 3% of your pay.',
    matchUpTo: 'The most of your pay your employer will match. If it says "up to 3%", contributing more than 3% earns no extra match.',
    roth401: 'Roth option: your plan lets you choose Roth (taxed now, tax-free later) contributions instead of traditional ones. Check your benefits page if unsure.',
    vesting: 'Vesting: how many years you must work before the employer\'s contributions or pension are truly yours. Leave early and you may lose them.',
    yearsWorked: 'Years of service counted toward your pension so far. Partial years are fine, like 1.5.',
    estPension: 'Your estimated yearly pension at retirement, in today\'s dollars. Your HR office or pension statement usually shows this.',
    apr: 'APR (annual percentage rate): the yearly interest rate you pay on a debt. Credit cards are often 20% or more.',
    minPay: 'The smallest monthly payment the lender requires.',
    raise: 'Expected raises above inflation: how much your pay is likely to grow each year beyond rising prices. If you are unsure, use 0. All dollar amounts in the plan are in today\'s dollars.',
    publicService: 'Public service: you work for a government, school, or qualifying nonprofit. This may make you eligible for Public Service Loan Forgiveness (PSLF) and for 403(b) or 457(b) plans.',
    retireAge: 'The age you would like to stop working full time.',
    efund: 'Emergency fund: cash set aside for surprises like a job loss or car repair, usually 3 to 6 months of expenses. Count only money you have already set aside for this.',
    expenses: 'Everything you spend in a typical month: rent or mortgage, food, bills, fun, and debt minimum payments.',
    savingsAccts: 'Checking and savings: money in bank accounts you can spend right away. Do not include retirement accounts.',
    saved: 'How much you have already set aside for this goal.',
    down: 'Down payment: the part of the price you pay up front. The rest is the mortgage.',
    closing: 'Closing costs: fees paid when you buy a house, usually 2% to 5% of the price.',
    realReturn: 'Real return: the yearly growth of your investments after subtracting inflation. 5% is a common, reasonably cautious assumption for a stock-heavy mix.',
    safeYield: 'Safe savings yield: the interest rate you earn on safe money like a high-yield savings account or Treasury bills. Used for short-term goals.',
    withdrawal: 'Withdrawal rate: the share of your nest egg you spend each year in retirement. 4% is a common rule of thumb for money to last 30 years.',
    ss: 'Social Security: monthly income from the government in retirement. Enter your yearly estimate in today\'s dollars from your ssa.gov account.',
    wait: 'Cost of waiting: we compare starting now with starting this many years later, to show how much time matters.',
    payoff: 'Avalanche pays the highest interest rate first (saves the most money). Snowball pays the smallest balance first (quick wins).',
    extra: 'Free cash: money left each month after taxes, expenses and minimum debt payments. Leave blank and we estimate it; type a number to override.',
    drop: 'Markets sometimes fall 20% or more. How you would react helps us choose a mix of stocks (growth, bumpy) and bonds (steadier, slower).',
    horizon: 'How long you can leave invested money alone before you need it. Longer lets you take more stock risk.',
    exp: 'Past experience with investing helps us decide how much to explain and how bold a mix to suggest.'
  };

  var S, root, cur = 0, opts = {}, shown = {}, built = false;

  /* ---------- state ---------- */
  function newPerson() { return { name: '', age: null, retireAge: 65, salary: null, raisePct: 0, publicService: false }; }
  function newAcct() { return { owner: 0, type: '401k', balance: 0, contribPct: 0, matchPct: 0, matchUpToPct: 0, rothOption: false, vestYears: 0, yearsWorked: 0, estIncomeAtRetirement: 0 }; }
  function newDebt() { return { name: '', type: 'credit_card', balance: null, apr: null, minPayment: null }; }
  function newGoal(t) { return { type: t || 'house', name: GOAL_NAMES[t || 'house'], targetPrice: null, downPct: 0.05, closingPct: 0.03, amount: null, years: null, saved: 0 }; }
  function defaults() {
    return {
      version: 1,
      household: { earners: 1, married: false, state: 'TN', people: [newPerson(), newPerson()] },
      accounts: [],
      cash: { checking: null, savings: null, monthlyExpenses: null, emergencyFund: 0 },
      debts: [], goals: [],
      risk: { dropReaction: null, horizonComfort: null, experience: null },
      assumptions: { realReturn: 0.05, safeYield: 0.0357, withdrawalRate: 0.04, socialSecurityAtRetirement: null, waitYearsComparison: 10, payoffMethod: 'avalanche', extraMonthlyCash: null }
    };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pathParts(p) { return p.split('.'); }
  function get(p) { var o = S, a = pathParts(p); for (var i = 0; i < a.length; i++) { if (o == null) return undefined; o = o[a[i]]; } return o; }
  function set(p, v) { var o = S, a = pathParts(p); for (var i = 0; i < a.length - 1; i++) o = o[a[i]]; o[a[a.length - 1]] = v; }
  function idOf(p) { return 'f-' + p.replace(/\./g, '-'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pname(i) { return (S.household.people[i].name || '').trim() || ('Person ' + (i + 1)); }
  function r6(n) { return Math.round(n * 1e8) / 1e8; }
  function money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

  /* ---------- getInputs / setInputs ---------- */
  function getInputs() {
    var h = S.household, E = h.earners === 2 ? 2 : 1, out = { version: 1 };
    out.household = { earners: E, married: !!h.married, state: h.state, people: [] };
    for (var i = 0; i < E; i++) {
      var p = h.people[i];
      out.household.people.push({ name: (p.name || '').trim() || ('Person ' + (i + 1)), age: p.age, retireAge: p.retireAge, salary: p.salary, raisePct: p.raisePct, publicService: !!p.publicService });
    }
    out.accounts = S.accounts.map(function (a) {
      var o = { owner: Math.min(a.owner, E - 1), type: a.type, balance: a.balance, contribPct: a.contribPct };
      if (MATCH_TYPES.indexOf(a.type) >= 0) { o.matchPct = a.matchPct; o.matchUpToPct = a.matchUpToPct; o.rothOption = !!a.rothOption; }
      if (a.type === 'pension') { o.vestYears = a.vestYears; o.yearsWorked = a.yearsWorked; o.estIncomeAtRetirement = a.estIncomeAtRetirement; }
      return o;
    });
    out.cash = clone(S.cash);
    out.debts = S.debts.map(function (d) { return { name: (d.name || '').trim(), type: d.type, balance: d.balance, apr: d.apr, minPayment: d.minPayment }; });
    out.goals = S.goals.map(function (g) {
      if (g.type === 'house') return { type: 'house', name: (g.name || '').trim(), targetPrice: g.targetPrice, downPct: g.downPct, closingPct: g.closingPct, years: g.years, saved: g.saved };
      return { type: g.type, name: (g.name || '').trim(), amount: g.amount, years: g.years, saved: g.saved };
    });
    out.risk = clone(S.risk);
    out.assumptions = clone(S.assumptions);
    return out;
  }

  function setInputs(inp) {
    var d = defaults(), h = inp.household || {};
    d.household.earners = h.earners === 2 ? 2 : 1;
    d.household.married = !!h.married;
    d.household.state = h.state || 'TN';
    (h.people || []).slice(0, 2).forEach(function (p, i) { d.household.people[i] = Object.assign(newPerson(), p); });
    d.accounts = (inp.accounts || []).map(function (a) { return Object.assign(newAcct(), a); });
    d.cash = Object.assign(d.cash, inp.cash || {});
    d.debts = (inp.debts || []).map(function (a) { return Object.assign(newDebt(), a); });
    d.goals = (inp.goals || []).map(function (g) { return Object.assign(newGoal(g.type), g); });
    d.risk = Object.assign(d.risk, inp.risk || {});
    d.assumptions = Object.assign(d.assumptions, inp.assumptions || {});
    if (d.assumptions.extraMonthlyCash === undefined) d.assumptions.extraMonthlyCash = null;
    S = d;
    shown = {};
    if (built) { renderAll(); showStep(cur, true); }
  }

  /* ---------- field builders ---------- */
  function tipBtn(id, label, text) {
    return '<button type="button" class="tip" data-tip="' + id + '-tip" aria-expanded="false" aria-label="What is ' + esc(label) + '?" title="' + esc(text) + '">?</button>';
  }
  function tipBox(id, text) { return text ? '<p class="tiptext" id="' + id + '-tip" hidden>' + esc(text) + '</p>' : ''; }

  function optionsHtml(list, val, blank) {
    var h = blank ? '<option value="">Choose...</option>' : '';
    list.forEach(function (o) { h += '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; });
    return h;
  }

  function fld(path, label, o) {
    var id = idOf(path), v = get(path), kind = o.kind || 'num', a = '', ctl;
    var desc = id + '-err' + (o.tip ? ' ' + id + '-tip' : '') + (o.hint ? ' ' + id + '-hint' : '');
    a += ' id="' + id + '" data-bind="' + path + '" data-kind="' + kind + '" aria-describedby="' + desc + '"';
    if (o.req) a += ' data-req="1" required';
    if (o.min != null) a += ' data-min="' + o.min + '"';
    if (o.max != null) a += ' data-max="' + o.max + '"';
    if (o.struct) a += ' data-struct="' + o.struct + '"';
    if (o.numeric) a += ' data-num="1"';
    if (kind === 'check') {
      return '<div class="field check"><label class="checkrow"><input type="checkbox"' + a + (v ? ' checked' : '') + '><span>' + esc(label) + '</span></label>' +
        (o.tip ? tipBtn(id, label, o.tip) : '') + tipBox(id, o.tip) + '<p class="err" id="' + id + '-err" role="alert"></p></div>';
    }
    if (kind === 'select') {
      ctl = '<select' + a + '>' + optionsHtml(o.opts, v, !o.noBlank) + '</select>';
    } else if (kind === 'text') {
      ctl = '<input type="text"' + a + ' value="' + esc(v) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' autocomplete="off">';
    } else {
      var dv = v == null || v === '' ? '' : (kind === 'pct' ? r6(v * 100) : v);
      var inp = '<input type="number" inputmode="decimal" step="any"' + a + ' value="' + esc(dv) + '">';
      ctl = (kind === 'money' || kind === 'pct') ? '<div class="inp ' + kind + '">' + (kind === 'money' ? '<span class="aff" aria-hidden="true">$</span>' : '') + inp + (kind === 'pct' ? '<span class="aff" aria-hidden="true">%</span>' : '') + '</div>' : inp;
    }
    return '<div class="field"><div class="lbl"><label for="' + id + '">' + esc(label) + (o.req ? '' : ' <span class="opt">(optional)</span>') + '</label>' + (o.tip ? tipBtn(id, label, o.tip) : '') + '</div>' +
      tipBox(id, o.tip) + (o.hint ? '<p class="hint" id="' + id + '-hint">' + o.hint + '</p>' : '') + ctl + '<p class="err" id="' + id + '-err" role="alert"></p></div>';
  }
  function req(o) { o.req = true; return o; }

  function radioGroup(path, legend, tip, list) {
    var id = idOf(path), v = get(path), h = '<fieldset class="field radiogroup"><legend>' + esc(legend) + '</legend>';
    h += '<div class="lbl">' + tipBtn(id, legend, tip) + '<span class="tipnote">What does this mean?</span></div>' + tipBox(id, tip) + '<div class="opts">';
    list.forEach(function (o) {
      h += '<label class="radio"><input type="radio" name="' + id + '" id="' + id + '-' + o[0] + '" data-bind="' + path + '" data-kind="radio" data-req="1" value="' + o[0] + '"' + (v === o[0] ? ' checked' : '') + ' aria-describedby="' + id + '-err"><span>' + esc(o[1]) + '</span></label>';
    });
    return h + '</div><p class="err" id="' + id + '-err" role="alert"></p></fieldset>';
  }

  /* ---------- step renderers ---------- */
  function stepHousehold() {
    var h = '<p class="lead">Tell us about your household. One or two earners.</p><div class="grid">';
    h += fld('household.earners', 'Number of earners', { kind: 'select', opts: [[1, 'Just me (1 earner)'], [2, 'Two earners']], noBlank: true, struct: 1, numeric: 1, req: 1 });
    h += fld('household.state', 'State you live in', req({ kind: 'select', opts: STATES, tip: 'Your state decides state income tax. Tennessee and several other states have none on wages.' }));
    h += '</div>' + fld('household.married', 'We are married (file taxes jointly)', { kind: 'check', tip: 'Married couples usually file taxes together, which changes tax brackets and some contribution limits.' });
    for (var i = 0; i < S.household.earners; i++) {
      var b = 'household.people.' + i + '.';
      h += '<fieldset class="card"><legend>' + esc(pname(i)) + '</legend><div class="grid">';
      h += fld(b + 'name', 'Name', { kind: 'text', ph: 'Person ' + (i + 1) });
      h += fld(b + 'age', 'Current age', req({ kind: 'num', min: 16, max: 100 }));
      h += fld(b + 'retireAge', 'Planned retirement age', req({ kind: 'num', min: 30, max: 100, tip: TIP.retireAge }));
      h += fld(b + 'salary', 'Yearly salary before tax', req({ kind: 'money', min: 0, max: 5000000 }));
      h += fld(b + 'raisePct', 'Expected raises above inflation, per year', req({ kind: 'pct', min: -10, max: 20, tip: TIP.raise }));
      h += '</div>' + fld(b + 'publicService', 'Works in public service (government, school, nonprofit)', { kind: 'check', tip: TIP.publicService }) + '</fieldset>';
    }
    return h;
  }

  function typeTip(t) {
    return { '401k': TIP.k401, '403b': TIP.k403, '457b': TIP.k457, tsp: TIP.tsp, pension: TIP.pension, trad_ira: TIP.ira, roth_ira: TIP.roth, hsa: TIP.hsa, taxable: TIP.taxable }[t];
  }
  function stepAccounts() {
    var E = S.household.earners, h = '<p class="lead">Add each retirement or investment account you have, or plan to use. Start with a balance of 0 if you have not opened it yet. You can skip this screen if you have none.</p>';
    S.accounts.forEach(function (a, i) {
      var b = 'accounts.' + i + '.';
      h += '<fieldset class="card"><legend>Account ' + (i + 1) + '</legend><div class="grid">';
      if (E === 2) h += fld(b + 'owner', 'Whose account', { kind: 'select', opts: [[0, pname(0)], [1, pname(1)]], noBlank: true, numeric: 1, req: 1 });
      h += fld(b + 'type', 'Account type', { kind: 'select', opts: ACCT_TYPES, noBlank: true, struct: 1, req: 1, tip: typeTip(a.type) });
      h += fld(b + 'balance', 'Current balance', req({ kind: 'money', min: 0 }));
      h += fld(b + 'contribPct', a.type === 'pension' ? 'Your pension contribution (% of pay)' : 'Your contribution (% of pay)', req({ kind: 'pct', min: 0, max: 100, tip: 'The share of each paycheck you put in. Enter 0 if you are not contributing yet.' }));
      if (MATCH_TYPES.indexOf(a.type) >= 0) {
        h += fld(b + 'matchPct', 'Employer match (% of what you put in)', req({ kind: 'pct', min: 0, max: 300, tip: TIP.match }));
        h += fld(b + 'matchUpToPct', 'Match applies up to (% of pay)', req({ kind: 'pct', min: 0, max: 100, tip: TIP.matchUpTo }));
      }
      if (a.type === 'pension') {
        h += fld(b + 'vestYears', 'Years until vested', req({ kind: 'num', min: 0, max: 40, tip: TIP.vesting }));
        h += fld(b + 'yearsWorked', 'Years worked so far', req({ kind: 'num', min: 0, max: 60, tip: TIP.yearsWorked }));
        h += fld(b + 'estIncomeAtRetirement', 'Estimated yearly pension at retirement', req({ kind: 'money', min: 0, tip: TIP.estPension }));
      }
      h += '</div>';
      if (MATCH_TYPES.indexOf(a.type) >= 0) h += fld(b + 'rothOption', 'My plan offers a Roth option', { kind: 'check', tip: TIP.roth401 });
      h += '<button type="button" class="btn link danger" data-action="rm-account" data-i="' + i + '">Remove account ' + (i + 1) + '</button></fieldset>';
    });
    return h + '<button type="button" class="btn secondary" data-action="add-account">+ Add an account</button>';
  }

  function stepCash() {
    return '<p class="lead">Cash you have right now, and what you spend.</p><div class="grid">' +
      fld('cash.checking', 'Checking balance', req({ kind: 'money', min: 0, tip: TIP.savingsAccts })) +
      fld('cash.savings', 'Savings balance', req({ kind: 'money', min: 0, tip: TIP.savingsAccts })) +
      fld('cash.monthlyExpenses', 'Monthly expenses (whole household)', req({ kind: 'money', min: 0, tip: TIP.expenses })) +
      fld('cash.emergencyFund', 'Already set aside as an emergency fund', req({ kind: 'money', min: 0, tip: TIP.efund })) + '</div>';
  }

  function stepDebts() {
    var h = '<p class="lead">List each debt. Skip this screen if you have none.</p>';
    S.debts.forEach(function (d, i) {
      var b = 'debts.' + i + '.';
      h += '<fieldset class="card"><legend>Debt ' + (i + 1) + '</legend><div class="grid">' +
        fld(b + 'name', 'Name', req({ kind: 'text', ph: 'Visa, car, student loan' })) +
        fld(b + 'type', 'Type', req({ kind: 'select', opts: DEBT_TYPES, noBlank: true })) +
        fld(b + 'balance', 'Balance owed', req({ kind: 'money', min: 0 })) +
        fld(b + 'apr', 'Interest rate (APR)', req({ kind: 'pct', min: 0, max: 100, tip: TIP.apr })) +
        fld(b + 'minPayment', 'Minimum monthly payment', req({ kind: 'money', min: 0, tip: TIP.minPay })) +
        '</div><button type="button" class="btn link danger" data-action="rm-debt" data-i="' + i + '">Remove debt ' + (i + 1) + '</button></fieldset>';
    });
    return h + '<button type="button" class="btn secondary" data-action="add-debt">+ Add a debt</button>';
  }

  function stepGoals() {
    var h = '<p class="lead">Big things you want to pay for besides retirement. Skip this screen if none.</p>';
    S.goals.forEach(function (g, i) {
      var b = 'goals.' + i + '.';
      h += '<fieldset class="card"><legend>Goal ' + (i + 1) + '</legend><div class="grid">' +
        fld(b + 'type', 'Goal type', req({ kind: 'select', opts: GOAL_TYPES, noBlank: true, struct: 1 })) +
        fld(b + 'name', 'Name', req({ kind: 'text' }));
      if (g.type === 'house') {
        h += fld(b + 'targetPrice', 'Target house price', req({ kind: 'money', min: 1 })) +
          fld(b + 'downPct', 'Down payment (% of price)', req({ kind: 'pct', min: 0, max: 100, tip: TIP.down })) +
          fld(b + 'closingPct', 'Closing costs (% of price)', req({ kind: 'pct', min: 0, max: 20, tip: TIP.closing }));
      } else {
        h += fld(b + 'amount', 'Amount needed', req({ kind: 'money', min: 1 }));
      }
      h += fld(b + 'years', 'Years until you need it', req({ kind: 'num', min: 0.5, max: 60 })) +
        fld(b + 'saved', 'Already saved for it', req({ kind: 'money', min: 0, tip: TIP.saved })) +
        '</div><button type="button" class="btn link danger" data-action="rm-goal" data-i="' + i + '">Remove goal ' + (i + 1) + '</button></fieldset>';
    });
    return h + '<button type="button" class="btn secondary" data-action="add-goal">+ Add a goal</button>';
  }

  function stepRisk() {
    return '<p class="lead">Three quick questions about comfort with risk. There are no wrong answers.</p>' +
      radioGroup('risk.dropReaction', 'If your investments dropped 20% in a few months, what would you do?', TIP.drop, [['hold_or_buy', 'Hold on, or buy more while prices are low'], ['nervous_hold', 'Feel nervous, but hold on'], ['sell', 'Sell some or all to stop the losses']]) +
      radioGroup('risk.horizonComfort', 'How long could you leave this money invested without touching it?', TIP.horizon, [['short', 'Less than 5 years'], ['medium', '5 to 15 years'], ['long', 'More than 15 years']]) +
      radioGroup('risk.experience', 'How much investing experience do you have?', TIP.exp, [['none', 'None. This is new to me'], ['some', 'Some. I have owned funds or stocks'], ['lots', 'A lot. I invest regularly']]);
  }

  function stepAssumptions() {
    return '<p class="lead">Defaults are sensible for most people. Change them only if you have a reason.</p><div class="grid">' +
      fld('assumptions.realReturn', 'Expected investment return after inflation (real return)', req({ kind: 'pct', min: -2, max: 15, tip: TIP.realReturn })) +
      fld('assumptions.safeYield', 'Safe savings yield', req({ kind: 'pct', min: 0, max: 15, tip: TIP.safeYield })) +
      fld('assumptions.withdrawalRate', 'Retirement withdrawal rate', req({ kind: 'pct', min: 1, max: 10, tip: TIP.withdrawal })) +
      fld('assumptions.socialSecurityAtRetirement', 'Social Security estimate at retirement (per year)', req({ kind: 'money', min: 0, tip: TIP.ss, hint: 'Get your estimate at <a href="https://www.ssa.gov/myaccount" target="_blank" rel="noopener">ssa.gov/myaccount</a>. Pensions are entered on the Retirement accounts screen.' })) +
      fld('assumptions.waitYearsComparison', 'Cost-of-waiting comparison (years)', req({ kind: 'num', min: 0, max: 40, tip: TIP.wait })) +
      fld('assumptions.payoffMethod', 'Debt payoff method', req({ kind: 'select', opts: [['avalanche', 'Avalanche (highest rate first)'], ['snowball', 'Snowball (smallest balance first)']], noBlank: true, tip: TIP.payoff })) +
      fld('assumptions.extraMonthlyCash', 'Monthly free cash override', { kind: 'money', min: 0, tip: TIP.extra, hint: 'Leave blank to let the planner estimate it.' }) +
      '</div><h3>Review</h3><div id="review" class="review" aria-live="polite"></div>';
  }

  var RENDER = [stepHousehold, stepAccounts, stepCash, stepDebts, stepGoals, stepRisk, stepAssumptions];

  function reviewHtml() {
    var i = getInputs(), h = '<dl>', hh = i.household;
    h += '<dt>Household</dt><dd>' + hh.earners + ' earner' + (hh.earners > 1 ? 's' : '') + (hh.married ? ', married' : '') + ', ' + esc(hh.state) + '. ' +
      hh.people.map(function (p) { return esc(p.name) + ' (age ' + (p.age == null ? '?' : p.age) + ', retire at ' + (p.retireAge == null ? '?' : p.retireAge) + ', ' + money(p.salary) + ')'; }).join('; ') + '</dd>';
    h += '<dt>Retirement accounts</dt><dd>' + (i.accounts.length ? i.accounts.map(function (a) { return esc(a.type) + ' ' + money(a.balance); }).join(', ') : 'None') + '</dd>';
    h += '<dt>Cash</dt><dd>Checking ' + money(i.cash.checking) + ', savings ' + money(i.cash.savings) + ', spending ' + money(i.cash.monthlyExpenses) + '/month, emergency fund ' + money(i.cash.emergencyFund) + '</dd>';
    var td = i.debts.reduce(function (s, d) { return s + (d.balance || 0); }, 0);
    h += '<dt>Debts</dt><dd>' + (i.debts.length ? i.debts.length + ' totaling ' + money(td) : 'None') + '</dd>';
    h += '<dt>Goals</dt><dd>' + (i.goals.length ? i.goals.map(function (g) { return esc(g.name); }).join(', ') : 'None') + '</dd>';
    h += '<dt>Risk</dt><dd>' + [i.risk.dropReaction, i.risk.horizonComfort, i.risk.experience].map(function (x) { return x ? esc(x.replace(/_/g, ' ')) : 'not answered'; }).join(' / ') + '</dd>';
    h += '<dt>Assumptions</dt><dd>Real return ' + r6(i.assumptions.realReturn * 100) + '%, withdrawal ' + r6(i.assumptions.withdrawalRate * 100) + '%, Social Security ' + money(i.assumptions.socialSecurityAtRetirement) + '/year, ' + esc(i.assumptions.payoffMethod) + ' payoff</dd></dl>';
    var v = validateAll();
    h += v.valid ? '<p class="ok">Everything looks complete.</p>' : '<p class="warn">' + v.errors.length + ' answer' + (v.errors.length > 1 ? 's need' : ' needs') + ' attention. First: screen ' + (v.errors[0].step + 1) + ' (' + esc(STEPS[v.errors[0].step]) + ').</p>';
    return h;
  }

  /* ---------- shell ---------- */
  function shell() {
    var h = '<div class="toolbar" role="group" aria-label="Save and load">' +
      '<button type="button" class="btn small secondary" data-action="save">Save inputs</button>' +
      '<button type="button" class="btn small secondary" data-action="load">Load inputs</button>' +
      '<button type="button" class="btn small secondary" data-action="example">Load example (Cheltsey &amp; Drew)</button>' +
      '<input type="file" id="q-file" accept="application/json,.json" hidden aria-label="Choose an inputs JSON file"></div>' +
      '<p id="q-status" class="status" role="status" aria-live="polite"></p>' +
      '<div class="progress"><p class="progress-text" id="q-progress-text"></p><div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="7" aria-valuenow="1" aria-label="Progress" id="q-bar"><span id="q-fill"></span></div></div>';
    STEPS.forEach(function (t, i) {
      h += '<section class="step" data-step="' + i + '" aria-labelledby="q-h' + i + '" hidden><h2 id="q-h' + i + '" tabindex="-1">' + (i + 1) + '. ' + esc(t) + '</h2><div class="step-body" id="q-body' + i + '"></div></section>';
    });
    h += '<div class="nav"><button type="button" class="btn secondary" data-action="back">Back</button><button type="button" class="btn primary" data-action="next">Next</button></div>';
    return h;
  }

  function renderStep(i) { var b = document.getElementById('q-body' + i); if (b) b.innerHTML = RENDER[i](); }
  function renderAll() { for (var i = 0; i < STEPS.length; i++) renderStep(i); }

  function showStep(n, keepFocus) {
    cur = Math.max(0, Math.min(STEPS.length - 1, n));
    Array.prototype.forEach.call(root.querySelectorAll('.step'), function (s) { s.hidden = Number(s.dataset.step) !== cur; });
    var last = cur === STEPS.length - 1;
    root.querySelector('[data-action=back]').disabled = cur === 0;
    var nx = root.querySelector('[data-action=next]');
    nx.textContent = last ? 'Build my plan' : 'Next';
    document.getElementById('q-progress-text').textContent = 'Step ' + (cur + 1) + ' of ' + STEPS.length + ': ' + STEPS[cur];
    var bar = document.getElementById('q-bar');
    bar.setAttribute('aria-valuenow', cur + 1);
    bar.setAttribute('aria-valuetext', 'Step ' + (cur + 1) + ' of ' + STEPS.length);
    document.getElementById('q-fill').style.width = ((cur + 1) / STEPS.length * 100) + '%';
    if (last) document.getElementById('review').innerHTML = reviewHtml();
    if (!keepFocus) { document.getElementById('q-h' + cur).focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }

  function setStatus(msg, isErr) {
    var el = document.getElementById('q-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (msg ? (isErr ? ' bad' : ' good') : '');
  }

  /* ---------- binding and validation ---------- */
  function readEl(el) {
    var k = el.dataset.kind, v;
    if (k === 'check') v = el.checked;
    else if (k === 'radio') v = el.value;
    else if (k === 'text') v = el.value;
    else if (k === 'select') v = el.dataset.num ? (el.value === '' ? null : Number(el.value)) : el.value;
    else { v = el.value === '' ? null : Number(el.value); if (v != null && k === 'pct') v = r6(v / 100); }
    return v;
  }

  function checkPath(path, kind, isReq, min, max) {
    var v = get(path);
    if (kind === 'check') return '';
    if (kind === 'radio' || kind === 'select') return isReq && (v == null || v === '') ? 'Please choose an option.' : '';
    if (kind === 'text') return isReq && !String(v || '').trim() ? 'This is required.' : '';
    if (v == null || v === '' || typeof v !== 'number' || isNaN(v)) return isReq ? 'Please enter a number.' : '';
    var d = kind === 'pct' ? v * 100 : v;
    if (min != null && d < min) return 'Enter a number of ' + min + ' or more.';
    if (max != null && d > max) return 'Enter a number of ' + max + ' or less.';
    var m = /^household\.people\.(\d)\.retireAge$/.exec(path);
    if (m) { var age = S.household.people[m[1]].age; if (age != null && v <= age) return 'Must be later than the current age (' + age + ').'; }
    return '';
  }
  function checkEl(el) {
    return checkPath(el.dataset.bind, el.dataset.kind, !!el.dataset.req,
      el.dataset.min != null ? Number(el.dataset.min) : null, el.dataset.max != null ? Number(el.dataset.max) : null);
  }
  function showError(path, msg) {
    var err = document.getElementById(idOf(path) + '-err');
    if (err) err.textContent = msg;
    Array.prototype.forEach.call(root.querySelectorAll('[data-bind="' + path + '"]'), function (e) {
      if (msg) e.setAttribute('aria-invalid', 'true'); else e.removeAttribute('aria-invalid');
    });
  }
  function validateStep(i, show) {
    var errs = [], seen = {};
    Array.prototype.forEach.call(root.querySelectorAll('.step[data-step="' + i + '"] [data-bind]'), function (el) {
      var p = el.dataset.bind;
      if (seen[p]) return;
      seen[p] = 1;
      var m = checkEl(el);
      if (m) errs.push({ step: i, path: p, msg: m });
      if (show) showError(p, m);
    });
    return errs;
  }
  function validateAll() {
    var errs = [];
    for (var i = 0; i < STEPS.length; i++) errs = errs.concat(validateStep(i, false));
    return { valid: errs.length === 0, errors: errs };
  }

  function onInput(e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.bind) return;
    var path = el.dataset.bind;
    if (el.dataset.kind === 'radio' && !el.checked) return;
    set(path, readEl(el));
    var step = Number(el.closest('.step').dataset.step);
    if (e.type === 'change' && el.dataset.struct) return structChange(path, step);
    if (/people\.\d\.name$/.test(path)) { var lg = el.closest('fieldset').querySelector('legend'); if (lg) lg.textContent = pname(Number(path.split('.')[2])); }
    if (shown[path] || e.type === 'change') { shown[path] = true; showError(path, checkEl(el)); }
    if (/people\.\d\.age$/.test(path)) { var rp = path.replace('.age', '.retireAge'); if (shown[rp]) showError(rp, checkPath(rp, 'num', true, 30, 100)); }
  }
  function onBlur(e) {
    var el = e.target;
    if (el.dataset && el.dataset.bind && el.dataset.kind !== 'radio' && el.dataset.kind !== 'check') { shown[el.dataset.bind] = true; showError(el.dataset.bind, checkEl(el)); }
  }

  function structChange(path, step) {
    var m;
    if (path === 'household.earners') {
      if (S.household.earners === 1) S.accounts.forEach(function (a) { a.owner = 0; });
      renderStep(0); renderStep(1);
    } else if ((m = /^accounts\.(\d+)\.type$/.exec(path))) {
      renderStep(1);
    } else if ((m = /^goals\.(\d+)\.type$/.exec(path))) {
      var g = S.goals[m[1]], names = Object.keys(GOAL_NAMES).map(function (k) { return GOAL_NAMES[k]; });
      if (!g.name || names.indexOf(g.name) >= 0) g.name = GOAL_NAMES[g.type];
      renderStep(4);
    }
    var again = document.getElementById(idOf(path));
    if (again) again.focus();
  }

  function onClick(e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.classList.contains('tip')) {
      var box = document.getElementById(t.dataset.tip), open = box.hidden;
      box.hidden = !open;
      t.setAttribute('aria-expanded', String(open));
      return;
    }
    var act = t.dataset.action, i = Number(t.dataset.i);
    if (!act) return;
    var focusSel = null;
    switch (act) {
      case 'back': showStep(cur - 1); break;
      case 'next':
        var errs = validateStep(cur, true);
        errs.forEach(function (x) { shown[x.path] = true; });
        if (errs.length) { setStatus('Please fix the ' + errs.length + ' highlighted answer' + (errs.length > 1 ? 's' : '') + ' to continue.', true); var f = document.querySelector('[data-bind="' + errs[0].path + '"]'); if (f) f.focus(); break; }
        setStatus('');
        if (cur < STEPS.length - 1) showStep(cur + 1);
        else {
          var all = validateAll();
          if (!all.valid) { var x0 = all.errors[0]; showStep(x0.step); validateStep(x0.step, true); setStatus('Some answers on screen ' + (x0.step + 1) + ' need attention before building your plan.', true); break; }
          if (opts.onBuild) opts.onBuild();
        }
        break;
      case 'add-account': S.accounts.push(newAcct()); renderStep(1); focusSel = '#' + idOf('accounts.' + (S.accounts.length - 1) + '.type'); break;
      case 'rm-account': S.accounts.splice(i, 1); renderStep(1); focusSel = '[data-action=add-account]'; break;
      case 'add-debt': S.debts.push(newDebt()); renderStep(3); focusSel = '#' + idOf('debts.' + (S.debts.length - 1) + '.name'); break;
      case 'rm-debt': S.debts.splice(i, 1); renderStep(3); focusSel = '[data-action=add-debt]'; break;
      case 'add-goal': S.goals.push(newGoal('house')); renderStep(4); focusSel = '#' + idOf('goals.' + (S.goals.length - 1) + '.type'); break;
      case 'rm-goal': S.goals.splice(i, 1); renderStep(4); focusSel = '[data-action=add-goal]'; break;
      case 'save': window.Storage.download(getInputs()); setStatus('Inputs saved to retirement-plan-inputs.json.'); break;
      case 'load': document.getElementById('q-file').click(); break;
      case 'example': loadExample(); break;
    }
    if (focusSel) { var n = root.querySelector(focusSel); if (n) n.focus(); }
  }

  function loadExample() {
    var done = function (obj) { setInputs(obj); showStep(0); setStatus('Example loaded: Cheltsey & Drew. Step through the screens, then build the plan.'); };
    var fallback = function () { done(clone(EXAMPLE)); };
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      fetch('sample/cheltsey_drew.json').then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(done, fallback);
    } else fallback();
  }

  function init(el, o) {
    root = el; opts = o || {};
    if (!S) S = defaults();
    root.innerHTML = shell();
    built = true;
    renderAll();
    root.addEventListener('input', onInput);
    root.addEventListener('change', onInput);
    root.addEventListener('focusout', onBlur);
    root.addEventListener('click', onClick);
    document.getElementById('q-file').addEventListener('change', function (ev) {
      var f = ev.target.files[0];
      if (!f) return;
      window.Storage.load(f).then(function (obj) { setInputs(obj); showStep(0); setStatus('Loaded ' + f.name + '.'); }, function (err) { setStatus(err.message, true); });
      ev.target.value = '';
    });
    showStep(0, true);
  }

  S = defaults();
  window.Questionnaire = { init: init, getInputs: getInputs, setInputs: setInputs, validateAll: validateAll, showStep: showStep, setStatus: setStatus };
})();

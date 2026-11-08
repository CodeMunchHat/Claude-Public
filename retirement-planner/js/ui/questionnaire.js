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
  function ic(name, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#q-icon-' + name + '"/></svg>'; }
  var STEP_ICONS = ['people', 'bank', 'wallet', 'credit-card', 'flag', 'gauge', 'sliders'];
  var ACCT_ICONS = { '401k': 'briefcase', '403b': 'briefcase', '457b': 'briefcase', tsp: 'briefcase', pension: 'clock', trad_ira: 'trend', roth_ira: 'trend', hsa: 'heart', taxable: 'bank' };
  var DEBT_ICONS = { credit_card: 'credit-card', auto: 'car', student_federal: 'graduation', student_private: 'graduation', personal: 'person', mortgage: 'home', other: 'dots' };
  var GOAL_ICONS = { house: 'home', kids: 'smile', grad_school: 'graduation', other: 'star' };
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
    return '<button type="button" class="tip" data-tip="' + id + '-tip" aria-expanded="false" aria-label="What is ' + esc(label) + '?" title="' + esc(text) + '">' + ic('info') + '</button>';
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
      if (o.icons) ctl = '<div class="selrow"><span class="rowicon">' + ic(o.icons[v] || 'dots') + '</span>' + ctl + '</div>';
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

  function cardGroup(path, legend, tip, list, o) {
    o = o || {};
    var id = idOf(path), v = get(path), h = '<fieldset class="field radiogroup"><legend' + (o.hideLegend ? ' class="sr"' : '') + '>' + esc(legend) + '</legend>';
    if (tip) h += '<div class="lbl">' + tipBtn(id, legend, tip) + '</div>' + tipBox(id, tip);
    h += '<div class="cards c' + list.length + '">';
    list.forEach(function (c) {
      h += '<label class="choice"><input type="radio" name="' + id + '" id="' + id + '-' + c[0] + '" data-bind="' + path + '" data-kind="radio" data-req="1"' + (o.numeric ? ' data-num="1"' : '') + (o.struct ? ' data-struct="1"' : '') +
        ' value="' + c[0] + '"' + (String(v) === String(c[0]) ? ' checked' : '') + ' aria-describedby="' + id + '-err"><span class="card-face">' + ic(c[2], 'big') + '<b>' + esc(c[1]) + '</b>' + (c[3] ? '<small>' + esc(c[3]) + '</small>' : '') + '</span></label>';
    });
    return h + '</div><p class="err" id="' + id + '-err" role="alert"></p></fieldset>';
  }

  /* ---------- step renderers ---------- */
  function stepHousehold() {
    var h = '<p class="lead">Who earns money in your household?</p>';
    h += cardGroup('household.earners', 'Number of earners', null, [[1, 'One earner', 'person'], [2, 'Two earners', 'people']], { numeric: 1, struct: 1 }) + '<div class="grid">';
    h += fld('household.state', 'State you live in', req({ kind: 'select', opts: STATES, tip: 'Your state decides state income tax. Tennessee and several other states have none on wages.' }));
    h += '</div>' + fld('household.married', 'Married (file taxes jointly)', { kind: 'check', tip: 'Married couples usually file taxes together, which changes tax brackets and some contribution limits.' });
    for (var i = 0; i < S.household.earners; i++) {
      var b = 'household.people.' + i + '.';
      h += '<fieldset class="card"><legend>' + esc(pname(i)) + '</legend><div class="grid">';
      h += fld(b + 'name', 'Name', { kind: 'text', ph: 'Person ' + (i + 1) });
      h += fld(b + 'age', 'Current age', req({ kind: 'num', min: 16, max: 100 }));
      h += fld(b + 'retireAge', 'Retire at age', req({ kind: 'num', min: 30, max: 100, tip: TIP.retireAge }));
      h += fld(b + 'salary', 'Salary per year, before tax', req({ kind: 'money', min: 0, max: 5000000 }));
      h += fld(b + 'raisePct', 'Raises above inflation, per year', req({ kind: 'pct', min: -10, max: 20, tip: TIP.raise }));
      h += '</div>' + fld(b + 'publicService', 'Public service job (government, school, nonprofit)', { kind: 'check', tip: TIP.publicService }) + '</fieldset>';
    }
    return h;
  }

  function typeTip(t) {
    return { '401k': TIP.k401, '403b': TIP.k403, '457b': TIP.k457, tsp: TIP.tsp, pension: TIP.pension, trad_ira: TIP.ira, roth_ira: TIP.roth, hsa: TIP.hsa, taxable: TIP.taxable }[t];
  }
  function rmBtn(act, i, what) {
    var t = 'Remove ' + what + ' ' + (i + 1);
    return '<button type="button" class="btn icon rm" data-action="' + act + '" data-i="' + i + '" aria-label="' + t + '" title="' + t + '">' + ic('trash') + '</button>';
  }
  function addBtn(act, label) { return '<button type="button" class="btn secondary add" data-action="' + act + '" title="' + label + '">' + ic('plus') + '<span>' + label + '</span></button>'; }
  function stepAccounts() {
    var E = S.household.earners, h = '<p class="lead">Add each retirement or investment account. Use a balance of 0 if not opened yet.</p>';
    S.accounts.forEach(function (a, i) {
      var b = 'accounts.' + i + '.';
      h += '<fieldset class="card"><legend>Account ' + (i + 1) + '</legend><div class="grid">';
      if (E === 2) h += fld(b + 'owner', 'Whose account', { kind: 'select', opts: [[0, pname(0)], [1, pname(1)]], noBlank: true, numeric: 1, req: 1 });
      h += fld(b + 'type', 'Account type', { kind: 'select', opts: ACCT_TYPES, icons: ACCT_ICONS, noBlank: true, struct: 1, req: 1, tip: typeTip(a.type) });
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
      h += rmBtn('rm-account', i, 'account') + '</fieldset>';
    });
    return h + addBtn('add-account', 'Add an account');
  }

  function stepCash() {
    return '<p class="lead">Cash on hand and monthly spending.</p><div class="grid">' +
      fld('cash.checking', 'Checking balance', req({ kind: 'money', min: 0, tip: TIP.savingsAccts })) +
      fld('cash.savings', 'Savings balance', req({ kind: 'money', min: 0, tip: TIP.savingsAccts })) +
      fld('cash.monthlyExpenses', 'Monthly expenses (whole household)', req({ kind: 'money', min: 0, tip: TIP.expenses })) +
      fld('cash.emergencyFund', 'Already set aside as an emergency fund', req({ kind: 'money', min: 0, tip: TIP.efund })) + '</div>';
  }

  function stepDebts() {
    var h = '<p class="lead">List each debt. Skip if you have none.</p>';
    S.debts.forEach(function (d, i) {
      var b = 'debts.' + i + '.';
      h += '<fieldset class="card"><legend>Debt ' + (i + 1) + '</legend><div class="grid">' +
        fld(b + 'name', 'Name', req({ kind: 'text', ph: 'Visa, car, student loan' })) +
        fld(b + 'type', 'Type', req({ kind: 'select', opts: DEBT_TYPES, icons: DEBT_ICONS, noBlank: true, struct: 1 })) +
        fld(b + 'balance', 'Balance owed', req({ kind: 'money', min: 0 })) +
        fld(b + 'apr', 'Interest rate (APR)', req({ kind: 'pct', min: 0, max: 100, tip: TIP.apr })) +
        fld(b + 'minPayment', 'Minimum monthly payment', req({ kind: 'money', min: 0, tip: TIP.minPay })) +
        '</div>' + rmBtn('rm-debt', i, 'debt') + '</fieldset>';
    });
    return h + addBtn('add-debt', 'Add a debt');
  }

  function stepGoals() {
    var h = '<p class="lead">Big things to save for besides retirement. Skip if none.</p>';
    S.goals.forEach(function (g, i) {
      var b = 'goals.' + i + '.';
      h += '<fieldset class="card"><legend>Goal ' + (i + 1) + '</legend><div class="grid">' +
        fld(b + 'type', 'Goal type', req({ kind: 'select', opts: GOAL_TYPES, icons: GOAL_ICONS, noBlank: true, struct: 1 })) +
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
        '</div>' + rmBtn('rm-goal', i, 'goal') + '</fieldset>';
    });
    return h + addBtn('add-goal', 'Add a goal');
  }

  function stepRisk() {
    return '<p class="lead">No wrong answers. Pick the closest.</p>' +
      cardGroup('risk.dropReaction', 'Your investments drop 30% in a few months. You...', TIP.drop, [['hold_or_buy', 'Buy more', 'cart', 'Prices are on sale'], ['nervous_hold', 'Hold on', 'hand', 'Wait it out'], ['sell', 'Sell', 'run', 'Stop the losses']]) +
      cardGroup('risk.horizonComfort', 'How long can the money stay invested?', TIP.horizon, [['short', 'Under 5 years', 'clock'], ['medium', '5 to 15 years', 'calendar'], ['long', '15+ years', 'trend']]) +
      cardGroup('risk.experience', 'Your investing experience', TIP.exp, [['none', 'New to it', 'sprout'], ['some', 'Some', 'trend', 'Owned funds or stocks'], ['lots', 'A lot', 'star', 'Invest regularly']]);
  }

  function stepAssumptions() {
    return '<p class="lead">Defaults suit most people.</p><div class="grid">' +
      fld('assumptions.realReturn', 'Expected investment return after inflation (real return)', req({ kind: 'pct', min: -2, max: 15, tip: TIP.realReturn })) +
      fld('assumptions.safeYield', 'Safe savings yield', req({ kind: 'pct', min: 0, max: 15, tip: TIP.safeYield })) +
      fld('assumptions.withdrawalRate', 'Retirement withdrawal rate', req({ kind: 'pct', min: 1, max: 10, tip: TIP.withdrawal })) +
      fld('assumptions.socialSecurityAtRetirement', 'Social Security estimate at retirement (per year)', req({ kind: 'money', min: 0, tip: TIP.ss, hint: 'Get your estimate at <a href="https://www.ssa.gov/myaccount" target="_blank" rel="noopener">ssa.gov/myaccount</a>. Pensions are entered on the Retirement accounts screen.' })) +
      fld('assumptions.waitYearsComparison', 'Cost-of-waiting comparison (years)', req({ kind: 'num', min: 0, max: 40, tip: TIP.wait })) +
      fld('assumptions.payoffMethod', 'Debt payoff method', req({ kind: 'select', opts: [['avalanche', 'Avalanche (highest rate first)'], ['snowball', 'Snowball (smallest balance first)']], noBlank: true, tip: TIP.payoff })) +
      fld('assumptions.extraMonthlyCash', 'Monthly free cash override', { kind: 'money', min: 0, tip: TIP.extra, hint: 'Leave blank to let the planner estimate it.' }) +
      '</div><h3>Review</h3><div id="review" aria-live="polite"></div>';
  }

  var RENDER = [stepHousehold, stepAccounts, stepCash, stepDebts, stepGoals, stepRisk, stepAssumptions];

  function rcard(icon, title, big, small) {
    return '<div class="rcard">' + ic(icon, 'big') + '<div><h4>' + esc(title) + '</h4><p class="big">' + esc(big) + '</p>' + (small ? '<p class="small">' + esc(small) + '</p>' : '') + '</div></div>';
  }
  function reviewHtml() {
    var i = getInputs(), hh = i.household, A = i.assumptions;
    var sum = function (arr, k) { return arr.reduce(function (t, x) { return t + (x[k] || 0); }, 0); };
    var cashTotal = (i.cash.checking || 0) + (i.cash.savings || 0);
    var riskTxt = [i.risk.dropReaction, i.risk.horizonComfort, i.risk.experience].every(Boolean) ? 'Answered' : 'Not finished';
    var h = '<div class="rgrid">';
    h += rcard('people', 'Household', hh.earners + (hh.earners > 1 ? ' earners' : ' earner') + ', ' + hh.state, hh.people.map(function (p) { return p.name + ' ' + money(p.salary); }).join(' / '));
    h += rcard('bank', 'Accounts', String(i.accounts.length), i.accounts.length ? money(sum(i.accounts, 'balance')) + ' saved so far' : 'None added');
    h += rcard('wallet', 'Cash', money(cashTotal), money(i.cash.monthlyExpenses) + ' spent per month');
    h += rcard('credit-card', 'Debts', i.debts.length ? money(sum(i.debts, 'balance')) : 'None', i.debts.length ? i.debts.length + (i.debts.length > 1 ? ' debts' : ' debt') + ', ' + A.payoffMethod : '');
    h += rcard('flag', 'Goals', String(i.goals.length), i.goals.map(function (g) { return g.name; }).join(', '));
    h += rcard('gauge', 'Risk', riskTxt, '');
    h += rcard('sliders', 'Assumptions', r6(A.realReturn * 100) + '% return', r6(A.withdrawalRate * 100) + '% withdrawal, SS ' + money(A.socialSecurityAtRetirement));
    h += '</div>';
    var v = validateAll();
    h += v.valid ? '<p class="verdict ok">' + ic('check') + 'Everything looks complete.</p>' : '<p class="verdict warn">' + ic('info') + v.errors.length + ' answer' + (v.errors.length > 1 ? 's need' : ' needs') + ' attention. First: screen ' + (v.errors[0].step + 1) + ' (' + esc(STEPS[v.errors[0].step]) + ').</p>';
    return h;
  }

  /* ---------- shell ---------- */
  function tb(act, icon, label, text) {
    return '<button type="button" class="btn small secondary tb" data-action="' + act + '" aria-label="' + label + '" title="' + label + '">' + ic(icon) + '<span class="wide">' + text + '</span></button>';
  }
  function shell() {
    var h = '<div class="toolbar" role="group" aria-label="Save and load">' +
      tb('save', 'save-lock', 'Save inputs to an encrypted file', 'Save') + tb('load', 'folder-open', 'Load inputs from a file', 'Load') +
      tb('example', 'lightbulb', 'Load example (Cheltsey & Drew)', 'Example: Cheltsey &amp; Drew') +
      '<input type="file" id="q-file" accept="application/json,.json" hidden aria-label="Choose a saved inputs file"></div>' +
      '<p id="q-status" class="status" role="status" aria-live="polite"></p>' +
      '<ol class="stepbar" id="q-bar" aria-label="Progress">';
    STEPS.forEach(function (t, i) {
      h += '<li data-i="' + i + '"><span class="dot">' + ic(STEP_ICONS[i]) + '<em>' + (i + 1) + '</em></span><span class="sname wide">' + esc(t.replace(' and review', '')) + '</span></li>';
    });
    h += '</ol><p class="progress-text sr" id="q-progress-text"></p>';
    STEPS.forEach(function (t, i) {
      h += '<section class="step" data-step="' + i + '" aria-labelledby="q-h' + i + '" hidden><h2 id="q-h' + i + '" tabindex="-1">' + ic(STEP_ICONS[i]) + (i + 1) + '. ' + esc(t) + '</h2><div class="step-body" id="q-body' + i + '"></div></section>';
    });
    h += '<div class="nav"><button type="button" class="btn secondary" data-action="back" aria-label="Back" title="Back">' + ic('chevron-left') + '<span class="wide">Back</span></button><button type="button" class="btn primary" data-action="next" title="Next"></button></div>';
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
    nx.innerHTML = last ? '<span>Build my plan</span>' + ic('check') : '<span>Next</span>' + ic('chevron-right');
    nx.setAttribute('aria-label', last ? 'Build my plan' : 'Next');
    document.getElementById('q-progress-text').textContent = 'Step ' + (cur + 1) + ' of ' + STEPS.length + ': ' + STEPS[cur];
    Array.prototype.forEach.call(document.querySelectorAll('#q-bar li'), function (li, k) {
      li.className = k < cur ? 'done' : (k === cur ? 'current' : '');
      if (k === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
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
    else if (k === 'radio') v = el.dataset.num ? Number(el.value) : el.value;
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
    } else if (/^debts\.\d+\.type$/.test(path)) {
      renderStep(3);
    } else if ((m = /^goals\.(\d+)\.type$/.exec(path))) {
      var g = S.goals[m[1]], names = Object.keys(GOAL_NAMES).map(function (k) { return GOAL_NAMES[k]; });
      if (!g.name || names.indexOf(g.name) >= 0) g.name = GOAL_NAMES[g.type];
      renderStep(4);
    }
    var again = document.getElementById(idOf(path)) || root.querySelector('[data-bind="' + path + '"]:checked');
    if (again) again.focus();
  }

  function onClick(e) {
    var t = e.target.closest('button');
    if (t && !root.contains(t)) return;
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
      case 'save':
        window.Storage.download(getInputs()).then(function (r) {
          if (r) setStatus('Inputs saved to ' + r.filename + (r.encrypted ? ' (encrypted).' : ' (not encrypted).'));
        }, function (err) { setStatus(err.message, true); });
        break;
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

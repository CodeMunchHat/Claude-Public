/* Plan results view. window.PlanView.render(plan, inputs, containerEl)
   Plain DOM only: every string goes through textContent. */
(function () {
  'use strict';

  var ACCENT = '#1F3A5F';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var CSS = [
    '.pv{--pv-accent:#1F3A5F;--pv-amber-bg:#fff4d6;--pv-amber-bd:#d9a400;--pv-line:#d5dae1;--pv-zebra:#f4f6f9;--pv-text:#1b2430;--pv-muted:#5a6676;',
    'color:var(--pv-text);max-width:980px;margin:0 auto;padding:0 16px 48px;box-sizing:border-box;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow-wrap:anywhere}',
    '.pv *,.pv *::before,.pv *::after{box-sizing:border-box}',
    '.pv h1{color:var(--pv-accent);font-size:1.8rem;line-height:1.2;margin:16px 0 4px}',
    '.pv h2{color:var(--pv-accent);font-size:1.3rem;margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid var(--pv-accent)}',
    '.pv h3{color:var(--pv-accent);font-size:1.05rem;margin:16px 0 8px}',
    '.pv section{margin:32px 0}',
    '.pv .pv-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}',
    '.pv button{font:inherit;cursor:pointer;border-radius:6px;border:1px solid var(--pv-accent);background:#fff;color:var(--pv-accent);padding:8px 14px;min-height:44px}',
    '.pv button.pv-primary{background:var(--pv-accent);color:#fff}',
    '.pv button:focus-visible,.pv summary:focus-visible,.pv input:focus-visible{outline:3px solid #6b9be0;outline-offset:2px}',
    '.pv .pv-sub{color:var(--pv-muted);margin:2px 0}',
    '.pv .pv-situation{margin:12px 0 0;font-size:1.05rem}',
    '.pv .pv-box{border:1px solid var(--pv-line);border-radius:8px;padding:12px 16px;margin:12px 0}',
    '.pv .pv-warn{background:var(--pv-amber-bg);border-color:var(--pv-amber-bd)}',
    '.pv .pv-box ul{margin:6px 0 0;padding-left:20px}',
    '.pv .pv-verify ul{list-style:none;padding-left:0}',
    '.pv .pv-verify li{display:flex;gap:8px;align-items:flex-start;margin:6px 0}',
    '.pv input[type=checkbox]{width:20px;height:20px;margin-top:2px;flex:none;accent-color:var(--pv-accent)}',
    '.pv .pv-check{list-style:none;padding:0;margin:0}',
    '.pv .pv-check li{display:flex;gap:8px;align-items:flex-start;margin:8px 0}',
    '.pv .pv-who{font-weight:600;color:var(--pv-accent)}',
    '.pv .pv-scroll{overflow-x:auto;max-width:100%;border:1px solid var(--pv-line);border-radius:6px}',
    '.pv table{border-collapse:collapse;width:100%;min-width:560px;font-size:.95rem}',
    '.pv th{background:var(--pv-accent);color:#fff;text-align:left;padding:8px 10px;font-weight:600;white-space:nowrap}',
    '.pv td{padding:8px 10px;vertical-align:top;border-top:1px solid var(--pv-line);overflow-wrap:normal}',
    '.pv tbody tr:nth-child(even) td{background:var(--pv-zebra)}',
    '.pv td.num,.pv th.num{text-align:right;font-variant-numeric:tabular-nums}',
    '.pv tr.pv-steps td{background:#eef2f8 !important}',
    '.pv .pv-toggle{min-height:32px;padding:2px 10px;font-size:.85rem}',
    '.pv .pv-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}',
    '.pv .pv-card{border:1px solid var(--pv-line);border-radius:8px;padding:12px 16px}',
    '.pv .pv-card h3{margin-top:0}',
    '.pv .pv-flag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:.8rem;font-weight:600}',
    '.pv .pv-ok{background:#dcf1e1;color:#14532d}',
    '.pv .pv-no{background:#fde2e2;color:#7f1d1d}',
    '.pv .pv-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0}',
    '.pv .pv-tile{border:1px solid var(--pv-line);border-top:4px solid var(--pv-accent);border-radius:8px;padding:10px 12px}',
    '.pv .pv-tile .v{display:block;font-size:1.35rem;font-weight:700;color:var(--pv-accent)}',
    '.pv .pv-tile .l{font-size:.85rem;color:var(--pv-muted)}',
    '.pv .pv-chart{width:100%;height:auto;display:block;border:1px solid var(--pv-line);border-radius:6px;background:#fff}',
    '.pv details{margin:12px 0}',
    '.pv summary{cursor:pointer;font-weight:600;color:var(--pv-accent);padding:8px 0;min-height:44px}',
    '.pv .pv-foot{font-size:.85rem;color:var(--pv-muted);border-top:1px solid var(--pv-line);padding-top:12px}',
    '@media (max-width:600px){.pv h1{font-size:1.5rem}.pv .pv-toolbar button{flex:1 1 calc(50% - 8px)}}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById('pv-style')) return;
    var s = document.createElement('style');
    s.id = 'pv-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function txt(tag, text, cls) { return el(tag, cls ? { class: cls, text: text } : { text: text }); }

  function money(n) {
    if (n == null || isNaN(n)) return '-';
    var r = Math.round(Math.abs(n));
    return (n < 0 && r !== 0 ? '-' : '') + '$' + String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function pct(n, d) { return (n == null || isNaN(n)) ? '-' : (n * 100).toFixed(d == null ? 1 : d) + '%'; }
  function monthYear(monthsFromNow, base) {
    var d = new Date(base.getFullYear(), base.getMonth() + Math.round(monthsFromNow), 1);
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function filingLabel(f) {
    return { mfj: 'married filing jointly', single: 'single', mfs: 'married filing separately', hoh: 'head of household' }[f] || f || '';
  }

  function table(headers, rows, numCols) {
    var thead = el('thead', null, [el('tr', null, headers.map(function (h, i) {
      return el('th', { scope: 'col', class: numCols && numCols.indexOf(i) >= 0 ? 'num' : '', text: h });
    }))]);
    var tbody = el('tbody', null, rows);
    return el('div', { class: 'pv-scroll', tabindex: '0', role: 'region', 'aria-label': 'Scrollable table' }, [el('table', null, [thead, tbody])]);
  }
  function td(content, num) {
    var c = el('td', num ? { class: 'num' } : null);
    if (content instanceof Node) c.appendChild(content); else c.textContent = content == null ? '' : String(content);
    return c;
  }
  function section(id, title) {
    var s = el('section', { id: 'pv-' + id, 'data-section': id });
    s.appendChild(txt('h2', title));
    return s;
  }
  function checkItem(label, who, id) {
    var cb = el('input', { type: 'checkbox', id: id });
    var lab = el('label', { for: id }, who ? [txt('span', who + ': ', 'pv-who'), label] : [label]);
    return el('li', null, [cb, lab]);
  }

  // ---------- chart ----------
  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v || 1)));
    var m = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < m.length; i++) if (m[i] * p >= v) return m[i] * p;
    return 10 * p;
  }
  function shortMoney(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(v % 1e6 ? 1 : 0).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + v;
  }
  function buildChart(years) {
    var W = 640, H = 340, L = 64, R = 16, T = 16, B = 86;
    var pw = W - L - R, ph = H - T - B;
    var pts = years.map(function (y) { return { age: y.age, a: y.end, b: y.waitEnd }; });
    var maxV = niceMax(Math.max.apply(null, pts.map(function (p) { return Math.max(p.a, p.b); })));
    var minAge = pts[0].age, maxAge = pts[pts.length - 1].age;
    var span = Math.max(1, maxAge - minAge);
    function x(a) { return L + (a - minAge) / span * pw; }
    function y(v) { return T + ph - v / maxV * ph; }
    var last = years[years.length - 1];
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'pv-chart', role: 'img', 'aria-labelledby': 'pv-chart-t pv-chart-d' });
    svg.appendChild(s('title', { id: 'pv-chart-t' }, 'Projected balance by age: invest now versus wait'));
    svg.appendChild(s('desc', { id: 'pv-chart-d' }, 'Line chart in today\'s dollars. Investing now ends at ' + money(last.end) +
      ' at age ' + last.age + '; waiting ends at ' + money(last.waitEnd) + '.'));
    var g = s('g', { 'font-size': '11', fill: '#5a6676', 'font-family': 'sans-serif' });
    for (var i = 0; i <= 5; i++) {
      var v = maxV * i / 5, yy = y(v);
      g.appendChild(s('line', { x1: L, x2: W - R, y1: yy, y2: yy, stroke: '#e3e7ed' }));
      g.appendChild(s('text', { x: L - 6, y: yy + 4, 'text-anchor': 'end' }, shortMoney(v)));
    }
    var step = span > 30 ? 10 : 5;
    for (var a = Math.ceil(minAge / step) * step; a <= maxAge; a += step) {
      g.appendChild(s('line', { x1: x(a), x2: x(a), y1: T + ph, y2: T + ph + 4, stroke: '#5a6676' }));
      g.appendChild(s('text', { x: x(a), y: T + ph + 17, 'text-anchor': 'middle' }, String(a)));
    }
    g.appendChild(s('line', { x1: L, x2: L, y1: T, y2: T + ph, stroke: '#5a6676' }));
    g.appendChild(s('line', { x1: L, x2: W - R, y1: T + ph, y2: T + ph, stroke: '#5a6676' }));
    g.appendChild(s('text', { x: L + pw / 2, y: T + ph + 36, 'text-anchor': 'middle', 'font-size': '12', fill: '#1b2430' }, 'Age'));
    g.appendChild(s('text', { x: 14, y: T + ph / 2, 'text-anchor': 'middle', 'font-size': '12', fill: '#1b2430',
      transform: 'rotate(-90 14 ' + (T + ph / 2) + ')' }, 'Balance (today\'s dollars)'));
    svg.appendChild(g);
    function line(key, color, dash) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p.age).toFixed(1) + ' ' + y(p[key]).toFixed(1); }).join(' ');
      var attrs = { d: d, fill: 'none', stroke: color, 'stroke-width': '2.5' };
      if (dash) attrs['stroke-dasharray'] = dash;
      return s('path', attrs);
    }
    svg.appendChild(line('a', ACCENT));
    svg.appendChild(line('b', '#b45309', '6 4'));
    var ly = H - 18;
    var leg = s('g', { 'font-size': '12', fill: '#1b2430', 'font-family': 'sans-serif' });
    leg.appendChild(s('line', { x1: L, x2: L + 28, y1: ly, y2: ly, stroke: ACCENT, 'stroke-width': '2.5' }));
    leg.appendChild(s('text', { x: L + 34, y: ly + 4 }, 'Invest now'));
    leg.appendChild(s('line', { x1: L + 150, x2: L + 178, y1: ly, y2: ly, stroke: '#b45309', 'stroke-width': '2.5', 'stroke-dasharray': '6 4' }));
    leg.appendChild(s('text', { x: L + 184, y: ly + 4 }, 'Wait and start later'));
    svg.appendChild(leg);
    return svg;
  }

  // ---------- main ----------
  function render(plan, inputs, container) {
    injectStyle();
    inputs = inputs || {};
    var now = new Date();
    var hh = inputs.household || {};
    var people = hh.people || [];
    var names = people.map(function (p) { return p.name; }).filter(Boolean);
    var sum = plan.summary || {};
    var proj = plan.projection || {};
    var root = el('div', { class: 'pv' });
    container.textContent = '';
    container.appendChild(root);

    // 1 toolbar
    var tb = el('div', { class: 'pv-toolbar no-print', 'data-section': 'toolbar' });
    function btn(label, fn, primary) {
      var b = el('button', { type: 'button', class: primary ? 'pv-primary' : '', text: label });
      b.addEventListener('click', fn);
      tb.appendChild(b);
    }
    btn('Edit answers', function () { if (window.App && typeof window.App.showQuestionnaire === 'function') window.App.showQuestionnaire(); });
    btn('Download PDF', function () { if (window.PlanPDF) window.PlanPDF.download(plan, inputs); }, true);
    btn('Save inputs', function () { if (window.Storage && typeof window.Storage.download === 'function') window.Storage.download(inputs); });
    btn('Print', function () { window.print(); });
    root.appendChild(tb);

    // 2 title
    var head = el('header', { 'data-section': 'title' });
    head.appendChild(txt('h1', 'Your Starter Financial Plan'));
    if (names.length) head.appendChild(txt('p', 'Prepared for ' + names.join(' and '), 'pv-sub'));
    head.appendChild(txt('p', now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 'pv-sub'));
    var st = hh.state || sum.state;
    var bits = ['Combined income ' + money(sum.combinedIncome), 'filing ' + filingLabel(sum.filingStatus),
      pct(sum.marginalFederal, 0) + ' federal marginal bracket'];
    if (st) bits.push('state ' + st + (sum.stateRate === 0 ? ' (no income tax)' : sum.stateRate ? ' (' + pct(sum.stateRate) + ')' : ''));
    bits.push(money(sum.freeCashMonthly) + ' free cash per month');
    head.appendChild(txt('p', bits.join(', ') + '.', 'pv-situation'));
    root.appendChild(head);

    // 3 warnings / verify
    var wv = section('warnings', 'Warnings and items to verify');
    if ((sum.warnings || []).length) {
      var wb = el('div', { class: 'pv-box pv-warn', role: 'note' }, [txt('strong', 'Warnings')]);
      wb.appendChild(el('ul', null, sum.warnings.map(function (w) { return txt('li', w); })));
      wv.appendChild(wb);
    }
    var vb = el('div', { class: 'pv-box pv-verify' }, [txt('strong', 'Please verify')]);
    var vl = el('ul');
    (sum.verify || []).forEach(function (v, i) { vl.appendChild(checkItem(v, null, 'pv-verify-' + i)); });
    vb.appendChild(vl);
    wv.appendChild(vb);
    root.appendChild(wv);

    // 4 first 90 days
    var d90 = section('ninety', 'Your first 90 days');
    [['this_week', 'This week'], ['this_month', 'This month'], ['months_2_3', 'Months 2 and 3']].forEach(function (g) {
      var items = (plan.ninetyDays || []).filter(function (t) { return t.when === g[0]; });
      if (!items.length) return;
      d90.appendChild(txt('h3', g[1]));
      var ul = el('ul', { class: 'pv-check' });
      items.forEach(function (t, i) { ul.appendChild(checkItem(t.text, t.who, 'pv-90-' + g[0] + '-' + i)); });
      d90.appendChild(ul);
    });
    root.appendChild(d90);

    // 5 phases
    var ph = section('phases', 'Your plan in order');
    var prow = [];
    (plan.phases || []).forEach(function (p, i) {
      var when;
      if (p.endMonth > p.startMonth) {
        when = 'Month ' + p.startMonth + ' to ' + p.endMonth + ', about ' + plural(p.endMonth - p.startMonth, 'month') +
          ' (' + monthYear(p.startMonth, now) + ' to ' + monthYear(p.endMonth, now) + ')';
      } else when = 'From ' + monthYear(p.startMonth, now) + ', ongoing';
      var tgl = el('button', { type: 'button', class: 'pv-toggle', 'aria-expanded': 'false', 'aria-controls': 'pv-steps-' + i, text: 'Steps' });
      var stepsRow = el('tr', { id: 'pv-steps-' + i, class: 'pv-steps', hidden: '' }, [
        el('td', { colspan: '7' }, [el('ul', null, (p.steps || []).map(function (x) { return txt('li', x); }))])]);
      tgl.addEventListener('click', function () {
        var open = stepsRow.hasAttribute('hidden');
        if (open) stepsRow.removeAttribute('hidden'); else stepsRow.setAttribute('hidden', '');
        tgl.setAttribute('aria-expanded', String(open));
        tgl.textContent = open ? 'Hide' : 'Steps';
      });
      prow.push(el('tr', null, [td(String(i + 1)), td(p.title), td(when), td(p.target ? money(p.target) : '-', true),
        td(money(p.monthly), true), td(p.why), td(tgl)]));
      prow.push(stepsRow);
    });
    ph.appendChild(table(['#', 'Phase', 'When', 'Target', 'Monthly', 'Why', ''], prow, [3, 4]));
    root.appendChild(ph);

    // 6 debt
    var db = section('debt', 'Debt payoff');
    var debt = plan.debt || {};
    if ((debt.order || []).length) {
      var alt = debt.method === 'snowball' ? 'avalanche' : 'snowball';
      db.appendChild(txt('p', 'Method: ' + debt.method + (debt.method === 'avalanche' ? ' (highest interest rate first).' : ' (smallest balance first).')));
      db.appendChild(table(['Debt', 'Payment / month', 'Months', 'Interest'], debt.order.map(function (d) {
        return el('tr', null, [td(d.name), td(money(d.payment), true), td(String(d.months), true), td(money(d.interest), true)]);
      }), [1, 2, 3]));
      db.appendChild(txt('p', 'Total interest ' + money(debt.totalInterest) + '. Debt-free in ' + plural(debt.debtFreeMonth, 'month') +
        ' (' + monthYear(debt.debtFreeMonth, now) + ').'));
      if (debt.snowballAlt) {
        var diff = debt.snowballAlt.totalInterest - debt.totalInterest;
        db.appendChild(txt('p', 'The ' + alt + ' method would cost ' + money(debt.snowballAlt.totalInterest) + ' in interest and finish in ' +
          plural(debt.snowballAlt.debtFreeMonth, 'month') + (diff > 0 ? ', so ' + debt.method + ' saves you ' + money(diff) + '.' : diff < 0 ? ', which is ' + money(-diff) + ' less.' : ', the same cost.'), 'pv-sub'));
      }
    } else db.appendChild(txt('p', 'No debts entered.'));
    root.appendChild(db);

    // 7 goals
    var gs = section('goals', 'Goals');
    var cards = el('div', { class: 'pv-cards' });
    (plan.goals || []).forEach(function (g) {
      cards.appendChild(el('div', { class: 'pv-card' }, [
        txt('h3', g.name),
        el('p', null, [txt('strong', 'Cash needed: '), money(g.cashNeeded)]),
        el('p', null, [txt('strong', 'Monthly: '), money(g.monthly)]),
        el('p', null, [txt('strong', 'Start: '), 'month ' + g.startMonth + ' (' + monthYear(g.startMonth, now) + ')']),
        el('p', null, [txt('span', g.feasible ? 'Feasible' : 'Not feasible yet', 'pv-flag ' + (g.feasible ? 'pv-ok' : 'pv-no'))]),
        txt('p', g.note, 'pv-sub')]));
    });
    if (!cards.childNodes.length) gs.appendChild(txt('p', 'No goals entered.')); else gs.appendChild(cards);
    root.appendChild(gs);

    // 8 accounts
    var ac = section('accounts', 'Accounts to open or change');
    ac.appendChild(table(['Priority', 'Who', 'Account', 'Action', '2026 limit'], (plan.accounts || []).map(function (a) {
      return el('tr', null, [td(String(a.priority), true), td(a.owner), td(a.account), td(a.action), td(a.limit2026 ? money(a.limit2026) : 'n/a', true)]);
    }), [0, 4]));
    root.appendChild(ac);

    // 9 invest
    var iv = section('invest', 'What to invest in');
    var al = plan.allocation || {};
    iv.appendChild(txt('p', 'Suggested mix: ' + pct(al.stockPct, 0) + ' stocks and ' + pct(al.bondPct, 0) + ' bonds.'));
    iv.appendChild(txt('p', al.option === 'target_date'
      ? 'Simplest option: one target-date fund for ' + al.targetYear + '.'
      : 'Simplest option: a three-fund mix (US stocks, international stocks, bonds).'));
    if ((al.examples || []).length) {
      iv.appendChild(table(['Provider', 'Example fund'], al.examples.map(function (e) { return el('tr', null, [td(e.provider), td(e.fund)]); })));
    }
    if (al.note) iv.appendChild(txt('p', al.note, 'pv-sub'));
    root.appendChild(iv);

    // 10 outlook
    var ro = section('outlook', 'Retirement outlook');
    var tiles = el('div', { class: 'pv-tiles' });
    [['Balance at retirement', money(proj.balanceAtRetirement)],
      ['Yearly income from investments', money(proj.incomeFromInvestments)],
      ['Pension', money(proj.pension)],
      ['Social Security', money(proj.socialSecurity)],
      ['Total yearly income', money(proj.totalIncome)],
      ['Replaces your pay', pct(proj.replacementPct, 0)]].forEach(function (t) {
      tiles.appendChild(el('div', { class: 'pv-tile' }, [txt('span', t[1], 'v'), txt('span', t[0], 'l')]));
    });
    ro.appendChild(tiles);
    ro.appendChild(txt('p', 'Without the pension: ' + money(proj.withoutPension) + ' a year (' + pct(proj.withoutPensionPct, 0) + ' of pay). With the pension: ' +
      money(proj.totalIncome) + ' a year (' + pct(proj.replacementPct, 0) + ').'));
    ro.appendChild(txt('p', 'Cost of waiting ' + (plan.waitYears || (inputs.assumptions && inputs.assumptions.waitYearsComparison) || 10) + ' years to start: ' +
      money(proj.costOfWaiting) + ' less at retirement (' + money(proj.waitBalance) + ' instead of ' + money(proj.balanceAtRetirement) + ').'));
    var sc = proj.scenarios || {};
    ro.appendChild(txt('h3', 'If markets do worse or better'));
    ro.appendChild(table(['Scenario', 'Real return', 'Balance at retirement'], [['worst', 'Worse'], ['base', 'Expected'], ['best', 'Better']]
      .filter(function (k) { return sc[k[0]]; }).map(function (k) {
        return el('tr', null, [td(k[1]), td(pct(sc[k[0]].realReturn, 1), true), td(money(sc[k[0]].balance), true)]);
      }), [1, 2]));
    if ((proj.years || []).length) {
      ro.appendChild(txt('h3', 'Balance by age'));
      ro.appendChild(buildChart(proj.years));
      var det = el('details', { id: 'pv-projection-details' }, [txt('summary', 'Full year-by-year projection')]);
      det.appendChild(table(['Year', 'Age', 'Phase', 'Pay', 'Contribution', 'Match', 'Start', 'Growth', 'End', 'If you wait'],
        proj.years.map(function (y) {
          return el('tr', null, [td(String(y.year), true), td(String(y.age), true), td(String(y.phase).replace(/_/g, ' ')), td(money(y.pay), true),
            td(money(y.contrib), true), td(money(y.match), true), td(money(y.start), true), td(money(y.growth), true), td(money(y.end), true), td(money(y.waitEnd), true)]);
        }), [0, 1, 3, 4, 5, 6, 7, 8, 9]));
      ro.appendChild(det);
    }
    root.appendChild(ro);

    // 11 protection
    var pr = section('protection', 'Protection checklist');
    var pl = el('ul', { class: 'pv-check' });
    (plan.protection || []).forEach(function (p, i) { pl.appendChild(checkItem(p.text, p.item, 'pv-prot-' + i)); });
    pr.appendChild(pl);
    root.appendChild(pr);

    // 12 limits
    var lim = plan.limits || {};
    var l26 = lim.y2026 || {}, l27 = lim.y2027projected || {};
    var foot = el('section', { id: 'pv-limits', 'data-section': 'limits', class: 'pv-foot' });
    foot.appendChild(txt('h2', 'Limits and sources'));
    foot.appendChild(txt('p', '2026 limits: 401(k) ' + money(l26.k401) + ', IRA ' + money(l26.ira) + ', HSA family ' + money(l26.hsaFamily) +
      ', HSA single ' + money(l26.hsaSingle) + '.'));
    foot.appendChild(txt('p', '2027 projected (not official): 401(k) ' + money(l27.k401) + ', IRA ' + money(l27.ira) + '.'));
    foot.appendChild(txt('p', 'Limits updated ' + (lim.updated || 'unknown') + '. All figures are estimates in today\'s dollars. This is an educational tool, not financial, tax or legal advice.'));
    root.appendChild(foot);
  }

  window.PlanView = { render: render, _fmt: { money: money, pct: pct } };
})();

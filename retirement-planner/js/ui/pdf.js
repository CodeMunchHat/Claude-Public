/* PDF export. window.PlanPDF.download(plan, inputs)
   Requires js/vendor/jspdf.umd.min.js and jspdf.plugin.autotable.min.js loaded first. Works from file://. */
(function () {
  'use strict';

  var NAVY = [31, 58, 95];
  var ZEBRA = [244, 246, 249];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FOOTER = 'Estimates in today\'s dollars. Educational tool.';

  function clean(t) {
    return String(t == null ? '' : t)
      .replace(/[‘’]/g, '\'').replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-').replace(/…/g, '...')
      .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
  }
  function money(n) {
    if (n == null || isNaN(n)) return '-';
    var r = Math.round(Math.abs(n));
    return (n < 0 && r !== 0 ? '-' : '') + '$' + String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function pct(n, d) { return (n == null || isNaN(n)) ? '-' : (n * 100).toFixed(d == null ? 1 : d) + '%'; }
  function monthYear(m, base) {
    var d = new Date(base.getFullYear(), base.getMonth() + Math.round(m), 1);
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function slug(names) {
    var s = names.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'my';
  }

  function download(plan, inputs) {
    var lib = window.jspdf;
    if (!lib || !lib.jsPDF) throw new Error('jsPDF is not loaded');
    inputs = inputs || {};
    var now = new Date();
    var hh = inputs.household || {};
    var names = (hh.people || []).map(function (p) { return p.name; }).filter(Boolean);
    var sum = plan.summary || {}, proj = plan.projection || {};
    var doc = new lib.jsPDF({ unit: 'pt', format: 'letter' });
    if (typeof doc.autoTable !== 'function') throw new Error('jsPDF-AutoTable is not loaded');
    var PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
    var M = 48, CW = PW - 2 * M, BOTTOM = PH - 56;
    var y = M;

    function setBody() { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 36, 48); }
    function need(h) { if (y + h > BOTTOM) { doc.addPage(); y = M; } }
    function heading(t) {
      need(60);
      y += 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(clean(t), M, y);
      doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]); doc.setLineWidth(1.2);
      doc.line(M, y + 5, PW - M, y + 5);
      y += 22; setBody();
    }
    function sub(t) {
      need(30);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(clean(t), M, y); y += 14; setBody();
    }
    function para(t, opts) {
      opts = opts || {};
      setBody();
      if (opts.bold) doc.setFont('helvetica', 'bold');
      var lines = doc.splitTextToSize(clean(t), CW - (opts.indent || 0));
      lines.forEach(function (l) { need(14); doc.text(l, M + (opts.indent || 0), y); y += 13; });
      y += opts.gap == null ? 4 : opts.gap;
    }
    function bullet(t, box) {
      setBody();
      var lines = doc.splitTextToSize(clean(t), CW - 22);
      need(14 * lines.length);
      if (box) { doc.setDrawColor(90, 102, 118); doc.setLineWidth(0.8); doc.rect(M + 2, y - 8, 8, 8); }
      else doc.text('-', M + 4, y);
      lines.forEach(function (l) { need(14); doc.text(l, M + 20, y); y += 13; });
      y += 2;
    }
    function tbl(head, body, o) {
      o = o || {};
      doc.autoTable({
        startY: y, head: [head.map(clean)], body: body.map(function (r) { return r.map(clean); }),
        margin: { left: M, right: M, bottom: 56 },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: o.fontSize || 9, cellPadding: 4, lineColor: [213, 218, 225], lineWidth: 0.5, textColor: [30, 36, 48], overflow: 'linebreak' },
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: ZEBRA },
        columnStyles: o.columnStyles || {},
        showHead: 'everyPage'
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    var R = { halign: 'right' };
    var COLORS = [[42, 120, 214], [235, 104, 52], [27, 175, 122]];
    function stackBar(parts, scaleMax, marker) {
      need(64);
      var bh = 22, top = y + (marker ? 16 : 0), x = M, total = parts.reduce(function (t, p) { return t + p.value; }, 0);
      var width = CW * (scaleMax ? total / scaleMax : 1);
      parts.forEach(function (p, i) {
        if (p.value <= 0) return;
        var w = Math.max(0, width * p.value / total - 2);
        var c = COLORS[i % 3];
        doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, top, w, bh, 'F');
        if (w > 70) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.text(clean(p.label), x + 6, top + 14); }
        x += w + 2;
      });
      if (marker) {
        var mx = M + CW * marker.value / scaleMax;
        doc.setDrawColor(11, 11, 11); doc.setLineWidth(1.5); doc.line(mx, top - 4, mx, top + bh + 4);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(11, 11, 11);
        doc.text(clean(marker.label), Math.min(mx, PW - M - 60), top - 8, { align: mx > PW - M - 60 ? 'center' : 'center' });
      }
      y = top + bh + 8;
      parts.forEach(function (p, i) {
        var c = COLORS[i % 3];
      });
      // legend
      var lx = M; doc.setFontSize(8.5);
      parts.forEach(function (p, i) {
        var c = COLORS[i % 3]; doc.setFillColor(c[0], c[1], c[2]); doc.rect(lx, y - 7, 8, 8, 'F');
        doc.setFont('helvetica', 'normal'); doc.setTextColor(82, 81, 78);
        var t = clean(p.name); doc.text(t, lx + 12, y); lx += 12 + doc.getTextWidth(t) + 16;
      });
      y += 16; setBody();
    }

    // Title block
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, PW, 92, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    doc.text('Your Starter Financial Plan', M, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(clean((names.length ? 'Prepared for ' + names.join(' and ') + '  |  ' : '') +
      now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })), M, 68);
    y = 116; setBody();

    // Situation
    heading('Your situation');
    var st = hh.state || sum.state;
    var cashIn = inputs.cash || {}, debtTot = (inputs.debts || []).reduce(function (t, d) { return t + (d.balance || 0); }, 0);
    var tileDefs = [['Combined income', money(sum.combinedIncome)], ['Take-home per month', money(sum.takeHomeMonthly)], ['Free cash per month', money(sum.freeCashMonthly)],
      ['Federal tax bracket', pct(sum.marginalFederal, 0)], ['Total debt', inputs.debts ? money(debtTot) : '-'], ['Retirement balance', money(proj.balanceAtRetirement)]];
    var tileBody = [];
    for (var ti = 0; ti < 6; ti += 3) {
      tileBody.push(tileDefs.slice(ti, ti + 3).map(function (t) { return { content: clean(t[1]), styles: { fontSize: 18, fontStyle: 'bold', textColor: NAVY, halign: 'center', cellPadding: { top: 8, bottom: 1, left: 4, right: 4 } } }; }));
      tileBody.push(tileDefs.slice(ti, ti + 3).map(function (t) { return { content: clean(t[0]), styles: { fontSize: 8.5, textColor: [82, 81, 78], halign: 'center', cellPadding: { top: 1, bottom: 8, left: 4, right: 4 } } }; }));
    }
    doc.autoTable({ startY: y, body: tileBody, margin: { left: M, right: M, bottom: 56 }, theme: 'plain', styles: { font: 'helvetica', lineWidth: 0 },
      didParseCell: function (d) { d.cell.styles.fillColor = ZEBRA; } });
    y = doc.lastAutoTable.finalY + 12;
    tbl(['Item', 'Value'], [
      ['Combined income', money(sum.combinedIncome)],
      ['Filing status', { mfj: 'Married filing jointly', single: 'Single' }[sum.filingStatus] || String(sum.filingStatus || '')],
      ['Federal marginal bracket', pct(sum.marginalFederal, 0)],
      ['State', (st || '-') + (sum.stateRate === 0 ? ' (no income tax)' : sum.stateRate ? ' (' + pct(sum.stateRate) + ')' : '')],
      ['Take-home pay per month', money(sum.takeHomeMonthly)],
      ['Free cash per month', money(sum.freeCashMonthly)],
      ['Roth recommended', sum.rothRecommended ? 'Yes' : 'No']
    ], { columnStyles: { 0: { cellWidth: 180, fontStyle: 'bold' } } });
    if ((sum.warnings || []).length) {
      sub('Warnings');
      sum.warnings.forEach(function (w) { bullet(w); });
    }

    // 90 days
    heading('First 90 days');
    [['this_week', 'This week'], ['this_month', 'This month'], ['months_2_3', 'Months 2 and 3']].forEach(function (g) {
      var items = (plan.ninetyDays || []).filter(function (t) { return t.when === g[0]; });
      if (!items.length) return;
      sub(g[1]);
      items.forEach(function (t) { bullet((t.who ? t.who + ': ' : '') + t.text, true); });
    });

    // Phases
    heading('Your plan in order');
    tbl(['#', 'Phase', 'When', 'Target', 'Monthly', 'Why'], (plan.phases || []).map(function (p, i) {
      var when = p.ongoing ? 'From ' + monthYear(p.startMonth, now) + ', ongoing to retirement'
        : p.endMonth > p.startMonth ? monthYear(p.startMonth, now) + ' to ' + monthYear(p.endMonth, now) + ' (~' + (p.endMonth - p.startMonth) + ' mo)'
        : 'From ' + monthYear(p.startMonth, now);
      return [String(i + 1), p.title, when, p.target ? money(p.target) : '-', money(p.monthly), p.why];
    }), { columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 90, fontStyle: 'bold' }, 2: { cellWidth: 110 }, 3: { cellWidth: 50, halign: 'right' }, 4: { cellWidth: 50, halign: 'right' } } });
    (plan.phases || []).forEach(function (p, i) {
      if (!(p.steps || []).length) return;
      sub((i + 1) + '. ' + p.title);
      p.steps.forEach(function (s) { bullet(s); });
    });

    // Debt
    var debt = plan.debt || {};
    heading('Debt payoff');
    if ((debt.order || []).length) {
      para('Method: ' + debt.method + '. Total interest ' + money(debt.totalInterest) + '. Debt-free in ' + plural(debt.debtFreeMonth, 'month') + ' (' + monthYear(debt.debtFreeMonth, now) + ').');
      tbl(['Debt', 'Payment / month (while focused)', 'Months', 'Interest'], debt.order.map(function (d) { return [d.name, money(d.payment), String(d.months), money(d.interest)]; }),
        { columnStyles: { 1: R, 2: R, 3: R } });
      if (debt.snowballAlt) {
        var alt = debt.method === 'snowball' ? 'avalanche' : 'snowball';
        para('The ' + alt + ' method would cost ' + money(debt.snowballAlt.totalInterest) + ' in interest and finish in ' + plural(debt.snowballAlt.debtFreeMonth, 'month') + '.');
      }
    } else para('No debts entered.');

    // Goals
    heading('Goals');
    if ((plan.goals || []).length) {
      tbl(['Goal', 'Cash needed', 'Monthly', 'Start', 'Feasible', 'Note'], plan.goals.map(function (g) {
        return [g.name, money(g.cashNeeded), money(g.monthly), monthYear(g.startMonth, now), g.feasible ? 'Yes' : 'Not yet', g.note];
      }), { columnStyles: { 1: R, 2: R } });
    } else para('No goals entered.');

    // Accounts
    heading('Accounts to open or change');
    tbl(['Priority', 'Who', 'Account', 'Action', '2026 limit'], (plan.accounts || []).map(function (a) {
      return [String(a.priority), a.owner, a.account, a.action, a.limit2026 ? money(a.limit2026) : 'n/a'];
    }), { columnStyles: { 0: { cellWidth: 44 }, 4: { halign: 'right', cellWidth: 60 } } });

    // Investing
    var al = plan.allocation || {};
    heading('What to invest in');
    para('Suggested mix: ' + pct(al.stockPct, 0) + ' stocks and ' + pct(al.bondPct, 0) + ' bonds. ' +
      (al.option === 'target_date' ? 'Simplest option: one target-date fund for ' + al.targetYear + '.' : 'Simplest option: a three-fund mix.'));
    stackBar([{ name: 'Stocks ' + pct(al.stockPct, 0), label: 'Stocks ' + pct(al.stockPct, 0), value: al.stockPct || 0 },
      { name: 'Bonds ' + pct(al.bondPct, 0), label: 'Bonds ' + pct(al.bondPct, 0), value: al.bondPct || 0 }], 1);
    if ((al.examples || []).length) tbl(['Provider', 'Example fund'], al.examples.map(function (e) { return [e.provider, e.fund]; }));
    if (al.note) para(al.note);

    // Outlook
    heading('Retirement outlook');
    tbl(['Measure', 'Amount'], [
      ['Balance at retirement', money(proj.balanceAtRetirement)],
      ['Yearly income from investments', money(proj.incomeFromInvestments)],
      ['Pension', money(proj.pension)],
      ['Social Security', money(proj.socialSecurity)],
      ['Total yearly income', money(proj.totalIncome)],
      ['Share of pay replaced', pct(proj.replacementPct, 0)],
      ['Without pension: yearly income', money(proj.withoutPension) + ' (' + pct(proj.withoutPensionPct, 0) + ' of pay)'],
      ['Balance if you wait to start', money(proj.waitBalance)],
      ['Cost of waiting', money(proj.costOfWaiting)]
    ], { columnStyles: { 0: { cellWidth: 240, fontStyle: 'bold' }, 1: R } });
    sub('Yearly income at retirement');
    var todayInc = sum.combinedIncome || 0, scaleMax = Math.max(proj.totalIncome || 0, todayInc) * 1.05 || 1;
    stackBar([{ name: 'Investments', label: 'Investments ' + money(proj.incomeFromInvestments), value: proj.incomeFromInvestments || 0 },
      { name: 'Pension', label: 'Pension ' + money(proj.pension), value: proj.pension || 0 },
      { name: 'Social Security', label: 'Social Security ' + money(proj.socialSecurity), value: proj.socialSecurity || 0 }],
      scaleMax, { value: todayInc, label: 'Today ' + money(todayInc) + ' | replaces ' + pct(proj.replacementPct, 0) });
    var sc = proj.scenarios || {};
    tbl(['Scenario', 'Real return', 'Balance at retirement'], [['worst', 'Worse'], ['base', 'Expected'], ['best', 'Better']]
      .filter(function (k) { return sc[k[0]]; }).map(function (k) { return [k[1], pct(sc[k[0]].realReturn, 1), money(sc[k[0]].balance)]; }),
      { columnStyles: { 1: R, 2: R } });
    if ((proj.years || []).length) {
      sub('Year-by-year projection');
      tbl(['Year', 'Age', 'Pay', 'Contrib.', 'Match', 'Start', 'Growth', 'End', 'If wait'], proj.years.map(function (r) {
        return [String(r.year), String(r.age), money(r.pay), money(r.contrib), money(r.match), money(r.start), money(r.growth), money(r.end), money(r.waitEnd)];
      }), { fontSize: 8, columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 28 }, 2: R, 3: R, 4: R, 5: R, 6: R, 7: R, 8: R } });
    }

    // Protection
    heading('Protection checklist');
    (plan.protection || []).forEach(function (p) { bullet(p.item + ': ' + p.text, true); });

    // Verify
    heading('Items to verify');
    (sum.verify || []).forEach(function (v) { bullet(v, true); });

    // Limits
    var lim = plan.limits || {}, l26 = lim.y2026 || {}, l27 = lim.y2027projected || {};
    y += 6;
    para('2026 limits: 401(k) ' + money(l26.k401) + ', IRA ' + money(l26.ira) + ', HSA family ' + money(l26.hsaFamily) + ', HSA single ' + money(l26.hsaSingle) +
      '. 2027 projected (not official): 401(k) ' + money(l27.k401) + ', IRA ' + money(l27.ira) + '. Limits updated ' + (lim.updated || 'unknown') + '.');

    // Footer on every page
    var n = doc.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setDrawColor(213, 218, 225); doc.setLineWidth(0.5); doc.line(M, PH - 40, PW - M, PH - 40);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 102, 118);
      doc.text(FOOTER, M, PH - 26);
      doc.text('Page ' + i + ' of ' + n, PW - M, PH - 26, { align: 'right' });
    }

    doc.save(slug(names) + '-financial-plan.pdf');
  }

  window.PlanPDF = { download: download };
})();

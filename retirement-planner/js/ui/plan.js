/* Plan results view. window.PlanView.render(plan, inputs, containerEl)
   Plain DOM only: every string goes through textContent. Charts are inline SVG/HTML, no libraries.
   Palette follows the dataviz reference palette (light + dark) as CSS custom properties. */
(function () {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var LIGHT = '--pv-surface:#fcfcfb;--pv-tx:#0b0b0b;--pv-tx2:#52514e;--pv-mut:#898781;--pv-grid:#e1e0d9;--pv-axis:#c3c2b7;' +
    '--pv-s1:#2a78d6;--pv-s2:#eb6834;--pv-s3:#1baf7a;--pv-s4:#eda100;--pv-good:#0ca30c;--pv-warn:#fab219;--pv-serious:#ec835a;--pv-crit:#d03b3b;' +
    '--pv-good-tx:#006300;--pv-head:#1F3A5F;--pv-tile:#f4f3ee;--pv-ring:rgba(11,11,11,.10);--pv-track:#cde2fb;--pv-btn:#1F3A5F;--pv-btn-tx:#fff;' +
    '--pv-warnbg:#fff4d6;--pv-warnbd:#d9a400;--pv-step:#eef2f8;--pv-onfill:#fff;';
  var DARK = '--pv-surface:#1a1a19;--pv-tx:#f0efec;--pv-tx2:#c3c2b7;--pv-mut:#898781;--pv-grid:#45453f;--pv-axis:#6b6a63;' +
    '--pv-s1:#3987e5;--pv-s2:#d95926;--pv-s3:#199e70;--pv-s4:#c98500;--pv-good:#0ca30c;--pv-warn:#fab219;--pv-serious:#ec835a;--pv-crit:#d03b3b;' +
    '--pv-good-tx:#0ca30c;--pv-head:#9ec5f4;--pv-tile:#242422;--pv-ring:rgba(255,255,255,.10);--pv-track:#104281;--pv-btn:#184f95;--pv-btn-tx:#fff;' +
    '--pv-warnbg:#3a2f10;--pv-warnbd:#fab219;--pv-step:#22262e;--pv-onfill:#0b0b0b;';

  var CSS = [
    '.pv{color-scheme:light;' + LIGHT + 'background:var(--pv-surface);color:var(--pv-tx);max-width:980px;margin:0 auto;padding:0 16px 48px;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;overflow-wrap:anywhere}',
    '@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .pv{color-scheme:dark;' + DARK + '}}',
    ':root[data-theme="dark"] .pv{color-scheme:dark;' + DARK + '}',
    '.pv *,.pv *::before,.pv *::after{box-sizing:border-box}',
    '.pv h1{color:var(--pv-head);font-size:1.8rem;line-height:1.2;margin:8px 0 4px}',
    '.pv h2{color:var(--pv-head);font-size:1.3rem;line-height:1.25;margin:0}',
    '.pv h3{color:var(--pv-head);font-size:1.02rem;margin:16px 0 8px}',
    '.pv section{margin:36px 0}',
    '.pv .pv-sh{display:flex;align-items:center;gap:10px;margin-bottom:2px}',
    '.pv .pv-sh .pv-ico{width:26px;height:26px;color:var(--pv-head);flex:none}',
    '.pv .pv-sum{color:var(--pv-tx2);margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid var(--pv-grid)}',
    '.pv .pv-ico{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;flex:none;vertical-align:middle}',
    '.pv .pv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.pv .pv-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}',
    '.pv button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--pv-head);background:var(--pv-surface);color:var(--pv-head);padding:8px 12px;min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center;gap:8px}',
    '.pv button.pv-primary{background:var(--pv-btn);color:var(--pv-btn-tx);border-color:var(--pv-btn)}',
    '.pv .pv-lbl{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@media (min-width:640px){.pv .pv-lbl{position:static;width:auto;height:auto;overflow:visible;clip:auto}}',
    '.pv button:focus-visible,.pv summary:focus-visible,.pv input:focus-visible,.pv [tabindex]:focus-visible{outline:3px solid var(--pv-s1);outline-offset:2px}',
    '.pv .pv-sub{color:var(--pv-tx2);margin:2px 0}',
    '.pv .pv-box{border:1px solid var(--pv-grid);border-radius:8px;padding:12px 16px;margin:12px 0}',
    '.pv .pv-warn{background:var(--pv-warnbg);border-color:var(--pv-warnbd)}',
    '.pv .pv-warn li{display:flex;gap:8px;align-items:flex-start;margin:6px 0;list-style:none}',
    '.pv .pv-warn ul,.pv .pv-list{padding:0;margin:6px 0 0;list-style:none}',
    '.pv .pv-warn .pv-ico{color:var(--pv-warn);margin-top:2px}',
    '.pv .pv-list li{display:flex;gap:8px;align-items:flex-start;margin:8px 0}',
    '.pv .pv-list .pv-ico{color:var(--pv-head);margin-top:2px}',
    '.pv input[type=checkbox]{width:20px;height:20px;margin-top:2px;flex:none;accent-color:var(--pv-s1)}',
    '.pv .pv-avatar{width:24px;height:24px;border-radius:50%;background:var(--pv-tile);border:1px solid var(--pv-axis);color:var(--pv-tx);font-size:.75rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none}',
    '.pv .pv-avatar .pv-ico{width:14px;height:14px}',
    '.pv .pv-gh{display:flex;align-items:center;gap:8px;margin:16px 0 4px;color:var(--pv-head);font-weight:600}',
    '.pv .pv-cal{position:relative;width:30px;height:30px;color:var(--pv-head)}',
    '.pv .pv-cal .pv-ico{width:30px;height:30px}',
    '.pv .pv-cal b{position:absolute;left:0;right:0;top:11px;text-align:center;font-size:.62rem;line-height:1;color:var(--pv-tx)}',
    '.pv .pv-scroll{overflow-x:auto;max-width:100%;border:1px solid var(--pv-grid);border-radius:6px}',
    '.pv table{border-collapse:collapse;width:100%;min-width:560px;font-size:.95rem}',
    '.pv th{background:var(--pv-btn);color:var(--pv-btn-tx);text-align:left;padding:8px 10px;font-weight:600;white-space:nowrap}',
    '.pv td{padding:8px 10px;vertical-align:top;border-top:1px solid var(--pv-grid);overflow-wrap:normal}',
    '.pv tbody tr:nth-child(even) td{background:var(--pv-tile)}',
    '.pv td.num,.pv th.num{text-align:right;font-variant-numeric:tabular-nums}',
    '.pv tr.pv-steps td{background:var(--pv-step) !important}',
    '.pv td.pv-when{width:11em;min-width:9em}',
    '.pv .pv-toggle{min-height:32px;min-width:32px;padding:2px 6px}',
    '.pv .pv-toggle .pv-ico{transition:transform .15s}',
    '.pv .pv-toggle[aria-expanded=true] .pv-ico{transform:rotate(180deg)}',
    '.pv .pv-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0}',
    '.pv .pv-tile{background:var(--pv-tile);border-radius:10px;padding:10px 12px}',
    '.pv .pv-tile .l{font-size:.82rem;color:var(--pv-tx2);display:flex;gap:6px;align-items:center}',
    '.pv .pv-tile .l .pv-ico{width:16px;height:16px}',
    '.pv .pv-tile .v{display:block;font-size:1.45rem;font-weight:650;color:var(--pv-tx);line-height:1.2;margin-top:2px}',
    '.pv .pv-meter{height:8px;border-radius:4px;background:var(--pv-track);margin-top:8px;overflow:hidden}',
    '.pv .pv-meter i{display:block;height:100%;border-radius:4px;background:var(--pv-s1)}',
    '.pv .pv-seg{display:flex;gap:2px;height:28px;margin:8px 0}',
    '.pv .pv-seg>div{display:flex;align-items:center;padding:0 8px;font-size:.8rem;font-weight:600;border-radius:4px;white-space:nowrap;overflow:visible;min-width:0}',
    '.pv .pv-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:8px 0;font-size:.88rem;color:var(--pv-tx2)}',
    '.pv .pv-legend span{display:inline-flex;align-items:center;gap:6px}',
    '.pv .pv-sw{width:14px;height:10px;border-radius:2px;display:inline-block}',
    '.pv .pv-sw.ln{height:3px;border-radius:2px;width:18px}',
    '.pv .pv-chartbox{width:100%}',
    '.pv .pv-chart{width:100%;height:auto;display:block;overflow:visible}',
    '.pv .pv-chart text{font-family:inherit}',
    '.pv .pv-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}',
    '.pv .pv-card{border:1px solid var(--pv-grid);border-radius:10px;padding:12px 16px}',
    '.pv .pv-card h3{margin:0 0 6px;display:flex;gap:8px;align-items:center}',
    '.pv .pv-status{display:flex;align-items:center;gap:6px;font-weight:600;margin:8px 0 2px}',
    '.pv .pv-status.ok .pv-ico{color:var(--pv-good)}',
    '.pv .pv-status.no .pv-ico{color:var(--pv-serious)}',
    '.pv .pv-pair{display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center;font-size:.85rem;color:var(--pv-tx2);margin:8px 0}',
    '.pv .pv-bar{height:10px;border-radius:5px;min-width:2px}',
    '.pv .pv-stepper{list-style:none;margin:0;padding:0;display:block}',
    '.pv .pv-stepper li{position:relative;display:flex;gap:12px;padding:0 0 18px}',
    '.pv .pv-stepper li::before{content:"";position:absolute;left:15px;top:32px;bottom:0;width:2px;background:var(--pv-axis)}',
    '.pv .pv-stepper li:last-child::before{display:none}',
    '.pv .pv-num{width:32px;height:32px;border-radius:50%;background:var(--pv-btn);color:var(--pv-btn-tx);font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}',
    '.pv .pv-stepper .t{font-weight:600;display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.pv .pv-acct-table{display:none}',
    '@media (min-width:700px){.pv .pv-stepper{display:none}.pv .pv-acct-table{display:block}}',
    '.pv .pv-alloc{display:flex;flex-wrap:wrap;gap:20px;align-items:center}',
    '.pv .pv-pencap{display:flex;gap:8px;align-items:flex-start;margin:12px 0 0;color:var(--pv-tx2);font-size:.92rem}',
    '.pv .pv-pencap .pv-ico{color:var(--pv-head);margin-top:2px}',
    '.pv .pv-income{position:relative;padding-top:34px}',
    '.pv .pv-marker{position:absolute;top:0;bottom:0;width:0;border-left:2px solid var(--pv-tx);}',
    '.pv .pv-marker span{position:absolute;top:0;left:0;transform:translateX(-50%);white-space:nowrap;font-size:.8rem;color:var(--pv-tx);background:var(--pv-surface);padding:0 4px}',
    '.pv .pv-cmp{display:grid;grid-template-columns:7.5em 1fr;gap:8px;align-items:center;margin:6px 0;font-size:.9rem}',
    '.pv .pv-cmp .pv-bar{height:20px;border-radius:4px}',
    '.pv details{margin:12px 0}',
    '.pv summary{cursor:pointer;font-weight:600;color:var(--pv-head);padding:8px 0;min-height:44px;display:flex;align-items:center;gap:6px}',
    '.pv .pv-foot{font-size:.85rem;color:var(--pv-tx2);border-top:1px solid var(--pv-grid);padding-top:12px}',
    '.pv .pv-tip{position:fixed;z-index:50;display:none;pointer-events:none;background:var(--pv-surface);color:var(--pv-tx);border:1px solid var(--pv-axis);border-radius:8px;padding:8px 10px;font-size:.82rem;box-shadow:0 4px 14px var(--pv-ring);max-width:240px}',
    '.pv .pv-tip .r{display:flex;gap:8px;align-items:center;margin-top:2px}',
    '.pv .pv-tip .k{width:14px;height:3px;border-radius:2px;flex:none}',
    '.pv .pv-tip b{font-weight:700}',
    '.pv .pv-tip .n{color:var(--pv-tx2)}',
    '@media (max-width:600px){.pv h1{font-size:1.5rem}}'
  ].join('\n');

  // ---------- icons ----------
  var ICONS = {
    pencil: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8',
    printer: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
    calendar: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M16 2v4 M8 2v4 M3 10h18',
    'check-circle': 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4L12 14l-3-3',
    'alert-triangle': 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
    bank: 'M3 21h18 M5 21V10 M9 21V10 M15 21V10 M19 21V10 M12 3L3 9h18z',
    piggy: 'M19 10c1.5 0 2 1 2 2v2l-2 1v3h-3v-2H9v2H6v-3c-2-1-3-3-3-5 0-3 3-5 7-5h4c1 0 2 .5 3 1.5 M16 11h.01 M10 4.5C10 3 11 2 12.5 2',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
    home: 'M3 10.5L12 3l9 7.5V21H3z M9 21v-7h6v7',
    grad: 'M22 10L12 5 2 10l10 5z M6 12v5c3 2 9 2 12 0v-5 M22 10v6',
    baby: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9 10h.01 M15 10h.01 M9.5 15c1.5 1.3 3.5 1.3 5 0 M12 3c1 1 1 2 0 3',
    flag: 'M4 22V4 M4 4h13l-2 4 2 4H4',
    'credit-card': 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M2 10h20',
    car: 'M5 17H3v-5l2-5h14l2 5v5h-2 M3 12h18 M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z M9 17h6',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5',
    'chevron-down': 'M6 9l6 6 6-6',
    question: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8',
    list: 'M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01',
    dollar: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    trending: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    pie: 'M21.2 15.9A10 10 0 1 1 8 2.8 M22 12A10 10 0 0 0 12 2v10z',
    umbrella: 'M23 12a11.05 11.05 0 0 0-22 0z M12 12v8a2 2 0 0 0 4 0',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
    steps: 'M3 6h10 M7 12h14 M5 18h9',
    wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4z M3 5v14a2 2 0 0 0 2 2h15V7 M16 14h.01'
  };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(name) {
    var s = sv('svg', { class: 'pv-ico', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    s.appendChild(sv('use', { href: '#icon-' + name }));
    return s;
  }
  function sprite() {
    var s = sv('svg', { width: '0', height: '0', style: 'position:absolute', 'aria-hidden': 'true', focusable: 'false' });
    Object.keys(ICONS).forEach(function (k) {
      var sym = sv('symbol', { id: 'icon-' + k, viewBox: '0 0 24 24' });
      sym.appendChild(sv('path', { d: ICONS[k] }));
      s.appendChild(sym);
    });
    return s;
  }

  function injectStyle() {
    if (document.getElementById('pv-style')) return;
    var st = document.createElement('style');
    st.id = 'pv-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------- helpers ----------
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
  function monthYear(m, base) {
    var d = new Date(base.getFullYear(), base.getMonth() + Math.round(m), 1);
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function filingLabel(f) { return { mfj: 'married filing jointly', single: 'single', mfs: 'married filing separately', hoh: 'head of household' }[f] || f || ''; }
  function shortMoney(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v || 1)));
    var m = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < m.length; i++) if (m[i] * p >= v) return m[i] * p;
    return 10 * p;
  }
  function sum(a, f) { return (a || []).reduce(function (t, x) { return t + (f ? f(x) : x) || 0; }, 0); }

  function table(headers, rows, numCols) {
    var thead = el('thead', null, [el('tr', null, headers.map(function (h, i) {
      return el('th', { scope: 'col', class: numCols && numCols.indexOf(i) >= 0 ? 'num' : '', text: h });
    }))]);
    return el('div', { class: 'pv-scroll', tabindex: '0', role: 'region', 'aria-label': 'Scrollable table' }, [el('table', null, [thead, el('tbody', null, rows)])]);
  }
  function td(content, num, cls) {
    var c = el('td', num || cls ? { class: ((num ? 'num ' : '') + (cls || '')).trim() } : null);
    if (content instanceof Node) c.appendChild(content); else c.textContent = content == null ? '' : String(content);
    return c;
  }
  function inline(kids, cls) { return el('span', { class: cls || '', style: 'display:inline-flex;align-items:center;gap:6px' }, kids); }
  function section(id, iconName, title, summary) {
    var s = el('section', { id: 'pv-' + id, 'data-section': id });
    s.appendChild(el('div', { class: 'pv-sh' }, [icon(iconName), txt('h2', title)]));
    s.appendChild(txt('p', summary || '', 'pv-sum'));
    return s;
  }
  function avatar(who) {
    var w = String(who || '');
    if (!w || /^(both|us|household)$/i.test(w)) {
      return el('span', { class: 'pv-avatar', title: 'Both', 'aria-label': 'Both' }, [icon('users')]);
    }
    return el('span', { class: 'pv-avatar', title: w, 'aria-label': w, text: w.charAt(0).toUpperCase() });
  }
  function legend(items) {
    return el('div', { class: 'pv-legend' }, items.map(function (it) {
      var sw = el('span', { class: 'pv-sw' + (it.line ? ' ln' : ''), style: 'background:' + it.color + (it.opacity ? ';opacity:' + it.opacity : '') });
      return el('span', null, [sw, document.createTextNode(it.name)]);
    }));
  }

  // ---------- tooltip ----------
  function makeTip(root) {
    var t = el('div', { class: 'pv-tip', role: 'tooltip' });
    root.appendChild(t);
    function show(x, y, spec) {
      t.textContent = '';
      if (spec.title) t.appendChild(txt('b', spec.title));
      (spec.rows || []).forEach(function (r) {
        var row = el('div', { class: 'r' });
        if (r.color) row.appendChild(el('span', { class: 'k', style: 'background:' + r.color }));
        row.appendChild(txt('b', r.value));
        row.appendChild(txt('span', r.name, 'n'));
        t.appendChild(row);
      });
      t.style.display = 'block';
      var w = t.offsetWidth, h = t.offsetHeight;
      var left = Math.min(Math.max(8, x + 14), window.innerWidth - w - 8);
      var top = y - h - 12 < 4 ? y + 16 : y - h - 12;
      t.style.left = left + 'px'; t.style.top = top + 'px';
    }
    function hide() { t.style.display = 'none'; }
    function label(spec) { return (spec.title ? spec.title + ': ' : '') + (spec.rows || []).map(function (r) { return r.name + ' ' + r.value; }).join(', '); }
    function attach(node, getSpec) {
      var spec = getSpec();
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', label(spec));
      node.addEventListener('pointermove', function (e) { show(e.clientX, e.clientY, getSpec()); });
      node.addEventListener('pointerleave', hide);
      node.addEventListener('focus', function () { var r = node.getBoundingClientRect(); show(r.left + r.width / 2, r.top, getSpec()); });
      node.addEventListener('blur', hide);
    }
    return { show: show, hide: hide, attach: attach };
  }

  // ---------- segmented bar (HTML) ----------
  var ONFILL = { 'var(--pv-s4)': '#0b0b0b', 'var(--pv-warn)': '#0b0b0b' };
  function segBar(parts, tip, fmt, name) {
    var total = sum(parts, function (p) { return p.value; }) || 1;
    var bar = el('div', { class: 'pv-seg', role: 'group', 'aria-label': name });
    parts.forEach(function (p) {
      if (p.value <= 0) return;
      var share = p.value / total;
      var d = el('div', { style: 'flex:' + p.value + ' 1 0;background:' + p.color + ';color:' + (ONFILL[p.color] || 'var(--pv-onfill)') });
      if (share >= 0.14) d.textContent = fmt(p.value);
      tip.attach(d, function () { return { title: p.name, rows: [{ color: p.color, name: Math.round(share * 100) + '% of total', value: fmt(p.value) }] }; });
      bar.appendChild(d);
    });
    return bar;
  }

  // ---------- generic line chart (SVG, crosshair tooltip) ----------
  function lineChart(o, tip) {
    var w = o.w, h = o.h, L = 54, R = 18, T = 20, B = 46;
    var pw = w - L - R, ph = h - T - B, n = o.xs.length;
    var all = [];
    o.series.forEach(function (s) { all = all.concat(s.vals); });
    if (o.band) all = all.concat(o.band.hi);
    var yMax = niceMax(Math.max.apply(null, all)), xMin = o.xs[0], xMax = o.xs[n - 1], xs = Math.max(1, xMax - xMin);
    function X(v) { return L + (v - xMin) / xs * pw; }
    function Y(v) { return T + ph - v / yMax * ph; }
    var svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'pv-chart', role: 'group', 'aria-labelledby': o.id + '-t ' + o.id + '-d' });
    svg.appendChild(sv('title', { id: o.id + '-t' }, o.title));
    svg.appendChild(sv('desc', { id: o.id + '-d' }, o.desc));
    var g = sv('g', { 'font-size': '11.5', style: 'fill:var(--pv-tx2)' });
    for (var i = 0; i <= 5; i++) {
      var v = yMax * i / 5, yy = Y(v);
      g.appendChild(sv('line', { x1: L, x2: w - R, y1: yy, y2: yy, style: 'stroke:' + (i ? 'var(--pv-grid)' : 'var(--pv-axis)'), 'stroke-width': '1' }));
      g.appendChild(sv('text', { x: L - 8, y: yy + 4, 'text-anchor': 'end' }, shortMoney(v)));
    }
    o.xTicks.forEach(function (t) {
      g.appendChild(sv('text', { x: X(t), y: T + ph + 18, 'text-anchor': 'middle' }, String(t)));
    });
    g.appendChild(sv('text', { x: L + pw / 2, y: h - 6, 'text-anchor': 'middle', style: 'fill:var(--pv-tx)', 'font-size': '12' }, o.xTitle));
    svg.appendChild(g);
    if (o.band) {
      var d = o.xs.map(function (x, i) { return (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(o.band.hi[i]).toFixed(1); }).join(' ') + ' ' +
        o.xs.slice().reverse().map(function (x, i) { return 'L' + X(x).toFixed(1) + ' ' + Y(o.band.lo[n - 1 - i]).toFixed(1); }).join(' ') + 'Z';
      svg.appendChild(sv('path', { d: d, style: 'fill:' + o.band.color + ';opacity:.14' }));
    }
    if (o.marker) {
      svg.appendChild(sv('line', { x1: X(o.marker.x), x2: X(o.marker.x), y1: T, y2: T + ph, style: 'stroke:var(--pv-tx2)', 'stroke-width': '1' }));
      var anchor = X(o.marker.x) > w - 110 ? 'end' : 'start', dx = anchor === 'end' ? -6 : 6;
      svg.appendChild(sv('text', { x: X(o.marker.x) + dx, y: T + 12, 'text-anchor': anchor, 'font-size': '12', style: 'fill:var(--pv-tx)' }, o.marker.label));
    }
    o.series.forEach(function (s) {
      var p = o.xs.map(function (x, i) { return (i ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(s.vals[i]).toFixed(1); }).join(' ');
      svg.appendChild(sv('path', { d: p, fill: 'none', style: 'stroke:' + s.color, 'stroke-width': '2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      if (s.endDot !== false) svg.appendChild(sv('circle', { cx: X(xMax), cy: Y(s.vals[n - 1]), r: 4, style: 'fill:' + s.color + ';stroke:var(--pv-surface);stroke-width:2' }));
    });
    if (o.endLabel) {
      var s0 = o.series[0];
      svg.appendChild(sv('text', { x: X(xMax) - 4, y: Y(s0.vals[n - 1]) - 12, 'text-anchor': 'end', 'font-size': '12.5', 'font-weight': '700', style: 'fill:var(--pv-tx)' }, o.endLabel(s0.vals[n - 1])));
    }
    // hover layer
    var cross = sv('g', { style: 'display:none' });
    var vline = sv('line', { y1: T, y2: T + ph, style: 'stroke:var(--pv-tx2)', 'stroke-width': '1' });
    cross.appendChild(vline);
    var dots = o.series.map(function (s) { var c = sv('circle', { r: 4, style: 'fill:' + s.color + ';stroke:var(--pv-surface);stroke-width:2' }); cross.appendChild(c); return c; });
    svg.appendChild(cross);
    var overlay = sv('rect', { x: L, y: T, width: pw, height: ph, fill: 'transparent', tabindex: '0', 'aria-label': o.title + '. Use left and right arrow keys to read values.' });
    svg.appendChild(overlay);
    var idx = n - 1;
    function at(i, cx, cy) {
      idx = Math.max(0, Math.min(n - 1, i));
      var px = X(o.xs[idx]);
      cross.style.display = ''; vline.setAttribute('x1', px); vline.setAttribute('x2', px);
      dots.forEach(function (c, k) { c.setAttribute('cx', px); c.setAttribute('cy', Y(o.series[k].vals[idx])); });
      var rows = o.series.map(function (s) { return { color: s.color, name: s.name, value: money(s.vals[idx]) }; });
      if (o.band) {
        rows.push({ color: o.band.color, name: o.band.hiName, value: money(o.band.hi[idx]) });
        rows.push({ color: o.band.color, name: o.band.loName, value: money(o.band.lo[idx]) });
      }
      var r = svg.getBoundingClientRect(), k = r.width / w;
      tip.show(cx != null ? cx : r.left + px * k, cy != null ? cy : r.top + T * k + 10, { title: o.xFmt(o.xs[idx]), rows: rows });
    }
    overlay.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect(), k = r.width / w;
      var f = (e.clientX - r.left) / k;
      var i = Math.round((f - L) / pw * (n - 1));
      at(i, e.clientX, e.clientY);
    });
    overlay.addEventListener('pointerleave', function () { cross.style.display = 'none'; tip.hide(); });
    overlay.addEventListener('blur', function () { cross.style.display = 'none'; tip.hide(); });
    overlay.addEventListener('focus', function () { at(idx); });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { at(idx - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { at(idx + 1); e.preventDefault(); }
    });
    return svg;
  }
  function ticksFor(min, max, maxCount) {
    var span = max - min, steps = [1, 2, 5, 10, 20, 25, 50], step = 1;
    for (var i = 0; i < steps.length; i++) { step = steps[i]; if (span / step <= maxCount) break; }
    var out = [];
    for (var t = Math.ceil(min / step) * step; t <= max; t += step) out.push(t);
    return out;
  }

  // ---------- gantt ----------
  function gantt(phases, now, w, tip, idp) {
    var L = 8, R = 12, rowH = 46, T = 6, B = 34;
    var finite = 0, anyOngoing = false;
    phases.forEach(function (p) { if (p.ongoing) { anyOngoing = true; finite = Math.max(finite, p.startMonth); } else finite = Math.max(finite, p.endMonth, p.startMonth); });
    var horizon = Math.max(24, Math.ceil((finite + (anyOngoing ? 36 : 6)) / 12) * 12);
    var pw = w - L - R, h = T + rowH * phases.length + B;
    function X(m) { return L + Math.min(m, horizon) / horizon * pw; }
    var svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'pv-chart', role: 'group', 'aria-labelledby': idp + '-t' });
    svg.appendChild(sv('title', { id: idp + '-t' }, 'Timeline of your plan phases by calendar year'));
    var defs = sv('defs');
    var grad = sv('linearGradient', { id: idp + '-fade', x1: '0', x2: '1', y1: '0', y2: '0' });
    grad.appendChild(sv('stop', { offset: '0', style: 'stop-color:var(--pv-s1);stop-opacity:1' }));
    grad.appendChild(sv('stop', { offset: '1', style: 'stop-color:var(--pv-s1);stop-opacity:.08' }));
    defs.appendChild(grad); svg.appendChild(defs);
    var axisY = T + rowH * phases.length;
    // year ticks
    var firstYear = now.getFullYear(), lastYear = now.getFullYear() + Math.ceil((horizon + now.getMonth()) / 12);
    var yrs = lastYear - firstYear, ystep = yrs > 14 ? 5 : yrs > 8 ? 2 : 1;
    var g = sv('g', { 'font-size': '11.5', style: 'fill:var(--pv-tx2)' });
    for (var yr = firstYear + 1; yr <= lastYear; yr += 1) {
      var m = (yr - now.getFullYear()) * 12 - now.getMonth();
      if (m > horizon) break;
      if ((yr - firstYear) % ystep) continue;
      g.appendChild(sv('line', { x1: X(m), x2: X(m), y1: T, y2: axisY, style: 'stroke:var(--pv-grid)', 'stroke-width': '1' }));
      g.appendChild(sv('text', { x: X(m), y: axisY + 18, 'text-anchor': 'middle' }, String(yr)));
    }
    g.appendChild(sv('line', { x1: L, x2: w - R, y1: axisY, y2: axisY, style: 'stroke:var(--pv-axis)', 'stroke-width': '1' }));
    var firstM = ((firstYear + ystep) - now.getFullYear()) * 12 - now.getMonth();
    if (X(firstM) - L > 56) g.appendChild(sv('text', { x: L, y: axisY + 18, 'text-anchor': 'start' }, 'Now'));
    svg.appendChild(g);
    phases.forEach(function (p, i) {
      var y = T + i * rowH;
      var x0 = X(p.startMonth), x1 = p.ongoing ? w - R : Math.max(X(p.endMonth), x0 + 4);
      var lab = (i + 1) + '. ' + p.title;
      var extra = p.monthly ? ' · ' + money(p.monthly) + '/mo' : '';
      var right = p.ongoing ? 'to retirement' : '';
      var maxChars = Math.floor((pw - (right ? 90 : 0)) / 6.6);
      if ((lab + extra).length <= maxChars) lab += extra;
      if (lab.length > maxChars) lab = lab.slice(0, Math.max(4, maxChars - 1)) + '…';
      svg.appendChild(sv('text', { x: L, y: y + 15, 'font-size': '12.5', style: 'fill:var(--pv-tx)' }, lab));
      if (right) svg.appendChild(sv('text', { x: w - R, y: y + 15, 'text-anchor': 'end', 'font-size': '12', style: 'fill:var(--pv-tx2)' }, right + ' →'));
      var bar = sv('rect', { x: x0, y: y + 22, width: Math.max(4, x1 - x0), height: 14, rx: 4, ry: 4,
        style: p.ongoing ? 'fill:url(#' + idp + '-fade)' : 'fill:var(--pv-s1)' });
      svg.appendChild(bar);
      var hit = sv('rect', { x: L, y: y, width: pw, height: rowH - 2, fill: 'transparent' });
      tip.attach(hit, function () {
        return { title: (i + 1) + '. ' + p.title, rows: [
          { name: p.ongoing ? 'starts ' + monthYear(p.startMonth, now) + ', to retirement' : monthYear(p.startMonth, now) + ' to ' + monthYear(p.endMonth, now), value: p.ongoing ? 'Ongoing' : '~' + (p.endMonth - p.startMonth) + ' mo' },
          { name: 'per month', value: money(p.monthly) }].concat(p.target ? [{ name: 'target', value: money(p.target) }] : []) };
      });
      svg.appendChild(hit);
    });
    return svg;
  }

  // ---------- debt simulation (balances by month, estimated from inputs) ----------
  function simulateDebts(plan, inputs) {
    var order = (plan.debt && plan.debt.order) || [], src = inputs.debts || [];
    var ds = order.map(function (o) { return src.filter(function (d) { return d.name === o.name; })[0]; });
    if (!order.length || ds.some(function (d) { return !d; })) return null;
    var target = plan.debt.debtFreeMonth, mins = sum(ds, function (d) { return d.minPayment; });
    function run(extra) {
      var b = ds.map(function (d) { return d.balance; }), rows = [b.slice()], m = 0;
      while (m < 720 && b.some(function (x) { return x > 0.5; })) {
        m++;
        b = b.map(function (x, i) { return x > 0 ? x * (1 + ds[i].apr / 12) : 0; });
        var pool = mins + extra;
        b = b.map(function (x, i) { var p = Math.min(x, ds[i].minPayment); pool -= p; return x - p; });
        for (var i = 0; i < b.length && pool > 0; i++) { var p = Math.min(b[i], pool); b[i] -= p; pool -= p; }
        rows.push(b.map(function (x) { return x < 0.5 ? 0 : x; }));
      }
      return rows;
    }
    var lo = 0, hi = sum(ds, function (d) { return d.balance; });
    for (var k = 0; k < 40; k++) {
      var mid = (lo + hi) / 2;
      if (run(mid).length - 1 > target) lo = mid; else hi = mid;
    }
    return { names: ds.map(function (d) { return d.name; }), rows: run(hi) };
  }

  // ---------- type -> icon ----------
  function acctIcon(a) {
    var s = String(a.account || '');
    if (/401|403|457|tsp/i.test(s)) return 'bank';
    if (/ira|saving|taxable|brokerage/i.test(s)) return 'piggy';
    if (/pension/i.test(s)) return 'shield';
    if (/hsa/i.test(s)) return 'heart';
    return 'dollar';
  }
  function goalIcon(type, name) {
    var t = type || (/house|home/i.test(name) ? 'house' : /grad|school/i.test(name) ? 'grad_school' : /kid|baby|child/i.test(name) ? 'kids' : 'other');
    return { house: 'home', grad_school: 'grad', kids: 'baby' }[t] || 'flag';
  }
  function debtIcon(type, name) {
    var t = type || (/visa|card|master|amex|discover/i.test(name) ? 'credit_card' : /car|auto|truck/i.test(name) ? 'auto' : /student|loan|school/i.test(name) ? 'student_federal' : /home|mortgage/i.test(name) ? 'mortgage' : 'other');
    return { credit_card: 'credit-card', auto: 'car', student_federal: 'book', student_private: 'book', mortgage: 'home' }[t] || 'dollar';
  }
  function protIcon(item) {
    var s = String(item);
    if (/benefic/i.test(s)) return 'users';
    if (/disab/i.test(s)) return 'umbrella';
    if (/life/i.test(s)) return 'heart';
    if (/will|estate|proxy/i.test(s)) return 'file';
    return 'shield';
  }

  // ---------- main ----------
  function render(plan, inputs, container) {
    injectStyle();
    inputs = inputs || {};
    var now = new Date();
    var hh = inputs.household || {};
    var people = hh.people || [];
    var names = people.map(function (p) { return p.name; }).filter(Boolean);
    var sum0 = plan.summary || {}, proj = plan.projection || {};
    var cash = inputs.cash || {};
    var root = el('div', { class: 'pv' });
    container.textContent = '';
    container.appendChild(root);
    root.appendChild(sprite());
    var tip = makeTip(root);
    var pending = [];
    function mount(holder, draw) {
      var last = 0;
      function go() {
        var w = Math.floor(holder.clientWidth);
        if (w < 80 || w === last) return;
        last = w; holder.textContent = ''; holder.appendChild(draw(w));
      }
      pending.push(go);
      if (window.ResizeObserver) new ResizeObserver(go).observe(holder);
    }
    var retireAge = (people[0] && people[0].retireAge) || ((proj.years || []).length ? proj.years[proj.years.length - 1].age + 1 : null);

    // 1 toolbar
    var tb = el('div', { class: 'pv-toolbar no-print', 'data-section': 'toolbar', role: 'toolbar', 'aria-label': 'Plan actions' });
    function btn(ic, label, fn, primary) {
      var b = el('button', { type: 'button', class: primary ? 'pv-primary' : '', 'aria-label': label, title: label }, [icon(ic), txt('span', label, 'pv-lbl')]);
      b.addEventListener('click', fn);
      tb.appendChild(b);
    }
    btn('pencil', 'Edit answers', function () { if (window.App && typeof window.App.showQuestionnaire === 'function') window.App.showQuestionnaire(); });
    btn('download', 'Download PDF', function () { if (window.PlanPDF) window.PlanPDF.download(plan, inputs); }, true);
    btn('save', 'Save inputs', function () { if (window.Storage && typeof window.Storage.download === 'function') window.Storage.download(inputs); });
    btn('printer', 'Print', function () { window.print(); });
    root.appendChild(tb);

    // 2 title + situation
    var head = el('header', { 'data-section': 'title' });
    head.appendChild(txt('h1', 'Your Starter Financial Plan'));
    head.appendChild(txt('p', (names.length ? 'Prepared for ' + names.join(' and ') + ' on ' : '') +
      now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 'pv-sub'));
    var st = hh.state || sum0.state;
    head.appendChild(txt('p', money(sum0.combinedIncome) + ' a year, ' + filingLabel(sum0.filingStatus) + (st ? ', ' + st : '') +
      (sum0.stateRate === 0 ? ' (no state income tax).' : '.'), 'pv-sub'));
    root.appendChild(head);

    var sit = el('section', { id: 'pv-situation', 'data-section': 'situation', 'aria-label': 'Your situation at a glance' });
    var debtTotal = sum(inputs.debts, function (d) { return d.balance; });
    var fullEf = (plan.phases || []).filter(function (p) { return p.id === 'full_ef'; })[0];
    var efTarget = (fullEf && fullEf.target) || (cash.monthlyExpenses ? cash.monthlyExpenses * 3 : 0);
    var efNow = cash.emergencyFund > 0 ? cash.emergencyFund : (cash.savings || 0);
    var tiles = el('div', { class: 'pv-tiles' });
    function tile(ic, label, value, extra) {
      tiles.appendChild(el('div', { class: 'pv-tile' }, [el('div', { class: 'l' }, [icon(ic), txt('span', label)]), txt('span', value, 'v')].concat(extra ? [extra] : [])));
    }
    tile('dollar', 'Combined income', money(sum0.combinedIncome));
    tile('wallet', 'Take-home per month', money(sum0.takeHomeMonthly));
    tile('piggy', 'Free cash per month', money(sum0.freeCashMonthly));
    tile('pie', 'Federal tax bracket', pct(sum0.marginalFederal, 0));
    if (inputs.debts) tile('credit-card', 'Total debt', money(debtTotal));
    if (efTarget > 0) {
      var efp = Math.max(0, Math.min(1, efNow / efTarget));
      var m = el('div', { class: 'pv-meter', role: 'img', 'aria-label': Math.round(efp * 100) + ' percent of the emergency fund target' }, [el('i', { style: 'width:' + Math.round(efp * 100) + '%' })]);
      tile('umbrella', 'Emergency fund', Math.round(efp * 100) + '% of ' + money(efTarget), m);
    }
    sit.appendChild(tiles);
    var mins = sum(inputs.debts, function (d) { return d.minPayment; });
    if (cash.monthlyExpenses && sum0.takeHomeMonthly) {
      sit.appendChild(txt('h3', 'Where your monthly take-home goes'));
      sit.appendChild(segBar([
        { name: 'Living expenses', value: cash.monthlyExpenses, color: 'var(--pv-s1)' },
        { name: 'Debt minimums', value: mins, color: 'var(--pv-s2)' },
        { name: 'Free cash', value: Math.max(0, sum0.takeHomeMonthly - cash.monthlyExpenses - mins), color: 'var(--pv-s3)' }
      ], tip, money, 'Monthly take-home split'));
      sit.appendChild(legend([{ name: 'Living expenses', color: 'var(--pv-s1)' }, { name: 'Debt minimums', color: 'var(--pv-s2)' }, { name: 'Free cash', color: 'var(--pv-s3)' }]));
    }
    root.appendChild(sit);

    // 3 warnings / verify
    var wv = section('warnings', 'alert-triangle', 'Warnings and items to verify',
      (sum0.warnings || []).length ? plural(sum0.warnings.length, 'warning') + ' and ' + plural((sum0.verify || []).length, 'thing') + ' to double-check.' : 'A few things to double-check.');
    if ((sum0.warnings || []).length) {
      var wb = el('div', { class: 'pv-box pv-warn', role: 'note' }, [txt('strong', 'Warnings')]);
      wb.appendChild(el('ul', null, sum0.warnings.map(function (w) { return el('li', null, [icon('alert-triangle'), txt('span', w)]); })));
      wv.appendChild(wb);
    }
    var vb = el('div', { class: 'pv-box' }, [txt('strong', 'Please verify')]);
    var vl = el('ul', { class: 'pv-list' });
    (sum0.verify || []).forEach(function (v, i) {
      var parts = String(v).match(/^(\S+)\s([\s\S]*)$/) || [null, v, ''];
      var id = 'pv-verify-' + i;
      vl.appendChild(el('li', null, [el('input', { type: 'checkbox', id: id }), icon('question'),
        el('label', { for: id }, [txt('strong', parts[1] + ' '), parts[2]])]));
    });
    vb.appendChild(vl);
    wv.appendChild(vb);
    root.appendChild(wv);

    // 4 first 90 days
    var d90 = section('ninety', 'list', 'Your first 90 days', 'Small steps, in order. Check them off as you go.');
    [['this_week', 'This week', '7'], ['this_month', 'This month', '30'], ['months_2_3', 'Months 2 and 3', '90']].forEach(function (g) {
      var items = (plan.ninetyDays || []).filter(function (t) { return t.when === g[0]; });
      if (!items.length) return;
      d90.appendChild(el('div', { class: 'pv-gh' }, [el('span', { class: 'pv-cal', 'aria-hidden': 'true' }, [icon('calendar'), txt('b', g[2])]), txt('span', g[1])]));
      var ul = el('ul', { class: 'pv-list' });
      items.forEach(function (t, i) {
        var id = 'pv-90-' + g[0] + '-' + i;
        ul.appendChild(el('li', null, [el('input', { type: 'checkbox', id: id }), avatar(t.who), el('label', { for: id }, [t.text])]));
      });
      d90.appendChild(ul);
    });
    root.appendChild(d90);

    // 5 phases
    var phs = plan.phases || [];
    var ph = section('phases', 'steps', 'Your plan in order', phs.length ? phs.length + ' steps. Each one builds on the one before.' : '');
    if (phs.length) {
      var gh = el('div', { class: 'pv-chartbox' });
      ph.appendChild(gh);
      mount(gh, function (w) { return gantt(phs, now, w, tip, 'pv-gantt'); });
    }
    var prow = [];
    phs.forEach(function (p, i) {
      var when;
      if (p.ongoing) when = 'From ' + monthYear(p.startMonth, now) + ', ongoing to retirement';
      else if (p.endMonth > p.startMonth) when = monthYear(p.startMonth, now) + ' to ' + monthYear(p.endMonth, now) + ' (~' + (p.endMonth - p.startMonth) + ' mo)';
      else when = 'From ' + monthYear(p.startMonth, now);
      var tgl = el('button', { type: 'button', class: 'pv-toggle', 'aria-expanded': 'false', 'aria-controls': 'pv-steps-' + i, 'aria-label': 'Show steps', title: 'Show steps' }, [icon('chevron-down')]);
      var stepsRow = el('tr', { id: 'pv-steps-' + i, class: 'pv-steps', hidden: '' }, [
        el('td', { colspan: '7' }, [el('ul', null, (p.steps || []).map(function (x) { return txt('li', x); }))])]);
      tgl.addEventListener('click', function () {
        var open = stepsRow.hasAttribute('hidden');
        if (open) stepsRow.removeAttribute('hidden'); else stepsRow.setAttribute('hidden', '');
        tgl.setAttribute('aria-expanded', String(open));
        tgl.setAttribute('aria-label', open ? 'Hide steps' : 'Show steps');
      });
      prow.push(el('tr', null, [td(String(i + 1)), td(p.title), td(when, false, 'pv-when'), td(p.target ? money(p.target) : '-', true),
        td(money(p.monthly), true), td(p.why), td(tgl)]));
      prow.push(stepsRow);
    });
    var pd = el('details', { id: 'pv-phases-details' }, [el('summary', null, [icon('chevron-down'), txt('span', 'Phase details and steps')])]);
    pd.appendChild(table(['#', 'Phase', 'When', 'Target', 'Monthly', 'Why', ''], prow, [3, 4]));
    ph.appendChild(pd);
    root.appendChild(ph);

    // 6 debt
    var debt = plan.debt || {};
    var hasDebt = (debt.order || []).length > 0;
    var db = section('debt', 'credit-card', 'Debt payoff', hasDebt ? 'Debt-free by ' + monthYear(debt.debtFreeMonth, now) + ' (about ' + plural(debt.debtFreeMonth, 'month') + ').' : 'No debts entered.');
    if (hasDebt) {
      var alt = debt.method === 'snowball' ? 'avalanche' : 'snowball';
      db.appendChild(txt('p', 'Method: ' + debt.method + (debt.method === 'avalanche' ? ' (highest interest rate first).' : ' (smallest balance first).')));
      var sim = simulateDebts(plan, inputs);
      if (sim) {
        var dh = el('div', { class: 'pv-chartbox' });
        var dser = sim.names.map(function (nm, i) {
          return { name: i < 4 ? nm : 'Other', color: i < 4 ? 'var(--pv-s' + (i + 1) + ')' : 'var(--pv-mut)', idx: i };
        });
        var series = [];
        sim.names.forEach(function (nm, i) {
          var vals = sim.rows.map(function (r) { return r[i]; });
          if (i < 4) series.push({ name: nm, color: 'var(--pv-s' + (i + 1) + ')', vals: vals });
          else {
            var o = series.filter(function (s) { return s.name === 'Other'; })[0];
            if (!o) series.push({ name: 'Other', color: 'var(--pv-mut)', vals: vals.slice() });
            else vals.forEach(function (v, k) { o.vals[k] += v; });
          }
        });
        var months = sim.rows.map(function (r, i) { return i; });
        db.appendChild(dh);
        mount(dh, function (w) {
          return lineChart({ w: w, h: w < 500 ? 260 : 320, id: 'pv-debtchart', xs: months, series: series.map(function (s) { return { name: s.name, color: s.color, vals: s.vals, endDot: false }; }),
            xTicks: ticksFor(0, months.length - 1, w < 500 ? 5 : 8), xTitle: 'Months from today', xFmt: function (m) { return 'Month ' + m + ' (' + monthYear(m, now) + ')'; },
            marker: { x: months.length - 1, label: 'Debt-free ' + monthYear(debt.debtFreeMonth, now) },
            title: 'Estimated debt balance by month', desc: 'Each line is one debt falling to zero. All debts are paid off by ' + monthYear(debt.debtFreeMonth, now) + '.' }, tip);
        });
        db.appendChild(legend(series.map(function (s) { return { name: s.name, color: s.color, line: true }; })));
        db.appendChild(txt('p', 'Balances are estimated from your debts and interest rates.', 'pv-sub'));
      }
      var srcDebts = inputs.debts || [];
      db.appendChild(table(['Debt', 'Payment / month (while focused)', 'Months', 'Interest'], debt.order.map(function (d) {
        var sd = srcDebts.filter(function (x) { return x.name === d.name; })[0] || {};
        return el('tr', null, [td(inline([icon(debtIcon(sd.type, d.name)), document.createTextNode(d.name)])), td(money(d.payment), true), td(String(d.months), true), td(money(d.interest), true)]);
      }), [1, 2, 3]));
      db.appendChild(txt('p', 'Total interest ' + money(debt.totalInterest) + '.'));
      if (debt.snowballAlt) {
        var diff = debt.snowballAlt.totalInterest - debt.totalInterest;
        db.appendChild(txt('p', 'The ' + alt + ' method would cost ' + money(debt.snowballAlt.totalInterest) + ' in interest' +
          (diff > 0 ? ', so ' + debt.method + ' saves you ' + money(diff) + '.' : diff < 0 ? ', which is ' + money(-diff) + ' less.' : ', the same cost.'), 'pv-sub'));
      }
    }
    root.appendChild(db);

    // 7 goals
    var gl = plan.goals || [];
    var gs = section('goals', 'target', 'Goals', gl.length ? gl.filter(function (g) { return g.feasible; }).length + ' of ' + gl.length + ' goals fit your budget right now.' : 'No goals entered.');
    var cards = el('div', { class: 'pv-cards' });
    var remaining = sum0.freeCashMonthly || 0;
    gl.forEach(function (g) {
      var sg = (inputs.goals || []).filter(function (x) { return x.name === g.name; })[0] || {};
      var saved = sg.saved || 0, frac = g.cashNeeded ? Math.max(0, Math.min(1, saved / g.cashNeeded)) : 0;
      var avail = Math.max(0, remaining), gap = Math.max(0, g.monthly - avail);
      remaining -= g.monthly;
      var mx = Math.max(g.monthly, avail, 1);
      var card = el('div', { class: 'pv-card' }, [
        el('h3', null, [icon(goalIcon(sg.type, g.name)), txt('span', g.name)]),
        txt('p', 'Needs ' + money(g.cashNeeded) + ', starting ' + monthYear(g.startMonth, now) + '.', 'pv-sub'),
        el('div', { class: 'pv-meter', role: 'img', 'aria-label': money(saved) + ' of ' + money(g.cashNeeded) + ' saved' }, [el('i', { style: 'width:' + Math.round(frac * 100) + '%' })]),
        txt('p', money(saved) + ' of ' + money(g.cashNeeded) + ' saved', 'pv-sub')]);
      var pair = el('div', { class: 'pv-pair' }, [
        txt('span', 'Needed / mo'), el('div', { style: 'display:flex;gap:8px;align-items:center' }, [el('div', { class: 'pv-bar', style: 'width:' + Math.max(2, g.monthly / mx * 70) + '%;background:var(--pv-s1)' }), txt('b', money(g.monthly))]),
        txt('span', 'Available / mo'), el('div', { style: 'display:flex;gap:8px;align-items:center' }, [el('div', { class: 'pv-bar', style: 'width:' + Math.max(2, avail / mx * 70) + '%;background:var(--pv-s3)' }), txt('b', money(avail))])]);
      card.appendChild(pair);
      card.appendChild(el('div', { class: 'pv-status ' + (g.feasible ? 'ok' : 'no') }, [icon(g.feasible ? 'check-circle' : 'alert-triangle'),
        txt('span', g.feasible ? 'Feasible' : 'Not feasible yet' + (gap > 0 ? ': short ' + money(gap) + ' a month' : ''))]));
      card.appendChild(txt('p', g.note, 'pv-sub'));
      cards.appendChild(card);
    });
    if (gl.length) gs.appendChild(cards);
    root.appendChild(gs);

    // 8 accounts
    var accts = plan.accounts || [];
    var ac = section('accounts', 'bank', 'Accounts to open or change', accts.length ? accts.length + ' accounts, in the order to tackle them.' : '');
    var stp = el('ol', { class: 'pv-stepper' });
    accts.forEach(function (a) {
      stp.appendChild(el('li', null, [txt('span', String(a.priority), 'pv-num'), el('div', null, [
        el('div', { class: 't' }, [icon(acctIcon(a)), txt('span', a.account), avatar(a.owner)]),
        txt('div', a.action, 'pv-sub'),
        txt('div', a.limit2026 ? '2026 limit: ' + money(a.limit2026) : '', 'pv-sub')])]));
    });
    ac.appendChild(stp);
    var at = el('div', { class: 'pv-acct-table' }, [table(['Priority', 'Who', 'Account', 'Action', '2026 limit'], accts.map(function (a) {
      return el('tr', null, [td(String(a.priority), true), td(inline([avatar(a.owner), document.createTextNode(a.owner || '')])), td(inline([icon(acctIcon(a)), document.createTextNode(a.account)])), td(a.action), td(a.limit2026 ? money(a.limit2026) : 'n/a', true)]);
    }), [0, 4])]);
    ac.appendChild(at);
    root.appendChild(ac);

    // 9 invest
    var al = plan.allocation || {};
    var pen = proj.pension || 0, wr = (inputs.assumptions && inputs.assumptions.withdrawalRate) || 0.04;
    var iv = section('invest', 'pie', 'What to invest in', pct(al.stockPct, 0) + ' stocks and ' + pct(al.bondPct, 0) + ' bonds. ' +
      (al.option === 'target_date' ? 'One target-date fund for ' + al.targetYear + ' does it all.' : 'A simple three-fund mix does it all.'));
    var bal = proj.balanceAtRetirement || 0;
    var penCap = pen > 0 ? pen / wr : 0;
    var totalCap = bal + penCap || 1;
    var overallStock = bal * (al.stockPct || 0) / totalCap;
    var dparts = [
      { name: 'Stocks', v: al.stockPct || 0, color: 'var(--pv-s1)' },
      { name: 'Bonds', v: al.bondPct || 0, color: 'var(--pv-s2)' }];
    var donut = sv('svg', { class: 'pv-donut', viewBox: '0 0 180 180', width: '180', height: '180', role: 'group', 'aria-label': 'Investment mix: ' + dparts.map(function (p) { return p.name + ' ' + Math.round(p.v * 100) + '%'; }).join(', ') });
    var C = 2 * Math.PI * 64, cum = 0;
    dparts.forEach(function (p) {
      var len = Math.max(0, p.v * C - 2);
      var c = sv('circle', { cx: 90, cy: 90, r: 64, fill: 'none', 'stroke-width': '26', 'stroke-dasharray': len + ' ' + (C - len), 'stroke-dashoffset': -cum, transform: 'rotate(-90 90 90)', style: 'stroke:' + p.color });
      cum += p.v * C;
      tip.attach(c, function () { return { title: p.name, rows: [{ color: p.color, name: 'of your investments', value: Math.round(p.v * 100) + '%' }] }; });
      donut.appendChild(c);
    });
    donut.appendChild(sv('text', { x: 90, y: 92, 'text-anchor': 'middle', 'font-size': '28', 'font-weight': '700', style: 'fill:var(--pv-tx)' }, Math.round(dparts[0].v * 100) + '%'));
    donut.appendChild(sv('text', { x: 90, y: 112, 'text-anchor': 'middle', 'font-size': '12', style: 'fill:var(--pv-tx2)' }, 'stocks'));
    var al1 = el('div', { class: 'pv-alloc' }, [donut, el('div', null, [
      legend(dparts.map(function (p) { return { name: p.name + ' ' + Math.round(p.v * 100) + '%', color: p.color }; })),
      txt('p', 'Your investments alone: ' + pct(al.stockPct, 0) + ' stocks, ' + pct(al.bondPct, 0) + ' bonds.', 'pv-sub'),
      al.note ? txt('p', al.note, 'pv-sub') : null])]);
    iv.appendChild(al1);
    if (penCap) {
      iv.appendChild(el('p', { class: 'pv-pencap' }, [icon('shield'),
        txt('span', 'Pension counts like bonds: counting it, the whole picture is about ' + Math.round(overallStock * 100) + '% stocks')]));
    }
    if ((al.examples || []).length) {
      var fd = el('details', { id: 'pv-funds-details' }, [el('summary', null, [icon('chevron-down'), txt('span', 'Example funds by provider')])]);
      fd.appendChild(table(['Provider', 'Example fund'], al.examples.map(function (e) { return el('tr', null, [td(e.provider), td(e.fund)]); })));
      iv.appendChild(fd);
    }
    root.appendChild(iv);

    // 10 outlook
    var ro = section('outlook', 'trending', 'Retirement outlook',
      'At ' + (retireAge || 'retirement') + ' you could have ' + money(proj.balanceAtRetirement) + ', about ' + pct(proj.replacementPct, 0) + ' of today\'s pay.');
    var otiles = el('div', { class: 'pv-tiles' });
    [['piggy', 'Balance at retirement', money(proj.balanceAtRetirement)], ['trending', 'Yearly income from investments', money(proj.incomeFromInvestments)],
      ['shield', 'Pension', money(proj.pension)], ['users', 'Social Security', money(proj.socialSecurity)],
      ['dollar', 'Total yearly income', money(proj.totalIncome)], ['target', 'Replaces your pay', pct(proj.replacementPct, 0)]].forEach(function (t) {
      otiles.appendChild(el('div', { class: 'pv-tile' }, [el('div', { class: 'l' }, [icon(t[0]), txt('span', t[1])]), txt('span', t[2], 'v')]));
    });
    ro.appendChild(otiles);
    var yrsArr = proj.years || [];
    var sc = proj.scenarios || {};
    var waitN = (inputs.assumptions && inputs.assumptions.waitYearsComparison) || 10;
    if (yrsArr.length) {
      ro.appendChild(txt('h3', 'Balance by age'));
      var ages = yrsArr.map(function (y) { return y.age; });
      var adds = yrsArr.map(function (y) { return y.end - y.start - y.growth; });
      function simR(r) { var b = 0; return adds.map(function (a) { b = b * (1 + r) + a; return b; }); }
      var band = sc.worst && sc.best ? { lo: simR(sc.worst.realReturn), hi: simR(sc.best.realReturn), color: 'var(--pv-s1)', loName: 'Worse case', hiName: 'Better case' } : null;
      var ch = el('div', { class: 'pv-chartbox' });
      ro.appendChild(ch);
      mount(ch, function (w) {
        return lineChart({ w: w, h: w < 500 ? 320 : 420, id: 'pv-outchart', xs: ages,
          series: [{ name: 'Start now', color: 'var(--pv-s1)', vals: yrsArr.map(function (y) { return y.end; }) },
            { name: 'Wait ' + waitN + ' years', color: 'var(--pv-s2)', vals: yrsArr.map(function (y) { return y.waitEnd; }) }],
          band: band, xTicks: ticksFor(ages[0], ages[ages.length - 1], w < 500 ? 5 : 9), xTitle: 'Age', xFmt: function (a) { return 'Age ' + a; },
          endLabel: function () { return money(proj.balanceAtRetirement); },
          title: 'Projected balance by age in today\'s dollars',
          desc: 'Starting now ends at ' + money(yrsArr[yrsArr.length - 1].end) + '; waiting ' + waitN + ' years ends at ' + money(yrsArr[yrsArr.length - 1].waitEnd) + '.' }, tip);
      });
      ro.appendChild(legend([{ name: 'Start now', color: 'var(--pv-s1)', line: true }, { name: 'Wait ' + waitN + ' years', color: 'var(--pv-s2)', line: true }]
        .concat(band ? [{ name: 'Worse to better markets (' + pct(sc.worst.realReturn, 0) + ' to ' + pct(sc.best.realReturn, 0) + ')', color: 'var(--pv-s1)', opacity: 0.3 }] : [])));
    }
    // income stack
    ro.appendChild(txt('h3', 'Yearly income at retirement'));
    var inc = [{ name: 'Investments', value: proj.incomeFromInvestments || 0, color: 'var(--pv-s1)' }, { name: 'Pension', value: proj.pension || 0, color: 'var(--pv-s2)' },
      { name: 'Social Security', value: proj.socialSecurity || 0, color: 'var(--pv-s3)' }];
    var today = sum0.combinedIncome || 0, scale = Math.max(proj.totalIncome || 0, today) * 1.05 || 1;
    var wrap = el('div', { class: 'pv-income' });
    var mk = el('div', { class: 'pv-marker', style: 'left:' + Math.min(100, today / scale * 100) + '%' }, [txt('span', 'Today ' + money(today))]);
    mk.firstChild.style.left = '0';
    var segw = el('div', { style: 'width:' + ((proj.totalIncome || 0) / scale * 100) + '%' }, [segBar(inc, tip, money, 'Retirement income by source')]);
    wrap.appendChild(mk); wrap.appendChild(segw);
    ro.appendChild(wrap);
    ro.appendChild(legend(inc.map(function (p) { return { name: p.name, color: p.color }; })));
    ro.appendChild(txt('p', 'Replaces ' + pct(proj.replacementPct, 0) + ' of today\'s pay. Without the pension: ' + money(proj.withoutPension) + ' a year (' + pct(proj.withoutPensionPct, 0) + ').', 'pv-sub'));
    // wait comparison
    ro.appendChild(txt('h3', 'Start now or wait ' + waitN + ' years'));
    var mxb = Math.max(proj.balanceAtRetirement || 0, proj.waitBalance || 0, 1);
    [['Start now', proj.balanceAtRetirement, 'var(--pv-s1)'], ['Wait ' + waitN + ' years', proj.waitBalance, 'var(--pv-s2)']].forEach(function (r) {
      var b = el('div', { class: 'pv-bar', style: 'width:' + (r[1] / mxb * 100) + '%;background:' + r[2] });
      tip.attach(b, function () { return { title: r[0], rows: [{ color: r[2], name: 'at retirement', value: money(r[1]) }] }; });
      ro.appendChild(el('div', { class: 'pv-cmp' }, [txt('span', r[0]), el('div', { style: 'display:flex;align-items:center;gap:8px' }, [el('div', { style: 'width:' + Math.max(1, r[1] / mxb * 62) + '%' }, [b]), txt('b', money(r[1]))])]));
    });
    ro.appendChild(el('p', { class: 'pv-status no' }, [icon('alert-triangle'), txt('span', 'Cost of waiting: ' + money(proj.costOfWaiting))]));
    var scRows = [['worst', 'Worse'], ['base', 'Expected'], ['better', 'Better']];
    scRows[2] = ['best', 'Better'];
    ro.appendChild(txt('h3', 'If markets do worse or better'));
    ro.appendChild(table(['Scenario', 'Real return', 'Balance at retirement'], scRows.filter(function (k) { return sc[k[0]]; }).map(function (k) {
      return el('tr', null, [td(k[1]), td(pct(sc[k[0]].realReturn, 1), true), td(money(sc[k[0]].balance), true)]);
    }), [1, 2]));
    if (yrsArr.length) {
      var det = el('details', { id: 'pv-projection-details' }, [el('summary', null, [icon('chevron-down'), txt('span', 'Full year-by-year projection')])]);
      det.appendChild(table(['Year', 'Age', 'Phase', 'Pay', 'Contribution', 'Match', 'Start', 'Growth', 'End', 'If you wait'],
        yrsArr.map(function (y) {
          return el('tr', null, [td(String(y.year), true), td(String(y.age), true), td(String(y.phase).replace(/_/g, ' ')), td(money(y.pay), true),
            td(money(y.contrib), true), td(money(y.match), true), td(money(y.start), true), td(money(y.growth), true), td(money(y.end), true), td(money(y.waitEnd), true)]);
        }), [0, 1, 3, 4, 5, 6, 7, 8, 9]));
      ro.appendChild(det);
    }
    root.appendChild(ro);

    // 11 protection
    var pr = section('protection', 'umbrella', 'Protection checklist', 'Cheap steps that protect everything above.');
    var pl = el('ul', { class: 'pv-list' });
    (plan.protection || []).forEach(function (p, i) {
      var id = 'pv-prot-' + i;
      pl.appendChild(el('li', null, [el('input', { type: 'checkbox', id: id }), icon(protIcon(p.item)), el('label', { for: id }, [txt('strong', p.item + ': '), p.text])]));
    });
    pr.appendChild(pl);
    root.appendChild(pr);

    // 12 limits
    var lim = plan.limits || {}, l26 = lim.y2026 || {}, l27 = lim.y2027projected || {};
    var foot = el('section', { id: 'pv-limits', 'data-section': 'limits', class: 'pv-foot' });
    foot.appendChild(el('div', { class: 'pv-sh' }, [icon('info'), txt('h2', 'Limits and sources')]));
    foot.appendChild(txt('p', '2026 limits: 401(k) ' + money(l26.k401) + ', IRA ' + money(l26.ira) + ', HSA family ' + money(l26.hsaFamily) + ', HSA single ' + money(l26.hsaSingle) + '.'));
    foot.appendChild(txt('p', '2027 projected (not official): 401(k) ' + money(l27.k401) + ', IRA ' + money(l27.ira) + '.'));
    foot.appendChild(txt('p', 'Limits updated ' + (lim.updated || 'unknown') + '. All figures are estimates in today\'s dollars. This is an educational tool, not financial, tax or legal advice.'));
    root.appendChild(foot);

    pending.forEach(function (f) { f(); });
  }

  // Open every <details> for printing, then put them back the way the reader had them.
  var printOpened = [];
  window.addEventListener('beforeprint', function () {
    printOpened = [];
    Array.prototype.forEach.call(document.querySelectorAll('.pv details'), function (d) {
      if (!d.open) { d.open = true; printOpened.push(d); }
    });
  });
  window.addEventListener('afterprint', function () {
    printOpened.forEach(function (d) { d.open = false; });
    printOpened = [];
  });

  window.PlanView = { render: render, _fmt: { money: money, pct: pct } };
})();

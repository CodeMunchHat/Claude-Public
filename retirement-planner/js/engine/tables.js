/* Tax brackets, limits and thresholds. Plain classic script; also loads under Node (CommonJS). */
(function (root) {
  var T = {
    updated: '2026-11-07',
    source: 'IRS Rev. Proc. 2025-32 (2026 brackets and standard deduction); IRS Notice 2025-67 (2026 retirement limits); IRS Rev. Proc. 2025-19 (2026 HSA). 2027 values are projections.',
    standardDeduction: { single: 16100, mfj: 32200 }, // 2026 IRS values
    // [upper bound of taxable income, rate]. Income exactly at a bound is taxed in the lower bracket.
    brackets: {
      single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
      mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]]
    },
    fica: 0.0765,
    highAprThreshold: 0.07,
    retireTargetPct: 0.15,
    limits: {
      y2026: { k401: 24500, ira: 7500, hsaFamily: 8750, hsaSingle: 4400 },
      y2027projected: { k401: 25500, ira: 7500, hsaFamily: 8750, hsaSingle: 4400, projected: true }
    },
    // Approximate flat effective state income tax rates (share of income after pre-tax contributions).
    stateRates: {
      AL: 0.04, AK: 0, AZ: 0.025, AR: 0.04, CA: 0.05, CO: 0.044, CT: 0.05, DE: 0.05, DC: 0.06, FL: 0, GA: 0.05, HI: 0.06,
      ID: 0.053, IL: 0.0495, IN: 0.03, IA: 0.038, KS: 0.05, KY: 0.04, LA: 0.03, ME: 0.06, MD: 0.05, MA: 0.05, MI: 0.0425,
      MN: 0.06, MS: 0.044, MO: 0.047, MT: 0.05, NE: 0.05, NV: 0, NH: 0, NJ: 0.045, NM: 0.04, NY: 0.055, NC: 0.0425,
      ND: 0.02, OH: 0.03, OK: 0.04, OR: 0.08, PA: 0.0307, RI: 0.045, SC: 0.05, SD: 0, TN: 0, TX: 0, UT: 0.045, VT: 0.05,
      VA: 0.05, WA: 0, WV: 0.04, WI: 0.05, WY: 0
    },
    workplaceTypes: ['401k', '403b', '457b', 'tsp']
  };

  T.filingStatus = function (married) { return married ? 'mfj' : 'single'; };
  T.stateRate = function (code) {
    var r = T.stateRates[String(code || '').toUpperCase()];
    return typeof r === 'number' ? r : 0.04; // unknown state: assume a middle value
  };
  T.taxableIncome = function (gross, pretax, status) {
    return Math.max(0, gross - pretax - T.standardDeduction[status]);
  };
  T.federalTax = function (taxable, status) {
    var b = T.brackets[status], prev = 0, tax = 0, i;
    for (i = 0; i < b.length; i++) {
      if (taxable > prev) tax += (Math.min(taxable, b[i][0]) - prev) * b[i][1];
      prev = b[i][0];
    }
    return tax;
  };
  T.marginalRate = function (taxable, status) {
    var b = T.brackets[status], i;
    for (i = 0; i < b.length; i++) if (taxable <= b[i][0]) return b[i][1];
    return b[b.length - 1][1];
  };
  // 'roth' (<=12%), 'either_lean_roth' (22%), 'traditional' (>=24%)
  T.rothAdvice = function (marginal) {
    if (marginal <= 0.12 + 1e-9) return 'roth';
    if (marginal >= 0.24 - 1e-9) return 'traditional';
    return 'either_lean_roth';
  };
  T.workplaceLabel = function (t) { return ({ '401k': '401(k)', '403b': '403(b)', '457b': '457(b)', tsp: 'TSP' })[t] || t; };
  T.money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  T.pct = function (f, d) { return (f * 100).toFixed(d == null ? 0 : d).replace(/\.0+$/, '') + '%'; };

  root.Planner = root.Planner || {};
  root.Planner.tables = T;
  if (typeof module !== 'undefined') module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);

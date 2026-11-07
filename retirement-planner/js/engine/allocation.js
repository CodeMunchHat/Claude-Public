/* Investment mix suggestion. */
(function (root) {
  var STOCK = { hold_or_buy: 0.9, nervous_hold: 0.8, sell: 0.6 };

  function build(opts) {
    // opts: dropReaction, currentYear, yearsToRetire, hasPension
    var stock = STOCK[opts.dropReaction] != null ? STOCK[opts.dropReaction] : 0.8;
    var targetYear = Math.round((opts.currentYear + opts.yearsToRetire) / 5) * 5;
    var examples = [
      { provider: 'Fidelity', fund: 'FFIJX', kind: 'target_date', label: 'Target-date index fund (example; pick the year closest to ' + targetYear + ')' },
      { provider: 'Fidelity', fund: 'FSKAX', kind: 'us_stock', label: 'Total U.S. stock market index' },
      { provider: 'Fidelity', fund: 'FTIHX', kind: 'intl_stock', label: 'Total international stock index' },
      { provider: 'Fidelity', fund: 'FXNAX', kind: 'bond', label: 'U.S. bond index' },
      { provider: 'Vanguard', fund: 'VFFVX', kind: 'target_date', label: 'Target-date fund (example; pick the year closest to ' + targetYear + ')' },
      { provider: 'Vanguard', fund: 'VTSAX', kind: 'us_stock', label: 'Total U.S. stock market index' },
      { provider: 'Vanguard', fund: 'VTIAX', kind: 'intl_stock', label: 'Total international stock index' },
      { provider: 'Vanguard', fund: 'VBTLX', kind: 'bond', label: 'Total bond market index' },
      { provider: 'Schwab', fund: 'SWYOX', kind: 'target_date', label: 'Target-date index fund (example; pick the year closest to ' + targetYear + ')' },
      { provider: 'Schwab', fund: 'SWTSX', kind: 'us_stock', label: 'Total U.S. stock market index' },
      { provider: 'Schwab', fund: 'SWISX', kind: 'intl_stock', label: 'International index' },
      { provider: 'Schwab', fund: 'SWAGX', kind: 'bond', label: 'U.S. aggregate bond index' }
    ];
    var note = 'Simplest choice: one target-date fund for about ' + targetYear + ' in each account. If you prefer three funds, split roughly ' +
      Math.round(stock * 70) + '% U.S. stock, ' + Math.round(stock * 30) + '% international stock, ' + Math.round((1 - stock) * 100) +
      '% bonds. The funds listed are examples, not recommendations; look for index funds with fees under 0.20% a year. ' +
      'Target-date funds shift toward bonds on their own as you near the date.';
    if (opts.hasPension) note += ' Your pension acts like a bond allocation (steady, guaranteed income), which is one reason a stock-heavy mix can make sense for the rest.';
    return {
      stockPct: stock, bondPct: Math.round((1 - stock) * 100) / 100, option: 'target_date', targetYear: targetYear,
      threeFund: { usStockPct: Math.round(stock * 70) / 100, intlStockPct: Math.round(stock * 30) / 100, bondPct: Math.round((1 - stock) * 100) / 100 },
      examples: examples, note: note
    };
  }

  var api = { build: build, STOCK: STOCK };
  root.Planner = root.Planner || {};
  root.Planner.allocation = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

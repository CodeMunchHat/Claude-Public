/* Goal funding math (safe-asset yield, monthly compounding). */
(function (root) {
  function growth(yearlyYield, months) { return Math.pow(1 + yearlyYield / 12, months); }

  // Monthly deposit needed to reach `target` in `months`, given `saved` already set aside.
  function monthlyNeeded(target, months, yearlyYield, saved) {
    months = Math.max(1, Math.round(months));
    var i = yearlyYield / 12, g = growth(yearlyYield, months);
    var need = Math.max(0, target - (saved || 0) * g);
    if (need === 0) return 0;
    return i === 0 ? need / months : need * i / (g - 1);
  }
  // Cash a monthly deposit builds over `months` (including grown `saved`).
  function cashFromMonthly(monthly, months, yearlyYield, saved) {
    months = Math.max(0, Math.round(months));
    var i = yearlyYield / 12, g = growth(yearlyYield, months);
    return (saved || 0) * g + (i === 0 ? monthly * months : monthly * (g - 1) / i);
  }
  function cashNeeded(goal) {
    if (goal.type === 'house') return (goal.targetPrice || 0) * ((goal.downPct || 0) + (goal.closingPct || 0));
    return goal.amount || 0;
  }
  // Smallest delay (months) so that `monthly` is enough, or null if more than 360.
  function delayToFit(target, months, monthly, yearlyYield, saved) {
    for (var d = 0; d <= 360; d++) {
      if (monthlyNeeded(target, months + d, yearlyYield, saved) <= monthly + 1e-9) return d;
    }
    return null;
  }

  /**
   * needs(goals, startMonth, safeYield) -> per goal required monthly deposit.
   * Goal saving begins at startMonth, so the remaining months shrink by startMonth.
   */
  function needs(goals, startMonth, safeYield) {
    return (goals || []).map(function (g) {
      var cash = cashNeeded(g);
      var total = Math.round((g.years || 0) * 12);
      var remaining = total - startMonth;
      var late = remaining < 1;
      var months = Math.max(1, remaining);
      return {
        goal: g, name: g.name || g.type, type: g.type, cash: cash, saved: g.saved || 0,
        totalMonths: total, months: months, late: late,
        required: monthlyNeeded(cash, months, safeYield, g.saved || 0)
      };
    });
  }

  var api = { monthlyNeeded: monthlyNeeded, cashFromMonthly: cashFromMonthly, cashNeeded: cashNeeded, delayToFit: delayToFit, needs: needs };
  root.Planner = root.Planner || {};
  root.Planner.goals = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

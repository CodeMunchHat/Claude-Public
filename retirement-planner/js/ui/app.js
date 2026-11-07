/* Wires the questionnaire to the engine and the plan page. */
(function () {
  'use strict';
  var qEl, pEl, lastInputs = null;

  function friendly(msg) { Questionnaire.setStatus(msg, true); }

  function build() {
    var v = Questionnaire.validateAll();
    if (!v.valid) return false;
    var inputs = Questionnaire.getInputs();
    if (!window.Planner || typeof window.Planner.buildPlan !== 'function') {
      friendly('The planning engine did not load, so the plan cannot be built. Make sure the js/engine files are next to index.html and reload.');
      return false;
    }
    if (!window.PlanView || typeof window.PlanView.render !== 'function') {
      friendly('The plan page did not load. Make sure js/ui/plan.js is next to index.html and reload.');
      return false;
    }
    var plan;
    try { plan = window.Planner.buildPlan(inputs); }
    catch (e) { friendly('Something went wrong building your plan (' + (e && e.message ? e.message : e) + '). Please check your answers and try again.'); return false; }
    lastInputs = inputs;
    pEl.innerHTML = '';
    try { window.PlanView.render(plan, inputs, pEl); }
    catch (e2) { friendly('Your plan was built but could not be displayed (' + (e2 && e2.message ? e2.message : e2) + ').'); return false; }
    qEl.hidden = true;
    pEl.hidden = false;
    window.scrollTo(0, 0);
    return true;
  }

  window.App = {
    init: function () {
      qEl = document.getElementById('questionnaire');
      pEl = document.getElementById('plan-view');
      Questionnaire.init(qEl, { onBuild: build });
    },
    showQuestionnaire: function () {
      pEl.hidden = true;
      qEl.hidden = false;
      window.scrollTo(0, 0);
    },
    buildPlan: build
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.App.init);
  else window.App.init();
})();

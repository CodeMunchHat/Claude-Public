/* Save / load the questionnaire inputs as a JSON file. No localStorage. */
(function () {
  'use strict';
  var REQUIRED = ['household', 'accounts', 'cash', 'debts', 'goals', 'risk', 'assumptions'];

  function validate(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return 'This file is not a plan inputs file.';
    if (obj.version !== 1) return 'Unsupported file version (expected version 1).';
    for (var i = 0; i < REQUIRED.length; i++) {
      if (obj[REQUIRED[i]] == null) return 'The file is missing "' + REQUIRED[i] + '".';
    }
    if (!Array.isArray(obj.household.people) || !obj.household.people.length) return 'The file has no household people.';
    if (!Array.isArray(obj.accounts) || !Array.isArray(obj.debts) || !Array.isArray(obj.goals)) return 'Accounts, debts and goals must be lists.';
    return '';
  }

  var api = {
    validate: validate,
    download: function (inputs) {
      var blob = new Blob([JSON.stringify(inputs, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'retirement-plan-inputs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },
    load: function (file) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onerror = function () { reject(new Error('Could not read that file.')); };
        r.onload = function () {
          var obj;
          try { obj = JSON.parse(r.result); } catch (e) { return reject(new Error('That file is not valid JSON.')); }
          var err = validate(obj);
          if (err) reject(new Error(err)); else resolve(obj);
        };
        r.readAsText(file);
      });
    }
  };
  // Deliberately replaces the built-in window.Storage interface object (unused by this app).
  window.Storage = api;
})();

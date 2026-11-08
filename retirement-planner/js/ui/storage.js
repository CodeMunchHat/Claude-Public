/* Save / load the questionnaire inputs as a file. No localStorage.
   Saved files are encrypted with a user passphrase (js/ui/crypto.js); plain JSON still loads. */
(function () {
  'use strict';
  var REQUIRED = ['household', 'accounts', 'cash', 'debts', 'goals', 'risk', 'assumptions'];
  var MIN_PASS = 8;
  var PLAIN_NAME = 'retirement-plan-inputs.json';
  var ENC_NAME = 'retirement-plan-inputs.enc.json';

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

  /* ---------- dialog ---------- */
  var CSS = [
    'dialog.rp-dlg{border:1px solid var(--border,#c9d1da);border-radius:10px;background:var(--surface,#fff);color:var(--text,#1b1f24);padding:0;width:min(440px,calc(100vw - 32px));max-width:none;font:inherit}',
    'dialog.rp-dlg::backdrop{background:rgba(0,0,0,.5)}',
    '.rp-dlg form{padding:16px;display:flex;flex-direction:column;gap:12px;margin:0}',
    '.rp-dlg h2{margin:0;font-size:1.15rem;display:flex;align-items:center;gap:8px}',
    '.rp-dlg .rp-ico{width:24px;height:24px;flex:none}',
    '.rp-dlg .rp-warn{margin:0;font-size:.92rem;color:var(--muted,#5a6572)}',
    '.rp-dlg label{display:block;font-weight:600;margin:0 0 4px}',
    '.rp-dlg .rp-row{display:flex;gap:6px;align-items:stretch}',
    '.rp-dlg input{flex:1 1 auto;min-width:0;font:inherit;padding:8px 10px;border:1px solid var(--border,#c9d1da);border-radius:6px;background:var(--surface,#fff);color:inherit}',
    '.rp-dlg input:focus-visible,.rp-dlg button:focus-visible{outline:3px solid var(--focus,#2a78d6);outline-offset:2px}',
    '.rp-dlg .rp-eye{flex:none;width:44px;border:1px solid var(--border,#c9d1da);border-radius:6px;background:none;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}',
    '.rp-dlg .rp-err{margin:0;min-height:1.3em;color:var(--bad,#b3261e);font-weight:600;overflow-wrap:anywhere}',
    '.rp-dlg .rp-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
    '.rp-dlg .rp-actions button{font:inherit;padding:8px 16px;min-height:44px;border-radius:6px;border:1px solid var(--border,#c9d1da);background:none;color:inherit;cursor:pointer}',
    '.rp-dlg .rp-actions button.rp-go{background:var(--accent,#1F3A5F);color:var(--on-accent,#fff);border-color:var(--accent,#1F3A5F);font-weight:600}',
    '.rp-dlg .rp-actions button:disabled{opacity:.5;cursor:wait}',
    '.rp-dlg .rp-plain{align-self:flex-start;border:0;background:none;color:var(--link,#2a78d6);text-decoration:underline;cursor:pointer;font:inherit;font-size:.9rem;padding:8px 0;min-height:44px}'
  ].join('\n');
  var EYE = '<svg class="rp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg class="rp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
  var LOCK = '<svg class="rp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var uid = 0;

  /* cfg: {title, warn, fields:[{label, autocomplete}], go, plain(optional), check(values)->error string,
     submit(values)->Promise (reject => inline error, stay open)}. Resolves {kind:'ok'|'plain', value} or null on cancel. */
  function openDialog(cfg) {
    if (!document.getElementById('rp-dlg-css')) {
      var st = document.createElement('style'); st.id = 'rp-dlg-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    return new Promise(function (resolve) {
      var n = ++uid;
      var dlg = document.createElement('dialog');
      dlg.className = 'rp-dlg';
      dlg.setAttribute('aria-labelledby', 'rp-t' + n);
      var h = '<form method="dialog" novalidate><h2 id="rp-t' + n + '">' + LOCK + '<span>' + esc(cfg.title) + '</span></h2>';
      if (cfg.warn) h += '<p class="rp-warn">' + esc(cfg.warn) + '</p>';
      cfg.fields.forEach(function (f, i) {
        h += '<div><label for="rp-f' + n + '-' + i + '">' + esc(f.label) + '</label><div class="rp-row"><input type="password" id="rp-f' + n + '-' + i +
          '" autocomplete="' + f.autocomplete + '" spellcheck="false" autocapitalize="off">' +
          (i === 0 ? '<button type="button" class="rp-eye" aria-label="Show passphrase" aria-pressed="false" title="Show passphrase">' + EYE + '</button>' : '') + '</div></div>';
      });
      h += '<p class="rp-err" role="alert"></p><div class="rp-actions"><button type="button" class="rp-cancel">Cancel</button><button type="submit" class="rp-go">' + esc(cfg.go) + '</button></div>';
      if (cfg.plain) h += '<button type="button" class="rp-plain">' + esc(cfg.plain) + '</button>';
      h += '</form>';
      dlg.innerHTML = h;
      document.body.appendChild(dlg);

      var inputs = Array.prototype.slice.call(dlg.querySelectorAll('input'));
      var err = dlg.querySelector('.rp-err');
      var go = dlg.querySelector('.rp-go');
      var done = false;
      function finish(res) {
        if (done) return; done = true;
        if (dlg.open) dlg.close();
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        resolve(res);
      }
      var eye = dlg.querySelector('.rp-eye');
      if (eye) eye.addEventListener('click', function () {
        var show = inputs[0].type === 'password';
        inputs.forEach(function (i) { i.type = show ? 'text' : 'password'; });
        eye.innerHTML = show ? EYE_OFF : EYE;
        eye.setAttribute('aria-pressed', show ? 'true' : 'false');
        var l = show ? 'Hide passphrase' : 'Show passphrase';
        eye.setAttribute('aria-label', l); eye.title = l;
      });
      dlg.querySelector('.rp-cancel').addEventListener('click', function () { finish(null); });
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); finish(null); });
      var plain = dlg.querySelector('.rp-plain');
      if (plain) plain.addEventListener('click', function () { finish({ kind: 'plain' }); });
      dlg.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var vals = inputs.map(function (i) { return i.value; });
        var msg = cfg.check ? cfg.check(vals) : '';
        if (msg) { err.textContent = msg; var bad = inputs[vals.length > 1 && vals[0].length >= MIN_PASS ? 1 : 0]; bad.focus(); return; }
        err.textContent = '';
        go.disabled = true;
        Promise.resolve().then(function () { return cfg.submit(vals); }).then(function (value) {
          finish({ kind: 'ok', value: value });
        }, function (ex) {
          go.disabled = false;
          err.textContent = ex && ex.message ? ex.message : 'Something went wrong.';
          inputs[0].focus(); inputs[0].select();
        });
      });
      dlg.showModal();
      inputs[0].focus();
    });
  }

  function saveBlob(text, name) {
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var api = {
    validate: validate,
    /* Resolves {encrypted:boolean, filename} or null if the user cancelled. */
    download: function (inputs) {
      return openDialog({
        title: 'Encrypt and save inputs',
        warn: 'Keep this passphrase safe. A lost passphrase cannot be recovered.',
        fields: [{ label: 'Passphrase', autocomplete: 'new-password' }, { label: 'Confirm passphrase', autocomplete: 'new-password' }],
        go: 'Save',
        plain: 'Save without encryption',
        check: function (v) {
          if (v[0].length < MIN_PASS) return 'Use at least ' + MIN_PASS + ' characters.';
          if (v[0] !== v[1]) return 'The two passphrases do not match.';
          return '';
        },
        submit: function (v) {
          return window.PlanCrypto.encrypt(inputs, v[0]).then(function (text) { saveBlob(text, ENC_NAME); return { encrypted: true, filename: ENC_NAME }; });
        }
      }).then(function (r) {
        if (!r) return null;
        if (r.kind === 'plain') { saveBlob(JSON.stringify(inputs, null, 2), PLAIN_NAME); return { encrypted: false, filename: PLAIN_NAME }; }
        return r.value;
      });
    },
    load: function (file) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onerror = function () { reject(new Error('Could not read that file.')); };
        r.onload = function () {
          var text = r.result;
          function finishObj(obj) {
            var err = validate(obj);
            if (err) reject(new Error(err)); else resolve(obj);
          }
          if (window.PlanCrypto && window.PlanCrypto.isEncrypted(text)) {
            openDialog({
              title: 'Unlock saved inputs',
              fields: [{ label: 'Passphrase', autocomplete: 'current-password' }],
              go: 'Unlock',
              check: function (v) { return v[0] ? '' : 'Enter the passphrase.'; },
              submit: function (v) {
                return window.PlanCrypto.decrypt(text, v[0]).catch(function (ex) {
                  if (ex && /not available/.test(ex.message)) throw ex;
                  throw new Error('Wrong passphrase or damaged file');
                });
              }
            }).then(function (res) {
              if (!res) reject(new Error('Load cancelled.')); else finishObj(res.value);
            });
            return;
          }
          var obj;
          try { obj = JSON.parse(text); } catch (e) { return reject(new Error('That file is not valid JSON.')); }
          finishObj(obj);
        };
        r.readAsText(file);
      });
    }
  };
  // Deliberately replaces the built-in window.Storage interface object (unused by this app).
  window.Storage = api;
})();

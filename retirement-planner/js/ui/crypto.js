/* Passphrase encryption for the saved inputs file. Web Crypto only (no libraries, no network).
   PBKDF2-SHA256 (200000 iterations, 16-byte salt) -> AES-256-GCM (12-byte IV). */
(function (root) {
  'use strict';
  var FORMAT = 'rp-enc-1';
  var ITER = 200000;

  function subtle() {
    var c = root.crypto;
    if (!c || !c.subtle) {
      throw new Error('Encryption is not available in this browser here (it needs a secure page). Save without encryption, or open the planner over https.');
    }
    return c;
  }
  function b64(buf) {
    var bytes = new Uint8Array(buf), s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function deriveKey(c, passphrase, salt, iterations) {
    var enc = new TextEncoder();
    return c.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return c.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations },
        base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }

  function encrypt(obj, passphrase) {
    return Promise.resolve().then(function () {
      var c = subtle();
      var salt = c.getRandomValues(new Uint8Array(16));
      var iv = c.getRandomValues(new Uint8Array(12));
      return deriveKey(c, passphrase, salt, ITER).then(function (key) {
        return c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
      }).then(function (ct) {
        return JSON.stringify({ format: FORMAT, kdf: 'PBKDF2-SHA256', iterations: ITER, salt: b64(salt), iv: b64(iv), data: b64(ct) }, null, 2);
      });
    });
  }

  function decrypt(text, passphrase) {
    return Promise.resolve().then(function () {
      var c = subtle();
      var env = JSON.parse(text);
      if (!env || env.format !== FORMAT) throw new Error('Not an encrypted plan file.');
      var iterations = env.iterations;
      if (typeof iterations !== 'number' || iterations < 1 || iterations > 2000000) throw new Error('Bad iteration count.');
      return deriveKey(c, passphrase, unb64(env.salt), iterations).then(function (key) {
        return c.subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv) }, key, unb64(env.data));
      }).then(function (pt) {
        return JSON.parse(new TextDecoder().decode(pt));
      });
    });
  }

  function isEncrypted(text) {
    try {
      var o = typeof text === 'string' ? JSON.parse(text) : text;
      return !!o && typeof o === 'object' && o.format === FORMAT;
    } catch (e) { return false; }
  }

  var api = { encrypt: encrypt, decrypt: decrypt, isEncrypted: isEncrypted };
  root.PlanCrypto = api;
})(typeof window !== 'undefined' ? window : globalThis);

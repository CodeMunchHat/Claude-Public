const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/ui/crypto.js');
const C = globalThis.PlanCrypto;

const obj = { version: 1, household: { people: [{ name: 'Ünï', age: 28 }] }, n: [1, 2.5, null] };

test('round trip', async () => {
  const t = await C.encrypt(obj, 'correct horse 1');
  const env = JSON.parse(t);
  assert.equal(env.format, 'rp-enc-1');
  assert.equal(env.kdf, 'PBKDF2-SHA256');
  assert.equal(env.iterations, 200000);
  assert.equal(Buffer.from(env.salt, 'base64').length, 16);
  assert.equal(Buffer.from(env.iv, 'base64').length, 12);
  assert.ok(!t.includes('Ünï'));
  assert.deepStrictEqual(await C.decrypt(t, 'correct horse 1'), obj);
});

test('fresh salt and iv each time', async () => {
  const a = JSON.parse(await C.encrypt(obj, 'correct horse 1'));
  const b = JSON.parse(await C.encrypt(obj, 'correct horse 1'));
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
});

test('wrong passphrase rejects', async () => {
  const t = await C.encrypt(obj, 'correct horse 1');
  await assert.rejects(C.decrypt(t, 'wrong horse 22'));
});

test('tampered data rejects', async () => {
  const env = JSON.parse(await C.encrypt(obj, 'correct horse 1'));
  const d = Buffer.from(env.data, 'base64'); d[0] ^= 1; env.data = d.toString('base64');
  await assert.rejects(C.decrypt(JSON.stringify(env), 'correct horse 1'));
});

test('isEncrypted', async () => {
  assert.equal(C.isEncrypted(await C.encrypt(obj, 'correct horse 1')), true);
  assert.equal(C.isEncrypted(JSON.stringify(obj)), false);
  assert.equal(C.isEncrypted('not json'), false);
  assert.equal(C.isEncrypted('null'), false);
});

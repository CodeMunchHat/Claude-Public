// Run: node test/ui.questionnaire.mjs --trace off
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(require.resolve('playwright', { paths: ['/opt/node22/lib/node_modules'] })); }
const sample = JSON.parse(fs.readFileSync(path.join(root, 'sample/cheltsey_drew.json'), 'utf8'));
const shots = process.env.SHOT_DIR || path.join(root, 'test', 'screenshots');
fs.mkdirSync(shots, { recursive: true });

const browser = await pw.chromium.launch();
let failed = 0;
const ok = (m) => console.log('PASS', m);

for (const [w, h] of [[375, 800], [1024, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  // Stub engine/plan only if missing.
  await page.evaluate(() => {
    window.__built = null;
    if (!window.Planner) window.Planner = { buildPlan: (i) => ({ stub: true, n: i.accounts.length }) };
    if (!window.PlanView) window.PlanView = { render: (p, i, c) => { window.__built = { p, i }; c.innerHTML = '<h2>Stub plan</h2><button id="edit" onclick="App.showQuestionnaire()">Edit answers</button>'; } };
  });
  // Empty form must fail validation.
  assert.equal(await page.evaluate(() => Questionnaire.validateAll().valid), false);
  ok(`${w}: empty form invalid`);

  await page.click('[data-action=example]');
  assert.match(await page.textContent('#q-status'), /Example loaded/);
  for (let s = 1; s <= 7; s++) {
    assert.match(await page.textContent('#q-progress-text'), new RegExp(`Step ${s} of 7`));
    assert.equal(await page.locator('.step:not([hidden])').count(), 1);
    await page.screenshot({ path: path.join(shots, `step${s}-${w}.png`), fullPage: true });
    const over = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    assert.ok(over, `horizontal overflow on step ${s} at ${w}`);
    if ([1, 2, 6, 7].includes(s)) await page.screenshot({ path: path.join(shots, `q-step${s}-${w}.png`), fullPage: true });
    if (s < 7) await page.click('[data-action=next]');
  }
  ok(`${w}: stepped through 7 screens, no horizontal overflow`);

  const got = await page.evaluate(() => Questionnaire.getInputs());
  assert.deepStrictEqual(got, sample);
  assert.equal(await page.evaluate(() => Questionnaire.validateAll().valid), true);
  ok(`${w}: getInputs deep-equals sample, validateAll valid`);

  // Tooltip toggle
  await page.click('[data-action=back]');
  const tip = page.locator('.step:not([hidden]) .tip').first();
  await tip.click();
  assert.equal(await tip.getAttribute('aria-expanded'), 'true');
  assert.ok(await tip.getAttribute('title'));
  ok(`${w}: tooltip toggles`);

  // Build -> plan view -> edit answers keeps values
  await page.click('[data-action=next]'); // step 7 again
  await page.click('[data-action=next]'); // Build
  assert.equal(await page.isHidden('#questionnaire'), true);
  assert.equal(await page.isVisible('#plan-view'), true);
  await page.evaluate(() => App.showQuestionnaire());
  assert.equal(await page.isVisible('#questionnaire'), true);
  assert.deepStrictEqual(await page.evaluate(() => Questionnaire.getInputs()), sample);
  ok(`${w}: build and edit answers round trip`);

  // Validation: clear an age, Next shows error
  await page.evaluate(() => { Questionnaire.showStep(0); });
  await page.fill('#f-household-people-0-age', '');
  await page.click('[data-action=next]');
  assert.match(await page.textContent('#f-household-people-0-age-err'), /number/);
  assert.match(await page.textContent('#q-progress-text'), /Step 1 of 7/);
  ok(`${w}: inline validation blocks Next`);

  // Percent entry: whole numbers -> fractions; earners=1 trims people
  await page.fill('#f-household-people-0-age', '28');
  await page.check('#f-household-earners-1', { force: true });
  const one = await page.evaluate(() => Questionnaire.getInputs());
  assert.equal(one.household.people.length, 1);
  assert.ok(one.accounts.every((a) => a.owner === 0));
  ok(`${w}: switching to 1 earner`);

  // Save/load: encrypted round trip
  const PASS = 'correct horse 1';
  const before = await page.evaluate(() => Questionnaire.getInputs());
  await page.click('[data-action=save]');
  const dlg = page.locator('dialog.rp-dlg[open]');
  await dlg.waitFor();
  assert.match(await dlg.textContent(), /A lost passphrase cannot be recovered/);
  // validation: short, then mismatch
  await dlg.locator('input').nth(0).fill('short');
  await dlg.locator('input').nth(1).fill('short');
  await dlg.locator('.rp-go').click();
  assert.match(await dlg.locator('.rp-err').textContent(), /at least 8/);
  await dlg.locator('input').nth(0).fill(PASS);
  await dlg.locator('input').nth(1).fill(PASS + 'x');
  await dlg.locator('.rp-go').click();
  assert.match(await dlg.locator('.rp-err').textContent(), /do not match/);
  // show/hide toggle
  assert.equal(await dlg.locator('input').nth(0).getAttribute('type'), 'password');
  await dlg.locator('.rp-eye').click();
  assert.equal(await dlg.locator('input').nth(0).getAttribute('type'), 'text');
  if (w === 375) {
    fs.mkdirSync(shots, { recursive: true });
    await page.screenshot({ path: path.join(shots, 'enc-dialog-375.png') });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  // Escape cancels
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog.rp-dlg').count(), 0);
  // real save
  await page.click('[data-action=save]');
  await dlg.waitFor();
  await dlg.locator('input').nth(0).fill(PASS);
  await dlg.locator('input').nth(1).fill(PASS);
  const [dl] = await Promise.all([page.waitForEvent('download'), dlg.locator('.rp-go').click()]);
  assert.equal(dl.suggestedFilename(), 'retirement-plan-inputs.enc.json');
  const encPath = await dl.path();
  const encText = fs.readFileSync(encPath, 'utf8');
  assert.equal(await page.evaluate((t) => PlanCrypto.isEncrypted(t), encText), true);
  assert.ok(!encText.includes('Cheltsey'));
  await page.waitForFunction(() => /encrypted/.test(document.getElementById('q-status').textContent));
  // wrong passphrase, then retry with right one
  await page.evaluate(() => Questionnaire.setInputs(JSON.parse(JSON.stringify(Object.assign({}, Questionnaire.getInputs(), { cash: { checking: 1, savings: 1, monthlyExpenses: 1, emergencyFund: 0 } })))));
  await page.setInputFiles('#q-file', encPath);
  await dlg.waitFor();
  await dlg.locator('input').fill('wrong passphrase');
  await dlg.locator('.rp-go').click();
  await page.waitForFunction(() => /Wrong passphrase or damaged file/.test(document.querySelector('dialog.rp-dlg .rp-err').textContent));
  await dlg.locator('input').fill(PASS);
  await dlg.locator('.rp-go').click();
  await page.waitForFunction(() => /Loaded /.test(document.getElementById('q-status').textContent));
  assert.deepStrictEqual(await page.evaluate(() => Questionnaire.getInputs()), before);
  ok(`${w}: encrypted save, wrong passphrase retry, restore deep-equal`);

  // Plain save link
  await page.click('[data-action=save]');
  await dlg.waitFor();
  const [dl2] = await Promise.all([page.waitForEvent('download'), dlg.locator('.rp-plain').click()]);
  assert.equal(dl2.suggestedFilename(), 'retirement-plan-inputs.json');
  const plainPath = await dl2.path();
  const plainText = fs.readFileSync(plainPath, 'utf8');
  assert.equal(await page.evaluate((t) => PlanCrypto.isEncrypted(t), plainText), false);
  assert.deepStrictEqual(JSON.parse(plainText), before);
  // old plain JSON loads without a dialog
  await page.evaluate(() => document.getElementById('q-status').textContent = '');
  await page.setInputFiles('#q-file', plainPath);
  await page.waitForFunction(() => /Loaded /.test(document.getElementById('q-status').textContent));
  assert.equal(await page.locator('dialog.rp-dlg').count(), 0);
  assert.equal(await page.evaluate(() => Questionnaire.getInputs().household.earners), 1);
  await page.setInputFiles('#q-file', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await page.waitForFunction(() => /version/.test(document.getElementById('q-status').textContent));
  ok(`${w}: plain save/load and bad-file rejection`);

  assert.deepEqual(errors, [], 'page errors: ' + errors.join('; '));
  await page.close();
}
await browser.close();
console.log('ALL OK');

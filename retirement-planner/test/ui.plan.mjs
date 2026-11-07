// Playwright check for the plan view and PDF export.
// Run: node test/ui.plan.mjs   (skips itself if playwright is not installed)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium = null;
try { ({ chromium } = require('playwright')); } catch { /* not installed */ }

const plan = JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/sample_plan.json'), 'utf8'));
const inputs = JSON.parse(fs.readFileSync(path.join(root, 'test/fixtures/sample_inputs.json'), 'utf8'));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

test('plan view and PDF', { skip: !chromium && 'playwright not installed' }, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-ui-'));
  const u = (p) => pathToFileURL(path.join(root, p)).href;
  fs.writeFileSync(path.join(tmp, 'harness.html'), `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>harness</title></head>
<body style="margin:0"><div id="out"></div>
<script src="${u('js/vendor/jspdf.umd.min.js')}"></script>
<script src="${u('js/vendor/jspdf.plugin.autotable.min.js')}"></script>
<script src="${u('js/ui/plan.js')}"></script>
<script src="${u('js/ui/pdf.js')}"></script>
<script>window.__plan=${JSON.stringify(plan)};window.__inputs=${JSON.stringify(inputs)};
PlanView.render(window.__plan, window.__inputs, document.getElementById('out'));</script></body></html>`);

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, acceptDownloads: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(pathToFileURL(path.join(tmp, 'harness.html')).href);

    // all 12 sections
    for (const id of ['toolbar', 'title', 'warnings', 'ninety', 'phases', 'debt', 'goals', 'accounts', 'invest', 'outlook', 'protection', 'limits']) {
      assert.equal(await page.locator(`[data-section="${id}"]`).count(), 1, 'section ' + id);
    }
    const text = await page.locator('#out').innerText();
    for (const s of [money(plan.projection.balanceAtRetirement), money(plan.projection.waitBalance), money(plan.projection.costOfWaiting),
      'Your Starter Financial Plan', 'Cheltsey and Drew', 'This week', 'Months 2 and 3', 'Debt-free', 'Feasible', 'FFIJX',
      'Retirement outlook', '2027 projected', '2026-11-07', '$36,541', '108%']) {
      assert.ok(text.includes(s), 'missing text: ' + s);
    }
    assert.equal(await page.locator('.pv section[data-section="phases"] tbody tr:not(.pv-steps)').count(), 7);
    assert.equal(await page.locator('#pv-projection-details tbody tr').count(), 37);
    assert.equal(await page.locator('svg.pv-chart title').count(), 1);
    assert.equal(await page.locator('svg.pv-chart path').count(), 2);

    // expandable phase row
    const steps = page.locator('#pv-steps-0');
    assert.equal(await steps.isHidden(), true);
    await page.locator('button[aria-controls="pv-steps-0"]').click();
    assert.equal(await steps.isVisible(), true);

    // no horizontal overflow at 375
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, 'page overflows horizontally by ' + overflow);
    await page.evaluate(() => { document.getElementById('pv-projection-details').open = true; });
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow2 <= 0, 'page overflows with projection open by ' + overflow2);

    const shots = process.env.SHOT_DIR || tmp;
    await page.screenshot({ path: path.join(shots, 'plan-375.png'), fullPage: true });
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.screenshot({ path: path.join(shots, 'plan-1024.png'), fullPage: true });

    // PDF
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Download PDF')]);
    assert.equal(dl.suggestedFilename(), 'cheltsey-drew-financial-plan.pdf');
    const pdf = path.join(tmp, dl.suggestedFilename());
    await dl.saveAs(pdf);
    const info = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
    const pages = Number(/Pages:\s+(\d+)/.exec(info)[1]);
    assert.ok(pages >= 3, 'pdf pages ' + pages);
    const pt = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
    assert.ok(pt.includes('Retirement outlook'));
    assert.ok(pt.includes(money(plan.projection.balanceAtRetirement)));
    assert.ok(pt.includes('Page 1 of ' + pages) && pt.includes('Educational tool.'));
    assert.deepEqual(errors, []);
    console.log(`ok: ${pages} PDF pages; shots in ${shots}`);
  } finally {
    await browser.close();
  }
});

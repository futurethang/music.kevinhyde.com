// Spec §3 (index) and §4 (timeline rail).
const { chromium } = require('playwright');
const { BASE, makeOk, survey, settle, report } = require('./lib.cjs');

const state = { pass: 0, fail: 0, skip: 0 };
const ok = makeOk(state);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));

  const releases = await survey(page);
  const N = releases.length;
  console.log(`\n(catalogue: ${N} releases, ${new Set(releases.map(r => r.year)).size} distinct years)`);

  console.log('\n-- §4 activation --');
  ok(await page.locator('[data-tick]').count() === N, `one tick per release (${N})`);
  ok(await page.locator('[data-tick][data-active]').count() === 1, 'exactly one active tick at load');
  ok(await page.locator('[data-tick][data-active]').getAttribute('data-i') === '0', 'newest release active at top');

  const target = Math.min(3, N - 1);
  await page.evaluate((t) => {
    const rows = document.querySelectorAll('[data-release]');
    window.scrollTo(0, rows[t].offsetTop - window.innerHeight * 0.4 + 5);
  }, target);
  await page.waitForTimeout(250);
  let act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === String(target), `active follows the 40% line (expected ${target}, got ${act})`);

  console.log('\n-- §4 distance ramp --');
  await page.waitForTimeout(500); // let the 300ms transition settle
  const a = Number(act);
  const ds = await page.$$eval('[data-tick]', ts => ts.map(t => t.dataset.d));
  ok(JSON.stringify(ds) === JSON.stringify(ds.map((_, i) => String(Math.min(Math.abs(i - a), 3)))),
     'd = min(|i-active|,3) on every tick');

  const dash = await page.$$eval('[data-tick]', ts => ts.map(t => {
    const s = getComputedStyle(t.querySelector('.tick__dash'));
    return [t.dataset.d, s.width, s.height, s.backgroundColor].join('|');
  }));
  const byD = {};
  dash.forEach(r => { byD[r.split('|')[0]] = r; });
  const near = (x, y, t = 0.5) => Math.abs(x - y) <= t;
  const spec = { '0': [48, 3, [236, 232, 225]], '1': [32, 2, [168, 162, 151]], '2': [22, 1, [95, 90, 83]], '3': [14, 1, [63, 59, 55]] };
  for (const [d, [w, h, c]] of Object.entries(spec)) {
    if (!byD[d]) continue;
    const [, ws, hs, cs] = byD[d].split('|');
    const rgb = (cs.match(/\d+/g) || []).map(Number);
    ok(near(parseFloat(ws), w) && near(parseFloat(hs), h), `d${d} dash ${w}x${h} (got ${parseFloat(ws).toFixed(1)}x${parseFloat(hs).toFixed(2)})`);
    ok(c.every((v, k) => near(rgb[k], v, 2)), `d${d} colour --dash-${d} (got ${cs})`);
  }

  console.log('\n-- §4 labels --');
  const labels = await page.$$eval('[data-tick]', ts => ts.map(t => ({
    first: t.dataset.firstOfYear, active: !!t.dataset.active, same: !!t.dataset.sameyear,
    vis: getComputedStyle(t.querySelector('.tick__year')).visibility,
    size: parseFloat(getComputedStyle(t.querySelector('.tick__year')).fontSize),
    weight: getComputedStyle(t.querySelector('.tick__year')).fontWeight,
    titleShown: getComputedStyle(t.querySelector('.tick__title')).display !== 'none',
  })));
  ok(labels.every(l => (l.first === 'true' || l.active) ? l.vis === 'visible' : l.vis === 'hidden'),
     'year label visible only when first-of-year or active');
  const A = labels.find(l => l.active);
  ok(near(A.size, 16, 0.1) && A.weight === '700', `active label 16px/700 (${A.size}/${A.weight})`);
  ok(A.titleShown, 'active tick shows release title underneath');
  ok(labels.filter(l => l.titleShown).length === 1, 'only the active tick shows a title');
  const same = labels.find(l => l.same && l.vis === 'visible');
  if (same) ok(near(same.size, 13, 0.1) && same.weight === '500', `same-year label 13px/500 (${same.size}/${same.weight})`);
  const other = labels.find(l => !l.active && !l.same && l.vis === 'visible');
  if (other) ok(near(other.size, 11, 0.1), `other-year label 11px mono (${other.size})`);

  console.log('\n-- §4 bottom forces last --');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await settle(page);
  act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === String(N - 1), `last release forced active at page bottom (got ${act})`);

  console.log('\n-- §4 click + hash --');
  const mid = Math.min(6, N - 1);
  const midSlug = releases[mid].slug;
  await page.locator(`[data-tick][data-i="${mid}"]`).click();
  await settle(page);
  ok(decodeURIComponent(page.url()).endsWith('#' + midSlug), `hash updated via replaceState (#${midSlug})`);
  ok(await page.locator('[data-tick][data-active]').getAttribute('data-i') === String(mid), 'clicked tick is active');
  const top = await page.locator(`#${midSlug}`).evaluate(el => el.getBoundingClientRect().top);
  ok(Math.abs(top - 40) < 6, `release top sits ~40px below viewport top (${top.toFixed(1)}px)`);
  ok(await page.evaluate(() => history.length) < 4, 'replaceState used, no history spam');

  console.log('\n-- §4 deep link --');
  const deepIdx = Math.min(7, N - 1);
  const deepSlug = releases[deepIdx].slug;
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.goto(`${BASE}/#${deepSlug}`, { waitUntil: 'networkidle' });
  await settle(p2);
  ok(await p2.locator('[data-tick][data-active]').getAttribute('data-i') === String(deepIdx), `/#${deepSlug} lands with that release active`);
  ok(await p2.locator('[data-tick][data-active]').getAttribute('aria-current') === 'true', 'aria-current="true" on active tick');
  await p2.close();

  console.log('\n-- §3 outlets --');
  const withOutlet = releases.find(r => r.outlets.some(h => h && h.startsWith('http')));
  const ext = page.locator(`#${withOutlet.slug} .outlets__link`).first();
  ok(await ext.getAttribute('target') === '_blank', 'outlet rows open in a new tab');
  ok((await ext.getAttribute('rel') || '').includes('noopener'), 'outlet rows carry rel=noopener');
  ok(await ext.evaluate(el => el.getBoundingClientRect().height) >= 44, 'index outlet row is 44px tall');

  const selfHosted = releases.find(r => r.playHere);
  if (selfHosted) {
    const ph = page.locator(`#${selfHosted.slug} .outlets__link`);
    ok((await ph.innerText()).includes('Play here'), 'self-hosted release shows "Play here"');
  } else {
    state.skip++;
    console.log('  SKIP "Play here" row — no self-hosted release in the catalogue');
  }

  console.log('\n-- page errors --');
  ok(errs.length === 0, 'no console/page errors', errs.join(' | '));

  await browser.close();
  report('rail', state);
})();

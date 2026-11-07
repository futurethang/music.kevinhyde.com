const { chromium } = require('playwright');
const B = 'http://localhost:4321';
let pass = 0, fail = 0;
const ok = (c, m, extra='') => { c ? (pass++, console.log('  PASS', m)) : (fail++, console.log('  FAIL', m, extra)); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));

  await page.goto(B, { waitUntil: 'networkidle' });

  console.log('\n-- §4 activation --');
  const n = await page.locator('[data-tick]').count();
  ok(n === 12, `12 ticks rendered (got ${n})`);
  ok(await page.locator('[data-tick][data-active]').count() === 1, 'exactly one active tick at load');
  let act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === '0', `newest release active at top (i=${act})`);

  // Scroll so release index 3 crosses the 40% line.
  await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-release]');
    window.scrollTo(0, rows[3].offsetTop - window.innerHeight * 0.4 + 5);
  });
  await page.waitForTimeout(250);
  act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === '3', `active follows the 40% line (expected 3, got ${act})`);

  console.log('\n-- §4 distance ramp --');
  const ds = await page.$$eval('[data-tick]', ts => ts.map(t => t.dataset.d));
  const expect = [3,3,2,1,0,1,2,3,3,3,3,3].map(String);
  // active is 3 here, so recompute expected from actual active
  const a = Number(act);
  const want = ds.map((_, i) => String(Math.min(Math.abs(i - a), 3)));
  ok(JSON.stringify(ds) === JSON.stringify(want), 'd = min(|i-active|,3) on every tick');

  await page.waitForTimeout(500); // let the 300ms transition settle
  const dash = await page.$$eval('[data-tick]', ts => ts.map(t => {
    const s = getComputedStyle(t.querySelector('.tick__dash'));
    return [t.dataset.d, s.width, s.height, s.backgroundColor].join('|');
  }));
  const byD = {};
  dash.forEach(r => { const [d] = r.split('|'); byD[d] = r; });
  const px = v => parseFloat(v);
  const near = (a, b, t=0.5) => Math.abs(a-b) <= t;
  const rgb = s => (s.match(/\d+/g)||[]).map(Number);
  const closeRgb = (s, r, g, b, t=2) => { const c = rgb(s); return near(c[0],r,t)&&near(c[1],g,t)&&near(c[2],b,t); };
  const spec = { '0':[48,3,[236,232,225]], '1':[32,2,[168,162,151]], '2':[22,1,[95,90,83]], '3':[14,1,[63,59,55]] };
  for (const [d,[w,h,c]] of Object.entries(spec)) {
    const row = byD[d]; if (!row) continue;
    const [,ws,hs,cs] = row.split('|');
    ok(near(px(ws),w) && near(px(hs),h), `d${d} dash = ${w}x${h} (got ${px(ws).toFixed(1)}x${px(hs).toFixed(2)})`);
    ok(closeRgb(cs, ...c), `d${d} colour = --dash-${d} (got ${cs})`);
  }

  console.log('\n-- §4 labels --');
  const labels = await page.$$eval('[data-tick]', ts => ts.map(t => ({
    i: t.dataset.i, year: t.dataset.year, first: t.dataset.firstOfYear,
    active: !!t.dataset.active, same: !!t.dataset.sameyear,
    vis: getComputedStyle(t.querySelector('.tick__year')).visibility,
    size: getComputedStyle(t.querySelector('.tick__year')).fontSize,
    weight: getComputedStyle(t.querySelector('.tick__year')).fontWeight,
    titleShown: getComputedStyle(t.querySelector('.tick__title')).display !== 'none',
  })));
  ok(labels.every(l => (l.first === 'true' || l.active) ? l.vis === 'visible' : l.vis === 'hidden'),
     'year label visible only when first-of-year or active');
  const A = labels.find(l => l.active);
  ok(Math.abs(parseFloat(A.size)-16)<0.1 && A.weight === '700', `active label 16px/700 (${A.size}/${A.weight})`);
  ok(A.titleShown, 'active tick shows release title underneath');
  ok(labels.filter(l => l.titleShown).length === 1, 'only the active tick shows a title');
  const same = labels.find(l => l.same && l.vis === 'visible');
  if (same) ok(Math.abs(parseFloat(same.size)-13)<0.1 && same.weight === '500', `same-year label 13px/500 (${same.size}/${same.weight})`);
  const other = labels.find(l => !l.active && !l.same && l.vis === 'visible');
  ok(Math.abs(parseFloat(other.size)-11)<0.1, `other-year label 11px mono (${other.size})`);

  console.log('\n-- §4 bottom forces last --');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === '11', `last release forced active at page bottom (got ${act})`);

  console.log('\n-- §4 click + hash --');
  await page.locator('[data-tick][data-i="6"]').click();
  await page.waitForTimeout(900);
  ok(page.url().endsWith('#transom'), `hash updated via replaceState (${page.url().split('/').pop()})`);
  act = await page.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(act === '6', `clicked tick is active (got ${act})`);
  const top = await page.locator('#transom').evaluate(el => el.getBoundingClientRect().top);
  ok(Math.abs(top - 40) < 6, `scrolled so release top sits ~40px below viewport top (${top.toFixed(1)}px)`);
  ok(await page.evaluate(() => history.length) < 4, 'replaceState used, no history spam');

  console.log('\n-- §4 deep link --');
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.goto(B + '/#gale-warning', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(400);
  const dact = await p2.locator('[data-tick][data-active]').getAttribute('data-i');
  ok(dact === '7', `/#slug lands with that release active (got ${dact})`);
  ok(await p2.locator('[data-tick][data-active]').getAttribute('aria-current') === 'true', 'aria-current="true" on active tick');
  await p2.close();

  console.log('\n-- §3 outlets --');
  const ext = page.locator('#low-ceiling .outlets__link').first();
  ok(await ext.getAttribute('target') === '_blank', 'outlet rows open in a new tab');
  ok((await ext.getAttribute('rel') || '').includes('noopener'), 'outlet rows carry rel=noopener');
  const rowH = await ext.evaluate(el => el.getBoundingClientRect().height);
  ok(rowH >= 44, `index outlet row is 44px tall (${rowH}px)`);
  const ph = page.locator('#floating-apart .outlets__link');
  ok((await ph.innerText()).includes('Play here'), 'self-hosted release with no outlets shows "Play here"');
  ok((await ph.getAttribute('href')) === '/r/floating-apart#play', 'Play here links to the detail player');

  console.log('\n-- page errors --');
  ok(errs.length === 0, 'no console/page errors', errs.join(' | '));

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

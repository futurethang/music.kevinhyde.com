// Spec §6 (responsive) and §7 (release detail page).
const { chromium } = require('playwright');
const { BASE, makeOk, makeSkip, survey, settle, report } = require('./lib.cjs');

const state = { pass: 0, fail: 0, skip: 0 };
const ok = makeOk(state);
const skip = makeSkip(state);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));

  const releases = await survey(page);

  // Classify the catalogue so each conditional branch is tested against a
  // release that actually exercises it, or explicitly skipped.
  const detail = [];
  for (const r of releases) {
    await page.goto(`${BASE}/r/${r.slug}/`, { waitUntil: 'domcontentloaded' });
    detail.push({
      ...r,
      player: await page.locator('[data-player]').count() > 0,
      outlets: await page.locator('.outlets__link').count(),
      credits: await page.locator('.credits').count() > 0,
      myPart: (await page.locator('body').innerText()).includes('MY PART'),
      tracks: await page.locator('[data-track]').count(),
    });
  }
  const withPlayer = detail.find(d => d.player);
  const outletsOnly = detail.find(d => !d.player && d.outlets > 0);
  const noCredits = detail.find(d => !d.credits);
  const withCredits = detail.find(d => d.credits);
  const multiTrack = detail.find(d => d.tracks > 1);

  console.log(`\n(catalogue: ${detail.length} detail pages; ${detail.filter(d => d.player).length} with a player)`);

  console.log('\n-- §7 conditional sections --');
  if (outletsOnly) {
    await page.goto(`${BASE}/r/${outletsOnly.slug}/`, { waitUntil: 'networkidle' });
    ok(await page.locator('[data-player]').count() === 0, 'no player when not self-hosted');
    const h = (await page.locator('.block .eyebrow').allInnerTexts()).map(t => t.toLowerCase());
    ok(h.includes('listen') && !h.includes('also on'), `heading reads "Listen" with no player (${h.join(', ')})`);
    ok(await page.locator('.outlets__link').first().evaluate(e => e.getBoundingClientRect().height) >= 48,
       'detail outlet rows are 48px');
  } else skip('outlets-only release not present');

  if (withPlayer) {
    await page.goto(`${BASE}/r/${withPlayer.slug}/`, { waitUntil: 'networkidle' });
    ok(await page.locator('[data-player]').count() === 1, 'player shown for self-hosted');
    if (withPlayer.outlets > 0) {
      const h = (await page.locator('.block .eyebrow').allInnerTexts()).map(t => t.toLowerCase());
      ok(h.includes('also on'), 'heading reads "Also on" when a player exists');
    }
  } else skip('player, track rows and seek bar — no self-hosted release in the catalogue');

  if (noCredits) {
    await page.goto(`${BASE}/r/${noCredits.slug}/`, { waitUntil: 'networkidle' });
    ok(!(await page.locator('body').innerText()).includes('CREDITS'), 'Credits omitted when absent');
  } else skip('release without credits not present');

  if (withCredits) {
    await page.goto(`${BASE}/r/${withCredits.slug}/`, { waitUntil: 'networkidle' });
    ok(await page.locator('.credits dt').count() > 0, 'credits render as a definition list');
  } else skip('release with credits not present');

  console.log('\n-- §7 outlet hints --');
  const bc = detail.find(d => d.outlets > 0 && releases.find(r => r.slug === d.slug));
  await page.goto(`${BASE}/r/${bc.slug}/`, { waitUntil: 'networkidle' });
  const hints = await page.locator('.outlets__hint').allInnerTexts();
  ok(hints.length > 0 && hints.every(h => ['buy / download', 'stream', 'watch'].includes(h)),
     `platform hints present and valid (${[...new Set(hints)].join(', ')})`);

  console.log('\n-- §7 back link --');
  const back = page.locator('.back a');
  ok(await back.getAttribute('href') === `/#${bc.slug}`, 'back link returns to the right release');
  ok(await back.evaluate(e => e.getBoundingClientRect().height) >= 44, 'back link is a 44px tap target');

  console.log('\n-- §9 responsive, no horizontal scroll --');
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    for (const path of ['/', `/r/${bc.slug}/`]) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
         `${w}px ${path} — no horizontal scroll`);
    }
    if (w === 390) {
      await p.goto(BASE, { waitUntil: 'networkidle' });
      ok(!(await p.locator('[data-rail]').isVisible()), '390px — rail hidden');
      ok(await p.locator('.yearbar').isVisible(), '390px — sticky year bar shown');
      ok(Math.round(await p.locator('.yearbar').evaluate(e => e.getBoundingClientRect().height)) === 44,
         '390px — year bar is 44px');
      const years = await p.$$eval('[data-yearbar-select] option', os => os.map(o => o.value));
      const pick = years[years.length - 1];
      await p.selectOption('[data-yearbar-select]', pick);
      await settle(p);
      ok(await p.locator('[data-yearbar-label]').innerText() === pick, `year select jumps and updates the label (${pick})`);
    }
    if (w === 768) {
      await p.goto(BASE, { waitUntil: 'networkidle' });
      ok(await p.locator('[data-rail]').isVisible(), '768px — rail visible');
      ok(Math.round(await p.locator('[data-rail]').evaluate(e => e.getBoundingClientRect().width)) === 120,
         '768px — rail is 120px wide');
      ok(!(await p.locator('[data-tick][data-active] .tick__title').isVisible()), '768px — active title line hidden');
    }
    await p.close();
  }

  console.log('\n-- §4 reduced motion --');
  const rp = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rp.goto(BASE, { waitUntil: 'networkidle' });
  ok(/^0s(,\s*0s)*$/.test(await rp.locator('.tick__dash').first().evaluate(e => getComputedStyle(e).transitionDuration)),
     'transitions disabled under reduced motion');
  const idx = Math.min(9, releases.length - 1);
  const before = await rp.evaluate(() => window.scrollY);
  await rp.locator(`[data-tick][data-i="${idx}"]`).click();
  await rp.waitForTimeout(150); // too fast for a smooth scroll to have finished
  const after = await rp.evaluate(() => window.scrollY);
  const top = await rp.locator(`#${releases[idx].slug}`).evaluate(e => e.getBoundingClientRect().top);
  ok(after > before && Math.abs(top - 40) < 6, 'reduced motion jumps instantly rather than smooth-scrolling');
  await rp.close();

  console.log('\n-- errors --');
  ok(errs.length === 0, 'no console/page errors', errs.join(' | '));

  await browser.close();
  report('detail', state);
})();

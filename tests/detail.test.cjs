const { chromium } = require('playwright');
const B = 'http://localhost:4321';
let pass=0, fail=0;
const ok=(c,m,x='')=>{c?(pass++,console.log('  PASS',m)):(fail++,console.log('  FAIL',m,x));};

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const page = await browser.newPage({ viewport:{width:1440,height:900} });
  page.on('pageerror', e=>errs.push(String(e)));
  page.on('console', m=>m.type()==='error'&&errs.push(m.text()));

  console.log('\n-- §7 conditional sections --');
  // first-light: selfHosted, no outlets, no myPart, no credits
  await page.goto(B+'/r/first-light', {waitUntil:'networkidle'});
  ok(await page.locator('[data-player]').count()===1, 'player shown for self-hosted');
  ok(await page.locator('.outlets').count()===0, 'no outlet list when there are no outlets');
  ok(!(await page.locator('body').innerText()).includes('My part'), 'My part omitted when absent');
  ok(!(await page.locator('body').innerText()).includes('Credits'), 'Credits omitted when empty');

  // slack-tide: outlets only, no player -> heading reads "Listen"
  await page.goto(B+'/r/slack-tide', {waitUntil:'networkidle'});
  ok(await page.locator('[data-player]').count()===0, 'no player when not self-hosted');
  const h = (await page.locator('.block .eyebrow').allInnerTexts()).map(t=>t.toLowerCase());
  ok(h.includes('listen') && !h.includes('also on'), `heading reads "Listen" with no player (${h.join(', ')})`);

  // transom: both player and outlets -> heading reads "Also on"
  await page.goto(B+'/r/transom', {waitUntil:'networkidle'});
  const h2 = (await page.locator('.block .eyebrow').allInnerTexts()).map(t=>t.toLowerCase());
  ok(h2.includes('also on'), `heading reads "Also on" when a player exists (${h2.join(', ')})`);
  ok(await page.locator('[data-track]').count()===3, 'three track rows for a 3-track release');
  const hint = await page.locator('.outlets__hint').first().innerText();
  ok(hint==='buy / download', `Bandcamp hint = "buy / download" (got "${hint}")`);
  await page.goto(B+'/r/anodyne', {waitUntil:'networkidle'});
  ok((await page.locator('.outlets__hint').first().innerText())==='stream', 'streaming platforms hint "stream"');
  const dRow = await page.locator('.outlets__link').first().evaluate(e=>e.getBoundingClientRect().height);
  ok(dRow>=48, `detail outlet rows are 48px (${dRow}px)`);

  console.log('\n-- §7 back link --');
  await page.goto(B+'/r/gale-warning', {waitUntil:'networkidle'});
  const back = page.locator('.back a');
  ok(await back.getAttribute('href')==='/#gale-warning', 'back link returns to the right release');
  const bh = await back.evaluate(e=>e.getBoundingClientRect().height);
  ok(bh>=44, `back link is a 44px tap target (${bh}px)`);

  console.log('\n-- §7 player --');
  await page.goto(B+'/r/transom', {waitUntil:'networkidle'});
  const btn = page.locator('[data-play]').first();
  ok((await btn.getAttribute('aria-label'))==='Play Transom', 'play button labelled with the track');
  const sz = await btn.evaluate(e=>e.getBoundingClientRect());
  ok(Math.round(sz.width)===44 && Math.round(sz.height)===44, `play button is 44px round (${sz.width}x${sz.height})`);
  await btn.click();
  await page.waitForTimeout(1200);
  const st = await page.evaluate(()=>{const a=document.querySelector('[data-player-audio]');return {paused:a.paused,t:a.currentTime,src:a.currentSrc};});
  ok(!st.paused && st.t>0, `audio plays (t=${st.t.toFixed(2)}s)`);
  ok(st.src.includes('transom.mp3'), 'first track selected');
  ok((await btn.getAttribute('aria-label'))==='Pause Transom', 'button relabels to Pause while playing');
  const w = await page.locator('[data-progress]').first().evaluate(e=>e.style.width);
  ok(parseFloat(w)>0, `progress bar advances (${w})`);
  await btn.click(); await page.waitForTimeout(200);
  ok(await page.evaluate(()=>document.querySelector('[data-player-audio]').paused), 'pause works');

  console.log('\n-- §9 seek bar keyboard --');
  const bar = page.locator('[data-bar]').first();
  await bar.focus();
  const t0 = await page.evaluate(()=>document.querySelector('[data-player-audio]').currentTime);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const t1 = await page.evaluate(()=>document.querySelector('[data-player-audio]').currentTime);
  ok(t1 > t0, `ArrowRight seeks forward (${t0.toFixed(1)} -> ${t1.toFixed(1)})`);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
  const t2 = await page.evaluate(()=>document.querySelector('[data-player-audio]').currentTime);
  ok(t2 < t1, `ArrowLeft seeks back (${t1.toFixed(1)} -> ${t2.toFixed(1)})`);
  await page.keyboard.press('Home'); await page.waitForTimeout(150);
  ok(await page.evaluate(()=>document.querySelector('[data-player-audio]').currentTime)===0, 'Home returns to start');
  ok(await bar.getAttribute('role')==='slider' && await bar.getAttribute('aria-valuenow')!==null, 'seek bar exposes slider semantics');

  // switching tracks
  await page.locator('[data-play]').nth(2).click();
  await page.waitForTimeout(800);
  ok(await page.evaluate(()=>document.querySelector('[data-player-audio]').currentSrc.includes('casement')), 'switching tracks reuses the single audio element');
  ok(await page.locator('[data-track][data-playing]').count()===1, 'only one track row marked playing');

  console.log('\n-- §9 responsive, no horizontal scroll --');
  for (const [w,hh] of [[390,844],[768,1024],[1440,900]]) {
    const p = await browser.newPage({viewport:{width:w,height:hh}});
    for (const path of ['/', '/r/low-ceiling']) {
      await p.goto(B+path, {waitUntil:'networkidle'});
      const over = await p.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth+1);
      ok(!over, `${w}px ${path} — no horizontal scroll`);
    }
    if (w===390) {
      await p.goto(B, {waitUntil:'networkidle'});
      ok(!(await p.locator('[data-rail]').isVisible()), '390px — rail hidden');
      ok(await p.locator('.yearbar').isVisible(), '390px — sticky year bar shown');
      const ybh = await p.locator('.yearbar').evaluate(e=>e.getBoundingClientRect().height);
      ok(Math.round(ybh)===44, `390px — year bar is 44px (${ybh})`);
      await p.selectOption('[data-yearbar-select]','2021');
      await p.waitForTimeout(900);
      ok((await p.locator('[data-yearbar-label]').innerText())==='2021', 'year select jumps and updates the label');
    }
    if (w===768) {
      await p.goto(B, {waitUntil:'networkidle'});
      ok(await p.locator('[data-rail]').isVisible(), '768px — rail visible');
      const rw = await p.locator('[data-rail]').evaluate(e=>e.getBoundingClientRect().width);
      ok(Math.round(rw)===120, `768px — rail is 120px wide (${rw})`);
      ok(!(await p.locator('[data-tick][data-active] .tick__title').isVisible()), '768px — active title line hidden');
    }
    await p.close();
  }

  console.log('\n-- §4 reduced motion --');
  const rp = await browser.newPage({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
  await rp.goto(B, {waitUntil:'networkidle'});
  const dur = await rp.locator('.tick__dash').first().evaluate(e=>getComputedStyle(e).transitionDuration);
  ok(/^0s(,\s*0s)*$/.test(dur), `transitions disabled under reduced motion (${dur})`);
  const before = await rp.evaluate(()=>window.scrollY);
  await rp.locator('[data-tick][data-i="9"]').click();
  await rp.waitForTimeout(120); // too fast for a smooth scroll to have finished
  const after = await rp.evaluate(()=>window.scrollY);
  ok(after>before && Math.abs(await rp.locator('#winterbourne').evaluate(e=>e.getBoundingClientRect().top)-40)<6,
     'reduced motion jumps instantly rather than smooth-scrolling');
  await rp.close();

  console.log('\n-- errors --');
  ok(errs.length===0, 'no console/page errors', errs.join(' | '));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();

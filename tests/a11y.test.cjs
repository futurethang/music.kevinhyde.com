const { chromium } = require('playwright');
const B='http://localhost:4321'; let pass=0,fail=0;
const ok=(c,m,x='')=>{c?(pass++,console.log('  PASS',m)):(fail++,console.log('  FAIL',m,x));};
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(B,{waitUntil:'networkidle'});

  console.log('\n-- §9 keyboard --');
  // Tab through and collect what gets focus
  const seen=[]; let visibleRing=true;
  for(let i=0;i<60;i++){
    await p.keyboard.press('Tab');
    const info=await p.evaluate(()=>{
      const el=document.activeElement; if(!el||el===document.body) return null;
      const s=getComputedStyle(el);
      return {tag:el.tagName.toLowerCase(), cls:el.className?.toString().slice(0,28),
              outline:s.outlineStyle+' '+s.outlineWidth, label:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,30)};
    });
    if(!info) break;
    if(info.outline==='none 0px') visibleRing=false;
    seen.push(info);
  }
  ok(seen.length>0, `${seen.length} focusable stops reachable by Tab`);
  ok(visibleRing, 'every focused element shows a visible outline');
  ok(seen.some(s=>s.cls.includes('skip-link')), 'skip link is first-reachable');
  ok(seen.filter(s=>s.cls.includes('tick')).length===12, `all 12 ticks keyboard-reachable (${seen.filter(s=>s.cls.includes('tick')).length})`);
  // covers are aria-hidden/tabindex -1 so the title link isn't duplicated
  ok(!seen.some(s=>s.cls.includes('release__cover')), 'cover link not a duplicate tab stop');

  // activate a tick by keyboard
  await p.goto(B,{waitUntil:'networkidle'});
  const tick=p.locator('[data-tick]').nth(5);
  await tick.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  ok((await p.locator('[data-tick][data-active]').getAttribute('data-i'))==='5','tick activates with Enter');

  console.log('\n-- §9 lazy loading --');
  const imgs=await p.$$eval('.release__cover img',is=>is.map(i=>i.loading));
  ok(imgs.slice(0,2).every(l=>l==='eager'), 'first two covers eager');
  ok(imgs.slice(2).every(l=>l==='lazy'), `remaining ${imgs.length-2} covers lazy-loaded`);

  console.log('\n-- landmarks / headings --');
  ok(await p.locator('nav[aria-label="Timeline"]').count()===1,'rail is <nav aria-label="Timeline">');
  ok(await p.locator('main#main').count()===1,'single <main>');
  const hs=await p.$$eval('h1,h2,h3',es=>es.map(e=>e.tagName));
  ok(hs.filter(h=>h==='H1').length<=1, `at most one h1 on the index (${hs.filter(h=>h==='H1').length})`);
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();

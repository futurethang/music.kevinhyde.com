// Shared helpers. The suite discovers the catalogue from the running site
// rather than hardcoding slugs, so it keeps working as releases change.
const BASE = process.env.BASE_URL || 'http://localhost:4321';

function makeOk(state) {
  return (cond, msg, extra = '') => {
    if (cond) { state.pass++; console.log('  PASS', msg); }
    else { state.fail++; console.log('  FAIL', msg, extra); }
  };
}
function makeSkip(state) {
  return (msg) => { state.skip++; console.log('  SKIP', msg); };
}

/** Everything the tests need to know about the current catalogue. */
async function survey(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-release]')].map((el, i) => ({
      i,
      slug: el.id,
      year: el.dataset.year,
      title: el.dataset.title,
      outlets: [...el.querySelectorAll('.outlets__link')].map(a => a.getAttribute('href')),
      playHere: !!el.querySelector('.outlets__link[href*="#play"]'),
    }))
  );
}

/** Wait until window.scrollY stops changing — smooth scrolls vary with distance. */
async function settle(page, timeout = 6000) {
  const start = Date.now();
  let last = null, stableFor = 0;
  while (Date.now() - start < timeout) {
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) {
      stableFor += 100;
      if (stableFor >= 300) return;
    } else {
      stableFor = 0; last = y;
    }
    await page.waitForTimeout(100);
  }
}

function report(name, state) {
  const bits = [`${state.pass} passed`, `${state.fail} failed`];
  if (state.skip) bits.push(`${state.skip} skipped`);
  console.log(`\n${bits.join(', ')}`);
  process.exit(state.fail ? 1 : 0);
}

module.exports = { BASE, makeOk, makeSkip, survey, settle, report };

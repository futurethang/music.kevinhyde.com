# Acceptance checks

These cover the checklist in §9 of the build handoff, plus the behaviour
specified in §3, §4, §6 and §7.

## Running them

```bash
npm i -D playwright     # once; not a project dependency on purpose
npm run build
npm run preview &
npm test
```

Playwright is kept out of `package.json` so the deploy workflow's `npm ci`
stays at two packages and doesn't download browsers on every deploy.

## What's covered

**`rail.test.cjs`** — §3, §4. Twelve ticks; exactly one active; active
follows the 40% activation line; `d = min(|i − active|, 3)` across every
tick; dash width, height and colour per the §4 table; year labels appear
only for the first release of a year or the active tick; the three label
tiers (16/700, 13/500, 11px mono); last release forced active at the page
bottom; tick click scrolls so the release sits 40px below the viewport top,
sets the hash via `replaceState`, and activates immediately; `/#slug` deep
links; `aria-current`; outlet rows open externally with `rel=noopener`;
"Play here" for self-hosted releases with no outlets.

**`detail.test.cjs`** — §6, §7. Conditional sections (player, outlets,
credits, "My part") appear and disappear with the data; the outlets
heading reads "Listen" without a player and "Also on" with one; platform
hints; 48px detail rows vs 44px index rows; back link target and tap
target; play/pause and its `aria-label`; progress advancing; one shared
`<audio>` across track rows; arrow-key, Home and End seeking; no
horizontal scroll at 390/768/1440; rail hidden and year bar shown below
640px; 120px rail with no title line at 768px; reduced motion disables
transitions and jumps instantly.

**`a11y.test.cjs`** — §9. Everything reachable by Tab with a visible focus
ring; skip link first; all twelve ticks reachable and Enter-activatable;
covers are not duplicate tab stops; first two covers eager and the rest
lazy; landmarks and heading structure.

## Lighthouse

Not automated here. Last run on `/` and `/r/transom`:
performance 100, accessibility 100, best practices 100, SEO 100.

```bash
npx lighthouse http://localhost:4321/ \
  --only-categories=accessibility,performance,best-practices,seo \
  --chrome-flags="--headless --no-sandbox"
```

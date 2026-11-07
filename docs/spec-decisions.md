# Spec decisions

Where the build handoff was open-ended, self-conflicting, or silent.
Each of these is cheap to reverse.

## 1. Text contrast vs. the canvas colour ramp

**Conflict.** Spec §4 gives the dash ramp as `--dash-0` `#ece8e1`,
`--dash-1` `#a8a297`, `--dash-2` `#5f5a53`, `--dash-3` `#3f3b37`, and uses
`--muted-2` and `--faint` for *text* (the role line, section labels, tick
years, the "now" cap). Spec §9 asks for Lighthouse accessibility ≥ 95,
which audits text contrast.

On the `#0e0d0c` background those two values fail WCAG AA badly as text:

| Token | Canvas value | Contrast | AA (4.5:1) |
| --- | --- | --- | --- |
| `--muted-2` | `#5f5a53` | 2.84:1 | fail |
| `--faint` | `#3f3b37` | 1.75:1 | fail |

**Decision.** Split them into two ramps. The **dash** tokens keep the
canvas values exactly — they're graphical marks, not text, and Lighthouse
only audits text nodes. The **text** tokens are lifted to the dimmest
values that still clear 4.5:1 while preserving the hierarchy:

| Token | Used | Contrast |
| --- | --- | --- |
| `--muted-2` | `#8b857b` | 5.31:1 |
| `--faint` | `#857f75` | 4.89:1 |

Result is accessibility 100. The original hexes are in a comment in
`tokens.css` if you'd rather have the canvas look and drop the §9 target —
it's a one-line revert, but it's a real tradeoff, not an oversight.

## 2. No adapter, no `@astrojs/vercel`

§1 suggested Astro on Vercel. The Vercel adapter is only needed for SSR or
ISR; this site is fully static. Installing it pulled six transitive
advisories (`@vercel/nft`, `path-to-regexp`) into a build that doesn't use
any of its features. Dropped it — Vercel's Astro preset builds and serves
`dist/` natively. Dependency count is two, advisories zero.

Add it back the day this site needs a server.

## 3. Self-hosted fonts

Not specified. DM Sans and DM Mono are served from `public/fonts` (latin
subset, 156 KB total) rather than the Google Fonts CDN. Removes a
render-blocking third-party request and a tracking vector, which seems in
keeping with a site whose whole point is not depending on platforms.

## 4. A hidden `h1` on the index

§2 says there's no intro text on the index and that Kevin removed it on
purpose, so the page had no `h1` at all. Added
`<h1 class="visually-hidden">Recordings</h1>` — invisible, no effect on the
design, but the page now has a heading for screen readers and search
engines. Release titles are `h2`, as the three-level outline needs.

## 5. Covers are not tab stops

Each release links to its detail page twice: once on the cover, once on the
title. Tabbing through both is noise for keyboard and screen-reader users.
The cover link is `tabindex="-1"` + `aria-hidden="true"` with an empty
`alt`, so the title carries the accessible name and the cover stays
clickable for mouse users. The real `coverAlt` is used on the detail page,
where the cover is the primary image rather than a duplicate link.

## 6. Year-only dates sort as December

§5 says sort newest first, ties keep authoring order, and dates may be
`"YYYY"` or `"YYYY-MM"`. It doesn't say where a year-only release sits
among dated ones in the same year. Chosen: sort it as if it were December,
so `"2024"` sits above `"2024-09"`. Rationale — a release you only know the
year for is usually an older one you're backfilling, and putting it at the
top of its year reads as "sometime in 2024" rather than implying January.

## 7. Programmatic-scroll lock on the rail

§4 says a tick click sets the release active immediately and smooth-scrolls
to it. A smooth scroll fires scroll events the whole way, so the observer
would re-derive the active tick mid-flight and fight the destination. A
~700 ms lock suppresses recomputation during a click-driven scroll (0 ms
under `prefers-reduced-motion`, where the jump is instant).

## 8. One `<audio>` element per release, not per track

§7 says "for multiple tracks, show one row per track with a single player".
Read as: one shared `<audio>` element, rows swap its `src`. Starting a
second track stops the first, which is what you'd want and avoids two
tracks playing at once.

## 9. Mobile year bar

§6 flags this as the previous agent's guess rather than canvas design, and
says to keep it minimal. Kept exactly as described — sticky 44px bar,
current year left, "Jump to…" `<select>` right — and wired to the same
active-index computation the rail uses, so the two can't disagree. Worth
replacing with a real design before launch.

## 10. Removed `CNAME`

A GitHub Pages artifact, and the old README said Cloudflare Pages. On
Vercel the domain is configured in the dashboard. Restore with
`echo music.kevinhyde.com > CNAME` if any other host still needs it.

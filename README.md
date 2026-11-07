# music.kevinhyde.com

A discography of every recording Kevin Hyde has contributed to — as
performer, producer, engineer, or self-released. Releases may live on
Bandcamp, Spotify, SoundCloud, several of these, or nowhere at all
(self-hosted audio).

Built from the "Music Site" Design canvas, iteration #4 "Hanging dates,
grid". **The cover art carries the visuals**; everything else is quiet type
on a warm near-black ground with a faint film grain.

## Stack

Astro 7, statically generated, deployed on Vercel. Two dependencies
(`astro`, `sharp`), zero npm advisories. No CMS, no database, no adapter —
Vercel detects Astro, runs `astro build`, and serves `dist/`.

```bash
npm install
npm run dev        # localhost:4321
npm run build      # same build Vercel runs
npm run preview
```

## Adding a release

```bash
npm run new -- "Floating Apart"
```

Writes a JSON file, tells you the two files to drop in (`public/covers/…`
and `public/audio/…`), and that's the whole workflow. Full detail in
**[docs/adding-a-release.md](docs/adding-a-release.md)**.

A release needs at least one platform link **or** self-hosted audio. The
build fails with a named file if it has neither.

## Layout

```
src/
  content/releases/*.json   One file per release. The content.
  content.config.ts         Schema + build-time validation
  lib/releases.ts           Sorting, date formatting, platform names
  components/
    TimelineRail.astro      The scroll-linked rail (the main interaction)
    ReleaseRow.astro        One release on the index
    Player.astro            Self-hosted audio player
    OutletList.astro        Ruled platform rows
    MobileYearBar.astro     Sticky year bar below 640px
  pages/
    index.astro             Timeline index
    r/[slug].astro          Release detail
  styles/tokens.css         Every colour, size, space, and duration
public/
  covers/  audio/  fonts/   Static assets
scripts/
  new-release.mjs           The scaffold above
  generate-placeholder-covers.py
```

## The seed data is fake

Twelve dummy releases spanning 2014–2026, chosen to exercise every branch
in the design: self-hosted-only, outlets-only, both at once, year-only
dates, multi-track players, missing liner notes, missing credits, an
`other` platform with a custom label, and several releases sharing a year
so the rail's first-of-year labelling has something to do.

Covers are generated SVG placeholders
(`scripts/generate-placeholder-covers.py`). Audio files are short sine
tones. Everything in `src/content/releases/` is disposable — delete it all
and run `npm run new` when the real catalogue is ready.

## Verified against the spec

Automated checks covering §3–§9 of the handoff: rail activation at the 40%
line, the distance ramp and its exact dash sizes and colours, label tiers,
bottom-of-page forcing, click-to-scroll with `replaceState`, deep links,
conditional detail sections, the player and its arrow-key seeking,
keyboard reachability, and no horizontal scroll at 390/768/1440.

Lighthouse on `/` and `/r/[slug]`: **performance 100, accessibility 100,
best practices 100, SEO 100.**

## Decisions I had to make

The spec left a few things open or self-conflicting. See
**[docs/spec-decisions.md](docs/spec-decisions.md)** for the list and the
reasoning — the contrast one in particular is worth a look, since it
changes two token values from the canvas.

## Still open (spec §10)

- Real release data, covers, dates, roles
- About and Contact content — both stubbed, anchors live
- Long-catalog rail collapsing past ~30 releases (§4, undecided)
- The mobile year-bar pattern (§6) is a guess, not canvas design

# music.kevinhyde.com

A discography of every recording Kevin Hyde has contributed to — as
performer, producer, engineer, or self-released. Releases may live on
Bandcamp, Spotify, SoundCloud, several of these, or nowhere at all
(self-hosted audio).

Built from the "Music Site" Design canvas, iteration #4 "Hanging dates,
grid". **The cover art carries the visuals**; everything else is quiet type
on a warm near-black ground with a faint film grain.

## Stack

Astro 7, statically generated, published to GitHub Pages by
`.github/workflows/deploy.yml`. Two dependencies (`astro`, `sharp`), zero
npm advisories. No CMS, no database, no adapter — the build is plain
static files.

```bash
npm install
npm run dev        # localhost:4321
npm run build      # same build the deploy workflow runs
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
  assets/covers/            Cover art — Astro resizes these and emits WebP
  lib/covers.ts             Maps a release's cover string to its asset
public/
  audio/  fonts/            Served untouched
scripts/
  new-release.mjs           The scaffold above
  generate-placeholder-covers.py
```

## The catalogue

18 releases, 2003–2023, pulled from Bandcamp and SoundCloud:

| Source | Releases |
| --- | --- |
| [The Holy Alimonies](https://theholyalimonies.bandcamp.com/) | 7 |
| [Shadow Pattern](https://shadowpattern.bandcamp.com/) | 2 |
| [The Fish Man Band](https://fishmanband.bandcamp.com/) | 1 |
| [Waistcoat Fling](https://waistcoatfling.bandcamp.com/) — Bandcamp | 1 |
| [Waistcoat Fling](https://soundcloud.com/user-694579421-638768670) — SoundCloud | 7 singles |

Cover art is the real artwork from each release, pulled from Bandcamp and
re-encoded. The seven SoundCloud singles have no artwork on SoundCloud, so
they use generated typographic placeholders
(`scripts/generate-placeholder-covers.py` builds the same kind of thing).

**Eight releases have `"role": "Role to confirm"`** — their credits never
name Kevin, so his part couldn't be derived from the source. Find them
with:

```bash
grep -l "Role to confirm" src/content/releases/*.json
```

## Verified against the spec

Automated checks covering §3–§9 of the handoff: rail activation at the 40%
line, the distance ramp and its exact dash sizes and colours, label tiers,
bottom-of-page forcing, click-to-scroll with `replaceState`, deep links,
conditional detail sections, the player and its arrow-key seeking,
keyboard reachability, and no horizontal scroll at 390/768/1440.

Lighthouse on `/` and `/r/[slug]`: **accessibility 100, best practices 100,
SEO 100, performance 93.** Performance is below 100 only because real
photographic cover art is now the LCP element; CLS and blocking time are
both 0.

## Decisions I had to make

The spec left a few things open or self-conflicting. See
**[docs/spec-decisions.md](docs/spec-decisions.md)** for the list and the
reasoning — the contrast one in particular is worth a look, since it
changes two token values from the canvas.

## Deployment

Pushing to the default branch runs `.github/workflows/deploy.yml`:
`npm ci`, `astro build`, publish `dist/` to GitHub Pages.

The custom domain is bound by `public/CNAME`, which Astro copies into
`dist/`. A `CNAME` at the repo root would *not* work — Actions-based Pages
publishes only the build artifact.

**One-time repo setting:** Settings → Pages → Build and deployment →
Source must be **GitHub Actions**, not "Deploy from a branch". Until that
is switched the deploy step fails.

## Still open (spec §10)

- Real release data, covers, dates, roles
- About and Contact content — both stubbed, anchors live
- Long-catalog rail collapsing past ~30 releases (§4, undecided)
- The mobile year-bar pattern (§6) is a guess, not canvas design

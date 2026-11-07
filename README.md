# Kevin Hyde Music

Release site at [music.kevinhyde.com](https://music.kevinhyde.com) — the
canonical home for the music, with links out to Bandcamp, Spotify, and
SoundCloud.

Static HTML and CSS. No build step, no dependencies. Cloudflare Pages
deploys `main` on push.

## Layout

```
index.html        The whole site: releases, platform links, about
styles.css        Baseline styles (deliberately plain — design is TBD)
audio/            MP3 / Opus files
artwork/          Cover art, 1400x1400
catalog/          Per-release JSON metadata (source of truth)
docs/             How to add a release; self-hosting options
```

## Adding a release

See **[docs/adding-a-release.md](docs/adding-a-release.md)**. Short version:
copy the `<li>` out of `<template id="release-template">` at the bottom of
`index.html`, paste it at the top of the release list, replace the
placeholders.

## Where the slots are

Everything that needs a URL you don't have yet is a commented-out slot in
the markup, labelled `SLOT:`:

| Slot | Location in `index.html` |
| --- | --- |
| Per-release platform links | `<nav class="listen-links">` in each release |
| Per-release player embeds | `<details class="release__embed">` |
| Artist profile links | `<section id="listen">` |
| Liner notes | `<p class="release__notes">` |
| Downloads / tip jar | `<footer class="release__footer">` |
| Bio | `<section id="about">` |
| Social / newsletter | `.footer-nav` |
| Share image, favicon, RSS | `<head>` |

Grep for them:

```bash
grep -n "SLOT:" index.html
```

Platform URLs also belong in the release's `catalog/*.json` under `links`
and `embeds`, so there's one place to look them up later.

## Self-hosting

The site is already self-hosted in the sense that matters: the audio lives
here and plays here, with no platform in the loop.
**[docs/self-hosting.md](docs/self-hosting.md)** covers how far to push
that — Opus encoding, RSS, Faircamp, object storage — and which options
are not worth the trouble.

## Local preview

```bash
python3 -m http.server 8000
```

## Notes on the markup

- One `<article class="release">` per song, in a `<ol reversed>`, newest
  first. Schema.org `MusicRecording` microdata throughout, with
  `itemprop="sameAs"` on platform links so search engines treat this site
  as the original and the platforms as copies.
- Self-hosted `<audio>` is the default listening path. Third-party embeds
  sit inside a collapsed `<details>` so their trackers and payloads don't
  load unless someone opens them.
- Skip link, visible focus rings, labelled landmarks, real `<dl>` for
  credits, `alt` text on artwork. Headings go `h1 → h2 → h3` without
  skipping.

## Roadmap

- [ ] Fill in Bandcamp / Spotify / SoundCloud links and embeds
- [ ] Real artwork to replace the SVG placeholder
- [ ] Opus sources alongside MP3
- [ ] `feed.xml` for release announcements
- [ ] Design pass
- [ ] Stripe tip jar
- [ ] Album / collection pages
- [ ] Generate `index.html` from `catalog/*.json` if hand-editing gets old

## Copyright

All music © 2025 Kevin Hyde. All rights reserved.

# Adding a release

No build step. Edit files, commit, push; Cloudflare Pages deploys `main`.

## 1. Export audio

```
ffmpeg -i master.wav -c:a libmp3lame -b:a 320k audio/song-slug.mp3
ffmpeg -i master.wav -c:a libopus   -b:a 128k audio/song-slug.opus   # optional, half the size
```

Slug is lowercase with hyphens and is used for every related filename and
for the page anchor, so pick it once and keep it.

## 2. Artwork

Put a 1400×1400 JPEG at `artwork/song-slug.jpg`, or a typographic SVG
placeholder at `artwork/song-slug-placeholder.svg` until the real art
exists.

## 3. Catalog metadata

```
cp catalog/_template.json catalog/song-slug.json
```

Replace `SLUG` and `TITLE`, fill in dates and duration. The `links` and
`embeds` objects are where platform URLs live once the release is up
elsewhere. Nothing reads these files at runtime yet — they're the record
of truth for when the site gets a generator, and they're the place to look
up a URL rather than digging through HTML.

## 4. The page

Open `index.html`. At the bottom is `<template id="release-template">`.
Copy the `<li>…</li>` inside it to the **top** of `<ol class="release-list">`
(newest first) and replace every `SLUG`, `TITLE`, `YYYY-MM-DD`, and
`PT0M00S` placeholder.

Each release block has commented slots for:

- extra `<source>` formats in the player
- per-platform "Listen on" links (`<nav class="listen-links">`)
- platform `<iframe>` embeds (`<details class="release__embed">`)
- liner notes and credits
- downloads and tip jar (`<footer class="release__footer">`)

Delete the `<li class="listen-links__empty">` and
`<p class="embed-frame__empty">` placeholder lines once you add real
content to those blocks.

## 5. Site-wide links

Artist-level profile URLs (not per release) go in the
`<section id="listen">` block. Those are the links to hand out in a bio or
press kit.

## 6. Check it

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Confirm playback, confirm the anchor
link in the release title jumps correctly, and tab through the page to
make sure focus order still makes sense.

## Why embeds are behind a `<details>`

Third-party iframes load trackers and a few hundred KB each the moment
they're in the DOM. Keeping them inside a collapsed `<details>` means the
browser doesn't fetch them until someone actually asks for that player.
Your own `<audio>` element is the default listening path; the embeds are
there for people who'd rather save the track to their own library.

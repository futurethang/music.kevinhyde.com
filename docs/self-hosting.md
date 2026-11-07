# Self-hosting your music

Goal: you can always put a song online and give someone a link, without
Bandcamp, Spotify, SoundCloud, or a distributor being in the loop.

The site in this repo is already the simplest version of that: static HTML
plus MP3 files plus a `<audio>` element. Everything below is about how far
to push it, and where the real limits are.

## What you have now

Static files served by Cloudflare Pages, audio in `/audio`, one `<audio>`
element per release. No server, no database, no build step.

- **Works today.** Nothing to maintain.
- **Free at your scale.** Cloudflare Pages has no bandwidth charge on the
  free plan. A 3.5 MB MP3 streamed 10,000 times is ~35 GB — fine.
- **Full-file download.** The browser pulls the whole MP3 to seek around
  in it. At song length that's a non-issue; at album length it's wasteful
  on mobile data.
- **Easy to copy.** Anyone can grab the MP3 from the page source. That is
  a feature if you want people to have the file, and unavoidable if you
  want browser playback at all.

This covers the "I need a link, right now, that I control" case completely.

## Option 1 — Stay static, add polish (recommended next step)

Keep the current architecture and fix the rough edges:

1. **Add Opus alongside MP3.** Roughly half the file size at the same
   perceived quality, supported everywhere except very old Safari. The
   `<audio>` element picks the first `<source>` it can play, so MP3 stays
   the fallback:
   ```
   ffmpeg -i master.wav -c:a libopus -b:a 128k audio/song.opus
   ffmpeg -i master.wav -c:a libmp3lame -b:a 320k audio/song.mp3
   ```
   There's a commented `<source>` slot for this in `index.html`.
2. **Offer a real download.** A `download` attribute on a link to the MP3
   is already in the markup. Add FLAC if you want to serve archivists.
3. **Publish an RSS feed.** `feed.xml` with `<enclosure>` elements makes
   the site subscribable — podcast apps, feed readers, and (importantly)
   it's the format most distribution tools ingest. There's a commented
   `<link rel="alternate">` in `<head>` for it.
4. **Custom player.** Replace the native `<audio>` controls with your own
   UI when you do the design pass. Keep the `<audio>` element underneath;
   it's the accessible fallback and does the actual decoding.

**Cost:** nothing. **Effort:** an afternoon. This is where I'd stop unless
you hit a specific wall.

## Option 2 — Faircamp (a Bandcamp-shaped static site)

[Faircamp](https://simonrepp.com/faircamp/) is a static site generator for
music. You give it a folder of audio and a short manifest; it produces a
complete browsable catalog — albums, tracks, waveform players, download
formats, embeddable players, optional "pay what you want" unlock codes.
Output is plain static files, so it deploys to Cloudflare Pages like this
repo does.

- **Pro:** album/catalog structure for free, transcodes to every format,
  genuinely good players, no platform dependency.
- **Con:** you adopt its templating and its idea of site structure. Harder
  to make it look like *your* site than hand-written HTML is.

Worth a look specifically when you have enough material that hand-editing
`index.html` per release gets tedious — call it 15+ tracks or your first
album.

## Option 3 — Object storage + CDN

Move audio to Cloudflare R2 (or Backblaze B2) and keep HTML on Pages. Both
have no egress fee to the open internet, unlike S3.

Only worth doing if you start hosting lossless files or long-form audio and
want to keep large binaries out of git. Note that git is a genuinely bad
place for audio — every version of every file lives in the repo forever.
If `/audio` starts getting heavy, this is the fix, and it's also when
`git-lfs` becomes worth considering.

## Option 4 — HLS adaptive streaming

Segment each track and serve a playlist so the player fetches only what it
plays and adapts to connection speed. `ffmpeg` can produce HLS; playback
needs hls.js on non-Safari browsers.

**This is almost certainly not worth it.** It's the right answer for
hour-long audio or video, and overkill for 3-minute songs where the whole
file is smaller than one photo on a typical web page. Listed so you know
it exists and know why you're skipping it.

## Option 5 — A real server

A small VPS running something like [Navidrome](https://www.navidrome.org/)
or Funkwhale gives you a personal streaming service with libraries,
playlists, and apps.

That's a *listening* tool — your own library, your own devices. It isn't a
good public release page: it wants accounts, it needs maintenance and
backups, and it goes down when you're not looking. Keep these separate in
your head from the public site. If you want both, run Navidrome privately
and keep this static site as the public face.

## What self-hosting does not replace

Be clear-eyed about this, because it's the part that bites people:

- **Discovery.** Spotify, Apple Music, and YouTube are where listeners
  already are. Self-hosting gives you control and permanence, not reach.
- **Purchases and payouts.** Bandcamp handles payment, tax, and delivery.
  Rolling your own means Stripe plus a lot of edge cases. A "tip jar"
  Stripe Payment Link is the 90% version and takes ten minutes — there's a
  slot for it in the release footer.
- **Playlist placement and royalty collection.** These need a distributor
  (DistroKid, TuneCore, CD Baby) regardless of what you host yourself.

The sane posture: **self-host as the canonical home**, push to platforms
for reach, and make every platform link point back here. The markup is
already set up for that — `itemprop="sameAs"` on the per-release links
tells search engines those are the same recording, and the canonical URL
in `<head>` says this site is the original.

## Recommendation

1. Fill in the platform link and embed slots in `index.html` — that's the
   immediate ask and it's just paste-the-URL.
2. Add Opus sources and an RSS feed. Cheap, permanent wins.
3. Revisit Faircamp when the catalog outgrows hand-editing.
4. Skip HLS. Skip a VPS for the public site.

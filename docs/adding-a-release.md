# Adding a release

One command, two files, one commit. No CMS, no platform, no account.

## The short version

```bash
npm run new -- "Floating Apart"
```

That writes `src/content/releases/floating-apart.json` and prints the two
files to drop in next:

```
public/covers/floating-apart.jpg     square, 1400x1400
public/audio/floating-apart.mp3      320kbps
```

Then open the JSON, write a sentence or two in `myPart`, and commit.
Vercel builds and deploys on push.

## Options

```bash
npm run new -- "Harbor Light" --artist "Dismal Nitch" --format EP --date 2026-01
```

| Flag | Default |
| --- | --- |
| `--artist` | `Dismal Nitch` |
| `--role` | `Everything` |
| `--format` | `Single` (also `EP`, `LP`, `Self-released`, or anything) |
| `--date` | the current month |
| `--slug` | derived from the title |

## The fields

```jsonc
{
  "title": "Floating Apart",
  "artist": "Dismal Nitch",       // whose record it is, not necessarily you
  "role": "Bass, production",     // your part, short — shows under the title
  "date": "2026-03",              // "YYYY-MM" or "YYYY"
  "format": "Single",
  "cover": "/covers/floating-apart.jpg",
  "coverAlt": "...",              // real alt text, not the title again
  "outlets": [],                  // platform links, see below
  "selfHosted": { "tracks": [...] },
  "myPart": "...",                // 1–3 sentences
  "credits": [{ "role": "Mix", "name": "..." }]
}
```

**A release needs at least one `outlets` entry or a `selfHosted` block.**
A release with neither has no way to be listened to, so the build fails
with a message naming the file. That check lives in `src/content.config.ts`.

### Dates

`"2026-03"` renders as a hanging `2026` with `Mar` under it. `"2026"`
renders the year alone. Year-only releases sort as if they were December,
so they sit above dated releases in the same year.

### Outlets

Add them as the release goes live anywhere. Order is preserved.

```json
"outlets": [
  { "platform": "bandcamp",   "url": "https://..." },
  { "platform": "spotify",    "url": "https://..." },
  { "platform": "soundcloud", "url": "https://..." },
  { "platform": "other",      "url": "https://...", "label": "Fathom Records" }
]
```

Valid platforms: `bandcamp`, `spotify`, `soundcloud`, `apple`, `youtube`,
`other`. Only `other` uses `label`. The detail page adds a hint per row —
"buy / download" for Bandcamp, "stream" for the streaming services.

### Self-hosted audio

```json
"selfHosted": {
  "tracks": [
    { "title": "Transom", "src": "/audio/transom.mp3", "duration": "4:10" }
  ]
}
```

`duration` is an optional listing hint; the player reads the real duration
off the file. Multiple tracks render one row each behind a single `<audio>`
element. Delete the whole `selfHosted` key if the audio lives elsewhere.

A release with `selfHosted` and no outlets shows a single **Play here** row
on the index that jumps to the detail page's player.

## Removing or renaming

Delete the JSON file, or rename it — the filename is the slug and the URL
(`/r/<slug>`). Renaming changes the URL, so only do it before you've shared
the link.

## Local preview

```bash
npm run dev
```

The content collection hot-reloads, so editing a JSON file updates the page
without a restart.

## Checking before you push

```bash
npm run build
```

This is the same build Vercel runs. If a release is malformed, it fails
here with the file path and the reason.

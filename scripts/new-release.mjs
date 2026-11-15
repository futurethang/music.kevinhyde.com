#!/usr/bin/env node
/**
 * Scaffold a release.
 *
 *   npm run new -- "Floating Apart"
 *   npm run new -- "Harbor Light" --artist "Dismal Nitch" --format EP --date 2026-01
 *
 * Writes src/content/releases/<slug>.json, then tells you exactly which
 * two files to drop in. No CMS, no platform, no account.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const title = argv.find((a) => !a.startsWith('--'));

if (!title) {
  console.error(`
Usage: npm run new -- "Title" [options]

  --artist  <name>    default "Dismal Nitch"
  --role    <text>    default "Everything"
  --format  <text>    Single | EP | LP | Self-released   (default Single)
  --date    <YYYY-MM> default this month
  --slug    <slug>    default derived from the title
`);
  process.exit(1);
}

const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '')
   .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

const now = new Date();
const slug = slugify(opt('slug', title));
const date = opt('date', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

const dir = 'src/content/releases';
mkdirSync(dir, { recursive: true });
const file = join(dir, `${slug}.json`);

if (existsSync(file)) {
  console.error(`\n  ${file} already exists. Pass --slug to use a different one.\n`);
  process.exit(1);
}

const release = {
  title,
  artist: opt('artist', 'Dismal Nitch'),
  role: opt('role', 'Everything'),
  date,
  format: opt('format', 'Single'),
  cover: `/covers/${slug}.jpg`,
  coverAlt: `Cover art for ${title}`,
  // A release needs at least one outlet OR selfHosted, or the build fails.
  outlets: [],
  selfHosted: { tracks: [{ title, src: `/audio/${slug}.mp3` }] },
  myPart: '',
  credits: [{ role: 'Written, performed by', name: 'Kevin Hyde' }],
};

writeFileSync(file, JSON.stringify(release, null, 2) + '\n');

console.log(`
  Created ${file}

  Now drop in two files:
    public/covers/${slug}.jpg     square, 1400x1400
    public/audio/${slug}.mp3      ffmpeg -i master.wav -b:a 320k public/audio/${slug}.mp3

  Then edit the JSON:
    myPart    one to three sentences about your part
    outlets   paste platform URLs as they go live, e.g.
              { "platform": "bandcamp", "url": "https://..." }
    selfHosted  delete it if you are not hosting the audio here

  Preview with:  npm run dev
`);

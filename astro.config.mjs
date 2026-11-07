// @ts-check
import { defineConfig } from 'astro/config';

// Static output. Vercel auto-detects Astro, runs `astro build`, and serves
// `dist/` — no adapter needed, which also keeps the dependency tree at two
// packages. Add @astrojs/vercel only if this site ever needs SSR or ISR.
export default defineConfig({
  site: 'https://music.kevinhyde.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});

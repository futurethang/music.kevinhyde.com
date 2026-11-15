// @ts-check
import { defineConfig } from 'astro/config';

// Static output, published to GitHub Pages by .github/workflows/deploy.yml.
// No adapter: the build is plain static files, which keeps the dependency
// tree at two packages.
//
// `site` must stay in sync with public/CNAME. There is no `base` because
// the site is served from the root of a custom domain, not a /repo/ path.
export default defineConfig({
  site: 'https://music.kevinhyde.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});

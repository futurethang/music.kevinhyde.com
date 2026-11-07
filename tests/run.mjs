#!/usr/bin/env node
/**
 * Runs the acceptance checks against a preview server on :4321.
 *
 *   npm run build && npm run preview &
 *   npm test
 *
 * Requires playwright on the machine (`npm i -D playwright` or a global
 * install). It is deliberately NOT a dependency of this project so that
 * Vercel's build stays to two packages and doesn't download browsers.
 */
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync(new URL('.', import.meta.url))
  .filter((f) => f.endsWith('.test.cjs'))
  .sort();

let failed = 0;
for (const f of files) {
  console.log(`\n\u001b[1m${f}\u001b[0m`);
  const code = await new Promise((res) => {
    spawn(process.execPath, [new URL(f, import.meta.url).pathname], {
      stdio: 'inherit',
    }).on('close', res);
  });
  if (code !== 0) failed++;
}

console.log(failed ? `\n${failed} file(s) failed` : '\nAll acceptance checks passed');
process.exit(failed ? 1 : 0);

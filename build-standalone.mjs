#!/usr/bin/env node
/**
 * Packs the game into a single self-contained HTML file.
 *
 *   node build-standalone.mjs
 *     → dist/standalone.html   full document, open it from anywhere (file://, any host)
 *     → dist/embed.html        body-only variant for hosts that supply their own <head>
 *
 * Everything is inlined: the stylesheet, the bundled ES modules, and the two
 * webfonts as base64 @font-face rules — no network requests at runtime, which is
 * what lets it run offline and inside strict-CSP embeds.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = import.meta.dirname;
const DIST = path.join(ROOT, 'dist');

/* ─────────────── fonts ─────────────── */

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Fetch a Google Fonts stylesheet and inline the requested subsets as data URIs. */
async function inlineFont(family, weights, subsets) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(';')}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': CHROME_UA } })).text();

  // Each @font-face block is preceded by a "/* subset */" comment.
  const blocks = css.split('/*').slice(1);
  const out = [];

  for (const block of blocks) {
    const subset = block.slice(0, block.indexOf('*/')).trim();
    if (!subsets.includes(subset)) continue;

    const src = /src:\s*url\((https:[^)]+\.woff2)\)/.exec(block);
    const weight = /font-weight:\s*(\d+)/.exec(block);
    const range = /unicode-range:\s*([^;]+);/.exec(block);
    if (!src || !weight) continue;

    const bytes = Buffer.from(await (await fetch(src[1])).arrayBuffer());
    out.push(
      `@font-face{font-family:'${family.replace(/\+/g, ' ')}';font-style:normal;` +
      `font-weight:${weight[1]};font-display:swap;` +
      `src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2');` +
      (range ? `unicode-range:${range[1].trim()};` : '') +
      '}',
    );
    process.stdout.write(`  ${family} ${weight[1]} ${subset} — ${(bytes.length / 1024).toFixed(1)} KB\n`);
  }
  return out.join('\n');
}

/* ─────────────── build ─────────────── */

console.log('fonts:');
const fonts = [
  await inlineFont('Heebo', [400, 500, 700, 900], ['hebrew']),
  // Latin in the sans stack only shows up in body copy, so two weights is plenty.
  await inlineFont('Heebo', [400, 700], ['latin']),
  await inlineFont('JetBrains+Mono', [400, 700], ['latin']),
].join('\n');

console.log('bundling modules…');
await mkdir(DIST, { recursive: true });
const bundlePath = path.join(DIST, '.bundle.js');
await run('npx', ['--yes', 'esbuild@0.24.0', 'src/main.js', '--bundle', '--format=esm',
  '--target=es2022', `--outfile=${bundlePath}`], { cwd: ROOT });

const [html, css, js] = await Promise.all([
  readFile(path.join(ROOT, 'index.html'), 'utf8'),
  readFile(path.join(ROOT, 'styles.css'), 'utf8'),
  readFile(bundlePath, 'utf8'),
]);
await rm(bundlePath);

// `</script>` inside a string literal would close the inline script tag early.
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

const styleBlock = `<style>\n${fonts}\n\n${css}</style>`;
const scriptBlock = `<script type="module">\n${safeJs}</script>`;

// Replacer *functions*, not strings: `$$` and `$&` inside the CSS or the JS
// bundle would otherwise be interpreted as replacement patterns and corrupted.
const full = html
  .replace(/\s*<link rel="preconnect"[^>]*>/g, '')
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/g, '')
  .replace('<link rel="stylesheet" href="styles.css">', () => styleBlock)
  .replace('<script type="module" src="src/main.js"></script>', () => scriptBlock);

await writeFile(path.join(DIST, 'standalone.html'), full);

// Body-only variant: the host supplies <html>, so the style block has to travel
// with the body and RTL has to come from CSS rather than the dir attribute.
const body = full.slice(full.indexOf('<body>') + 6, full.lastIndexOf('</body>')).trim();
const embedStyle = `<style>\n:root { direction: rtl; }\n${fonts}\n\n${css}</style>`;

await writeFile(
  path.join(DIST, 'embed.html'),
  `<title>Project Roy: Off the Grid</title>\n${embedStyle}\n${body}\n`,
);

for (const f of ['standalone.html', 'embed.html']) {
  const { size } = await import('node:fs').then((fs) => fs.promises.stat(path.join(DIST, f)));
  console.log(`dist/${f} — ${(size / 1024).toFixed(0)} KB`);
}

/**
 * Writes every route's share image (1200×630 PNG) to `public/og/` before `next build`
 * (05 §1, PK-061). The output is generated and git-ignored; the templates are in `og/`.
 *
 * Run through Nx (`nx run site:og-images`), which builds `@postkit/content` first. Drafts are
 * left out unless NODE_ENV is something other than `production`; the target sets it. The
 * templates are TSX and import the site's own `src/lib` modules, so they load through jiti.
 * The first run on a machine downloads the pinned fonts (`og/fonts.ts`).
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const workspaceRoot = join(siteRoot, '..', '..');

const jiti = createJiti(import.meta.url, { jsx: { runtime: 'automatic' } });
const { buildShareImages } = (await jiti.import(
  '../og/build.ts',
)) as typeof import('../og/build.ts');

const started = performance.now();
const images = await buildShareImages({
  contentDirectory: join(workspaceRoot, 'libs', 'content'),
  publicDirectory: join(siteRoot, 'public'),
  fontCacheDirectory: join(
    workspaceRoot,
    'node_modules',
    '.cache',
    'postkit-site-og-fonts',
  ),
  nodeEnv: process.env['NODE_ENV'],
  log: (line) => process.stdout.write(`${line}\n`),
});

const counts = new Map<string, number>();
for (const image of images) {
  counts.set(image.kind, (counts.get(image.kind) ?? 0) + 1);
}
process.stdout.write(
  `Share images: ${images.length} (${[...counts]
    .map(([kind, count]) => `${count} ${kind}`)
    .join(', ')}) → ${join(siteRoot, 'public', 'og')} in ${(
    (performance.now() - started) /
    1000
  ).toFixed(1)}s\n`,
);

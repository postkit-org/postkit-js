/**
 * Copies `@postkit/react/styles.css` (the optional baseline) into `public/` for the home
 * renderer panel's Editor tab (PK-030, 03 D10). The tab renders in an iframe with its own
 * document, and only that document links this file, so the baseline's `:root` tokens and
 * its `[data-postkit-component]` rules never reach the site's own pages. The output is
 * generated and git-ignored. Run through Nx (`nx run site:renderer-styles`), which builds
 * `@postkit/react` first.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJiti } from 'jiti';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const jiti = createJiti(import.meta.url);
const { rendererStylesheetHref } = (await jiti.import(
  '../src/components/home/renderer-stylesheet.ts',
)) as typeof import('../src/components/home/renderer-stylesheet.ts');

const source = createRequire(import.meta.url).resolve(
  '@postkit/react/styles.css',
);
const target = join(siteRoot, 'public', rendererStylesheetHref);

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
process.stdout.write(`Renderer styles: ${source} → ${target}\n`);

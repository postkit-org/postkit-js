/**
 * Writes the notes and changelog feeds (RSS 2.0, Atom, JSON Feed 1.1) to `public/feeds/`
 * before `next build` (01 §3, §10; PK-042). The output is generated and git-ignored.
 *
 * Run through Nx (`nx run site:feeds`), which builds `@postkit/site-feeds` first. Drafts are
 * left out unless NODE_ENV is something other than `production`; the target sets it.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveSiteUrl, writeSiteFeeds } from '@postkit/site-feeds';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const outDirectory = join(siteRoot, 'public', 'feeds');

const feeds = writeSiteFeeds({
  contentDirectory: join(siteRoot, '..', '..', 'libs', 'content'),
  outDirectory,
  siteUrl: resolveSiteUrl(),
  nodeEnv: process.env['NODE_ENV'],
});

for (const feed of feeds) {
  process.stdout.write(
    `Feed ${feed.name}: ${feed.items.length} item(s) → ${join(outDirectory, feed.name)}.{xml,atom,json}\n`,
  );
  for (const item of feed.items) {
    if (item.content.kind === 'summary') {
      process.stdout.write(
        `  ${item.url}: summary and link only (${item.content.reason})\n`,
      );
    }
  }
}

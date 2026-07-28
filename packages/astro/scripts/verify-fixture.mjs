import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../fixture/dist/index.html', import.meta.url),
  'utf8',
);

for (const component of [
  'AppearsOn',
  'Audio',
  'AuthorCard',
  'CallToAction',
  'Carousel',
  'Chart',
  'LinkPreview',
  'NewsletterSignup',
  'ShareActions',
  'SocialPost',
  'Video',
]) {
  if (!html.includes(`data-postkit-component="${component}"`)) {
    throw new Error(`Astro fixture did not render Postkit ${component}.`);
  }
}

const islands = html.match(/<astro-island\b/g) ?? [];
if (islands.length !== 5) {
  throw new Error(
    `Expected five interactive Postkit islands, but found ${islands.length}.`,
  );
}

const visibleIslands = html.match(/client="visible"/g) ?? [];
if (visibleIslands.length !== 5) {
  throw new Error(
    `Expected five visible-hydrated islands, but found ${visibleIslands.length}.`,
  );
}

process.stdout.write('Postkit Astro fixture verified.\n');

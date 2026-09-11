import { readFile } from 'node:fs/promises';

const html = await readFile(
  new URL('../../../examples/astro/dist/index.html', import.meta.url),
  'utf8',
);

for (const component of [
  'AppearsOn',
  'Audio',
  'AuthorCard',
  'CallToAction',
  'Carousel',
  'CodeBlock',
  'CodeGroup',
  'Chart',
  'LinkPreview',
  'NewsletterSignup',
  'Poll',
  'ShareActions',
  'SocialPost',
  'Tabs',
  'Video',
]) {
  if (!html.includes(`data-postkit-component="${component}"`)) {
    throw new Error(`Astro fixture did not render Postkit ${component}.`);
  }
}

const islands = html.match(/<astro-island\b[^>]*>/g) ?? [];
const interactive = [
  'Carousel',
  'CodeBlock',
  'CodeGroup',
  'LinkPreview',
  'NewsletterSignup',
  'Poll',
  'ShareActions',
  'SocialPost',
  'Tabs',
];
if (islands.length !== interactive.length)
  throw new Error(
    `Expected ${interactive.length} islands, received ${islands.length}.`,
  );
for (const name of interactive) {
  if (
    !islands.some(
      (island) =>
        island.includes(`component-export="${name}"`) &&
        island.includes('client="visible"'),
    )
  ) {
    throw new Error(`Astro ${name} must hydrate on visibility.`);
  }
}

process.stdout.write('PostKit Astro example verified.\n');

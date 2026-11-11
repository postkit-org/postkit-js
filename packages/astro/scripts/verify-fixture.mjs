import { readFile, readdir } from 'node:fs/promises';

/*
 * Inspects the built Astro examples: `examples/astro` (the default Chakra
 * renderer) and `examples/astro-headless` (`renderer: 'headless'` with the
 * `styles.css` baseline). Both build the same article, so both must render
 * the same components and hydrate the same islands.
 */

const rendered = [
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
];
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

async function readBuild(example) {
  const dist = new URL(`../../../examples/${example}/dist/`, import.meta.url);
  const html = await readFile(new URL('index.html', dist), 'utf8');
  const assets = new URL('_astro/', dist);
  const files = await readdir(assets);
  const read = (extension) =>
    Promise.all(
      files
        .filter((file) => file.endsWith(extension))
        .map((file) => readFile(new URL(file, assets), 'utf8')),
    );
  return { html, scripts: await read('.js'), styles: await read('.css') };
}

function verifyShared(example, html) {
  for (const component of rendered) {
    if (!html.includes(`data-postkit-component="${component}"`)) {
      throw new Error(`${example}: did not render Postkit ${component}.`);
    }
  }

  const islands = html.match(/<astro-island\b[^>]*>/g) ?? [];
  if (islands.length !== interactive.length)
    throw new Error(
      `${example}: expected ${interactive.length} islands, received ${islands.length}.`,
    );
  for (const name of interactive) {
    if (
      !islands.some(
        (island) =>
          island.includes(`component-export="${name}"`) &&
          island.includes('client="visible"'),
      )
    ) {
      throw new Error(`${example}: Astro ${name} must hydrate on visibility.`);
    }
  }
}

const chakra = await readBuild('astro');
verifyShared('examples/astro', chakra.html);
if (!/class="[^"]*\bchakra-/.test(chakra.html)) {
  throw new Error('examples/astro: expected the Chakra views by default.');
}

const headless = await readBuild('astro-headless');
verifyShared('examples/astro-headless', headless.html);
if (/class="[^"]*\b(?:chakra|css)-|data-emotion/.test(headless.html)) {
  throw new Error(
    'examples/astro-headless: rendered Chakra or Emotion markup with renderer: "headless".',
  );
}
if (headless.scripts.some((script) => /@chakra-ui|emotion/.test(script))) {
  throw new Error(
    'examples/astro-headless: an island bundled Chakra or Emotion with renderer: "headless".',
  );
}
if (!headless.styles.some((style) => style.includes('--postkit-chart-1'))) {
  throw new Error(
    'examples/astro-headless: styles: true did not add @postkit/react/styles.css.',
  );
}

process.stdout.write('Postkit Astro examples verified (chakra, headless).\n');

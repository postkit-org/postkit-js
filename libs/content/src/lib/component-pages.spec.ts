import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import {
  componentAnatomySchema,
  componentNameToPageSlug,
  componentPageSchema,
  componentPageSlugToName,
  createComponentPagesCollection,
} from './component-pages.js';

const root = { part: 'root', element: 'aside', description: 'Surface.' };
const validAnatomy = {
  layers: [
    {
      part: 'icon',
      element: 'span',
      description: 'The tone mark.',
      box: { x: 16, y: 16, w: 30, h: 30 },
    },
    { ...root, box: { x: 0, y: 0, w: 400, h: 104 } },
  ],
};

describe('componentPageSchema', () => {
  it('accepts a page with only a body', () => {
    expect(componentPageSchema.parse({ content: '## Usage' })).toEqual({
      content: '## Usage',
    });
  });

  it('validates and normalizes the full frontmatter', () => {
    expect(
      componentPageSchema.parse({
        tagline: '  Make sure the important part gets read.  ',
        anatomy: validAnatomy,
        related: ['Aside', ' KeyTakeaway '],
        content: '## Usage',
      }),
    ).toEqual({
      tagline: 'Make sure the important part gets read.',
      anatomy: validAnatomy,
      related: ['Aside', 'KeyTakeaway'],
      content: '## Usage',
    });
  });

  it('rejects an empty tagline', () => {
    expect(() =>
      componentPageSchema.parse({ tagline: ' ', content: '' }),
    ).toThrow();
  });

  it.each(['key-takeaway', 'keyTakeaway', ''])(
    'rejects the related name %j',
    (name) => {
      expect(() =>
        componentPageSchema.parse({ related: [name], content: '' }),
      ).toThrow();
    },
  );
});

describe('componentAnatomySchema', () => {
  it('needs at least one layer', () => {
    expect(() => componentAnatomySchema.parse({ layers: [] })).toThrow();
  });

  it.each(['<aside>', 'Aside', ''])('rejects the element %j', (element) => {
    expect(() =>
      componentAnatomySchema.parse({
        layers: [{ ...root, element, box: { x: 0, y: 0, w: 10, h: 10 } }],
      }),
    ).toThrow();
  });

  it.each([
    { x: -1, y: 0, w: 10, h: 10 },
    { x: 0, y: 0, w: 0, h: 10 },
    { x: 0, y: 0, w: 10 },
  ])('rejects the box %j', (box) => {
    expect(() =>
      componentAnatomySchema.parse({ layers: [{ ...root, box }] }),
    ).toThrow();
  });

  it('rejects a repeated part', () => {
    expect(() =>
      componentAnatomySchema.parse({
        layers: [validAnatomy.layers[1], validAnatomy.layers[1]],
      }),
    ).toThrow(/more than once/);
  });

  it('rejects a box that spills outside the root (last) layer', () => {
    expect(() =>
      componentAnatomySchema.parse({
        layers: [
          { ...validAnatomy.layers[0], box: { x: 380, y: 0, w: 30, h: 30 } },
          validAnatomy.layers[1],
        ],
      }),
    ).toThrow(/must sit inside/);
  });
});

describe('component page slugs', () => {
  it.each([
    ['callout', 'Callout'],
    ['key-takeaway', 'KeyTakeaway'],
    ['code-block', 'CodeBlock'],
    ['figure', 'Figure'],
  ])('maps %s to %s and back', (slug, name) => {
    expect(componentPageSlugToName(slug)).toBe(name);
    expect(componentNameToPageSlug(name)).toBe(slug);
  });

  it('rejects a slug that is not URL-safe', () => {
    expect(() => componentPageSlugToName('Key_Takeaway')).toThrow();
  });
});

describe('createComponentPagesCollection', () => {
  it('creates a reusable collection rooted at the supplied directory', () => {
    expect(
      createComponentPagesCollection('../../libs/content/components'),
    ).toMatchObject({
      name: 'componentPages',
      directory: '../../libs/content/components',
      include: '**/*.md',
      type: 'collection',
    });
  });
});

describe('libs/content/components', () => {
  const directory = join(__dirname, '../../components');
  // The generated manifest is the catalog's source for the site (AGENTS.md); read as data so
  // this library doesn't take a dependency on @postkit/chakra.
  const manifest = JSON.parse(
    readFileSync(
      join(__dirname, '../../../../packages/chakra/component-manifest.json'),
      'utf8',
    ),
  ) as { components: Record<string, unknown> };
  const catalogNames = new Set(Object.keys(manifest.components));

  const pages = readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(join(directory, file), 'utf8');
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
      return {
        slug: file.replace(/\.md$/, ''),
        ...componentPageSchema.parse({
          ...parseYaml(match?.[1] ?? ''),
          content: match?.[2] ?? source,
        }),
      };
    });

  it('has the four designed components, each with a tagline and anatomy', () => {
    expect(pages.map((page) => page.slug).sort()).toEqual(
      expect.arrayContaining([
        'callout',
        'code-block',
        'figure',
        'key-takeaway',
      ]),
    );
    for (const slug of ['callout', 'code-block', 'figure', 'key-takeaway']) {
      const page = pages.find((candidate) => candidate.slug === slug);
      expect(page?.tagline).toBeTruthy();
      expect(page?.anatomy?.layers.at(-1)?.part).toBe('root');
    }
  });

  it.each(pages.map((page) => [page.slug, page] as const))(
    '%s maps to a real catalog component',
    (_slug, page) => {
      expect(catalogNames).toContain(componentPageSlugToName(page.slug));
    },
  );

  it.each(pages.map((page) => [page.slug, page] as const))(
    '%s only relates real catalog components, never itself',
    (_slug, page) => {
      for (const name of page.related ?? []) {
        expect(catalogNames).toContain(name);
        expect(name).not.toBe(componentPageSlugToName(page.slug));
      }
    },
  );
});

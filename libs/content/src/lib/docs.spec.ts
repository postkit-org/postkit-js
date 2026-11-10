import {
  compareDocsEntries,
  createDocsCollection,
  docsCategories,
  docsEntrySchema,
  isDocsEntryVisible,
  selectDocsEntries,
} from './docs.js';

const validEntry = {
  title: 'Quick start',
  summary: 'Mount the provider and render a first portable article component.',
  category: 'Get started',
  order: 3,
  status: 'published',
  content: '# Quick start',
};

describe('docsEntrySchema', () => {
  it('validates and normalizes documentation frontmatter', () => {
    expect(
      docsEntrySchema.parse({
        ...validEntry,
        title: '  Quick start  ',
      }),
    ).toEqual(validEntry);
  });

  it('defaults status to published and leaves since unset', () => {
    const parsed = docsEntrySchema.parse({ ...validEntry, status: undefined });

    expect(parsed.status).toBe('published');
    expect(parsed.since).toBeUndefined();
  });

  it('accepts a since version and a draft status', () => {
    expect(
      docsEntrySchema.parse({ ...validEntry, since: '0.3.0', status: 'draft' }),
    ).toMatchObject({ since: '0.3.0', status: 'draft' });
  });

  it.each(docsCategories)('accepts the category %s', (category) => {
    expect(docsEntrySchema.parse({ ...validEntry, category }).category).toBe(
      category,
    );
  });

  it.each(['Start here', 'get started', 'Integration', ''])(
    'rejects the category "%s"',
    (category) => {
      expect(() =>
        docsEntrySchema.parse({ ...validEntry, category }),
      ).toThrow();
    },
  );

  it.each([-1, 0, 1.5])('rejects the invalid order %s', (order) => {
    expect(() => docsEntrySchema.parse({ ...validEntry, order })).toThrow();
  });

  it.each(['archived', 'Draft'])('rejects the status "%s"', (status) => {
    expect(() => docsEntrySchema.parse({ ...validEntry, status })).toThrow();
  });

  it('rejects an empty since', () => {
    expect(() =>
      docsEntrySchema.parse({ ...validEntry, since: ' ' }),
    ).toThrow();
  });
});

describe('draft filtering', () => {
  const entries = [
    { title: 'Kits', category: 'Get started', order: 4, status: 'draft' },
    {
      title: 'Troubleshooting',
      category: 'Reference',
      order: 8,
      status: 'published',
    },
    {
      title: 'Introduction',
      category: 'Get started',
      order: 1,
      status: 'published',
    },
    { title: 'MDX', category: 'Writing', order: 1, status: 'published' },
  ] as const;

  it('hides drafts unless drafts are included', () => {
    expect(
      isDocsEntryVisible({ status: 'draft' }, { includeDrafts: false }),
    ).toBe(false);
    expect(
      isDocsEntryVisible({ status: 'draft' }, { includeDrafts: true }),
    ).toBe(true);
    expect(
      isDocsEntryVisible({ status: 'published' }, { includeDrafts: false }),
    ).toBe(true);
  });

  it('filters drafts out of production lists', () => {
    expect(
      selectDocsEntries(entries, { includeDrafts: false }).map(
        (entry) => entry.title,
      ),
    ).toEqual(['Introduction', 'MDX', 'Troubleshooting']);
  });

  it('keeps drafts in development, in nav order', () => {
    expect(
      selectDocsEntries(entries, { includeDrafts: true }).map(
        (entry) => entry.title,
      ),
    ).toEqual(['Introduction', 'Kits', 'MDX', 'Troubleshooting']);
  });

  it('orders by group before order', () => {
    expect(
      compareDocsEntries(
        { title: 'MDX', category: 'Writing', order: 1, status: 'published' },
        {
          title: 'Kits',
          category: 'Get started',
          order: 4,
          status: 'published',
        },
      ),
    ).toBeGreaterThan(0);
  });
});

describe('createDocsCollection', () => {
  it('creates a reusable collection rooted at the supplied directory', () => {
    const collection = createDocsCollection('../../libs/content/docs');

    expect(collection).toMatchObject({
      name: 'docsEntries',
      directory: '../../libs/content/docs',
      include: '**/*.md',
      type: 'collection',
    });
  });
});

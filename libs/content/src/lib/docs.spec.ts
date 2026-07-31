import { createDocsCollection, docsEntrySchema } from './docs.js';

const validEntry = {
  title: 'Getting started',
  summary: 'Install PostKit and render your first article.',
  category: 'Introduction',
  order: 1,
  content: '# Getting started',
};

describe('docsEntrySchema', () => {
  it('validates and normalizes documentation frontmatter', () => {
    expect(
      docsEntrySchema.parse({
        ...validEntry,
        title: '  Getting started  ',
      }),
    ).toEqual(validEntry);
  });

  it.each([-1, 1.5])('rejects the invalid order %s', (order) => {
    expect(() => docsEntrySchema.parse({ ...validEntry, order })).toThrow();
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

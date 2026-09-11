import {
  changelogEntrySchema,
  createChangelogCollection,
} from './changelog.js';

const validEntry = {
  title: 'PostKit 0.2.0',
  version: '0.2.0',
  date: '2026-08-01',
  summary: 'A short release summary.',
  tags: ['components'],
  content: '# PostKit 0.2.0',
};

describe('changelogEntrySchema', () => {
  it('validates and normalizes changelog frontmatter', () => {
    expect(
      changelogEntrySchema.parse({
        ...validEntry,
        title: '  PostKit 0.2.0  ',
        tags: ['  components  '],
      }),
    ).toEqual(validEntry);
  });

  it('provides an empty tags array by default', () => {
    const { tags } = changelogEntrySchema.parse({
      ...validEntry,
      tags: undefined,
    });

    expect(tags).toEqual([]);
  });

  it.each(['August 1, 2026', '2026-02-31'])(
    'rejects the invalid date %s',
    (date) => {
      expect(() =>
        changelogEntrySchema.parse({ ...validEntry, date }),
      ).toThrow();
    },
  );
});

describe('createChangelogCollection', () => {
  it('creates a reusable collection rooted at the supplied directory', () => {
    const collection = createChangelogCollection(
      '../../libs/content/changelog',
    );

    expect(collection).toMatchObject({
      name: 'changelogEntries',
      directory: '../../libs/content/changelog',
      include: '**/*.md',
      type: 'collection',
    });
  });
});

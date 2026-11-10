import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  createPostkitRemarkPlugins,
  isPostkitComponentName,
} from '@postkit/chakra/remark';
import { serialize } from 'next-mdx-remote/serialize';

import {
  createNotesCollection,
  includesDraftNotes,
  notesEntrySchema,
  selectVisibleNotes,
} from './notes.js';

const validEntry = {
  title: 'One article, four renderers.',
  subtitle: 'What happens when everything wants to show it.',
  summary: 'A callout has to survive a feed reader.',
  kind: 'guide',
  date: '2026-11-10',
  author: { name: 'Ryan Hefner' },
  cover: 'gradient',
  status: 'draft',
  content: 'A callout is a small thing.',
};

describe('notesEntrySchema', () => {
  it('validates and normalizes note frontmatter', () => {
    expect(
      notesEntrySchema.parse({
        ...validEntry,
        title: `  ${validEntry.title}  `,
      }),
    ).toEqual(validEntry);
  });

  it('defaults cover to the gradient and status to published', () => {
    const { cover, status } = notesEntrySchema.parse({
      ...validEntry,
      cover: undefined,
      status: undefined,
    });

    expect(cover).toBe('gradient');
    expect(status).toBe('published');
  });

  it('accepts an image path as the cover', () => {
    expect(
      notesEntrySchema.parse({ ...validEntry, cover: '/notes/lead.jpg' }).cover,
    ).toBe('/notes/lead.jpg');
  });

  it('accepts a footnote placement override', () => {
    expect(
      notesEntrySchema.parse({ ...validEntry, footnotes: { placement: 'end' } })
        .footnotes,
    ).toEqual({ placement: 'end' });
  });

  it.each(['note', 'Guide', 'case_study', ''])(
    'rejects the invalid kind %j',
    (kind) => {
      expect(() => notesEntrySchema.parse({ ...validEntry, kind })).toThrow();
    },
  );

  it.each(['[DATE]', 'November 10, 2026', '2026-02-31'])(
    'rejects the invalid date %j',
    (date) => {
      expect(() => notesEntrySchema.parse({ ...validEntry, date })).toThrow();
    },
  );

  it.each(['upcoming', 'released', 'Draft'])(
    'rejects the invalid status %j',
    (status) => {
      expect(() => notesEntrySchema.parse({ ...validEntry, status })).toThrow();
    },
  );

  it('rejects an invalid footnote placement', () => {
    expect(() =>
      notesEntrySchema.parse({
        ...validEntry,
        footnotes: { placement: 'margin' },
      }),
    ).toThrow();
  });

  it.each(['summary', 'kind', 'date', 'author'])('requires %s', (field) => {
    expect(() =>
      notesEntrySchema.parse({ ...validEntry, [field]: undefined }),
    ).toThrow();
  });
});

describe('selectVisibleNotes', () => {
  const notes = [
    { slug: 'published', status: 'published' as const },
    { slug: 'draft', status: 'draft' as const },
  ];

  it('leaves drafts out of production builds', () => {
    expect(includesDraftNotes('production')).toBe(false);
    expect(selectVisibleNotes(notes, 'production')).toEqual([notes[0]]);
  });

  it.each(['development', 'test', undefined])(
    'keeps drafts when NODE_ENV is %j',
    (nodeEnv) => {
      expect(includesDraftNotes(nodeEnv)).toBe(true);
      expect(selectVisibleNotes(notes, nodeEnv)).toEqual(notes);
    },
  );
});

describe('createNotesCollection', () => {
  it('reads Markdown and MDX from the supplied directory', () => {
    expect(createNotesCollection('../../libs/content/notes')).toMatchObject({
      name: 'notesEntries',
      directory: '../../libs/content/notes',
      include: ['**/*.md', '**/*.mdx'],
      type: 'collection',
    });
  });
});

describe('authored notes', () => {
  const notesDirectory = join(__dirname, '../../notes');
  const files = readdirSync(notesDirectory).filter((file) =>
    /\.mdx?$/.test(file),
  );

  it('includes the first note', () => {
    expect(files).toContain('one-article-four-renderers.mdx');
  });

  // Mirrors apps/site/src/lib/notes.server.ts: the same serialize call and
  // remark preset the site uses, so a note that fails here fails the site.
  it.each(files)(
    'compiles %s through the site MDX pipeline',
    async (file) => {
      const source = readFileSync(join(notesDirectory, file), 'utf8');
      const result = await serialize(source, {
        mdxOptions: { remarkPlugins: createPostkitRemarkPlugins() },
      });
      const usedComponents = new Set(
        [
          ...result.compiledSource.matchAll(/_missingMdxReference\("(\w+)"/g),
        ].map(([, name]) => name),
      );

      expect(result.compiledSource).not.toContain('[DATE]');
      expect(usedComponents.size).toBeGreaterThan(0);
      expect(
        [...usedComponents].filter((name) => !isPostkitComponentName(name)),
      ).toEqual([]);
    },
    30_000,
  );

  it('compiles the first note’s footnotes to Footnote and Footnotes', async () => {
    const source = readFileSync(
      join(notesDirectory, 'one-article-four-renderers.mdx'),
      'utf8',
    );
    const { compiledSource } = await serialize(source, {
      mdxOptions: { remarkPlugins: createPostkitRemarkPlugins() },
    });

    expect(compiledSource).toContain('_missingMdxReference("Footnote"');
    expect(compiledSource).toContain('_missingMdxReference("Footnotes"');
    expect(compiledSource).not.toContain('data-footnote-ref');
  });
});

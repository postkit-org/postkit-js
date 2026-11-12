import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import {
  changelogEntrySchema,
  changelogVersionSlug,
  compareChangelogVersions,
  createChangelogCollection,
  getLatestChangelogRelease,
  getReleasedChangelogEntries,
  sortChangelogEntries,
} from './changelog.js';

const validEntry = {
  title: 'Postkit 0.2.0',
  subtitle: 'Portable documents, host-native Chakra and email.',
  version: '0.2.0',
  status: 'released',
  date: '2026-08-01',
  summary: 'A short release summary.',
  tags: ['components'],
  content: '# Postkit 0.2.0',
};

describe('changelogEntrySchema', () => {
  it('validates and normalizes changelog frontmatter', () => {
    expect(
      changelogEntrySchema.parse({
        ...validEntry,
        title: '  Postkit 0.2.0  ',
        subtitle: '  Portable documents, host-native Chakra and email.  ',
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

  it('defaults the status to released', () => {
    const { status } = changelogEntrySchema.parse({
      ...validEntry,
      status: undefined,
    });

    expect(status).toBe('released');
  });

  it('accepts an upcoming entry', () => {
    expect(
      changelogEntrySchema.parse({ ...validEntry, status: 'upcoming' }).status,
    ).toBe('upcoming');
  });

  it.each(['draft', 'published', 'Released', ''])(
    'rejects the invalid status %j',
    (status) => {
      expect(() =>
        changelogEntrySchema.parse({ ...validEntry, status }),
      ).toThrow();
    },
  );

  it.each([undefined, '', '   '])('requires a subtitle (%j)', (subtitle) => {
    expect(() =>
      changelogEntrySchema.parse({ ...validEntry, subtitle }),
    ).toThrow();
  });

  it.each(['August 1, 2026', '2026-02-31'])(
    'rejects the invalid date %s',
    (date) => {
      expect(() =>
        changelogEntrySchema.parse({ ...validEntry, date }),
      ).toThrow();
    },
  );

  it.each(['0.2', 'v0.2.0', '0.2.0.1', 'latest'])(
    'rejects the invalid version %s',
    (version) => {
      expect(() =>
        changelogEntrySchema.parse({ ...validEntry, version }),
      ).toThrow();
    },
  );
});

describe('changelogVersionSlug', () => {
  it.each([
    ['0.1.0', '0-1-0'],
    ['0.2.0', '0-2-0'],
    ['0.3.0', '0-3-0'],
    ['12.10.3', '12-10-3'],
    ['1.0.0-beta.1', '1-0-0-beta-1'],
    ['1.0.0-RC.2', '1-0-0-rc-2'],
  ])('derives the URL slug of %s from the version', (version, slug) => {
    expect(changelogVersionSlug(version)).toBe(slug);
  });

  it('rejects a version it cannot turn into a slug', () => {
    expect(() => changelogVersionSlug('next')).toThrow();
  });
});

describe('changelog ordering and release helpers', () => {
  const entries = [
    { version: '0.1.0', status: 'released' as const },
    { version: '0.3.0', status: 'upcoming' as const },
    { version: '0.10.0', status: 'upcoming' as const },
    { version: '0.2.0', status: 'released' as const },
    { version: '0.2.0-beta.1', status: 'released' as const },
  ];

  it('compares versions numerically, with prereleases before their release', () => {
    expect(compareChangelogVersions('0.10.0', '0.9.0')).toBeGreaterThan(0);
    expect(compareChangelogVersions('0.2.0-beta.1', '0.2.0')).toBeLessThan(0);
    expect(
      compareChangelogVersions('1.0.0-beta.10', '1.0.0-beta.9'),
    ).toBeGreaterThan(0);
    expect(compareChangelogVersions('0.2.0', '0.2.0')).toBe(0);
  });

  it('sorts every entry newest first, upcoming included', () => {
    expect(sortChangelogEntries(entries).map((entry) => entry.version)).toEqual(
      ['0.10.0', '0.3.0', '0.2.0', '0.2.0-beta.1', '0.1.0'],
    );
  });

  it('leaves upcoming entries out of the released list that feeds and emails read', () => {
    expect(
      getReleasedChangelogEntries(entries).map((entry) => entry.version),
    ).toEqual(['0.2.0', '0.2.0-beta.1', '0.1.0']);
  });

  it('picks the newest released entry as "Latest", never an upcoming one', () => {
    expect(getLatestChangelogRelease(entries)?.version).toBe('0.2.0');
    expect(
      getLatestChangelogRelease([{ version: '0.3.0', status: 'upcoming' }]),
    ).toBeUndefined();
  });

  it('does not reorder its input', () => {
    const copy = [...entries];
    sortChangelogEntries(entries);
    getReleasedChangelogEntries(entries);
    expect(entries).toEqual(copy);
  });
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

describe('libs/content/changelog', () => {
  const directory = join(__dirname, '../../changelog');
  const files = readdirSync(directory).filter((file) => file.endsWith('.md'));
  const entries = files.map((file) => {
    const source = readFileSync(join(directory, file), 'utf8');
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? '';
    return {
      file,
      ...changelogEntrySchema.parse({
        ...parseYaml(frontmatter),
        content: source,
      }),
    };
  });

  it('validates every entry', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('gives every entry its own version URL', () => {
    const slugs = entries.map((entry) => changelogVersionSlug(entry.version));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has a released entry to show as "Latest"', () => {
    expect(getLatestChangelogRelease(entries)).toBeDefined();
  });
});

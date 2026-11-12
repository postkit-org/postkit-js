import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import {
  changelogDateSchema,
  contentSlugSchema,
  nonEmptyString,
} from './shared.js';

// Re-exported for existing imports from './changelog.js'.
export { contentSlugSchema };

/** `0.2.0`, or a prerelease such as `1.0.0-beta.1`. */
export const changelogVersionSchema = z
  .string()
  .trim()
  .regex(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/,
    'Changelog versions must use semver (0.2.0 or 1.0.0-beta.1).',
  );

/**
 * `released` entries are the published history. `upcoming` entries ("In development") are
 * public on the index, their own page and in search, but are left out of feeds, share-image
 * "Latest" badges and release emails (handoff 01 §5.2).
 */
export const changelogStatusSchema = z
  .enum(['released', 'upcoming'])
  .default('released');

export type ChangelogStatus = z.infer<typeof changelogStatusSchema>;

export const changelogEntrySchema = z.object({
  title: nonEmptyString,
  /** The grey half of the title: "Portable documents, host-native Chakra and email." */
  subtitle: nonEmptyString,
  version: changelogVersionSchema,
  status: changelogStatusSchema,
  date: changelogDateSchema,
  summary: nonEmptyString,
  tags: z.array(nonEmptyString).default([]),
  content: z.string(),
});

export type ChangelogEntryData = z.infer<typeof changelogEntrySchema>;

/** The URL slug for a release: `0.2.0` → `0-2-0` (`/changelog/0-2-0`). */
export function changelogVersionSlug(version: string): string {
  return contentSlugSchema.parse(
    changelogVersionSchema.parse(version).replace(/\./g, '-').toLowerCase(),
  );
}

function parseVersion(version: string) {
  const [core, prerelease] = version.split(/-(.*)/s, 2);
  const [major, minor, patch] = core.split('.').map(Number);
  return { major, minor, patch, prerelease };
}

/** Semver order, ascending. A prerelease sorts before its release. */
export function compareChangelogVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);

  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease.localeCompare(b.prerelease, 'en', { numeric: true });
}

/** Every entry, newest version first (upcoming entries included). */
export function sortChangelogEntries<T extends { readonly version: string }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((left, right) =>
    compareChangelogVersions(right.version, left.version),
  );
}

/**
 * Released entries only, newest first. Feeds, share-image "Latest" badges and release emails
 * read this, never the full list, so `upcoming` entries can't leak into them.
 */
export function getReleasedChangelogEntries<
  T extends { readonly version: string; readonly status: ChangelogStatus },
>(entries: readonly T[]): T[] {
  return sortChangelogEntries(
    entries.filter((entry) => entry.status === 'released'),
  );
}

/** The newest released entry: the changelog index's "Latest". */
export function getLatestChangelogRelease<
  T extends { readonly version: string; readonly status: ChangelogStatus },
>(entries: readonly T[]): T | undefined {
  return getReleasedChangelogEntries(entries)[0];
}

/**
 * Creates the shared Postkit changelog collection for a consuming site.
 *
 * The directory is relative to that site's content-collections.ts file. Each entry's `slug`
 * comes from its `version` (`0-2-0`), not its filename; `fileSlug` keeps the filename, which
 * the old URLs used.
 */
export function createChangelogCollection(directory: string) {
  return defineCollection({
    name: 'changelogEntries',
    directory,
    include: '**/*.md',
    schema: changelogEntrySchema,
    transform: (entry) => ({
      ...entry,
      slug: changelogVersionSlug(entry.version),
      fileSlug: contentSlugSchema.parse(entry._meta.path),
    }),
  });
}

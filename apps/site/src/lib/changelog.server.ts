import { createPostkitRemarkPlugins } from '@postkit/chakra';
import {
  getLatestChangelogRelease as latestRelease,
  getReleasedChangelogEntries as releasedEntries,
  sortChangelogEntries,
} from '@postkit/content';
import { allChangelogEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { ChangelogEntry, ChangelogEntrySummary } from './changelog';

type GeneratedChangelogEntry = (typeof allChangelogEntries)[number];

function toSummary(entry: GeneratedChangelogEntry): ChangelogEntrySummary {
  return {
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    version: entry.version,
    status: entry.status,
    date: entry.date,
    summary: entry.summary,
    tags: Object.freeze([...entry.tags]),
  };
}

function assertUniqueVersions(entries: readonly GeneratedChangelogEntry[]) {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const previous = seen.get(entry.slug);
    if (previous) {
      throw new TypeError(
        `Changelog entries "${previous}" and "${entry._meta.filePath}" share the URL /changelog/${entry.slug}.`,
      );
    }
    seen.set(entry.slug, entry._meta.filePath);
  }
}

assertUniqueVersions(allChangelogEntries);

/**
 * Every entry, newest version first, upcoming ("In development") ones included. For the index,
 * entry pages and search; feeds, "Latest" and emails use {@link getReleasedChangelogEntries}.
 */
export function getChangelogEntries(): ChangelogEntrySummary[] {
  return sortChangelogEntries(allChangelogEntries).map(toSummary);
}

/** Released entries only, newest first: what feeds, share images and release emails read. */
export function getReleasedChangelogEntries(): ChangelogEntrySummary[] {
  return releasedEntries(allChangelogEntries).map(toSummary);
}

/** The newest released entry, shown as "Latest". */
export function getLatestChangelogRelease(): ChangelogEntrySummary | null {
  const entry = latestRelease(allChangelogEntries);
  return entry ? toSummary(entry) : null;
}

/** Looks an entry up by its version slug (`0-2-0`). */
export async function getChangelogEntry(slug: string): Promise<ChangelogEntry> {
  const entry = allChangelogEntries.find(
    (candidate) => candidate.slug === slug,
  );

  if (!entry) {
    throw new TypeError(`Unknown changelog version "${slug}".`);
  }

  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...toSummary(entry), source };
}

import { createPostkitRemarkPlugins } from '@postkit/react';
import { allChangelogEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { ChangelogEntry, ChangelogEntrySummary } from './changelog';

type GeneratedChangelogEntry = (typeof allChangelogEntries)[number];

function toSummary(entry: GeneratedChangelogEntry): ChangelogEntrySummary {
  return {
    slug: entry.slug,
    title: entry.title,
    version: entry.version,
    date: entry.date,
    summary: entry.summary,
    tags: Object.freeze([...entry.tags]),
  };
}

export function getChangelogEntries(): ChangelogEntrySummary[] {
  return allChangelogEntries
    .map(toSummary)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getChangelogEntry(slug: string): Promise<ChangelogEntry> {
  const entry = allChangelogEntries.find(
    (candidate) => candidate.slug === slug,
  );

  if (!entry) {
    throw new TypeError(`Unknown changelog slug "${slug}".`);
  }

  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...toSummary(entry), source };
}

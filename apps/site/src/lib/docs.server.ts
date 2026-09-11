import { createPostkitRemarkPlugins } from '@postkit/react';
import { allDocsEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { DocsEntry, DocsEntrySummary } from './docs';

type GeneratedDocsEntry = (typeof allDocsEntries)[number];

function toSummary(entry: GeneratedDocsEntry): DocsEntrySummary {
  return {
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    category: entry.category,
    order: entry.order,
  };
}

export function getDocsEntries(): DocsEntrySummary[] {
  return allDocsEntries
    .map(toSummary)
    .sort(
      (left, right) =>
        left.order - right.order || left.title.localeCompare(right.title),
    );
}

export async function getDocsEntry(slug: string): Promise<DocsEntry> {
  const entry = allDocsEntries.find((candidate) => candidate.slug === slug);

  if (!entry) {
    throw new TypeError(`Unknown documentation slug "${slug}".`);
  }

  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...toSummary(entry), source };
}

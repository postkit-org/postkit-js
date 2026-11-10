import { createPostkitRemarkPlugins } from '@postkit/chakra';
import { selectDocsEntries } from '@postkit/content';
import { allDocsEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { DocsEntry, DocsEntrySummary } from './docs';
import { resolveDocsNavigation, type ResolvedDocsNavigation } from './docs-nav';
import { extractHeadings } from './headings';

type GeneratedDocsEntry = (typeof allDocsEntries)[number];

/** Drafts show in development and are left out of production builds. */
const visibility = { includeDrafts: process.env.NODE_ENV !== 'production' };

function toSummary(entry: GeneratedDocsEntry): DocsEntrySummary {
  return {
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    category: entry.category,
    order: entry.order,
    since: entry.since ?? null,
    status: entry.status,
  };
}

/** The visible docs, in nav order. Used for static paths, lists and prev/next. */
export function getDocsEntries(): DocsEntrySummary[] {
  return selectDocsEntries(allDocsEntries, visibility).map(toSummary);
}

let reportedNavigationProblems = false;

/**
 * The docs nav resolved against the collection. Unresolved items are a build
 * warning, not an error, and are reported once per process.
 */
export function getDocsNavigation(): ResolvedDocsNavigation {
  const navigation = resolveDocsNavigation(
    allDocsEntries.map(toSummary),
    visibility,
  );

  if (!reportedNavigationProblems && navigation.problems.length > 0) {
    reportedNavigationProblems = true;
    console.warn(
      `[docs] The docs nav has ${navigation.problems.length} problem(s):\n${navigation.problems
        .map((problem) => `  - ${problem}`)
        .join('\n')}`,
    );
  }

  return navigation;
}

export async function getDocsEntry(slug: string): Promise<DocsEntry> {
  const entry = selectDocsEntries(allDocsEntries, visibility).find(
    (candidate) => candidate.slug === slug,
  );

  if (!entry) {
    throw new TypeError(`Unknown documentation slug "${slug}".`);
  }

  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return {
    ...toSummary(entry),
    source,
    headings: extractHeadings(entry.content),
  };
}

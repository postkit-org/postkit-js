import { execFileSync } from 'node:child_process';

import {
  createDocsManifest,
  type DocsManifest,
  type DocsPage,
} from '@chakra-docs/core';
import type { NextPagesDocsOptions } from '@chakra-docs/next/pages';
import { createPostkitRemarkPlugins } from '@postkit/chakra';
import { selectDocsEntries } from '@postkit/content';
import { allDocsEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { DocsEntry, DocsEntrySummary } from './docs';
import {
  DOCS_BASE_PATH,
  DOCS_COLLECTION_ID,
  docsRoute,
  toDocsHeadings,
  toDocsNavTree,
} from './docs-layout';
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

let docsManifest: DocsManifest | null = null;

/**
 * The visible docs as a chakra-docs manifest: one `docs` collection at `/docs`, its pages in
 * nav order and the nav tree from `docs-nav.ts`. Pages carry their title, summary
 * (`description`) and `h2`s, not their bodies: bodies render through `MdxContent`.
 */
export function getDocsManifest(): DocsManifest {
  if (docsManifest) return docsManifest;

  const nav = toDocsNavTree(getDocsNavigation());
  const pages = selectDocsEntries(allDocsEntries, visibility).map(
    (entry): DocsPage => ({
      id: entry.slug,
      collectionId: DOCS_COLLECTION_ID,
      slug: [entry.slug],
      path: `${entry.slug}.md`,
      route: docsRoute(entry.slug),
      title: entry.title,
      description: entry.summary,
      frontmatter: {
        title: entry.title,
        description: entry.summary,
        draft: entry.status === 'draft',
      },
      headings: toDocsHeadings(extractHeadings(entry.content)),
    }),
  );

  docsManifest = createDocsManifest({
    collections: [
      { id: DOCS_COLLECTION_ID, basePath: DOCS_BASE_PATH, pages, nav },
    ],
    nav,
  });
  return docsManifest;
}

/** Options for `@chakra-docs/next/pages`' helpers. Drafts follow the site's visibility rule. */
export function getDocsPagesOptions(): NextPagesDocsOptions {
  return {
    manifest: getDocsManifest(),
    basePath: DOCS_BASE_PATH,
    includeDrafts: visibility.includeDrafts,
  };
}

let shallowClone: boolean | null = null;

/**
 * When the page's Markdown last changed, from git (`TechArticle.dateModified`, 01 §7), as an
 * ISO date. `null` when git isn't available or the clone is shallow (a shallow clone would
 * give every page the same date), so the field is left out rather than wrong.
 */
export function getDocsModifiedDate(slug: string): string | null {
  try {
    shallowClone ??=
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() !== 'false';
    if (shallowClone) return null;

    const date = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', `:(top)libs/content/docs/${slug}.md`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return date || null;
  } catch {
    return null;
  }
}

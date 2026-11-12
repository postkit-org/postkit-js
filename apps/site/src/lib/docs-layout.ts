import type { DocsHeading, DocsNavItem } from '@chakra-docs/core';

import type { ResolvedDocsNavigation } from './docs-nav';
import type { TocHeading } from './headings';
import { externalLinks } from './site-sections';

/**
 * Glue between the site's docs data (`libs/content` + `docs-nav.ts`) and chakra-docs'
 * document model, which `DocsLayout`, `DocsSidebar`, `DocsTableOfContents` and
 * `DocsPagination` read. Client-safe: no content-collections or Node imports.
 */

/** The one chakra-docs collection: every docs page lives under `/docs`. */
export const DOCS_COLLECTION_ID = 'docs';
export const DOCS_BASE_PATH = '/docs';

export function docsRoute(slug: string): string {
  return `${DOCS_BASE_PATH}/${slug}`;
}

/** The label chakra-docs shows after a nav item that has no page yet (01 §5.1). */
export const SOON_BADGE = 'Soon';

/**
 * The docs nav as chakra-docs nav items: one item per group (no `href`, so the sidebar
 * renders it as a section title) with its pages as children.
 * - `page` items link to their route;
 * - `soon` items keep their place with a "Soon" badge and no `href`, so they aren't links
 *   and prev/next skips them;
 * - `draft` (production) and `missing` items are left out.
 */
export function toDocsNavTree(
  navigation: ResolvedDocsNavigation,
): DocsNavItem[] {
  return navigation.groups
    .map((group) => ({
      id: `group:${group.group}`,
      title: group.group,
      children: group.items.flatMap((item): DocsNavItem[] => {
        if (item.state === 'page') {
          return [{ id: item.slug, title: item.label, href: item.href }];
        }
        if (item.state === 'soon') {
          return [{ id: item.slug, title: item.label, badge: SOON_BADGE }];
        }
        return [];
      }),
    }))
    .filter((group) => group.children.length > 0);
}

/** The nav group (and its first page) that holds `route`, for the phone menu and breadcrumbs. */
export function findDocsNavGroup(
  nav: readonly DocsNavItem[],
  route: string,
): { readonly title: string; readonly firstHref: string } | null {
  for (const group of nav) {
    const children = group.children ?? [];
    if (children.some((child) => child.href === route)) {
      const firstHref = children.find((child) => child.href)?.href ?? route;
      return { title: group.title, firstHref };
    }
  }
  return null;
}

/** `extractHeadings` output → chakra-docs headings. The TOC lists `h2`s, with `MdxContent`'s ids. */
export function toDocsHeadings(headings: readonly TocHeading[]): DocsHeading[] {
  return headings.map((heading) => ({
    id: heading.id,
    title: heading.text,
    level: 2,
  }));
}

/**
 * The grey half of the two-tone title (02 §2) where a board designs one (SiteDocsIntro,
 * SiteDocsQuickStart, SiteDocsPartStyles, SiteDocsEmail, SiteDocsCLI, SiteDocsNext).
 * Every other page uses its `summary`.
 */
const designedTitleQuiet: Readonly<Record<string, string>> = {
  introduction:
    'Rich posts that render right everywhere, from one plain-text file.',
  'quick-start': 'Your first component on the page in about five minutes.',
  'part-styles': 'Make every component match your brand without forking it.',
  email: 'Send the post as a newsletter without rewriting it.',
  cli: 'Add, own and create components from your terminal.',
  nextjs: 'Postkit in your Pages Router app, with links done for you.',
};

export function docsTitleQuiet(slug: string, summary: string): string {
  return designedTitleQuiet[slug] ?? summary;
}

/** "Introduction" → "Introduction." The boards end the `fg` half with a full stop. */
export function docsTitleStatement(title: string): string {
  return /[.!?:]$/.test(title) ? title : `${title}.`;
}

/** "Edit this page on GitHub" (SiteDocs* boards): the page's Markdown source. */
export function docsEditUrl(slug: string): string {
  return `${externalLinks.github}/edit/main/libs/content/docs/${slug}.md`;
}

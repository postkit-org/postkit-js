import type { DocsCategory } from '@postkit/content';

import type { DocsEntrySummary } from './docs';

/**
 * The docs nav (handoff `content/navigation.json`, `docs` key; 01 §5.1).
 * Group and item order is nav order, and an entry's `order` frontmatter is its
 * 1-based position inside its group. `soon` items are listed without a page.
 */
export interface DocsNavItemDefinition {
  readonly label: string;
  readonly slug: string;
  readonly soon?: true;
}

export interface DocsNavGroupDefinition {
  readonly group: DocsCategory;
  readonly items: readonly DocsNavItemDefinition[];
}

export const docsNavigation: readonly DocsNavGroupDefinition[] = [
  {
    group: 'Get started',
    items: [
      { label: 'Introduction', slug: 'introduction' },
      { label: 'Installation', slug: 'installation' },
      { label: 'Quick start', slug: 'quick-start' },
      { label: 'Kits', slug: 'kits' },
    ],
  },
  {
    group: 'Writing',
    items: [
      { label: 'MDX', slug: 'mdx' },
      { label: 'Markdown directives', slug: 'markdown-directives' },
      { label: 'Validation', slug: 'validation' },
      { label: 'Footnotes', slug: 'footnotes' },
      { label: 'Portable documents and feeds', slug: 'portable-documents' },
      { label: 'Link previews and unfurling', slug: 'link-previews' },
      { label: 'Writing in Prismark', slug: 'writing-in-prismark' },
    ],
  },
  {
    group: 'Customizing',
    items: [
      { label: 'Tokens', slug: 'tokens' },
      { label: 'Part styles', slug: 'part-styles' },
      { label: 'Defaults and slots', slug: 'defaults-and-slots' },
      { label: 'Views', slug: 'views' },
      { label: 'Eject', slug: 'eject' },
      { label: 'New components', slug: 'new-components' },
    ],
  },
  {
    group: 'Renderers',
    items: [
      { label: 'Headless', slug: 'headless' },
      { label: 'Chakra', slug: 'chakra' },
      { label: 'Email', slug: 'email' },
      { label: 'Web components', slug: 'web-components', soon: true },
    ],
  },
  {
    group: 'Frameworks',
    items: [
      { label: 'Next.js', slug: 'nextjs' },
      { label: 'React Router', slug: 'react-router' },
      { label: 'TanStack Router', slug: 'tanstack-router' },
      { label: 'Astro', slug: 'astro' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { label: 'createPostkit', slug: 'create-postkit' },
      { label: 'definePostkitComponent', slug: 'define-postkit-component' },
      { label: 'Manifest', slug: 'manifest' },
      { label: 'CLI', slug: 'cli' },
      { label: 'API reference', slug: 'api-reference' },
      { label: 'Compatibility', slug: 'compatibility' },
      { label: 'Security', slug: 'security' },
      { label: 'Troubleshooting', slug: 'troubleshooting' },
    ],
  },
];

/**
 * A nav item resolved against the docs collection:
 * - `page`: a visible entry;
 * - `soon`: listed as "Soon", with no page;
 * - `draft`: the entry exists but is a draft, hidden in production;
 * - `missing`: no entry has this slug.
 *
 * Only `page` and `soon` items are shown.
 */
export type ResolvedDocsNavItem =
  | {
      readonly state: 'page';
      readonly label: string;
      readonly slug: string;
      readonly href: string;
      readonly entry: DocsEntrySummary;
    }
  | {
      readonly state: 'soon' | 'draft' | 'missing';
      readonly label: string;
      readonly slug: string;
    };

export interface ResolvedDocsNavGroup {
  readonly group: DocsCategory;
  readonly items: readonly ResolvedDocsNavItem[];
}

export interface ResolvedDocsNavigation {
  readonly groups: readonly ResolvedDocsNavGroup[];
  /** Problems to report at build time: unresolved items and entries that disagree with the nav. */
  readonly problems: readonly string[];
}

/**
 * Resolves the nav against every docs entry, drafts included, so a hidden draft
 * is told apart from a missing page.
 */
export function resolveDocsNavigation(
  entries: readonly DocsEntrySummary[],
  { includeDrafts }: { readonly includeDrafts: boolean },
): ResolvedDocsNavigation {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const listed = new Set<string>();
  const problems: string[] = [];

  const groups = docsNavigation.map(({ group, items }) => ({
    group,
    items: items.map((item, index): ResolvedDocsNavItem => {
      listed.add(item.slug);
      const { label, slug } = item;
      if (item.soon) {
        return { state: 'soon', label, slug };
      }

      const entry = bySlug.get(slug);
      if (!entry) {
        problems.push(`"${group} / ${label}" has no docs entry (${slug}.md).`);
        return { state: 'missing', label, slug };
      }

      if (entry.category !== group || entry.order !== index + 1) {
        problems.push(
          `${slug}.md is "${entry.category}" #${entry.order}; the nav lists it as "${group}" #${index + 1}.`,
        );
      }

      if (entry.status === 'draft' && !includeDrafts) {
        return { state: 'draft', label, slug };
      }

      return { state: 'page', label, slug, href: `/docs/${slug}`, entry };
    }),
  }));

  for (const entry of entries) {
    if (!listed.has(entry.slug)) {
      problems.push(`${entry.slug}.md is not in the docs nav.`);
    }
  }

  return { groups, problems };
}

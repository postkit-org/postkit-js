import type { SchemaData } from 'react-structured';

import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site-url';

/** One crumb: its visible name and site path (`/docs/mdx`). */
export interface Breadcrumb {
  readonly name: string;
  readonly path: string;
}

/**
 * `BreadcrumbList` data (01 §7) for a page under `/`. Home is prepended, so pass only the
 * crumbs after it, ending with the page itself:
 * `breadcrumbList([{ name: 'Docs', path: '/docs/introduction' }, { name: 'MDX', path: '/docs/mdx' }])`.
 */
export function breadcrumbList(
  crumbs: readonly Breadcrumb[],
): SchemaData<'BreadcrumbList'> {
  return {
    itemListElement: [{ name: SITE_NAME, path: '/' }, ...crumbs].map(
      (crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      }),
    ),
  };
}

/**
 * `WebSite` data with the `SearchAction` that opens site search from `/?q=` (01 §7, §8).
 * Rendered on `/` only.
 */
export function webSiteData(): SchemaData<'WebSite'> {
  // `query-input` is Google's extension; schema-dts doesn't type it, so it's added untyped.
  const searchAction = {
    '@type': 'SearchAction' as const,
    target: {
      '@type': 'EntryPoint' as const,
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  };

  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    potentialAction: searchAction,
  };
}

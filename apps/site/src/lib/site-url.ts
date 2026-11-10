/** The site's name: the home page's whole title and the suffix on every other one (01 §12). */
export const SITE_NAME = 'Postkit';

/** The default description, used when a page doesn't set its own. */
export const SITE_DESCRIPTION =
  'Postkit is a portable publishing component system for React and the web.';

/**
 * The canonical origin, without a trailing slash. `NEXT_PUBLIC_SITE_URL` overrides it
 * (preview deploys); production is `https://postkit.org`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://postkit.org'
).replace(/\/+$/, '');

/** `/docs/mdx` → `https://postkit.org/docs/mdx`. Absolute URLs pass through. */
export function absoluteUrl(path: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Drops the query and fragment from a router `asPath`: the canonical path of the page. */
export function canonicalPath(asPath: string): string {
  const path = asPath.split(/[?#]/)[0] || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

import type { GetServerSideProps } from 'next';

import { getChangelogEntries } from '../lib/changelog.server';
import { componentNameToSlug, orderedComponentEntries } from '../lib/components';
import { getDocsEntries } from '../lib/docs.server';
import { getNotes } from '../lib/notes.server';
import { absoluteUrl } from '../lib/site-url';

/**
 * `/sitemap.xml` (07 §5): every published, indexable route. Drafts are already left out of
 * the docs and notes lists in production; the newsletter pages and the 404 are `noindex`,
 * so they aren't listed.
 */
function sitemapPaths(): string[] {
  return [
    '/',
    '/components',
    ...orderedComponentEntries.map(
      (component) => `/components/${componentNameToSlug(component.name)}`,
    ),
    ...getDocsEntries().map((entry) => `/docs/${entry.slug}`),
    '/notes',
    ...getNotes().map((note) => `/notes/${note.slug}`),
    '/changelog',
    ...getChangelogEntries().map((entry) => `/changelog/${entry.slug}`),
    '/licensing',
    '/privacy',
    '/withoss',
  ];
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urls = sitemapPaths()
    .map((path) => `  <url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`)
    .join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=86400',
  );
  res.end(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  return { props: {} };
};

/** Never rendered: `getServerSideProps` writes the XML and ends the response. */
export default function Sitemap() {
  return null;
}

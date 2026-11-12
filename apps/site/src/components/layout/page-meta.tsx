import { useRouter } from 'next/router';
import { PageMeta as NextMeta, type MetaProviderProps } from 'next-meta';

import { homeShareImage, shareImageMeta } from '../../lib/share-images';
import {
  canonicalPath,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '../../lib/site-url';

/** The share image: a URL (site path or absolute) and its alt text, both required. */
export interface PageMetaImage {
  readonly url: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
}

export interface PageMetaProps {
  /**
   * The page's own name: "Callout" renders `<title>Callout · Postkit</title>`.
   * Leave it out on the home page, whose title is just "Postkit".
   */
  readonly title?: string;
  /** The page summary, for `description`, `og:description` and `twitter:description`. */
  readonly description: string;
  /**
   * The canonical path (`/docs/mdx`). Defaults to the current route without its query or
   * fragment. Resolved against `NEXT_PUBLIC_SITE_URL` (default `https://postkit.org`).
   */
  readonly path?: string;
  /**
   * `og:image` plus `og:image:alt` (and the Twitter equivalents). 1200×630 per 05; build it
   * with `shareImageMeta` (`lib/share-images`). Pages without a share image of their own
   * (indexes, legal pages, 404) use the home page's.
   */
  readonly image?: PageMetaImage;
  /** `og:type`. Defaults to `website`; notes and changelog entries are `article`. */
  readonly type?: 'website' | 'article';
}

/**
 * Site-wide defaults (01 §12) for next-meta's `MetaProvider` in `_app`. They render on every
 * route, so a page without `PageMeta` still has a title ("Postkit"), a description and a
 * canonical URL. `PageMeta` overrides them tag by tag.
 */
export function siteMetaDefaults(asPath: string): MetaProviderProps {
  const path = canonicalPath(asPath);
  return {
    baseUrl: SITE_URL,
    title: SITE_NAME,
    siteNameDelimiter: '·',
    description: SITE_DESCRIPTION,
    canonical: path,
    url: path,
    type: 'website',
    locale: 'en_US',
    twitter: { card: 'summary_large_image' },
  };
}

/**
 * A page's `<head>` meta through next-meta: `{title} · Postkit` (home: "Postkit"),
 * description, canonical on `https://postkit.org`, Open Graph (`og:type`, `og:image`,
 * `og:image:alt`) and `twitter:card=summary_large_image`. Render it once per page, outside
 * `next/head` (it renders its own).
 */
export function PageMeta({
  title,
  description,
  path,
  image,
  type = 'website',
}: PageMetaProps) {
  const { asPath } = useRouter();
  const resolvedPath = path ?? canonicalPath(asPath);
  const isHome = title === undefined;

  return (
    <NextMeta
      title={isHome ? SITE_NAME : title}
      // The suffix comes from `siteName`; the home page has none.
      siteName={isHome ? undefined : SITE_NAME}
      siteNameDelimiter="·"
      additionalMetaTags={
        isHome
          ? [
              {
                key: 'og-site-name',
                property: 'og:site_name',
                content: SITE_NAME,
              },
            ]
          : undefined
      }
      description={description}
      canonical={resolvedPath}
      url={resolvedPath}
      type={type}
      images={[{ ...(image ?? shareImageMeta(homeShareImage())) }]}
      twitter={{ card: 'summary_large_image' }}
    />
  );
}

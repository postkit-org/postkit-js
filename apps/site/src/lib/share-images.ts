import type { PageMetaImage } from '../components/layout/page-meta';
import { docsTitleQuiet, docsTitleStatement } from './docs-layout';
import { noteKindLabel, type NoteKind } from './notes';
import { absoluteUrl } from './site-url';

/**
 * The share images (05 §1, PK-061): one 1200×630 PNG per route, written to `public/og/` at
 * build time by `nx run site:og-images` (`apps/site/og/`). This module is what the pages and
 * the build script agree on: the file path, the kind label and the two-tone title. It's
 * client-safe; the templates and the renderer live in `apps/site/og/`.
 */

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

export type ShareImageKind =
  'home' | 'component' | 'docs' | 'note' | 'changelog';

export interface ShareImage {
  readonly kind: ShareImageKind;
  /** Where the PNG is served (and written under `public/`): `/og/docs/mdx.png`. */
  readonly imagePath: string;
  /** The page the image is for, shown at the bottom left: `/docs/mdx`. */
  readonly pagePath: string;
  /** The label at the top right, in mono: "Docs", "Note · Guide". */
  readonly label: string;
  /** The statement, in `fg`. Never truncated. */
  readonly title: string;
  /** The grey half, in `fg.quiet`. Long titles truncate here (05 §1). */
  readonly quiet: string | null;
}

/** The full two-tone title, both halves: the image's alt text (05 §1, Tags). */
export function shareImageAlt(
  image: Pick<ShareImage, 'title' | 'quiet'>,
): string {
  return image.quiet ? `${image.title} ${image.quiet}` : image.title;
}

/** The `PageMeta` `image` prop for a share image: an absolute URL, its alt text and size. */
export function shareImageMeta(image: ShareImage): PageMetaImage {
  return {
    url: absoluteUrl(image.imagePath),
    alt: shareImageAlt(image),
    width: SHARE_IMAGE_WIDTH,
    height: SHARE_IMAGE_HEIGHT,
  };
}

/** The home page's, and the fallback for pages without one of their own (OgHome). */
export function homeShareImage(): ShareImage {
  return {
    kind: 'home',
    imagePath: '/og/home.png',
    pagePath: '/',
    label: 'postkit.org',
    title: 'Richer posts.',
    quiet: 'Written once, right everywhere.',
  };
}

/** `/components/[slug]` (OgComponent): "{Name}." and the page's tagline. */
export function componentShareImage(component: {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
}): ShareImage {
  return {
    kind: 'component',
    imagePath: `/og/components/${component.slug}.png`,
    pagePath: `/components/${component.slug}`,
    label: 'Component',
    title: `${component.name}.`,
    quiet: component.tagline,
  };
}

/** `/docs/[slug]` (OgDocs): the same two halves as the page's title. */
export function docsShareImage(entry: {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
}): ShareImage {
  return {
    kind: 'docs',
    imagePath: `/og/docs/${entry.slug}.png`,
    pagePath: `/docs/${entry.slug}`,
    label: 'Docs',
    title: docsTitleStatement(entry.title),
    quiet: docsTitleQuiet(entry.slug, entry.summary),
  };
}

/** `/notes/[slug]` (OgNote): `title` and `subtitle`, split as in the article header. */
export function noteShareImage(note: {
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly kind: NoteKind;
}): ShareImage {
  return {
    kind: 'note',
    imagePath: `/og/notes/${note.slug}.png`,
    pagePath: `/notes/${note.slug}`,
    label: `Note · ${noteKindLabel(note.kind)}`,
    title: note.title,
    quiet: note.subtitle,
  };
}

/** `/changelog/[version]` (OgRelease): "Postkit {version}." and the entry's `subtitle`. */
export function changelogShareImage(entry: {
  readonly slug: string;
  readonly version: string;
  readonly subtitle: string;
}): ShareImage {
  return {
    kind: 'changelog',
    imagePath: `/og/changelog/${entry.slug}.png`,
    pagePath: `/changelog/${entry.slug}`,
    label: 'Changelog',
    title: `Postkit ${entry.version}.`,
    quiet: entry.subtitle,
  };
}

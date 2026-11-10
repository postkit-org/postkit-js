import type { ComponentAnatomy } from '@postkit/content';
import { allComponentPages } from 'content-collections';

import { componentEntries, getComponentBySlug } from './components';

/**
 * A component page's authored content (`libs/content/components/[slug].md`, 01 §5.4), merged
 * with the manifest where the file is silent. Props are JSON-safe for `getStaticProps`.
 */
export interface ComponentPageContent {
  readonly slug: string;
  /** The catalog name: `KeyTakeaway`. */
  readonly name: string;
  /** The grey half of the title and the share image: frontmatter `tagline`, else the manifest description. */
  readonly tagline: string;
  /** The exploded diagram's layers, top to bottom; `null` shows only the parts grid (01 §6.3). */
  readonly anatomy: ComponentAnatomy | null;
  /** Related component names, in display order. */
  readonly related: readonly string[];
  /** Markdown: the Usage and Accessibility notes. Empty when the component has no file. */
  readonly body: string;
}

type GeneratedComponentPage = (typeof allComponentPages)[number];

function validate(pages: readonly GeneratedComponentPage[]) {
  for (const page of pages) {
    const component = getComponentBySlug(page.slug);
    if (!component) {
      throw new TypeError(
        `libs/content/components/${page._meta.filePath} doesn't match a component in postkitComponentCatalog ("${page.component}").`,
      );
    }
    for (const name of page.related ?? []) {
      if (!componentEntries.some((component) => component.name === name)) {
        throw new TypeError(
          `libs/content/components/${page._meta.filePath} relates "${name}", which isn't in postkitComponentCatalog.`,
        );
      }
    }
  }
}

// Fail the build, not the page, when a file names a component the catalog doesn't have.
validate(allComponentPages);

/**
 * The content for `/components/[slug]`, or `null` when the slug isn't a catalog component.
 * Components without a file still get a page: the manifest description stands in for the tagline.
 */
export function getComponentPage(slug: string): ComponentPageContent | null {
  const component = getComponentBySlug(slug);
  if (!component) return null;

  const page = allComponentPages.find((candidate) => candidate.slug === slug);

  return {
    slug,
    name: component.name,
    tagline: page?.tagline ?? component.description,
    anatomy: page?.anatomy ?? null,
    related: page?.related ?? [],
    body: page?.content ?? '',
  };
}

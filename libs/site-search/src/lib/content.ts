import type { SearchContentInput } from './records';

type PublicationStatus = 'published' | 'draft';

/**
 * The content collections (`libs/content`, as content-collections loads them) and the
 * component manifest, in the shapes search needs. Structural, so the site passes its
 * generated collections and the tests pass the same files read from disk.
 */
export interface SiteContentEntries {
  readonly components: readonly {
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly directive?: string;
    readonly keywords?: readonly string[];
  }[];
  readonly componentPages: readonly {
    /** The component's name: `KeyTakeaway`. */
    readonly component: string;
    readonly tagline?: string;
    readonly content: string;
  }[];
  readonly docs: readonly {
    readonly slug: string;
    readonly title: string;
    readonly summary: string;
    readonly status: PublicationStatus;
    readonly content: string;
  }[];
  readonly notes: readonly {
    readonly slug: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly summary: string;
    readonly status: PublicationStatus;
    readonly content: string;
  }[];
  readonly changelog: readonly {
    /** The version slug: `0-2-0`. */
    readonly slug: string;
    readonly version: string;
    readonly subtitle: string;
    readonly summary: string;
    readonly status: 'released' | 'upcoming';
    readonly date: string | Date;
    readonly content: string;
  }[];
}

/** `CodeBlock` → `/components/code-block`, as `pages/components/[slug].tsx` builds it. */
export function componentRoute(name: string): string {
  return `/components/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

function isoDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

/** The site's routes for each entry: `/docs/[slug]`, `/notes/[slug]`, `/changelog/[version]`. */
export function toSearchContent(
  entries: SiteContentEntries,
): SearchContentInput {
  const pages = new Map(
    entries.componentPages.map((page) => [page.component, page]),
  );

  return {
    components: entries.components.map((component) => {
      const page = pages.get(component.name);
      return {
        name: component.name,
        route: componentRoute(component.name),
        description: component.description,
        category: component.category,
        directive: component.directive,
        keywords: component.keywords,
        tagline: page?.tagline,
        body: page?.content,
      };
    }),
    docs: entries.docs.map((entry) => ({
      slug: entry.slug,
      route: `/docs/${entry.slug}`,
      title: entry.title,
      summary: entry.summary,
      status: entry.status,
      content: entry.content,
    })),
    notes: entries.notes.map((note) => ({
      route: `/notes/${note.slug}`,
      title: note.title,
      subtitle: note.subtitle,
      summary: note.summary,
      status: note.status,
      content: note.content,
    })),
    changelog: entries.changelog.map((entry) => ({
      version: entry.version,
      route: `/changelog/${entry.slug}`,
      subtitle: entry.subtitle,
      summary: entry.summary,
      status: entry.status,
      date: isoDate(entry.date),
      content: entry.content,
    })),
  };
}

import type { DocsSearchRecord } from '@chakra-docs/core';
import { slug } from 'github-slugger';

import { firstSentence, markdownToText, splitMarkdownSections } from './text';
import type { SearchCollectionId } from './types';

type PublicationStatus = 'published' | 'draft';

/** One component page: the manifest entry plus `libs/content/components/[slug].md`, if any. */
export interface SearchComponentInput {
  readonly name: string;
  readonly route: string;
  readonly description: string;
  readonly category: string;
  readonly directive?: string;
  readonly keywords?: readonly string[];
  /** The grey half of the page title (`tagline` frontmatter). */
  readonly tagline?: string;
  /** The usage notes' Markdown. */
  readonly body?: string;
}

export interface SearchDocsInput {
  readonly slug: string;
  readonly route: string;
  readonly title: string;
  readonly summary: string;
  readonly status: PublicationStatus;
  readonly content: string;
}

export interface SearchNoteInput {
  readonly route: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly summary: string;
  readonly status: PublicationStatus;
  readonly content: string;
}

export interface SearchChangelogInput {
  readonly version: string;
  readonly route: string;
  readonly subtitle: string;
  readonly summary: string;
  /** `upcoming` entries are public and searchable (01 §5.2). */
  readonly status: 'released' | 'upcoming';
  /** ISO date (`2026-09-03`). */
  readonly date: string;
  readonly content: string;
}

export interface SearchContentInput {
  readonly components: readonly SearchComponentInput[];
  readonly docs: readonly SearchDocsInput[];
  readonly notes: readonly SearchNoteInput[];
  readonly changelog: readonly SearchChangelogInput[];
}

export interface BuildSearchIndexOptions {
  /** Drafts show in development and are left out of production (01 §5.1). */
  readonly includeDrafts: boolean;
  /** The `id` a rendered `h2` gets; defaults to GitHub-style slugs, like `MdxContent`. */
  readonly slugifyHeading?: (text: string) => string;
}

/** A page that search can link to: what featured entries are checked against. */
export interface SearchPage {
  readonly collectionId: SearchCollectionId;
  readonly route: string;
  readonly title: string;
  readonly description?: string;
  readonly published: boolean;
}

export interface SearchLatestRelease {
  readonly version: string;
  readonly route: string;
  readonly date: string;
  readonly subtitle: string;
}

export interface SiteSearchIndex {
  readonly records: readonly DocsSearchRecord[];
  readonly pages: readonly SearchPage[];
  /** The newest released changelog entry (`latest-release` in search-featured.json). */
  readonly latestRelease: SearchLatestRelease | null;
}

const withoutTrailingPeriod = (value: string) =>
  value.trim().replace(/\.$/, '');

const byRoute = <T extends { readonly route: string }>(left: T, right: T) =>
  left.route < right.route ? -1 : left.route > right.route ? 1 : 0;

function compareVersions(left: string, right: string): number {
  const a = left.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function componentRecord(component: SearchComponentInput): DocsSearchRecord {
  const id = `components:${component.route}`;
  return {
    id,
    kind: 'page',
    pageId: id,
    collectionId: 'components',
    route: component.route,
    title: component.name,
    pageTitle: component.name,
    description: component.description,
    headings: [],
    text: [
      component.tagline,
      component.body ? markdownToText(component.body) : undefined,
      component.keywords?.join(' '),
    ]
      .filter(Boolean)
      .join('\n'),
    tags: [component.category],
    aliases: component.directive ? [component.directive] : undefined,
  };
}

function docsRecords(
  entry: SearchDocsInput,
  slugifyHeading: (text: string) => string,
): DocsSearchRecord[] {
  const pageId = `docs:${entry.route}`;
  const [intro, ...sections] = splitMarkdownSections(entry.content);

  const page: DocsSearchRecord = {
    id: pageId,
    kind: 'page',
    pageId,
    collectionId: 'docs',
    route: entry.route,
    title: entry.title,
    pageTitle: entry.title,
    description: entry.summary,
    headings: [],
    text: markdownToText(intro?.body ?? ''),
  };

  const seen = new Map<string, number>();
  const headingRecords = sections.flatMap((section): DocsSearchRecord[] => {
    if (!section.heading) return [];
    const headingId = slugifyHeading(section.heading);
    const count = seen.get(headingId) ?? 0;
    seen.set(headingId, count + 1);
    const text = markdownToText(section.body);

    return [
      {
        // A repeated heading keeps a unique record id; its anchor is the page's.
        id: `${pageId}#${headingId}${count > 0 ? `-${count}` : ''}`,
        kind: 'heading',
        pageId,
        collectionId: 'docs',
        route: `${entry.route}#${headingId}`,
        // The page title stays the record's title, so page titles outrank section titles
        // (01 §8); the heading is searched through `sectionTitle`.
        title: entry.title,
        pageTitle: entry.title,
        sectionTitle: section.heading,
        headingId,
        headingLevel: 2,
        description: firstSentence(text),
        headings: [],
        text,
      },
    ];
  });

  return [page, ...headingRecords];
}

function noteRecord(note: SearchNoteInput): DocsSearchRecord {
  const id = `notes:${note.route}`;
  return {
    id,
    kind: 'page',
    pageId: id,
    collectionId: 'notes',
    route: note.route,
    title: withoutTrailingPeriod(note.title),
    pageTitle: withoutTrailingPeriod(note.title),
    description: note.summary,
    headings: [],
    text: [note.subtitle, markdownToText(note.content)]
      .filter(Boolean)
      .join('\n'),
  };
}

function changelogRecord(entry: SearchChangelogInput): DocsSearchRecord {
  const id = `changelog:${entry.route}`;
  const title = `${entry.version} · ${withoutTrailingPeriod(entry.subtitle)}`;
  return {
    id,
    kind: 'page',
    pageId: id,
    collectionId: 'changelog',
    route: entry.route,
    title,
    pageTitle: title,
    description: entry.summary,
    headings: [],
    text: markdownToText(entry.content),
    tags: entry.status === 'upcoming' ? ['upcoming'] : undefined,
    aliases: [`Postkit ${entry.version}`, `v${entry.version}`],
  };
}

/**
 * The search records (01 §8): one per component, docs section (`h2`, plus the page's
 * intro), note and changelog entry, in collection order and then by route, so the same
 * content always builds the same records. Drafts are left out unless `includeDrafts`;
 * `upcoming` changelog entries are kept.
 */
export function buildSearchIndex(
  content: SearchContentInput,
  options: BuildSearchIndexOptions,
): SiteSearchIndex {
  const slugifyHeading =
    options.slugifyHeading ?? ((text: string) => slug(text.trim()));
  const visible = (status: PublicationStatus) =>
    options.includeDrafts || status !== 'draft';

  const components = [...content.components].sort(byRoute);
  const docs = content.docs
    .filter((entry) => visible(entry.status))
    .sort(byRoute);
  const notes = content.notes
    .filter((note) => visible(note.status))
    .sort(byRoute);
  const changelog = [...content.changelog].sort(byRoute);

  const records = [
    ...components.map(componentRecord),
    ...docs.flatMap((entry) => docsRecords(entry, slugifyHeading)),
    ...notes.map(noteRecord),
    ...changelog.map(changelogRecord),
  ];

  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      throw new TypeError(`Duplicate search record id "${record.id}".`);
    }
    ids.add(record.id);
  }

  const pages: SearchPage[] = [
    ...components.map((component) => ({
      collectionId: 'components' as const,
      route: component.route,
      title: component.name,
      description: component.description,
      published: true,
    })),
    ...[...content.docs].sort(byRoute).map((entry) => ({
      collectionId: 'docs' as const,
      route: entry.route,
      title: entry.title,
      description: entry.summary,
      published: entry.status === 'published',
    })),
    ...[...content.notes].sort(byRoute).map((note) => ({
      collectionId: 'notes' as const,
      route: note.route,
      title: withoutTrailingPeriod(note.title),
      description: note.summary,
      published: note.status === 'published',
    })),
    ...changelog.map((entry) => ({
      collectionId: 'changelog' as const,
      route: entry.route,
      title: `${entry.version} · ${withoutTrailingPeriod(entry.subtitle)}`,
      description: entry.summary,
      published: true,
    })),
  ];

  const latest = changelog
    .filter((entry) => entry.status === 'released')
    .sort((left, right) => compareVersions(right.version, left.version))[0];

  return {
    records,
    pages,
    latestRelease: latest
      ? {
          version: latest.version,
          route: latest.route,
          date: latest.date,
          subtitle: latest.subtitle,
        }
      : null,
  };
}

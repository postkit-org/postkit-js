import type { NoteKind } from '@postkit/content';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export type { NoteKind };

export type NoteFootnotePlacement = 'end' | 'side' | 'popover' | 'inline';

export interface NoteAuthor {
  readonly name: string;
  readonly avatar: string | null;
}

// Optional frontmatter is `null` rather than `undefined` so summaries survive
// getStaticProps' JSON serialization.
export interface NoteSummary {
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly summary: string;
  readonly kind: NoteKind;
  readonly date: string;
  readonly author: NoteAuthor;
  /** `'gradient'` or an image path. */
  readonly cover: string;
  readonly footnotes: { readonly placement: NoteFootnotePlacement } | null;
  readonly status: 'published' | 'draft';
  /** Minutes to read the body, rounded up: the "6 min read" on the meta line. */
  readonly readingMinutes: number;
}

/** A Postkit component a note's MDX uses, for "Components in this note". */
export interface NoteComponentLink {
  /** The component name: `KeyTakeaway`. */
  readonly name: string;
  /** Its page: `/components/key-takeaway`. */
  readonly href: string;
}

export interface NoteEntry extends NoteSummary {
  readonly source: MDXRemoteSerializeResult;
  /** The Postkit components the body uses, in order of first use. */
  readonly components: readonly NoteComponentLink[];
}

/** The index filter chips after "All" (01 §5.3): Releases · Guides · Case studies · Design. */
export const noteKindFilters: readonly {
  readonly kind: NoteKind;
  readonly label: string;
}[] = [
  { kind: 'release', label: 'Releases' },
  { kind: 'guide', label: 'Guides' },
  { kind: 'case-study', label: 'Case studies' },
  { kind: 'design', label: 'Design' },
];

const kindLabels: Record<NoteKind, string> = {
  release: 'Release',
  guide: 'Guide',
  'case-study': 'Case study',
  design: 'Design',
};

/** The singular label on a note's meta line: "Guide", "Case study". */
export function noteKindLabel(kind: NoteKind): string {
  return kindLabels[kind];
}

export function noteHref(note: Pick<NoteSummary, 'slug'>): string {
  return `/notes/${note.slug}`;
}

/** `2026-11-10` → "November 10, 2026" (the changelog's format). */
export function formatNoteDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "6 min read". */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

/** Whether the cover is the brand gradient rather than an image path. */
export function hasGradientCover(note: Pick<NoteSummary, 'cover'>): boolean {
  return note.cover === 'gradient';
}

/** The notes feeds (built in PK-042), linked from the subscribe card and `<head>` (01 §10). */
export const noteFeeds = [
  { label: 'RSS', href: '/feeds/notes.xml', type: 'application/rss+xml' },
  { label: 'Atom', href: '/feeds/notes.atom', type: 'application/atom+xml' },
  {
    label: 'JSON Feed',
    href: '/feeds/notes.json',
    type: 'application/feed+json',
  },
] as const;

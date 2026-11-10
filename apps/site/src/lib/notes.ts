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
}

export interface NoteEntry extends NoteSummary {
  readonly source: MDXRemoteSerializeResult;
}

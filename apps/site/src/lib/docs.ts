import type { DocsCategory } from '@postkit/content';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

import type { TocHeading } from './headings';

export interface DocsEntrySummary {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: DocsCategory;
  /** The 1-based position inside the entry's nav group. */
  readonly order: number;
  /** The release that introduced the documented API, for the version badge. */
  readonly since: string | null;
  readonly status: 'published' | 'draft';
}

export interface DocsEntry extends DocsEntrySummary {
  readonly source: MDXRemoteSerializeResult;
  /** The body's `h2`s, with the ids `MdxContent` renders: the `Toc` input. */
  readonly headings: readonly TocHeading[];
}

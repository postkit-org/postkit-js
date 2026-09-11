import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export interface DocsEntrySummary {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly order: number;
}

export interface DocsEntry extends DocsEntrySummary {
  readonly source: MDXRemoteSerializeResult;
}

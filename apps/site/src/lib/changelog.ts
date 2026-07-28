import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export interface ChangelogEntrySummary {
  readonly slug: string;
  readonly title: string;
  readonly version: string;
  readonly date: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface ChangelogEntry extends ChangelogEntrySummary {
  readonly source: MDXRemoteSerializeResult;
}

export function formatChangelogDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

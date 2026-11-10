import type { ChangelogStatus } from '@postkit/content';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export type { ChangelogStatus };

export interface ChangelogEntrySummary {
  /** From `version`: `0-2-0`, served at `/changelog/0-2-0`. */
  readonly slug: string;
  readonly title: string;
  /** The grey half of the title. */
  readonly subtitle: string;
  readonly version: string;
  /** `upcoming` shows as "In development" and stays out of feeds, "Latest" and emails. */
  readonly status: ChangelogStatus;
  readonly date: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface ChangelogEntry extends ChangelogEntrySummary {
  readonly source: MDXRemoteSerializeResult;
}

export function changelogHref(entry: Pick<ChangelogEntrySummary, 'slug'>) {
  return `/changelog/${entry.slug}`;
}

export function formatChangelogDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** The date line: upcoming entries have no release date yet. */
export function formatChangelogRelease(
  entry: Pick<ChangelogEntrySummary, 'date' | 'status'>,
): string {
  return entry.status === 'upcoming'
    ? 'Not yet released'
    : formatChangelogDate(entry.date);
}

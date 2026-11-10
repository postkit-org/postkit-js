import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  changelogEntrySchema,
  changelogVersionSlug,
  contentSlugSchema,
  getReleasedChangelogEntries,
  notesEntrySchema,
  selectVisibleNotes,
  type ChangelogEntryData,
  type NotesEntryData,
} from '@postkit/content';
import { parse as parseYaml } from 'yaml';

import { renderFeedContent, type FeedContent } from './content-html.js';
import type { SiteFeedItem } from './feeds.js';

/** Changelog entries carry no author; the feeds credit the project. */
export const CHANGELOG_AUTHOR = 'Postkit';

export interface FeedSourceOptions {
  /** The canonical origin, without a trailing slash: `https://postkit.org`. */
  readonly siteUrl: string;
  /** Drafts are left out when this is `production` (as on the site). */
  readonly nodeEnv?: string;
}

export interface LoadedFeedItem extends SiteFeedItem {
  readonly content: FeedContent;
}

function readEntries(directory: string, extensions: readonly string[]) {
  return readdirSync(directory)
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
    .sort()
    .map((file) => {
      const source = readFileSync(join(directory, file), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
      if (!match) throw new TypeError(`${file} has no frontmatter.`);
      return {
        file,
        data: parseYaml(match[1]) as Record<string, unknown>,
        content: source.slice(match[0].length),
      };
    });
}

function withContent(
  item: Omit<SiteFeedItem, 'contentHtml'>,
  source: string,
  format: 'markdown' | 'mdx',
  siteUrl: string,
): LoadedFeedItem {
  const content = renderFeedContent(source, {
    format,
    siteUrl,
    url: item.url,
    title: item.title,
    summary: item.summary,
  });
  return { ...item, content, contentHtml: content.html };
}

/**
 * Released changelog entries, newest first, from `libs/content/changelog`. `upcoming` entries
 * ("In development") are left out (01 §5.2), through the same `getReleasedChangelogEntries`
 * the site's "Latest" uses.
 */
export function loadChangelogFeedItems(
  directory: string,
  options: FeedSourceOptions,
): LoadedFeedItem[] {
  const entries = readEntries(directory, ['.md']).map(
    ({ file, data, content }) => {
      const parsed = changelogEntrySchema.safeParse({ ...data, content });
      if (!parsed.success) {
        throw new TypeError(`${file}: ${parsed.error.message}`);
      }
      return parsed.data satisfies ChangelogEntryData;
    },
  );
  return getReleasedChangelogEntries(entries).map((entry) =>
    withContent(
      {
        url: `${options.siteUrl}/changelog/${changelogVersionSlug(entry.version)}`,
        title: entry.title,
        summary: entry.summary,
        date: entry.date,
        author: CHANGELOG_AUTHOR,
        tags: entry.tags,
      },
      entry.content,
      'markdown',
      options.siteUrl,
    ),
  );
}

/**
 * Notes, newest first, from `libs/content/notes`. Drafts are left out in production, through
 * the same `selectVisibleNotes` the notes pages use.
 */
export function loadNotesFeedItems(
  directory: string,
  options: FeedSourceOptions,
): LoadedFeedItem[] {
  const notes = readEntries(directory, ['.md', '.mdx']).map(
    ({ file, data, content }) => {
      const parsed = notesEntrySchema.safeParse({ ...data, content });
      if (!parsed.success) {
        throw new TypeError(`${file}: ${parsed.error.message}`);
      }
      return {
        ...(parsed.data satisfies NotesEntryData),
        slug: contentSlugSchema.parse(file.replace(/\.mdx?$/, '')),
        format: file.endsWith('.mdx')
          ? ('mdx' as const)
          : ('markdown' as const),
      };
    },
  );
  return selectVisibleNotes(notes, options.nodeEnv)
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        left.title.localeCompare(right.title),
    )
    .map((note) =>
      withContent(
        {
          url: `${options.siteUrl}/notes/${note.slug}`,
          title: note.title,
          summary: note.summary,
          date: note.date,
          author: note.author.name,
          tags: [note.kind],
        },
        note.content,
        note.format,
        options.siteUrl,
      ),
    );
}

import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import {
  changelogDateSchema,
  contentSlugSchema,
  nonEmptyString,
  publicationStatusSchema,
} from './shared.js';

/** The index filters: All · Releases · Guides · Case studies · Design. */
export const noteKinds = ['release', 'guide', 'case-study', 'design'] as const;

export const noteKindSchema = z.enum(noteKinds);

export type NoteKind = z.infer<typeof noteKindSchema>;

/** Handoff 01 §5.3. */
export const notesEntrySchema = z.object({
  /** "One article, four renderers." */
  title: nonEmptyString,
  /** The grey half of the two-tone headline. */
  subtitle: z.string().optional(),
  /** Shown on the index and in feeds. */
  summary: nonEmptyString,
  kind: noteKindSchema,
  date: changelogDateSchema,
  author: z.object({
    name: z.string(),
    avatar: z.string().optional(),
  }),
  /** An image path, or the brand gradient. */
  cover: z.enum(['gradient']).or(z.string()).default('gradient'),
  /** Overrides the site's footnote placement for one note. */
  footnotes: z
    .object({
      placement: z.enum(['end', 'side', 'popover', 'inline']),
    })
    .optional(),
  status: publicationStatusSchema,
  content: z.string(),
});

export type NotesEntryData = z.infer<typeof notesEntrySchema>;

/**
 * Whether a site build should include drafts. Production builds leave them out
 * of routes, search, feeds and the sitemap; development and tests keep them.
 */
export function includesDraftNotes(
  nodeEnv: string | undefined = process.env['NODE_ENV'],
): boolean {
  return nodeEnv !== 'production';
}

/**
 * Returns the notes a build may show: every note outside production, and only
 * `status: published` notes in production.
 */
export function selectVisibleNotes<
  TNote extends Pick<NotesEntryData, 'status'>,
>(
  notes: readonly TNote[],
  nodeEnv: string | undefined = process.env['NODE_ENV'],
): TNote[] {
  return includesDraftNotes(nodeEnv)
    ? [...notes]
    : notes.filter((note) => note.status === 'published');
}

/**
 * Creates the postkit.org notes collection (Markdown and MDX).
 *
 * The directory is relative to that site's content-collections.ts file.
 */
export function createNotesCollection(directory: string) {
  return defineCollection({
    name: 'notesEntries',
    directory,
    include: ['**/*.md', '**/*.mdx'],
    schema: notesEntrySchema,
    transform: (entry) => ({
      ...entry,
      slug: contentSlugSchema.parse(entry._meta.path),
    }),
  });
}

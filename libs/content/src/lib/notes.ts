import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import {
  contentSlugSchema,
  nonEmptyString,
  publicationStatusSchema,
} from './shared.js';

// PK-021 owns this file: replace this placeholder schema with handoff 01 §5.3.
export const notesEntrySchema = z.object({
  title: nonEmptyString,
  status: publicationStatusSchema,
  content: z.string(),
});

export type NotesEntryData = z.infer<typeof notesEntrySchema>;

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

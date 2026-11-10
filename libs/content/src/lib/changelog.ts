import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import {
  changelogDateSchema,
  contentSlugSchema,
  nonEmptyString,
} from './shared.js';

// Re-exported for existing imports from './changelog.js'.
export { contentSlugSchema };

export const changelogEntrySchema = z.object({
  title: nonEmptyString,
  version: nonEmptyString,
  date: changelogDateSchema,
  summary: nonEmptyString,
  tags: z.array(nonEmptyString).default([]),
  content: z.string(),
});

export type ChangelogEntryData = z.infer<typeof changelogEntrySchema>;

/**
 * Creates the shared Postkit changelog collection for a consuming site.
 *
 * The directory is relative to that site's content-collections.ts file.
 */
export function createChangelogCollection(directory: string) {
  return defineCollection({
    name: 'changelogEntries',
    directory,
    include: '**/*.md',
    schema: changelogEntrySchema,
    transform: (entry) => ({
      ...entry,
      slug: contentSlugSchema.parse(entry._meta.path),
    }),
  });
}

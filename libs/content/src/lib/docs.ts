import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import { contentSlugSchema } from './changelog.js';

const nonEmptyString = z.string().trim().min(1);

export const docsEntrySchema = z.object({
  title: nonEmptyString,
  summary: nonEmptyString,
  category: nonEmptyString,
  order: z.number().int().nonnegative(),
  content: z.string(),
});

export type DocsEntryData = z.infer<typeof docsEntrySchema>;

/**
 * Creates the shared PostKit documentation collection for a consuming site.
 *
 * The directory is relative to that site's content-collections.ts file.
 */
export function createDocsCollection(directory: string) {
  return defineCollection({
    name: 'docsEntries',
    directory,
    include: '**/*.md',
    schema: docsEntrySchema,
    transform: (entry) => ({
      ...entry,
      slug: contentSlugSchema.parse(entry._meta.path),
    }),
  });
}

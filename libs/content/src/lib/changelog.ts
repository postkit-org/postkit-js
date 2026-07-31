import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);
export const contentSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Content filenames must use lowercase URL-safe slugs.',
  );

const changelogDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must use YYYY-MM-DD.')
  .refine(
    (date) => new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date,
    'Dates must be valid calendar dates.',
  );

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
 * Creates the shared PostKit changelog collection for a consuming site.
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

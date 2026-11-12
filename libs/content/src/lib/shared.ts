import { z } from 'zod';

/** A trimmed, non-empty string. Shared by every content collection. */
export const nonEmptyString = z.string().trim().min(1);

/** Lowercase, URL-safe slugs (`one-article-four-renderers`). */
export const contentSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Content filenames must use lowercase URL-safe slugs.',
  );

/** `YYYY-MM-DD`, and a real calendar date. */
export const changelogDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must use YYYY-MM-DD.')
  .refine(
    (date) => new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date,
    'Dates must be valid calendar dates.',
  );

/** Published by default; drafts are left out of production routes, search, feeds and the sitemap. */
export const publicationStatusSchema = z
  .enum(['published', 'draft'])
  .default('published');

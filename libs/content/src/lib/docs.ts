import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import {
  contentSlugSchema,
  nonEmptyString,
  publicationStatusSchema,
} from './shared.js';

/** The docs nav groups, in nav order (handoff 01 §5.1). */
export const docsCategories = [
  'Get started',
  'Writing',
  'Customizing',
  'Renderers',
  'Frameworks',
  'Reference',
] as const;

export const docsCategorySchema = z.enum(docsCategories);

export type DocsCategory = z.infer<typeof docsCategorySchema>;

export const docsEntrySchema = z.object({
  title: nonEmptyString,
  summary: nonEmptyString,
  category: docsCategorySchema,
  /** The 1-based position inside the entry's nav group. */
  order: z.number().int().positive(),
  /** The release that introduced the documented API (`'0.3.0'`); shows a version badge. */
  since: nonEmptyString.optional(),
  status: publicationStatusSchema,
  content: z.string(),
});

export type DocsEntryData = z.infer<typeof docsEntrySchema>;

type DocsEntryOrdering = Pick<
  DocsEntryData,
  'category' | 'order' | 'status' | 'title'
>;

export interface DocsVisibilityOptions {
  /** Drafts show in development and are left out of production builds. */
  readonly includeDrafts: boolean;
}

/** Whether an entry is visible: published entries always, drafts only when `includeDrafts` is set. */
export function isDocsEntryVisible(
  entry: Pick<DocsEntryData, 'status'>,
  { includeDrafts }: DocsVisibilityOptions,
): boolean {
  return includeDrafts || entry.status !== 'draft';
}

/** Orders entries by nav group, then their position inside the group, then title. */
export function compareDocsEntries(
  left: DocsEntryOrdering,
  right: DocsEntryOrdering,
): number {
  return (
    docsCategories.indexOf(left.category) -
      docsCategories.indexOf(right.category) ||
    left.order - right.order ||
    left.title.localeCompare(right.title)
  );
}

/** The visible entries in nav order. Drafts are dropped unless `includeDrafts` is set. */
export function selectDocsEntries<Entry extends DocsEntryOrdering>(
  entries: readonly Entry[],
  options: DocsVisibilityOptions,
): Entry[] {
  return entries
    .filter((entry) => isDocsEntryVisible(entry, options))
    .sort(compareDocsEntries);
}

/**
 * Creates the shared Postkit documentation collection for a consuming site.
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

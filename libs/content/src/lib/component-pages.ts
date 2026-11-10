import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import { contentSlugSchema } from './shared.js';

// PK-023 owns this file: replace this placeholder schema with handoff 01 §5.4
// (tagline, anatomy layers, usage and accessibility notes, related components).
export const componentPageSchema = z.object({
  content: z.string(),
});

export type ComponentPageData = z.infer<typeof componentPageSchema>;

/**
 * Creates the collection of per-component site notes (`libs/content/components/[slug].md`)
 * that sit beside the generated manifest on each component page.
 *
 * The directory is relative to that site's content-collections.ts file.
 */
export function createComponentPagesCollection(directory: string) {
  return defineCollection({
    name: 'componentPages',
    directory,
    include: '**/*.md',
    schema: componentPageSchema,
    transform: (entry) => ({
      ...entry,
      slug: contentSlugSchema.parse(entry._meta.path),
    }),
  });
}

import { defineCollection } from '@content-collections/core';
import { z } from 'zod';

import { contentSlugSchema, nonEmptyString } from './shared.js';

/** A part's outline on the flat (assembled) component, in CSS pixels from its top-left corner. */
export const componentAnatomyBoxSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const componentAnatomyLayerSchema = z.object({
  /** The `data-postkit-part` name: `icon`, `root`. */
  part: nonEmptyString,
  /** The HTML element the part renders, without brackets: `aside`, `span`. */
  element: z
    .string()
    .trim()
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Anatomy elements are lowercase tag names, such as "aside".',
    ),
  /** One line, Markdown inline code allowed. */
  description: nonEmptyString,
  box: componentAnatomyBoxSchema,
});

function fitsInside(
  inner: z.infer<typeof componentAnatomyBoxSchema>,
  outer: z.infer<typeof componentAnatomyBoxSchema>,
) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

/**
 * The exploded anatomy diagram (handoff 01 §6.3). Layers are listed top to bottom, and labels
 * are numbered in that order. The last layer is the root: its box is the whole flat component,
 * and every other part's box sits inside it.
 */
export const componentAnatomySchema = z
  .object({
    layers: z.array(componentAnatomyLayerSchema).min(1),
  })
  .superRefine(({ layers }, context) => {
    const seen = new Set<string>();
    layers.forEach((layer, index) => {
      if (seen.has(layer.part)) {
        context.addIssue({
          code: 'custom',
          message: `The part "${layer.part}" appears more than once.`,
          path: ['layers', index, 'part'],
        });
      }
      seen.add(layer.part);
    });

    const root = layers[layers.length - 1];
    layers.slice(0, -1).forEach((layer, index) => {
      if (!fitsInside(layer.box, root.box)) {
        context.addIssue({
          code: 'custom',
          message: `The "${layer.part}" box must sit inside the "${root.part}" box (the last layer).`,
          path: ['layers', index, 'box'],
        });
      }
    });
  });

/** A PascalCase component name, as in `postkitComponentCatalog`: `KeyTakeaway`. */
export const componentNameSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Z][A-Za-z0-9]*$/,
    'Component names are PascalCase, as in the catalog.',
  );

/**
 * Frontmatter for `libs/content/components/[slug].md` (handoff 01 §5.4). The body is Markdown
 * holding the page's notes: `## Usage` and `## Accessibility`, each opening with the grey half
 * of its section title as a paragraph of its own, as on the boards.
 */
export const componentPageSchema = z.object({
  /** The grey half of the page title and the share image. Falls back to the manifest description. */
  tagline: nonEmptyString.optional(),
  anatomy: componentAnatomySchema.optional(),
  /** Related component names, in display order. */
  related: z.array(componentNameSchema).optional(),
  content: z.string(),
});

export type ComponentPageData = z.infer<typeof componentPageSchema>;
export type ComponentAnatomy = z.infer<typeof componentAnatomySchema>;
export type ComponentAnatomyLayer = z.infer<typeof componentAnatomyLayerSchema>;

/** `key-takeaway` → `KeyTakeaway`. The file's slug must name a real catalog component. */
export function componentPageSlugToName(slug: string): string {
  return contentSlugSchema
    .parse(slug)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/** `KeyTakeaway` → `key-takeaway`: the `/components/[slug]` URL segment. */
export function componentNameToPageSlug(name: string): string {
  return componentNameSchema
    .parse(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Creates the collection of per-component site notes (`libs/content/components/[slug].md`)
 * that sit beside the generated manifest on each component page.
 *
 * The directory is relative to that site's content-collections.ts file. `component` is the
 * catalog name the slug maps to; the site checks it against `postkitComponentCatalog`.
 */
export function createComponentPagesCollection(directory: string) {
  return defineCollection({
    name: 'componentPages',
    directory,
    include: '**/*.md',
    schema: componentPageSchema,
    transform: (entry) => {
      const slug = contentSlugSchema.parse(entry._meta.path);
      return { ...entry, slug, component: componentPageSlugToName(slug) };
    },
  });
}

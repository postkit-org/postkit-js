import type { PostkitComponentName } from '@postkit/chakra';

/*
 * PK-033 stand-in: the props table's Default column.
 *
 * DELETE THIS FILE WHEN 03 STEP 8 LANDS. Manifest v2 carries a per-prop `default`
 * (03 §3.2), and the props table must read it from there (08 rule 7). Until then this map
 * holds the values the component boards show (SiteComponentCallout, -KeyTakeaway,
 * -CodeBlock, -Figure), which 06 PK-033 allows as the one exception to rule 7.
 *
 * - `variant` is "subtle" for every component (decision D12), even where the 0.2 recipes
 *   still default to "outline" or "plain".
 * - `size` is "md": every board shows it, and every 0.2 recipe already defaults to it.
 * - Anything else appears only where a board shows it.
 */

/** Theme-variant defaults shared by every component (D12 for `variant`). */
const appearanceDefaults: Readonly<Record<string, string>> = {
  size: 'md',
  variant: 'subtle',
};

/** Per-component defaults, exactly as the boards' props tables show them. */
const boardDefaults: Partial<
  Record<PostkitComponentName, Readonly<Record<string, string | boolean>>>
> = {
  Callout: { tone: 'note' },
  CodeBlock: { lineNumbers: false, copy: true, wrap: false },
  Figure: { layout: 'inline' },
};

/** The documented default for one prop, or `undefined` when there isn't one. */
export function componentPropDefault(
  name: PostkitComponentName,
  prop: string,
): string | boolean | undefined {
  return boardDefaults[name]?.[prop] ?? appearanceDefaults[prop];
}

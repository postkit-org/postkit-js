import { prop, type PostkitEnumPropDefinition } from './props.js';

/*
 * A component title's heading level (P20). A component can't know where it
 * sits in the page's outline, so its title is a paragraph unless the author
 * sets `headingLevel`; a hard-coded `h3` skips a level after an `h1`, or
 * breaks the outline under an `h4`.
 */

/** The heading levels a component title can take, as authored. */
export const postkitHeadingLevels: readonly ['2', '3', '4', '5', '6'] =
  Object.freeze(['2', '3', '4', '5', '6'] as const);

/** A heading level a component title can take. */
export type PostkitHeadingLevel = (typeof postkitHeadingLevels)[number];

/** A heading level as a view accepts it: the authored string or a number. */
export type PostkitHeadingLevelInput = PostkitHeadingLevel | 2 | 3 | 4 | 5 | 6;

/** The element a component title renders as. */
export type PostkitTitleElement = `h${PostkitHeadingLevel}` | 'p';

/**
 * The element for a component title: `h2` to `h6` for a heading level (a
 * string or a number), and `p` for anything else, including no level.
 *
 * ```ts
 * postkitTitleElement('3'); // 'h3'
 * postkitTitleElement(4); // 'h4'
 * postkitTitleElement(undefined); // 'p'
 * ```
 */
export function postkitTitleElement(level: unknown): PostkitTitleElement {
  const value =
    typeof level === 'number'
      ? String(level)
      : typeof level === 'string'
        ? level.trim()
        : undefined;
  return value !== undefined &&
    (postkitHeadingLevels as readonly string[]).includes(value)
    ? (`h${value}` as PostkitTitleElement)
    : 'p';
}

/**
 * A `headingLevel` prop: an optional enum of `postkitHeadingLevels` with no
 * default, so the title stays a paragraph until the author picks a level.
 */
export function headingLevelProp(
  description: string,
): PostkitEnumPropDefinition<PostkitHeadingLevel, false, false, false> {
  return prop.enum(postkitHeadingLevels, description);
}

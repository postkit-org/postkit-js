/**
 * Built-in components with no headless view yet: they render only through
 * `@postkit/chakra` (03 D11 consequence). Each is interactive, and gets its
 * headless view once its behaviour hook lands in `@postkit/react`.
 *
 * The manifest has no `support.react: 'chakra-only'` value yet (its support
 * data still says `supported` for every component); until it does, this list
 * is the record. Remove a name when its headless view ships.
 */
export const chakraOnly = Object.freeze([
  // Technical content: CodeBlock's copy action and CodeGroup's tabs.
  'CodeBlock',
  'CodeGroup',
] as const);

/** A built-in component that has no headless view yet. */
export type ChakraOnlyComponentName = (typeof chakraOnly)[number];

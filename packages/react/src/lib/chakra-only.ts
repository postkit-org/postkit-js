/**
 * Built-in components with no headless view in `@postkit/react` yet. Each is
 * interactive: its behaviour still comes from Chakra (Ark) in `@postkit/chakra`,
 * and its headless view waits for its behaviour hook (03 D11 consequence).
 *
 * The manifest has no `support.react: 'chakra-only'` value yet; it comes with
 * the computed support matrix (03 §8 step 9). Until then this list is the
 * record. Remove a name when its headless view ships.
 */
export const chakraOnly = Object.freeze([
  // Article structure: needs `useTabs` over the Tabs behaviour.
  'Tabs',
  // Technical content: CodeBlock's copy action and CodeGroup's tabs.
  'CodeBlock',
  'CodeGroup',
  'Poll',
] as const);

/** A built-in component that only `@postkit/chakra` renders today. */
export type ChakraOnlyComponentName = (typeof chakraOnly)[number];

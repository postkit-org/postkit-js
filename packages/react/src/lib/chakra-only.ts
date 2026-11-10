/**
 * Components with no headless view in `@postkit/react` yet. Their behaviour
 * still comes from Chakra (Ark) in `@postkit/chakra`, and a headless view
 * waits for its behaviour hook (03 D11 consequence: interactive components
 * without a hook stay chakra-only).
 *
 * The manifest has no `support.react: 'chakra-only'` value yet; it comes with
 * the computed support matrix (03 §8 step 9). Until then this list is the
 * record. Remove a name when its headless view lands.
 */
export const chakraOnly = Object.freeze([
  // Needs `useTabs` over the Tabs behaviour in `@postkit/core/behaviors`.
  'Tabs',
] as const);

/** The name of a component that only `@postkit/chakra` renders today. */
export type ChakraOnlyComponentName = (typeof chakraOnly)[number];

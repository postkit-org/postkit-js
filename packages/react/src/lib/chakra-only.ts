/**
 * Built-in components with no headless view in `@postkit/react` yet: render
 * them with `@postkit/chakra`.
 *
 * Per 03 D11 (and its consequence), `@postkit/react` ships a headless view for
 * every static component, while an interactive component whose behaviour
 * isn't in `@postkit/core/behaviors` stays `chakra-only` until 0.3.x. The
 * manifest has no `support.react: 'chakra-only'` field yet (03 §8 step 9
 * computes the support matrix), so this list is the record until then.
 *
 * - `Poll`: interactive voting state, with no shared behaviour yet.
 */
export const chakraOnly = Object.freeze(['Poll'] as const);

/** The name of a built-in component that is `chakra-only` for now. */
export type PostkitChakraOnlyComponent = (typeof chakraOnly)[number];

/**
 * Built-in components with no headless view in `@postkit/react` yet (03 D11
 * consequence). Empty: since 0.3.0 every built-in component, interactive
 * ones included, has a headless view whose behaviour comes from the shared
 * hooks. The export stays, as an empty frozen array, so code that reads it
 * keeps working; a name is added here only if a new built-in component ships
 * in `@postkit/chakra` before its headless view.
 *
 * The manifest has no `support.react: 'chakra-only'` value yet; it comes with
 * the computed support matrix (03 §8 step 9). Until then this list is the
 * record.
 */
export const chakraOnly = Object.freeze([] as const);

/**
 * A built-in component that only `@postkit/chakra` renders today. `never`
 * while {@link chakraOnly} is empty.
 */
export type ChakraOnlyComponentName = (typeof chakraOnly)[number];

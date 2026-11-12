import componentManifest from '@postkit/chakra/component-manifest.json';

/**
 * A component's `support.email` in the generated manifest (03 §6, step 9): `supported` when
 * `@postkit/email` exports a view for it, else its definition's declared fallback.
 */
export type ComponentEmailSupport =
  | 'supported'
  | 'not-supported'
  | { readonly fallback: 'text' | 'link' | 'omit' };

type ManifestComponents = Readonly<
  Record<
    string,
    { readonly support: { readonly email?: ComponentEmailSupport } }
  >
>;

/**
 * Reads `support.email` from `@postkit/chakra/component-manifest.json`. The generated file
 * carries it because the generator also reads `@postkit/email`'s views; `@postkit/chakra`'s
 * in-memory `postkitComponentCatalog` doesn't depend on `@postkit/email`, so it can't. Call
 * this from `getStaticProps`, so the manifest stays out of the page bundles.
 */
export function componentEmailSupport(
  name: string,
): ComponentEmailSupport | null {
  const components = componentManifest.components as ManifestComponents;
  return Object.hasOwn(components, name)
    ? (components[name].support.email ?? null)
    : null;
}

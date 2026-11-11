import componentManifest from '@postkit/chakra/component-manifest.json';

/** One prop's documented default, as manifest v2 records it. */
export type ComponentPropDefault = string | number | boolean;

/** A component's documented defaults, keyed by prop. Props without one are absent. */
export type ComponentPropDefaults = Readonly<
  Record<string, ComponentPropDefault>
>;

type ManifestComponents = Readonly<
  Record<
    string,
    {
      readonly props: Readonly<
        Record<string, { readonly default?: ComponentPropDefault }>
      >;
    }
  >
>;

/**
 * A component's per-prop defaults from `@postkit/chakra/component-manifest.json` (manifest
 * v2, 03 §3.2): the props table's Default column, the preview controls' starting values
 * and the catalog tiles' default state. `variant` is "subtle" everywhere (D12).
 *
 * The in-memory `postkitComponentCatalog` doesn't carry `default`, so this reads the
 * generated file. Call it from `getStaticProps`, so the manifest stays out of the page
 * bundles.
 */
export function componentPropDefaults(name: string): ComponentPropDefaults {
  const components = componentManifest.components as ManifestComponents;
  if (!Object.hasOwn(components, name)) return {};
  return Object.fromEntries(
    Object.entries(components[name].props).flatMap(([prop, declaration]) =>
      declaration.default === undefined ? [] : [[prop, declaration.default]],
    ),
  );
}

/** {@link componentPropDefaults} for several components, keyed by name. */
export function componentPropDefaultsByName(
  names: Iterable<string>,
): Readonly<Record<string, ComponentPropDefaults>> {
  return Object.fromEntries(
    [...names].map((name) => [name, componentPropDefaults(name)]),
  );
}

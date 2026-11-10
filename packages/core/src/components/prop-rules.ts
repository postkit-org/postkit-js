import type { AnyPostkitComponentDefinition } from './definition.js';

/*
 * Prop aliases and recommended props (03 §7, D6 and D20): rules every
 * renderer, the Markdown plugin and the static serializer share, so an alias
 * or a warning means the same thing everywhere.
 */

/** A definition's prop aliases: alias → prop name. */
export function postkitPropAliases(
  definition: AnyPostkitComponentDefinition,
): ReadonlyMap<string, string> {
  const aliases = new Map<string, string>();
  for (const [name, prop] of Object.entries(definition.props)) {
    for (const alias of prop.aliases ?? []) aliases.set(alias, name);
  }
  return aliases;
}

/**
 * Maps authored aliases to their props: `{ type: 'tip' }` → `{ tone: 'tip' }`
 * for Callout. The prop wins when both are set, and the alias is removed
 * either way. Returns `props` itself when nothing is aliased.
 */
export function postkitCanonicalProps<
  Props extends Readonly<Record<string, unknown>>,
>(definition: AnyPostkitComponentDefinition, props: Props): Props {
  let canonical: Record<string, unknown> | undefined;
  for (const [name, prop] of Object.entries(definition.props)) {
    for (const alias of prop.aliases ?? []) {
      if (!Object.hasOwn(props, alias)) continue;
      canonical ??= { ...props };
      if (canonical[name] === undefined) canonical[name] = canonical[alias];
      delete canonical[alias];
    }
  }
  return (canonical ?? props) as Props;
}

/**
 * Whether an authored value counts as set for a recommendation: `undefined`,
 * `null` and blank strings don't, and neither does `false` (or `"false"`).
 */
function isSet(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== 'false';
  }
  return true;
}

/**
 * The validation warnings for authored props: one message for each
 * recommended prop that is missing while none of its `unless` props is set.
 * These never fail a build, in any mode (D20). Aliases count as their prop.
 *
 * Pass `present` to treat props as set by presence (a bare `decorative`
 * directive attribute, or an MDX expression attribute that can't be read).
 */
export function postkitPropAdvisories(
  definition: AnyPostkitComponentDefinition,
  props: Readonly<Record<string, unknown>>,
  options: { readonly present?: ReadonlySet<string> } = {},
): readonly string[] {
  const canonical = postkitCanonicalProps(definition, props);
  const aliases = postkitPropAliases(definition);
  const present = new Set<string>();
  for (const name of options.present ?? [])
    present.add(aliases.get(name) ?? name);
  const set = (name: string) => present.has(name) || isSet(canonical[name]);

  const advisories: string[] = [];
  for (const [name, prop] of Object.entries(definition.props)) {
    const recommended = prop.recommended;
    if (!recommended || set(name)) continue;
    if ((recommended.unless ?? []).some(set)) continue;
    advisories.push(
      `${definition.name}: the "${name}" prop is missing. ${recommended.reason}`,
    );
  }
  return advisories;
}

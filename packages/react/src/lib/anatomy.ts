import type {
  AnyPostkitComponentDefinition,
  PostkitPropDefinition,
} from '@postkit/core/components';

/**
 * The anatomy attributes every renderer stamps on a part (03 §5.1).
 *
 * The root also carries `data-postkit-component`, one `data-*` attribute per
 * theme-variant prop (`data-tone`, `data-size`, `data-variant`, …) and
 * `data-postkit-unstyled` when the instance opts out of styles.
 */
export interface PostkitPartAttributes {
  readonly 'data-postkit-part': string;
  readonly 'data-postkit-component'?: string;
  readonly 'data-postkit-unstyled'?: '';
  readonly [state: `data-${string}`]: string | undefined;
}

/** Options for {@link resolvePostkitViewState}. */
export interface ResolvePostkitViewStateOptions {
  /**
   * Defaults for theme-variant props that win over the definition's defaults,
   * such as a Chakra recipe's `defaultVariants`. Only plain string and boolean
   * values are used.
   */
  readonly themeDefaults?: Readonly<Record<string, unknown>>;
}

/** Authored props resolved against a definition. */
export interface PostkitViewState {
  /**
   * The authored props with defaults applied: an unset prop takes its theme
   * default or definition default, and an enum value the definition doesn't
   * allow falls back to the same default.
   */
  readonly props: Readonly<Record<string, unknown>>;
  /**
   * The resolved theme-variant values, as data-attribute strings, keyed by
   * prop name. Responsive (object) values have no entry.
   */
  readonly state: Readonly<Record<string, string>>;
}

declare const process: { readonly env: Record<string, string | undefined> };

/** Whether development-only checks run (`NODE_ENV` isn't `production`). */
export function isPostkitDevelopment(): boolean {
  try {
    return process.env['NODE_ENV'] !== 'production';
  } catch {
    return false;
  }
}

/** `layoutMode` → `data-layout-mode`. */
export function postkitStateAttributeName(propName: string): `data-${string}` {
  return `data-${propName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function isPlainVariantValue(value: unknown): value is boolean | string {
  return typeof value === 'string' || typeof value === 'boolean';
}

function isAllowedEnumValue(prop: PostkitPropDefinition, value: unknown) {
  return prop.kind !== 'enum' || prop.values.includes(value as string);
}

/**
 * Resolves authored props against a definition: applies defaults, falls back
 * from enum values the definition doesn't allow, and computes the
 * theme-variant state that becomes the root's data attributes.
 *
 * Props the definition doesn't declare (`children`, `icon`, renderer props)
 * pass through unchanged.
 */
export function resolvePostkitViewState(
  definition: AnyPostkitComponentDefinition,
  props: Readonly<Record<string, unknown>>,
  options: ResolvePostkitViewStateOptions = {},
): PostkitViewState {
  const resolved: Record<string, unknown> = { ...props };
  const state: Record<string, string> = {};

  for (const [name, prop] of Object.entries(definition.props)) {
    const themeDefault = prop.themeVariant
      ? options.themeDefaults?.[name]
      : undefined;
    const fallback =
      isPlainVariantValue(themeDefault) &&
      isAllowedEnumValue(prop, themeDefault)
        ? themeDefault
        : prop.default;
    const value = props[name];

    if (
      value === undefined ||
      (typeof value === 'string' && !isAllowedEnumValue(prop, value))
    ) {
      if (fallback === undefined) delete resolved[name];
      else resolved[name] = fallback;
    }

    const resolvedValue = resolved[name];
    if (prop.themeVariant && isPlainVariantValue(resolvedValue)) {
      state[name] = String(resolvedValue);
    }
  }

  return { props: resolved, state };
}

/**
 * The anatomy attributes for one part. Renderers spread these first, so every
 * renderer emits the same `data-postkit-*` attributes and part tree.
 */
export function postkitPartAttributes(
  definition: AnyPostkitComponentDefinition,
  part: string,
  state: Readonly<Record<string, string>> = {},
  options: { readonly unstyled?: boolean } = {},
): PostkitPartAttributes {
  if (part !== 'root') return { 'data-postkit-part': part };

  const attributes: Record<string, string> = {
    'data-postkit-component': definition.name,
    'data-postkit-part': 'root',
  };
  for (const name of definition.themeVariants) {
    const value = state[name];
    if (value !== undefined)
      attributes[postkitStateAttributeName(name)] = value;
  }
  if (options.unstyled) attributes['data-postkit-unstyled'] = '';
  return attributes as unknown as PostkitPartAttributes;
}

function describe(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  if (typeof value === 'object')
    return Array.isArray(value) ? 'an array' : 'an object';
  return String(value);
}

function propProblem(
  prop: PostkitPropDefinition,
  value: unknown,
): string | undefined {
  switch (prop.kind) {
    case 'string':
      return typeof value === 'string' ? undefined : 'must be a string';
    case 'number':
      return (typeof value === 'number' && Number.isFinite(value)) ||
        (typeof value === 'string' &&
          value.trim() !== '' &&
          Number.isFinite(Number(value)))
        ? undefined
        : 'must be a finite number';
    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false'
        ? undefined
        : 'must be a boolean';
    case 'enum':
      if (typeof value === 'string') {
        return prop.values.includes(value)
          ? undefined
          : `must be one of ${prop.values.map((entry) => JSON.stringify(entry)).join(', ')}`;
      }
      // Themed renderers accept responsive objects for theme variants.
      return prop.themeVariant && value !== null && typeof value === 'object'
        ? undefined
        : `must be one of ${prop.values.map((entry) => JSON.stringify(entry)).join(', ')}`;
    case 'json':
      return undefined;
  }
}

/**
 * Checks authored props against a definition and returns one message per
 * problem: a missing required prop, or a value of the wrong kind. Number and
 * boolean props accept their string forms (`"1600"`, `"true"`), as authored
 * MDX attributes are strings. Undeclared props aren't checked.
 */
export function validatePostkitProps(
  definition: AnyPostkitComponentDefinition,
  props: Readonly<Record<string, unknown>>,
): readonly string[] {
  const problems: string[] = [];
  for (const [name, prop] of Object.entries(definition.props)) {
    const value = props[name];
    if (value === undefined || value === null) {
      if (prop.required) {
        problems.push(`${definition.name}: the "${name}" prop is required.`);
      }
      continue;
    }
    const problem = propProblem(prop, value);
    if (problem) {
      problems.push(
        `${definition.name}: the "${name}" prop ${problem}; received ${describe(value)}.`,
      );
    }
  }
  return problems;
}

const reported = new Set<string>();

/**
 * In development, warns once per problem {@link validatePostkitProps} finds.
 * Does nothing in production.
 */
export function warnPostkitProps(
  definition: AnyPostkitComponentDefinition,
  props: Readonly<Record<string, unknown>>,
): void {
  if (!isPostkitDevelopment()) return;
  for (const problem of validatePostkitProps(definition, props)) {
    if (reported.has(problem)) continue;
    reported.add(problem);
    console.warn(`Postkit ${problem}`);
  }
}

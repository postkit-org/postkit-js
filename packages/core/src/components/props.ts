/** The authored value kinds a Postkit prop can declare. */
export type PostkitPropKind = 'boolean' | 'enum' | 'json' | 'number' | 'string';

/** The fields every prop definition has. */
export interface PostkitPropDefinitionBase<
  Kind extends PostkitPropKind,
  Value,
  Required extends boolean,
  ThemeVariant extends boolean,
> {
  readonly kind: Kind;
  /** What the prop does, for the manifest, editors and props tables. */
  readonly description: string;
  /** Whether an author must set the prop. */
  readonly required: Required;
  /** Whether the prop is also a recipe variant in themed renderers. */
  readonly themeVariant: ThemeVariant;
  /** The value a renderer uses when the author doesn't set one. */
  readonly default?: Value;
}

export type PostkitStringPropDefinition<Required extends boolean = boolean> =
  PostkitPropDefinitionBase<'string', string, Required, false>;

export type PostkitNumberPropDefinition<Required extends boolean = boolean> =
  PostkitPropDefinitionBase<'number', number, Required, false>;

export type PostkitBooleanPropDefinition<
  Required extends boolean = boolean,
  ThemeVariant extends boolean = boolean,
> = PostkitPropDefinitionBase<'boolean', boolean, Required, ThemeVariant>;

export interface PostkitEnumPropDefinition<
  Value extends string = string,
  Required extends boolean = boolean,
  ThemeVariant extends boolean = boolean,
> extends PostkitPropDefinitionBase<'enum', Value, Required, ThemeVariant> {
  /** The allowed values, in authoring order. */
  readonly values: readonly Value[];
}

/**
 * A JSON-serialized prop. `Value` describes the parsed shape for views; it is
 * not validated beyond JSON syntax.
 */
export type PostkitJsonPropDefinition<
  Value = unknown,
  Required extends boolean = boolean,
> = PostkitPropDefinitionBase<'json', Value, Required, false>;

/** Any prop definition produced by the `prop` builders. */
export type PostkitPropDefinition =
  | PostkitBooleanPropDefinition
  | PostkitEnumPropDefinition
  | PostkitJsonPropDefinition
  | PostkitNumberPropDefinition
  | PostkitStringPropDefinition;

/** A component's props, keyed by prop name. */
export type PostkitPropDefinitions = Readonly<
  Record<string, PostkitPropDefinition>
>;

/** The authored value type of one prop definition. */
export type PostkitPropValueOf<Prop> = Prop extends {
  readonly default?: infer Value;
}
  ? Value
  : never;

export interface PostkitPropOptions<Value, Required extends boolean> {
  readonly required?: Required;
  readonly default?: Value;
}

export interface PostkitVariantPropOptions<
  Value,
  Required extends boolean,
  ThemeVariant extends boolean,
> extends PostkitPropOptions<Value, Required> {
  /** `true` makes the prop a recipe variant in themed renderers. */
  readonly themeVariant?: ThemeVariant;
}

export interface PostkitEnumPropOptions<
  Value extends string,
  Required extends boolean,
  ThemeVariant extends boolean,
> extends PostkitVariantPropOptions<Value, Required, ThemeVariant> {
  readonly description: string;
}

function assertDescription(
  description: unknown,
): asserts description is string {
  if (typeof description !== 'string' || description.trim() === '') {
    throw new TypeError('A Postkit prop needs a non-empty description.');
  }
}

function createProp<Prop extends PostkitPropDefinition>(
  kind: PostkitPropKind,
  description: string,
  options: {
    readonly required?: boolean;
    readonly default?: unknown;
    readonly themeVariant?: boolean;
  } = {},
  values?: readonly string[],
): Prop {
  assertDescription(description);
  const prop: Record<string, unknown> = { kind };
  if (values) prop['values'] = Object.freeze([...values]);
  prop['description'] = description;
  prop['required'] = options.required === true;
  prop['themeVariant'] = options.themeVariant === true;
  if (options.default !== undefined) {
    prop['default'] = deepFreeze(structuredClone(options.default));
  }
  return Object.freeze(prop) as unknown as Prop;
}

function assertEnumValues(values: readonly string[], defaultValue: unknown) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError('A Postkit enum prop needs at least one value.');
  }
  if (values.some((value) => typeof value !== 'string' || value === '')) {
    throw new TypeError('Postkit enum values must be non-empty strings.');
  }
  if (new Set(values).size !== values.length) {
    throw new TypeError(
      `Postkit enum values must be unique: ${values.join(', ')}.`,
    );
  }
  if (defaultValue !== undefined && !values.includes(defaultValue as string)) {
    throw new TypeError(
      `The Postkit enum default "${String(defaultValue)}" isn't one of ${values.join(', ')}.`,
    );
  }
}

function assertDefaultType(kind: string, defaultValue: unknown): void {
  if (defaultValue === undefined || kind === 'json') return;
  if (typeof defaultValue !== kind) {
    throw new TypeError(
      `A Postkit ${kind} prop can't default to ${JSON.stringify(defaultValue)}.`,
    );
  }
}

/** Recursively freezes plain data so definitions can't drift at runtime. */
export function deepFreeze<Value>(value: Value): Value {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

/**
 * A JSON prop. Overloaded on `required` rather than inferring it, so an
 * explicit value type (`prop.json<Item[]>(…)`) still types `required: true`.
 */
function jsonProp<Value = unknown>(
  description: string,
  options: PostkitPropOptions<NoInfer<Value>, true> & {
    readonly required: true;
  },
): PostkitJsonPropDefinition<Value, true>;
function jsonProp<Value = unknown>(
  description: string,
  options?: PostkitPropOptions<NoInfer<Value>, false>,
): PostkitJsonPropDefinition<Value, false>;
function jsonProp(
  description: string,
  options?: PostkitPropOptions<unknown, boolean>,
): PostkitJsonPropDefinition {
  return createProp('json', description, options);
}

/**
 * Prop builders. Each returns a frozen prop definition whose type carries its
 * value type, whether it is required, and whether it is a theme variant.
 */
export const prop = Object.freeze({
  /** A plain-text prop. */
  string<const Required extends boolean = false>(
    description: string,
    options?: PostkitPropOptions<string, Required>,
  ): PostkitStringPropDefinition<NoInfer<Required>> {
    assertDefaultType('string', options?.default);
    return createProp('string', description, options);
  },

  /** A finite number prop. */
  number<const Required extends boolean = false>(
    description: string,
    options?: PostkitPropOptions<number, Required>,
  ): PostkitNumberPropDefinition<NoInfer<Required>> {
    assertDefaultType('number', options?.default);
    return createProp('number', description, options);
  },

  /** A boolean prop. A bare directive attribute (`{open}`) means `true`. */
  boolean<
    const Required extends boolean = false,
    const ThemeVariant extends boolean = false,
  >(
    description: string,
    options?: PostkitVariantPropOptions<boolean, Required, ThemeVariant>,
  ): PostkitBooleanPropDefinition<NoInfer<Required>, NoInfer<ThemeVariant>> {
    assertDefaultType('boolean', options?.default);
    return createProp('boolean', description, options);
  },

  /** One of a fixed list of string values. */
  enum<
    const Value extends string,
    const Required extends boolean = false,
    const ThemeVariant extends boolean = false,
  >(
    values: readonly Value[],
    descriptionOrOptions:
      string | PostkitEnumPropOptions<NoInfer<Value>, Required, ThemeVariant>,
  ): PostkitEnumPropDefinition<
    Value,
    NoInfer<Required>,
    NoInfer<ThemeVariant>
  > {
    const options =
      typeof descriptionOrOptions === 'string'
        ? { description: descriptionOrOptions }
        : descriptionOrOptions;
    assertEnumValues(values, options?.default);
    return createProp('enum', options?.description, options, values);
  },

  /** JSON data such as an array of items, passed as a JSON string in directives. */
  json: jsonProp,
});

/**
 * The shared presentation props every built-in component accepts. Spread it
 * first into a definition's `props`. `variant` defaults to `subtle` (D12).
 */
export const presentation = Object.freeze({
  size: prop.enum(['sm', 'md', 'lg'], {
    description: 'The component density and type scale.',
    default: 'md',
    themeVariant: true,
  }),
  variant: prop.enum(['outline', 'subtle', 'plain'], {
    description: 'The component visual treatment.',
    default: 'subtle',
    themeVariant: true,
  }),
});

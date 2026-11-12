/** The authored value kinds a Postkit prop can declare. */
export type PostkitPropKind = 'boolean' | 'enum' | 'json' | 'number' | 'string';

/** The fields every prop definition has. */
export interface PostkitPropDefinitionFields<
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
  /**
   * Other names authors may use for the prop, such as Callout's `type` for
   * `tone` (D6). Directives, MDX props and the static serializer map an
   * alias to the prop; the prop wins when both are set.
   */
  readonly aliases?: readonly string[];
  /**
   * A prop authors should set: leaving it out is a validation warning
   * (development console and build output), never a failure, in every mode.
   */
  readonly recommended?: PostkitPropRecommendation;
}

/**
 * Why a prop is recommended, and what makes it unnecessary. Video's
 * `captions` is recommended unless the video is `decorative` (D20).
 */
export interface PostkitPropRecommendation {
  /** The warning, such as "add a captions track, or mark it decorative". */
  readonly reason: string;
  /**
   * Props (or renderer-only props, such as the React views' `tracks`) that
   * silence the warning when set. A boolean prop silences it only when true.
   */
  readonly unless?: readonly string[];
}

/**
 * Marks `default` as present when `Default` is `true`, so views receive the
 * prop as non-optional (`PostkitPropsOf`). `boolean` (the default) means
 * "not known", which keeps `default` optional.
 */
export type PostkitPropDefaultOf<
  Value,
  Default extends boolean,
> = Default extends true ? { readonly default: Value } : unknown;

/**
 * The fields every prop definition has. `Default` is `true` when the prop
 * declares a `default`.
 */
export type PostkitPropDefinitionBase<
  Kind extends PostkitPropKind,
  Value,
  Required extends boolean,
  ThemeVariant extends boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionFields<Kind, Value, Required, ThemeVariant> &
  PostkitPropDefaultOf<Value, Default>;

export type PostkitStringPropDefinition<
  Required extends boolean = boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionBase<'string', string, Required, false, Default>;

export type PostkitNumberPropDefinition<
  Required extends boolean = boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionBase<'number', number, Required, false, Default>;

export type PostkitBooleanPropDefinition<
  Required extends boolean = boolean,
  ThemeVariant extends boolean = boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionBase<
  'boolean',
  boolean,
  Required,
  ThemeVariant,
  Default
>;

export type PostkitEnumPropDefinition<
  Value extends string = string,
  Required extends boolean = boolean,
  ThemeVariant extends boolean = boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionBase<
  'enum',
  Value,
  Required,
  ThemeVariant,
  Default
> & {
  /** The allowed values, in authoring order. */
  readonly values: readonly Value[];
};

/**
 * A JSON-serialized prop. `Value` describes the parsed shape for views; it is
 * not validated beyond JSON syntax.
 */
export type PostkitJsonPropDefinition<
  Value = unknown,
  Required extends boolean = boolean,
  Default extends boolean = boolean,
> = PostkitPropDefinitionBase<'json', Value, Required, false, Default>;

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
  /** Other names authors may use for the prop. */
  readonly aliases?: readonly string[];
  /** Leaving the prop out is a validation warning, never a failure. */
  readonly recommended?: PostkitPropRecommendation;
}

/** `true` when a builder was given a `default` (its inferred type isn't `undefined`). */
type HasDefault<DefaultValue> = [DefaultValue] extends [undefined]
  ? false
  : true;

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
    readonly aliases?: readonly string[];
    readonly recommended?: PostkitPropRecommendation;
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
  if (options.aliases !== undefined) {
    prop['aliases'] = assertAliases(options.aliases);
  }
  if (options.recommended !== undefined) {
    prop['recommended'] = assertRecommendation(
      options.recommended,
      options.required === true,
    );
  }
  return Object.freeze(prop) as unknown as Prop;
}

const aliasPattern = /^[a-z][A-Za-z0-9]*$/;

function assertAliases(aliases: readonly string[]): readonly string[] {
  if (
    !Array.isArray(aliases) ||
    aliases.length === 0 ||
    aliases.some(
      (alias) => typeof alias !== 'string' || !aliasPattern.test(alias),
    )
  ) {
    throw new TypeError('Postkit prop aliases must be camelCase names.');
  }
  if (new Set(aliases).size !== aliases.length) {
    throw new TypeError(
      `Postkit prop aliases must be unique: ${aliases.join(', ')}.`,
    );
  }
  return Object.freeze([...aliases]);
}

function assertRecommendation(
  recommended: PostkitPropRecommendation,
  required: boolean,
): PostkitPropRecommendation {
  if (required) {
    throw new TypeError('A required Postkit prop cannot also be recommended.');
  }
  if (
    !recommended ||
    typeof recommended.reason !== 'string' ||
    recommended.reason.trim() === ''
  ) {
    throw new TypeError('A recommended Postkit prop needs a reason.');
  }
  const unless = recommended.unless ?? [];
  if (
    unless.some((name) => typeof name !== 'string' || !aliasPattern.test(name))
  ) {
    throw new TypeError(
      "A recommendation's `unless` lists camelCase prop names.",
    );
  }
  return deepFreeze({
    reason: recommended.reason,
    ...(unless.length > 0 ? { unless: [...unless] } : {}),
  });
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
 * A JSON prop. Overloaded on `required` and `default` rather than inferring
 * them, so an explicit value type (`prop.json<Item[]>(…)`) still types
 * `required: true` and a declared default.
 */
function jsonProp<Value = unknown>(
  description: string,
  options: PostkitPropOptions<NoInfer<Value>, true> & {
    readonly required: true;
  },
): PostkitJsonPropDefinition<Value, true, false>;
function jsonProp<Value = unknown>(
  description: string,
  options: PostkitPropOptions<NoInfer<Value>, false> & {
    readonly default: NoInfer<Value>;
  },
): PostkitJsonPropDefinition<Value, false, true>;
function jsonProp<Value = unknown>(
  description: string,
  options?: PostkitPropOptions<NoInfer<Value>, false>,
): PostkitJsonPropDefinition<Value, false, false>;
function jsonProp(
  description: string,
  options?: PostkitPropOptions<unknown, boolean>,
): PostkitJsonPropDefinition {
  return createProp('json', description, options);
}

/**
 * Prop builders. Each returns a frozen prop definition whose type carries its
 * value type, whether it is required, whether it is a theme variant, and
 * whether it declares a default.
 */
export const prop = Object.freeze({
  /** A plain-text prop. */
  string<
    const Required extends boolean = false,
    const DefaultValue extends string | undefined = undefined,
  >(
    description: string,
    options?: PostkitPropOptions<string, Required> & {
      readonly default?: DefaultValue;
    },
  ): PostkitStringPropDefinition<NoInfer<Required>, HasDefault<DefaultValue>> {
    assertDefaultType('string', options?.default);
    return createProp('string', description, options);
  },

  /** A finite number prop. */
  number<
    const Required extends boolean = false,
    const DefaultValue extends number | undefined = undefined,
  >(
    description: string,
    options?: PostkitPropOptions<number, Required> & {
      readonly default?: DefaultValue;
    },
  ): PostkitNumberPropDefinition<NoInfer<Required>, HasDefault<DefaultValue>> {
    assertDefaultType('number', options?.default);
    return createProp('number', description, options);
  },

  /** A boolean prop. A bare directive attribute (`{open}`) means `true`. */
  boolean<
    const Required extends boolean = false,
    const ThemeVariant extends boolean = false,
    const DefaultValue extends boolean | undefined = undefined,
  >(
    description: string,
    options?: PostkitVariantPropOptions<boolean, Required, ThemeVariant> & {
      readonly default?: DefaultValue;
    },
  ): PostkitBooleanPropDefinition<
    NoInfer<Required>,
    NoInfer<ThemeVariant>,
    HasDefault<DefaultValue>
  > {
    assertDefaultType('boolean', options?.default);
    return createProp('boolean', description, options);
  },

  /** One of a fixed list of string values. */
  enum<
    const Value extends string,
    const Required extends boolean = false,
    const ThemeVariant extends boolean = false,
    const DefaultValue extends NoInfer<Value> | undefined = undefined,
  >(
    values: readonly Value[],
    descriptionOrOptions:
      | string
      | (PostkitEnumPropOptions<NoInfer<Value>, Required, ThemeVariant> & {
          readonly default?: DefaultValue;
        }),
  ): PostkitEnumPropDefinition<
    Value,
    NoInfer<Required>,
    NoInfer<ThemeVariant>,
    HasDefault<DefaultValue>
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

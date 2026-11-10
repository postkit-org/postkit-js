import {
  postkitEmailFallbacks,
  type PostkitComponentEmailDefinition,
} from './email.js';
import {
  deepFreeze,
  type PostkitPropDefinitions,
  type PostkitPropValueOf,
} from './props.js';

/** Catalog categories, keyed by id, with their display labels. */
export const postkitComponentCategories = Object.freeze({
  'article-structure': 'Article structure',
  'technical-content': 'Technical content',
  media: 'Media',
  discovery: 'Discovery',
  engagement: 'Engagement',
  publishing: 'Publishing',
} as const);

export type PostkitComponentCategoryId =
  keyof typeof postkitComponentCategories;

/**
 * What a component needs at runtime: `static` markup, `native-controls`
 * (browser media or `<details>`), `client` behaviour, or a metadata `resolver`.
 */
export type PostkitComponentRuntime =
  'client' | 'native-controls' | 'resolver' | 'static';

export type PostkitComponentStability =
  'deprecated' | 'experimental' | 'initial' | 'stable';

/** Whether a component wraps authored MDX content. */
export type PostkitComponentChildren = 'mdx' | 'none';

/**
 * Props as a view receives them: a required prop, or one with a `default`,
 * is non-optional, since the view resolves defaults before it renders.
 */
export type PostkitPropsOfProps<Props extends PostkitPropDefinitions> = {
  -readonly [
    Name in keyof Props as Props[Name] extends {
      readonly required: true;
    }
      ? Name
      : Props[Name] extends { readonly default: unknown }
        ? Name
        : never
  ]: PostkitPropValueOf<Props[Name]>;
} & {
  -readonly [
    Name in keyof Props as Props[Name] extends {
      readonly required: true;
    }
      ? never
      : Props[Name] extends { readonly default: unknown }
        ? never
        : Name
  ]?: PostkitPropValueOf<Props[Name]>;
};

/** Props as an author writes them: only required props are required. */
export type PostkitAuthoredPropsOfProps<Props extends PostkitPropDefinitions> =
  {
    -readonly [
      Name in keyof Props as Props[Name] extends {
        readonly required: true;
      }
        ? Name
        : never
    ]: PostkitPropValueOf<Props[Name]>;
  } & {
    -readonly [
      Name in keyof Props as Props[Name] extends {
        readonly required: true;
      }
        ? never
        : Name
    ]?: PostkitPropValueOf<Props[Name]>;
  };

export interface PostkitComponentExampleDefinition<
  Props extends PostkitPropDefinitions = PostkitPropDefinitions,
> {
  /** Example prop values; JSON props hold parsed values. */
  readonly props?: Readonly<Partial<PostkitAuthoredPropsOfProps<Props>>>;
  /** Example authored content, for components with `children: 'mdx'`. */
  readonly children?: string;
}

/** The input to {@link definePostkitComponent}. */
export interface PostkitComponentDefinitionInput<
  Name extends string,
  Props extends PostkitPropDefinitions,
  Slots extends readonly string[],
  Children extends PostkitComponentChildren,
  Runtime extends PostkitComponentRuntime,
> {
  /** The PascalCase component name, as in MDX (`<Callout>`). */
  readonly name: Name;
  /** The Markdown directive name, such as `postkit-callout`. */
  readonly directive: string;
  readonly category: PostkitComponentCategoryId;
  /** A one-line description for the catalog and editors. */
  readonly description: string;
  /** `mdx` when the component wraps authored content. Defaults to `none`. */
  readonly children?: Children;
  /** Defaults to `static`. */
  readonly runtime?: Runtime;
  /** Defaults to `initial`. */
  readonly stability?: PostkitComponentStability;
  /** The props, built with `presentation` and the `prop` builders. */
  readonly props: Props;
  /** The anatomy: the named parts every renderer emits. Includes `root`. */
  readonly slots: Slots;
  /** Extra search terms for the catalog and editors. */
  readonly keywords?: readonly string[];
  /** Example props and children for the catalog and generated docs. */
  readonly example?: PostkitComponentExampleDefinition<NoInfer<Props>>;
  /**
   * The email fallback when `@postkit/email` has no view for the component
   * (03 §6): `{ fallback: 'text' | 'link' | 'omit' }`.
   */
  readonly email?: PostkitComponentEmailDefinition;
}

/** A frozen, framework-free component definition. */
export interface PostkitComponentDefinition<
  Name extends string = string,
  Props extends PostkitPropDefinitions = PostkitPropDefinitions,
  Slots extends readonly string[] = readonly string[],
  Children extends PostkitComponentChildren = PostkitComponentChildren,
  Runtime extends PostkitComponentRuntime = PostkitComponentRuntime,
  ThemeVariant extends string = string,
> {
  readonly name: Name;
  readonly directive: string;
  readonly category: PostkitComponentCategoryId;
  readonly description: string;
  readonly children: Children;
  readonly runtime: Runtime;
  readonly stability: PostkitComponentStability;
  readonly props: Props;
  readonly slots: Slots;
  /**
   * The props marked `themeVariant`, in prop order. Themed renderers pass
   * these to their recipe as variants.
   */
  readonly themeVariants: readonly ThemeVariant[];
  readonly keywords: readonly string[];
  readonly example?: PostkitComponentExampleDefinition<Props>;
  /** The declared email fallback, when the definition has one (03 §6). */
  readonly email?: PostkitComponentEmailDefinition;
  /**
   * Type-only: the anatomy slot union, `'root' | 'icon' | …`. It is
   * `undefined` at runtime and never enumerable.
   *
   * It exists so a renderer can read the union in value position
   * (`{ callout: calloutDefinition.$slot }`): declaration emit then writes the
   * resolved literal union, so the renderer's public maps cost consumers no
   * type instantiations. In type position, use {@link PostkitSlotOf}.
   */
  readonly $slot: Slots[number];
  /**
   * Type-only: the theme-variant prop union, `'size' | 'variant' | …`. It is
   * `undefined` at runtime; see {@link PostkitComponentDefinition.$slot}. In
   * type position, use {@link PostkitThemeVariantOf}.
   */
  readonly $themeVariant: ThemeVariant;
}

/** Any component definition. */
export type AnyPostkitComponentDefinition = PostkitComponentDefinition<
  string,
  PostkitPropDefinitions,
  readonly string[],
  PostkitComponentChildren,
  PostkitComponentRuntime,
  string
>;

/**
 * The props of a definition as its view receives them: required props and
 * props with a `default` are non-optional, so a view needs no `?? 'note'`
 * fallback. For what an author passes, use {@link PostkitAuthoredPropsOf}.
 */
export type PostkitPropsOf<
  Definition extends { readonly props: PostkitPropDefinitions },
> = PostkitPropsOfProps<Definition['props']>;

/**
 * The props of a definition as an author writes them: only required props
 * are required. A view's own props type builds on this.
 */
export type PostkitAuthoredPropsOf<
  Definition extends { readonly props: PostkitPropDefinitions },
> = PostkitAuthoredPropsOfProps<Definition['props']>;

/** The prop names of a definition that declare a `default`. */
export type PostkitDefaultedPropNameOf<
  Definition extends { readonly props: PostkitPropDefinitions },
> = {
  [Name in keyof Definition['props']]: Definition['props'][Name] extends {
    readonly default: unknown;
  }
    ? Name
    : never;
}[keyof Definition['props']] &
  string;

/** The prop names of a definition. */
export type PostkitPropNameOf<
  Definition extends { readonly props: PostkitPropDefinitions },
> = keyof Definition['props'] & string;

/** The anatomy slot names of a definition. */
export type PostkitSlotOf<
  Definition extends { readonly slots: readonly string[] },
> = Definition['slots'][number];

/** The props of a definition that are also recipe variants. */
export type PostkitThemeVariantOf<
  Definition extends { readonly themeVariants: readonly string[] },
> = Definition['themeVariants'][number];

/** The camel-cased theme key: `CallToAction` → `callToAction`. */
export type PostkitThemeKeyOf<Definition extends { readonly name: string }> =
  Uncapitalize<Definition['name']>;

/** The Chakra recipe key: `Callout` → `postkitCallout`. */
export type PostkitRecipeKeyOf<Definition extends { readonly name: string }> =
  `postkit${Definition['name']}`;

const componentNamePattern = /^[A-Z][A-Za-z0-9]*$/;
const directivePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const slotPattern = /^[a-z][A-Za-z0-9]*$/;
const propNamePattern = /^[a-z][A-Za-z0-9]*$/;
const runtimes: readonly PostkitComponentRuntime[] = [
  'client',
  'native-controls',
  'resolver',
  'static',
];
const stabilities: readonly PostkitComponentStability[] = [
  'deprecated',
  'experimental',
  'initial',
  'stable',
];

function fail(name: unknown, message: string): never {
  throw new TypeError(
    `Postkit component definition "${String(name)}": ${message}`,
  );
}

function validateExampleValue(
  name: string,
  propName: string,
  prop: PostkitPropDefinitions[string],
  value: unknown,
): void {
  if (prop.kind === 'json') return;
  if (prop.kind === 'enum') {
    if (!prop.values.includes(value as string)) {
      fail(name, `example prop "${propName}" isn't one of its enum values.`);
    }
    return;
  }
  if (typeof value !== prop.kind) {
    fail(name, `example prop "${propName}" must be a ${prop.kind}.`);
  }
}

/**
 * Defines a Postkit component: the framework-free contract for its props,
 * anatomy, directive and catalog metadata. Returns a deeply frozen definition
 * whose type carries every literal (name, prop kinds, slots), so views, theme
 * maps and manifests can be derived from it.
 */
export function definePostkitComponent<
  const Name extends string,
  const Props extends PostkitPropDefinitions,
  const Slots extends readonly string[],
  const Children extends PostkitComponentChildren = 'none',
  const Runtime extends PostkitComponentRuntime = 'static',
>(
  definition: PostkitComponentDefinitionInput<
    Name,
    Props,
    Slots,
    Children,
    Runtime
  >,
): PostkitComponentDefinition<
  Name,
  Props,
  Slots,
  Children,
  Runtime,
  // Inlined rather than aliased, so declaration files carry the resolved union.
  {
    [Key in keyof Props]: Props[Key] extends { readonly themeVariant: true }
      ? Key
      : never;
  }[keyof Props] &
    string
> {
  const { name } = definition;
  if (typeof name !== 'string' || !componentNamePattern.test(name)) {
    fail(name, 'the name must be PascalCase.');
  }
  if (
    typeof definition.directive !== 'string' ||
    !directivePattern.test(definition.directive)
  ) {
    fail(name, 'the directive must be kebab-case, such as postkit-callout.');
  }
  if (!Object.hasOwn(postkitComponentCategories, definition.category)) {
    fail(name, `unknown category "${String(definition.category)}".`);
  }
  if (
    typeof definition.description !== 'string' ||
    definition.description.trim() === ''
  ) {
    fail(name, 'a description is required.');
  }

  const children = definition.children ?? 'none';
  if (children !== 'none' && children !== 'mdx') {
    fail(name, 'children must be "mdx" or "none".');
  }
  const runtime = definition.runtime ?? 'static';
  if (!runtimes.includes(runtime)) {
    fail(name, `unknown runtime "${String(runtime)}".`);
  }
  const stability = definition.stability ?? 'initial';
  if (!stabilities.includes(stability)) {
    fail(name, `unknown stability "${String(stability)}".`);
  }

  const props = definition.props;
  if (!props || typeof props !== 'object') fail(name, 'props are required.');
  for (const [propName, prop] of Object.entries(props)) {
    if (!propNamePattern.test(propName)) {
      fail(name, `prop "${propName}" must be camelCase.`);
    }
    if (!prop || typeof prop !== 'object' || !Object.isFrozen(prop)) {
      fail(name, `prop "${propName}" must be built with the prop builders.`);
    }
  }

  const slots = definition.slots;
  if (!Array.isArray(slots) || !slots.includes('root')) {
    fail(name, 'the slots must include "root".');
  }
  if (new Set(slots).size !== slots.length) {
    fail(name, 'slot names must be unique.');
  }
  for (const slot of slots) {
    if (typeof slot !== 'string' || !slotPattern.test(slot)) {
      fail(name, `slot "${String(slot)}" must be camelCase.`);
    }
  }

  const keywords = definition.keywords ?? [];
  if (keywords.some((keyword) => typeof keyword !== 'string' || !keyword)) {
    fail(name, 'keywords must be non-empty strings.');
  }

  const example = definition.example;
  if (example) {
    for (const [propName, value] of Object.entries(example.props ?? {})) {
      const prop = props[propName];
      if (!prop) fail(name, `example prop "${propName}" isn't declared.`);
      validateExampleValue(name, propName, prop, value);
    }
    if (example.children !== undefined && children !== 'mdx') {
      fail(name, 'only a component with children: "mdx" has example children.');
    }
  }

  const email = definition.email;
  if (
    email !== undefined &&
    (typeof email !== 'object' ||
      email === null ||
      !postkitEmailFallbacks.includes(email.fallback))
  ) {
    fail(name, 'email must be { fallback: "link" | "omit" | "text" }.');
  }

  const result: Record<string, unknown> = {
    name,
    directive: definition.directive,
    category: definition.category,
    description: definition.description,
    children,
    runtime,
    stability,
    props: { ...props },
    slots: [...slots],
    themeVariants: Object.entries(props)
      .filter(([, prop]) => prop.themeVariant)
      .map(([propName]) => propName),
    keywords: [...keywords],
  };
  if (example) result['example'] = structuredClone(example);
  if (email) result['email'] = { fallback: email.fallback };

  return deepFreeze(result) as never;
}

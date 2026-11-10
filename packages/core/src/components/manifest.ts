import {
  postkitComponentCategories,
  type AnyPostkitComponentDefinition,
  type PostkitComponentCategoryId,
  type PostkitComponentRuntime,
  type PostkitComponentStability,
} from './definition.js';
import type { PostkitEmailSupport } from './email.js';
import { deepFreeze, type PostkitPropDefinition } from './props.js';

/*
 * The component manifest, `postkit.component-catalog` (03 §3.2). Version 2 is
 * generated here, so `createPostkit().manifest()` and the repo's
 * `component-manifest.json` share one generator. Version 1 (0.2) stays
 * readable through `readPostkitComponentManifest`.
 */

export const POSTKIT_COMPONENT_MANIFEST_ID = 'postkit.component-catalog';
/** The manifest version this package generates. */
export const POSTKIT_COMPONENT_MANIFEST_VERSION = 2 as const;
/** The declaration contract version the manifest's entries follow. */
export const POSTKIT_MANIFEST_DECLARATION_VERSION = 7 as const;

/** Kit ids and the catalog category each one ships (03 §3.1, D2). */
export const postkitKitCategories = Object.freeze({
  article: 'article-structure',
  technical: 'technical-content',
  media: 'media',
  discovery: 'discovery',
  engagement: 'engagement',
  publishing: 'publishing',
} as const satisfies Record<string, PostkitComponentCategoryId>);

/** A built-in kit id: `article`, `technical`, `media`, … */
export type PostkitKitId = keyof typeof postkitKitCategories;

/** The built-in kit that ships a category's components. */
export function postkitKitIdForCategory(
  category: PostkitComponentCategoryId,
): PostkitKitId {
  const entry = Object.entries(postkitKitCategories).find(
    ([, value]) => value === category,
  );
  if (!entry) throw new TypeError(`Unknown Postkit category "${category}".`);
  return entry[0] as PostkitKitId;
}

/** A catalog category's display label, such as `Article structure`. */
export type PostkitComponentCategoryLabel =
  (typeof postkitComponentCategories)[PostkitComponentCategoryId];

/** The Remark plugins a directive needs. */
export type PostkitManifestRemarkPluginId =
  'directives' | 'frontmatter' | 'gfm' | 'postkit';

// ---------------------------------------------------------------------------
// Version 1 (0.2)
// ---------------------------------------------------------------------------

export interface PostkitManifestPropV1 {
  readonly kind: 'boolean' | 'enum' | 'json' | 'number' | 'string';
  readonly values?: readonly string[];
  readonly required?: boolean;
  readonly description: string;
}

export interface PostkitManifestExample {
  readonly props: Readonly<Record<string, unknown>>;
  readonly jsx: string;
  readonly directive: string;
}

export interface PostkitManifestPreview {
  readonly kind: 'live';
  readonly label: string;
}

export interface PostkitComponentSupportV1 {
  readonly react: 'supported';
  readonly astro: 'hydrated' | 'static';
  readonly email: 'not-defined';
}

export interface PostkitComponentManifestEntryV1 {
  readonly name: string;
  readonly directive: string;
  readonly description: string;
  readonly childMode: 'mdx' | 'none';
  readonly directiveRemarkPlugins: readonly PostkitManifestRemarkPluginId[];
  readonly props: Readonly<Record<string, PostkitManifestPropV1>>;
  readonly category: string;
  readonly keywords: readonly string[];
  readonly example: PostkitManifestExample;
  readonly preview: PostkitManifestPreview;
  readonly runtime: PostkitComponentRuntime;
  readonly stability: string;
  readonly support: PostkitComponentSupportV1;
}

/** A 0.2 `component-manifest.json`. */
export interface PostkitComponentManifestV1 {
  readonly id: typeof POSTKIT_COMPONENT_MANIFEST_ID;
  readonly version: 1;
  readonly declarationVersion: number;
  readonly components: Readonly<
    Record<string, PostkitComponentManifestEntryV1>
  >;
}

// ---------------------------------------------------------------------------
// Version 2 (0.3)
// ---------------------------------------------------------------------------

/** A v2 prop: v1 plus `default` and `themeVariant`. */
export interface PostkitManifestProp extends PostkitManifestPropV1 {
  /** The value a renderer uses when the author doesn't set one. */
  readonly default?: unknown;
  /** Whether the prop is also a recipe variant in themed renderers. */
  readonly themeVariant: boolean;
  /** Other names authors may use for the prop (`type` for Callout's `tone`). */
  readonly aliases?: readonly string[];
  /** Leaving the prop out is a validation warning; see `PostkitPropRecommendation`. */
  readonly recommended?: {
    readonly reason: string;
    readonly unless?: readonly string[];
  };
}

/** Whether a renderer package exports a view for the component. */
export type PostkitRendererSupport = 'not-supported' | 'supported';

/**
 * Computed renderer support: a renderer supports a component when its
 * package exports a view for the definition.
 */
export interface PostkitComponentSupport {
  /** v1's field: some React renderer (headless or Chakra) has a view. */
  readonly react: PostkitRendererSupport;
  /**
   * `@postkit/react`. `chakra-only` means only `@postkit/chakra` renders it
   * so far (an interactive component waiting for its behaviour, 03 D11).
   * Absent when the manifest's producer doesn't know the headless views.
   */
  readonly headless?: PostkitRendererSupport | 'chakra-only';
  /**
   * `@postkit/chakra`. Absent when the manifest's producer doesn't know the
   * Chakra views, such as a headless-only site's `manifest()`.
   */
  readonly chakra?: PostkitRendererSupport;
  /** Astro hydrates components with client behaviour or a resolver. */
  readonly astro: 'hydrated' | 'static';
  /**
   * `@postkit/email` (03 §6): `supported` when it exports a view for the
   * definition, else the definition's declared `{ fallback }`, else
   * `not-supported`. Absent when the manifest's producer doesn't know the
   * email views (such as `@postkit/chakra`'s `postkitComponentCatalog`, or a
   * v1 manifest, whose `not-defined` was a placeholder).
   */
  readonly email?: PostkitEmailSupport;
}

/** One component in a v2 manifest. */
export interface PostkitComponentManifestEntry extends Omit<
  PostkitComponentManifestEntryV1,
  'props' | 'stability' | 'support'
> {
  readonly props: Readonly<Record<string, PostkitManifestProp>>;
  /** The anatomy: the named parts every renderer emits. */
  readonly slots: readonly string[];
  /** The props that are theme (recipe) variants. */
  readonly variants: readonly string[];
  /** The kit that enabled the component, or `null` (a site's own). */
  readonly kit: string | null;
  /** The package that defines the component, or `null` when unknown. */
  readonly package: string | null;
  readonly stability: PostkitComponentStability;
  readonly support: PostkitComponentSupport;
}

/** A v2 `component-manifest.json`, or `createPostkit().manifest()`. */
export interface PostkitComponentManifest {
  readonly id: typeof POSTKIT_COMPONENT_MANIFEST_ID;
  readonly version: typeof POSTKIT_COMPONENT_MANIFEST_VERSION;
  readonly declarationVersion: number;
  readonly components: Readonly<Record<string, PostkitComponentManifestEntry>>;
}

/** One component to put in a manifest. */
export interface PostkitComponentManifestInput {
  readonly definition: AnyPostkitComponentDefinition;
  /** The kit that enabled it. Defaults to `null`. */
  readonly kit?: string | null;
  /** The package that defines it. Defaults to `null`. */
  readonly package?: string | null;
}

/** The renderer views a manifest's `support` is computed from. */
export interface PostkitManifestRenderers {
  /** Component names `@postkit/react` exports a headless view for. */
  readonly headless?: Iterable<string>;
  /** Component names `@postkit/chakra` exports a view for. */
  readonly chakra?: Iterable<string>;
  /**
   * Component names `@postkit/email` exports a view for
   * (`Object.keys(postkitEmailViews)`).
   */
  readonly email?: Iterable<string>;
}

export interface CreatePostkitComponentManifestOptions {
  /**
   * The views each renderer package exports, so `support` is computed. A
   * renderer left out has no field in `support`.
   */
  readonly renderers?: PostkitManifestRenderers;
}

const exampleChildren = 'Example content.';
const directiveRemarkPlugins = ['directives', 'postkit'] as const;

function words(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sampleJson(name: string, prop: string): unknown {
  if (prop === 'columns') return ['Starter', 'Pro'];
  if (prop === 'data') return [{ label: 'January', value: 12 }];
  if (prop === 'items') {
    if (name === 'AppearsOn') {
      return [{ name: 'Example publication', href: 'https://example.com' }];
    }
    if (name === 'Comparison') {
      return [{ label: 'Portable content', values: [true, true] }];
    }
    if (name === 'Steps') {
      return [{ title: 'First step', description: 'Start here.' }];
    }
    return [{ title: 'Example item' }];
  }
  if (prop === 'options') return [{ id: 'yes', label: 'Yes' }];
  return {};
}

function sampleString(name: string, prop: string): string {
  switch (prop) {
    case 'alt':
      return 'A descriptive example';
    case 'audience':
      return 'members';
    case 'code':
      return "console.log('Hello, Postkit')";
    case 'command':
      return 'npm install @postkit/chakra';
    case 'diff':
      return '- before\n+ after';
    case 'href':
    case 'url':
      return 'https://example.com/article';
    case 'label':
      return 'Example';
    case 'name':
      return 'Ada Example';
    case 'question':
      return 'What do you think?';
    case 'quote':
      return 'Portable content keeps its meaning.';
    case 'src':
      return name === 'Audio'
        ? '/media/episode.mp3'
        : name === 'Video'
          ? '/media/video.mp4'
          : '/media/example.jpg';
    case 'title':
      return `${words(name).join(' ')} example`;
    case 'value':
      return '42%';
    default:
      return 'Example';
  }
}

function sampleValue(
  name: string,
  prop: string,
  definition: PostkitPropDefinition,
): unknown {
  switch (definition.kind) {
    case 'boolean':
      return true;
    case 'enum':
      return definition.values[0] ?? '';
    case 'json':
      return sampleJson(name, prop);
    case 'number':
      return 1;
    case 'string':
      return sampleString(name, prop);
  }
}

/** A definition's own example, or sample values for its required props. */
function exampleProps(
  definition: AnyPostkitComponentDefinition,
): Record<string, unknown> {
  if (definition.example) return { ...definition.example.props };
  return Object.fromEntries(
    Object.entries(definition.props)
      .filter(([, prop]) => prop.required)
      .map(([name, prop]) => [name, sampleValue(definition.name, name, prop)]),
  );
}

function jsxAttribute(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? key : `${key}={false}`;
  if (typeof value === 'string') return `${key}=${JSON.stringify(value)}`;
  return `${key}={${JSON.stringify(value)}}`;
}

function directiveAttribute(key: string, value: unknown): string {
  return `${key}=${JSON.stringify(
    typeof value === 'string' ? value : JSON.stringify(value),
  )}`;
}

/** The catalog example: props, JSX and directive source. */
export function postkitManifestExample(
  definition: AnyPostkitComponentDefinition,
): PostkitManifestExample {
  const props = exampleProps(definition);
  const jsxProps = Object.entries(props)
    .map(([name, value]) => jsxAttribute(name, value))
    .join(' ');
  const directiveProps = Object.entries(props)
    .map(([name, value]) => directiveAttribute(name, value))
    .join(' ');
  const { name, directive } = definition;
  const children = definition.example?.children ?? exampleChildren;

  return {
    props,
    jsx:
      definition.children === 'mdx'
        ? `<${name}${jsxProps ? ` ${jsxProps}` : ''}>\n  ${children}\n</${name}>`
        : `<${name}${jsxProps ? ` ${jsxProps}` : ''} />`,
    directive:
      definition.children === 'mdx'
        ? `:::${directive}${directiveProps ? `{${directiveProps}}` : ''}\n${children}\n:::`
        : `::${directive}${directiveProps ? `{${directiveProps}}` : ''}`,
  };
}

function manifestProp(prop: PostkitPropDefinition): PostkitManifestProp {
  // Key order is part of the generated JSON: v1's keys, then v2's.
  return {
    kind: prop.kind,
    ...(prop.kind === 'enum' ? { values: [...prop.values] } : {}),
    ...(prop.required ? { required: true } : {}),
    description: prop.description,
    ...(prop.default !== undefined
      ? { default: structuredClone(prop.default) }
      : {}),
    themeVariant: prop.themeVariant,
    ...(prop.aliases ? { aliases: [...prop.aliases] } : {}),
    ...(prop.recommended
      ? { recommended: structuredClone(prop.recommended) }
      : {}),
  };
}

function toSet(names: Iterable<string> | undefined) {
  return names === undefined ? undefined : new Set(names);
}

interface RendererSets {
  readonly headless: ReadonlySet<string> | undefined;
  readonly chakra: ReadonlySet<string> | undefined;
  readonly email: ReadonlySet<string> | undefined;
}

function rendererSets(
  renderers: PostkitManifestRenderers | undefined,
): RendererSets {
  return {
    headless: toSet(renderers?.headless),
    chakra: toSet(renderers?.chakra),
    email: toSet(renderers?.email),
  };
}

function emailSupport(
  definition: AnyPostkitComponentDefinition,
  email: ReadonlySet<string>,
): PostkitEmailSupport {
  if (email.has(definition.name)) return 'supported';
  return definition.email
    ? { fallback: definition.email.fallback }
    : 'not-supported';
}

function computeSupport(
  definition: AnyPostkitComponentDefinition,
  { headless, chakra, email }: RendererSets,
): PostkitComponentSupport {
  const inHeadless = headless?.has(definition.name) ?? false;
  const inChakra = chakra?.has(definition.name) ?? false;
  const support: {
    -readonly [
      Key in keyof PostkitComponentSupport
    ]: PostkitComponentSupport[Key];
  } = {
    react:
      inHeadless || inChakra || (!headless && !chakra)
        ? 'supported'
        : 'not-supported',
    astro:
      definition.runtime === 'client' || definition.runtime === 'resolver'
        ? 'hydrated'
        : 'static',
  };
  if (headless) {
    support.headless = inHeadless
      ? 'supported'
      : inChakra
        ? 'chakra-only'
        : 'not-supported';
  }
  if (chakra) support.chakra = inChakra ? 'supported' : 'not-supported';
  if (email) support.email = emailSupport(definition, email);
  // Fixed key order for the generated JSON.
  return {
    react: support.react,
    ...(support.headless ? { headless: support.headless } : {}),
    ...(support.chakra ? { chakra: support.chakra } : {}),
    astro: support.astro,
    ...(support.email ? { email: support.email } : {}),
  };
}

/** Builds one v2 manifest entry from a definition. */
export function createPostkitComponentManifestEntry(
  input: PostkitComponentManifestInput,
  options: CreatePostkitComponentManifestOptions = {},
): PostkitComponentManifestEntry {
  return createEntry(input, rendererSets(options.renderers));
}

function createEntry(
  {
    definition,
    kit = null,
    package: packageName = null,
  }: PostkitComponentManifestInput,
  renderers: RendererSets,
): PostkitComponentManifestEntry {
  const category = postkitComponentCategories[definition.category];
  return deepFreeze({
    name: definition.name,
    directive: definition.directive,
    description: definition.description,
    childMode: definition.children,
    directiveRemarkPlugins: [...directiveRemarkPlugins],
    props: Object.fromEntries(
      Object.entries(definition.props).map(([name, prop]) => [
        name,
        manifestProp(prop),
      ]),
    ),
    slots: [...definition.slots],
    variants: [...definition.themeVariants],
    category,
    kit,
    package: packageName,
    keywords: [
      ...new Set([
        ...words(definition.name),
        ...words(category),
        ...Object.keys(definition.props).flatMap(words),
        ...definition.keywords,
      ]),
    ],
    example: postkitManifestExample(definition),
    preview: {
      kind: 'live' as const,
      label: `${definition.name} component preview`,
    },
    runtime: definition.runtime,
    stability: definition.stability,
    support: computeSupport(definition, renderers),
  });
}

/**
 * Generates a v2 component manifest (03 §3.2) for exactly the given
 * components, keyed by name in the order given. A name may appear once.
 */
export function createPostkitComponentManifest(
  components: Iterable<PostkitComponentManifestInput>,
  options: CreatePostkitComponentManifestOptions = {},
): PostkitComponentManifest {
  const renderers = rendererSets(options.renderers);
  const entries: Record<string, PostkitComponentManifestEntry> = {};
  for (const input of components) {
    const { name } = input.definition;
    if (Object.hasOwn(entries, name)) {
      throw new TypeError(`The Postkit manifest lists "${name}" twice.`);
    }
    entries[name] = createEntry(input, renderers);
  }
  return Object.freeze({
    id: POSTKIT_COMPONENT_MANIFEST_ID,
    version: POSTKIT_COMPONENT_MANIFEST_VERSION,
    declarationVersion: POSTKIT_MANIFEST_DECLARATION_VERSION,
    components: Object.freeze(entries),
  });
}

// ---------------------------------------------------------------------------
// Reading v1 and v2
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isManifestOfVersion(value: unknown, version: 1 | 2): boolean {
  return (
    isRecord(value) &&
    value['id'] === POSTKIT_COMPONENT_MANIFEST_ID &&
    value['version'] === version &&
    isRecord(value['components'])
  );
}

/** Whether `value` is a v1 (0.2) component manifest. */
export function isPostkitComponentManifestV1(
  value: unknown,
): value is PostkitComponentManifestV1 {
  return isManifestOfVersion(value, 1);
}

/** Whether `value` is a v2 component manifest. */
export function isPostkitComponentManifestV2(
  value: unknown,
): value is PostkitComponentManifest {
  return isManifestOfVersion(value, 2);
}

const categoryIdsByLabel = new Map<string, PostkitComponentCategoryId>(
  Object.entries(postkitComponentCategories).map(([id, label]) => [
    label,
    id as PostkitComponentCategoryId,
  ]),
);

const stabilities = new Set<string>([
  'deprecated',
  'experimental',
  'initial',
  'stable',
]);

function upgradeEntry(
  entry: PostkitComponentManifestEntryV1,
): PostkitComponentManifestEntry {
  const categoryId = categoryIdsByLabel.get(entry.category);
  const { props, stability, support, ...rest } = entry;
  return {
    ...rest,
    props: Object.fromEntries(
      Object.entries(props).map(([name, prop]) => [
        name,
        { ...prop, themeVariant: false },
      ]),
    ),
    // v1 doesn't record the anatomy or the theme variants.
    slots: [],
    variants: [],
    kit: categoryId ? postkitKitIdForCategory(categoryId) : null,
    package: null,
    stability: (stabilities.has(stability)
      ? stability
      : 'initial') as PostkitComponentStability,
    // v1's `email: 'not-defined'` was a placeholder, not support data.
    support: { react: support.react, astro: support.astro },
  };
}

/**
 * Upgrades a v1 manifest to v2. Fields v1 never recorded get neutral values:
 * `slots` and `variants` are empty, every prop's `themeVariant` is `false`
 * and no prop has a `default`, `package` is `null`, the kit follows the
 * category, and `support` keeps v1's `react` and `astro` (v1's
 * `email: 'not-defined'` was a placeholder, so `email` is left out).
 */
export function upgradePostkitComponentManifest(
  manifest: PostkitComponentManifestV1,
): PostkitComponentManifest {
  return deepFreeze({
    id: POSTKIT_COMPONENT_MANIFEST_ID,
    version: POSTKIT_COMPONENT_MANIFEST_VERSION,
    declarationVersion: manifest.declarationVersion,
    components: Object.fromEntries(
      Object.entries(manifest.components).map(([name, entry]) => [
        name,
        upgradeEntry(entry),
      ]),
    ),
  });
}

/**
 * Reads a component manifest of either version, such as a parsed
 * `component-manifest.json`, and returns it as v2. Throws a `TypeError` for
 * anything else. Editors such as Prismark read manifests through this.
 */
export function readPostkitComponentManifest(
  value: unknown,
): PostkitComponentManifest {
  if (isPostkitComponentManifestV2(value)) return value;
  if (isPostkitComponentManifestV1(value)) {
    return upgradePostkitComponentManifest(value);
  }
  const version = isRecord(value) ? value['version'] : undefined;
  throw new TypeError(
    isRecord(value) && value['id'] === POSTKIT_COMPONENT_MANIFEST_ID
      ? `Unsupported Postkit component manifest version ${String(version)}; this reader supports 1 and 2.`
      : 'Not a Postkit component manifest (id "postkit.component-catalog").',
  );
}

/**
 * Merges manifests (each a v1 or v2) into one v2 manifest, so a host can
 * combine the manifests of exactly the packages it enabled. A later manifest
 * wins for a repeated component name.
 */
export function mergePostkitComponentManifests(
  ...manifests: readonly unknown[]
): PostkitComponentManifest {
  const components: Record<string, PostkitComponentManifestEntry> = {};
  for (const manifest of manifests) {
    Object.assign(
      components,
      readPostkitComponentManifest(manifest).components,
    );
  }
  return Object.freeze({
    id: POSTKIT_COMPONENT_MANIFEST_ID,
    version: POSTKIT_COMPONENT_MANIFEST_VERSION,
    declarationVersion: POSTKIT_MANIFEST_DECLARATION_VERSION,
    components: Object.freeze(components),
  });
}

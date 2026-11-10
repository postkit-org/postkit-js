import {
  postkitBuiltInDefinitions,
  postkitComponentCategories,
  type AnyPostkitComponentDefinition,
  type PostkitComponentCategoryId,
  type PostkitComponentRuntime as CorePostkitComponentRuntime,
  type PostkitPropDefinition,
} from '@postkit/core/components';
import {
  POSTKIT_DECLARATION_VERSION,
  postkitDeclarationFromDefinition,
  type PostkitComponentDeclaration,
  type PostkitComponentName,
} from './declarations.js';

/*
 * The v1 component catalog (`component-manifest.json`), built from the
 * definitions in `@postkit/core/components`. Its output is byte-identical to
 * 0.2; manifest v2 (03 §3.2) replaces it.
 */

export const POSTKIT_COMPONENT_CATALOG_VERSION = 1 as const;

export type PostkitComponentCategory =
  (typeof postkitComponentCategories)[PostkitComponentCategoryId];

export type PostkitComponentRuntime = CorePostkitComponentRuntime;

export interface PostkitComponentExample {
  readonly props: Readonly<Record<string, unknown>>;
  readonly jsx: string;
  readonly directive: string;
}

export interface PostkitComponentPreview {
  readonly kind: 'live';
  readonly label: string;
}

export interface PostkitComponentSupport {
  readonly react: 'supported';
  readonly astro: 'hydrated' | 'static';
  readonly email: 'not-defined';
}

export interface PostkitComponentCatalogEntry extends PostkitComponentDeclaration {
  readonly category: PostkitComponentCategory;
  readonly keywords: readonly string[];
  readonly example: PostkitComponentExample;
  readonly preview: PostkitComponentPreview;
  readonly runtime: PostkitComponentRuntime;
  readonly stability: 'initial';
  readonly support: PostkitComponentSupport;
}

export interface PostkitComponentCatalog {
  readonly id: 'postkit.component-catalog';
  readonly version: typeof POSTKIT_COMPONENT_CATALOG_VERSION;
  readonly declarationVersion: number;
  readonly components: Readonly<
    Record<PostkitComponentName, PostkitComponentCatalogEntry>
  >;
}

const exampleChildren = 'Example content.';

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

function createExample(
  definition: AnyPostkitComponentDefinition,
): PostkitComponentExample {
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
    props: Object.freeze(props),
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

function createCatalogEntry(
  definition: AnyPostkitComponentDefinition,
): PostkitComponentCatalogEntry {
  const declaration = postkitDeclarationFromDefinition(definition);
  const category = postkitComponentCategories[definition.category];

  return Object.freeze({
    ...declaration,
    category,
    keywords: Object.freeze([
      ...new Set([
        ...words(definition.name),
        ...words(category),
        ...Object.keys(definition.props).flatMap(words),
        ...definition.keywords,
      ]),
    ]),
    example: Object.freeze(createExample(definition)),
    preview: Object.freeze({
      kind: 'live' as const,
      label: `${definition.name} component preview`,
    }),
    runtime: definition.runtime,
    // v1 has one stability; manifest v2 publishes the definition's own.
    stability: definition.stability as 'initial',
    support: Object.freeze({
      react: 'supported' as const,
      // Astro hydrates every component with client behaviour or a resolver.
      astro:
        definition.runtime === 'client' || definition.runtime === 'resolver'
          ? ('hydrated' as const)
          : ('static' as const),
      email: 'not-defined' as const,
    }),
  });
}

/** Builds a v1 catalog from definitions, keyed and ordered as given. */
export function createPostkitComponentCatalog(
  definitions: Readonly<Record<string, AnyPostkitComponentDefinition>>,
): PostkitComponentCatalog & {
  readonly declarationVersion: typeof POSTKIT_DECLARATION_VERSION;
} {
  return Object.freeze({
    id: 'postkit.component-catalog',
    version: POSTKIT_COMPONENT_CATALOG_VERSION,
    declarationVersion: POSTKIT_DECLARATION_VERSION,
    components: Object.freeze(
      Object.fromEntries(
        Object.entries(definitions).map(([name, definition]) => [
          name,
          createCatalogEntry(definition),
        ]),
      ) as Record<PostkitComponentName, PostkitComponentCatalogEntry>,
    ),
  });
}

export const postkitComponentCatalog: Readonly<{
  id: 'postkit.component-catalog';
  version: typeof POSTKIT_COMPONENT_CATALOG_VERSION;
  declarationVersion: typeof POSTKIT_DECLARATION_VERSION;
  components: Readonly<
    Record<PostkitComponentName, PostkitComponentCatalogEntry>
  >;
}> = createPostkitComponentCatalog(postkitBuiltInDefinitions);

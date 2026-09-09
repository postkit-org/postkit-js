import {
  postkitDeclarationManifest,
  type PostkitComponentDeclaration,
  type PostkitComponentName,
  type PostkitPropDeclaration,
} from './declarations.js';

export const POSTKIT_COMPONENT_CATALOG_VERSION = 1 as const;

export type PostkitComponentCategory =
  | 'Article structure'
  | 'Discovery'
  | 'Engagement'
  | 'Media'
  | 'Publishing'
  | 'Technical content';

export type PostkitComponentRuntime =
  'client' | 'native-controls' | 'resolver' | 'static';

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

const categories = {
  'Article structure': [
    'Aside',
    'AudienceBoundary',
    'Callout',
    'CardGrid',
    'Disclosure',
    'KeyTakeaway',
    'PullQuote',
    'Steps',
    'Tabs',
  ],
  'Technical content': [
    'Chart',
    'CodeBlock',
    'CodeGroup',
    'Comparison',
    'Diff',
    'FileCard',
    'FileTree',
    'Stat',
    'Terminal',
  ],
  Media: ['Audio', 'Carousel', 'Figure', 'Gallery', 'Video'],
  Discovery: [
    'AppearsOn',
    'AuthorCard',
    'LinkPreview',
    'RelatedContent',
    'SeriesNavigation',
    'SocialPost',
  ],
  Engagement: ['CallToAction', 'NewsletterSignup', 'Poll', 'ShareActions'],
  Publishing: ['ProductCard', 'SponsorBlock'],
} as const satisfies Readonly<
  Record<PostkitComponentCategory, readonly PostkitComponentName[]>
>;

const categoryByName = new Map<PostkitComponentName, PostkitComponentCategory>(
  Object.entries(categories).flatMap(([category, names]) =>
    names.map((name) => [name, category as PostkitComponentCategory] as const),
  ),
);

const clientComponents = new Set<PostkitComponentName>([
  'Carousel',
  'CodeBlock',
  'CodeGroup',
  'NewsletterSignup',
  'Poll',
  'ShareActions',
  'Tabs',
]);
const nativeControlComponents = new Set<PostkitComponentName>([
  'Audio',
  'Disclosure',
  'Video',
]);
const resolverComponents = new Set<PostkitComponentName>([
  'LinkPreview',
  'SocialPost',
]);
const astroHydratedComponents = new Set<PostkitComponentName>([
  'Carousel',
  'CodeBlock',
  'CodeGroup',
  'LinkPreview',
  'NewsletterSignup',
  'Poll',
  'ShareActions',
  'SocialPost',
  'Tabs',
]);

function words(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sampleJson(name: PostkitComponentName, prop: string): unknown {
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

function sampleString(name: PostkitComponentName, prop: string): string {
  switch (prop) {
    case 'alt':
      return 'A descriptive example';
    case 'audience':
      return 'members';
    case 'code':
      return "console.log('Hello, PostKit')";
    case 'command':
      return 'npm install @postkit/react';
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
  name: PostkitComponentName,
  prop: string,
  declaration: PostkitPropDeclaration,
): unknown {
  switch (declaration.kind) {
    case 'boolean':
      return true;
    case 'enum':
      return declaration.values?.[0] ?? '';
    case 'json':
      return sampleJson(name, prop);
    case 'number':
      return 1;
    case 'string':
      return sampleString(name, prop);
  }
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
  declaration: PostkitComponentDeclaration,
): PostkitComponentExample {
  const props = Object.fromEntries(
    Object.entries(declaration.props)
      .filter(([, prop]) => prop.required)
      .map(([name, prop]) => [name, sampleValue(declaration.name, name, prop)]),
  );
  const jsxProps = Object.entries(props)
    .map(([name, value]) => jsxAttribute(name, value))
    .join(' ');
  const directiveProps = Object.entries(props)
    .map(([name, value]) => directiveAttribute(name, value))
    .join(' ');
  const children =
    declaration.childMode === 'mdx' ? '\n  Example content.\n' : '';

  return {
    props: Object.freeze(props),
    jsx:
      declaration.childMode === 'mdx'
        ? `<${declaration.name}${jsxProps ? ` ${jsxProps}` : ''}>${children}</${declaration.name}>`
        : `<${declaration.name}${jsxProps ? ` ${jsxProps}` : ''} />`,
    directive:
      declaration.childMode === 'mdx'
        ? `:::${declaration.directive}${directiveProps ? `{${directiveProps}}` : ''}\nExample content.\n:::`
        : `::${declaration.directive}${directiveProps ? `{${directiveProps}}` : ''}`,
  };
}

function runtimeFor(name: PostkitComponentName): PostkitComponentRuntime {
  if (resolverComponents.has(name)) return 'resolver';
  if (nativeControlComponents.has(name)) return 'native-controls';
  if (clientComponents.has(name)) return 'client';
  return 'static';
}

function createCatalogEntry(
  declaration: PostkitComponentDeclaration,
): PostkitComponentCatalogEntry {
  const category = categoryByName.get(declaration.name);
  if (!category) {
    throw new TypeError(
      `PostKit component "${declaration.name}" has no catalog category.`,
    );
  }

  return Object.freeze({
    ...declaration,
    category,
    keywords: Object.freeze([
      ...new Set([
        ...words(declaration.name),
        ...words(category),
        ...Object.keys(declaration.props).flatMap(words),
      ]),
    ]),
    example: Object.freeze(createExample(declaration)),
    preview: Object.freeze({
      kind: 'live' as const,
      label: `${declaration.name} component preview`,
    }),
    runtime: runtimeFor(declaration.name),
    stability: 'initial' as const,
    support: Object.freeze({
      react: 'supported' as const,
      astro: astroHydratedComponents.has(declaration.name)
        ? ('hydrated' as const)
        : ('static' as const),
      email: 'not-defined' as const,
    }),
  });
}

export const postkitComponentCatalog = Object.freeze({
  id: 'postkit.component-catalog',
  version: POSTKIT_COMPONENT_CATALOG_VERSION,
  declarationVersion: postkitDeclarationManifest.version,
  components: Object.freeze(
    Object.fromEntries(
      Object.entries(postkitDeclarationManifest.components).map(
        ([name, declaration]) => [name, createCatalogEntry(declaration)],
      ),
    ) as Record<PostkitComponentName, PostkitComponentCatalogEntry>,
  ),
} satisfies PostkitComponentCatalog);

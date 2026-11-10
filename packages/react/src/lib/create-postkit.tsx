import {
  createPostkitComponentManifest,
  postkitBuiltInDefinitions,
  type AnyPostkitComponentDefinition,
  type PostkitAuthoredPropsOf,
  type PostkitBuiltInComponentName,
  type PostkitComponentManifest,
  type PostkitComponentManifestInput,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { createElement, type ComponentType, type ReactNode } from 'react';
import type { PluggableList } from 'unified';

import { validatePostkitProps } from './anatomy.js';
import { chakraOnly } from './chakra-only.js';
import {
  PostkitConfigProvider,
  type PostkitAnyComponent,
  type PostkitComponentConfig,
  type PostkitConfig,
} from './config.js';
import {
  PostkitFiguresProvider,
  type PostkitFiguresProviderProps,
} from './figures.js';
import { postkitHeadlessViews } from './headless-views.js';
import {
  createPostkitLink,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
} from './link.js';
import {
  createPostkitRemarkPlugins,
  type PostkitRemarkPresetOptions,
} from './markdown-preset.js';
import type {
  PostkitUnavailableComponent,
  RemarkPostkitOptions,
} from './remark-postkit.js';
import type { PostkitKit } from '../kits/kit.js';

// The rest of the `createPostkit` surface, re-exported from the package root
// through this module.
export * from './config.js';
export * from './figures.js';
export * from './headless-views.js';
export * from './link.js';
export * from './slot-overrides.js';

/** What `createPostkit` hands a renderer's provider. */
export interface PostkitRendererConfig {
  /** The enabled definitions that render, in order. */
  readonly definitions: readonly AnyPostkitComponentDefinition[];
  /** Validated site defaults (rung 4), keyed by component name. */
  readonly defaults: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
}

/**
 * A renderer: the views one renderer package exports for the definitions,
 * plus its prose components and provider. `@postkit/chakra` exports `chakra`;
 * omitting `renderer` uses {@link postkitHeadlessRenderer}.
 */
export interface PostkitRenderer<ProviderProps extends object = object> {
  /** The renderer id the manifest's `support` uses: `headless`, `chakra`. */
  readonly id: string;
  /** The package that exports the views, for error messages. */
  readonly package: string;
  /** The renderer's views, keyed by component name. */
  readonly views: Readonly<Record<string, PostkitAnyComponent>>;
  /** MDX components for prose (`a`, headings, lists…), given the site link. */
  readonly prose?: (
    link: PostkitLinkComponent,
  ) => Readonly<Record<string, PostkitAnyComponent>>;
  /**
   * Wraps the content in the renderer's context, such as Chakra's system.
   * It receives the host's provider props and `postkit`.
   */
  readonly Provider?: ComponentType<
    ProviderProps & {
      readonly children?: ReactNode;
      readonly postkit: PostkitRendererConfig;
    }
  >;
}

/** The headless renderer: `@postkit/react`'s views and native prose. */
export const postkitHeadlessRenderer: PostkitRenderer = Object.freeze({
  id: 'headless',
  package: '@postkit/react',
  views: postkitHeadlessViews,
  prose: (link: PostkitLinkComponent) => ({ a: link }),
});

/** A site's or a third-party package's component: a definition and a view. */
export interface PostkitComponentEntry<
  Definition extends AnyPostkitComponentDefinition =
    AnyPostkitComponentDefinition,
> {
  readonly definition: Definition;
  /** The view for the site's renderer. */
  readonly view: PostkitAnyComponent;
  /** The package that defines it, for the manifest. Defaults to `null`. */
  readonly package?: string | null;
}

type BuiltInDefinition<Name extends PostkitBuiltInComponentName> =
  (typeof postkitBuiltInDefinitions)[Name];

/**
 * Site-wide defaults (rung 4, D18), keyed by component: an unset prop takes
 * this value, and an author's prop always wins. Built-in components are typed
 * from their definitions.
 */
export type PostkitDefaults = {
  readonly [Name in PostkitBuiltInComponentName]?: Readonly<
    Partial<PostkitAuthoredPropsOf<BuiltInDefinition<Name>>>
  >;
} & Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/** Overrides for one component (rungs 3, 5 and 6). */
export interface PostkitOverride<Slot extends string = string> {
  /**
   * Rung 3: class names per anatomy part, for every instance (Tailwind- and
   * CSS-friendly). An instance's own `classNames` add to them.
   */
  readonly classNames?: Partial<Readonly<Record<Slot, string>>>;
  /**
   * Rung 5: a component per anatomy part. It replaces the part's element and
   * receives the part's props: anatomy attributes, class names, styles and
   * children.
   */
  readonly slots?: Partial<Readonly<Record<Slot, PostkitAnyComponent>>>;
  /**
   * Rung 6: the whole view, usually built with `postkitView(definition, …)`
   * or `postkitChakraView(definition, recipe, …)`. MDX renders it in place
   * of the renderer's view.
   */
  readonly view?: PostkitAnyComponent;
}

/** Overrides keyed by component; built-ins type their slot names. */
export type PostkitOverrides = {
  readonly [Name in PostkitBuiltInComponentName]?: PostkitOverride<
    PostkitSlotOf<BuiltInDefinition<Name>>
  >;
} & Readonly<Record<string, PostkitOverride>>;

/** Remark options for `createPostkit`; the enabled set is filled in. */
export type CreatePostkitRemarkOptions = Omit<
  PostkitRemarkPresetOptions,
  'postkit'
> & {
  readonly postkit?:
    false | Omit<RemarkPostkitOptions, 'definitions' | 'unavailable'>;
};

/** Options for {@link createPostkit} (03 §3.1). */
export interface CreatePostkitOptions<ProviderProps extends object = object> {
  /** The renderer's views. Omit for the headless views of `@postkit/react`. */
  readonly renderer?: PostkitRenderer<ProviderProps>;
  /** The kits to enable, such as `[article, technical, media]`. */
  readonly kits: readonly PostkitKit[];
  /** Component names to leave out of the kits. */
  readonly exclude?: readonly string[];
  /** The site's own and third-party components. */
  readonly components?: readonly PostkitComponentEntry[];
  /** Site-wide prop defaults (rung 4, D18). */
  readonly defaults?: PostkitDefaults;
  /** Slot (rung 5) and view (rung 6) overrides. */
  readonly overrides?: PostkitOverrides;
  /**
   * The link for prose and components: a component (`NextLink`), or options
   * for `createPostkitLink`. The framework adapters set this.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly link?: PostkitLinkComponent | CreatePostkitLinkOptions<any>;
  /** Remark preset options; directives validate against the enabled set. */
  readonly remark?: CreatePostkitRemarkOptions;
}

/**
 * The props of `createPostkit().Provider`: the renderer's, plus children and
 * figure numbering (`figures="numbered"`, `figureLabel`).
 */
export type PostkitProviderPropsOf<ProviderProps extends object> =
  ProviderProps &
    Pick<PostkitFiguresProviderProps, 'figureLabel' | 'figures'> & {
      readonly children?: ReactNode;
    };

/** What {@link createPostkit} returns. */
export interface Postkit<ProviderProps extends object = object> {
  /**
   * The provider for this set: the renderer's context plus the site's
   * defaults and overrides. Render content beneath it.
   */
  readonly Provider: ComponentType<PostkitProviderPropsOf<ProviderProps>>;
  /** Only the enabled components, plus prose (`a` uses the site link). */
  readonly mdxComponents: Readonly<Record<string, PostkitAnyComponent>>;
  /** The Remark preset; directives validate against the enabled set. */
  readonly remarkPlugins: PluggableList;
  /** The enabled definitions that render, in order. */
  readonly definitions: readonly AnyPostkitComponentDefinition[];
  /** The renderer in use. */
  readonly renderer: PostkitRenderer<ProviderProps>;
  /** A v2 manifest (`postkit.component-catalog`) of exactly this set. */
  manifest(): PostkitComponentManifest;
}

interface Entry {
  readonly definition: AnyPostkitComponentDefinition;
  readonly kit: string | null;
  readonly package: string | null;
  readonly view?: PostkitAnyComponent;
}

const builtIns = new Set<AnyPostkitComponentDefinition>(
  Object.values(postkitBuiltInDefinitions),
);
const chakraOnlyNames = new Set<string>(chakraOnly);

function fail(message: string): never {
  throw new TypeError(`createPostkit: ${message}`);
}

function isComponent(value: unknown): value is PostkitAnyComponent {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value)
  );
}

function collectEntries(
  kits: readonly PostkitKit[],
  components: readonly PostkitComponentEntry[],
): Map<string, Entry> {
  const entries = new Map<string, Entry>();
  for (const kit of kits) {
    if (!kit || !Array.isArray(kit.definitions)) {
      fail('every kit must come from @postkit/react/kits or definePostkitKit.');
    }
    for (const definition of kit.definitions) {
      const existing = entries.get(definition.name);
      if (existing && existing.definition !== definition) {
        fail(
          `kit "${kit.id}" defines ${definition.name}, which another kit already defines.`,
        );
      }
      if (!existing) {
        entries.set(definition.name, {
          definition,
          kit: kit.id,
          package: kit.package,
        });
      }
    }
  }
  for (const component of components) {
    const definition = component?.definition;
    if (!definition || typeof definition.name !== 'string') {
      fail('every components entry needs a definition and a view.');
    }
    if (!isComponent(component.view)) {
      fail(`components: ${definition.name} needs a view.`);
    }
    if (entries.has(definition.name)) {
      fail(
        `components: ${definition.name} is already enabled. To replace a view, use overrides.${definition.name}.view.`,
      );
    }
    entries.set(definition.name, {
      definition,
      kit: null,
      package: component.package ?? null,
      view: component.view,
    });
  }
  const directives = new Map<string, string>();
  for (const { definition } of entries.values()) {
    const other = directives.get(definition.directive);
    if (other) {
      fail(
        `${definition.name} and ${other} share the directive "${definition.directive}".`,
      );
    }
    directives.set(definition.directive, definition.name);
  }
  return entries;
}

function unavailableReason(
  name: string,
  renderer: Pick<PostkitRenderer, 'id' | 'package'>,
): string {
  if (renderer.id !== 'chakra' && chakraOnlyNames.has(name)) {
    return `Postkit's ${name} is chakra-only: @postkit/react has no headless view for it yet. Use createPostkit({ renderer: chakra }) from @postkit/chakra, or add "${name}" to exclude.`;
  }
  return `Postkit's ${name} has no view in ${renderer.package}. Pass one with overrides.${name}.view, or add "${name}" to exclude.`;
}

function validateDefaults(
  defaults: PostkitDefaults | undefined,
  definitions: ReadonlyMap<string, AnyPostkitComponentDefinition>,
): Record<string, Readonly<Record<string, unknown>>> {
  const validated: Record<string, Readonly<Record<string, unknown>>> = {};
  for (const [name, values] of Object.entries(defaults ?? {})) {
    if (values === undefined) continue;
    const definition = definitions.get(name);
    if (!definition) fail(`defaults.${name}: ${name} isn't enabled.`);
    if (values === null || typeof values !== 'object') {
      fail(`defaults.${name} must be an object of props.`);
    }
    const present: Record<string, unknown> = {};
    for (const [propName, value] of Object.entries(values)) {
      if (value === undefined) continue;
      if (!Object.hasOwn(definition.props, propName)) {
        fail(`defaults.${name}: ${name} has no "${propName}" prop.`);
      }
      present[propName] = value;
    }
    const checked = {
      name: definition.name,
      props: Object.fromEntries(
        Object.keys(present).map((propName) => [
          propName,
          { ...definition.props[propName], required: false },
        ]),
      ),
    } as unknown as AnyPostkitComponentDefinition;
    const [problem] = validatePostkitProps(checked, present);
    if (problem) fail(`defaults: ${problem}`);
    validated[name] = Object.freeze(present);
  }
  return validated;
}

function validateOverrides(
  overrides: PostkitOverrides | undefined,
  definitions: ReadonlyMap<string, AnyPostkitComponentDefinition>,
): Record<string, PostkitOverride> {
  const validated: Record<string, PostkitOverride> = {};
  for (const [name, override] of Object.entries(overrides ?? {})) {
    if (override === undefined) continue;
    const definition = definitions.get(name);
    if (!definition) fail(`overrides.${name}: ${name} isn't enabled.`);
    if (override.view !== undefined && !isComponent(override.view)) {
      fail(`overrides.${name}.view must be a component.`);
    }
    const classNames: Record<string, string> = {};
    for (const [slot, className] of Object.entries(override.classNames ?? {})) {
      if (className === undefined) continue;
      if (!definition.slots.includes(slot)) {
        fail(
          `overrides.${name}.classNames: ${name} has no "${slot}" part. Its parts are ${definition.slots.join(', ')}.`,
        );
      }
      if (typeof className !== 'string') {
        fail(`overrides.${name}.classNames.${slot} must be a string.`);
      }
      classNames[slot] = className;
    }
    const slots: Record<string, PostkitAnyComponent> = {};
    for (const [slot, component] of Object.entries(override.slots ?? {})) {
      if (component === undefined) continue;
      if (!definition.slots.includes(slot)) {
        fail(
          `overrides.${name}.slots: ${name} has no "${slot}" part. Its parts are ${definition.slots.join(', ')}.`,
        );
      }
      if (!isComponent(component)) {
        fail(`overrides.${name}.slots.${slot} must be a component.`);
      }
      slots[slot] = component;
    }
    validated[name] = Object.freeze({
      ...(Object.keys(classNames).length
        ? { classNames: Object.freeze(classNames) }
        : {}),
      ...(override.view ? { view: override.view } : {}),
      ...(Object.keys(slots).length ? { slots: Object.freeze(slots) } : {}),
    });
  }
  return validated;
}

/**
 * Whether a view was built with `postkitView` or `postkitChakraView` (it
 * carries its definition). A client reference in React Server Components
 * can't be inspected; it's assumed to be one.
 */
function isPostkitViewComponent(view: PostkitAnyComponent): boolean {
  try {
    return 'definition' in view;
  } catch {
    return true;
  }
}

/** Applies site defaults as props, for a view that doesn't read them itself. */
function withPostkitDefaults(
  name: string,
  View: PostkitAnyComponent,
  defaults: Readonly<Record<string, unknown>>,
): PostkitAnyComponent {
  function PostkitDefaults(props: Record<string, unknown>) {
    const merged: Record<string, unknown> = { ...props };
    for (const [propName, value] of Object.entries(defaults)) {
      if (merged[propName] === undefined) merged[propName] = value;
    }
    return createElement(View, merged);
  }
  PostkitDefaults.displayName = `PostkitDefaults(${name})`;
  return PostkitDefaults;
}

function unavailableView(name: string, reason: string): PostkitAnyComponent {
  function PostkitUnavailable(): never {
    throw new Error(reason);
  }
  PostkitUnavailable.displayName = `PostkitUnavailable(${name})`;
  return PostkitUnavailable;
}

/**
 * Configures Postkit for a site from the set it uses (03 §3.1): a renderer,
 * kits, the site's own components, defaults and overrides. It returns the
 * provider, the MDX component map, the Remark plugins and the manifest for
 * exactly that set.
 *
 * ```ts
 * import { createPostkit } from '@postkit/react';
 * import { article, technical, media } from '@postkit/react/kits';
 * import { chakra } from '@postkit/chakra';
 *
 * export const postkit = createPostkit({
 *   renderer: chakra,
 *   kits: [article, technical, media],
 *   exclude: ['Poll'],
 *   components: [{ definition: showcaseDefinition, view: Showcase }],
 *   defaults: { Callout: { variant: 'plain' } },
 *   overrides: { Callout: { slots: { icon: InkMark } } },
 * });
 * ```
 *
 * A component the renderer has no view for (a `chakra-only` component on the
 * headless renderer) stays out of the manifest; using it fails the Markdown
 * build, and rendering it throws, with an error naming the component.
 */
export function createPostkit<ProviderProps extends object = object>(
  options: CreatePostkitOptions<ProviderProps>,
): Postkit<ProviderProps> {
  const renderer = (options.renderer ??
    postkitHeadlessRenderer) as PostkitRenderer<ProviderProps>;
  if (!renderer || typeof renderer.views !== 'object') {
    fail(
      'renderer must be a Postkit renderer, such as chakra from @postkit/chakra.',
    );
  }
  if (!Array.isArray(options.kits)) {
    fail('kits must be an array, such as [article, technical].');
  }

  const entries = collectEntries(options.kits, options.components ?? []);
  for (const name of options.exclude ?? []) {
    if (!entries.delete(name)) {
      fail(`exclude: ${name} isn't in the enabled kits or components.`);
    }
  }

  const enabled = new Map<string, AnyPostkitComponentDefinition>(
    [...entries].map(([name, entry]) => [name, entry.definition]),
  );
  const defaults = validateDefaults(options.defaults, enabled);
  const overrides = validateOverrides(options.overrides, enabled);

  const views: Record<string, PostkitAnyComponent> = {};
  const available: Entry[] = [];
  const unavailable: PostkitUnavailableComponent[] = [];
  for (const [name, entry] of entries) {
    const view =
      overrides[name]?.view ??
      entry.view ??
      (Object.hasOwn(renderer.views, name) ? renderer.views[name] : undefined);
    if (view) {
      // Views built with `postkitView` or `postkitChakraView` read defaults
      // and slot overrides from the provider; any other view gets defaults
      // as props and can't take slot overrides.
      const readsConfig = isPostkitViewComponent(view);
      for (const key of ['slots', 'classNames'] as const) {
        if (!readsConfig && overrides[name]?.[key]) {
          fail(
            `overrides.${name}.${key}: ${name}'s view isn't built with postkitView or postkitChakraView, so it can't take part overrides yet. Override its view instead.`,
          );
        }
      }
      views[name] =
        !readsConfig && defaults[name]
          ? withPostkitDefaults(name, view, defaults[name])
          : view;
      available.push(entry);
    } else {
      const reason = unavailableReason(name, renderer);
      views[name] = unavailableView(name, reason);
      unavailable.push({ definition: entry.definition, reason });
    }
  }

  const definitions = Object.freeze(available.map((entry) => entry.definition));
  const link =
    typeof options.link === 'function' ||
    (typeof options.link === 'object' &&
      options.link !== null &&
      '$$typeof' in options.link)
      ? (options.link as PostkitLinkComponent)
      : createPostkitLink(options.link as CreatePostkitLinkOptions | undefined);
  const prose = renderer.prose ? renderer.prose(link) : { a: link };

  const mdxComponents = Object.freeze({ ...prose, ...views });

  const remark = options.remark ?? {};
  const remarkPlugins = createPostkitRemarkPlugins({
    ...remark,
    postkit:
      remark.postkit === false
        ? false
        : { ...remark.postkit, definitions, unavailable },
  });

  const componentConfig: Record<string, PostkitComponentConfig> = {};
  for (const name of enabled.keys()) {
    const override = overrides[name];
    const slots = override?.slots as
      Readonly<Record<string, PostkitAnyComponent>> | undefined;
    const classNames = override?.classNames as
      Readonly<Record<string, string>> | undefined;
    if (defaults[name] || slots || classNames) {
      componentConfig[name] = Object.freeze({
        ...(classNames ? { classNames } : {}),
        ...(defaults[name] ? { defaults: defaults[name] } : {}),
        ...(slots ? { slots } : {}),
      });
    }
  }
  const config: PostkitConfig = Object.freeze({
    components: Object.freeze(componentConfig),
  });
  const rendererConfig: PostkitRendererConfig = Object.freeze({
    definitions,
    defaults: Object.freeze(defaults),
  });

  const RendererProvider = renderer.Provider;
  function PostkitProvider(props: PostkitProviderPropsOf<ProviderProps>) {
    const { children, figures, figureLabel, ...rendererProps } = props;
    const configured = (
      <PostkitConfigProvider value={config}>{children}</PostkitConfigProvider>
    );
    const content =
      figures === undefined ? (
        configured
      ) : (
        <PostkitFiguresProvider figures={figures} figureLabel={figureLabel}>
          {configured}
        </PostkitFiguresProvider>
      );
    if (!RendererProvider) return content;
    return (
      <RendererProvider
        {...(rendererProps as unknown as ProviderProps)}
        postkit={rendererConfig}
      >
        {content}
      </RendererProvider>
    );
  }
  PostkitProvider.displayName = 'PostkitProvider';

  let manifest: PostkitComponentManifest | undefined;
  const ownViews = available
    .filter((entry) => entry.view || overrides[entry.definition.name]?.view)
    .map((entry) => entry.definition.name);
  const rendererViews = [
    ...Object.keys(renderer.views).filter((name) => enabled.has(name)),
    ...ownViews,
  ];

  return Object.freeze({
    Provider: PostkitProvider,
    mdxComponents,
    remarkPlugins,
    definitions,
    renderer,
    manifest() {
      manifest ??= createPostkitComponentManifest(
        available.map((entry): PostkitComponentManifestInput => ({
          definition: entry.definition,
          kit: entry.kit,
          package:
            entry.package ??
            (builtIns.has(entry.definition) ? '@postkit/core' : null),
        })),
        {
          renderers:
            renderer.id === 'chakra'
              ? {
                  headless: Object.keys(postkitHeadlessViews),
                  chakra: rendererViews,
                }
              : renderer.id === 'headless'
                ? { headless: rendererViews }
                : {},
        },
      );
      return manifest;
    },
  });
}

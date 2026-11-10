import {
  postkitComponentCatalog,
  postkitDefaultTheme,
  postkitRecipeKeys,
  type PostkitComponentCatalogEntry,
  type PostkitComponentCategory,
  type PostkitComponentName,
  type PostkitPropDeclaration,
} from '@postkit/chakra';

export interface ComponentCategoryGroup {
  readonly category: PostkitComponentCategory;
  readonly components: readonly PostkitComponentCatalogEntry[];
}

export const componentEntries = Object.freeze(
  Object.values(postkitComponentCatalog.components),
);

export const componentCategoryGroups = Object.freeze(
  componentEntries.reduce<ComponentCategoryGroup[]>((groups, component) => {
    const existing = groups.find(
      (group) => group.category === component.category,
    );

    if (existing) {
      (existing.components as PostkitComponentCatalogEntry[]).push(component);
      return groups;
    }

    groups.push({
      category: component.category,
      components: [component],
    });
    return groups;
  }, []),
);

export function componentNameToSlug(name: PostkitComponentName): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function getComponentBySlug(
  slug: string,
): PostkitComponentCatalogEntry | undefined {
  return componentEntries.find(
    (component) => componentNameToSlug(component.name) === slug,
  );
}

export function getComponentByName(
  name: string,
): PostkitComponentCatalogEntry | undefined {
  return componentEntries.find((component) => component.name === name);
}

// --- Kits -------------------------------------------------------------------------------

/**
 * Site copy for each kit (the manifest's `category` until manifest v2 adds `kit`): the
 * anchor and the grey half of its heading, from the SiteComponents board. Typed against
 * the category union, so a new category fails the build until it has copy here.
 */
const kitCopy: Readonly<
  Record<
    PostkitComponentCategory,
    { readonly slug: string; readonly tagline: string }
  >
> = {
  'Article structure': {
    slug: 'article',
    tagline: 'Help readers follow, skim and remember.',
  },
  'Technical content': {
    slug: 'technical',
    tagline: 'Docs and tutorials developers can copy from.',
  },
  Media: {
    slug: 'media',
    tagline: 'Images, audio and video every reader can use.',
  },
  Discovery: {
    slug: 'discovery',
    tagline: 'Keep readers around after the last paragraph.',
  },
  Engagement: {
    slug: 'engagement',
    tagline: 'Turn readers into subscribers and replies.',
  },
  Publishing: {
    slug: 'publishing',
    tagline: 'Earn from your writing without losing trust.',
  },
};

/** The boards' kit order. Kits missing from it (none today) follow, in manifest order. */
const kitOrder: readonly PostkitComponentCategory[] = [
  'Article structure',
  'Technical content',
  'Media',
  'Discovery',
  'Engagement',
  'Publishing',
];

export interface ComponentKit {
  /** The kit's name, as the manifest spells it: "Article structure". */
  readonly name: PostkitComponentCategory;
  /** The in-page anchor: `kit-article`. */
  readonly id: string;
  readonly tagline: string;
  /** The kit's components, alphabetically (the manifest's own order within a kit). */
  readonly components: readonly PostkitComponentCatalogEntry[];
}

/** Every kit with its components, in the boards' order. Counts are the arrays' lengths. */
export const componentKits: readonly ComponentKit[] = Object.freeze(
  [...componentCategoryGroups]
    .sort((a, b) => {
      const rank = (category: PostkitComponentCategory) => {
        const index = kitOrder.indexOf(category);
        return index < 0 ? kitOrder.length : index;
      };
      return rank(a.category) - rank(b.category);
    })
    .map((group) => ({
      name: group.category,
      id: `kit-${kitCopy[group.category].slug}`,
      tagline: kitCopy[group.category].tagline,
      components: [...group.components].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    })),
);

/** Every component in catalog order (kit by kit): the order "Next ›" follows. */
export const orderedComponentEntries: readonly PostkitComponentCatalogEntry[] =
  Object.freeze(componentKits.flatMap((kit) => kit.components));

export function getComponentKit(
  component: PostkitComponentCatalogEntry,
): ComponentKit {
  const kit = componentKits.find((entry) => entry.name === component.category);
  if (!kit) throw new TypeError(`No kit for ${component.name}.`);
  return kit;
}

// --- Facts derived from the manifest ---------------------------------------------------------

/** Static components render the same with JavaScript off; every other runtime hydrates. */
export function isInteractive(
  component: PostkitComponentCatalogEntry,
): boolean {
  return component.runtime !== 'static';
}

/**
 * The Markdown directive as an author writes it: `:::postkit-callout` for components that
 * take a body, `::postkit-figure` for those that don't.
 */
export function directiveMarker(
  component: PostkitComponentCatalogEntry,
): string {
  return `${component.childMode === 'mdx' ? ':::' : '::'}${component.directive}`;
}

/** The theme-variant props the preview controls drive, in display order (01 §6.3). */
export const previewControlProps = ['tone', 'variant', 'size'] as const;
export type PreviewControlProp = (typeof previewControlProps)[number];

export interface PreviewControl {
  readonly prop: PreviewControlProp;
  readonly values: readonly string[];
}

/** One control per enum prop among tone, variant and size that the manifest declares. */
export function previewControls(
  component: PostkitComponentCatalogEntry,
): PreviewControl[] {
  return previewControlProps.flatMap((prop) => {
    const declaration = component.props[prop] as
      PostkitPropDeclaration | undefined;
    return declaration?.kind === 'enum' && declaration.values?.length
      ? [{ prop, values: declaration.values }]
      : [];
  });
}

/**
 * The component's named parts. Manifest v1 has no `slots` (v2 adds them, 03 §3.2), so they
 * come from the component's slot recipe in `postkitDefaultTheme`: the same names its
 * views put on `data-part`.
 */
export function componentParts(name: PostkitComponentName): string[] {
  const key =
    postkitRecipeKeys[
      (name.charAt(0).toLowerCase() +
        name.slice(1)) as keyof typeof postkitRecipeKeys
    ];
  const recipe = key
    ? postkitDefaultTheme.theme?.slotRecipes?.[key]
    : undefined;
  return recipe?.slots ? [...recipe.slots] : [];
}

/** A prop's type as the props table prints it: string enums as `"a" | "b"` (01 §6.4). */
export function formatPropType(prop: PostkitPropDeclaration): string {
  if (prop.kind === 'enum' && prop.values?.length) {
    return prop.values.map((value) => `"${value}"`).join(' | ');
  }
  if (prop.kind === 'json') return 'JSON string';
  return prop.kind;
}

// --- Renderer support ------------------------------------------------------------------------

export type RendererStatus =
  'supported' | 'static' | 'hydrated' | 'planned' | 'not-supported';

export interface RendererSupportRow {
  readonly renderer: string;
  readonly packageName: string;
  readonly status: RendererStatus;
}

/**
 * The Renderers table (01 §6.3). 03 step 9's computed support matrix doesn't exist yet, so
 * (06 PK-032):
 * - **Email** is computed from the names `@postkit/email` exports (`emailComponentNames`,
 *   read in `getStaticProps`); the manifest's `email: not-defined` is wrong for all 35.
 * - **Chakra** and **Astro** come from the manifest's `support`.
 * - **Headless** has no manifest field yet and no package exports it (`@postkit/react`
 *   becomes headless in 0.3.0, D11), so it reads "Planned" until either exists.
 * - **Web components** are planned for every component (03 §5.4).
 */
export function rendererSupport(
  component: PostkitComponentCatalogEntry,
  emailComponentNames: readonly string[],
): RendererSupportRow[] {
  // Read as a loose record: manifest v2 may add `headless` (03 §3.2).
  const support: Readonly<Record<string, string | undefined>> = {
    ...component.support,
  };
  const headless = support['headless'];

  return [
    {
      renderer: 'Headless',
      packageName: '@postkit/react',
      status: headless === 'supported' ? 'supported' : 'planned',
    },
    {
      renderer: 'Chakra',
      packageName: '@postkit/chakra',
      status: support['react'] === 'supported' ? 'supported' : 'not-supported',
    },
    {
      renderer: 'Email',
      packageName: '@postkit/email',
      status: emailComponentNames.includes(component.name)
        ? 'supported'
        : 'not-supported',
    },
    {
      renderer: 'Astro',
      packageName: '@postkit/astro',
      status:
        support['astro'] === 'hydrated'
          ? 'hydrated'
          : support['astro'] === 'static'
            ? 'static'
            : 'not-supported',
    },
    {
      renderer: 'Web components',
      packageName: '@postkit/elements',
      status: 'planned',
    },
  ];
}

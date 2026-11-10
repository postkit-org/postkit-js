import {
  POSTKIT_COMPONENT_MANIFEST_VERSION,
  calloutDefinition,
  createPostkitComponentManifest,
  definePostkitComponent,
  figureDefinition,
  isPostkitComponentManifestV1,
  isPostkitComponentManifestV2,
  mergePostkitComponentManifests,
  pollDefinition,
  postkitBuiltInDefinitions,
  postkitKitCategories,
  postkitKitIdForCategory,
  prop,
  readPostkitComponentManifest,
  type PostkitComponentManifestV1,
} from './index.js';

const v1: PostkitComponentManifestV1 = {
  id: 'postkit.component-catalog',
  version: 1,
  declarationVersion: 7,
  components: {
    Callout: {
      name: 'Callout',
      directive: 'postkit-callout',
      description: 'A highlighted note, tip, warning, or caution.',
      childMode: 'mdx',
      directiveRemarkPlugins: ['directives', 'postkit'],
      props: {
        tone: {
          kind: 'enum',
          values: ['note', 'tip'],
          description: 'The semantic emphasis of the aside.',
        },
      },
      category: 'Article structure',
      keywords: ['callout'],
      example: {
        props: {},
        jsx: '<Callout />',
        directive: '::postkit-callout',
      },
      preview: { kind: 'live', label: 'Callout component preview' },
      runtime: 'static',
      stability: 'initial',
      support: { react: 'supported', astro: 'static', email: 'not-defined' },
    },
  },
};

describe('component manifest v2', () => {
  it('adds package, kit, stability, slots, variants and prop defaults', () => {
    const manifest = createPostkitComponentManifest([
      {
        definition: calloutDefinition,
        kit: 'article',
        package: '@postkit/core',
      },
      {
        definition: pollDefinition,
        kit: 'engagement',
        package: '@postkit/core',
      },
    ]);
    expect(manifest.version).toBe(POSTKIT_COMPONENT_MANIFEST_VERSION);
    expect(Object.keys(manifest.components)).toEqual(['Callout', 'Poll']);

    const callout = manifest.components['Callout'];
    expect(callout).toMatchObject({
      name: 'Callout',
      kit: 'article',
      package: '@postkit/core',
      category: 'Article structure',
      stability: calloutDefinition.stability,
      slots: ['root', 'icon', 'content', 'title', 'body'],
      variants: ['size', 'variant', 'tone'],
    });
    expect(callout.props['tone']).toEqual({
      kind: 'enum',
      values: ['note', 'tip', 'important', 'warning', 'caution'],
      description: 'The semantic emphasis of the aside.',
      default: 'note',
      themeVariant: true,
    });
    expect(callout.props['title']).toEqual({
      kind: 'string',
      description: 'An optional heading for the aside.',
      themeVariant: false,
    });
    expect(Object.isFrozen(callout.props)).toBe(true);
  });

  it('publishes the definition stability, not a fixed value', () => {
    const badge = definePostkitComponent({
      name: 'Badge',
      directive: 'postkit-badge',
      category: 'publishing',
      description: 'A small label.',
      stability: 'experimental',
      props: { label: prop.string('The label.', { required: true }) },
      slots: ['root'],
    });
    const { components } = createPostkitComponentManifest([
      { definition: badge },
    ]);
    expect(components['Badge']).toMatchObject({
      stability: 'experimental',
      kit: null,
      package: null,
    });
  });

  it('computes support from the views each renderer exports', () => {
    const manifest = createPostkitComponentManifest(
      [{ definition: calloutDefinition }, { definition: pollDefinition }],
      { renderers: { headless: ['Callout'], chakra: ['Callout', 'Poll'] } },
    );
    expect(manifest.components['Callout'].support).toEqual({
      react: 'supported',
      headless: 'supported',
      chakra: 'supported',
      astro: 'static',
    });
    expect(manifest.components['Poll'].support).toEqual({
      react: 'supported',
      headless: 'chakra-only',
      chakra: 'supported',
      astro: 'hydrated',
    });

    const headlessOnly = createPostkitComponentManifest(
      [{ definition: figureDefinition }],
      { renderers: { headless: ['Figure'] } },
    );
    expect(headlessOnly.components['Figure'].support).toEqual({
      react: 'supported',
      headless: 'supported',
      astro: 'static',
    });
  });

  it('rejects a component listed twice', () => {
    expect(() =>
      createPostkitComponentManifest([
        { definition: calloutDefinition },
        { definition: calloutDefinition },
      ]),
    ).toThrow('lists "Callout" twice');
  });

  it('maps every category to a kit', () => {
    for (const definition of Object.values(postkitBuiltInDefinitions)) {
      const kit = postkitKitIdForCategory(definition.category);
      expect(postkitKitCategories[kit]).toBe(definition.category);
    }
  });
});

describe('reading manifests', () => {
  it('guards each version', () => {
    const v2 = createPostkitComponentManifest([
      { definition: calloutDefinition },
    ]);
    expect(isPostkitComponentManifestV2(v2)).toBe(true);
    expect(isPostkitComponentManifestV1(v2)).toBe(false);
    expect(isPostkitComponentManifestV1(v1)).toBe(true);
    expect(isPostkitComponentManifestV2(v1)).toBe(false);
    expect(isPostkitComponentManifestV2({ id: 'other', version: 2 })).toBe(
      false,
    );
  });

  it('returns a v2 manifest unchanged', () => {
    const v2 = createPostkitComponentManifest([
      { definition: calloutDefinition },
    ]);
    expect(readPostkitComponentManifest(v2)).toBe(v2);
  });

  it('upgrades a v1 manifest to v2', () => {
    const upgraded = readPostkitComponentManifest(
      JSON.parse(JSON.stringify(v1)),
    );
    expect(upgraded.version).toBe(2);
    expect(upgraded.declarationVersion).toBe(7);
    expect(upgraded.components['Callout']).toMatchObject({
      name: 'Callout',
      kit: 'article',
      package: null,
      slots: [],
      variants: [],
      stability: 'initial',
      support: { react: 'supported', astro: 'static' },
    });
    expect(upgraded.components['Callout'].support).not.toHaveProperty('email');
    expect(upgraded.components['Callout'].props['tone']).toEqual({
      kind: 'enum',
      values: ['note', 'tip'],
      description: 'The semantic emphasis of the aside.',
      themeVariant: false,
    });
  });

  it('rejects other documents and versions', () => {
    expect(() => readPostkitComponentManifest({ id: 'x' })).toThrow(
      'Not a Postkit component manifest',
    );
    expect(() =>
      readPostkitComponentManifest({
        id: 'postkit.component-catalog',
        version: 3,
        components: {},
      }),
    ).toThrow('Unsupported Postkit component manifest version 3');
  });

  it('merges manifests of either version', () => {
    const v2 = createPostkitComponentManifest([
      { definition: figureDefinition },
    ]);
    const merged = mergePostkitComponentManifests(v1, v2);
    expect(Object.keys(merged.components)).toEqual(['Callout', 'Figure']);
    expect(merged.version).toBe(2);
  });
});

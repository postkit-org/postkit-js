import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  definePostkitComponent,
  postkitBuiltInDefinitions,
  prop,
} from '@postkit/core/components';
import {
  POSTKIT_COMPONENT_CATALOG_VERSION,
  createPostkitComponentCatalog,
  postkitComponentCatalog,
} from './component-catalog.js';
import { postkitDeclarationManifest } from './declarations.js';

describe('Postkit component catalog', () => {
  it('enriches every portable declaration', () => {
    expect(POSTKIT_COMPONENT_CATALOG_VERSION).toBe(2);
    expect(postkitComponentCatalog.declarationVersion).toBe(
      postkitDeclarationManifest.version,
    );
    expect(Object.keys(postkitComponentCatalog.components)).toEqual(
      Object.keys(postkitDeclarationManifest.components),
    );

    for (const entry of Object.values(postkitComponentCatalog.components)) {
      expect(entry.category).toBeTruthy();
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(entry.example.jsx).toContain(`<${entry.name}`);
      expect(entry.example.directive).toContain(entry.directive);
      expect(entry.preview.kind).toBe('live');
      expect(entry.support.react).toBe('supported');
    }
  });

  it('publishes render and resolver requirements', () => {
    for (const name of ['Tabs', 'CodeBlock', 'CodeGroup', 'Poll'] as const) {
      expect(postkitComponentCatalog.components[name].support.astro).toBe(
        'hydrated',
      );
    }
    expect(postkitComponentCatalog.components.Disclosure.runtime).toBe(
      'native-controls',
    );
    expect(postkitComponentCatalog.components.Figure.runtime).toBe('static');
    expect(postkitComponentCatalog.components.Audio.runtime).toBe(
      'native-controls',
    );
    expect(postkitComponentCatalog.components.Carousel.runtime).toBe('client');
    expect(postkitComponentCatalog.components.LinkPreview.runtime).toBe(
      'resolver',
    );
    expect(postkitComponentCatalog.components.Carousel.support.astro).toBe(
      'hydrated',
    );
    expect(postkitComponentCatalog.components.Video.support.astro).toBe(
      'static',
    );
  });

  it('matches the generated v1 manifest', () => {
    const manifest = readFileSync(
      join(__dirname, '..', '..', 'component-manifest.json'),
      'utf8',
    );
    // The generated file adds `support.email` from @postkit/email's views,
    // which this package doesn't depend on (03 §6).
    const generated = JSON.parse(manifest) as {
      components: Record<string, { support: { email?: unknown } }>;
    };
    for (const entry of Object.values(generated.components)) {
      expect(entry.support.email).toBeDefined();
      delete entry.support.email;
    }
    expect(generated).toEqual(
      JSON.parse(JSON.stringify(postkitComponentCatalog)),
    );
    expect(Object.keys(postkitComponentCatalog.components)).toEqual(
      Object.keys(postkitBuiltInDefinitions),
    );
  });

  it('generates examples for every required prop kind', () => {
    const fixture = definePostkitComponent({
      name: 'Audio',
      directive: 'postkit-audio',
      category: 'media',
      description: 'Catalog fixture.',
      props: {
        enabled: prop.boolean('Boolean fixture.', { required: true }),
        tone: prop.enum(['note'], {
          description: 'Enum fixture.',
          required: true,
        }),
        metadata: prop.json('JSON fixture.', { required: true }),
        count: prop.number('Number fixture.', { required: true }),
        title: prop.string('String fixture.', { required: true }),
        optional: prop.string('Optional fixture.'),
      },
      slots: ['root'],
    });

    const fixtureCatalog = createPostkitComponentCatalog({ Audio: fixture });
    expect(fixtureCatalog.components.Audio.example.props).toEqual({
      enabled: true,
      tone: 'note',
      metadata: {},
      count: 1,
      title: 'audio example',
    });
    expect(fixtureCatalog.components.Audio.example.jsx).toContain('enabled');
    expect(fixtureCatalog.components.Audio.example.jsx).toContain('count={1}');
    expect(fixtureCatalog.components.Audio.category).toBe('Media');
  });

  it("uses a definition's example, keywords and runtime", () => {
    const fixture = definePostkitComponent({
      name: 'Badge',
      directive: 'postkit-badge',
      category: 'publishing',
      description: 'Catalog fixture.',
      children: 'mdx',
      runtime: 'resolver',
      props: {
        label: prop.string('The label.', { required: true }),
        hidden: prop.boolean('Hidden.'),
      },
      slots: ['root'],
      keywords: ['pill'],
      example: { props: { label: 'New', hidden: false }, children: 'Body.' },
    });

    const [entry] = Object.values(
      createPostkitComponentCatalog({ Badge: fixture }).components,
    );
    expect(entry.keywords).toEqual([
      'badge',
      'publishing',
      'label',
      'hidden',
      'pill',
    ]);
    expect(entry.example).toEqual({
      props: { label: 'New', hidden: false },
      jsx: ['<Badge label="New" hidden={false}>', '  Body.', '</Badge>'].join(
        '\n',
      ),
      directive: [
        ':::postkit-badge{label="New" hidden="false"}',
        'Body.',
        ':::',
      ].join('\n'),
    });
    expect(entry.runtime).toBe('resolver');
    expect(entry.support.astro).toBe('hydrated');
    expect(entry.childMode).toBe('mdx');
  });
});

import {
  POSTKIT_COMPONENT_CATALOG_VERSION,
  postkitComponentCatalog,
} from './component-catalog.js';
import { postkitDeclarationManifest } from './declarations.js';
import { vi } from 'vitest';

describe('Postkit component catalog', () => {
  it('enriches every portable declaration', () => {
    expect(POSTKIT_COMPONENT_CATALOG_VERSION).toBe(1);
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

  it('generates examples for every required prop kind', async () => {
    vi.resetModules();
    vi.doMock('./declarations.js', () => ({
      postkitDeclarationManifest: {
        version: 7,
        components: {
          Audio: {
            name: 'Audio',
            directive: 'postkit-audio',
            description: 'Catalog fixture.',
            childMode: 'none',
            directiveRemarkPlugins: ['directives', 'postkit'],
            props: {
              enabled: {
                kind: 'boolean',
                required: true,
                description: 'Boolean fixture.',
              },
              tone: {
                kind: 'enum',
                required: true,
                values: ['note'],
                description: 'Enum fixture.',
              },
              emptyTone: {
                kind: 'enum',
                required: true,
                description: 'Empty enum fixture.',
              },
              metadata: {
                kind: 'json',
                required: true,
                description: 'JSON fixture.',
              },
              count: {
                kind: 'number',
                required: true,
                description: 'Number fixture.',
              },
              title: {
                kind: 'string',
                required: true,
                description: 'String fixture.',
              },
            },
          },
        },
      },
    }));

    const { postkitComponentCatalog: fixtureCatalog } =
      await import('./component-catalog.js');
    expect(fixtureCatalog.components.Audio.example.props).toEqual({
      enabled: true,
      tone: 'note',
      emptyTone: '',
      metadata: {},
      count: 1,
      title: 'audio example',
    });
    expect(fixtureCatalog.components.Audio.example.jsx).toContain('enabled');
    expect(fixtureCatalog.components.Audio.example.jsx).toContain('count={1}');

    vi.doUnmock('./declarations.js');
    vi.resetModules();
  });

  it('rejects declarations without a catalog category', async () => {
    vi.resetModules();
    vi.doMock('./declarations.js', () => ({
      postkitDeclarationManifest: {
        version: 7,
        components: {
          Unknown: {
            name: 'Unknown',
            directive: 'postkit-unknown',
            description: 'Invalid catalog fixture.',
            childMode: 'none',
            directiveRemarkPlugins: [],
            props: {},
          },
        },
      },
    }));

    await expect(import('./component-catalog.js')).rejects.toThrow(
      'PostKit component "Unknown" has no catalog category.',
    );

    vi.doUnmock('./declarations.js');
    vi.resetModules();
  });
});

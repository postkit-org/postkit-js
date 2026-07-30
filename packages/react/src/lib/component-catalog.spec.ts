import {
  POSTKIT_COMPONENT_CATALOG_VERSION,
  postkitComponentCatalog,
} from './component-catalog.js';
import { postkitDeclarationManifest } from './declarations.js';

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
});

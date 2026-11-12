import {
  addViewOverride,
  appendToConfigArray,
  ensureNamedImport,
  PostkitUnsafeSourceError,
  readConfigIdentifier,
  readConfigIdentifiers,
  removeFromConfigArray,
} from './source-edit.js';

const config = `import { createPostkit } from '@postkit/react';
import { article } from '@postkit/react/kits';

// A comment with createPostkit( in it is ignored.
export const postkit = createPostkit({
  kits: [
    article,
  ],
  exclude: ['Poll', "Chart"],
  link: { linkProps: { prefetch: false } },
});
`;

describe('source edits', () => {
  it('appends to a multi-line array, keeping its trailing comma', () => {
    expect(appendToConfigArray(config, 'kits', 'media')).toContain(
      'kits: [\n    article,\n    media,\n  ],',
    );
  });

  it('appends to a one-line array and creates a missing property', () => {
    const source = `const postkit = createPostkit({ kits: [article] });`;
    expect(appendToConfigArray(source, 'kits', 'media')).toBe(
      `const postkit = createPostkit({ kits: [article, media] });`,
    );
    expect(appendToConfigArray(source, 'components', 'entry')).toBe(
      `const postkit = createPostkit({ kits: [article], components: [entry] });`,
    );
  });

  it('adds a property after the last one, multi-line', () => {
    const next = appendToConfigArray(
      config,
      'components',
      '{ definition: a, view: A }',
    );
    expect(next).toContain(
      `  link: { linkProps: { prefetch: false } },\n  components: [{ definition: a, view: A }],\n});`,
    );
  });

  it('removes a string from an array', () => {
    expect(removeFromConfigArray(config, 'exclude', 'Poll')).toContain(
      `exclude: ["Chart"],`,
    );
    expect(removeFromConfigArray(config, 'exclude', 'Chart')).toContain(
      `exclude: ['Poll'],`,
    );
    expect(removeFromConfigArray(config, 'exclude', 'Tabs')).toBeUndefined();
  });

  it('merges a named import and adds a new one after the imports', () => {
    const merged = ensureNamedImport(config, '@postkit/react/kits', 'media');
    expect(merged).toContain(
      `import { article, media } from '@postkit/react/kits';`,
    );
    const added = ensureNamedImport(config, './figure/figure', 'Figure');
    expect(added).toContain(
      `import { article } from '@postkit/react/kits';\nimport { Figure } from './figure/figure';\n`,
    );
    expect(ensureNamedImport(merged, '@postkit/react/kits', 'media')).toBe(
      merged,
    );
  });

  it('refuses to bind a name the file already uses', () => {
    expect(() => ensureNamedImport(config, './x', 'article')).toThrow(
      PostkitUnsafeSourceError,
    );
  });

  it('adds a view override, and refuses an existing one', () => {
    const next = addViewOverride(config, 'Figure', 'Figure');
    expect(next).toContain('  overrides: { Figure: { view: Figure } },\n});');
    expect(() => addViewOverride(next, 'Figure', 'Other')).toThrow(
      /overrides.Figure already exists/,
    );
    expect(addViewOverride(next, 'Callout', 'MyCallout')).toContain(
      'overrides: { Figure: { view: Figure }, Callout: { view: MyCallout } },',
    );
  });

  it('reads identifiers', () => {
    expect(readConfigIdentifiers(config, 'kits')).toEqual(['article']);
    expect(readConfigIdentifier(config, 'renderer')).toBeNull();
    expect(
      readConfigIdentifier(
        `createPostkit({ renderer: chakra, kits: [] })`,
        'renderer',
      ),
    ).toBe('chakra');
  });

  it.each([
    ['a template expression', 'kits', 'createPostkit({ kits: [`${a}`] });'],
    [
      'a regular expression',
      'kits',
      'const r = /x/; createPostkit({ kits: [] });',
    ],
    [
      'two calls',
      'kits',
      'createPostkit({ kits: [] }); createPostkit({ kits: [] });',
    ],
    ['no call', 'kits', 'export const postkit = make({ kits: [] });'],
    ['a non-literal argument', 'kits', 'createPostkit(options);'],
    [
      'a spread that may set the key',
      'components',
      'createPostkit({ ...base, kits: [] });',
    ],
    ['a computed value', 'kits', 'createPostkit({ kits: allKits });'],
    ['shorthand', 'kits', 'createPostkit({ kits });'],
  ])('refuses %s', (_label, key, source) => {
    expect(() => appendToConfigArray(source, key, 'x')).toThrow(
      PostkitUnsafeSourceError,
    );
  });

  it('refuses JSX files', () => {
    expect(() =>
      appendToConfigArray(config, 'kits', 'media', 'postkit.tsx'),
    ).toThrow(/JSX/);
  });
});

import { readFileSync } from 'node:fs';

import { postkitComponentScaffold } from '@postkit/cli';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { componentGenerator } from './generator.js';

const schema = JSON.parse(
  readFileSync(
    new URL('../../../generators/component/schema.json', import.meta.url),
    'utf8',
  ),
);
const collection = JSON.parse(
  readFileSync(new URL('../../../generators.json', import.meta.url), 'utf8'),
);

describe('@postkit/nx:component', () => {
  it('writes the same files as postkit new', () => {
    const tree = createTreeWithEmptyWorkspace();
    componentGenerator(tree, { name: 'device', chakra: true, spec: true });
    const expected = postkitComponentScaffold({
      name: 'device',
      chakra: true,
      spec: true,
    });
    for (const file of expected.files) {
      expect(tree.read(`src/postkit/${file.path}`, 'utf8')).toBe(file.content);
    }
    expect(
      tree
        .listChanges()
        .map((change) => change.path)
        .filter((path) => path.startsWith('src/'))
        .sort(),
    ).toEqual(expected.files.map((file) => `src/postkit/${file.path}`).sort());
  });

  it('honours directory and refuses to overwrite without force', () => {
    const tree = createTreeWithEmptyWorkspace();
    componentGenerator(tree, {
      name: 'CodeSample',
      directory: 'libs/site/components',
    });
    expect(
      tree.read(
        'libs/site/components/code-sample/code-sample.definition.ts',
        'utf8',
      ),
    ).toContain("directive: 'postkit-code-sample'");
    expect(() =>
      componentGenerator(tree, {
        name: 'code-sample',
        directory: 'libs/site/components',
      }),
    ).toThrow(/already exists/);
    expect(() =>
      componentGenerator(tree, {
        name: 'code-sample',
        directory: 'libs/site/components',
        force: true,
      }),
    ).not.toThrow();
  });

  it('writes a built-in across the packages with --layout=postkit', () => {
    const tree = createTreeWithEmptyWorkspace();
    componentGenerator(tree, {
      name: 'device',
      layout: 'postkit',
      chakra: true,
    });
    expect(
      tree.read(
        'packages/core/src/components/device/device.definition.ts',
        'utf8',
      ),
    ).toContain("from '../definition.js'");
    expect(
      tree.read('packages/react/src/components/device/device.tsx', 'utf8'),
    ).toContain("from '../../lib/view.js'");
    expect(
      tree.read('packages/chakra/src/components/device/device.tsx', 'utf8'),
    ).toContain('postkitDeviceRecipe');
  });

  it('declares the generator and its schema', () => {
    expect(collection.generators.component.schema).toBe(
      './generators/component/schema.json',
    );
    expect(schema.properties.name.$default).toEqual({
      $source: 'argv',
      index: 0,
    });
    expect(schema.properties.layout.enum).toEqual(['site', 'postkit']);
  });
});

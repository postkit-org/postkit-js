import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createJiti } from 'jiti';
import type { ComponentType, ReactNode } from 'react';

import { findPostkitConfig } from './config.js';
import { readEjectLock, sha256 } from './eject.js';
import {
  chakraConfig,
  createFixture,
  type Fixture,
} from './fixture.spec-support.js';
import { postkitComponentNames } from './names.js';
import { unifiedDiff } from './unified-diff.js';

let fixture: Fixture;
afterEach(() => fixture?.dispose());

async function load<T>(path: string): Promise<T> {
  const jiti = createJiti(path, {
    jsx: { runtime: 'automatic' },
    moduleCache: false,
    fsCache: false,
  });
  return (await jiti.import(path)) as T;
}

describe('names and diffs', () => {
  it('normalizes component names', () => {
    expect(postkitComponentNames('code-sample')).toEqual({
      pascal: 'CodeSample',
      camel: 'codeSample',
      kebab: 'code-sample',
    });
    expect(postkitComponentNames('CodeSample').kebab).toBe('code-sample');
    expect(() => postkitComponentNames('../x')).toThrow(
      /isn't a component name/,
    );
  });

  it('writes unified diffs', () => {
    const before = 'a\nb\nc\nd\ne\nf\ng\nh\n';
    const after = 'a\nb\nc\nD\ne\nf\ng\nh\n';
    expect(unifiedDiff(before, after, { from: 'a/x', to: 'b/x' })).toBe(
      '--- a/x\n+++ b/x\n@@ -1,7 +1,7 @@\n a\n b\n c\n-d\n+D\n e\n f\n g\n',
    );
    expect(unifiedDiff(before, before, { from: 'a', to: 'b' })).toBe('');
    expect(unifiedDiff('', 'x\n', { from: '/dev/null', to: 'b/x' })).toContain(
      '@@ -0,0 +1,1 @@\n+x',
    );
  });
});

describe('config discovery', () => {
  beforeEach(() => {
    fixture = createFixture({ link: [] });
  });

  it('prefers --config, then postkit.config.*, then the one createPostkit file', () => {
    fixture.write('lib/postkit.ts', chakraConfig);
    expect(findPostkitConfig(fixture.root, fixture.root)).toEqual({
      path: fixture.path('lib/postkit.ts'),
      origin: 'search',
    });
    fixture.write(
      'postkit.config.ts',
      `export { postkit as default } from './lib/postkit';\n`,
    );
    expect(findPostkitConfig(fixture.root, fixture.root)?.origin).toBe(
      'config-file',
    );
    expect(
      findPostkitConfig(fixture.root, fixture.root, 'lib/postkit.ts')?.origin,
    ).toBe('flag');
  });

  it('reports more than one createPostkit file', () => {
    fixture.write('a/postkit.ts', chakraConfig);
    fixture.write('b/postkit.ts', chakraConfig);
    fixture.write('b/postkit.spec.ts', chakraConfig);
    expect(() => findPostkitConfig(fixture.root, fixture.root)).toThrow(
      /More than one file calls createPostkit: a\/postkit.ts, b\/postkit.ts/,
    );
  });
});

describe('postkit add', () => {
  beforeEach(() => {
    fixture = createFixture();
    fixture.write('lib/postkit.ts', chakraConfig);
  });

  it('adds a kit, a component, and takes one out of exclude', async () => {
    expect((await fixture.run('add', 'media')).stdout).toContain(
      'kits += media',
    );
    expect(fixture.read('lib/postkit.ts')).toContain(
      `import { article, technical, media } from '@postkit/react/kits';`,
    );
    expect((await fixture.run('add', 'media')).stdout).toContain(
      'already enabled',
    );

    expect((await fixture.run('add', 'Video')).stdout).toContain(
      'Video is already enabled (the media kit)',
    );
    expect((await fixture.run('add', 'stat')).stdout).toContain(
      'Stat is already enabled (the technical kit)',
    );
    expect((await fixture.run('add', 'author-card')).stdout).toContain(
      'components += AuthorCard',
    );
    const source = fixture.read('lib/postkit.ts');
    expect(source).toContain(
      `import { chakra, AuthorCard } from '@postkit/chakra';`,
    );
    expect(source).toContain(
      `import { authorCardDefinition } from '@postkit/core/components';`,
    );
    expect(source).toContain(
      'components: [{ definition: authorCardDefinition, view: AuthorCard }]',
    );

    // Poll's kit isn't on; adding it also takes it out of exclude.
    await fixture.run('add', 'poll');
    expect(fixture.read('lib/postkit.ts')).toContain('exclude: [],');

    // The edited config still loads and enables what was added.
    const { postkit } = await load<{
      postkit: { definitions: readonly { name: string }[] };
    }>(fixture.path('lib/postkit.ts'));
    const names = postkit.definitions.map((definition) => definition.name);
    expect(names).toEqual(
      expect.arrayContaining(['Video', 'AuthorCard', 'Poll']),
    );
  });

  it('prints the lines instead of editing a file it cannot read safely', async () => {
    const unsafe = `import { createPostkit } from '@postkit/react';
import * as kits from '@postkit/react/kits';
export const postkit = createPostkit({ kits: Object.values(kits) });
`;
    fixture.write('lib/postkit.ts', unsafe);
    const { code, stdout } = await fixture.run('add', 'media');
    expect(code).toBe(0);
    expect(stdout).toContain("lib/postkit.ts wasn't changed");
    expect(stdout).toContain(`import { media } from '@postkit/react/kits';`);
    expect(fixture.read('lib/postkit.ts')).toBe(unsafe);
  });

  it('rejects names that are not kits or components', async () => {
    const { code, stderr } = await fixture.run('add', 'device');
    expect(code).toBe(1);
    expect(stderr).toContain('postkit new device');
  });
});

describe('postkit eject and diff', () => {
  beforeEach(() => {
    fixture = createFixture();
    fixture.write('lib/postkit.ts', chakraConfig);
  });

  it('ejects the Chakra Figure with public imports, a lockfile and an override', async () => {
    const { code, stdout } = await fixture.run(
      'eject',
      'figure',
      '--renderer',
      'chakra',
      '--to',
      'libs/postkit',
    );
    expect(code).toBe(0);
    expect(stdout).toContain('✓ libs/postkit/figure/figure.tsx');
    expect(stdout).toContain('✓ libs/postkit/figure/figure.recipe.ts');
    expect(stdout).toContain(
      'overrides.Figure.view → ../libs/postkit/figure/figure',
    );

    const view = fixture.read('libs/postkit/figure/figure.tsx');
    expect(view).toContain(
      `import { figureDefinition } from '@postkit/core/components';`,
    );
    expect(view).toContain(
      `import { postkitChakraView } from '@postkit/chakra';`,
    );
    expect(view).toContain(`from './figure.recipe';`);
    expect(view).not.toMatch(/from '\.\.\//);
    expect(
      existsSync(fixture.path('libs/postkit/figure/figure.definition.ts')),
    ).toBe(false);

    const lock = readEjectLock(fixture.root);
    const entry = lock.components['Figure'];
    expect(entry).toMatchObject({
      renderer: 'chakra',
      package: '@postkit/chakra',
      path: 'libs/postkit/figure',
    });
    expect(entry.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(entry.hash).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(entry.files['figure.tsx'].sha256).toBe(sha256(view));

    expect(fixture.read('lib/postkit.ts')).toContain(
      `overrides: { Figure: { view: Figure } },`,
    );
    const again = await fixture.run(
      'eject',
      'figure',
      '--renderer',
      'chakra',
      '--to',
      'libs/postkit',
    );
    expect(again.code).toBe(1);
    expect(again.stderr).toContain('already exists');
  });

  it('copies internal helpers a view needs into internal/', async () => {
    await fixture.run(
      'eject',
      'callout',
      '--renderer',
      'chakra',
      '--no-register',
    );
    const view = fixture.read('src/postkit/callout/callout.tsx');
    expect(view).toContain(`from './internal/lib/components/heading-size';`);
    expect(
      existsSync(
        fixture.path(
          'src/postkit/callout/internal/lib/components/heading-size.ts',
        ),
      ),
    ).toBe(true);
    expect(fixture.read('lib/postkit.ts')).toBe(chakraConfig);
  });

  it('takes the renderer from the config, and ejects headless views with their CSS', async () => {
    fixture.write(
      'lib/postkit.ts',
      `import { createPostkit } from '@postkit/react';\nimport { media } from '@postkit/react/kits';\n\nexport const postkit = createPostkit({ kits: [media] });\n`,
    );
    const { stdout } = await fixture.run('eject', 'figure', '--dry-run');
    expect(stdout).toContain('src/postkit/figure/figure.css');
    expect(stdout).toContain(
      '+export const postkit = createPostkit({ kits: [media], overrides: { Figure: { view: Figure } } });',
    );
    expect(existsSync(fixture.path('src/postkit'))).toBe(false);
  });

  it('diffs upstream changes between the ejected and installed versions', async () => {
    const renderer = fixture.fakeRenderer('@postkit/chakra', '0.3.0');
    await fixture.run(
      'eject',
      'figure',
      '--renderer',
      'chakra',
      '--no-register',
    );
    expect((await fixture.run('diff', 'figure')).stdout).toContain(
      'No upstream changes.',
    );

    // Upgrade: upstream changes a line; you edit another.
    const upstream = join(
      renderer,
      'dist/eject/files/components/figure/figure.tsx',
    );
    writeFileSync(
      upstream,
      readFileSync(upstream, 'utf8').replace(
        'decoding="async"',
        'decoding="sync"',
      ),
    );
    const manifestPath = join(renderer, 'dist/eject/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    writeFileSync(
      manifestPath,
      JSON.stringify({ ...manifest, version: '0.3.2' }),
    );
    writeFileSync(
      join(renderer, 'package.json'),
      JSON.stringify({ name: '@postkit/chakra', version: '0.3.2' }),
    );
    const local = fixture.path('src/postkit/figure/figure.recipe.ts');
    writeFileSync(local, `${readFileSync(local, 'utf8')}// mine\n`);

    const diff = await fixture.run('diff', 'figure', '--exit-code');
    expect(diff.code).toBe(1);
    expect(diff.stdout).toContain('@postkit/chakra 0.3.0 → 0.3.2');
    expect(diff.stdout).toContain('--- a/figure.tsx\t@postkit/chakra@0.3.0');
    expect(diff.stdout).toContain('+++ b/figure.tsx\t@postkit/chakra@0.3.2');
    expect(diff.stdout).toContain('-          decoding="async"');
    expect(diff.stdout).toContain('+          decoding="sync"');
    expect(diff.stdout).toContain('Your edits: figure.recipe.ts.');
    expect(fixture.read('src/postkit/figure/figure.tsx')).toContain(
      'decoding="async"',
    );

    await fixture.run('diff', 'figure', '--accept');
    expect(readEjectLock(fixture.root).components['Figure'].version).toBe(
      '0.3.2',
    );
    const after = await fixture.run('diff', '--exit-code');
    expect(after.code).toBe(0);
    expect(after.stdout).toContain('No upstream changes.');
    expect(after.stdout).not.toContain('Your edits');
  });
});

describe('postkit new', () => {
  beforeEach(() => {
    fixture = createFixture();
  });

  it('scaffolds a component whose definition and views work', async () => {
    fixture.write('lib/postkit.ts', chakraConfig);
    const { code, stdout } = await fixture.run(
      'new',
      'device',
      '--chakra',
      '--spec',
      '--category',
      'media',
    );
    expect(code).toBe(0);
    for (const file of [
      'device.definition.ts',
      'device.tsx',
      'device.css',
      'device.recipe.ts',
      'device.chakra.tsx',
      'device.spec.tsx',
      'device.chakra.spec.tsx',
    ]) {
      expect(stdout).toContain(`✓ src/postkit/device/${file}`);
    }
    expect(stdout).toContain(
      `import { Device } from '../src/postkit/device/device.chakra';`,
    );
    expect(stdout).toContain(
      'components: [{ definition: deviceDefinition, view: Device }]',
    );

    const { deviceDefinition } = await load<{
      deviceDefinition: {
        name: string;
        directive: string;
        category: string;
        slots: string[];
      };
    }>(fixture.path('src/postkit/device/device.definition.ts'));
    expect(deviceDefinition).toMatchObject({
      name: 'Device',
      directive: 'postkit-device',
      category: 'media',
      slots: ['root', 'title', 'body'],
    });

    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { Device } = await load<{
      Device: ComponentType<{ title?: string; children?: ReactNode }>;
    }>(fixture.path('src/postkit/device/device.tsx'));
    const html = renderToStaticMarkup(
      createElement(Device, { title: 'Hi' }, 'Body'),
    );
    expect(html).toContain('data-postkit-component="Device"');
    expect(html).toContain('data-postkit-part="title"');
    expect(html).toContain('data-variant="subtle"');

    const again = await fixture.run('new', 'device');
    expect(again.code).toBe(1);
  });
});

describe('postkit manifest', () => {
  beforeEach(() => {
    fixture = createFixture();
  });

  it('writes the v2 manifest of the configured set, with a custom component', async () => {
    await fixture.run('new', 'device', '--to', 'lib');
    fixture.write(
      'lib/postkit.ts',
      `import { createPostkit } from '@postkit/react';
import { media } from '@postkit/react/kits';

import { Device } from './device/device';
import { deviceDefinition } from './device/device.definition';

export const postkit = createPostkit({
  kits: [media],
  components: [{ definition: deviceDefinition, view: Device }],
});
`,
    );
    const { code, stdout } = await fixture.run('manifest');
    expect(code).toBe(0);
    const manifest = JSON.parse(stdout);
    expect(manifest.version).toBe(2);
    expect(Object.keys(manifest.components)).toEqual(
      expect.arrayContaining(['Figure', 'Device']),
    );
    expect(Object.keys(manifest.components)).not.toContain('Callout');

    fixture.write(
      'postkit.config.ts',
      `export { postkit as default } from './lib/postkit';\n`,
    );
    const written = await fixture.run(
      'manifest',
      '--out',
      'public/postkit.json',
    );
    expect(written.stderr).toContain('✓ public/postkit.json');
    expect(
      JSON.parse(fixture.read('public/postkit.json')).components.Device,
    ).toBeDefined();
  });

  it('explains a missing config', async () => {
    const { code, stderr } = await fixture.run('manifest');
    expect(code).toBe(1);
    expect(stderr).toContain('No Postkit config found');
  });
});

describe('the command line', () => {
  it('prints help and rejects unknown commands and flags', async () => {
    fixture = createFixture({ link: [] });
    expect((await fixture.run('--help')).stdout).toContain(
      'Usage: postkit <command>',
    );
    expect((await fixture.run('eject', '--help')).stdout).toContain(
      '--renderer',
    );
    expect((await fixture.run('frob')).code).toBe(1);
    const bad = await fixture.run('eject', 'figure', '--nope');
    expect(bad.code).toBe(1);
    expect(bad.stderr).toContain("postkit eject: Unknown option '--nope'");
  });
});

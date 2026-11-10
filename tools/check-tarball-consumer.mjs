import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import publicPackages from './public-packages.json' with { type: 'json' };

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const consumerRoot = mkdtempSync(join(tmpdir(), 'postkit-consumer-'));

function run(command, args, cwd = consumerRoot) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with ${result.status}.`,
    );
  }
}

try {
  const dependencies = {
    '@chakra-ui/react': '3.29.0',
    '@emotion/react': '11.14.0',
    react: '19.1.0',
    'react-dom': '19.1.0',
  };
  for (const packageName of publicPackages) {
    const result = spawnSync(
      npmCommand,
      [
        'pack',
        '--json',
        '--cache',
        './tmp/npm-cache',
        '--pack-destination',
        consumerRoot,
        '--workspace',
        packageName,
      ],
      {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: process.env,
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      throw new Error(`npm pack failed for ${packageName}.`);
    }
    const [tarball] = JSON.parse(result.stdout);
    dependencies[packageName] = `file:./${tarball.filename}`;
  }

  writeFileSync(
    join(consumerRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'postkit-tarball-consumer',
        version: '1.0.0',
        private: true,
        type: 'module',
        dependencies,
        devDependencies: {
          '@types/node': '^24.13.3',
          '@types/react': '^19.1.0',
          '@types/react-dom': '^19.0.0',
          typescript: '~6.0.3',
        },
      },
      null,
      2,
    )}\n`,
  );

  run(npmCommand, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--package-lock=false',
    '--prefer-offline',
    '--cache',
    join(workspaceRoot, 'tmp', 'consumer-cache'),
    '--registry',
    'https://registry.npmjs.org/',
  ]);

  writeFileSync(
    join(consumerRoot, 'smoke.mjs'),
    `import { readFile } from 'node:fs/promises';

const chakraManifest = JSON.parse(
  await readFile(
    new URL('./node_modules/@chakra-ui/react/package.json', import.meta.url),
    'utf8',
  ),
);
if (chakraManifest.version !== '3.29.0') {
  throw new Error(
    \`Expected the minimum supported Chakra UI 3.29.0, received \${chakraManifest.version}.\`,
  );
}

const packages = await Promise.all([
  import('@postkit/core'),
  import('@postkit/core/components'),
  import('@postkit/core/behaviors'),
  import('@postkit/core/behaviors/testing'),
  import('@postkit/unfurl'),
  import('@postkit/react'),
  import('@postkit/react/kits'),
  import('@postkit/react/kits/article'),
  import('@postkit/react/kits/technical'),
  import('@postkit/react/kits/media'),
  import('@postkit/react/kits/discovery'),
  import('@postkit/react/kits/engagement'),
  import('@postkit/react/kits/publishing'),
  import('@postkit/react/remark'),
  import('@postkit/chakra'),
  import('@postkit/chakra/theme'),
  import('@postkit/chakra/remark'),
  import('@postkit/chakra/document'),
  import('@postkit/email'),
  import('@postkit/shiki'),
  import('@postkit/next'),
  import('@postkit/react-router'),
  import('@postkit/tanstack-router'),
  import('@postkit/astro'),
]);
if (packages.some((entry) => Object.keys(entry).length === 0)) {
  throw new Error('A Postkit package exported no public members.');
}
console.log('Postkit tarball runtime entry points loaded with Chakra UI 3.29.0.');

// The optional headless baseline resolves through the export map.
const stylesUrl = import.meta.resolve('@postkit/react/styles.css');
const styles = await readFile(new URL(stylesUrl), 'utf8');
if (
  !styles.includes('--postkit-color-fg:') ||
  !styles.includes("[data-postkit-component='Callout']") ||
  !styles.includes('prefers-color-scheme: dark')
) {
  throw new Error(\`@postkit/react/styles.css is not the baseline: \${stylesUrl}\`);
}
console.log('@postkit/react/styles.css resolves to the baseline stylesheet.');

// Behaviours run framework-free on the host's (Chakra's) single Zag copy.
const behaviors = await import('@postkit/core/behaviors');
const tabs = behaviors.createTabs({ id: 'smoke', values: ['a', 'b'], initialIndex: '1' });
const consent = behaviors.createEmbedConsent();
if (tabs.api.value !== 'b' || consent.api.shouldRenderFrame !== false) {
  throw new Error('@postkit/core/behaviors did not configure its behaviours.');
}
const { createRequire } = await import('node:module');
const requireFromCore = createRequire(
  new URL('./node_modules/@postkit/core/package.json', import.meta.url),
);
const requireFromArk = createRequire(
  new URL('./node_modules/@ark-ui/react/package.json', import.meta.url),
);
for (const zagPackage of ['@zag-js/carousel', '@zag-js/tabs', '@zag-js/clipboard', '@zag-js/core']) {
  const fromCore = requireFromCore.resolve(\`\${zagPackage}/package.json\`);
  const fromArk = requireFromArk.resolve(\`\${zagPackage}/package.json\`);
  if (fromCore !== fromArk) {
    throw new Error(\`\${zagPackage} resolves to two copies: \${fromCore} and \${fromArk}.\`);
  }
}
// The headless hooks in @postkit/react run on the same copy, @zag-js/react included.
const requireFromReact = createRequire(
  new URL('./node_modules/@postkit/react/package.json', import.meta.url),
);
for (const zagPackage of ['@zag-js/react', '@zag-js/carousel', '@zag-js/tabs', '@zag-js/clipboard', '@zag-js/core']) {
  const fromReact = requireFromReact.resolve(\`\${zagPackage}/package.json\`);
  const fromArk = requireFromArk.resolve(\`\${zagPackage}/package.json\`);
  if (fromReact !== fromArk) {
    throw new Error(\`\${zagPackage} resolves to two copies: \${fromReact} and \${fromArk}.\`);
  }
}

// Core's root and components entries must not load Zag; only /behaviors may.
const coreDist = new URL('./node_modules/@postkit/core/dist/', import.meta.url);
async function zagImports(entry, seen = new Set()) {
  if (seen.has(entry.href)) return [];
  seen.add(entry.href);
  const source = await readFile(entry, 'utf8');
  const found = [];
  for (const [, specifier] of source.matchAll(/(?:from|import)\\s*['"]([^'"]+)['"]/g)) {
    if (specifier.startsWith('@zag-js/')) found.push(specifier);
    else if (specifier.startsWith('.')) {
      found.push(...(await zagImports(new URL(specifier, entry), seen)));
    }
  }
  return found;
}
for (const entry of ['index.js', 'components/index.js']) {
  const found = await zagImports(new URL(entry, coreDist));
  if (found.length > 0) {
    throw new Error(\`@postkit/core/\${entry} imports \${found.join(', ')}.\`);
  }
}
console.log('@postkit/core behaviours share the host Zag copy; the root entry loads no Zag.');

// 03 step 8: a fixture site with 3 kits + one custom component, in both
// renderers.
{
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { definePostkitComponent, prop, readPostkitComponentManifest } =
    await import('@postkit/core/components');
  const { createPostkit, postkitView } = await import('@postkit/react');
  const { remarkPostkit } = await import('@postkit/react/remark');
  const { article, technical, media } = await import('@postkit/react/kits');
  const { chakra, postkitDefaultTheme } = await import('@postkit/chakra');

  const deviceDefinition = definePostkitComponent({
    name: 'Device',
    directive: 'postkit-device',
    category: 'media',
    description: 'A screenshot framed in a device.',
    props: {
      src: prop.string('The screenshot.', { required: true }),
      frame: prop.enum(['phone', 'laptop'], {
        description: 'The frame.',
        default: 'phone',
        themeVariant: true,
      }),
    },
    slots: ['root', 'screen'],
  });
  const Device = postkitView(deviceDefinition, ({ props, part }) =>
    createElement(
      'figure',
      part('root'),
      createElement('img', { ...part('screen'), src: props.src, alt: '' }),
    ),
  );

  for (const renderer of [undefined, chakra]) {
    const label = renderer ? 'chakra' : 'headless';
    const postkit = createPostkit({
      renderer,
      kits: [article, technical, media],
      components: [{ definition: deviceDefinition, view: Device }],
      defaults: { Callout: { variant: 'plain' }, Device: { frame: 'laptop' } },
    });
    const { Callout, Figure, Tabs } = postkit.mdxComponents;
    const markup = renderToStaticMarkup(
      createElement(
        postkit.Provider,
        renderer ? { preset: postkitDefaultTheme } : {},
        createElement(Callout, { tone: 'tip' }, 'Body'),
        createElement(Callout, { variant: 'outline' }, 'Authored'),
        createElement(postkit.mdxComponents.Device, { src: '/phone.png' }),
        createElement(Figure, { src: '/a.png', alt: '' }),
        renderer
          ? createElement(Tabs, { items: [{ label: 'One', content: 'First' }] })
          : null,
      ),
    );
    for (const expected of [
      'data-variant="plain"',
      'data-variant="outline"',
      'data-postkit-component="Device"',
      'data-frame="laptop"',
      'data-postkit-component="Figure"',
    ]) {
      if (!markup.includes(expected)) {
        throw new Error(\`createPostkit (\${label}) did not render \${expected}.\`);
      }
    }

    const manifest = readPostkitComponentManifest(
      JSON.parse(JSON.stringify(postkit.manifest())),
    );
    const names = Object.keys(manifest.components);
    if (!names.includes('Device') || !names.includes('Callout') || names.includes('Poll')) {
      throw new Error(\`createPostkit (\${label}) manifest has the wrong set: \${names.join(', ')}.\`);
    }
    // Every built-in has a headless view since 03 step 6, so Tabs is in both sets.
    if (!names.includes('Tabs') || manifest.components['Tabs'].support.headless !== 'supported') {
      throw new Error(\`createPostkit (\${label}) manifest is missing headless Tabs.\`);
    }

    const [, postkitOptions] = postkit.remarkPlugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === remarkPostkit,
    );
    const tree = {
      type: 'root',
      children: [
        { type: 'leafDirective', name: 'postkit-device', attributes: { src: '/p.png' }, children: [] },
      ],
    };
    remarkPostkit(postkitOptions)(tree);
    if (tree.children[0].name !== 'Device') {
      throw new Error(\`createPostkit (\${label}) remark plugin did not transform Device.\`);
    }
    let failed = false;
    try {
      remarkPostkit(postkitOptions)({
        type: 'root',
        children: [{ type: 'leafDirective', name: 'postkit-poll', attributes: {}, children: [] }],
      });
    } catch {
      failed = true;
    }
    if (!failed) {
      throw new Error(\`createPostkit (\${label}) accepted a directive it didn't enable.\`);
    }
  }
  console.log('createPostkit fixture site renders 3 kits and a custom component in both renderers.');
}
`,
  );
  run(process.execPath, ['smoke.mjs']);

  writeFileSync(
    join(consumerRoot, 'consumer.ts'),
    `import { parsePostkitHtml, serializePostkitJson } from '@postkit/core';
import {
  calloutDefinition,
  definePostkitComponent,
  prop,
  readPostkitComponentManifest,
  type PostkitAuthoredPropsOf,
  type PostkitComponentManifest,
  type PostkitPropsOf,
} from '@postkit/core/components';
import {
  createCarousel,
  type CarouselBehaviorApi,
} from '@postkit/core/behaviors';
import {
  tabsBehaviorSpec,
  type BehaviorDriver,
  type TabsBehaviorFixture,
} from '@postkit/core/behaviors/testing';
import { createLinkResolverRegistry } from '@postkit/unfurl';
import {
  Callout as HeadlessCallout,
  Tabs as HeadlessTabs,
  createPostkit as createHeadlessPostkit,
  postkitView,
  useTabs,
  type CalloutProps,
  type TabsProps,
} from '@postkit/react';
import '@postkit/react/styles.css';
import { article, media, technical } from '@postkit/react/kits';
import { article as articleKit } from '@postkit/react/kits/article';
import { remarkPostkit as remarkPostkitHeadless } from '@postkit/react/remark';
import { PostkitProvider, chakra } from '@postkit/chakra';
import { DocumentRenderer } from '@postkit/chakra/document';
import { createPostkitTheme } from '@postkit/chakra/theme';
import { remarkPostkit } from '@postkit/chakra/remark';
import { PostkitEmailProvider } from '@postkit/email';
import { createPostkitShikiAdapter } from '@postkit/shiki';
import { createPostkit, createPostkitNextComponents } from '@postkit/next';
import { createPostkitReactRouterComponents } from '@postkit/react-router';
import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';
import { postkitAstro } from '@postkit/astro';
import type { PostkitAstroComponents } from '@postkit/astro/components';
import type { Audio } from '@postkit/astro/react';

void parsePostkitHtml;
void serializePostkitJson;
void definePostkitComponent;
const _calloutProps: PostkitAuthoredPropsOf<typeof calloutDefinition> = { tone: 'tip' };
void _calloutProps;
const _resolvedCalloutProps: PostkitPropsOf<typeof calloutDefinition> = {
  tone: 'tip',
  size: 'md',
  variant: 'plain',
};
void _resolvedCalloutProps;

// 03 step 8: 3 kits + one custom component, in both renderers.
const deviceDefinition = definePostkitComponent({
  name: 'Device',
  directive: 'postkit-device',
  category: 'media',
  description: 'A screenshot framed in a device.',
  props: { src: prop.string('The screenshot.', { required: true }) },
  slots: ['root'],
});
const Device = postkitView(deviceDefinition, () => null);
const headlessSite = createHeadlessPostkit({
  kits: [articleKit, technical, media],
  components: [{ definition: deviceDefinition, view: Device }],
  defaults: { Callout: { variant: 'plain' } },
  overrides: { Callout: { slots: { icon: Device } } },
});
const chakraSite = createPostkit({
  renderer: chakra,
  kits: [article, technical, media],
  components: [{ definition: deviceDefinition, view: Device }],
  defaults: { Figure: { layout: 'wide' } },
  link: { linkProps: { prefetch: false } },
});
const _manifest: PostkitComponentManifest = chakraSite.manifest();
void _manifest;
void headlessSite.Provider;
void chakraSite.Provider;
void readPostkitComponentManifest;
void remarkPostkitHeadless;
const _carouselApi: CarouselBehaviorApi = createCarousel({ id: 'c', slideCount: 2 }).api;
void _carouselApi;
const _tabsDriver = null as unknown as BehaviorDriver<TabsBehaviorFixture>;
void tabsBehaviorSpec;
void _tabsDriver;
void createLinkResolverRegistry;
void HeadlessCallout;
void postkitView;
const _headlessCalloutProps: CalloutProps = { tone: 'tip', classNames: { icon: 'mark' } };
void _headlessCalloutProps;
const _headlessTabsProps: TabsProps = { items: [{ label: 'A', content: 'a' }], classNames: { tab: 'tab' } };
void _headlessTabsProps;
void HeadlessTabs;
void useTabs;
void PostkitProvider;
void DocumentRenderer;
void createPostkitTheme;
void remarkPostkit;
void PostkitEmailProvider;
void createPostkitShikiAdapter;
void createPostkitNextComponents;
void createPostkitReactRouterComponents;
void createPostkitTanStackRouterComponents;
void postkitAstro;
type _AstroComponents = PostkitAstroComponents;
type _AstroReactBridge = typeof Audio;
`,
  );
  // What a bundler's client types declare: CSS imports are side effects.
  writeFileSync(join(consumerRoot, 'css.d.ts'), "declare module '*.css';\n");
  writeFileSync(
    join(consumerRoot, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ['ESNext', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
          types: ['node'],
        },
        include: ['consumer.ts', 'css.d.ts'],
      },
      null,
      2,
    )}\n`,
  );
  run(process.execPath, [
    join(consumerRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--project',
    'tsconfig.json',
  ]);

  // 03 step 11, done when "an ejected Chakra Figure still validates
  // directives": eject Figure with the packed `postkit` bin, register it
  // through createPostkit's overrides, and show that a bad prop on
  // ::postkit-figure still fails while a good one renders the ejected view.
  {
    mkdirSync(join(consumerRoot, 'lib'), { recursive: true });
    writeFileSync(
      join(consumerRoot, 'lib', 'postkit.ts'),
      `import { createPostkit } from '@postkit/react';
import { article, media } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [article, media],
});
`,
    );
    // The consumer has other createPostkit calls, so a config file says
    // which one the CLI uses; it follows the re-export to lib/postkit.ts.
    writeFileSync(
      join(consumerRoot, 'postkit.config.ts'),
      "export { postkit as default } from './lib/postkit';\n",
    );
    const postkitBin = join(consumerRoot, 'node_modules', '.bin', 'postkit');
    run(postkitBin, [
      'eject',
      'figure',
      '--renderer',
      'chakra',
      '--to',
      'libs/postkit',
    ]);
    const config = readFileSync(
      join(consumerRoot, 'lib', 'postkit.ts'),
      'utf8',
    );
    const view = readFileSync(
      join(consumerRoot, 'libs', 'postkit', 'figure', 'figure.tsx'),
      'utf8',
    );
    const lock = JSON.parse(
      readFileSync(join(consumerRoot, '.postkit-eject.json'), 'utf8'),
    );
    if (
      !config.includes('overrides: { Figure: { view: Figure } }') ||
      !config.includes("from '../libs/postkit/figure/figure'")
    ) {
      throw new Error(`postkit eject didn't register the view:\n${config}`);
    }
    if (
      !view.includes("from '@postkit/core/components'") ||
      /from '\.\.\//.test(view) ||
      lock.components?.Figure?.package !== '@postkit/chakra' ||
      !/^sha256-/.test(lock.components?.Figure?.hash ?? '')
    ) {
      throw new Error('postkit eject wrote an unexpected view or lockfile.');
    }
    run(postkitBin, ['diff', 'figure', '--exit-code']);

    // The ejected view and the edited config typecheck against the packed
    // packages' public types.
    writeFileSync(
      join(consumerRoot, 'tsconfig.eject.json'),
      `${JSON.stringify(
        {
          compilerOptions: {
            jsx: 'react-jsx',
            lib: ['ESNext', 'DOM'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            noEmit: true,
            skipLibCheck: true,
            strict: true,
            target: 'ES2022',
            types: [],
          },
          include: [
            'postkit.config.ts',
            'lib/**/*.ts',
            'libs/**/*.ts',
            'libs/**/*.tsx',
          ],
        },
        null,
        2,
      )}\n`,
    );
    run(process.execPath, [
      join(consumerRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--project',
      'tsconfig.eject.json',
    ]);

    writeFileSync(
      join(consumerRoot, 'eject-smoke.mjs'),
      `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';
import { remarkPostkit } from '@postkit/react/remark';
import { postkitDefaultTheme } from '@postkit/chakra';

const jiti = createJiti(import.meta.url, { jsx: { runtime: 'automatic' } });
const { postkit } = await jiti.import('./lib/postkit.ts');
const { Figure: EjectedFigure } = await jiti.import(
  './libs/postkit/figure/figure.tsx',
);
if (postkit.mdxComponents.Figure !== EjectedFigure) {
  throw new Error('createPostkit did not use the ejected Figure view.');
}

const [, options] = postkit.remarkPlugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === remarkPostkit,
);
const directive = (attributes) => ({
  type: 'root',
  children: [
    { type: 'leafDirective', name: 'postkit-figure', attributes, children: [] },
  ],
});

// A bad prop fails the build, exactly as for the upstream view.
for (const attributes of [
  { src: '/a.png', alt: 'A', layout: 'sideways' },
  { src: '/a.png' },
]) {
  let failed = false;
  try {
    remarkPostkit(options)(directive(attributes));
  } catch {
    failed = true;
  }
  if (!failed) {
    throw new Error(\`::postkit-figure accepted \${JSON.stringify(attributes)}.\`);
  }
}

// A good one becomes <Figure>, which renders the ejected view.
const tree = directive({ src: '/a.png', alt: 'A harbour', caption: 'At dawn', layout: 'wide' });
remarkPostkit(options)(tree);
const [node] = tree.children;
if (node.type !== 'mdxJsxFlowElement' || node.name !== 'Figure') {
  throw new Error(\`::postkit-figure became \${node.type} \${node.name}.\`);
}
const props = Object.fromEntries(node.attributes.map((entry) => [entry.name, entry.value]));
const markup = renderToStaticMarkup(
  createElement(
    postkit.Provider,
    { preset: postkitDefaultTheme },
    createElement(postkit.mdxComponents[node.name], props),
  ),
);
for (const expected of [
  'data-postkit-component="Figure"',
  'data-layout="wide"',
  'alt="A harbour"',
  'At dawn',
  'postkit-figure__root',
]) {
  if (!markup.includes(expected)) {
    throw new Error(\`The ejected Figure did not render \${expected}:\\n\${markup}\`);
  }
}
console.log('An ejected Chakra Figure still validates ::postkit-figure and renders.');
`,
    );
    run(process.execPath, ['eject-smoke.mjs']);

    // The manifest command loads the same config, ejected view included.
    const manifest = spawnSync(postkitBin, ['manifest'], {
      cwd: consumerRoot,
      encoding: 'utf8',
      env: process.env,
    });
    if (manifest.status !== 0) {
      process.stderr.write(manifest.stderr);
      throw new Error('postkit manifest failed.');
    }
    const components = Object.keys(JSON.parse(manifest.stdout).components);
    if (!components.includes('Figure') || !components.includes('Callout')) {
      throw new Error(`postkit manifest wrote ${components.join(', ')}.`);
    }

    console.log('@postkit/cli works from its tarball.');
  }

  process.stdout.write('Postkit tarball consumer verification passed.\n');
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
`,
  );
  run(process.execPath, ['smoke.mjs']);

  writeFileSync(
    join(consumerRoot, 'consumer.ts'),
    `import { parsePostkitHtml, serializePostkitJson } from '@postkit/core';
import {
  calloutDefinition,
  definePostkitComponent,
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
import { Callout as HeadlessCallout, postkitView, type CalloutProps } from '@postkit/react';
import { PostkitProvider } from '@postkit/chakra';
import { DocumentRenderer } from '@postkit/chakra/document';
import { createPostkitTheme } from '@postkit/chakra/theme';
import { remarkPostkit } from '@postkit/chakra/remark';
import { PostkitEmailProvider } from '@postkit/email';
import { createPostkitShikiAdapter } from '@postkit/shiki';
import { createPostkitNextComponents } from '@postkit/next';
import { createPostkitReactRouterComponents } from '@postkit/react-router';
import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';
import { postkitAstro } from '@postkit/astro';
import type { PostkitAstroComponents } from '@postkit/astro/components';
import type { Audio } from '@postkit/astro/react';

void parsePostkitHtml;
void serializePostkitJson;
void definePostkitComponent;
const _calloutProps: PostkitPropsOf<typeof calloutDefinition> = { tone: 'tip' };
void _calloutProps;
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
        include: ['consumer.ts'],
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

  process.stdout.write('Postkit tarball consumer verification passed.\n');
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}

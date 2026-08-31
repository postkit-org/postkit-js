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
  const dependencies = {};
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
    '--package-lock=false',
    '--prefer-offline',
    '--cache',
    join(workspaceRoot, 'tmp', 'consumer-cache'),
    '--registry',
    'https://registry.npmjs.org/',
  ]);

  writeFileSync(
    join(consumerRoot, 'smoke.mjs'),
    `const packages = await Promise.all([
  import('@postkit/core'),
  import('@postkit/unfurl'),
  import('@postkit/react'),
  import('@postkit/react/theme'),
  import('@postkit/react/remark'),
  import('@postkit/react/document'),
  import('@postkit/email'),
  import('@postkit/shiki'),
  import('@postkit/next'),
  import('@postkit/react-router'),
  import('@postkit/tanstack-router'),
  import('@postkit/astro'),
]);
if (packages.some((entry) => Object.keys(entry).length === 0)) {
  throw new Error('A PostKit package exported no public members.');
}
console.log('PostKit tarball runtime entry points loaded.');
`,
  );
  run(process.execPath, ['smoke.mjs']);

  writeFileSync(
    join(consumerRoot, 'consumer.ts'),
    `import { parsePostkitHtml, serializePostkitJson } from '@postkit/core';
import { createLinkResolverRegistry } from '@postkit/unfurl';
import { PostkitProvider } from '@postkit/react';
import { DocumentRenderer } from '@postkit/react/document';
import { createPostkitTheme } from '@postkit/react/theme';
import { remarkPostkit } from '@postkit/react/remark';
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
void createLinkResolverRegistry;
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

  process.stdout.write('PostKit tarball consumer verification passed.\n');
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}

import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { PostkitCliIo } from './commands.js';
import { runPostkitCli } from './cli.js';

const require = createRequire(import.meta.url);

/** The installed directory of a workspace dependency. */
export function packageDirectory(name: string): string {
  return dirname(require.resolve(`${name}/package.json`));
}

/** A temporary project with links to the workspace's packages. */
export interface Fixture {
  readonly root: string;
  path(...parts: string[]): string;
  read(...parts: string[]): string;
  write(path: string, content: string): void;
  run(
    ...argv: string[]
  ): Promise<{ code: number; stdout: string; stderr: string }>;
  /** Copies a renderer package's eject assets as a fake installed version. */
  fakeRenderer(
    name: '@postkit/chakra' | '@postkit/react',
    version: string,
  ): string;
  dispose(): void;
}

const linked = [
  '@postkit/core',
  '@postkit/react',
  '@postkit/chakra',
  '@chakra-ui/react',
  '@emotion/react',
  'react',
  'react-dom',
];

export function createFixture(
  options: { readonly link?: readonly string[] } = {},
): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'postkit-cli-'));
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ name: 'fixture', private: true, type: 'module' }, null, 2)}\n`,
  );
  for (const name of options.link ?? linked) {
    const target = join(root, 'node_modules', ...name.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(packageDirectory(name), target, 'dir');
  }
  const fixture: Fixture = {
    root,
    path: (...parts) => join(root, ...parts),
    read: (...parts) => readFileSync(join(root, ...parts), 'utf8'),
    write(path, content) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    },
    async run(...argv) {
      let stdout = '';
      let stderr = '';
      const io: PostkitCliIo = {
        cwd: root,
        stdout: (text) => {
          stdout += text;
        },
        stderr: (text) => {
          stderr += text;
        },
      };
      const code = await runPostkitCli(argv, io);
      return { code, stdout, stderr };
    },
    fakeRenderer(name, version) {
      const target = join(root, 'node_modules', ...name.split('/'));
      rmSync(target, { recursive: true, force: true });
      mkdirSync(join(target, 'dist'), { recursive: true });
      cpSync(
        join(packageDirectory(name), 'dist', 'eject'),
        join(target, 'dist', 'eject'),
        { recursive: true },
      );
      writeFileSync(
        join(target, 'package.json'),
        JSON.stringify({ name, version, type: 'module' }),
      );
      const manifestPath = join(target, 'dist', 'eject', 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      writeFileSync(manifestPath, JSON.stringify({ ...manifest, version }));
      return target;
    },
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
  };
  return fixture;
}

export const chakraConfig = `import { createPostkit } from '@postkit/react';
import { article, technical } from '@postkit/react/kits';
import { chakra } from '@postkit/chakra';

export const postkit = createPostkit({
  renderer: chakra,
  kits: [
    article,
    technical,
  ],
  exclude: ['Poll'],
});
`;

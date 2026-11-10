import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';

import { PostkitCliError } from './names.js';

/** The renderers `eject` copies from, and their packages. */
export const postkitRendererPackages = Object.freeze({
  headless: '@postkit/react',
  chakra: '@postkit/chakra',
} as const);

export type PostkitRendererId = keyof typeof postkitRendererPackages;

export function isPostkitRendererId(value: string): value is PostkitRendererId {
  return Object.hasOwn(postkitRendererPackages, value);
}

/** The nearest directory at or above `cwd` with a `package.json`. */
export function findProjectRoot(cwd: string): string {
  let directory = resolve(cwd);
  for (;;) {
    if (existsSync(join(directory, 'package.json'))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return resolve(cwd);
    directory = parent;
  }
}

/** A renderer package's eject assets (`dist/eject/manifest.json`). */
export interface PostkitEjectAssets {
  readonly schema: 'postkit.eject/1';
  readonly package: string;
  readonly version: string;
  readonly renderer: string;
  /** The package root's export names, types included. */
  readonly exports: readonly string[];
  readonly components: Readonly<
    Record<
      string,
      { readonly folder: string; readonly files: readonly string[] }
    >
  >;
  /** Every shipped source file, relative to `src/`. */
  readonly files: readonly string[];
  /** The absolute `dist/eject/files` directory: `src/` as shipped. */
  readonly sourceRoot: string;
}

/** The installed package's directory, resolved from the project root. */
export function resolveInstalledPackage(
  projectRoot: string,
  packageName: string,
): string {
  const require = createRequire(join(projectRoot, 'package.json'));
  try {
    return dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    throw new PostkitCliError(
      `${packageName} isn't installed in ${projectRoot}. Install it first: npm install ${packageName}`,
    );
  }
}

/** Reads the eject assets of an installed renderer package. */
export function readEjectAssets(
  projectRoot: string,
  renderer: PostkitRendererId,
): PostkitEjectAssets {
  const packageName = postkitRendererPackages[renderer];
  const packageRoot = resolveInstalledPackage(projectRoot, packageName);
  const manifestPath = join(packageRoot, 'dist', 'eject', 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new PostkitCliError(
      `${packageName} at ${packageRoot} has no eject assets (dist/eject). Eject needs ${packageName} 0.3.0 or later.`,
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schema !== 'postkit.eject/1') {
    throw new PostkitCliError(
      `${packageName}'s eject assets use ${String(manifest.schema)}, which this CLI doesn't read. Upgrade @postkit/cli.`,
    );
  }
  return {
    ...manifest,
    sourceRoot: join(packageRoot, 'dist', 'eject', 'files'),
  };
}

/** The installed version of a package, or `undefined`. */
export function installedVersion(
  projectRoot: string,
  packageName: string,
): string | undefined {
  try {
    const packageRoot = resolveInstalledPackage(projectRoot, packageName);
    return JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
      .version;
  } catch {
    return undefined;
  }
}

const skippedDirectories = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  'tmp',
  '.git',
  '.next',
  '.nx',
  '.astro',
  '.turbo',
  '.vercel',
]);

/** Source files under `root`, skipping build output and dependencies. */
export function walkSourceFiles(
  root: string,
  filter: (path: string) => boolean,
  depth = 6,
): string[] {
  const found: string[] = [];
  const visit = (directory: string, level: number) => {
    if (level > depth) return;
    let entries: string[];
    try {
      entries = readdirSync(directory);
    } catch {
      return;
    }
    for (const entry of entries.sort()) {
      if (entry.startsWith('.') && entry !== '.') continue;
      const path = join(directory, entry);
      let stats;
      try {
        stats = statSync(path);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        if (!skippedDirectories.has(entry)) visit(path, level + 1);
      } else if (filter(path)) {
        found.push(path);
      }
    }
  };
  visit(root, 0);
  return found;
}

/** A path relative to `from`, with forward slashes. */
export function displayPath(from: string, path: string): string {
  const value = relative(from, path) || '.';
  return value.split(sep).join('/');
}

/** A relative module specifier from `fromFile` to `toFile` (no extension). */
export function moduleSpecifier(fromFile: string, toFile: string): string {
  const value = displayPath(dirname(fromFile), toFile).replace(
    /\.(tsx?|jsx?|mts|mjs)$/,
    '',
  );
  return value.startsWith('.') ? value : `./${value}`;
}

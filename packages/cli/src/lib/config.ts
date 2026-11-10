import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { PostkitCliError } from './names.js';
import { displayPath, walkSourceFiles } from './project.js';

/** The config file names the CLI looks for, in order. */
export const postkitConfigFileNames = Object.freeze([
  'postkit.config.ts',
  'postkit.config.mts',
  'postkit.config.js',
  'postkit.config.mjs',
]);

/** How the CLI found the config. */
export type PostkitConfigOrigin = 'config-file' | 'flag' | 'search';

export interface PostkitConfigLocation {
  /** The absolute path of the module to load. */
  readonly path: string;
  readonly origin: PostkitConfigOrigin;
}

const sourceExtension = /\.(?:[cm]?[jt]sx?)$/;
const createPostkitCall = /\bcreatePostkit\s*(?:<[^>]*>)?\s*\(/;

function callsCreatePostkit(path: string): boolean {
  try {
    return createPostkitCall.test(readFileSync(path, 'utf8'));
  } catch {
    return false;
  }
}

/** Files under the project that call `createPostkit(`, excluding tests. */
export function findCreatePostkitFiles(projectRoot: string): string[] {
  return walkSourceFiles(
    projectRoot,
    (path) =>
      sourceExtension.test(path) &&
      !/\.d\.[cm]?ts$/.test(path) &&
      !/\.(spec|test|stories)\.[cm]?[jt]sx?$/.test(path) &&
      callsCreatePostkit(path),
  );
}

/**
 * Finds the Postkit config (03 step 11):
 *
 * 1. `--config <path>`;
 * 2. `postkit.config.{ts,mts,js,mjs}` in the working directory, then in the
 *    project root (the nearest `package.json`);
 * 3. the one source file in the project that calls `createPostkit(`.
 *
 * Returns `undefined` when nothing is found, and throws when step 3 finds
 * more than one file.
 */
export function findPostkitConfig(
  cwd: string,
  projectRoot: string,
  explicit?: string,
): PostkitConfigLocation | undefined {
  if (explicit) {
    const path = isAbsolute(explicit) ? explicit : resolve(cwd, explicit);
    if (!existsSync(path)) {
      throw new PostkitCliError(`--config ${explicit} doesn't exist.`);
    }
    return { path, origin: 'flag' };
  }
  for (const directory of new Set([resolve(cwd), projectRoot])) {
    for (const name of postkitConfigFileNames) {
      const path = join(directory, name);
      if (existsSync(path)) return { path, origin: 'config-file' };
    }
  }
  const found = findCreatePostkitFiles(projectRoot);
  if (found.length > 1) {
    throw new PostkitCliError(
      `More than one file calls createPostkit: ${found
        .slice(0, 10)
        .map((path) => displayPath(projectRoot, path))
        .join(
          ', ',
        )}. Pass --config <file>, or add a postkit.config.ts that exports the one to use.`,
    );
  }
  return found.length === 1 ? { path: found[0], origin: 'search' } : undefined;
}

/**
 * The file that holds the `createPostkit({ … })` call for a config: the
 * config itself, or, for a `postkit.config.ts` that re-exports a config from
 * another module, the one relative module it imports that calls it.
 */
export function findCreatePostkitSource(
  location: PostkitConfigLocation,
): string | undefined {
  if (callsCreatePostkit(location.path)) return location.path;
  const source = readFileSync(location.path, 'utf8');
  const candidates = new Set<string>();
  for (const [, specifier] of source.matchAll(
    /\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g,
  )) {
    const base = resolve(dirname(location.path), specifier);
    const stem = base.replace(/\.[cm]?js$/, '');
    for (const candidate of [
      base,
      ...['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'].map(
        (extension) => `${stem}${extension}`,
      ),
      join(base, 'index.ts'),
      join(base, 'index.js'),
    ]) {
      if (existsSync(candidate) && callsCreatePostkit(candidate)) {
        candidates.add(candidate);
        break;
      }
    }
  }
  return candidates.size === 1 ? [...candidates][0] : undefined;
}

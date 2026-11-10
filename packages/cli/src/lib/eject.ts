import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

import { PostkitCliError } from './names.js';
import type { PostkitEjectAssets, PostkitRendererId } from './project.js';

/** The lockfile `postkit eject` writes at the project root. */
export const POSTKIT_EJECT_LOCK_FILE = '.postkit-eject.json';

/** One ejected component in {@link POSTKIT_EJECT_LOCK_FILE}. */
export interface PostkitEjectLockEntry {
  readonly renderer: PostkitRendererId;
  readonly package: string;
  /** The renderer package version the copy was ejected from. */
  readonly version: string;
  /** The ejected folder, relative to the project root. */
  readonly path: string;
  /** `sha256-…` over every ejected file, as written. */
  readonly hash: string;
  /**
   * Each ejected file: its hash as written, and the upstream content it was
   * written from, which `postkit diff` compares with the installed version.
   */
  readonly files: Readonly<
    Record<string, { readonly sha256: string; readonly upstream: string }>
  >;
}

export interface PostkitEjectLock {
  readonly schema: 'postkit.eject-lock/1';
  readonly components: Readonly<Record<string, PostkitEjectLockEntry>>;
}

export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** The hash of a set of files, independent of order. */
export function postkitFilesHash(files: ReadonlyMap<string, string>): string {
  const hash = createHash('sha256');
  for (const path of [...files.keys()].sort()) {
    hash
      .update(path)
      .update('\0')
      .update(files.get(path) ?? '')
      .update('\0');
  }
  return `sha256-${hash.digest('hex')}`;
}

export function readEjectLock(projectRoot: string): PostkitEjectLock {
  const path = join(projectRoot, POSTKIT_EJECT_LOCK_FILE);
  if (!existsSync(path)) {
    return { schema: 'postkit.eject-lock/1', components: {} };
  }
  const lock = JSON.parse(readFileSync(path, 'utf8'));
  if (lock.schema !== 'postkit.eject-lock/1') {
    throw new PostkitCliError(
      `${POSTKIT_EJECT_LOCK_FILE} uses ${String(lock.schema)}, which this CLI doesn't read.`,
    );
  }
  return lock;
}

export function writeEjectLock(
  projectRoot: string,
  lock: PostkitEjectLock,
): void {
  const components = Object.fromEntries(
    Object.entries(lock.components).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(
    join(projectRoot, POSTKIT_EJECT_LOCK_FILE),
    `${JSON.stringify({ ...lock, components }, null, 2)}\n`,
  );
}

const importClause =
  /\b(import|export)(\s+type)?\s+(\{[^}]*\}|\*\s+as\s+[\w$]+|\*|[\w$]+(?:\s*,\s*\{[^}]*\})?)\s+from\s*(['"])([^'"]+)\4/g;
const sideEffectImport = /\bimport\s*(['"])([^'"]+)\1/g;

interface ImportUse {
  /** Named imports, or `null` for a default, namespace or side-effect one. */
  readonly names: readonly string[] | null;
}

function namedImports(clause: string): string[] | null {
  const braces = /^\{([^}]*)\}$/.exec(clause.trim());
  if (!braces) return null;
  return braces[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((entry) => entry.split(/\s+as\s+/)[0].trim());
}

/** Resolves a relative import to a shipped source file. */
function resolveAsset(
  assets: PostkitEjectAssets,
  fromFile: string,
  specifier: string,
): string | undefined {
  const base = posix.normalize(posix.join(posix.dirname(fromFile), specifier));
  const stem = base.replace(/\.js$/, '');
  return [base, `${stem}.ts`, `${stem}.tsx`, `${stem}/index.ts`].find((path) =>
    assets.files.includes(path),
  );
}

function relativeSpecifier(fromOut: string, toOut: string): string {
  let value = posix.relative(posix.dirname(fromOut), toOut);
  if (!value.startsWith('.')) value = `./${value}`;
  return /\.css$/.test(value) ? value : value.replace(/\.tsx?$/, '');
}

/**
 * The files `postkit eject` writes for a component, keyed by their path in
 * the ejected folder, with imports rewritten:
 *
 * - imports between the component's own files stay relative;
 * - an internal import whose names the package root exports comes from the
 *   package (`@postkit/chakra`, `@postkit/react`);
 * - any other internal module the view needs is copied to `internal/` and
 *   imported from there, unless it holds React context (which must stay one
 *   instance), in which case the component can't be ejected.
 *
 * The definition is never copied: views import it from
 * `@postkit/core/components`, so the contract stays upstream (D1).
 */
export function planPostkitEject(
  assets: PostkitEjectAssets,
  name: string,
): Map<string, string> {
  const component = assets.components[name];
  if (!component) {
    throw new PostkitCliError(
      `${assets.package} ${assets.version} has no ${name} view to eject. It has ${Object.keys(
        assets.components,
      ).join(', ')}.`,
    );
  }
  const exported = new Set(assets.exports);
  const outputs = new Map<string, string>();
  const outPath = new Map<string, string>();
  const queue: string[] = [];
  for (const file of component.files) {
    const source = `${component.folder}/${file}`;
    outPath.set(source, file);
    queue.push(source);
  }
  const vendor = (source: string, from: string): string => {
    const existing = outPath.get(source);
    if (existing) return existing;
    const content = readFileSync(join(assets.sourceRoot, source), 'utf8');
    if (/\bcreateContext\s*[(<]/.test(content)) {
      throw new PostkitCliError(
        `${name}'s view imports ${source} from ${from}, which holds React context and isn't exported by ${assets.package}. It can't be ejected until ${assets.package} exports what it needs.`,
      );
    }
    const target = `internal/${source}`;
    outPath.set(source, target);
    queue.push(source);
    return target;
  };

  while (queue.length > 0) {
    const source = queue.shift() as string;
    const out = outPath.get(source) as string;
    let content = readFileSync(join(assets.sourceRoot, source), 'utf8');
    if (/\.tsx?$/.test(source)) {
      const rewrite = (specifier: string, use: ImportUse): string => {
        if (!specifier.startsWith('.')) return specifier;
        const target = resolveAsset(assets, source, specifier);
        if (!target) {
          throw new PostkitCliError(
            `${name}'s ${source} imports ${specifier}, which isn't in ${assets.package}'s eject assets.`,
          );
        }
        const inComponent = component.files.some(
          (file) => `${component.folder}/${file}` === target,
        );
        if (
          !inComponent &&
          use.names &&
          use.names.length > 0 &&
          use.names.every((entry) => exported.has(entry))
        ) {
          return assets.package;
        }
        const targetOut = inComponent
          ? (outPath.get(target) as string)
          : vendor(target, source);
        return relativeSpecifier(out, targetOut);
      };
      content = content.replace(
        importClause,
        (
          statement,
          _keyword,
          _type,
          clause: string,
          quote: string,
          specifier: string,
        ) =>
          statement.replace(
            `${quote}${specifier}${quote}`,
            `${quote}${rewrite(specifier, { names: namedImports(clause) })}${quote}`,
          ),
      );
      content = content.replace(
        sideEffectImport,
        (statement, quote: string, specifier: string) =>
          statement.replace(
            `${quote}${specifier}${quote}`,
            `${quote}${rewrite(specifier, { names: null })}${quote}`,
          ),
      );
    }
    outputs.set(out, content);
  }
  return new Map([...outputs].sort(([a], [b]) => a.localeCompare(b)));
}

/** Writes planned files under `folder`, creating directories. */
export function writePlannedFiles(
  folder: string,
  files: ReadonlyMap<string, string>,
): string[] {
  const written: string[] = [];
  for (const [path, content] of files) {
    const target = join(folder, ...path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    written.push(target);
  }
  return written;
}

/** A lock entry for files just written from `assets`. */
export function postkitEjectLockEntry(
  assets: PostkitEjectAssets,
  renderer: PostkitRendererId,
  path: string,
  files: ReadonlyMap<string, string>,
): PostkitEjectLockEntry {
  return {
    renderer,
    package: assets.package,
    version: assets.version,
    path,
    hash: postkitFilesHash(files),
    files: Object.fromEntries(
      [...files].map(([file, content]) => [
        file,
        { sha256: sha256(content), upstream: content },
      ]),
    ),
  };
}

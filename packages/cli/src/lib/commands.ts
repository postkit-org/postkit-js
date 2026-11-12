import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import {
  postkitBuiltInDefinitions,
  postkitKitCategories,
  postkitKitIdForCategory,
  type AnyPostkitComponentDefinition,
} from '@postkit/core/components';

import {
  findCreatePostkitSource,
  findPostkitConfig,
  type PostkitConfigLocation,
} from './config.js';
import {
  POSTKIT_EJECT_LOCK_FILE,
  planPostkitEject,
  postkitEjectLockEntry,
  readEjectLock,
  sha256,
  writeEjectLock,
  writePlannedFiles,
  type PostkitEjectLockEntry,
} from './eject.js';
import { loadPostkitConfig } from './load-config.js';
import { postkitComponentNames, PostkitCliError } from './names.js';
import {
  displayPath,
  findProjectRoot,
  moduleSpecifier,
  postkitRendererPackages,
  readEjectAssets,
  type PostkitRendererId,
} from './project.js';
import {
  postkitComponentScaffold,
  postkitRegistrationSnippet,
} from './scaffold.js';
import {
  addViewOverride,
  appendToConfigArray,
  ensureNamedImport,
  importedNames,
  readConfigComponentDefinitions,
  readConfigIdentifier,
  readConfigIdentifiers,
  readConfigStrings,
  removeFromConfigArray,
  PostkitUnsafeSourceError,
} from './source-edit.js';
import { unifiedDiff } from './unified-diff.js';

/** Where a command writes, so tests can capture it. */
export interface PostkitCliIo {
  readonly cwd: string;
  stdout(text: string): void;
  stderr(text: string): void;
}

interface CommonOptions {
  readonly config?: string;
  readonly dryRun?: boolean;
}

const builtIns = postkitBuiltInDefinitions as unknown as Readonly<
  Record<string, AnyPostkitComponentDefinition>
>;
const kitIds = Object.keys(postkitKitCategories);

function context(io: PostkitCliIo) {
  const projectRoot = findProjectRoot(io.cwd);
  return { projectRoot, show: (path: string) => displayPath(io.cwd, path) };
}

/** The config file holding `createPostkit({ … })`, if one is found. */
function configSource(
  io: PostkitCliIo,
  projectRoot: string,
  explicit?: string,
): { location?: PostkitConfigLocation; file?: string } {
  const location = findPostkitConfig(io.cwd, projectRoot, explicit);
  if (!location) return {};
  return { location, file: findCreatePostkitSource(location) };
}

/** Relative imports in `source` use `.js` when the file already does. */
function importExtension(source: string): string {
  return /\bfrom\s*['"]\.{1,2}\/[^'"]+\.js['"]/.test(source) ? '.js' : '';
}

/**
 * Applies `edit` to the config file, or prints the lines to add when the
 * file can't be found or edited safely. Returns whether the file changed.
 */
function editConfig(
  io: PostkitCliIo,
  file: string | undefined,
  edit: (source: string, file: string) => string | undefined,
  lines: string,
  options: {
    readonly dryRun?: boolean;
    readonly show: (path: string) => string;
  },
): boolean {
  const manual = (reason: string) => {
    io.stdout(
      `\n${reason} Add this to your createPostkit config:\n\n${lines}\n`,
    );
    return false;
  };
  if (!file) return manual('No createPostkit config was found.');
  const source = readFileSync(file, 'utf8');
  let next: string | undefined;
  try {
    next = edit(source, file);
  } catch (error) {
    if (error instanceof PostkitUnsafeSourceError) {
      return manual(
        `${options.show(file)} wasn't changed: it has ${error.message}, so it can't be edited safely.`,
      );
    }
    throw error;
  }
  if (next === undefined || next === source) return false;
  if (options.dryRun) {
    io.stdout(
      `\n${unifiedDiff(source, next, {
        from: `a/${options.show(file)}`,
        to: `b/${options.show(file)}`,
      })}`,
    );
    return false;
  }
  writeFileSync(file, next);
  return true;
}

/** The renderer a config uses: `chakra` from `@postkit/chakra`, else headless. */
function configRenderer(
  source: string,
  file: string,
): PostkitRendererId | undefined {
  const renderer = readConfigIdentifier(source, 'renderer', file);
  if (renderer === null) return 'headless';
  const binding = importedNames(source, file).get(renderer);
  return binding?.module === '@postkit/chakra' && binding.imported === 'chakra'
    ? 'chakra'
    : undefined;
}

function rendererFromConfig(
  file: string | undefined,
): PostkitRendererId | undefined {
  if (!file) return undefined;
  try {
    return configRenderer(readFileSync(file, 'utf8'), file);
  } catch (error) {
    if (error instanceof PostkitUnsafeSourceError) return undefined;
    throw error;
  }
}

/** Kit ids the config enables, read from `kits: [...]` and its imports. */
function enabledKits(source: string, file: string): Set<string> {
  const identifiers = readConfigIdentifiers(source, 'kits', file) ?? [];
  const names = importedNames(source, file);
  const kits = new Set<string>();
  for (const identifier of identifiers) {
    const binding = names.get(identifier);
    const kit =
      binding?.module === '@postkit/react/kits'
        ? binding.imported
        : binding?.module.startsWith('@postkit/react/kits/')
          ? binding.module.slice('@postkit/react/kits/'.length)
          : undefined;
    if (!kit || !kitIds.includes(kit)) {
      throw new PostkitUnsafeSourceError(
        `a kit (${identifier}) that isn't imported from @postkit/react/kits`,
      );
    }
    kits.add(kit);
  }
  return kits;
}

// ---------------------------------------------------------------------------
// add

export interface PostkitAddOptions extends CommonOptions {
  readonly name: string;
}

/** `postkit add <kit|component>`. */
export function postkitAdd(
  io: PostkitCliIo,
  options: PostkitAddOptions,
): number {
  const { projectRoot, show } = context(io);
  const { file } = configSource(io, projectRoot, options.config);
  const wanted = options.name.trim();

  if (kitIds.includes(wanted.toLowerCase())) {
    const kit = wanted.toLowerCase();
    let already = false;
    const changed = editConfig(
      io,
      file,
      (source, path) => {
        if (enabledKits(source, path).has(kit)) {
          already = true;
          return undefined;
        }
        const withImport = ensureNamedImport(
          source,
          '@postkit/react/kits',
          kit,
          path,
        );
        return appendToConfigArray(withImport, 'kits', kit, path);
      },
      `import { ${kit} } from '@postkit/react/kits';\n\ncreatePostkit({\n  kits: [/* … */, ${kit}],\n});`,
      { dryRun: options.dryRun, show },
    );
    if (already)
      io.stdout(
        `The ${kit} kit is already enabled in ${show(file as string)}.\n`,
      );
    if (changed) io.stdout(`✓ ${show(file as string)}   kits += ${kit}\n`);
    return 0;
  }

  const { pascal, camel } = postkitComponentNames(wanted);
  const definition = builtIns[pascal];
  if (!definition) {
    throw new PostkitCliError(
      `${wanted} isn't a Postkit kit or component. Kits: ${kitIds.join(', ')}. For a component of your own, run: postkit new ${wanted}`,
    );
  }
  const kit = postkitKitIdForCategory(definition.category);
  const definitionExport = `${camel}Definition`;
  let message: string | undefined;
  const renderer = rendererFromConfig(file);
  const rendererPackage = renderer
    ? postkitRendererPackages[renderer]
    : undefined;
  if (renderer) {
    try {
      const assets = readEjectAssets(projectRoot, renderer);
      if (!assets.exports.includes(pascal)) {
        throw new PostkitCliError(
          `${assets.package} ${assets.version} has no ${pascal} view.${renderer === 'headless' ? ' Use the chakra renderer from @postkit/chakra for it.' : ''}`,
        );
      }
    } catch (error) {
      // Only a missing view is fatal; an uninstalled renderer is the host's
      // business, and the edit still says what to install.
      if (
        error instanceof PostkitCliError &&
        /has no .* view/.test(error.message)
      ) {
        throw error;
      }
    }
  }
  const lines = `import { ${definitionExport} } from '@postkit/core/components';
import { ${pascal} } from '${rendererPackage ?? '@postkit/react'}';  // or '@postkit/chakra'

createPostkit({
  components: [{ definition: ${definitionExport}, view: ${pascal} }],
});

(or enable its kit: postkit add ${kit})`;
  const changed = editConfig(
    io,
    file,
    (source, path) => {
      const kits = enabledKits(source, path);
      const excluded = readConfigStrings(source, 'exclude', path) ?? [];
      if (kits.has(kit)) {
        if (excluded.includes(pascal)) {
          message = `exclude -= ${pascal}`;
          return removeFromConfigArray(source, 'exclude', pascal, path);
        }
        message = 'already';
        return undefined;
      }
      // Added before (`postkit add` run twice): createPostkit rejects a
      // component listed twice, so leave the config alone.
      const names = importedNames(source, path);
      const listed = readConfigComponentDefinitions(source, path).some(
        (identifier) => {
          const binding = names.get(identifier);
          return (
            binding?.module === '@postkit/core/components' &&
            binding.imported === definitionExport
          );
        },
      );
      if (listed) {
        message = 'listed';
        return undefined;
      }
      if (!rendererPackage) {
        throw new PostkitUnsafeSourceError(
          "a renderer that isn't chakra from @postkit/chakra",
        );
      }
      let next = ensureNamedImport(
        source,
        '@postkit/core/components',
        definitionExport,
        path,
      );
      next = ensureNamedImport(next, rendererPackage, pascal, path);
      // `exclude` would take it out of `components` too.
      next = removeFromConfigArray(next, 'exclude', pascal, path) ?? next;
      message = `components += ${pascal}`;
      return appendToConfigArray(
        next,
        'components',
        `{ definition: ${definitionExport}, view: ${pascal} }`,
        path,
      );
    },
    lines,
    { dryRun: options.dryRun, show },
  );
  if (message === 'already') {
    io.stdout(
      `${pascal} is already enabled (the ${kit} kit) in ${show(file as string)}.\n`,
    );
  } else if (message === 'listed') {
    io.stdout(
      `${pascal} is already in components in ${show(file as string)}. Nothing changed.\n`,
    );
  } else if (changed) {
    io.stdout(`✓ ${show(file as string)}   ${message}\n`);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// eject

export interface PostkitEjectOptions extends CommonOptions {
  readonly name: string;
  readonly renderer?: string;
  readonly to?: string;
  readonly force?: boolean;
  readonly register?: boolean;
}

/** `postkit eject <name> --renderer chakra|headless --to <dir>`. */
export function postkitEject(
  io: PostkitCliIo,
  options: PostkitEjectOptions,
): number {
  const { projectRoot, show } = context(io);
  const { pascal, kebab } = postkitComponentNames(options.name);
  const { file } = configSource(io, projectRoot, options.config);
  const renderer = (options.renderer ?? rendererFromConfig(file)) as
    PostkitRendererId | undefined;
  if (!renderer) {
    throw new PostkitCliError(
      'Pass --renderer chakra or --renderer headless (no createPostkit config says which).',
    );
  }
  if (!Object.hasOwn(postkitRendererPackages, renderer)) {
    throw new PostkitCliError(
      `--renderer must be chakra or headless, not ${renderer}.`,
    );
  }
  const assets = readEjectAssets(projectRoot, renderer);
  const planned = planPostkitEject(assets, pascal);
  const folder = resolve(io.cwd, options.to ?? 'src/postkit', kebab);
  const lock = readEjectLock(projectRoot);
  if (!options.force) {
    const clash = [...planned.keys()].find((path) =>
      existsSync(join(folder, path)),
    );
    if (clash) {
      throw new PostkitCliError(
        `${show(join(folder, clash))} already exists. Pass --force to overwrite it, or run postkit diff ${kebab} to compare.`,
      );
    }
  }

  const written = options.dryRun
    ? [...planned.keys()].map((path) => join(folder, path))
    : writePlannedFiles(folder, planned);
  for (const path of written) io.stdout(`✓ ${show(path)}\n`);
  if (!options.dryRun) {
    writeEjectLock(projectRoot, {
      ...lock,
      components: {
        ...lock.components,
        [pascal]: postkitEjectLockEntry(
          assets,
          renderer,
          displayPath(projectRoot, folder),
          planned,
        ),
      },
    });
    io.stdout(
      `✓ ${show(join(projectRoot, POSTKIT_EJECT_LOCK_FILE))}   ${pascal} @ ${assets.package} ${assets.version}\n`,
    );
  }

  if (options.register !== false) {
    const view = join(folder, `${kebab}.tsx`);
    const specifierFor = (configFile: string, source: string) =>
      `${moduleSpecifier(configFile, view)}${importExtension(source)}`;
    const changed = editConfig(
      io,
      file,
      (source, path) =>
        addViewOverride(
          ensureNamedImport(source, specifierFor(path, source), pascal, path),
          pascal,
          pascal,
          path,
        ),
      `import { ${pascal} } from '${file ? specifierFor(file, '') : `./${displayPath(io.cwd, view).replace(/\.tsx$/, '')}`}';\n\ncreatePostkit({\n  overrides: { ${pascal}: { view: ${pascal} } },\n});`,
      { dryRun: options.dryRun, show },
    );
    if (changed && file) {
      io.stdout(
        `✓ ${show(file)}   overrides.${pascal}.view → ${specifierFor(file, readFileSync(file, 'utf8'))}\n`,
      );
    }
  }

  const packages = new Set<string>();
  for (const content of planned.values()) {
    for (const [, specifier] of content.matchAll(
      /from\s*['"](@postkit\/[^/'"]+)/g,
    )) {
      packages.add(specifier);
    }
  }
  io.stdout(
    `\nStill bound to ${pascal}'s definition from @postkit/core/components.\n` +
      `It imports ${[...packages].sort().join(', ')}; keep them in your dependencies.\n` +
      (renderer === 'chakra'
        ? `Chakra applies the recipe registered as postkit${pascal} first: register the ejected recipe in your theme to use your edits (see /docs/eject).\n`
        : '') +
      `Run \`postkit diff ${kebab}\` after upgrading ${assets.package}.\n`,
  );
  return 0;
}

// ---------------------------------------------------------------------------
// diff

export interface PostkitDiffOptions {
  readonly name?: string;
  /** Record the installed version as the new upstream base. */
  readonly accept?: boolean;
  /** Exit with 1 when upstream changed. */
  readonly exitCode?: boolean;
}

/** `postkit diff [name]`: what upstream changed since the copy was ejected. */
export function postkitDiff(
  io: PostkitCliIo,
  options: PostkitDiffOptions,
): number {
  const { projectRoot } = context(io);
  const lock = readEjectLock(projectRoot);
  const names = options.name
    ? [postkitComponentNames(options.name).pascal]
    : Object.keys(lock.components);
  if (names.length === 0) {
    io.stdout(`Nothing is ejected (no ${POSTKIT_EJECT_LOCK_FILE} entries).\n`);
    return 0;
  }
  let anyChanged = false;
  const accepted: Record<string, PostkitEjectLockEntry> = {};
  for (const name of names) {
    const entry = lock.components[name];
    if (!entry) {
      throw new PostkitCliError(
        `${name} isn't ejected here (no entry in ${POSTKIT_EJECT_LOCK_FILE}).`,
      );
    }
    const assets = readEjectAssets(projectRoot, entry.renderer);
    const installed = planPostkitEject(assets, name);
    const paths = [
      ...new Set([...Object.keys(entry.files), ...installed.keys()]),
    ].sort();
    const patches: string[] = [];
    for (const path of paths) {
      const before = entry.files[path]?.upstream ?? '';
      const after = installed.get(path) ?? '';
      const patch = unifiedDiff(before, after, {
        from: entry.files[path]
          ? `a/${path}\t${entry.package}@${entry.version}`
          : '/dev/null',
        to: installed.has(path)
          ? `b/${path}\t${assets.package}@${assets.version}`
          : '/dev/null',
      });
      if (patch) patches.push(patch);
    }
    const edited = Object.entries(entry.files)
      .filter(([path, file]) => {
        const local = join(projectRoot, entry.path, ...path.split('/'));
        return (
          !existsSync(local) ||
          sha256(readFileSync(local, 'utf8')) !== file.sha256
        );
      })
      .map(([path]) => path);

    io.stdout(
      `${name} (${entry.renderer}) in ${entry.path}: ${entry.package} ${
        entry.version === assets.version
          ? entry.version
          : `${entry.version} → ${assets.version}`
      }\n`,
    );
    if (patches.length === 0) {
      io.stdout('No upstream changes.\n');
    } else {
      anyChanged = true;
      io.stdout(`${patches.join('')}\n`);
      io.stdout(
        `${patches.length} file${patches.length === 1 ? '' : 's'} changed upstream. Your copy wasn't changed.\n`,
      );
    }
    if (edited.length > 0) {
      io.stdout(`Your edits: ${edited.join(', ')}.\n`);
    }
    if (options.accept) {
      const local = new Map<string, string>();
      for (const path of installed.keys()) {
        const file = join(projectRoot, entry.path, ...path.split('/'));
        local.set(path, existsSync(file) ? readFileSync(file, 'utf8') : '');
      }
      const next = postkitEjectLockEntry(
        assets,
        entry.renderer,
        entry.path,
        installed,
      );
      accepted[name] = {
        ...next,
        // The upstream base moves to the installed version, and the hashes
        // record your copy as it is now: later edits show against it.
        files: Object.fromEntries(
          Object.entries(next.files).map(([path, file]) => [
            path,
            { ...file, sha256: sha256(local.get(path) ?? '') },
          ]),
        ),
      };
      io.stdout(
        `✓ ${POSTKIT_EJECT_LOCK_FILE}   ${name} now tracks ${assets.package} ${assets.version}\n`,
      );
    }
    io.stdout('\n');
  }
  if (options.accept) {
    writeEjectLock(projectRoot, {
      ...lock,
      components: { ...lock.components, ...accepted },
    });
  }
  return options.exitCode && anyChanged ? 1 : 0;
}

// ---------------------------------------------------------------------------
// new

export interface PostkitNewOptions extends CommonOptions {
  readonly name: string;
  readonly to?: string;
  readonly chakra?: boolean;
  readonly spec?: boolean;
  readonly category?: string;
  readonly directive?: string;
  readonly description?: string;
  readonly importExtension?: string;
  readonly force?: boolean;
}

/** `postkit new <name>`: scaffolds a site component (rung 8). */
export function postkitNew(
  io: PostkitCliIo,
  options: PostkitNewOptions,
): number {
  const { projectRoot, show } = context(io);
  if (
    options.importExtension &&
    !['js', '.js', 'none', ''].includes(options.importExtension)
  ) {
    throw new PostkitCliError('--import-extension must be js or none.');
  }
  const scaffold = postkitComponentScaffold({
    name: options.name,
    chakra: options.chakra,
    spec: options.spec,
    category: options.category,
    directive: options.directive,
    description: options.description,
    importExtension: options.importExtension?.endsWith('js') ? '.js' : '',
  });
  const root = resolve(io.cwd, options.to ?? 'src/postkit');
  if (!options.force) {
    const clash = scaffold.files.find((file) =>
      existsSync(join(root, file.path)),
    );
    if (clash) {
      throw new PostkitCliError(
        `${show(join(root, clash.path))} already exists. Pass --force to overwrite it.`,
      );
    }
  }
  for (const file of scaffold.files) {
    const path = join(root, file.path);
    if (!options.dryRun) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.content);
    }
    io.stdout(`✓ ${show(path)}\n`);
  }
  let config: string | undefined;
  try {
    config = configSource(io, projectRoot, options.config).file;
  } catch (error) {
    if (!(error instanceof PostkitCliError)) throw error;
  }
  const base = config
    ? moduleSpecifier(config, join(root, 'x')).replace(/\/x$/, '')
    : `./${displayPath(io.cwd, root)}`;
  io.stdout(
    `\nRegister it with createPostkit({ components })${config ? ` in ${show(config)}` : ''}:\n\n` +
      `${postkitRegistrationSnippet(scaffold, base, { chakra: options.chakra })}\n\n` +
      `Use it as <${scaffold.name} /> in MDX or :::${scaffold.directive} in Markdown.\n` +
      `Import ${scaffold.folder}.css from your global stylesheet for the headless view.\n`,
  );
  return 0;
}

// ---------------------------------------------------------------------------
// manifest

export interface PostkitManifestOptions {
  readonly config?: string;
  readonly out?: string;
}

/** `postkit manifest`: the v2 manifest of the configured set. */
export async function postkitManifest(
  io: PostkitCliIo,
  options: PostkitManifestOptions,
): Promise<number> {
  const { projectRoot, show } = context(io);
  const location = findPostkitConfig(io.cwd, projectRoot, options.config);
  if (!location) {
    throw new PostkitCliError(
      'No Postkit config found. Pass --config <file>, or add postkit.config.ts exporting your createPostkit result.',
    );
  }
  const postkit = await loadPostkitConfig(location.path);
  const json = `${JSON.stringify(postkit.manifest(), null, 2)}\n`;
  if (options.out) {
    const path = resolve(io.cwd, options.out);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, json);
    io.stderr(`✓ ${show(path)}   from ${show(location.path)}\n`);
  } else {
    io.stdout(json);
  }
  return 0;
}

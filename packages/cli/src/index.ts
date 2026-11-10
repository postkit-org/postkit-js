/**
 * `@postkit/cli`: the `postkit` command (add, eject, diff, new, manifest) and
 * the scaffold templates `@postkit/nx` shares.
 *
 * @module
 */
export { processIo, runPostkitCli } from './lib/cli.js';
export {
  postkitAdd,
  postkitDiff,
  postkitEject,
  postkitManifest,
  postkitNew,
  type PostkitAddOptions,
  type PostkitCliIo,
  type PostkitDiffOptions,
  type PostkitEjectOptions,
  type PostkitManifestOptions,
  type PostkitNewOptions,
} from './lib/commands.js';
export {
  findPostkitConfig,
  postkitConfigFileNames,
  type PostkitConfigLocation,
  type PostkitConfigOrigin,
} from './lib/config.js';
export {
  POSTKIT_EJECT_LOCK_FILE,
  planPostkitEject,
  type PostkitEjectLock,
  type PostkitEjectLockEntry,
} from './lib/eject.js';
export {
  PostkitCliError,
  postkitComponentNames,
  type PostkitComponentNames,
} from './lib/names.js';
export {
  postkitRendererPackages,
  readEjectAssets,
  type PostkitEjectAssets,
  type PostkitRendererId,
} from './lib/project.js';
export {
  postkitComponentScaffold,
  postkitRegistrationSnippet,
  postkitRepoNextSteps,
  type PostkitComponentScaffold,
  type PostkitComponentScaffoldOptions,
  type PostkitScaffoldFile,
  type PostkitScaffoldLayout,
} from './lib/scaffold.js';
export { unifiedDiff } from './lib/unified-diff.js';

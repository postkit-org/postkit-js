/**
 * `@postkit/react/remark`: the build-time Markdown tooling, with no React
 * components. `postkitRemarkPlugins(postkit)` gives a `createPostkit` set its
 * plugins.
 *
 * @module
 */
export {
  postkitRemarkPlugins,
  type PostkitRemarkPluginsOptions,
} from './lib/postkit-remark-plugins.js';
export {
  createPostkitRemarkPlugins,
  createPostkitRemarkPreset,
  type PostkitRemarkPluginId,
  type PostkitRemarkPreset,
  type PostkitRemarkPresetOptions,
} from './lib/markdown-preset.js';
export {
  isPostkitComponentName,
  remarkPostkit,
  type PostkitDirectiveNode,
  type PostkitRemarkFootnoteDefaults,
  type PostkitUnavailableComponent,
  type PostkitVFileLike,
  type RemarkPostkitFootnoteOptions,
  type RemarkPostkitOptions,
} from './lib/remark-postkit.js';

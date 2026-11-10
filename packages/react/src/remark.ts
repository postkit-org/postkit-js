/**
 * `@postkit/react/remark`: the build-time Markdown tooling, with no React
 * components. `createPostkit().remarkPlugins` is built from it.
 *
 * @module
 */
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
  type PostkitUnavailableComponent,
  type PostkitVFileLike,
  type RemarkPostkitOptions,
} from './lib/remark-postkit.js';

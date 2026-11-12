/**
 * `@postkit/react/kits`: Postkit's six kits, one per catalog category
 * (03 §3.1, D2). A kit is a renderer-neutral list of definitions; pass kits
 * to `createPostkit`, and the renderer supplies their views. Each kit also
 * has its own entry point, such as `@postkit/react/kits/article`.
 *
 * @module
 */
import { article } from './article.js';
import { discovery } from './discovery.js';
import { engagement } from './engagement.js';
import { media } from './media.js';
import { publishing } from './publishing.js';
import { technical } from './technical.js';

export { article, discovery, engagement, media, publishing, technical };
export {
  definePostkitKit,
  type PostkitKit,
  type PostkitKitInput,
} from './kit.js';
export { postkitBuiltInKit } from './built-in-kit.js';

/** All six built-in kits, in catalog order. */
export const postkitKits = Object.freeze([
  article,
  technical,
  media,
  discovery,
  engagement,
  publishing,
] as const);

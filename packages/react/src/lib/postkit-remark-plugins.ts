import type { PluggableList } from 'unified';

import type { Postkit } from './create-postkit.js';
import {
  createPostkitRemarkPlugins,
  type PostkitRemarkPresetOptions,
} from './markdown-preset.js';
import type { RemarkPostkitOptions } from './remark-postkit.js';

/** Options for {@link postkitRemarkPlugins}: the preset's, minus the set. */
export type PostkitRemarkPluginsOptions = Omit<
  PostkitRemarkPresetOptions,
  'postkit'
> & {
  /**
   * `remarkPostkit`'s options (`strict`, `footnotes`…). The definitions and
   * unavailable components come from the `createPostkit` result. `false`
   * leaves directives untransformed.
   */
  readonly postkit?:
    false | Omit<RemarkPostkitOptions, 'definitions' | 'unavailable'>;
};

/**
 * The Remark plugins for a `createPostkit` set: Postkit's preset (GFM,
 * frontmatter, directives, `remarkPostkit`), with directives and MDX
 * validated against exactly the enabled components. Using a component the
 * renderer has no view for fails the build, naming it.
 *
 * It's build-time code: call it where Markdown compiles (an MDX loader, a
 * `getStaticProps`, a build script), not in the browser, so the Markdown
 * tooling stays out of the page's JavaScript.
 *
 * ```ts
 * import { postkitRemarkPlugins } from '@postkit/react/remark';
 * import { postkit } from './postkit';
 *
 * const remarkPlugins = postkitRemarkPlugins(postkit, { gfm: { singleTilde: false } });
 * ```
 */
export function postkitRemarkPlugins(
  postkit: Pick<Postkit, 'definitions' | 'unavailable'>,
  options: PostkitRemarkPluginsOptions = {},
): PluggableList {
  if (!postkit || !Array.isArray(postkit.definitions)) {
    throw new TypeError(
      'postkitRemarkPlugins: pass the result of createPostkit.',
    );
  }
  return createPostkitRemarkPlugins({
    ...options,
    postkit:
      options.postkit === false
        ? false
        : {
            ...options.postkit,
            definitions: postkit.definitions,
            unavailable: postkit.unavailable ?? [],
          },
  });
}

import {
  unified,
  type MarkdownProcessor,
  type RemarkPlugins,
  type UnifiedProcessorOptions,
  type UnifiedResolvedOptions,
} from '@astrojs/markdown-remark';
import {
  createPostkitRemarkPlugins,
  type PostkitRemarkPresetOptions,
} from '@postkit/react';

export interface PostkitAstroMdxOptions {
  readonly processor: MarkdownProcessor<UnifiedResolvedOptions>;
}

export interface PostkitAstroMdxProcessorOptions extends Omit<
  UnifiedProcessorOptions,
  'gfm' | 'remarkPlugins'
> {
  /**
   * Configures Postkit's ordered Remark preset, including custom plugins
   * through its `before` and `after` lists.
   */
  readonly postkit?: PostkitRemarkPresetOptions;
}

export function createPostkitAstroMdxOptions(
  options: PostkitAstroMdxProcessorOptions = {},
): PostkitAstroMdxOptions {
  const { postkit, ...processorOptions } = options;

  return {
    processor: unified({
      ...processorOptions,
      // Postkit's preset owns GFM so sites can configure its full option set.
      gfm: false,
      remarkPlugins: createPostkitRemarkPlugins(postkit) as RemarkPlugins,
    }),
  };
}

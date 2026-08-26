'use client';

import {
  Box,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';

import {
  postkitVideoRecipe,
  type PostkitVideoSlot,
} from '../recipes/video.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';

export interface VideoTrack {
  readonly src: string;
  readonly srcLang: string;
  readonly label: string;
  readonly kind?: 'captions' | 'chapters' | 'descriptions' | 'metadata';
  readonly default?: boolean;
}

export type VideoProps = {
  readonly src: string;
  readonly title: string;
  readonly poster?: string;
  readonly caption?: string;
  readonly aspectRatio?: string;
  readonly preload?: 'auto' | 'metadata' | 'none';
  readonly tracks?: readonly VideoTrack[];
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitVideoSlot>;
} & RecipeVariantProps<typeof postkitVideoRecipe> &
  UnstyledProp;

export function Video({
  src,
  title,
  poster,
  caption,
  aspectRatio = '16 / 9',
  preload = 'metadata',
  tracks = [],
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: VideoProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.video,
    postkitVideoRecipe,
  );
  const styles: PostkitSlotStyles<PostkitVideoSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};

  return (
    <Box
      as="figure"
      data-postkit-component="Video"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        className={recipe.classNameMap.frame}
        css={[styles.frame, slotStyles?.frame]}
      >
        <chakra.video
          className={recipe.classNameMap.player}
          src={src}
          title={title}
          poster={poster}
          preload={preload}
          controls
          playsInline
          css={[styles.player, { aspectRatio }, slotStyles?.player]}
        >
          {tracks.map((track) => (
            <track
              key={`${track.srcLang}:${track.src}`}
              src={track.src}
              srcLang={track.srcLang}
              label={track.label}
              kind={track.kind ?? 'captions'}
              default={track.default}
            />
          ))}
          <Link
            href={src}
            className={recipe.classNameMap.fallback}
            css={[styles.fallback, slotStyles?.fallback]}
          >
            Open {title}
          </Link>
        </chakra.video>
      </Box>
      {caption ? (
        <Text
          as="figcaption"
          className={recipe.classNameMap.caption}
          css={[styles.caption, slotStyles?.caption]}
        >
          {caption}
        </Text>
      ) : null}
    </Box>
  );
}

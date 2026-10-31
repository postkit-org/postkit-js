'use client';

import {
  Box,
  Heading,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';

import {
  postkitAudioRecipe,
  type PostkitAudioSlot,
} from '../recipes/audio.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

export type AudioProps = {
  readonly src: string;
  readonly title: string;
  readonly caption?: string;
  readonly preload?: 'auto' | 'metadata' | 'none';
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAudioSlot>;
} & RecipeVariantProps<typeof postkitAudioRecipe> &
  UnstyledProp;

export function Audio({
  src,
  title,
  caption,
  preload = 'metadata',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: AudioProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.audio,
    postkitAudioRecipe,
  );
  const styles: PostkitSlotStyles<PostkitAudioSlot> = unstyled
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
      data-postkit-component="Audio"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Heading
        as="p"
        size={postkitHeadingSize(size, { sm: 'sm', md: 'md', lg: 'lg' })}
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Heading>
      <chakra.audio
        className={recipe.classNameMap.player}
        src={src}
        aria-label={title}
        preload={preload}
        controls
        css={[styles.player, slotStyles?.player]}
      >
        <Link
          href={src}
          className={recipe.classNameMap.fallback}
          css={[styles.fallback, slotStyles?.fallback]}
        >
          Open {title}
        </Link>
      </chakra.audio>
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

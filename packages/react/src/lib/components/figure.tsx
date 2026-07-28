'use client';

import {
  Box,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';

import {
  postkitFigureRecipe,
  type PostkitFigureSlot,
} from '../recipes/figure.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';

export type PostkitFigureProps = {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly credit?: string;
  readonly creditHref?: string;
  readonly href?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly aspectRatio?: string;
  readonly objectFit?: 'contain' | 'cover';
  readonly objectPosition?: string;
  readonly loading?: 'eager' | 'lazy';
  readonly sizes?: string;
  readonly srcSet?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitFigureSlot>;
} & RecipeVariantProps<typeof postkitFigureRecipe> &
  UnstyledProp;

function numericDimension(value: number | string | undefined) {
  if (value === undefined) return undefined;
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}

export function PostkitFigure({
  src,
  alt,
  caption,
  credit,
  creditHref,
  href,
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  objectPosition,
  loading = 'lazy',
  sizes,
  srcSet,
  rootProps,
  slotStyles,
  size,
  variant,
  layout,
  unstyled,
}: PostkitFigureProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.figure,
    postkitFigureRecipe,
  );
  const styles: PostkitSlotStyles<PostkitFigureSlot> = unstyled
    ? {}
    : recipe({ size, variant, layout });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};

  const media = (
    <Box
      className={recipe.classNameMap.media}
      css={[
        styles.media,
        aspectRatio ? { aspectRatio } : undefined,
        slotStyles?.media,
      ]}
    >
      <Image
        src={src}
        alt={alt}
        htmlWidth={numericDimension(width)}
        htmlHeight={numericDimension(height)}
        loading={loading}
        decoding="async"
        sizes={sizes}
        srcSet={srcSet}
        fit={objectFit}
        align={objectPosition}
        className={recipe.classNameMap.image}
        css={[
          styles.image,
          aspectRatio ? { height: '100%' } : undefined,
          slotStyles?.image,
        ]}
      />
    </Box>
  );

  return (
    <Box
      as="figure"
      data-postkit-component="Figure"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {href ? (
        <Link
          href={href}
          aria-label={alt || caption || 'Open image'}
          className={recipe.classNameMap.mediaLink}
          css={[styles.mediaLink, slotStyles?.mediaLink]}
        >
          {media}
        </Link>
      ) : (
        media
      )}
      {caption || credit ? (
        <Box
          as="figcaption"
          className={recipe.classNameMap.figcaption}
          css={[styles.figcaption, slotStyles?.figcaption]}
        >
          {caption ? (
            <Text
              as="span"
              className={recipe.classNameMap.caption}
              css={[styles.caption, slotStyles?.caption]}
            >
              {caption}
            </Text>
          ) : null}
          {credit ? (
            <Text
              as="span"
              className={recipe.classNameMap.credit}
              css={[styles.credit, slotStyles?.credit]}
            >
              {creditHref ? (
                <Link
                  href={creditHref}
                  className={recipe.classNameMap.creditLink}
                  css={[styles.creditLink, slotStyles?.creditLink]}
                >
                  {credit}
                </Link>
              ) : (
                credit
              )}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

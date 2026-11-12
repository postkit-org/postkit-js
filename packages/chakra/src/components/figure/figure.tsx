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
import { figureDefinition } from '@postkit/core/components';
import { postkitImageDimension, usePostkitFigureNumber } from '@postkit/react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitFigureRecipe,
  type PostkitFigureSlot,
} from './figure.recipe.js';

export type FigureProps = {
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
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitFigureSlot, string>>>;
} & RecipeVariantProps<typeof postkitFigureRecipe> &
  UnstyledProp;

/** A responsive image with an optional caption and credit, styled by its Chakra recipe. */
export const Figure = postkitChakraView<typeof figureDefinition, FigureProps>(
  figureDefinition,
  postkitFigureRecipe,
  ({ props, part }) => {
    const { src, alt, caption, credit, creditHref, href, aspectRatio } = props;
    const figure = usePostkitFigureNumber();
    const media = (
      <Box
        {...part('media', {
          css: aspectRatio ? { aspectRatio } : undefined,
        })}
      >
        <Image
          src={src}
          alt={alt}
          htmlWidth={postkitImageDimension(props.width)}
          htmlHeight={postkitImageDimension(props.height)}
          loading={props.loading}
          decoding="async"
          sizes={props.sizes}
          srcSet={props.srcSet}
          fit={props.objectFit}
          align={props.objectPosition}
          {...part('image', {
            css: aspectRatio ? { height: '100%' } : undefined,
          })}
        />
      </Box>
    );

    return (
      <Box as="figure" {...part('root')}>
        {href ? (
          <Link
            href={href}
            aria-label={alt || caption || 'Open image'}
            {...part('mediaLink')}
          >
            {media}
          </Link>
        ) : (
          media
        )}
        {caption || credit || figure ? (
          <Box as="figcaption" {...part('figcaption')}>
            {figure ? (
              <Text as="span" {...part('number')}>
                {figure.label()}
              </Text>
            ) : null}
            {caption ? (
              <Text as="span" {...part('caption')}>
                {caption}
              </Text>
            ) : null}
            {credit ? (
              <Text as="span" {...part('credit')}>
                {creditHref ? (
                  <Link href={creditHref} {...part('creditLink')}>
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
  },
);

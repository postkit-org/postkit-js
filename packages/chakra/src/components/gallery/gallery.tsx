'use client';

import {
  Box,
  Heading,
  Image,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { galleryDefinition } from '@postkit/core/components';
import { usePostkitFigureNumber } from '@postkit/react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitGalleryRecipe,
  type PostkitGallerySlot,
} from './gallery.recipe.js';

export interface GalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly href?: string;
  readonly width?: number;
  readonly height?: number;
}

export type GalleryProps = {
  readonly items: string | readonly GalleryItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitGallerySlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitGallerySlot, string>>>;
} & RecipeVariantProps<typeof postkitGalleryRecipe> &
  UnstyledProp;

/** A responsive image gallery with captions and links, styled by its Chakra recipe. */
export const Gallery = postkitChakraView<
  typeof galleryDefinition,
  GalleryProps
>(galleryDefinition, postkitGalleryRecipe, ({ props, variants, part }) => {
  const { title, description, columns, presentation } = props;
  const items = parseJsonProp<GalleryItem>(props.items, 'Gallery items');
  const figure = usePostkitFigureNumber();
  const row = presentation === 'row';
  return (
    <Box {...part('root')}>
      {title || description ? (
        <Box {...part('header')}>
          {title ? (
            <Heading
              as="p"
              size={postkitHeadingSize(variants['size'], {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              {...part('title')}
            >
              {title}
            </Heading>
          ) : null}
          {description ? (
            <Text {...part('description')}>{description}</Text>
          ) : null}
        </Box>
      ) : null}
      <Box
        {...part('grid', { css: { '--postkit-gallery-columns': columns } })}
        {...(row
          ? { role: 'group', 'aria-label': title ?? 'Images', tabIndex: 0 }
          : undefined)}
      >
        {items.map((item, index) => {
          const image = (
            <Image
              src={item.src}
              alt={item.alt}
              htmlWidth={item.width}
              htmlHeight={item.height}
              loading="lazy"
              decoding="async"
              {...part('image')}
            />
          );
          return (
            <Box as="figure" {...part('item')} key={`${item.src}-${index}`}>
              {item.href ? (
                <Link
                  href={item.href}
                  aria-label={item.alt || item.caption || 'Open image'}
                  {...part('imageLink')}
                >
                  {image}
                </Link>
              ) : (
                image
              )}
              {item.caption || figure ? (
                <Box as="figcaption" {...part('caption')}>
                  {figure ? (
                    <chakra.span {...part('number')}>
                      {figure.label(index)}
                    </chakra.span>
                  ) : null}
                  {item.caption}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

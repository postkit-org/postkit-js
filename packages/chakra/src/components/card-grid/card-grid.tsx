'use client';

import {
  Box,
  Card,
  Heading,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { cardGridDefinition } from '@postkit/core/components';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitCardGridRecipe,
  type PostkitCardGridSlot,
} from './card-grid.recipe.js';

export interface CardItem {
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly meta?: string;
}

export type CardGridProps = {
  readonly items: string | readonly CardItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitCardGridSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitCardGridSlot, string>>>;
} & RecipeVariantProps<typeof postkitCardGridRecipe> &
  UnstyledProp;

/** A grid of related navigation cards, styled by its Chakra recipe. */
export const CardGrid = postkitChakraView<
  typeof cardGridDefinition,
  CardGridProps
>(cardGridDefinition, postkitCardGridRecipe, ({ props, variants, part }) => {
  const { title, description, columns } = props;
  const items = parseJsonProp<CardItem>(props.items, 'CardGrid items');
  return (
    <Box {...part('root')}>
      {title || description ? (
        <Box {...part('header')}>
          {title ? <Text {...part('title')}>{title}</Text> : null}
          {description ? (
            <Text {...part('description')}>{description}</Text>
          ) : null}
        </Box>
      ) : null}
      <Box {...part('grid', { css: { '--postkit-card-columns': columns } })}>
        {items.map((item, index) => (
          <Card.Root
            as="article"
            {...part('card')}
            key={`${item.title}-${index}`}
          >
            {item.image ? (
              <Image
                src={item.image.src}
                alt={item.image.alt}
                loading="lazy"
                {...part('image')}
              />
            ) : null}
            <Card.Body {...part('cardBody')}>
              <Heading
                as="p"
                size={postkitHeadingSize(variants['size'], {
                  sm: 'sm',
                  md: 'md',
                  lg: 'lg',
                })}
                {...part('cardTitle')}
              >
                {item.title}
              </Heading>
              {item.description ? (
                <Text {...part('cardDescription')}>{item.description}</Text>
              ) : null}
              {item.meta ? <Text {...part('meta')}>{item.meta}</Text> : null}
              {item.href ? (
                <Link href={item.href} {...part('link')}>
                  {item.linkLabel ?? 'Learn more'}
                  <Box as="span" aria-hidden="true">
                    {' '}
                    →
                  </Box>
                </Link>
              ) : null}
            </Card.Body>
          </Card.Root>
        ))}
      </Box>
    </Box>
  );
});

'use client';

import {
  Button,
  Card,
  Heading,
  Image,
  Link,
  RatingGroup,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { productCardDefinition } from '@postkit/core/components';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitProductCardRecipe,
  type PostkitProductCardSlot,
} from './product-card.recipe.js';

export type ProductCardProps = {
  readonly title: string;
  readonly description?: string;
  readonly href: string;
  readonly actionLabel?: string;
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly price?: string;
  readonly rating?: number | string;
  readonly badge?: string;
  readonly rel?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitProductCardSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitProductCardSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitProductCardRecipe> &
  UnstyledProp;

/**
 * A product or recommendation card with explicit commercial linking, styled
 * by its Chakra recipe.
 */
export const ProductCard = postkitChakraView<
  typeof productCardDefinition,
  ProductCardProps
>(
  productCardDefinition,
  postkitProductCardRecipe,
  ({ props, variants, part }) => {
    const { title, description, href, imageSrc, price, rating, badge } = props;
    return (
      <Card.Root as="article" {...part('root')}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={props.imageAlt === undefined ? '' : props.imageAlt}
            loading="lazy"
            {...part('image')}
          />
        ) : null}
        <Card.Body {...part('content')}>
          {badge ? <Text {...part('badge')}>{badge}</Text> : null}
          <Heading
            as="p"
            size={postkitHeadingSize(variants['size'], {
              sm: 'lg',
              md: 'xl',
              lg: '2xl',
            })}
            {...part('title')}
          >
            {title}
          </Heading>
          {description ? (
            <Text {...part('description')}>{description}</Text>
          ) : null}
          {rating ? (
            <RatingGroup.Root
              count={5}
              value={Number(rating)}
              allowHalf
              readOnly
              aria-label={`${rating} out of 5 stars`}
              {...part('rating')}
            >
              <RatingGroup.Control />
            </RatingGroup.Root>
          ) : null}
          <Card.Footer {...part('footer')}>
            {price ? <Text {...part('price')}>{price}</Text> : <span />}
            <Button
              asChild
              size={(variants['size'] as ProductCardProps['size']) ?? 'md'}
              variant="solid"
              {...part('action')}
            >
              <Link href={href} rel={props.rel}>
                {props.actionLabel}
              </Link>
            </Button>
          </Card.Footer>
        </Card.Body>
      </Card.Root>
    );
  },
);

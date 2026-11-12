'use client';

import {
  Card,
  Heading,
  Link,
  List,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { relatedContentDefinition } from '@postkit/core/components';
import type { RelatedContentItem } from '@postkit/react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitRelatedContentRecipe,
  type PostkitRelatedContentSlot,
} from './related-content.recipe.js';

export type { RelatedContentItem };

export type RelatedContentProps = {
  readonly items: string | readonly RelatedContentItem[];
  readonly title?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitRelatedContentSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitRelatedContentSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitRelatedContentRecipe> &
  UnstyledProp;

/** A semantic list of related articles or resources, styled by its Chakra recipe. */
export const RelatedContent = postkitChakraView<
  typeof relatedContentDefinition,
  RelatedContentProps
>(
  relatedContentDefinition,
  postkitRelatedContentRecipe,
  ({ props, variants, part }) => {
    const items = parseJsonProp<RelatedContentItem>(
      props.items,
      'RelatedContent items',
    );
    return (
      <Card.Root as="aside" {...part('root')}>
        <Heading
          as="p"
          size={postkitHeadingSize(variants['size'], {
            sm: 'md',
            md: 'lg',
            lg: 'xl',
          })}
          {...part('title')}
        >
          {props.title}
        </Heading>
        <List.Root as="ul" variant="plain" {...part('list')}>
          {items.map((item) => (
            <List.Item {...part('item')} key={item.href}>
              <Link href={item.href} {...part('link')}>
                <Heading
                  as="p"
                  size={postkitHeadingSize(variants['size'], {
                    sm: 'sm',
                    md: 'md',
                    lg: 'lg',
                  })}
                  {...part('itemTitle')}
                >
                  {item.title}
                </Heading>
                {item.description ? (
                  <Text {...part('description')}>{item.description}</Text>
                ) : null}
                {item.meta ? <Text {...part('meta')}>{item.meta}</Text> : null}
              </Link>
            </List.Item>
          ))}
        </List.Root>
      </Card.Root>
    );
  },
);

'use client';

import {
  Alert,
  Heading,
  List,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { keyTakeawayDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitKeyTakeawayRecipe,
  type PostkitKeyTakeawaySlot,
} from './key-takeaway.recipe.js';

export type KeyTakeawayProps = {
  readonly title?: string;
  readonly eyebrow?: string;
  readonly items?: string | readonly string[];
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitKeyTakeawaySlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitKeyTakeawaySlot, string>>
  >;
} & RecipeVariantProps<typeof postkitKeyTakeawayRecipe> &
  UnstyledProp;

/** A highlighted summary or list of essential points, styled by its Chakra recipe. */
export const KeyTakeaway = postkitChakraView<
  typeof keyTakeawayDefinition,
  KeyTakeawayProps
>(
  keyTakeawayDefinition,
  postkitKeyTakeawayRecipe,
  ({ props, variants, part }) => {
    const items = parseJsonProp<string>(props.items ?? [], 'KeyTakeaway items');
    return (
      <Alert.Root as="aside" status="info" {...part('root')}>
        <Alert.Content>
          {props.eyebrow ? (
            <Text {...part('eyebrow')}>{props.eyebrow}</Text>
          ) : null}
          <Alert.Title asChild>
            <Heading
              as="p"
              size={postkitHeadingSize(variants['size'], {
                sm: 'lg',
                md: 'xl',
                lg: '2xl',
              })}
              {...part('title')}
            >
              {props.title}
            </Heading>
          </Alert.Title>
          {props.children ? (
            <Alert.Description {...part('body')}>
              {props.children}
            </Alert.Description>
          ) : null}
          {items.length ? (
            <List.Root as="ul" {...part('list')}>
              {items.map((item, index) => (
                <List.Item {...part('item')} key={`${item}-${index}`}>
                  {item}
                </List.Item>
              ))}
            </List.Root>
          ) : null}
        </Alert.Content>
      </Alert.Root>
    );
  },
);

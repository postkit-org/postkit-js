'use client';

import {
  Box,
  Heading,
  List,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { stepsDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitStepsRecipe, type PostkitStepsSlot } from './steps.recipe.js';

export interface StepItem {
  readonly title: string;
  readonly description?: ReactNode;
}

export type StepsProps = {
  readonly items: string | readonly StepItem[];
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitStepsSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitStepsSlot, string>>>;
} & RecipeVariantProps<typeof postkitStepsRecipe> &
  UnstyledProp;

/** An ordered sequence of titled instructions, styled by its Chakra recipe. */
export const Steps = postkitChakraView<typeof stepsDefinition, StepsProps>(
  stepsDefinition,
  postkitStepsRecipe,
  ({ props, variants, part }) => {
    const items = parseJsonProp<StepItem>(props.items, 'Steps items');
    return (
      <List.Root as="ol" variant="plain" {...part('root')}>
        {items.map((item, index) => (
          <List.Item {...part('item')} key={`${item.title}-${index}`}>
            <Box aria-hidden="true" {...part('marker')}>
              {index + 1}
            </Box>
            <Box {...part('content')}>
              <Heading
                as="p"
                size={postkitHeadingSize(variants['size'], {
                  sm: 'sm',
                  md: 'md',
                  lg: 'lg',
                })}
                {...part('title')}
              >
                {item.title}
              </Heading>
              {item.description ? (
                <Box {...part('description')}>{item.description}</Box>
              ) : null}
            </Box>
          </List.Item>
        ))}
      </List.Root>
    );
  },
);

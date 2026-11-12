'use client';

import {
  Stat as ChakraStat,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { statDefinition } from '@postkit/core/components';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitStatRecipe, type PostkitStatSlot } from './stat.recipe.js';

export type StatProps = {
  readonly value: string | number;
  readonly label: string;
  readonly trend?: string;
  readonly description?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitStatSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitStatSlot, string>>>;
} & RecipeVariantProps<typeof postkitStatRecipe> &
  UnstyledProp;

/** A prominent metric with context and trend, styled by its Chakra recipe. */
export const Stat = postkitChakraView<typeof statDefinition, StatProps>(
  statDefinition,
  postkitStatRecipe,
  ({ props, variants, part }) => {
    const value = part('value');
    return (
      <ChakraStat.Root
        size={(variants['size'] as StatProps['size']) ?? 'md'}
        {...part('root')}
      >
        {/*
          A <dl> needs each <dt> before its <dd>s, and only <dt>/<dd> children
          (axe `definition-list`). The label is the term; the value, trend and
          description describe it. `order` keeps the value first on screen.
        */}
        <ChakraStat.Label {...part('label')}>{props.label}</ChakraStat.Label>
        <ChakraStat.ValueText {...value} css={[{ order: -1 }, ...value.css]}>
          {props.value}
        </ChakraStat.ValueText>
        {props.trend ? (
          <ChakraStat.HelpText as="dd" {...part('trend')}>
            {props.trend}
          </ChakraStat.HelpText>
        ) : null}
        {props.description ? (
          <ChakraStat.HelpText as="dd" {...part('description')}>
            {props.description}
          </ChakraStat.HelpText>
        ) : null}
      </ChakraStat.Root>
    );
  },
);

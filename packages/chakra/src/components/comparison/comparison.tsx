'use client';

import {
  Box,
  Heading,
  Table,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { comparisonDefinition } from '@postkit/core/components';
import { postkitComparisonValue, type ComparisonItem } from '@postkit/react';
import { useId } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitComparisonRecipe,
  type PostkitComparisonSlot,
} from './comparison.recipe.js';

export type { ComparisonItem };

export type ComparisonProps = {
  readonly columns: string | readonly string[];
  readonly items: string | readonly ComparisonItem[];
  readonly title?: string;
  readonly description?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitComparisonSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitComparisonSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitComparisonRecipe> &
  UnstyledProp;

/** An accessible feature and option comparison table, styled by its Chakra recipe. */
export const Comparison = postkitChakraView<
  typeof comparisonDefinition,
  ComparisonProps
>(
  comparisonDefinition,
  postkitComparisonRecipe,
  ({ props, variants, part }) => {
    const columns = parseJsonProp<string>(props.columns, 'Comparison columns');
    const items = parseJsonProp<ComparisonItem>(
      props.items,
      'Comparison items',
    );
    const titleId = `${useId()}-title`;
    return (
      <Box {...part('root')}>
        {props.title ? (
          <Heading
            as="p"
            id={titleId}
            size={postkitHeadingSize(variants['size'], {
              sm: 'lg',
              md: 'xl',
              lg: '2xl',
            })}
            {...part('title')}
          >
            {props.title}
          </Heading>
        ) : null}
        {props.description ? (
          <Text {...part('description')}>{props.description}</Text>
        ) : null}
        {/* The table scrolls sideways on narrow screens, so keyboard users need to reach it. */}
        <Box
          tabIndex={0}
          role="region"
          {...(props.title
            ? { 'aria-labelledby': titleId }
            : { 'aria-label': 'Comparison' })}
          {...part('scroller')}
        >
          <Table.Root
            size={(variants['size'] as ComparisonProps['size']) ?? 'md'}
            {...part('table')}
          >
            <Table.Header {...part('head')}>
              <Table.Row>
                <Table.ColumnHeader {...part('header')}>
                  Feature
                </Table.ColumnHeader>
                {columns.map((column) => (
                  <Table.ColumnHeader {...part('header')} key={column}>
                    {column}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row {...part('row')} key={item.label}>
                  <Table.ColumnHeader scope="row" {...part('label')}>
                    {item.label}
                  </Table.ColumnHeader>
                  {columns.map((_, index) => (
                    <Table.Cell {...part('value')} key={index}>
                      {postkitComparisonValue(item.values[index])}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    );
  },
);

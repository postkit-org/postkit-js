'use client';

import {
  Box,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { diffDefinition } from '@postkit/core/components';
import { postkitDiffLines } from '@postkit/react';
import { useId } from 'react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitDiffRecipe, type PostkitDiffSlot } from './diff.recipe.js';

export type DiffProps = {
  readonly diff: string;
  readonly title?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitDiffSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitDiffSlot, string>>>;
} & RecipeVariantProps<typeof postkitDiffRecipe> &
  UnstyledProp;

const lineTone = {
  addition: { background: 'green.subtle' },
  deletion: { background: 'red.subtle' },
  context: undefined,
} as const;

/** A semantic unified diff with additions and deletions, styled by its Chakra recipe. */
export const Diff = postkitChakraView<typeof diffDefinition, DiffProps>(
  diffDefinition,
  postkitDiffRecipe,
  ({ props, part }) => {
    const titleId = `${useId()}-title`;
    const { title } = props;
    return (
      <Box {...part('root')}>
        {title ? (
          <Box {...part('header')}>
            <Text id={titleId} {...part('title')}>
              {title}
            </Text>
          </Box>
        ) : null}
        {/* The code scrolls sideways on narrow screens, so keyboard users need to reach it. */}
        <Box
          as="pre"
          tabIndex={0}
          role="region"
          {...(title
            ? { 'aria-labelledby': titleId }
            : { 'aria-label': 'Diff' })}
          {...part('code')}
        >
          <Box as="code">
            {postkitDiffLines(props.diff).map((line, index) => (
              <Box
                as="span"
                data-diff={line.kind}
                {...part('line', { css: lineTone[line.kind] })}
                key={index}
              >
                <Box as="span" aria-hidden="true" {...part('marker')}>
                  {line.marker}
                </Box>
                <Box as="span" {...part('content')}>
                  {line.content}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  },
);

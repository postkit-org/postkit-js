'use client';

import {
  Box,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { terminalDefinition } from '@postkit/core/components';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitTerminalRecipe,
  type PostkitTerminalSlot,
} from './terminal.recipe.js';

export type TerminalProps = {
  readonly command: string;
  readonly output?: string;
  readonly prompt?: string;
  readonly title?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitTerminalSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitTerminalSlot, string>>>;
} & RecipeVariantProps<typeof postkitTerminalRecipe> &
  UnstyledProp;

/**
 * A terminal command and its optional output, styled by its Chakra recipe.
 * Without a registered recipe it still applies its own, so the window header
 * keeps its layout in host-native mode.
 */
export const Terminal = postkitChakraView<
  typeof terminalDefinition,
  TerminalProps
>(
  terminalDefinition,
  postkitTerminalRecipe,
  ({ props, part }) => (
    <Box {...part('root')}>
      <Box {...part('header')}>
        <Box aria-hidden="true" {...part('dots')}>
          ● ● ●
        </Box>
        <Text {...part('title')}>{props.title}</Text>
        <span />
      </Box>
      <Box {...part('body')}>
        <Box as="span" aria-hidden="true" {...part('prompt')}>
          {props.prompt}
        </Box>
        <Box as="code" {...part('command')}>
          {props.command}
        </Box>
        {props.output ? (
          <Box as="samp" {...part('output')}>
            {props.output}
          </Box>
        ) : null}
      </Box>
    </Box>
  ),
  { fallback: 'recipe' },
);

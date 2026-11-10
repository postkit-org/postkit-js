'use client';

import {
  Blockquote,
  Box,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { pullQuoteDefinition } from '@postkit/core/components';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitPullQuoteRecipe,
  type PostkitPullQuoteSlot,
} from './pull-quote.recipe.js';

export type PullQuoteProps = {
  readonly quote: string;
  readonly attribution?: string;
  readonly cite?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitPullQuoteSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitPullQuoteSlot, string>>>;
} & RecipeVariantProps<typeof postkitPullQuoteRecipe> &
  UnstyledProp;

/** A prominent quotation with optional attribution, styled by its Chakra recipe. */
export const PullQuote = postkitChakraView<
  typeof pullQuoteDefinition,
  PullQuoteProps
>(pullQuoteDefinition, postkitPullQuoteRecipe, ({ props, part }) => {
  const { quote, attribution, cite } = props;
  return (
    <Blockquote.Root {...part('root')}>
      <Blockquote.Icon {...part('mark')} />
      <Blockquote.Content {...part('quote')}>{quote}</Blockquote.Content>
      {attribution || cite ? (
        <Blockquote.Caption {...part('attribution')}>
          {attribution}
          {cite ? (
            <Box as="cite" {...part('cite')}>
              {attribution ? ` — ${cite}` : cite}
            </Box>
          ) : null}
        </Blockquote.Caption>
      ) : null}
    </Blockquote.Root>
  );
});

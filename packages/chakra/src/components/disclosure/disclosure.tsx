'use client';

import {
  Box,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { disclosureDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitDisclosureRecipe,
  type PostkitDisclosureSlot,
} from './disclosure.recipe.js';

const DisclosureRoot = chakra('details');
const DisclosureSummary = chakra('summary');

export type DisclosureProps = {
  readonly summary: string;
  readonly children?: ReactNode;
  readonly open?: boolean;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitDisclosureSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitDisclosureSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitDisclosureRecipe> &
  UnstyledProp;

/**
 * A progressively enhanced disclosure built on native `details` and `summary`.
 * It intentionally remains native so its toggle behavior works without
 * client-side JavaScript.
 */
export const Disclosure = postkitChakraView<
  typeof disclosureDefinition,
  DisclosureProps
>(disclosureDefinition, postkitDisclosureRecipe, ({ props, part }) => (
  <DisclosureRoot open={props.open} {...part('root')}>
    <DisclosureSummary {...part('summary')}>
      {props.summary}
      <Box as="span" aria-hidden="true" {...part('indicator')}>
        +
      </Box>
    </DisclosureSummary>
    <Box {...part('content')}>{props.children}</Box>
  </DisclosureRoot>
));

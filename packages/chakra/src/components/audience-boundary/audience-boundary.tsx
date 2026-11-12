'use client';

import {
  Box,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { audienceBoundaryDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitAudienceBoundaryRecipe,
  type PostkitAudienceBoundarySlot,
} from './audience-boundary.recipe.js';

export type AudienceBoundaryProps = {
  readonly audience: string;
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
  readonly authorized?: boolean;
  readonly showLabel?: boolean | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAudienceBoundarySlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitAudienceBoundarySlot, string>>
  >;
} & RecipeVariantProps<typeof postkitAudienceBoundaryRecipe> &
  UnstyledProp;

/**
 * An authored audience marker with a host-controlled visibility boundary,
 * styled by its Chakra recipe.
 */
export const AudienceBoundary = postkitChakraView<
  typeof audienceBoundaryDefinition,
  AudienceBoundaryProps
>(
  audienceBoundaryDefinition,
  postkitAudienceBoundaryRecipe,
  ({ props, part }) => {
    const { audience, showLabel } = props;
    const authorized = props.authorized === undefined ? true : props.authorized;
    return (
      <Box data-postkit-audience={audience} {...part('root')}>
        {showLabel === true || showLabel === 'true' ? (
          <Text {...part('label')}>Audience: {audience}</Text>
        ) : null}
        {authorized ? (
          <Box {...part('content')}>{props.children}</Box>
        ) : (
          <Box {...part('fallback')}>{props.fallback}</Box>
        )}
      </Box>
    );
  },
);

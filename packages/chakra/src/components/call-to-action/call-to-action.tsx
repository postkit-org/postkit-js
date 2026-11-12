'use client';

import {
  Box,
  Button,
  Heading,
  Link,
  Text,
  type BoxProps,
  type ButtonProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { callToActionDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitCallToActionRecipe,
  type PostkitCallToActionSlot,
} from './call-to-action.recipe.js';

export type CallToActionProps = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly primaryLabel?: string;
  readonly primaryHref?: string;
  readonly secondaryLabel?: string;
  readonly secondaryHref?: string;
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitCallToActionSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitCallToActionSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitCallToActionRecipe> &
  UnstyledProp;

/** A focused callout with up to two actions, styled by its Chakra recipe. */
export const CallToAction = postkitChakraView<
  typeof callToActionDefinition,
  CallToActionProps
>(
  callToActionDefinition,
  postkitCallToActionRecipe,
  ({ props, variants, part }) => {
    const {
      title,
      eyebrow,
      description,
      primaryLabel,
      primaryHref,
      secondaryLabel,
      secondaryHref,
      children,
    } = props;
    const buttonSize = (variants['size'] ?? 'md') as ButtonProps['size'];
    const hasActions =
      (primaryLabel && primaryHref) || (secondaryLabel && secondaryHref);

    return (
      <Box as="aside" {...part('root')}>
        <Box {...part('content')}>
          {eyebrow ? <Text {...part('eyebrow')}>{eyebrow}</Text> : null}
          <Heading
            as="h2"
            size={postkitHeadingSize(variants['size'], {
              sm: 'xl',
              md: '2xl',
              lg: '3xl',
            })}
            {...part('title')}
          >
            {title}
          </Heading>
          {description || children ? (
            <Box {...part('body')}>{children ?? description}</Box>
          ) : null}
        </Box>
        {hasActions ? (
          <Box {...part('actions')}>
            {primaryLabel && primaryHref ? (
              <Button
                asChild
                size={buttonSize}
                variant="solid"
                {...part('primaryAction')}
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Button
                asChild
                size={buttonSize}
                variant="outline"
                {...part('secondaryAction')}
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </Box>
        ) : null}
      </Box>
    );
  },
);

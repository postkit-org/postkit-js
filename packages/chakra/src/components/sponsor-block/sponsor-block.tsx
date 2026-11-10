'use client';

import {
  Box,
  Button,
  Card,
  Heading,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { sponsorBlockDefinition } from '@postkit/core/components';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitSponsorBlockRecipe,
  type PostkitSponsorBlockSlot,
} from './sponsor-block.recipe.js';

export type SponsorBlockProps = {
  readonly name: string;
  readonly message?: string;
  readonly href?: string;
  readonly actionLabel?: string;
  readonly logoSrc?: string;
  readonly logoAlt?: string;
  readonly disclosure?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitSponsorBlockSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitSponsorBlockSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitSponsorBlockRecipe> &
  UnstyledProp;

/** A clearly disclosed sponsor message and destination, styled by its Chakra recipe. */
export const SponsorBlock = postkitChakraView<
  typeof sponsorBlockDefinition,
  SponsorBlockProps
>(
  sponsorBlockDefinition,
  postkitSponsorBlockRecipe,
  ({ props, variants, part }) => {
    const { name, message, href, logoSrc, logoAlt, disclosure } = props;
    return (
      <Card.Root
        as="aside"
        aria-label={`${disclosure} by ${name}`}
        {...part('root')}
      >
        <Text {...part('disclosure')}>{disclosure}</Text>
        {logoSrc ? (
          <Image src={logoSrc} alt={logoAlt || name} {...part('logo')} />
        ) : null}
        <Box {...part('content')}>
          <Heading
            as="p"
            size={postkitHeadingSize(variants['size'], {
              sm: 'sm',
              md: 'md',
              lg: 'lg',
            })}
            {...part('name')}
          >
            {name}
          </Heading>
          {message ? <Text {...part('message')}>{message}</Text> : null}
          {href ? (
            <Button
              asChild
              size={(variants['size'] as SponsorBlockProps['size']) ?? 'md'}
              variant="outline"
              {...part('action')}
            >
              <Link href={href} rel="sponsored">
                {props.actionLabel}
              </Link>
            </Button>
          ) : null}
        </Box>
      </Card.Root>
    );
  },
);

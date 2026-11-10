'use client';

import {
  Box,
  Heading,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { seriesNavigationDefinition } from '@postkit/core/components';
import { postkitSeriesLink, type SeriesLink } from '@postkit/react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitSeriesNavigationRecipe,
  type PostkitSeriesNavigationSlot,
} from './series-navigation.recipe.js';

export type { SeriesLink };

export type SeriesNavigationProps = {
  readonly title: string;
  readonly current?: number | string;
  readonly total?: number | string;
  readonly previous?: SeriesLink | string;
  readonly next?: SeriesLink | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitSeriesNavigationSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitSeriesNavigationSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitSeriesNavigationRecipe> &
  UnstyledProp;

/** Previous and next navigation for a named article series, styled by its Chakra recipe. */
export const SeriesNavigation = postkitChakraView<
  typeof seriesNavigationDefinition,
  SeriesNavigationProps
>(
  seriesNavigationDefinition,
  postkitSeriesNavigationRecipe,
  ({ props, variants, part }) => {
    const { title, current, total } = props;
    const headingSize = postkitHeadingSize(variants['size'], {
      sm: 'sm',
      md: 'md',
      lg: 'lg',
    });
    const renderLink = (
      link: SeriesLink | undefined,
      direction: 'Previous' | 'Next',
    ) =>
      link ? (
        <Link
          href={link.href}
          rel={direction === 'Previous' ? 'prev' : 'next'}
          {...part('link')}
        >
          <Text {...part('direction')}>{direction}</Text>
          <Heading as="span" size={headingSize} {...part('linkTitle')}>
            {link.title}
          </Heading>
        </Link>
      ) : (
        <span />
      );
    return (
      <Box as="nav" aria-label={`${title} series navigation`} {...part('root')}>
        <Box {...part('header')}>
          <Heading as="p" size={headingSize} {...part('title')}>
            {title}
          </Heading>
          {current && total ? (
            <Text {...part('position')}>
              {current} of {total}
            </Text>
          ) : null}
        </Box>
        <Box {...part('links')}>
          {renderLink(postkitSeriesLink(props.previous), 'Previous')}
          {renderLink(postkitSeriesLink(props.next), 'Next')}
        </Box>
      </Box>
    );
  },
);

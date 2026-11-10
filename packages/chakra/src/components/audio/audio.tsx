'use client';

import {
  Box,
  Heading,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { audioDefinition } from '@postkit/core/components';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitAudioRecipe, type PostkitAudioSlot } from './audio.recipe.js';

export type AudioProps = {
  readonly src: string;
  readonly title: string;
  readonly caption?: string;
  readonly preload?: 'auto' | 'metadata' | 'none';
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAudioSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitAudioSlot, string>>>;
} & RecipeVariantProps<typeof postkitAudioRecipe> &
  UnstyledProp;

/** An accessible audio player, styled by its Chakra recipe. */
export const Audio = postkitChakraView<typeof audioDefinition, AudioProps>(
  audioDefinition,
  postkitAudioRecipe,
  ({ props, variants, part }) => (
    <Box as="figure" {...part('root')}>
      <Heading
        as="p"
        size={postkitHeadingSize(variants['size'], {
          sm: 'sm',
          md: 'md',
          lg: 'lg',
        })}
        {...part('title')}
      >
        {props.title}
      </Heading>
      <chakra.audio
        src={props.src}
        aria-label={props.title}
        preload={props.preload}
        controls
        {...part('player')}
      >
        <Link href={props.src} {...part('fallback')}>
          Open {props.title}
        </Link>
      </chakra.audio>
      {props.caption ? (
        <Text as="figcaption" {...part('caption')}>
          {props.caption}
        </Text>
      ) : null}
    </Box>
  ),
);

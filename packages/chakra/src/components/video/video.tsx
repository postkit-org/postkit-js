'use client';

import {
  AspectRatio,
  Box,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { videoDefinition } from '@postkit/core/components';

import { numericAspectRatio } from '../../lib/components/aspect-ratio.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import { postkitVideoRecipe, type PostkitVideoSlot } from './video.recipe.js';

export interface VideoTrack {
  readonly src: string;
  readonly srcLang: string;
  readonly label: string;
  readonly kind?: 'captions' | 'chapters' | 'descriptions' | 'metadata';
  readonly default?: boolean;
}

export type VideoProps = {
  readonly src: string;
  readonly title: string;
  readonly poster?: string;
  readonly caption?: string;
  readonly aspectRatio?: string;
  readonly preload?: 'auto' | 'metadata' | 'none';
  readonly tracks?: readonly VideoTrack[];
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitVideoSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitVideoSlot, string>>>;
} & RecipeVariantProps<typeof postkitVideoRecipe> &
  UnstyledProp;

/** A responsive native video player, styled by its Chakra recipe. */
export const Video = postkitChakraView<typeof videoDefinition, VideoProps>(
  videoDefinition,
  postkitVideoRecipe,
  ({ props, part }) => (
    <Box as="figure" {...part('root')}>
      <AspectRatio
        ratio={numericAspectRatio(props.aspectRatio)}
        {...part('frame')}
      >
        <chakra.video
          src={props.src}
          title={props.title}
          poster={props.poster}
          preload={props.preload}
          controls
          playsInline
          {...part('player')}
        >
          {(props.tracks ?? []).map((track) => (
            <track
              key={`${track.srcLang}:${track.src}`}
              src={track.src}
              srcLang={track.srcLang}
              label={track.label}
              kind={track.kind ?? 'captions'}
              default={track.default}
            />
          ))}
          <Link href={props.src} {...part('fallback')}>
            Open {props.title}
          </Link>
        </chakra.video>
      </AspectRatio>
      {props.caption ? (
        <Text as="figcaption" {...part('caption')}>
          {props.caption}
        </Text>
      ) : null}
    </Box>
  ),
);

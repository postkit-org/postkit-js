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
import {
  postkitVideoDuration,
  videoDefinition,
} from '@postkit/core/components';
import { usePostkitFigureNumber } from '@postkit/react';

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
  /** The captions track (a WebVTT file URL). */
  readonly captions?: string;
  /** The captions track's language, such as `en`. */
  readonly captionsLang?: string;
  /** The running time, such as `0:24` or `PT24S`, shown with the caption. */
  readonly duration?: string;
  /** No speech or meaningful sound, so no captions track is needed (D20). */
  readonly decorative?: boolean | 'false' | 'true';
  /** More text tracks; `captions` adds the captions track for you. */
  readonly tracks?: readonly VideoTrack[];
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitVideoSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitVideoSlot, string>>>;
} & RecipeVariantProps<typeof postkitVideoRecipe> &
  UnstyledProp;

/**
 * A responsive native video player, styled by its Chakra recipe. `captions`
 * adds a captions track; without one (or `tracks`), development builds warn
 * unless the video is `decorative` (D20). `duration` shows with the caption,
 * and beneath `figures="numbered"` the video's number leads it.
 */
export const Video = postkitChakraView<typeof videoDefinition, VideoProps>(
  videoDefinition,
  postkitVideoRecipe,
  ({ props, part }) => {
    const figure = usePostkitFigureNumber();
    const duration = postkitVideoDuration(props.duration);
    return (
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
            {props.captions ? (
              <track
                src={props.captions}
                srcLang={props.captionsLang}
                label="Captions"
                kind="captions"
                default
              />
            ) : null}
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
        {props.caption || duration || figure ? (
          <Text as="figcaption" {...part('caption')}>
            {figure ? (
              <chakra.span {...part('number')}>{figure.label()}</chakra.span>
            ) : null}
            {props.caption}
            {duration ? (
              <chakra.time {...part('duration')} dateTime={duration.dateTime}>
                {duration.text}
              </chakra.time>
            ) : null}
          </Text>
        ) : null}
      </Box>
    );
  },
);

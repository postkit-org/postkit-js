import { audioDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type AudioSlot = PostkitSlotOf<typeof audioDefinition>;

export type AudioProps = PostkitViewProps<typeof audioDefinition>;

/**
 * An accessible native audio player with a title, an optional caption and a
 * download link for browsers without audio support. Headless markup only.
 */
export const Audio = postkitView<typeof audioDefinition, AudioProps>(
  audioDefinition,
  ({ props, part }) => (
    <figure {...part('root')}>
      <p {...part('title')}>{props.title}</p>
      <audio
        {...part('player')}
        src={props.src}
        aria-label={props.title}
        preload={props.preload}
        controls
      >
        <a {...part('fallback')} href={props.src}>
          Open {props.title}
        </a>
      </audio>
      {props.caption ? (
        <figcaption {...part('caption')}>{props.caption}</figcaption>
      ) : null}
    </figure>
  ),
);

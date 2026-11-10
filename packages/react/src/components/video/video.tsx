import { videoDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** A text track for the video: captions by default. */
export interface VideoTrack {
  readonly src: string;
  readonly srcLang: string;
  readonly label: string;
  readonly kind?: 'captions' | 'chapters' | 'descriptions' | 'metadata';
  readonly default?: boolean;
}

export type VideoSlot = PostkitSlotOf<typeof videoDefinition>;

export type VideoProps = PostkitViewProps<typeof videoDefinition> & {
  readonly tracks?: readonly VideoTrack[];
};

/**
 * A native video player with text tracks, an optional caption and a link for
 * browsers without video support. Headless markup only; the frame's
 * `aspectRatio` applies as an inline style, since it is content, not theme.
 */
export const Video = postkitView<typeof videoDefinition, VideoProps>(
  videoDefinition,
  ({ props, part }) => (
    <figure {...part('root')}>
      <div {...part('frame', { style: { aspectRatio: props.aspectRatio } })}>
        <video
          {...part('player')}
          src={props.src}
          title={props.title}
          poster={props.poster}
          preload={props.preload}
          controls
          playsInline
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
          <a {...part('fallback')} href={props.src}>
            Open {props.title}
          </a>
        </video>
      </div>
      {props.caption ? (
        <figcaption {...part('caption')}>{props.caption}</figcaption>
      ) : null}
    </figure>
  ),
);

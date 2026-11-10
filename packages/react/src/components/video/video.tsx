import {
  postkitVideoDuration,
  videoDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { usePostkitFigureNumber } from '../../lib/figures.js';
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

export type VideoProps = Omit<
  PostkitViewProps<typeof videoDefinition>,
  'decorative'
> & {
  /** More text tracks; `captions` adds the captions track for you. */
  readonly tracks?: readonly VideoTrack[];
  /** No speech or meaningful sound, so no captions track is needed. */
  readonly decorative?: boolean | 'false' | 'true';
};

/**
 * A native video player with text tracks, an optional caption and a link for
 * browsers without video support. Headless markup only; the frame's
 * `aspectRatio` applies as an inline style, since it is content, not theme.
 *
 * `captions` adds a captions track. Without one (or `tracks`), development
 * builds warn unless the video is `decorative` (D20). `duration` shows with
 * the caption as a `<time>`, and beneath `figures="numbered"` the video's
 * number ("Fig. 2") leads it.
 */
export const Video = postkitView<typeof videoDefinition, VideoProps>(
  videoDefinition,
  ({ props, part }) => {
    const figure = usePostkitFigureNumber();
    const duration = postkitVideoDuration(props.duration);
    return (
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
            <a {...part('fallback')} href={props.src}>
              Open {props.title}
            </a>
          </video>
        </div>
        {props.caption || duration || figure ? (
          <figcaption {...part('caption')}>
            {figure ? <span {...part('number')}>{figure.label()}</span> : null}
            {props.caption}
            {duration ? (
              <time {...part('duration')} dateTime={duration.dateTime}>
                {duration.text}
              </time>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);

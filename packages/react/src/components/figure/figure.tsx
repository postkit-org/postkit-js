import { figureDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type FigureSlot = PostkitSlotOf<typeof figureDefinition>;

export type FigureProps = Omit<
  PostkitViewProps<typeof figureDefinition>,
  'height' | 'width'
> & {
  /** The intrinsic image width in pixels. Numeric strings are accepted. */
  readonly width?: number | string;
  /** The intrinsic image height in pixels. Numeric strings are accepted. */
  readonly height?: number | string;
};

/** A positive whole number of pixels, or `undefined`. */
export function postkitImageDimension(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}

/**
 * A responsive image with an optional caption and credit: headless markup
 * only. `aspectRatio`, `objectFit` and `objectPosition` apply as inline
 * styles, since they are content, not theme.
 */
export const Figure = postkitView<typeof figureDefinition, FigureProps>(
  figureDefinition,
  ({ props, part }) => {
    const {
      src,
      alt,
      caption,
      credit,
      creditHref,
      href,
      aspectRatio,
      objectFit,
      objectPosition,
    } = props;
    const media = (
      <div
        {...part('media', { style: aspectRatio ? { aspectRatio } : undefined })}
      >
        <img
          {...part('image', {
            style: {
              objectFit,
              objectPosition,
              ...(aspectRatio ? { height: '100%' } : undefined),
            },
          })}
          src={src}
          alt={alt}
          width={postkitImageDimension(props.width)}
          height={postkitImageDimension(props.height)}
          loading={props.loading}
          decoding="async"
          sizes={props.sizes}
          srcSet={props.srcSet}
        />
      </div>
    );

    return (
      <figure {...part('root')}>
        {href ? (
          <a
            {...part('mediaLink')}
            href={href}
            aria-label={alt || caption || 'Open image'}
          >
            {media}
          </a>
        ) : (
          media
        )}
        {caption || credit ? (
          <figcaption {...part('figcaption')}>
            {caption ? <span {...part('caption')}>{caption}</span> : null}
            {credit ? (
              <span {...part('credit')}>
                {creditHref ? (
                  <a {...part('creditLink')} href={creditHref}>
                    {credit}
                  </a>
                ) : (
                  credit
                )}
              </span>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);

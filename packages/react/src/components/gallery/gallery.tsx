import {
  galleryDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { CSSProperties } from 'react';

import { usePostkitFigureNumber } from '../../lib/figures.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { postkitImageDimension } from '../figure/figure.js';

export type GallerySlot = PostkitSlotOf<typeof galleryDefinition>;

export interface GalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly href?: string;
  readonly width?: number;
  readonly height?: number;
}

export type GalleryProps = Omit<
  PostkitViewProps<typeof galleryDefinition>,
  'columns' | 'items'
> & {
  /** The images, or authored JSON text for them. */
  readonly items: string | readonly GalleryItem[];
  /** The preferred desktop column count. Numbers are accepted. */
  readonly columns?: '1' | '2' | '3' | '4' | 1 | 2 | 3 | 4;
};

/**
 * A responsive image gallery with captions and links: headless markup only.
 * The column count is the `--postkit-gallery-columns` custom property on the
 * grid part. `presentation: 'row'` sets 2–3 related items side by side (a
 * horizontal snap rail on phones, focusable so keyboards can scroll it).
 * Beneath `figures="numbered"`, the gallery is one figure: its items read
 * "Fig. 1", "Fig. 1b", "Fig. 1c"….
 */
export const Gallery = postkitView<typeof galleryDefinition, GalleryProps>(
  galleryDefinition,
  ({ props, part }) => {
    const { title, description, columns, presentation } = props;
    const items = postkitJsonItems<GalleryItem>(props.items, 'Gallery items');
    const figure = usePostkitFigureNumber();
    const row = presentation === 'row';
    return (
      <div {...part('root')}>
        {title || description ? (
          <div {...part('header')}>
            {title ? <p {...part('title')}>{title}</p> : null}
            {description ? <p {...part('description')}>{description}</p> : null}
          </div>
        ) : null}
        <div
          {...part('grid', {
            style: { '--postkit-gallery-columns': columns } as CSSProperties,
          })}
          {...(row
            ? {
                role: 'group',
                'aria-label': title ?? 'Images',
                tabIndex: 0,
              }
            : undefined)}
        >
          {items.map((item, index) => {
            const image = (
              <img
                {...part('image')}
                src={item.src}
                alt={item.alt}
                width={postkitImageDimension(item.width)}
                height={postkitImageDimension(item.height)}
                loading="lazy"
                decoding="async"
              />
            );
            return (
              <figure {...part('item')} key={`${item.src}-${index}`}>
                {item.href ? (
                  <a
                    {...part('imageLink')}
                    href={item.href}
                    aria-label={item.alt || item.caption || 'Open image'}
                  >
                    {image}
                  </a>
                ) : (
                  image
                )}
                {item.caption || figure ? (
                  <figcaption {...part('caption')}>
                    {figure ? (
                      <span {...part('number')}>{figure.label(index)}</span>
                    ) : null}
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </div>
    );
  },
);

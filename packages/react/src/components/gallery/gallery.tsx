import {
  galleryDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { CSSProperties } from 'react';

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
 * grid part.
 */
export const Gallery = postkitView<typeof galleryDefinition, GalleryProps>(
  galleryDefinition,
  ({ props, part }) => {
    const { title, description, columns } = props;
    const items = postkitJsonItems<GalleryItem>(props.items, 'Gallery items');
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
                {item.caption ? (
                  <figcaption {...part('caption')}>{item.caption}</figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </div>
    );
  },
);

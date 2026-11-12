import {
  cardGridDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { CSSProperties } from 'react';

import { postkitJsonItems } from '../../lib/json-items.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type CardGridSlot = PostkitSlotOf<typeof cardGridDefinition>;

export interface CardItem {
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly meta?: string;
}

export type CardGridProps = Omit<
  PostkitViewProps<typeof cardGridDefinition>,
  'columns' | 'items'
> & {
  /** The cards, or authored JSON text for them. */
  readonly items: string | readonly CardItem[];
  /** The preferred desktop column count. Numbers are accepted. */
  readonly columns?: '1' | '2' | '3' | '4' | 1 | 2 | 3 | 4;
};

/**
 * A grid of related navigation cards: headless markup only. The column count
 * is the `--postkit-card-columns` custom property on the grid part.
 */
export const CardGrid = postkitView<typeof cardGridDefinition, CardGridProps>(
  cardGridDefinition,
  ({ props, part }) => {
    const { title, description, columns } = props;
    const items = postkitJsonItems<CardItem>(props.items, 'CardGrid items');
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
            style: { '--postkit-card-columns': columns } as CSSProperties,
          })}
        >
          {items.map((item, index) => (
            <article {...part('card')} key={`${item.title}-${index}`}>
              {item.image ? (
                <img
                  {...part('image')}
                  src={item.image.src}
                  alt={item.image.alt}
                  loading="lazy"
                />
              ) : null}
              <div {...part('cardBody')}>
                <p {...part('cardTitle')}>{item.title}</p>
                {item.description ? (
                  <p {...part('cardDescription')}>{item.description}</p>
                ) : null}
                {item.meta ? <p {...part('meta')}>{item.meta}</p> : null}
                {item.href ? (
                  <a {...part('link')} href={item.href}>
                    {item.linkLabel ?? 'Learn more'}
                    <span aria-hidden="true"> →</span>
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  },
);

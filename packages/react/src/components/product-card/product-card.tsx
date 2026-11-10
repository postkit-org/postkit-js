import {
  productCardDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type ProductCardSlot = PostkitSlotOf<typeof productCardDefinition>;
export type ProductCardProps = Omit<
  PostkitViewProps<typeof productCardDefinition>,
  'rating'
> & {
  /** A five-point rating. Numeric strings are accepted. */
  readonly rating?: number | string;
};

/** Five stars for a rating, filled to the nearest whole star. */
function stars(rating: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * A product or recommendation card with explicit commercial linking:
 * headless markup only. The rating is a labelled image of five stars.
 */
export const ProductCard = postkitView<
  typeof productCardDefinition,
  ProductCardProps
>(productCardDefinition, ({ props, part }) => {
  const { title, description, href, imageSrc, price, rating, badge } = props;
  return (
    <article {...part('root')}>
      {imageSrc ? (
        <img
          {...part('image')}
          src={imageSrc}
          alt={props.imageAlt === undefined ? '' : props.imageAlt}
          loading="lazy"
        />
      ) : null}
      <div {...part('content')}>
        {badge ? <p {...part('badge')}>{badge}</p> : null}
        <p {...part('title')}>{title}</p>
        {description ? <p {...part('description')}>{description}</p> : null}
        {rating ? (
          <span
            {...part('rating')}
            role="img"
            aria-label={`${rating} out of 5 stars`}
          >
            {stars(Number(rating))}
          </span>
        ) : null}
        <div {...part('footer')}>
          {price ? <p {...part('price')}>{price}</p> : <span />}
          <a {...part('action')} href={href} rel={props.rel}>
            {props.actionLabel}
          </a>
        </div>
      </div>
    </article>
  );
});

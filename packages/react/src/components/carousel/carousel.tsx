import {
  carouselDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { Children, type ReactNode } from 'react';

import { useCarousel } from '../../hooks/use-carousel.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import {
  postkitView,
  type PostkitPartGetter,
  type PostkitViewProps,
} from '../../lib/view.js';

export type CarouselSlot = PostkitSlotOf<typeof carouselDefinition>;

/** One authored carousel slide. */
export interface CarouselItem {
  readonly id?: string;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly title?: string;
  readonly description?: string;
  readonly href?: string;
}

export type CarouselProps = Omit<
  PostkitViewProps<typeof carouselDefinition>,
  'items' | 'initialIndex'
> & {
  /** The slides, or authored JSON text for them. Children are used without. */
  readonly items?: string | readonly CarouselItem[];
  /** The first slide shown: a number, or a string from a directive. */
  readonly initialIndex?: number | string;
};

type CarouselPart = PostkitPartGetter<CarouselSlot>;

function itemContent(item: CarouselItem, part: CarouselPart): ReactNode {
  const content = (
    <div>
      {item.image ? (
        <img {...part('media')} src={item.image.src} alt={item.image.alt} />
      ) : null}
      {item.title || item.description ? (
        <div {...part('content')}>
          {item.title ? <h3 {...part('title')}>{item.title}</h3> : null}
          {item.description ? (
            <p {...part('description')}>{item.description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  return item.href ? (
    <a {...part('link')} href={item.href}>
      {content}
    </a>
  ) : (
    content
  );
}

function CarouselSlides({
  label,
  initialIndex,
  slides,
  part,
}: {
  readonly label?: string;
  readonly initialIndex?: number | string;
  readonly slides: readonly ReactNode[];
  readonly part: CarouselPart;
}) {
  const api = useCarousel({ slideCount: slides.length, initialIndex });
  return (
    <div
      {...mergePostkitPartProps(
        api.getRootProps(),
        { 'aria-label': label },
        part('root'),
      )}
    >
      <div {...api.getItemGroupProps()}>
        {slides.map((slide, index) => (
          <div
            {...mergePostkitPartProps(
              api.getItemProps({ index }),
              part('slide'),
            )}
            key={index}
          >
            {slide}
          </div>
        ))}
      </div>
      <div {...mergePostkitPartProps(api.getControlProps(), part('controls'))}>
        <button
          {...mergePostkitPartProps(
            api.getPrevTriggerProps(),
            part('previousTrigger'),
          )}
        >
          Previous
        </button>
        <div aria-live="polite" {...part('status')}>
          {api.getProgressText()}
        </div>
        <button
          {...mergePostkitPartProps(
            api.getNextTriggerProps(),
            part('nextTrigger'),
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * A keyboard-operable carousel of items or children: headless markup over
 * {@link useCarousel}. Previous and next buttons wrap, the viewport pages with
 * arrow keys, Home and End, and the status part announces "n / total".
 */
export const Carousel = postkitView<typeof carouselDefinition, CarouselProps>(
  carouselDefinition,
  ({ props, part }) => {
    const itemSlides = props.items
      ? postkitJsonItems<CarouselItem>(props.items, 'Carousel items').map(
          (item) => itemContent(item, part),
        )
      : [];
    const slides =
      itemSlides.length > 0 ? itemSlides : Children.toArray(props.children);

    if (slides.length === 0) {
      return (
        <div role="note" {...part('root')}>
          <p {...part('emptyState')}>This carousel does not have any slides.</p>
        </div>
      );
    }

    return (
      <CarouselSlides
        label={props.label}
        initialIndex={props.initialIndex}
        slides={slides}
        part={part}
      />
    );
  },
);

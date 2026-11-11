import { carouselItemSnapAlign } from '@postkit/core/behaviors';
import {
  carouselDefinition,
  postkitTitleElement,
  type PostkitHeadingLevelInput,
  type PostkitSlotOf,
  type PostkitTitleElement,
} from '@postkit/core/components';
import { Children, type ReactNode } from 'react';

import { useCarousel } from '../../hooks/use-carousel.js';
import {
  usePostkitFigureNumber,
  type PostkitFigureNumber,
} from '../../lib/figures.js';
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
  /** The item's caption: below the current item in `peek`, in the slide otherwise. */
  readonly caption?: string;
  readonly href?: string;
}

export type CarouselProps = Omit<
  PostkitViewProps<typeof carouselDefinition>,
  'items' | 'initialIndex' | 'headingLevel'
> & {
  /**
   * Renders each item title as `h2` to `h6`. Unset, item titles are `p`, so
   * the carousel never breaks the page's heading outline.
   */
  readonly headingLevel?: PostkitHeadingLevelInput;
  /** The slides, or authored JSON text for them. Children are used without. */
  readonly items?: string | readonly CarouselItem[];
  /** The first slide shown: a number, or a string from a directive. */
  readonly initialIndex?: number | string;
};

type CarouselPart = PostkitPartGetter<CarouselSlot>;

/**
 * One item's slide. In `slides`, its caption (and figure number) sit in the
 * slide; in `peek` they move below the current item ({@link CarouselSlides}).
 */
function itemContent(
  item: CarouselItem,
  part: CarouselPart,
  Title: PostkitTitleElement,
  caption?: { readonly number?: string; readonly text?: string },
): ReactNode {
  const showCaption = Boolean(caption?.number || caption?.text);
  const content = (
    <div>
      {item.image ? (
        <img {...part('media')} src={item.image.src} alt={item.image.alt} />
      ) : null}
      {item.title || item.description || showCaption ? (
        <div {...part('content')}>
          {item.title ? <Title {...part('title')}>{item.title}</Title> : null}
          {item.description ? (
            <p {...part('description')}>{item.description}</p>
          ) : null}
          {showCaption ? (
            <p {...part('caption')}>
              {caption?.number ? (
                <span {...part('number')}>{caption.number}</span>
              ) : null}
              {caption?.text}
            </p>
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
  presentation,
  slides,
  captions,
  figure,
  part,
}: {
  readonly label?: string;
  readonly initialIndex?: number | string;
  readonly presentation: 'peek' | 'slides';
  readonly slides: readonly ReactNode[];
  /** Each slide's caption, shown below the current one in `peek`. */
  readonly captions: readonly (string | undefined)[];
  readonly figure?: PostkitFigureNumber;
  readonly part: CarouselPart;
}) {
  const api = useCarousel({
    slideCount: slides.length,
    initialIndex,
    presentation,
  });
  const peek = presentation === 'peek';
  const snapAlign = carouselItemSnapAlign(presentation);
  const previous = (
    <button
      {...mergePostkitPartProps(
        api.getPrevTriggerProps(),
        part('previousTrigger'),
      )}
    >
      {peek ? <span aria-hidden="true">←</span> : 'Previous'}
    </button>
  );
  const next = (
    <button
      {...mergePostkitPartProps(api.getNextTriggerProps(), part('nextTrigger'))}
    >
      {peek ? <span aria-hidden="true">→</span> : 'Next'}
    </button>
  );
  const caption = captions[api.page];
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
              api.getItemProps({ index, snapAlign }),
              part('slide'),
            )}
            // Peeking neighbours are hidden from assistive technology, so
            // nothing in them can take focus either.
            inert={peek && !api.isInView(index) ? true : undefined}
            key={index}
          >
            {slide}
          </div>
        ))}
      </div>
      <div {...mergePostkitPartProps(api.getControlProps(), part('controls'))}>
        {peek ? (
          <>
            <p aria-live="polite" {...part('caption')}>
              {figure ? (
                <span {...part('number')}>{figure.label(api.page)}</span>
              ) : null}
              {caption}
            </p>
            {previous}
            {next}
          </>
        ) : (
          <>
            {previous}
            <div aria-live="polite" {...part('status')}>
              {api.getProgressText()}
            </div>
            {next}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A keyboard-operable carousel of items or children: headless markup over
 * {@link useCarousel}. Previous and next buttons wrap, the viewport pages with
 * arrow keys, Home and End, and nothing advances on its own.
 *
 * - `presentation: 'slides'` (the default) shows one slide, with its caption,
 *   and the status part announces "n / total".
 * - `presentation: 'peek'` centres the current item with its neighbours in
 *   view (faded and hidden from assistive technology), shows arrows only,
 *   and announces the current item's caption in a polite live region.
 *
 * Beneath `figures="numbered"`, the carousel is one figure: its items read
 * "Fig. 1", "Fig. 1b", "Fig. 1c"….
 */
export const Carousel = postkitView<typeof carouselDefinition, CarouselProps>(
  carouselDefinition,
  ({ props, part }) => {
    const figure = usePostkitFigureNumber();
    const peek = props.presentation === 'peek';
    const items = props.items
      ? postkitJsonItems<CarouselItem>(props.items, 'Carousel items')
      : [];
    const titleElement = postkitTitleElement(props.headingLevel);
    const itemSlides = items.map((item, index) =>
      itemContent(
        item,
        part,
        titleElement,
        peek ? undefined : { number: figure?.label(index), text: item.caption },
      ),
    );
    const slides =
      itemSlides.length > 0 ? itemSlides : Children.toArray(props.children);
    const captions =
      itemSlides.length > 0 ? items.map((item) => item.caption) : [];

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
        presentation={peek ? 'peek' : 'slides'}
        slides={slides}
        captions={captions}
        figure={figure}
        part={part}
      />
    );
  },
);

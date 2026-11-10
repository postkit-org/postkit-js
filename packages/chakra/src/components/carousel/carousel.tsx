'use client';

import {
  Box,
  Button,
  Carousel as ChakraCarousel,
  Heading,
  Image,
  Link,
  Text,
  chakra,
  useCarousel as useChakraCarousel,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import {
  carouselItemSnapAlign,
  postkitCarouselPeekConfig,
} from '@postkit/core/behaviors';
import { carouselDefinition } from '@postkit/core/components';
import {
  usePostkitFigureNumber,
  type PostkitFigureNumber,
} from '@postkit/react';
import { Children, type ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import {
  postkitChakraView,
  type PostkitChakraViewContext,
} from '../../lib/view.js';
import {
  postkitCarouselRecipe,
  type PostkitCarouselSlot,
} from './carousel.recipe.js';

export interface CarouselItem {
  readonly id?: string;
  readonly image?: {
    readonly src: string;
    readonly alt: string;
  };
  readonly title?: string;
  readonly description?: string;
  /** The item's caption: below the current item in `peek`, in the slide otherwise. */
  readonly caption?: string;
  readonly href?: string;
}

export type CarouselProps = {
  readonly items?: string | readonly CarouselItem[];
  readonly children?: ReactNode;
  readonly label?: string;
  readonly initialIndex?: number | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitCarouselSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitCarouselSlot, string>>>;
} & RecipeVariantProps<typeof postkitCarouselRecipe> &
  UnstyledProp;

type CarouselPart = PostkitChakraViewContext<
  typeof carouselDefinition,
  CarouselProps
>['part'];

function parsedInitialIndex(value: number | string | undefined): number {
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 10) : (value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function itemContent(
  item: CarouselItem,
  size: unknown,
  part: CarouselPart,
  caption?: { readonly number?: string; readonly text?: string },
): ReactNode {
  const showCaption = Boolean(caption?.number || caption?.text);
  const content = (
    <Box>
      {item.image ? (
        <Image src={item.image.src} alt={item.image.alt} {...part('media')} />
      ) : null}
      {item.title || item.description || showCaption ? (
        <Box {...part('content')}>
          {item.title ? (
            <Heading
              as="h3"
              size={postkitHeadingSize(size, {
                sm: 'md',
                md: 'lg',
                lg: 'xl',
              })}
              {...part('title')}
            >
              {item.title}
            </Heading>
          ) : null}
          {item.description ? (
            <Text
              {...part('description', {
                css: item.title ? undefined : { marginTop: '0' },
              })}
            >
              {item.description}
            </Text>
          ) : null}
          {showCaption ? (
            <Text {...part('caption')}>
              {caption?.number ? (
                <chakra.span {...part('number')}>{caption.number}</chakra.span>
              ) : null}
              {caption?.text}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );

  return item.href ? (
    <Link href={item.href} {...part('link')}>
      {content}
    </Link>
  ) : (
    content
  );
}

/**
 * The peek root. `padding` is both a Zag carousel prop and a Chakra style
 * prop, so `Carousel.Root` would take it as CSS; the machine gets it through
 * `useCarousel` and `Carousel.RootProvider` instead.
 */
function PeekRoot({
  label,
  rootPart,
  defaultPage,
  slideCount,
  children,
}: {
  readonly label?: string;
  readonly rootPart: object;
  readonly defaultPage: number;
  readonly slideCount: number;
  readonly children: ReactNode;
}) {
  const carousel = useChakraCarousel({
    ...postkitCarouselPeekConfig,
    defaultPage,
    slideCount,
  });
  return (
    <ChakraCarousel.RootProvider
      value={carousel}
      aria-label={label}
      {...rootPart}
    >
      {children}
    </ChakraCarousel.RootProvider>
  );
}

/** The arrows, the current caption (peek) or the "n / total" status. */
function CarouselControls({
  peek,
  captions,
  figure,
  part,
}: {
  readonly peek: boolean;
  readonly captions: readonly (string | undefined)[];
  readonly figure?: PostkitFigureNumber;
  readonly part: CarouselPart;
}) {
  if (!peek) {
    return (
      <ChakraCarousel.Control {...part('controls')}>
        <ChakraCarousel.PrevTrigger asChild {...part('previousTrigger')}>
          <Button size="sm" variant="outline">
            Previous
          </Button>
        </ChakraCarousel.PrevTrigger>
        <ChakraCarousel.ProgressText aria-live="polite" {...part('status')} />
        <ChakraCarousel.NextTrigger asChild {...part('nextTrigger')}>
          <Button size="sm" variant="outline">
            Next
          </Button>
        </ChakraCarousel.NextTrigger>
      </ChakraCarousel.Control>
    );
  }
  return (
    <ChakraCarousel.Control {...part('controls')}>
      <ChakraCarousel.Context>
        {(api) => (
          <Text aria-live="polite" {...part('caption')}>
            {figure ? (
              <chakra.span {...part('number')}>
                {figure.label(api.page)}
              </chakra.span>
            ) : null}
            {captions[api.page]}
          </Text>
        )}
      </ChakraCarousel.Context>
      <ChakraCarousel.PrevTrigger asChild {...part('previousTrigger')}>
        <Button size="sm" variant="outline">
          <span aria-hidden="true">←</span>
        </Button>
      </ChakraCarousel.PrevTrigger>
      <ChakraCarousel.NextTrigger asChild {...part('nextTrigger')}>
        <Button size="sm" variant="outline">
          <span aria-hidden="true">→</span>
        </Button>
      </ChakraCarousel.NextTrigger>
    </ChakraCarousel.Control>
  );
}

/**
 * A keyboard-operable carousel of items or children, on Chakra's Carousel and
 * styled by its Chakra recipe. It never advances on its own.
 *
 * - `presentation: 'slides'` (the default) shows one slide, with its caption,
 *   and announces "n / total".
 * - `presentation: 'peek'` centres the current item with its neighbours in
 *   view (faded to 35% and hidden from assistive technology), shows arrows
 *   only, and announces the current item's caption politely.
 *
 * Beneath `figures="numbered"`, the carousel is one figure: its items read
 * "Fig. 1", "Fig. 1b", "Fig. 1c"….
 */
export const Carousel = postkitChakraView<
  typeof carouselDefinition,
  CarouselProps
>(carouselDefinition, postkitCarouselRecipe, ({ props, variants, part }) => {
  const figure = usePostkitFigureNumber();
  const peek = props.presentation === 'peek';
  const items = props.items
    ? parseJsonProp<CarouselItem>(props.items, 'Carousel items')
    : [];
  const itemSlides = items.map((item, index) =>
    itemContent(
      item,
      variants['size'],
      part,
      peek ? undefined : { number: figure?.label(index), text: item.caption },
    ),
  );
  const captions =
    itemSlides.length > 0 ? items.map((item) => item.caption) : [];
  const childSlides = Children.toArray(props.children);
  const slides = itemSlides.length > 0 ? itemSlides : childSlides;
  const startingIndex = Math.min(
    parsedInitialIndex(props.initialIndex),
    Math.max(0, slides.length - 1),
  );

  if (slides.length === 0) {
    return (
      <Box role="note" {...part('root')}>
        <Text {...part('emptyState')}>
          This carousel does not have any slides.
        </Text>
      </Box>
    );
  }

  const rootPart = part('root') as unknown as Omit<
    ChakraCarousel.RootProps,
    'children' | 'defaultPage' | 'slideCount'
  >;

  const snapAlign = carouselItemSnapAlign(peek ? 'peek' : 'slides');
  const content = (
    <>
      <ChakraCarousel.ItemGroup>
        <ChakraCarousel.Context>
          {(api) =>
            slides.map((slide, index) => (
              <ChakraCarousel.Item
                index={index}
                snapAlign={snapAlign}
                // Peeking neighbours are hidden from assistive technology, so
                // nothing in them can take focus either.
                inert={peek && !api.isInView(index) ? true : undefined}
                {...part('slide')}
                key={index}
              >
                {slide}
              </ChakraCarousel.Item>
            ))
          }
        </ChakraCarousel.Context>
      </ChakraCarousel.ItemGroup>
      <CarouselControls
        peek={peek}
        captions={captions}
        figure={figure}
        part={part}
      />
    </>
  );

  if (peek) {
    return (
      <PeekRoot
        label={props.label}
        rootPart={rootPart}
        defaultPage={startingIndex}
        slideCount={slides.length}
      >
        {content}
      </PeekRoot>
    );
  }

  return (
    <ChakraCarousel.Root
      aria-label={props.label}
      {...rootPart}
      allowMouseDrag
      defaultPage={startingIndex}
      loop
      slideCount={slides.length}
      spacing="0px"
    >
      {content}
    </ChakraCarousel.Root>
  );
});

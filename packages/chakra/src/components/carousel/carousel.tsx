'use client';

import {
  Box,
  Button,
  Carousel as ChakraCarousel,
  Heading,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { carouselDefinition } from '@postkit/core/components';
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
): ReactNode {
  const content = (
    <Box>
      {item.image ? (
        <Image src={item.image.src} alt={item.image.alt} {...part('media')} />
      ) : null}
      {item.title || item.description ? (
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
 * A keyboard-operable carousel of items or children, on Chakra's Carousel and
 * styled by its Chakra recipe. There is no headless view yet (03 D11).
 */
export const Carousel = postkitChakraView<
  typeof carouselDefinition,
  CarouselProps
>(carouselDefinition, postkitCarouselRecipe, ({ props, variants, part }) => {
  const itemSlides = props.items
    ? parseJsonProp<CarouselItem>(props.items, 'Carousel items').map((item) =>
        itemContent(item, variants['size'], part),
      )
    : [];
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
      <ChakraCarousel.ItemGroup>
        {slides.map((slide, index) => (
          <ChakraCarousel.Item index={index} {...part('slide')} key={index}>
            {slide}
          </ChakraCarousel.Item>
        ))}
      </ChakraCarousel.ItemGroup>
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
    </ChakraCarousel.Root>
  );
});

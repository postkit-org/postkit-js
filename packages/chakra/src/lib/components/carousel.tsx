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
import { Children, type ReactNode } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitCarouselRecipe,
  type PostkitCarouselSlot,
} from '../recipes/carousel.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

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
} & RecipeVariantProps<typeof postkitCarouselRecipe> &
  UnstyledProp;

function parsedInitialIndex(value: number | string | undefined): number {
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 10) : (value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function itemContent(
  item: CarouselItem,
  size: CarouselProps['size'],
  styles: PostkitSlotStyles<PostkitCarouselSlot>,
  slotStyles: PostkitSlotStyles<PostkitCarouselSlot> | undefined,
  classNames: Partial<Record<PostkitCarouselSlot, string>>,
): ReactNode {
  const content = (
    <Box>
      {item.image ? (
        <Image
          src={item.image.src}
          alt={item.image.alt}
          className={classNames.media}
          css={[styles.media, slotStyles?.media]}
        />
      ) : null}
      {item.title || item.description ? (
        <Box
          className={classNames.content}
          css={[styles.content, slotStyles?.content]}
        >
          {item.title ? (
            <Heading
              as="h3"
              size={postkitHeadingSize(size, {
                sm: 'md',
                md: 'lg',
                lg: 'xl',
              })}
              className={classNames.title}
              css={[styles.title, slotStyles?.title]}
            >
              {item.title}
            </Heading>
          ) : null}
          {item.description ? (
            <Text
              className={classNames.description}
              css={[
                styles.description,
                item.title ? undefined : { marginTop: '0' },
                slotStyles?.description,
              ]}
            >
              {item.description}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );

  return item.href ? (
    <Link
      href={item.href}
      className={classNames.link}
      css={[styles.link, slotStyles?.link]}
    >
      {content}
    </Link>
  ) : (
    content
  );
}

export function Carousel({
  items,
  children,
  label = 'Article carousel',
  initialIndex,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: CarouselProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.carousel,
    postkitCarouselRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCarouselSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const itemSlides = items
    ? parseJsonProp<CarouselItem>(items, 'Carousel items').map((item) =>
        itemContent(item, size, styles, slotStyles, recipe.classNameMap),
      )
    : [];
  const childSlides = Children.toArray(children);
  const slides = itemSlides.length > 0 ? itemSlides : childSlides;
  const startingIndex = Math.min(
    parsedInitialIndex(initialIndex),
    Math.max(0, slides.length - 1),
  );

  if (slides.length === 0) {
    return (
      <Box
        data-postkit-component="Carousel"
        role="note"
        {...restRootProps}
        className={postkitSlotClassName(
          recipe.classNameMap.root,
          rootClassName,
        )}
        css={[styles.root, slotStyles?.root, rootCss]}
      >
        <Text
          className={recipe.classNameMap.emptyState}
          css={[styles.emptyState, slotStyles?.emptyState]}
        >
          This carousel does not have any slides.
        </Text>
      </Box>
    );
  }

  const carouselRootProps = restRootProps as Omit<
    ChakraCarousel.RootProps,
    'children' | 'defaultPage' | 'slideCount'
  >;

  return (
    <ChakraCarousel.Root
      data-postkit-component="Carousel"
      aria-label={label}
      {...carouselRootProps}
      allowMouseDrag
      defaultPage={startingIndex}
      loop
      slideCount={slides.length}
      spacing="0px"
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <ChakraCarousel.ItemGroup>
        {slides.map((slide, index) => (
          <ChakraCarousel.Item
            index={index}
            className={recipe.classNameMap.slide}
            css={[styles.slide, slotStyles?.slide]}
            key={index}
          >
            {slide}
          </ChakraCarousel.Item>
        ))}
      </ChakraCarousel.ItemGroup>
      <ChakraCarousel.Control
        className={recipe.classNameMap.controls}
        css={[styles.controls, slotStyles?.controls]}
      >
        <ChakraCarousel.PrevTrigger
          asChild
          className={recipe.classNameMap.previousTrigger}
          css={[styles.previousTrigger, slotStyles?.previousTrigger]}
        >
          <Button size="sm" variant="outline">
            Previous
          </Button>
        </ChakraCarousel.PrevTrigger>
        <ChakraCarousel.ProgressText
          aria-live="polite"
          className={recipe.classNameMap.status}
          css={[styles.status, slotStyles?.status]}
        />
        <ChakraCarousel.NextTrigger
          asChild
          className={recipe.classNameMap.nextTrigger}
          css={[styles.nextTrigger, slotStyles?.nextTrigger]}
        >
          <Button size="sm" variant="outline">
            Next
          </Button>
        </ChakraCarousel.NextTrigger>
      </ChakraCarousel.Control>
    </ChakraCarousel.Root>
  );
}

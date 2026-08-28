'use client';

import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { Children, type ReactNode, useId, useState } from 'react';

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
  const generatedId = useId();
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
  const [selectedIndex, setSelectedIndex] = useState(startingIndex);
  const boundedIndex = Math.min(selectedIndex, Math.max(0, slides.length - 1));
  const statusId = `${generatedId}-status`;

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

  const selectPrevious = () => {
    setSelectedIndex((current) => {
      const boundedCurrent = Math.min(current, slides.length - 1);
      return boundedCurrent <= 0 ? slides.length - 1 : boundedCurrent - 1;
    });
  };
  const selectNext = () => {
    setSelectedIndex((current) => {
      const boundedCurrent = Math.min(current, slides.length - 1);
      return boundedCurrent >= slides.length - 1 ? 0 : boundedCurrent + 1;
    });
  };

  return (
    <Box
      data-postkit-component="Carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        role="group"
        aria-roledescription="slide"
        aria-label={`${boundedIndex + 1} of ${slides.length}`}
        className={recipe.classNameMap.slide}
        css={[styles.slide, slotStyles?.slide]}
      >
        {slides[boundedIndex]}
      </Box>
      <Flex
        className={recipe.classNameMap.controls}
        css={[styles.controls, slotStyles?.controls]}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={selectPrevious}
          aria-describedby={statusId}
          className={recipe.classNameMap.previousTrigger}
          css={[styles.previousTrigger, slotStyles?.previousTrigger]}
        >
          Previous
        </Button>
        <Text
          id={statusId}
          aria-live="polite"
          className={recipe.classNameMap.status}
          css={[styles.status, slotStyles?.status]}
        >
          {boundedIndex + 1} / {slides.length}
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={selectNext}
          aria-describedby={statusId}
          className={recipe.classNameMap.nextTrigger}
          css={[styles.nextTrigger, slotStyles?.nextTrigger]}
        >
          Next
        </Button>
      </Flex>
    </Box>
  );
}

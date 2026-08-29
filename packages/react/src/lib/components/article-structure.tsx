'use client';

import {
  Alert,
  Box,
  Card,
  chakra,
  Heading,
  Image,
  Link,
  List,
  Tabs as ChakraTabs,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useState, type ComponentProps, type ReactNode } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitCalloutRecipe,
  postkitCardGridRecipe,
  postkitDisclosureRecipe,
  postkitGalleryRecipe,
  postkitStepsRecipe,
  postkitTabsRecipe,
  type PostkitCalloutSlot,
  type PostkitCardGridSlot,
  type PostkitDisclosureSlot,
  type PostkitGallerySlot,
  type PostkitStepsSlot,
  type PostkitTabsSlot,
} from '../recipes/article-structure.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

const DisclosureRoot = chakra('details');
const DisclosureSummary = chakra('summary');

type SharedRootProps<Slot extends string> = {
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
};

function rootParts(rootProps?: BoxProps) {
  const { css, className, ...rest } = rootProps ?? {};
  return { rootCss: css, rootClassName: className, restRootProps: rest };
}

const calloutMarks = {
  note: 'i',
  tip: '✓',
  important: '!',
  warning: '!',
  caution: '×',
} as const;

export type CalloutProps = {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  readonly componentName?: 'Aside' | 'Callout';
} & SharedRootProps<PostkitCalloutSlot> &
  RecipeVariantProps<typeof postkitCalloutRecipe> &
  UnstyledProp;

export function Callout({
  title,
  children,
  icon,
  componentName = 'Callout',
  rootProps,
  slotStyles,
  size,
  variant,
  tone = 'note',
  unstyled,
}: CalloutProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.callout,
    postkitCalloutRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCalloutSlot> = unstyled
    ? {}
    : recipe({ size, tone, variant });
  const resolvedTone =
    typeof tone === 'string' && tone in calloutMarks ? tone : 'note';
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Alert.Root
      as="aside"
      status={
        resolvedTone === 'tip'
          ? 'success'
          : resolvedTone === 'warning'
            ? 'warning'
            : resolvedTone === 'caution'
              ? 'error'
              : resolvedTone === 'important'
                ? 'neutral'
                : 'info'
      }
      data-postkit-component={componentName}
      data-postkit-tone={resolvedTone}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Alert.Indicator
        aria-hidden="true"
        className={recipe.classNameMap.icon}
        css={[styles.icon, slotStyles?.icon]}
      >
        {icon ?? calloutMarks[resolvedTone]}
      </Alert.Indicator>
      <Alert.Content
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        {title ? (
          <Alert.Title asChild>
            <Heading
              as="p"
              size={postkitHeadingSize(size, {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              className={recipe.classNameMap.title}
              css={[styles.title, slotStyles?.title]}
            >
              {title}
            </Heading>
          </Alert.Title>
        ) : null}
        <Alert.Description
          className={recipe.classNameMap.body}
          css={[styles.body, slotStyles?.body]}
        >
          {children}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export type AsideProps = CalloutProps;
export function Aside(props: AsideProps) {
  return <Callout {...props} componentName="Aside" />;
}

export interface GalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly href?: string;
  readonly width?: number;
  readonly height?: number;
}
export type GalleryProps = {
  readonly items: string | readonly GalleryItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
} & SharedRootProps<PostkitGallerySlot> &
  RecipeVariantProps<typeof postkitGalleryRecipe> &
  UnstyledProp;

export function Gallery({
  items: value,
  title,
  description,
  columns = 2,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: GalleryProps) {
  const items = parseJsonProp<GalleryItem>(value, 'Gallery items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.gallery,
    postkitGalleryRecipe,
  );
  const styles: PostkitSlotStyles<PostkitGallerySlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="Gallery"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {title || description ? (
        <Box
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          {title ? (
            <Heading
              as="p"
              size={postkitHeadingSize(size, {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              className={recipe.classNameMap.title}
              css={[styles.title, slotStyles?.title]}
            >
              {title}
            </Heading>
          ) : null}
          {description ? (
            <Text
              className={recipe.classNameMap.description}
              css={[styles.description, slotStyles?.description]}
            >
              {description}
            </Text>
          ) : null}
        </Box>
      ) : null}
      <Box
        className={recipe.classNameMap.grid}
        css={[
          styles.grid,
          { '--postkit-gallery-columns': columns },
          slotStyles?.grid,
        ]}
      >
        {items.map((item, index) => {
          const image = (
            <Image
              src={item.src}
              alt={item.alt}
              htmlWidth={item.width}
              htmlHeight={item.height}
              loading="lazy"
              decoding="async"
              className={recipe.classNameMap.image}
              css={[styles.image, slotStyles?.image]}
            />
          );
          return (
            <Box
              as="figure"
              className={recipe.classNameMap.item}
              css={[styles.item, slotStyles?.item]}
              key={`${item.src}-${index}`}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  aria-label={item.alt || item.caption || 'Open image'}
                  className={recipe.classNameMap.imageLink}
                  css={[styles.imageLink, slotStyles?.imageLink]}
                >
                  {image}
                </Link>
              ) : (
                image
              )}
              {item.caption ? (
                <Box
                  as="figcaption"
                  className={recipe.classNameMap.caption}
                  css={[styles.caption, slotStyles?.caption]}
                >
                  {item.caption}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export type DisclosureProps = {
  readonly summary: string;
  readonly children?: ReactNode;
  readonly open?: boolean;
} & SharedRootProps<PostkitDisclosureSlot> &
  RecipeVariantProps<typeof postkitDisclosureRecipe> &
  UnstyledProp;

/**
 * A progressively enhanced disclosure built on native `details` and `summary`.
 * It intentionally remains native so its toggle behavior works without
 * client-side JavaScript.
 */
export function Disclosure({
  summary,
  children,
  open,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: DisclosureProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.disclosure,
    postkitDisclosureRecipe,
  );
  const styles: PostkitSlotStyles<PostkitDisclosureSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = (rootProps ?? {}) as ComponentProps<typeof DisclosureRoot>;
  return (
    <DisclosureRoot
      open={open}
      data-postkit-component="Disclosure"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <DisclosureSummary
        className={recipe.classNameMap.summary}
        css={[styles.summary, slotStyles?.summary]}
      >
        {summary}
        <Box
          as="span"
          aria-hidden="true"
          className={recipe.classNameMap.indicator}
          css={[styles.indicator, slotStyles?.indicator]}
        >
          +
        </Box>
      </DisclosureSummary>
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        {children}
      </Box>
    </DisclosureRoot>
  );
}

export interface TabItem {
  readonly id?: string;
  readonly label: string;
  readonly content: ReactNode;
}
export type TabsProps = {
  readonly items: string | readonly TabItem[];
  readonly label?: string;
  readonly initialIndex?: number | string;
} & SharedRootProps<PostkitTabsSlot> &
  RecipeVariantProps<typeof postkitTabsRecipe> &
  UnstyledProp;

export function Tabs({
  items: value,
  label = 'Tabbed content',
  initialIndex = 0,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: TabsProps) {
  const items = parseJsonProp<TabItem>(value, 'Tabs items');
  const requested =
    typeof initialIndex === 'string' ? Number(initialIndex) : initialIndex;
  const selectedIndex = Math.max(
    0,
    Math.min(items.length - 1, Number.isFinite(requested) ? requested : 0),
  );
  const itemValues = items.map((item, index) => item.id ?? String(index));
  const [selected, setSelected] = useState(itemValues[selectedIndex] ?? '');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.tabs,
    postkitTabsRecipe,
  );
  const styles: PostkitSlotStyles<PostkitTabsSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const tabsRootProps = restRootProps as Omit<
    ChakraTabs.RootProps,
    'children' | 'onValueChange' | 'size' | 'value' | 'variant'
  >;
  return (
    <ChakraTabs.Root
      {...tabsRootProps}
      value={selected}
      onValueChange={({ value: nextValue }) => setSelected(nextValue)}
      size={size ?? 'md'}
      variant={variant ?? 'outline'}
      data-postkit-component="Tabs"
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <ChakraTabs.List
        aria-label={label}
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item, index) => (
          <ChakraTabs.Trigger
            value={itemValues[index] ?? String(index)}
            className={recipe.classNameMap.tab}
            css={[styles.tab, slotStyles?.tab]}
            key={item.id ?? item.label}
          >
            {item.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>
      <ChakraTabs.ContentGroup
        className={recipe.classNameMap.panels}
        css={[styles.panels, slotStyles?.panels]}
      >
        {items.map((item, index) => (
          <ChakraTabs.Content
            value={itemValues[index] ?? String(index)}
            className={recipe.classNameMap.panel}
            css={[styles.panel, slotStyles?.panel]}
            key={item.id ?? item.label}
          >
            {item.content}
          </ChakraTabs.Content>
        ))}
      </ChakraTabs.ContentGroup>
    </ChakraTabs.Root>
  );
}

export interface StepItem {
  readonly title: string;
  readonly description?: ReactNode;
}
export type StepsProps = {
  readonly items: string | readonly StepItem[];
} & SharedRootProps<PostkitStepsSlot> &
  RecipeVariantProps<typeof postkitStepsRecipe> &
  UnstyledProp;

export function Steps({
  items: value,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: StepsProps) {
  const items = parseJsonProp<StepItem>(value, 'Steps items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.steps,
    postkitStepsRecipe,
  );
  const styles: PostkitSlotStyles<PostkitStepsSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const listRootProps = restRootProps as Omit<
    List.RootProps,
    'as' | 'children' | 'variant'
  >;
  return (
    <List.Root
      as="ol"
      variant="plain"
      data-postkit-component="Steps"
      {...listRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {items.map((item, index) => (
        <List.Item
          className={recipe.classNameMap.item}
          css={[styles.item, slotStyles?.item]}
          key={`${item.title}-${index}`}
        >
          <Box
            aria-hidden="true"
            className={recipe.classNameMap.marker}
            css={[styles.marker, slotStyles?.marker]}
          >
            {index + 1}
          </Box>
          <Box
            className={recipe.classNameMap.content}
            css={[styles.content, slotStyles?.content]}
          >
            <Heading
              as="p"
              size={postkitHeadingSize(size, {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              className={recipe.classNameMap.title}
              css={[styles.title, slotStyles?.title]}
            >
              {item.title}
            </Heading>
            {item.description ? (
              <Box
                className={recipe.classNameMap.description}
                css={[styles.description, slotStyles?.description]}
              >
                {item.description}
              </Box>
            ) : null}
          </Box>
        </List.Item>
      ))}
    </List.Root>
  );
}

export interface CardItem {
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly meta?: string;
}
export type CardGridProps = {
  readonly items: string | readonly CardItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
} & SharedRootProps<PostkitCardGridSlot> &
  RecipeVariantProps<typeof postkitCardGridRecipe> &
  UnstyledProp;

export function CardGrid({
  items: value,
  title,
  description,
  columns = 2,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: CardGridProps) {
  const items = parseJsonProp<CardItem>(value, 'CardGrid items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.cardGrid,
    postkitCardGridRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCardGridSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="CardGrid"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {title || description ? (
        <Box
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          {title ? (
            <Text
              className={recipe.classNameMap.title}
              css={[styles.title, slotStyles?.title]}
            >
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text
              className={recipe.classNameMap.description}
              css={[styles.description, slotStyles?.description]}
            >
              {description}
            </Text>
          ) : null}
        </Box>
      ) : null}
      <Box
        className={recipe.classNameMap.grid}
        css={[
          styles.grid,
          { '--postkit-card-columns': columns },
          slotStyles?.grid,
        ]}
      >
        {items.map((item, index) => (
          <Card.Root
            as="article"
            className={recipe.classNameMap.card}
            css={[styles.card, slotStyles?.card]}
            key={`${item.title}-${index}`}
          >
            {item.image ? (
              <Image
                src={item.image.src}
                alt={item.image.alt}
                loading="lazy"
                className={recipe.classNameMap.image}
                css={[styles.image, slotStyles?.image]}
              />
            ) : null}
            <Card.Body
              className={recipe.classNameMap.cardBody}
              css={[styles.cardBody, slotStyles?.cardBody]}
            >
              <Heading
                as="p"
                size={postkitHeadingSize(size, {
                  sm: 'sm',
                  md: 'md',
                  lg: 'lg',
                })}
                className={recipe.classNameMap.cardTitle}
                css={[styles.cardTitle, slotStyles?.cardTitle]}
              >
                {item.title}
              </Heading>
              {item.description ? (
                <Text
                  className={recipe.classNameMap.cardDescription}
                  css={[styles.cardDescription, slotStyles?.cardDescription]}
                >
                  {item.description}
                </Text>
              ) : null}
              {item.meta ? (
                <Text
                  className={recipe.classNameMap.meta}
                  css={[styles.meta, slotStyles?.meta]}
                >
                  {item.meta}
                </Text>
              ) : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className={recipe.classNameMap.link}
                  css={[styles.link, slotStyles?.link]}
                >
                  {item.linkLabel ?? 'Learn more'}
                  <Box as="span" aria-hidden="true">
                    {' '}
                    →
                  </Box>
                </Link>
              ) : null}
            </Card.Body>
          </Card.Root>
        ))}
      </Box>
    </Box>
  );
}

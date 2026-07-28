'use client';

import {
  Box,
  chakra,
  Image,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';

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

const DisclosureRoot = chakra('details');
const DisclosureSummary = chakra('summary');
const TabButton = chakra('button');

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

export type PostkitCalloutProps = {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  readonly componentName?: 'Aside' | 'Callout';
} & SharedRootProps<PostkitCalloutSlot> &
  RecipeVariantProps<typeof postkitCalloutRecipe> &
  UnstyledProp;

export function PostkitCallout({
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
}: PostkitCalloutProps) {
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
    <Box
      as="aside"
      data-postkit-component={componentName}
      data-postkit-tone={resolvedTone}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        aria-hidden="true"
        className={recipe.classNameMap.icon}
        css={[styles.icon, slotStyles?.icon]}
      >
        {icon ?? calloutMarks[resolvedTone]}
      </Box>
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        {title ? (
          <Text
            className={recipe.classNameMap.title}
            css={[styles.title, slotStyles?.title]}
          >
            {title}
          </Text>
        ) : null}
        <Box
          className={recipe.classNameMap.body}
          css={[styles.body, slotStyles?.body]}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export type PostkitAsideProps = PostkitCalloutProps;
export function PostkitAside(props: PostkitAsideProps) {
  return <PostkitCallout {...props} componentName="Aside" />;
}

export interface PostkitGalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly href?: string;
  readonly width?: number;
  readonly height?: number;
}
export type PostkitGalleryProps = {
  readonly items: string | readonly PostkitGalleryItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
} & SharedRootProps<PostkitGallerySlot> &
  RecipeVariantProps<typeof postkitGalleryRecipe> &
  UnstyledProp;

export function PostkitGallery({
  items: value,
  title,
  description,
  columns = 2,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitGalleryProps) {
  const items = parseJsonProp<PostkitGalleryItem>(value, 'Gallery items');
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

export type PostkitDisclosureProps = {
  readonly summary: string;
  readonly children?: ReactNode;
  readonly open?: boolean;
} & SharedRootProps<PostkitDisclosureSlot> &
  RecipeVariantProps<typeof postkitDisclosureRecipe> &
  UnstyledProp;

export function PostkitDisclosure({
  summary,
  children,
  open,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitDisclosureProps) {
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

export interface PostkitTabItem {
  readonly id?: string;
  readonly label: string;
  readonly content: ReactNode;
}
export type PostkitTabsProps = {
  readonly items: string | readonly PostkitTabItem[];
  readonly label?: string;
  readonly initialIndex?: number | string;
} & SharedRootProps<PostkitTabsSlot> &
  RecipeVariantProps<typeof postkitTabsRecipe> &
  UnstyledProp;

export function PostkitTabs({
  items: value,
  label = 'Tabbed content',
  initialIndex = 0,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitTabsProps) {
  const items = parseJsonProp<PostkitTabItem>(value, 'Tabs items');
  const requested =
    typeof initialIndex === 'string' ? Number(initialIndex) : initialIndex;
  const [selected, setSelected] = useState(
    Math.max(
      0,
      Math.min(items.length - 1, Number.isFinite(requested) ? requested : 0),
    ),
  );
  const id = useId();
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.tabs,
    postkitTabsRecipe,
  );
  const styles: PostkitSlotStyles<PostkitTabsSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="Tabs"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        role="tablist"
        aria-label={label}
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item, index) => (
          <TabButton
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            className={recipe.classNameMap.tab}
            css={[styles.tab, slotStyles?.tab]}
            key={item.id ?? item.label}
          >
            {item.label}
          </TabButton>
        ))}
      </Box>
      <Box
        className={recipe.classNameMap.panels}
        css={[styles.panels, slotStyles?.panels]}
      >
        {items.map((item, index) => (
          <Box
            role="tabpanel"
            id={`${id}-panel-${index}`}
            aria-labelledby={`${id}-tab-${index}`}
            hidden={selected !== index}
            className={recipe.classNameMap.panel}
            css={[styles.panel, slotStyles?.panel]}
            key={item.id ?? item.label}
          >
            {item.content}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export interface PostkitStepItem {
  readonly title: string;
  readonly description?: ReactNode;
}
export type PostkitStepsProps = {
  readonly items: string | readonly PostkitStepItem[];
} & SharedRootProps<PostkitStepsSlot> &
  RecipeVariantProps<typeof postkitStepsRecipe> &
  UnstyledProp;

export function PostkitSteps({
  items: value,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitStepsProps) {
  const items = parseJsonProp<PostkitStepItem>(value, 'Steps items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.steps,
    postkitStepsRecipe,
  );
  const styles: PostkitSlotStyles<PostkitStepsSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="ol"
      data-postkit-component="Steps"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {items.map((item, index) => (
        <Box
          as="li"
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
            <Text
              className={recipe.classNameMap.title}
              css={[styles.title, slotStyles?.title]}
            >
              {item.title}
            </Text>
            {item.description ? (
              <Box
                className={recipe.classNameMap.description}
                css={[styles.description, slotStyles?.description]}
              >
                {item.description}
              </Box>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export interface PostkitCardItem {
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly image?: { readonly src: string; readonly alt: string };
  readonly meta?: string;
}
export type PostkitCardGridProps = {
  readonly items: string | readonly PostkitCardItem[];
  readonly title?: string;
  readonly description?: string;
  readonly columns?: 1 | 2 | 3 | 4;
} & SharedRootProps<PostkitCardGridSlot> &
  RecipeVariantProps<typeof postkitCardGridRecipe> &
  UnstyledProp;

export function PostkitCardGrid({
  items: value,
  title,
  description,
  columns = 2,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitCardGridProps) {
  const items = parseJsonProp<PostkitCardItem>(value, 'CardGrid items');
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
          <Box
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
            <Box
              className={recipe.classNameMap.cardBody}
              css={[styles.cardBody, slotStyles?.cardBody]}
            >
              <Text
                className={recipe.classNameMap.cardTitle}
                css={[styles.cardTitle, slotStyles?.cardTitle]}
              >
                {item.title}
              </Text>
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
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

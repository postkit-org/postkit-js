'use client';

import {
  Box,
  Button,
  Heading,
  Image,
  Link,
  Table,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitAudienceBoundaryRecipe,
  postkitComparisonRecipe,
  postkitKeyTakeawayRecipe,
  postkitPollRecipe,
  postkitProductCardRecipe,
  postkitPullQuoteRecipe,
  postkitRelatedContentRecipe,
  postkitSeriesNavigationRecipe,
  postkitSponsorBlockRecipe,
  postkitStatRecipe,
  type PostkitAudienceBoundarySlot,
  type PostkitComparisonSlot,
  type PostkitKeyTakeawaySlot,
  type PostkitPollSlot,
  type PostkitProductCardSlot,
  type PostkitPullQuoteSlot,
  type PostkitRelatedContentSlot,
  type PostkitSeriesNavigationSlot,
  type PostkitSponsorBlockSlot,
  type PostkitStatSlot,
} from '../recipes/publication.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

type SharedRootProps<Slot extends string> = {
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
};
function rootParts(rootProps?: BoxProps) {
  const { css, className, ...rest } = rootProps ?? {};
  return { rootCss: css, rootClassName: className, restRootProps: rest };
}

export type PullQuoteProps = {
  readonly quote: string;
  readonly attribution?: string;
  readonly cite?: string;
} & SharedRootProps<PostkitPullQuoteSlot> &
  RecipeVariantProps<typeof postkitPullQuoteRecipe> &
  UnstyledProp;
export function PullQuote({
  quote,
  attribution,
  cite,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PullQuoteProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.pullQuote,
    postkitPullQuoteRecipe,
  );
  const styles: PostkitSlotStyles<PostkitPullQuoteSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="figure"
      data-postkit-component="PullQuote"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        aria-hidden="true"
        className={recipe.classNameMap.mark}
        css={[styles.mark, slotStyles?.mark]}
      >
        “
      </Box>
      <Box
        as="blockquote"
        className={recipe.classNameMap.quote}
        css={[styles.quote, slotStyles?.quote]}
      >
        {quote}
      </Box>
      {attribution || cite ? (
        <Box
          as="figcaption"
          className={recipe.classNameMap.attribution}
          css={[styles.attribution, slotStyles?.attribution]}
        >
          {attribution}
          {cite ? (
            <Box
              as="cite"
              className={recipe.classNameMap.cite}
              css={[styles.cite, slotStyles?.cite]}
            >
              {attribution ? ` — ${cite}` : cite}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

export type KeyTakeawayProps = {
  readonly title?: string;
  readonly eyebrow?: string;
  readonly items?: string | readonly string[];
  readonly children?: ReactNode;
} & SharedRootProps<PostkitKeyTakeawaySlot> &
  RecipeVariantProps<typeof postkitKeyTakeawayRecipe> &
  UnstyledProp;
export function KeyTakeaway({
  title = 'Key takeaway',
  eyebrow,
  items: value = [],
  children,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: KeyTakeawayProps) {
  const items = parseJsonProp<string>(value, 'KeyTakeaway items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.keyTakeaway,
    postkitKeyTakeawayRecipe,
  );
  const styles: PostkitSlotStyles<PostkitKeyTakeawaySlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="aside"
      data-postkit-component="KeyTakeaway"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {eyebrow ? (
        <Text
          className={recipe.classNameMap.eyebrow}
          css={[styles.eyebrow, slotStyles?.eyebrow]}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Heading
        as="p"
        size={postkitHeadingSize(size, {
          sm: 'lg',
          md: 'xl',
          lg: '2xl',
        })}
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Heading>
      {children ? (
        <Box
          className={recipe.classNameMap.body}
          css={[styles.body, slotStyles?.body]}
        >
          {children}
        </Box>
      ) : null}
      {items.length ? (
        <Box
          as="ul"
          className={recipe.classNameMap.list}
          css={[styles.list, slotStyles?.list]}
        >
          {items.map((item, index) => (
            <Box
              as="li"
              className={recipe.classNameMap.item}
              css={[styles.item, slotStyles?.item]}
              key={`${item}-${index}`}
            >
              {item}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

export type StatProps = {
  readonly value: string | number;
  readonly label: string;
  readonly trend?: string;
  readonly description?: string;
} & SharedRootProps<PostkitStatSlot> &
  RecipeVariantProps<typeof postkitStatRecipe> &
  UnstyledProp;
export function Stat({
  value,
  label,
  trend,
  description,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: StatProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.stat,
    postkitStatRecipe,
  );
  const styles: PostkitSlotStyles<PostkitStatSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="Stat"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Text
        className={recipe.classNameMap.value}
        css={[styles.value, slotStyles?.value]}
      >
        {value}
      </Text>
      <Text
        className={recipe.classNameMap.label}
        css={[styles.label, slotStyles?.label]}
      >
        {label}
      </Text>
      {trend ? (
        <Text
          className={recipe.classNameMap.trend}
          css={[styles.trend, slotStyles?.trend]}
        >
          {trend}
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
  );
}

export interface ComparisonItem {
  readonly label: string;
  readonly values: readonly (string | number | boolean | null)[];
}
export type ComparisonProps = {
  readonly columns: string | readonly string[];
  readonly items: string | readonly ComparisonItem[];
  readonly title?: string;
  readonly description?: string;
} & SharedRootProps<PostkitComparisonSlot> &
  RecipeVariantProps<typeof postkitComparisonRecipe> &
  UnstyledProp;
export function Comparison({
  columns: columnsValue,
  items: itemsValue,
  title,
  description,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: ComparisonProps) {
  const columns = parseJsonProp<string>(columnsValue, 'Comparison columns');
  const items = parseJsonProp<ComparisonItem>(itemsValue, 'Comparison items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.comparison,
    postkitComparisonRecipe,
  );
  const styles: PostkitSlotStyles<PostkitComparisonSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const displayValue = (value: string | number | boolean | null | undefined) =>
    value === true ? 'Yes' : value === false ? 'No' : (value ?? '—');
  return (
    <Box
      data-postkit-component="Comparison"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {title ? (
        <Heading
          as="p"
          size={postkitHeadingSize(size, {
            sm: 'lg',
            md: 'xl',
            lg: '2xl',
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
      <Box
        className={recipe.classNameMap.scroller}
        css={[styles.scroller, slotStyles?.scroller]}
      >
        <Table.Root
          size={size ?? 'md'}
          className={recipe.classNameMap.table}
          css={[styles.table, slotStyles?.table]}
        >
          <Table.Header
            className={recipe.classNameMap.head}
            css={[styles.head, slotStyles?.head]}
          >
            <Table.Row>
              <Table.ColumnHeader
                className={recipe.classNameMap.header}
                css={[styles.header, slotStyles?.header]}
              >
                Feature
              </Table.ColumnHeader>
              {columns.map((column) => (
                <Table.ColumnHeader
                  className={recipe.classNameMap.header}
                  css={[styles.header, slotStyles?.header]}
                  key={column}
                >
                  {column}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row
                className={recipe.classNameMap.row}
                css={[styles.row, slotStyles?.row]}
                key={item.label}
              >
                <Table.ColumnHeader
                  scope="row"
                  className={recipe.classNameMap.label}
                  css={[styles.label, slotStyles?.label]}
                >
                  {item.label}
                </Table.ColumnHeader>
                {columns.map((_, index) => (
                  <Table.Cell
                    className={recipe.classNameMap.value}
                    css={[styles.value, slotStyles?.value]}
                    key={index}
                  >
                    {displayValue(item.values[index])}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

export interface PollOption {
  readonly id: string;
  readonly label: string;
  readonly votes?: number;
}
export type PollProps = {
  readonly question: string;
  readonly description?: string;
  readonly options: string | readonly PollOption[];
  readonly totalVotes?: number | string;
  readonly selectedId?: string;
  readonly onVote?: (option: PollOption) => void | Promise<void>;
} & SharedRootProps<PostkitPollSlot> &
  RecipeVariantProps<typeof postkitPollRecipe> &
  UnstyledProp;
export function Poll({
  question,
  description,
  options: value,
  totalVotes,
  selectedId,
  onVote,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PollProps) {
  const options = parseJsonProp<PollOption>(value, 'Poll options');
  const [selection, setSelection] = useState(selectedId);
  const total =
    Number(totalVotes) ||
    options.reduce((sum, option) => sum + (option.votes ?? 0), 0);
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.poll,
    postkitPollRecipe,
  );
  const styles: PostkitSlotStyles<PostkitPollSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const vote = (option: PollOption) => {
    setSelection(option.id);
    void onVote?.(option);
  };
  return (
    <Box
      data-postkit-component="Poll"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Heading
        as="p"
        size={postkitHeadingSize(size, {
          sm: 'lg',
          md: 'xl',
          lg: '2xl',
        })}
        className={recipe.classNameMap.question}
        css={[styles.question, slotStyles?.question]}
      >
        {question}
      </Heading>
      {description ? (
        <Text
          className={recipe.classNameMap.description}
          css={[styles.description, slotStyles?.description]}
        >
          {description}
        </Text>
      ) : null}
      <Box
        role="group"
        aria-label={question}
        className={recipe.classNameMap.options}
        css={[styles.options, slotStyles?.options]}
      >
        {options.map((option) => {
          const percentage =
            total > 0 ? Math.round(((option.votes ?? 0) / total) * 100) : 0;
          return (
            <Button
              type="button"
              size={size ?? 'md'}
              variant="outline"
              aria-pressed={selection === option.id}
              onClick={() => vote(option)}
              className={recipe.classNameMap.option}
              css={[styles.option, slotStyles?.option]}
              key={option.id}
            >
              <Box
                className={recipe.classNameMap.optionLabel}
                css={[styles.optionLabel, slotStyles?.optionLabel]}
              >
                <span>{option.label}</span>
                {total ? (
                  <Box
                    as="span"
                    className={recipe.classNameMap.result}
                    css={[styles.result, slotStyles?.result]}
                  >
                    {percentage}%
                  </Box>
                ) : null}
              </Box>
              {total ? (
                <Box
                  aria-hidden="true"
                  className={recipe.classNameMap.bar}
                  css={[
                    styles.bar,
                    { width: `${percentage}%` },
                    slotStyles?.bar,
                  ]}
                />
              ) : null}
            </Button>
          );
        })}
      </Box>
      <Text
        aria-live="polite"
        className={recipe.classNameMap.status}
        css={[styles.status, slotStyles?.status]}
      >
        {selection
          ? 'Vote selected'
          : total
            ? `${total} votes`
            : 'Select an option'}
      </Text>
    </Box>
  );
}

export type ProductCardProps = {
  readonly title: string;
  readonly description?: string;
  readonly href: string;
  readonly actionLabel?: string;
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly price?: string;
  readonly rating?: number | string;
  readonly badge?: string;
  readonly rel?: string;
} & SharedRootProps<PostkitProductCardSlot> &
  RecipeVariantProps<typeof postkitProductCardRecipe> &
  UnstyledProp;
export function ProductCard({
  title,
  description,
  href,
  actionLabel = 'View product',
  imageSrc,
  imageAlt = '',
  price,
  rating,
  badge,
  rel = 'sponsored',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: ProductCardProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.productCard,
    postkitProductCardRecipe,
  );
  const styles: PostkitSlotStyles<PostkitProductCardSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="article"
      data-postkit-component="ProductCard"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          loading="lazy"
          className={recipe.classNameMap.image}
          css={[styles.image, slotStyles?.image]}
        />
      ) : null}
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        {badge ? (
          <Text
            className={recipe.classNameMap.badge}
            css={[styles.badge, slotStyles?.badge]}
          >
            {badge}
          </Text>
        ) : null}
        <Heading
          as="p"
          size={postkitHeadingSize(size, {
            sm: 'lg',
            md: 'xl',
            lg: '2xl',
          })}
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Heading>
        {description ? (
          <Text
            className={recipe.classNameMap.description}
            css={[styles.description, slotStyles?.description]}
          >
            {description}
          </Text>
        ) : null}
        {rating ? (
          <Text
            aria-label={`${rating} out of 5 stars`}
            className={recipe.classNameMap.rating}
            css={[styles.rating, slotStyles?.rating]}
          >
            ★ {rating}
          </Text>
        ) : null}
        <Box
          className={recipe.classNameMap.footer}
          css={[styles.footer, slotStyles?.footer]}
        >
          {price ? (
            <Text
              className={recipe.classNameMap.price}
              css={[styles.price, slotStyles?.price]}
            >
              {price}
            </Text>
          ) : (
            <span />
          )}
          <Button
            asChild
            size={size ?? 'md'}
            variant="solid"
            className={recipe.classNameMap.action}
            css={[styles.action, slotStyles?.action]}
          >
            <Link href={href} rel={rel}>
              {actionLabel}
            </Link>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export interface RelatedContentItem {
  readonly title: string;
  readonly href: string;
  readonly description?: string;
  readonly meta?: string;
}
export type RelatedContentProps = {
  readonly items: string | readonly RelatedContentItem[];
  readonly title?: string;
} & SharedRootProps<PostkitRelatedContentSlot> &
  RecipeVariantProps<typeof postkitRelatedContentRecipe> &
  UnstyledProp;
export function RelatedContent({
  items: value,
  title = 'Related content',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: RelatedContentProps) {
  const items = parseJsonProp<RelatedContentItem>(
    value,
    'RelatedContent items',
  );
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.relatedContent,
    postkitRelatedContentRecipe,
  );
  const styles: PostkitSlotStyles<PostkitRelatedContentSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="aside"
      data-postkit-component="RelatedContent"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Heading
        as="p"
        size={postkitHeadingSize(size, {
          sm: 'md',
          md: 'lg',
          lg: 'xl',
        })}
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Heading>
      <Box
        as="ul"
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item) => (
          <Box
            as="li"
            className={recipe.classNameMap.item}
            css={[styles.item, slotStyles?.item]}
            key={item.href}
          >
            <Link
              href={item.href}
              className={recipe.classNameMap.link}
              css={[styles.link, slotStyles?.link]}
            >
              <Heading
                as="p"
                size={postkitHeadingSize(size, {
                  sm: 'sm',
                  md: 'md',
                  lg: 'lg',
                })}
                className={recipe.classNameMap.itemTitle}
                css={[styles.itemTitle, slotStyles?.itemTitle]}
              >
                {item.title}
              </Heading>
              {item.description ? (
                <Text
                  className={recipe.classNameMap.description}
                  css={[styles.description, slotStyles?.description]}
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
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export interface SeriesLink {
  readonly title: string;
  readonly href: string;
}
export type SeriesNavigationProps = {
  readonly title: string;
  readonly current?: number | string;
  readonly total?: number | string;
  readonly previous?: SeriesLink | string;
  readonly next?: SeriesLink | string;
} & SharedRootProps<PostkitSeriesNavigationSlot> &
  RecipeVariantProps<typeof postkitSeriesNavigationRecipe> &
  UnstyledProp;
function parseSeriesLink(value?: SeriesLink | string): SeriesLink | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  if (!value) return undefined;
  try {
    return JSON.parse(value) as SeriesLink;
  } catch {
    throw new TypeError(
      'Postkit SeriesNavigation links must contain valid JSON.',
    );
  }
}
export function SeriesNavigation({
  title,
  current,
  total,
  previous: previousValue,
  next: nextValue,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: SeriesNavigationProps) {
  const previous = parseSeriesLink(previousValue);
  const next = parseSeriesLink(nextValue);
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.seriesNavigation,
    postkitSeriesNavigationRecipe,
  );
  const styles: PostkitSlotStyles<PostkitSeriesNavigationSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const renderLink = (
    link: SeriesLink | undefined,
    direction: 'Previous' | 'Next',
  ) =>
    link ? (
      <Link
        href={link.href}
        rel={direction === 'Previous' ? 'prev' : 'next'}
        className={recipe.classNameMap.link}
        css={[styles.link, slotStyles?.link]}
      >
        <Text
          className={recipe.classNameMap.direction}
          css={[styles.direction, slotStyles?.direction]}
        >
          {direction}
        </Text>
        <Heading
          as="span"
          size={postkitHeadingSize(size, {
            sm: 'sm',
            md: 'md',
            lg: 'lg',
          })}
          className={recipe.classNameMap.linkTitle}
          css={[styles.linkTitle, slotStyles?.linkTitle]}
        >
          {link.title}
        </Heading>
      </Link>
    ) : (
      <span />
    );
  return (
    <Box
      as="nav"
      aria-label={`${title} series navigation`}
      data-postkit-component="SeriesNavigation"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        className={recipe.classNameMap.header}
        css={[styles.header, slotStyles?.header]}
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
          {title}
        </Heading>
        {current && total ? (
          <Text
            className={recipe.classNameMap.position}
            css={[styles.position, slotStyles?.position]}
          >
            {current} of {total}
          </Text>
        ) : null}
      </Box>
      <Box
        className={recipe.classNameMap.links}
        css={[styles.links, slotStyles?.links]}
      >
        {renderLink(previous, 'Previous')}
        {renderLink(next, 'Next')}
      </Box>
    </Box>
  );
}

export type SponsorBlockProps = {
  readonly name: string;
  readonly message?: string;
  readonly href?: string;
  readonly actionLabel?: string;
  readonly logoSrc?: string;
  readonly logoAlt?: string;
  readonly disclosure?: string;
} & SharedRootProps<PostkitSponsorBlockSlot> &
  RecipeVariantProps<typeof postkitSponsorBlockRecipe> &
  UnstyledProp;
export function SponsorBlock({
  name,
  message,
  href,
  actionLabel = 'Learn more',
  logoSrc,
  logoAlt = '',
  disclosure = 'Sponsored',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: SponsorBlockProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.sponsorBlock,
    postkitSponsorBlockRecipe,
  );
  const styles: PostkitSlotStyles<PostkitSponsorBlockSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      as="aside"
      aria-label={`${disclosure} by ${name}`}
      data-postkit-component="SponsorBlock"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Text
        className={recipe.classNameMap.disclosure}
        css={[styles.disclosure, slotStyles?.disclosure]}
      >
        {disclosure}
      </Text>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={logoAlt || name}
          className={recipe.classNameMap.logo}
          css={[styles.logo, slotStyles?.logo]}
        />
      ) : null}
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
          className={recipe.classNameMap.name}
          css={[styles.name, slotStyles?.name]}
        >
          {name}
        </Heading>
        {message ? (
          <Text
            className={recipe.classNameMap.message}
            css={[styles.message, slotStyles?.message]}
          >
            {message}
          </Text>
        ) : null}
        {href ? (
          <Button
            asChild
            size={size ?? 'md'}
            variant="outline"
            className={recipe.classNameMap.action}
            css={[styles.action, slotStyles?.action]}
          >
            <Link href={href} rel="sponsored">
              {actionLabel}
            </Link>
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

export type AudienceBoundaryProps = {
  readonly audience: string;
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
  readonly authorized?: boolean;
  readonly showLabel?: boolean | string;
} & SharedRootProps<PostkitAudienceBoundarySlot> &
  RecipeVariantProps<typeof postkitAudienceBoundaryRecipe> &
  UnstyledProp;
export function AudienceBoundary({
  audience,
  children,
  fallback = 'This section is available to a different audience.',
  authorized = true,
  showLabel,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: AudienceBoundaryProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.audienceBoundary,
    postkitAudienceBoundaryRecipe,
  );
  const styles: PostkitSlotStyles<PostkitAudienceBoundarySlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const labeled = showLabel === true || showLabel === 'true';
  return (
    <Box
      data-postkit-component="AudienceBoundary"
      data-postkit-audience={audience}
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {labeled ? (
        <Text
          className={recipe.classNameMap.label}
          css={[styles.label, slotStyles?.label]}
        >
          Audience: {audience}
        </Text>
      ) : null}
      {authorized ? (
        <Box
          className={recipe.classNameMap.content}
          css={[styles.content, slotStyles?.content]}
        >
          {children}
        </Box>
      ) : (
        <Box
          className={recipe.classNameMap.fallback}
          css={[styles.fallback, slotStyles?.fallback]}
        >
          {fallback}
        </Box>
      )}
    </Box>
  );
}

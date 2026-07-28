'use client';

import {
  Box,
  Image,
  Link,
  Text,
  chakra,
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

const OptionButton = chakra('button');
const TableHeader = chakra('th');

type SharedRootProps<Slot extends string> = {
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
};
function rootParts(rootProps?: BoxProps) {
  const { css, className, ...rest } = rootProps ?? {};
  return { rootCss: css, rootClassName: className, restRootProps: rest };
}

export type PostkitPullQuoteProps = {
  readonly quote: string;
  readonly attribution?: string;
  readonly cite?: string;
} & SharedRootProps<PostkitPullQuoteSlot> &
  RecipeVariantProps<typeof postkitPullQuoteRecipe> &
  UnstyledProp;
export function PostkitPullQuote({
  quote,
  attribution,
  cite,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitPullQuoteProps) {
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

export type PostkitKeyTakeawayProps = {
  readonly title?: string;
  readonly eyebrow?: string;
  readonly items?: string | readonly string[];
  readonly children?: ReactNode;
} & SharedRootProps<PostkitKeyTakeawaySlot> &
  RecipeVariantProps<typeof postkitKeyTakeawayRecipe> &
  UnstyledProp;
export function PostkitKeyTakeaway({
  title = 'Key takeaway',
  eyebrow,
  items: value = [],
  children,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitKeyTakeawayProps) {
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
      <Text
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Text>
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

export type PostkitStatProps = {
  readonly value: string | number;
  readonly label: string;
  readonly trend?: string;
  readonly description?: string;
} & SharedRootProps<PostkitStatSlot> &
  RecipeVariantProps<typeof postkitStatRecipe> &
  UnstyledProp;
export function PostkitStat({
  value,
  label,
  trend,
  description,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitStatProps) {
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

export interface PostkitComparisonItem {
  readonly label: string;
  readonly values: readonly (string | number | boolean | null)[];
}
export type PostkitComparisonProps = {
  readonly columns: string | readonly string[];
  readonly items: string | readonly PostkitComparisonItem[];
  readonly title?: string;
  readonly description?: string;
} & SharedRootProps<PostkitComparisonSlot> &
  RecipeVariantProps<typeof postkitComparisonRecipe> &
  UnstyledProp;
export function PostkitComparison({
  columns: columnsValue,
  items: itemsValue,
  title,
  description,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitComparisonProps) {
  const columns = parseJsonProp<string>(columnsValue, 'Comparison columns');
  const items = parseJsonProp<PostkitComparisonItem>(
    itemsValue,
    'Comparison items',
  );
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
      <Box
        className={recipe.classNameMap.scroller}
        css={[styles.scroller, slotStyles?.scroller]}
      >
        <Box
          as="table"
          className={recipe.classNameMap.table}
          css={[styles.table, slotStyles?.table]}
        >
          <Box
            as="thead"
            className={recipe.classNameMap.head}
            css={[styles.head, slotStyles?.head]}
          >
            <Box as="tr">
              <Box
                as="th"
                className={recipe.classNameMap.header}
                css={[styles.header, slotStyles?.header]}
              >
                Feature
              </Box>
              {columns.map((column) => (
                <Box
                  as="th"
                  className={recipe.classNameMap.header}
                  css={[styles.header, slotStyles?.header]}
                  key={column}
                >
                  {column}
                </Box>
              ))}
            </Box>
          </Box>
          <Box as="tbody">
            {items.map((item) => (
              <Box
                as="tr"
                className={recipe.classNameMap.row}
                css={[styles.row, slotStyles?.row]}
                key={item.label}
              >
                <TableHeader
                  scope="row"
                  className={recipe.classNameMap.label}
                  css={[styles.label, slotStyles?.label]}
                >
                  {item.label}
                </TableHeader>
                {columns.map((_, index) => (
                  <Box
                    as="td"
                    className={recipe.classNameMap.value}
                    css={[styles.value, slotStyles?.value]}
                    key={index}
                  >
                    {displayValue(item.values[index])}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export interface PostkitPollOption {
  readonly id: string;
  readonly label: string;
  readonly votes?: number;
}
export type PostkitPollProps = {
  readonly question: string;
  readonly description?: string;
  readonly options: string | readonly PostkitPollOption[];
  readonly totalVotes?: number | string;
  readonly selectedId?: string;
  readonly onVote?: (option: PostkitPollOption) => void | Promise<void>;
} & SharedRootProps<PostkitPollSlot> &
  RecipeVariantProps<typeof postkitPollRecipe> &
  UnstyledProp;
export function PostkitPoll({
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
}: PostkitPollProps) {
  const options = parseJsonProp<PostkitPollOption>(value, 'Poll options');
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
  const vote = (option: PostkitPollOption) => {
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
      <Text
        className={recipe.classNameMap.question}
        css={[styles.question, slotStyles?.question]}
      >
        {question}
      </Text>
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
            <OptionButton
              type="button"
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
            </OptionButton>
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

export type PostkitProductCardProps = {
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
export function PostkitProductCard({
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
}: PostkitProductCardProps) {
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
        <Text
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Text>
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
          <Link
            href={href}
            rel={rel}
            className={recipe.classNameMap.action}
            css={[styles.action, slotStyles?.action]}
          >
            {actionLabel}
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export interface PostkitRelatedContentItem {
  readonly title: string;
  readonly href: string;
  readonly description?: string;
  readonly meta?: string;
}
export type PostkitRelatedContentProps = {
  readonly items: string | readonly PostkitRelatedContentItem[];
  readonly title?: string;
} & SharedRootProps<PostkitRelatedContentSlot> &
  RecipeVariantProps<typeof postkitRelatedContentRecipe> &
  UnstyledProp;
export function PostkitRelatedContent({
  items: value,
  title = 'Related content',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitRelatedContentProps) {
  const items = parseJsonProp<PostkitRelatedContentItem>(
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
      <Text
        className={recipe.classNameMap.title}
        css={[styles.title, slotStyles?.title]}
      >
        {title}
      </Text>
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
              <Text
                className={recipe.classNameMap.itemTitle}
                css={[styles.itemTitle, slotStyles?.itemTitle]}
              >
                {item.title}
              </Text>
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

export interface PostkitSeriesLink {
  readonly title: string;
  readonly href: string;
}
export type PostkitSeriesNavigationProps = {
  readonly title: string;
  readonly current?: number | string;
  readonly total?: number | string;
  readonly previous?: PostkitSeriesLink | string;
  readonly next?: PostkitSeriesLink | string;
} & SharedRootProps<PostkitSeriesNavigationSlot> &
  RecipeVariantProps<typeof postkitSeriesNavigationRecipe> &
  UnstyledProp;
function parseSeriesLink(
  value?: PostkitSeriesLink | string,
): PostkitSeriesLink | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  if (!value) return undefined;
  try {
    return JSON.parse(value) as PostkitSeriesLink;
  } catch {
    throw new TypeError(
      'Postkit SeriesNavigation links must contain valid JSON.',
    );
  }
}
export function PostkitSeriesNavigation({
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
}: PostkitSeriesNavigationProps) {
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
    link: PostkitSeriesLink | undefined,
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
        <Text
          className={recipe.classNameMap.linkTitle}
          css={[styles.linkTitle, slotStyles?.linkTitle]}
        >
          {link.title}
        </Text>
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
        <Text
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Text>
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

export type PostkitSponsorBlockProps = {
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
export function PostkitSponsorBlock({
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
}: PostkitSponsorBlockProps) {
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
        <Text
          className={recipe.classNameMap.name}
          css={[styles.name, slotStyles?.name]}
        >
          {name}
        </Text>
        {message ? (
          <Text
            className={recipe.classNameMap.message}
            css={[styles.message, slotStyles?.message]}
          >
            {message}
          </Text>
        ) : null}
        {href ? (
          <Link
            href={href}
            rel="sponsored"
            className={recipe.classNameMap.action}
            css={[styles.action, slotStyles?.action]}
          >
            {actionLabel}
          </Link>
        ) : null}
      </Box>
    </Box>
  );
}

export type PostkitAudienceBoundaryProps = {
  readonly audience: string;
  readonly children?: ReactNode;
  readonly fallback?: ReactNode;
  readonly authorized?: boolean;
  readonly showLabel?: boolean | string;
} & SharedRootProps<PostkitAudienceBoundarySlot> &
  RecipeVariantProps<typeof postkitAudienceBoundaryRecipe> &
  UnstyledProp;
export function PostkitAudienceBoundary({
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
}: PostkitAudienceBoundaryProps) {
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

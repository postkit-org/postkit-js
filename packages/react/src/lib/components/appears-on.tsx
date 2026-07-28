'use client';

import {
  Box,
  chakra,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitAppearsOnRecipe,
  type PostkitAppearsOnSlot,
} from '../recipes/appears-on.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { usePostkit } from '../provider.js';
import { postkitRecipeKeys } from '../theme.js';

const AppearsOnTime = chakra('time');

export interface PostkitSyndicationReference {
  readonly service: string;
  readonly url: string;
  readonly label?: string;
  readonly publishedAt?: string;
  readonly externalId?: string;
  readonly status?: 'failed' | 'pending' | 'published' | 'removed';
}

export type PostkitAppearsOnProps = {
  readonly items: string | readonly PostkitSyndicationReference[];
  readonly label?: string;
  readonly showDates?: boolean | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAppearsOnSlot>;
} & RecipeVariantProps<typeof postkitAppearsOnRecipe> &
  UnstyledProp;

function enabled(value: boolean | string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return typeof value === 'boolean' ? value : value === 'true';
}

function displayDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }).format(date);
}

export function PostkitAppearsOn({
  items: itemsValue,
  label = 'Appears on',
  showDates = false,
  rootProps,
  slotStyles,
  presentation,
  size,
  variant,
  unstyled,
}: PostkitAppearsOnProps) {
  const items = parseJsonProp<PostkitSyndicationReference>(
    itemsValue,
    'AppearsOn items',
  );
  const { socialServices } = usePostkit();
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.appearsOn,
    postkitAppearsOnRecipe,
  );
  const styles: PostkitSlotStyles<PostkitAppearsOnSlot> = unstyled
    ? {}
    : recipe({ presentation, size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const datesVisible = enabled(showDates, false);

  return (
    <Box
      as="aside"
      data-postkit-component="AppearsOn"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Text
        className={recipe.classNameMap.label}
        css={[styles.label, slotStyles?.label]}
      >
        {label}
      </Text>
      <Box
        as="ul"
        aria-label={label}
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item, index) => {
          const service = socialServices[item.service];
          const itemLabel = item.label ?? service?.label ?? item.service;
          const date = datesVisible ? displayDate(item.publishedAt) : undefined;

          return (
            <Box
              as="li"
              key={`${item.service}-${item.url}-${index}`}
              data-postkit-service={item.service}
              className={recipe.classNameMap.item}
              css={[styles.item, slotStyles?.item]}
            >
              <Link
                href={item.url}
                rel="syndication"
                className={recipe.classNameMap.link}
                css={[
                  styles.link,
                  service?.accent ? { color: service.accent } : undefined,
                  slotStyles?.link,
                ]}
              >
                <Box
                  as="span"
                  aria-hidden={service?.icon ? undefined : true}
                  className={recipe.classNameMap.icon}
                  css={[styles.icon, slotStyles?.icon]}
                >
                  {service?.icon ?? itemLabel.slice(0, 1).toUpperCase()}
                </Box>
                <span>{itemLabel}</span>
              </Link>
              {date ? (
                <AppearsOnTime
                  dateTime={item.publishedAt}
                  className={recipe.classNameMap.date}
                  css={[styles.date, slotStyles?.date]}
                >
                  {date}
                </AppearsOnTime>
              ) : null}
              {item.status && item.status !== 'published' ? (
                <Text
                  as="span"
                  className={recipe.classNameMap.status}
                  css={[styles.status, slotStyles?.status]}
                >
                  {item.status}
                </Text>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

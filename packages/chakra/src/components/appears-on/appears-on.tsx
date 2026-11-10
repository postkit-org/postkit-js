'use client';

import {
  Box,
  chakra,
  Link,
  List,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { appearsOnDefinition } from '@postkit/core/components';

import { parseJsonProp } from '../../lib/json-props.js';
import { usePostkit } from '../../lib/provider.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitAppearsOnRecipe,
  type PostkitAppearsOnSlot,
} from './appears-on.recipe.js';

const AppearsOnTime = chakra('time');

export interface SyndicationReference {
  readonly service: string;
  readonly url: string;
  readonly label?: string;
  readonly publishedAt?: string;
  readonly externalId?: string;
  readonly status?: 'failed' | 'pending' | 'published' | 'removed';
}

export type AppearsOnProps = {
  readonly items: string | readonly SyndicationReference[];
  readonly label?: string;
  readonly showDates?: boolean | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAppearsOnSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitAppearsOnSlot, string>>>;
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

/** Where the post was syndicated, styled by its Chakra recipe. */
export const AppearsOn = postkitChakraView<
  typeof appearsOnDefinition,
  AppearsOnProps
>(appearsOnDefinition, postkitAppearsOnRecipe, ({ props, part }) => {
  const items = parseJsonProp<SyndicationReference>(
    props.items,
    'AppearsOn items',
  );
  const { socialServices } = usePostkit();
  const label = props.label;
  const datesVisible = enabled(props.showDates, false);

  return (
    <Box as="aside" {...part('root')}>
      <Text {...part('label')}>{label}</Text>
      <List.Root as="ul" variant="plain" aria-label={label} {...part('list')}>
        {items.map((item, index) => {
          const service = socialServices[item.service];
          const itemLabel = item.label ?? service?.label ?? item.service;
          const date = datesVisible ? displayDate(item.publishedAt) : undefined;

          return (
            <List.Item
              key={`${item.service}-${item.url}-${index}`}
              data-postkit-service={item.service}
              {...part('item')}
            >
              <Link
                href={item.url}
                rel="syndication"
                {...part('link', {
                  css: service?.accent ? { color: service.accent } : undefined,
                })}
              >
                <Box
                  as="span"
                  aria-hidden={service?.icon ? undefined : true}
                  {...part('icon')}
                >
                  {service?.icon ?? itemLabel.slice(0, 1).toUpperCase()}
                </Box>
                <span>{itemLabel}</span>
              </Link>
              {date ? (
                <AppearsOnTime dateTime={item.publishedAt} {...part('date')}>
                  {date}
                </AppearsOnTime>
              ) : null}
              {item.status && item.status !== 'published' ? (
                <Text as="span" {...part('status')}>
                  {item.status}
                </Text>
              ) : null}
            </List.Item>
          );
        })}
      </List.Root>
    </Box>
  );
});

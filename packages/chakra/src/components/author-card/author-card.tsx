'use client';

import {
  Avatar,
  Box,
  Card,
  Heading,
  Link,
  List,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { authorCardDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import { parseJsonProp } from '../../lib/json-props.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitAuthorCardRecipe,
  type PostkitAuthorCardSlot,
} from './author-card.recipe.js';

export interface AuthorLink {
  readonly label: string;
  readonly href: string;
  readonly rel?: string;
}

export type AuthorCardProps = {
  readonly name: string;
  readonly role?: string;
  readonly avatarSrc?: string;
  readonly avatarAlt?: string;
  readonly href?: string;
  readonly bio?: string;
  readonly links?: string | readonly AuthorLink[];
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitAuthorCardSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<
    Readonly<Record<PostkitAuthorCardSlot, string>>
  >;
} & RecipeVariantProps<typeof postkitAuthorCardRecipe> &
  UnstyledProp;

/** An author biography with portrait and links, styled by its Chakra recipe. */
export const AuthorCard = postkitChakraView<
  typeof authorCardDefinition,
  AuthorCardProps
>(
  authorCardDefinition,
  postkitAuthorCardRecipe,
  ({ props, variants, part }) => {
    const { name, role, avatarSrc, avatarAlt, href, bio, children } = props;
    const links = parseJsonProp<AuthorLink>(
      props.links ?? [],
      'AuthorCard links',
    );

    const authorName = href ? (
      <Link href={href} rel="author" {...part('nameLink')}>
        {name}
      </Link>
    ) : (
      name
    );

    return (
      <Card.Root as="aside" aria-label={`About ${name}`} {...part('root')}>
        <Avatar.Root {...part('avatar')}>
          {avatarSrc ? (
            <Avatar.Image
              src={avatarSrc}
              alt={avatarAlt ?? ''}
              loading="lazy"
            />
          ) : (
            <Avatar.Fallback name={name}>
              {name.trim().slice(0, 1).toUpperCase()}
            </Avatar.Fallback>
          )}
        </Avatar.Root>
        <Box {...part('content')}>
          <Box {...part('header')}>
            <Heading
              as="p"
              size={postkitHeadingSize(variants['size'], {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              {...part('name')}
            >
              {authorName}
            </Heading>
            {role ? (
              <Text as="span" {...part('role')}>
                {role}
              </Text>
            ) : null}
          </Box>
          {bio || children ? (
            <Box {...part('bio')}>{children ?? bio}</Box>
          ) : null}
          {links.length ? (
            <List.Root
              as="ul"
              variant="plain"
              aria-label={`${name} links`}
              {...part('links')}
            >
              {links.map((link) => (
                <List.Item key={`${link.label}-${link.href}`}>
                  <Link href={link.href} rel={link.rel} {...part('link')}>
                    {link.label}
                  </Link>
                </List.Item>
              ))}
            </List.Root>
          ) : null}
        </Box>
      </Card.Root>
    );
  },
);

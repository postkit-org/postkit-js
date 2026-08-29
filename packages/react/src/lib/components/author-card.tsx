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
import type { ReactNode } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitAuthorCardRecipe,
  type PostkitAuthorCardSlot,
} from '../recipes/author-card.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

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
} & RecipeVariantProps<typeof postkitAuthorCardRecipe> &
  UnstyledProp;

export function AuthorCard({
  name,
  role,
  avatarSrc,
  avatarAlt,
  href,
  bio,
  links: linksValue = [],
  children,
  rootProps,
  slotStyles,
  presentation,
  size,
  variant,
  unstyled,
}: AuthorCardProps) {
  const links = parseJsonProp<AuthorLink>(linksValue, 'AuthorCard links');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.authorCard,
    postkitAuthorCardRecipe,
  );
  const styles: PostkitSlotStyles<PostkitAuthorCardSlot> = unstyled
    ? {}
    : recipe({ presentation, size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};

  const authorName = href ? (
    <Link
      href={href}
      rel="author"
      className={recipe.classNameMap.nameLink}
      css={[styles.nameLink, slotStyles?.nameLink]}
    >
      {name}
    </Link>
  ) : (
    name
  );

  return (
    <Card.Root
      as="aside"
      aria-label={`About ${name}`}
      data-postkit-component="AuthorCard"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Avatar.Root
        className={recipe.classNameMap.avatar}
        css={[styles.avatar, slotStyles?.avatar]}
      >
        {avatarSrc ? (
          <Avatar.Image src={avatarSrc} alt={avatarAlt ?? ''} loading="lazy" />
        ) : (
          <Avatar.Fallback name={name}>
            {name.trim().slice(0, 1).toUpperCase()}
          </Avatar.Fallback>
        )}
      </Avatar.Root>
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
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
            className={recipe.classNameMap.name}
            css={[styles.name, slotStyles?.name]}
          >
            {authorName}
          </Heading>
          {role ? (
            <Text
              as="span"
              className={recipe.classNameMap.role}
              css={[styles.role, slotStyles?.role]}
            >
              {role}
            </Text>
          ) : null}
        </Box>
        {bio || children ? (
          <Box
            className={recipe.classNameMap.bio}
            css={[styles.bio, slotStyles?.bio]}
          >
            {children ?? bio}
          </Box>
        ) : null}
        {links.length ? (
          <List.Root
            as="ul"
            variant="plain"
            aria-label={`${name} links`}
            className={recipe.classNameMap.links}
            css={[styles.links, slotStyles?.links]}
          >
            {links.map((link) => (
              <List.Item key={`${link.label}-${link.href}`}>
                <Link
                  href={link.href}
                  rel={link.rel}
                  className={recipe.classNameMap.link}
                  css={[styles.link, slotStyles?.link]}
                >
                  {link.label}
                </Link>
              </List.Item>
            ))}
          </List.Root>
        ) : null}
      </Box>
    </Card.Root>
  );
}

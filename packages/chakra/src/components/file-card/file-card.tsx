'use client';

import {
  Box,
  Card,
  Heading,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { fileCardDefinition } from '@postkit/core/components';
import { postkitFileCardMark } from '@postkit/react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitFileCardRecipe,
  type PostkitFileCardSlot,
} from './file-card.recipe.js';

export type FileCardProps = {
  readonly href: string;
  readonly name: string;
  readonly description?: string;
  readonly fileType?: string;
  readonly fileSize?: string;
  readonly download?: boolean | string;
  readonly actionLabel?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitFileCardSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitFileCardSlot, string>>>;
} & RecipeVariantProps<typeof postkitFileCardRecipe> &
  UnstyledProp;

/** A descriptive file link or download, styled by its Chakra recipe. */
export const FileCard = postkitChakraView<
  typeof fileCardDefinition,
  FileCardProps
>(fileCardDefinition, postkitFileCardRecipe, ({ props, variants, part }) => {
  const { name, description, fileType, fileSize, actionLabel } = props;
  const download = props.download === true || props.download === 'true';
  return (
    <Card.Root {...part('root')}>
      <Box aria-hidden="true" {...part('icon')}>
        {postkitFileCardMark(name, fileType)}
      </Box>
      <Box {...part('content')}>
        <Heading
          as="p"
          size={postkitHeadingSize(variants['size'], {
            sm: 'sm',
            md: 'md',
            lg: 'lg',
          })}
          {...part('name')}
        >
          {name}
        </Heading>
        {description ? (
          <Text {...part('description')}>{description}</Text>
        ) : null}
        {fileType || fileSize ? (
          <Text {...part('meta')}>
            {[fileType, fileSize].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </Box>
      <Link
        href={props.href}
        download={download ? '' : undefined}
        {...part('action')}
      >
        {actionLabel ?? (download ? 'Download' : 'Open')}
      </Link>
    </Card.Root>
  );
});

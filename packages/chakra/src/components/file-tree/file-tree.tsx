'use client';

import {
  Box,
  Heading,
  List,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { fileTreeDefinition } from '@postkit/core/components';
import {
  postkitFileTreeDepth,
  postkitFileTreeItems,
  type FileTreeItem,
} from '@postkit/react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitFileTreeRecipe,
  type PostkitFileTreeSlot,
} from './file-tree.recipe.js';

export type { FileTreeItem };

export type FileTreeProps = {
  readonly items: string | readonly FileTreeItem[];
  readonly title?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitFileTreeSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitFileTreeSlot, string>>>;
} & RecipeVariantProps<typeof postkitFileTreeRecipe> &
  UnstyledProp;

/** A compact, semantic project tree, styled by its Chakra recipe. */
export const FileTree = postkitChakraView<
  typeof fileTreeDefinition,
  FileTreeProps
>(fileTreeDefinition, postkitFileTreeRecipe, ({ props, variants, part }) => (
  <Box {...part('root')}>
    {props.title ? (
      <Heading
        as="p"
        size={postkitHeadingSize(variants['size'], {
          sm: 'sm',
          md: 'md',
          lg: 'lg',
        })}
        {...part('title')}
      >
        {props.title}
      </Heading>
    ) : null}
    <List.Root as="ul" variant="plain" {...part('list')}>
      {postkitFileTreeItems(props.items).map((item, index) => (
        <List.Item
          {...part('item', {
            css: {
              paddingInlineStart: `${postkitFileTreeDepth(item) * 1.25}em`,
            },
          })}
          key={`${item.path}-${index}`}
        >
          <Box as="span" aria-hidden="true" {...part('icon')}>
            {item.type === 'folder' ? '▸' : '·'}
          </Box>
          <Box as="span" {...part('path')}>
            {item.path.split('/').at(-1)}
          </Box>
          {item.meta ? (
            <Box as="span" {...part('meta')}>
              {item.meta}
            </Box>
          ) : null}
        </List.Item>
      ))}
    </List.Root>
  </Box>
));

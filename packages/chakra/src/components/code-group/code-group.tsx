'use client';

import {
  Tabs as ChakraTabs,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useState } from 'react';

import { parseJsonProp } from '../../lib/json-props.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../../lib/recipes/types.js';
import { postkitRecipeKeys } from '../../lib/theme.js';
import { CodeBlock } from '../code-block/code-block.js';
import {
  postkitCodeGroupRecipe,
  type PostkitCodeGroupSlot,
} from './code-group.recipe.js';

/*
 * CodeGroup is interactive (its tabs), so it has no headless view yet and is
 * `chakra-only` in @postkit/react until the tabs behaviour hook lands
 * (03 D11).
 */

type SharedRootProps<Slot extends string> = {
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
};

function rootParts(rootProps?: BoxProps) {
  const { css, className, ...rest } = rootProps ?? {};
  return { rootCss: css, rootClassName: className, restRootProps: rest };
}

export interface CodeGroupItem {
  readonly label: string;
  readonly code: string;
  readonly language?: string;
  readonly filename?: string;
}
export type CodeGroupProps = {
  readonly items: string | readonly CodeGroupItem[];
  readonly label?: string;
  readonly initialIndex?: number | string;
} & SharedRootProps<PostkitCodeGroupSlot> &
  RecipeVariantProps<typeof postkitCodeGroupRecipe> &
  UnstyledProp;

export function CodeGroup({
  items: value,
  label = 'Code examples',
  initialIndex = 0,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: CodeGroupProps) {
  const items = parseJsonProp<CodeGroupItem>(value, 'CodeGroup items');
  const requested = Number(initialIndex);
  const [selected, setSelected] = useState(
    Number.isFinite(requested)
      ? Math.max(0, Math.min(items.length - 1, requested))
      : 0,
  );
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.codeGroup,
    postkitCodeGroupRecipe,
    { fallback: 'recipe' },
  );
  const styles: PostkitSlotStyles<PostkitCodeGroupSlot> = unstyled
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
      value={String(selected)}
      onValueChange={({ value: nextValue }: { value: string }) =>
        setSelected(Number(nextValue))
      }
      size={size ?? 'md'}
      // D12: subtle is the default variant; it matches the recipe's defaultVariants.
      variant={variant ?? 'subtle'}
      data-postkit-component="CodeGroup"
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <ChakraTabs.List
        aria-label={label}
        className={recipe.classNameMap.tabs}
        css={[styles.tabs, slotStyles?.tabs]}
      >
        {items.map((item, index) => (
          <ChakraTabs.Trigger
            value={String(index)}
            className={recipe.classNameMap.tab}
            css={[styles.tab, slotStyles?.tab]}
            key={`${item.label}-${index}`}
          >
            {item.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>
      {items.map((item, index) => (
        <ChakraTabs.Content
          value={String(index)}
          className={recipe.classNameMap.panel}
          css={[styles.panel, slotStyles?.panel]}
          key={`${item.label}-${index}`}
        >
          <CodeBlock
            code={item.code}
            language={item.language}
            filename={item.filename}
            variant="plain"
            size={size}
          />
        </ChakraTabs.Content>
      ))}
    </ChakraTabs.Root>
  );
}

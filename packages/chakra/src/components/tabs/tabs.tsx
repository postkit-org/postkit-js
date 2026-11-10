'use client';

import {
  Tabs as ChakraTabs,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { tabsDefinition } from '@postkit/core/components';
import { useState, type ReactNode } from 'react';

import { usePostkitChakraAnatomy } from '../../lib/anatomy.js';
import { parseJsonProp } from '../../lib/json-props.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../../lib/recipes/types.js';
import { postkitRecipeKeys } from '../../lib/theme.js';
import { postkitTabsRecipe, type PostkitTabsSlot } from './tabs.recipe.js';

/*
 * Tabs keeps Chakra's (Ark) Tabs for its behaviour (03 §5.3), so it doesn't
 * use `postkitChakraView`; it stamps the same anatomy as the headless `Tabs`
 * in `@postkit/react` (over `useTabs`), and both pass the shared tabs spec.
 */

export interface TabItem {
  readonly id?: string;
  readonly label: string;
  readonly content: ReactNode;
}
export type TabsProps = {
  readonly items: string | readonly TabItem[];
  readonly label?: string;
  readonly initialIndex?: number | string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitTabsSlot>;
} & RecipeVariantProps<typeof postkitTabsRecipe> &
  UnstyledProp;

export function Tabs({
  items: value,
  label = 'Tabbed content',
  initialIndex = 0,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: TabsProps) {
  const items = parseJsonProp<TabItem>(value, 'Tabs items');
  const requested =
    typeof initialIndex === 'string' ? Number(initialIndex) : initialIndex;
  const selectedIndex = Math.max(
    0,
    Math.min(items.length - 1, Number.isFinite(requested) ? requested : 0),
  );
  const itemValues = items.map((item, index) => item.id ?? String(index));
  const [selected, setSelected] = useState(itemValues[selectedIndex] ?? '');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.tabs,
    postkitTabsRecipe,
  );
  const anatomy = usePostkitChakraAnatomy<PostkitTabsSlot>(
    tabsDefinition,
    { size, variant },
    { recipeKey: postkitRecipeKeys.tabs, unstyled },
  );
  const styles: PostkitSlotStyles<PostkitTabsSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const tabsRootProps = restRootProps as Omit<
    ChakraTabs.RootProps,
    'children' | 'onValueChange' | 'size' | 'value' | 'variant'
  >;
  return (
    <ChakraTabs.Root
      {...anatomy('root')}
      {...tabsRootProps}
      value={selected}
      onValueChange={({ value: nextValue }: { value: string }) =>
        setSelected(nextValue)
      }
      size={size ?? 'md'}
      // D12: subtle is the default variant; it matches the recipe's defaultVariants.
      variant={variant ?? 'subtle'}
      data-postkit-component="Tabs"
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <ChakraTabs.List
        {...anatomy('list')}
        aria-label={label}
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item, index) => (
          <ChakraTabs.Trigger
            {...anatomy('tab')}
            value={itemValues[index] ?? String(index)}
            className={recipe.classNameMap.tab}
            css={[styles.tab, slotStyles?.tab]}
            key={item.id ?? item.label}
          >
            {item.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>
      <ChakraTabs.ContentGroup
        {...anatomy('panels')}
        className={recipe.classNameMap.panels}
        css={[styles.panels, slotStyles?.panels]}
      >
        {items.map((item, index) => (
          <ChakraTabs.Content
            {...anatomy('panel')}
            value={itemValues[index] ?? String(index)}
            className={recipe.classNameMap.panel}
            css={[styles.panel, slotStyles?.panel]}
            key={item.id ?? item.label}
          >
            {item.content}
          </ChakraTabs.Content>
        ))}
      </ChakraTabs.ContentGroup>
    </ChakraTabs.Root>
  );
}

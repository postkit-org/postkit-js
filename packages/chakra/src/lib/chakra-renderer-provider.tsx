'use client';

import {
  defaultSystem,
  defineConfig,
  mergeConfigs,
  type SlotRecipeConfig,
  type SystemConfig,
} from '@chakra-ui/react';
import type { PostkitRendererConfig } from '@postkit/react';
import { useMemo, type ReactNode } from 'react';

import { PostkitProvider, type PostkitProviderProps } from './provider.js';
import { createPostkitSystem } from './theme.js';

/** The provider props `createPostkit({ renderer: chakra }).Provider` takes. */
export type PostkitChakraProviderProps = Omit<PostkitProviderProps, 'children'>;

function isPlainVariantValue(value: unknown): value is boolean | string {
  return typeof value === 'string' || typeof value === 'boolean';
}

/**
 * Writes the site's theme-variant defaults (`variant`, `size`, `tone`, …)
 * into each registered Postkit recipe's `defaultVariants` (D18), as a config
 * layered last. Recipes the system doesn't register are left alone: their
 * views apply the same defaults as recipe variants.
 */
export function createPostkitDefaultVariantsConfig(
  postkit: PostkitRendererConfig,
  options: Pick<PostkitProviderProps, 'preset' | 'system' | 'theme'> = {},
): SystemConfig | undefined {
  const pending = postkit.definitions.flatMap((definition) => {
    const defaults = postkit.defaults[definition.name];
    if (!defaults) return [];
    const defaultVariants = Object.fromEntries(
      definition.themeVariants.flatMap((name) =>
        isPlainVariantValue(defaults[name]) ? [[name, defaults[name]]] : [],
      ),
    );
    return Object.keys(defaultVariants).length
      ? [{ key: `postkit${definition.name}`, defaultVariants }]
      : [];
  });
  if (pending.length === 0) return undefined;

  const system = createPostkitSystem({
    system: options.system ?? defaultSystem,
    preset: options.preset,
    theme: options.theme,
  });
  const slotRecipes: Record<string, SlotRecipeConfig> = {};
  for (const { key, defaultVariants } of pending) {
    if (!system.isSlotRecipe(key)) continue;
    const recipe = system.getSlotRecipe(key) as SlotRecipeConfig;
    slotRecipes[key] = { slots: recipe.slots, defaultVariants };
  }
  return Object.keys(slotRecipes).length
    ? defineConfig({ theme: { slotRecipes } })
    : undefined;
}

/**
 * The Chakra renderer's provider: `PostkitProvider`, with the site's
 * theme-variant defaults written into the recipes' `defaultVariants`.
 *
 * @internal Rendered by `createPostkit({ renderer: chakra }).Provider`.
 */
export function PostkitChakraRendererProvider({
  postkit,
  children,
  ...props
}: PostkitChakraProviderProps & {
  readonly children?: ReactNode;
  readonly postkit: PostkitRendererConfig;
}) {
  const { system, preset, theme } = props;
  const theme_ = useMemo(() => {
    const defaults = createPostkitDefaultVariantsConfig(postkit, {
      system,
      preset,
      theme,
    });
    if (!defaults) return theme;
    return theme ? mergeConfigs(theme, defaults) : defaults;
  }, [postkit, preset, system, theme]);

  return (
    <PostkitProvider {...props} theme={theme_}>
      {children}
    </PostkitProvider>
  );
}

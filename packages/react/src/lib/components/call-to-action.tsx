'use client';

import {
  Box,
  Button,
  Heading,
  Link,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import type { ReactNode } from 'react';

import {
  postkitCallToActionRecipe,
  type PostkitCallToActionSlot,
} from '../recipes/call-to-action.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { postkitHeadingSize } from './heading-size.js';

export type CallToActionProps = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly description?: string;
  readonly primaryLabel?: string;
  readonly primaryHref?: string;
  readonly secondaryLabel?: string;
  readonly secondaryHref?: string;
  readonly children?: ReactNode;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitCallToActionSlot>;
} & RecipeVariantProps<typeof postkitCallToActionRecipe> &
  UnstyledProp;

export function CallToAction({
  title,
  eyebrow,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  children,
  rootProps,
  slotStyles,
  alignment,
  size,
  variant,
  unstyled,
}: CallToActionProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.callToAction,
    postkitCallToActionRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCallToActionSlot> = unstyled
    ? {}
    : recipe({ alignment, size, variant });
  const {
    css: rootCss,
    className: rootClassName,
    ...restRootProps
  } = rootProps ?? {};
  const hasActions =
    (primaryLabel && primaryHref) || (secondaryLabel && secondaryHref);

  return (
    <Box
      as="aside"
      data-postkit-component="CallToAction"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
      >
        {eyebrow ? (
          <Text
            className={recipe.classNameMap.eyebrow}
            css={[styles.eyebrow, slotStyles?.eyebrow]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Heading
          as="h2"
          size={postkitHeadingSize(size, {
            sm: 'xl',
            md: '2xl',
            lg: '3xl',
          })}
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Heading>
        {description || children ? (
          <Box
            className={recipe.classNameMap.body}
            css={[styles.body, slotStyles?.body]}
          >
            {children ?? description}
          </Box>
        ) : null}
      </Box>
      {hasActions ? (
        <Box
          className={recipe.classNameMap.actions}
          css={[styles.actions, slotStyles?.actions]}
        >
          {primaryLabel && primaryHref ? (
            <Button
              asChild
              size={size ?? 'md'}
              variant="solid"
              className={recipe.classNameMap.primaryAction}
              css={[styles.primaryAction, slotStyles?.primaryAction]}
            >
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Button
              asChild
              size={size ?? 'md'}
              variant="outline"
              className={recipe.classNameMap.secondaryAction}
              css={[styles.secondaryAction, slotStyles?.secondaryAction]}
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

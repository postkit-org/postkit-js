'use client';

import {
  Box,
  Button,
  CodeBlock as ChakraCodeBlock,
  Portal,
  Text,
  Tooltip,
  VisuallyHidden,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { codeBlockDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { usePostkitChakraAnatomy } from '../../lib/anatomy.js';
import { usePostkit, type PostkitCodeBlockConfig } from '../../lib/provider.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../../lib/recipes/types.js';
import { postkitRecipeKeys } from '../../lib/theme.js';
import {
  postkitCodeBlockRecipe,
  type PostkitCodeBlockSlot,
} from './code-block.recipe.js';

/*
 * CodeBlock keeps Chakra's (Ark) CodeBlock and clipboard for its copy action
 * (03 §5.3) and stamps the same anatomy as the headless `CodeBlock` in
 * `@postkit/react`; both pass the shared code copy spec. Syntax highlighting comes from the provider's `codeBlockAdapter`
 * (`@postkit/shiki`, or the plain-text default) through Chakra's CodeBlock.
 */

type SharedRootProps<Slot extends string> = {
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
};

function enabled(value: boolean | string | undefined, fallback = false) {
  return value === undefined
    ? fallback
    : typeof value === 'boolean'
      ? value
      : value === 'true';
}

function configuredValue<Value>(
  value: Value | undefined,
  configured: Value | undefined,
  fallback?: Value,
): Value | undefined {
  return value !== undefined
    ? value
    : configured !== undefined
      ? configured
      : fallback;
}

function rootParts(rootProps?: BoxProps) {
  const { css, className, ...rest } = rootProps ?? {};
  return { rootCss: css, rootClassName: className, restRootProps: rest };
}

function slotClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ') || undefined;
}

function highlightedLines(value?: string): number[] {
  const lines = new Set<number>();
  for (const part of value?.split(',') ?? []) {
    const [startValue, endValue] = part.trim().split('-');
    const start = Number(startValue);
    const end = Number(endValue ?? startValue);
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    for (
      let line = Math.max(1, start);
      line <= Math.min(end, start + 500);
      line += 1
    ) {
      lines.add(line);
    }
  }
  return [...lines];
}

export type CodeBlockProps = {
  readonly code?: string;
  readonly children?: ReactNode;
  readonly language?: string;
  readonly filename?: string;
  readonly highlightLines?: string;
  readonly lineNumbers?: boolean | string;
  readonly copy?: boolean | string;
  readonly copyLabel?: ReactNode;
  readonly copiedLabel?: ReactNode;
  readonly copyIcon?: ReactNode;
  readonly copiedIcon?: ReactNode;
  readonly copyAriaLabel?: string;
  readonly copyFeedback?: 'inline' | 'tooltip';
  readonly colorScheme?: PostkitCodeBlockConfig['colorScheme'];
  readonly wrap?: boolean | string;
  readonly maxHeight?: number | string;
} & SharedRootProps<PostkitCodeBlockSlot> &
  RecipeVariantProps<typeof postkitCodeBlockRecipe> &
  UnstyledProp;

export function CodeBlock({
  code,
  children,
  language,
  filename,
  highlightLines: highlightsValue,
  lineNumbers,
  copy,
  copyLabel,
  copiedLabel,
  copyIcon,
  copiedIcon,
  copyAriaLabel,
  copyFeedback,
  colorScheme,
  wrap,
  maxHeight,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: CodeBlockProps) {
  const { codeBlock: codeBlockConfig } = usePostkit();
  const source = code ?? (typeof children === 'string' ? children : '');
  const highlights = highlightedLines(highlightsValue);
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.codeBlock,
    postkitCodeBlockRecipe,
    { fallback: 'recipe' },
  );
  const resolvedSize = configuredValue(size, codeBlockConfig.size);
  const resolvedVariant = configuredValue(variant, codeBlockConfig.variant);
  const resolvedColorScheme = configuredValue(
    colorScheme,
    codeBlockConfig.colorScheme,
  );
  const styles: PostkitSlotStyles<PostkitCodeBlockSlot> = unstyled
    ? {}
    : recipe({ size: resolvedSize, variant: resolvedVariant });
  const anatomy = usePostkitChakraAnatomy<PostkitCodeBlockSlot>(
    codeBlockDefinition,
    { size: resolvedSize, variant: resolvedVariant },
    { recipeKey: postkitRecipeKeys.codeBlock, unstyled },
  );
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const codeBlockRootProps = restRootProps as Omit<
    ChakraCodeBlock.RootProps,
    'children' | 'code' | 'language' | 'meta' | 'size' | 'unstyled'
  >;
  const shouldNumber = enabled(
    configuredValue(lineNumbers, codeBlockConfig.lineNumbers),
  );
  const shouldWrap = enabled(configuredValue(wrap, codeBlockConfig.wrap));
  const shouldCopy =
    source.trim().length > 0 &&
    enabled(configuredValue(copy, codeBlockConfig.copy), true);
  const resolvedCopyLabel = configuredValue(
    copyLabel,
    codeBlockConfig.copyLabel,
    'Copy code',
  );
  const resolvedCopiedLabel = configuredValue(
    copiedLabel,
    codeBlockConfig.copiedLabel,
    'Copied',
  );
  const resolvedCopyIcon = configuredValue(copyIcon, codeBlockConfig.copyIcon);
  const resolvedCopiedIcon = configuredValue(
    copiedIcon,
    codeBlockConfig.copiedIcon,
  );
  const resolvedCopyAriaLabel = configuredValue(
    copyAriaLabel,
    codeBlockConfig.copyAriaLabel,
    'Copy code',
  );
  const resolvedCopyFeedback = configuredValue(
    copyFeedback,
    codeBlockConfig.copyFeedback,
    'inline',
  );

  return (
    <ChakraCodeBlock.Root
      {...anatomy('root')}
      {...codeBlockRootProps}
      code={source}
      language={language}
      meta={{
        highlightLines: highlights,
        showLineNumbers: shouldNumber,
        wordWrap: shouldWrap,
      }}
      {...(resolvedColorScheme
        ? { defaultColorScheme: resolvedColorScheme }
        : {})}
      size={resolvedSize}
      unstyled={unstyled}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {filename || language || shouldCopy ? (
        <ChakraCodeBlock.Header
          {...anatomy('header')}
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          {filename || language ? (
            <ChakraCodeBlock.Title {...anatomy('title')}>
              {filename ? (
                <Box
                  as="span"
                  {...anatomy('filename')}
                  className={slotClassNames(
                    recipe.classNameMap.filename,
                    recipe.classNameMap.title,
                  )}
                  css={[
                    styles.filename,
                    styles.title,
                    slotStyles?.filename,
                    slotStyles?.title,
                  ]}
                >
                  {filename}
                </Box>
              ) : null}
              {language ? (
                <Text
                  as="span"
                  {...anatomy('language')}
                  className={recipe.classNameMap.language}
                  css={[styles.language, slotStyles?.language]}
                >
                  {language}
                </Text>
              ) : null}
            </ChakraCodeBlock.Title>
          ) : null}
          {shouldCopy ? (
            <ChakraCodeBlock.Control
              {...anatomy('control')}
              className={slotClassNames(
                recipe.classNameMap.actions,
                recipe.classNameMap.control,
              )}
              css={[
                { marginInlineStart: 'auto' },
                styles.actions,
                styles.control,
                slotStyles?.actions,
                slotStyles?.control,
              ]}
            >
              <ChakraCodeBlock.Context>
                {({ clipboard }) => {
                  const trigger = (
                    <ChakraCodeBlock.CopyTrigger
                      asChild
                      {...anatomy('copyTrigger')}
                      className={slotClassNames(
                        recipe.classNameMap.button,
                        recipe.classNameMap.copyTrigger,
                      )}
                      css={[
                        styles.button,
                        styles.copyTrigger,
                        slotStyles?.button,
                        slotStyles?.copyTrigger,
                      ]}
                    >
                      <Button
                        type="button"
                        aria-label={resolvedCopyAriaLabel}
                        size={
                          resolvedSize === 'lg'
                            ? 'sm'
                            : resolvedSize === 'sm'
                              ? '2xs'
                              : 'xs'
                        }
                        variant="ghost"
                      >
                        <ChakraCodeBlock.CopyIndicator
                          {...anatomy('copyIndicator')}
                          className={recipe.classNameMap.copyIndicator}
                          aria-live={
                            resolvedCopyFeedback === 'inline'
                              ? 'polite'
                              : undefined
                          }
                          css={[
                            styles.copyIndicator,
                            slotStyles?.copyIndicator,
                          ]}
                          {...(resolvedCopyFeedback === 'tooltip'
                            ? resolvedCopiedIcon === undefined
                              ? {}
                              : { copied: resolvedCopiedIcon }
                            : {
                                copied: (
                                  <>
                                    {resolvedCopiedIcon}
                                    {resolvedCopiedLabel}
                                  </>
                                ),
                              })}
                        >
                          {resolvedCopyIcon}
                          {resolvedCopyLabel}
                        </ChakraCodeBlock.CopyIndicator>
                      </Button>
                    </ChakraCodeBlock.CopyTrigger>
                  );

                  if (resolvedCopyFeedback === 'inline') {
                    return trigger;
                  }

                  return (
                    <>
                      <Tooltip.Root
                        open={clipboard.copied}
                        positioning={{ placement: 'top' }}
                      >
                        <Tooltip.Trigger asChild>{trigger}</Tooltip.Trigger>
                        {resolvedCopiedLabel !== null ? (
                          <Portal>
                            <Tooltip.Positioner>
                              <Tooltip.Content>
                                {resolvedCopiedLabel}
                              </Tooltip.Content>
                            </Tooltip.Positioner>
                          </Portal>
                        ) : null}
                      </Tooltip.Root>
                      <VisuallyHidden aria-live="polite" aria-atomic="true">
                        {clipboard.copied ? resolvedCopiedLabel : null}
                      </VisuallyHidden>
                    </>
                  );
                }}
              </ChakraCodeBlock.Context>
            </ChakraCodeBlock.Control>
          ) : null}
        </ChakraCodeBlock.Header>
      ) : null}
      <ChakraCodeBlock.Content
        {...anatomy('content')}
        // Chakra puts `aria-expanded` on the content, a generic element whose role doesn't
        // allow it (axe `aria-allowed-attr`). Expanded state belongs on the control that
        // toggles it, with `aria-controls`; Chakra's CollapseTrigger already does that, and
        // Postkit renders no collapse control, so the content drops the attribute.
        // (`undefined` is compacted away before Chakra's default; `null` overrides it.)
        aria-expanded={null as unknown as undefined}
        className={slotClassNames(
          recipe.classNameMap.scroller,
          recipe.classNameMap.content,
        )}
        css={[
          styles.scroller,
          styles.content,
          maxHeight ? { maxHeight } : undefined,
          slotStyles?.scroller,
          slotStyles?.content,
        ]}
      >
        <ChakraCodeBlock.Code
          {...anatomy('code')}
          className={recipe.classNameMap.code}
          css={[styles.code, slotStyles?.code]}
        >
          <ChakraCodeBlock.CodeText
            {...anatomy('codeText')}
            className={slotClassNames(
              recipe.classNameMap.lineContent,
              recipe.classNameMap.codeText,
            )}
            css={[
              styles.lineContent,
              styles.codeText,
              {
                '& [data-line]': {
                  ...styles.line,
                  ...slotStyles?.line,
                },
                '& [data-line]::before': {
                  ...styles.lineNumber,
                  ...slotStyles?.lineNumber,
                },
              },
              slotStyles?.lineContent,
              slotStyles?.codeText,
            ]}
          />
        </ChakraCodeBlock.Code>
      </ChakraCodeBlock.Content>
    </ChakraCodeBlock.Root>
  );
}

'use client';

import {
  Box,
  Button,
  CodeBlock as ChakraCodeBlock,
  Heading,
  Link,
  Portal,
  Tabs as ChakraTabs,
  Text,
  Tooltip,
  VisuallyHidden,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';

import { parseJsonProp } from '../json-props.js';
import {
  postkitCodeBlockRecipe,
  postkitCodeGroupRecipe,
  postkitDiffRecipe,
  postkitFileCardRecipe,
  postkitFileTreeRecipe,
  postkitTerminalRecipe,
  type PostkitCodeBlockSlot,
  type PostkitCodeGroupSlot,
  type PostkitDiffSlot,
  type PostkitFileCardSlot,
  type PostkitFileTreeSlot,
  type PostkitTerminalSlot,
} from '../recipes/technical-content.recipe.js';
import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import { usePostkit, type PostkitCodeBlockConfig } from '../provider.js';
import { postkitHeadingSize } from './heading-size.js';

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
      data-postkit-component="CodeBlock"
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
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          {filename || language ? (
            <ChakraCodeBlock.Title>
              {filename ? (
                <Box
                  as="span"
                  className={recipe.classNameMap.filename}
                  css={[styles.filename, slotStyles?.filename]}
                >
                  {filename}
                </Box>
              ) : null}
              {language ? (
                <Text
                  as="span"
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
              className={recipe.classNameMap.actions}
              css={[
                { marginInlineStart: 'auto' },
                styles.actions,
                slotStyles?.actions,
              ]}
            >
              <ChakraCodeBlock.Context>
                {({ clipboard }) => {
                  const trigger = (
                    <ChakraCodeBlock.CopyTrigger
                      asChild
                      className={recipe.classNameMap.button}
                      css={[styles.button, slotStyles?.button]}
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
                          aria-live={
                            resolvedCopyFeedback === 'inline'
                              ? 'polite'
                              : undefined
                          }
                          css={{
                            alignItems: 'center',
                            display: 'inline-flex',
                            gap: 'inherit',
                          }}
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
        className={recipe.classNameMap.scroller}
        css={[
          styles.scroller,
          maxHeight ? { maxHeight } : undefined,
          slotStyles?.scroller,
        ]}
      >
        <ChakraCodeBlock.Code
          className={recipe.classNameMap.code}
          css={[
            styles.code,
            shouldWrap ? { minWidth: 0 } : undefined,
            slotStyles?.code,
          ]}
        >
          <ChakraCodeBlock.CodeText
            className={recipe.classNameMap.lineContent}
            css={[
              styles.lineContent,
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
            ]}
          />
        </ChakraCodeBlock.Code>
      </ChakraCodeBlock.Content>
    </ChakraCodeBlock.Root>
  );
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
      onValueChange={({ value: nextValue }) => setSelected(Number(nextValue))}
      size={size ?? 'md'}
      variant={variant ?? 'outline'}
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

export type TerminalProps = {
  readonly command: string;
  readonly output?: string;
  readonly prompt?: string;
  readonly title?: string;
} & SharedRootProps<PostkitTerminalSlot> &
  RecipeVariantProps<typeof postkitTerminalRecipe> &
  UnstyledProp;

export function Terminal({
  command,
  output,
  prompt = '$',
  title = 'Terminal',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: TerminalProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.terminal,
    postkitTerminalRecipe,
  );
  const styles: PostkitSlotStyles<PostkitTerminalSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="Terminal"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        className={recipe.classNameMap.header}
        css={[styles.header, slotStyles?.header]}
      >
        <Box
          aria-hidden="true"
          className={recipe.classNameMap.dots}
          css={[styles.dots, slotStyles?.dots]}
        >
          ● ● ●
        </Box>
        <Text
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Text>
        <span />
      </Box>
      <Box
        className={recipe.classNameMap.body}
        css={[styles.body, slotStyles?.body]}
      >
        <Box
          as="span"
          aria-hidden="true"
          className={recipe.classNameMap.prompt}
          css={[styles.prompt, slotStyles?.prompt]}
        >
          {prompt}
        </Box>
        <Box
          as="code"
          className={recipe.classNameMap.command}
          css={[styles.command, slotStyles?.command]}
        >
          {command}
        </Box>
        {output ? (
          <Box
            as="samp"
            className={recipe.classNameMap.output}
            css={[styles.output, slotStyles?.output]}
          >
            {output}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export type DiffProps = {
  readonly diff: string;
  readonly title?: string;
} & SharedRootProps<PostkitDiffSlot> &
  RecipeVariantProps<typeof postkitDiffRecipe> &
  UnstyledProp;

export function Diff({
  diff,
  title,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: DiffProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.diff,
    postkitDiffRecipe,
  );
  const styles: PostkitSlotStyles<PostkitDiffSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="Diff"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {title ? (
        <Box
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          <Text
            className={recipe.classNameMap.title}
            css={[styles.title, slotStyles?.title]}
          >
            {title}
          </Text>
        </Box>
      ) : null}
      <Box
        as="pre"
        className={recipe.classNameMap.code}
        css={[styles.code, slotStyles?.code]}
      >
        <Box as="code">
          {diff
            .replace(/\n$/, '')
            .split('\n')
            .map((line, index) => {
              const marker = line.startsWith('+')
                ? '+'
                : line.startsWith('-')
                  ? '−'
                  : ' ';
              const tone =
                marker === '+'
                  ? { background: 'green.subtle' }
                  : marker === '−'
                    ? { background: 'red.subtle' }
                    : undefined;
              return (
                <Box
                  as="span"
                  data-diff={
                    marker === '+'
                      ? 'addition'
                      : marker === '−'
                        ? 'deletion'
                        : 'context'
                  }
                  className={recipe.classNameMap.line}
                  css={[styles.line, tone, slotStyles?.line]}
                  key={index}
                >
                  <Box
                    as="span"
                    aria-hidden="true"
                    className={recipe.classNameMap.marker}
                    css={[styles.marker, slotStyles?.marker]}
                  >
                    {marker}
                  </Box>
                  <Box
                    as="span"
                    className={recipe.classNameMap.content}
                    css={[styles.content, slotStyles?.content]}
                  >
                    {line.slice(marker === ' ' ? 0 : 1) || ' '}
                  </Box>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
}

export interface FileTreeItem {
  readonly path: string;
  readonly type?: 'file' | 'folder';
  readonly meta?: string;
}
export type FileTreeProps = {
  readonly items: string | readonly FileTreeItem[];
  readonly title?: string;
} & SharedRootProps<PostkitFileTreeSlot> &
  RecipeVariantProps<typeof postkitFileTreeRecipe> &
  UnstyledProp;

export function FileTree({
  items: value,
  title,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: FileTreeProps) {
  const items = parseJsonProp<FileTreeItem>(value, 'FileTree items');
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.fileTree,
    postkitFileTreeRecipe,
  );
  const styles: PostkitSlotStyles<PostkitFileTreeSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="FileTree"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {title ? (
        <Heading
          as="p"
          size={postkitHeadingSize(size, {
            sm: 'sm',
            md: 'md',
            lg: 'lg',
          })}
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Heading>
      ) : null}
      <Box
        as="ul"
        className={recipe.classNameMap.list}
        css={[styles.list, slotStyles?.list]}
      >
        {items.map((item, index) => (
          <Box
            as="li"
            className={recipe.classNameMap.item}
            css={[
              styles.item,
              {
                paddingInlineStart: `${Math.max(0, item.path.split('/').length - 1) * 1.25}em`,
              },
              slotStyles?.item,
            ]}
            key={`${item.path}-${index}`}
          >
            <Box
              as="span"
              aria-hidden="true"
              className={recipe.classNameMap.icon}
              css={[styles.icon, slotStyles?.icon]}
            >
              {item.type === 'folder' ? '▸' : '·'}
            </Box>
            <Box
              as="span"
              className={recipe.classNameMap.path}
              css={[styles.path, slotStyles?.path]}
            >
              {item.path.split('/').at(-1)}
            </Box>
            {item.meta ? (
              <Box
                as="span"
                className={recipe.classNameMap.meta}
                css={[styles.meta, slotStyles?.meta]}
              >
                {item.meta}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export type FileCardProps = {
  readonly href: string;
  readonly name: string;
  readonly description?: string;
  readonly fileType?: string;
  readonly fileSize?: string;
  readonly download?: boolean | string;
  readonly actionLabel?: string;
} & SharedRootProps<PostkitFileCardSlot> &
  RecipeVariantProps<typeof postkitFileCardRecipe> &
  UnstyledProp;

export function FileCard({
  href,
  name,
  description,
  fileType,
  fileSize,
  download = true,
  actionLabel,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: FileCardProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.fileCard,
    postkitFileCardRecipe,
  );
  const styles: PostkitSlotStyles<PostkitFileCardSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const extension = fileType ?? name.split('.').at(-1)?.toUpperCase() ?? 'FILE';
  return (
    <Box
      data-postkit-component="FileCard"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        aria-hidden="true"
        className={recipe.classNameMap.icon}
        css={[styles.icon, slotStyles?.icon]}
      >
        {extension.slice(0, 4)}
      </Box>
      <Box
        className={recipe.classNameMap.content}
        css={[styles.content, slotStyles?.content]}
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
          {name}
        </Heading>
        {description ? (
          <Text
            className={recipe.classNameMap.description}
            css={[styles.description, slotStyles?.description]}
          >
            {description}
          </Text>
        ) : null}
        {fileType || fileSize ? (
          <Text
            className={recipe.classNameMap.meta}
            css={[styles.meta, slotStyles?.meta]}
          >
            {[fileType, fileSize].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </Box>
      <Link
        href={href}
        download={enabled(download) ? '' : undefined}
        className={recipe.classNameMap.action}
        css={[styles.action, slotStyles?.action]}
      >
        {actionLabel ?? (enabled(download) ? 'Download' : 'Open')}
      </Link>
    </Box>
  );
}

'use client';

import {
  Box,
  CodeBlock,
  Link,
  Text,
  chakra,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { useId, useState, type ReactNode } from 'react';

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

const ActionButton = chakra('button');

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

export type PostkitCodeBlockProps = {
  readonly code?: string;
  readonly children?: ReactNode;
  readonly language?: string;
  readonly filename?: string;
  readonly highlightLines?: string;
  readonly lineNumbers?: boolean | string;
  readonly copy?: boolean | string;
  readonly wrap?: boolean | string;
  readonly maxHeight?: number | string;
} & SharedRootProps<PostkitCodeBlockSlot> &
  RecipeVariantProps<typeof postkitCodeBlockRecipe> &
  UnstyledProp;

export function PostkitCodeBlock({
  code,
  children,
  language,
  filename,
  highlightLines: highlightsValue,
  lineNumbers = true,
  copy = true,
  wrap,
  maxHeight,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitCodeBlockProps) {
  const source = code ?? (typeof children === 'string' ? children : '');
  const highlights = highlightedLines(highlightsValue);
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.codeBlock,
    postkitCodeBlockRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCodeBlockSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  const codeBlockRootProps = restRootProps as Omit<
    CodeBlock.RootProps,
    'children' | 'code' | 'language' | 'meta' | 'size' | 'unstyled'
  >;
  const shouldNumber = enabled(lineNumbers, true);
  const shouldWrap = enabled(wrap);

  return (
    <CodeBlock.Root
      data-postkit-component="CodeBlock"
      {...codeBlockRootProps}
      code={source}
      language={language}
      meta={{
        highlightLines: highlights,
        showLineNumbers: shouldNumber,
        wordWrap: shouldWrap,
      }}
      size={size}
      unstyled={unstyled}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      {filename || language || enabled(copy, true) ? (
        <CodeBlock.Header
          className={recipe.classNameMap.header}
          css={[styles.header, slotStyles?.header]}
        >
          <CodeBlock.Title
            className={recipe.classNameMap.filename}
            css={[styles.filename, slotStyles?.filename]}
          >
            {filename}
          </CodeBlock.Title>
          <CodeBlock.Control
            className={recipe.classNameMap.actions}
            css={[styles.actions, slotStyles?.actions]}
          >
            {language ? (
              <Text
                className={recipe.classNameMap.language}
                css={[styles.language, slotStyles?.language]}
              >
                {language}
              </Text>
            ) : null}
            {enabled(copy, true) ? (
              <CodeBlock.CopyTrigger
                type="button"
                aria-label="Copy code"
                className={recipe.classNameMap.button}
                css={[styles.button, slotStyles?.button]}
              >
                <CodeBlock.CopyIndicator copied="Copied">
                  Copy
                </CodeBlock.CopyIndicator>
              </CodeBlock.CopyTrigger>
            ) : null}
          </CodeBlock.Control>
        </CodeBlock.Header>
      ) : null}
      <CodeBlock.Content
        className={recipe.classNameMap.scroller}
        css={[
          styles.scroller,
          maxHeight ? { maxHeight } : undefined,
          slotStyles?.scroller,
        ]}
      >
        <CodeBlock.Code
          className={recipe.classNameMap.code}
          css={[
            styles.code,
            shouldWrap ? { minWidth: 0 } : undefined,
            slotStyles?.code,
          ]}
        >
          <CodeBlock.CodeText
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
        </CodeBlock.Code>
      </CodeBlock.Content>
    </CodeBlock.Root>
  );
}

export interface PostkitCodeGroupItem {
  readonly label: string;
  readonly code: string;
  readonly language?: string;
  readonly filename?: string;
}
export type PostkitCodeGroupProps = {
  readonly items: string | readonly PostkitCodeGroupItem[];
  readonly label?: string;
  readonly initialIndex?: number | string;
} & SharedRootProps<PostkitCodeGroupSlot> &
  RecipeVariantProps<typeof postkitCodeGroupRecipe> &
  UnstyledProp;

export function PostkitCodeGroup({
  items: value,
  label = 'Code examples',
  initialIndex = 0,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitCodeGroupProps) {
  const items = parseJsonProp<PostkitCodeGroupItem>(value, 'CodeGroup items');
  const requested = Number(initialIndex);
  const [selected, setSelected] = useState(
    Number.isFinite(requested)
      ? Math.max(0, Math.min(items.length - 1, requested))
      : 0,
  );
  const id = useId();
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.codeGroup,
    postkitCodeGroupRecipe,
  );
  const styles: PostkitSlotStyles<PostkitCodeGroupSlot> = unstyled
    ? {}
    : recipe({ size, variant });
  const { rootCss, rootClassName, restRootProps } = rootParts(rootProps);
  return (
    <Box
      data-postkit-component="CodeGroup"
      {...restRootProps}
      className={postkitSlotClassName(recipe.classNameMap.root, rootClassName)}
      css={[styles.root, slotStyles?.root, rootCss]}
    >
      <Box
        role="tablist"
        aria-label={label}
        className={recipe.classNameMap.tabs}
        css={[styles.tabs, slotStyles?.tabs]}
      >
        {items.map((item, index) => (
          <ActionButton
            role="tab"
            type="button"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === index}
            onClick={() => setSelected(index)}
            className={recipe.classNameMap.tab}
            css={[styles.tab, slotStyles?.tab]}
            key={`${item.label}-${index}`}
          >
            {item.label}
          </ActionButton>
        ))}
      </Box>
      {items.map((item, index) => (
        <Box
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selected !== index}
          className={recipe.classNameMap.panel}
          css={[styles.panel, slotStyles?.panel]}
          key={`${item.label}-${index}`}
        >
          <PostkitCodeBlock
            code={item.code}
            language={item.language}
            filename={item.filename}
            variant="plain"
            size={size}
          />
        </Box>
      ))}
    </Box>
  );
}

export type PostkitTerminalProps = {
  readonly command: string;
  readonly output?: string;
  readonly prompt?: string;
  readonly title?: string;
} & SharedRootProps<PostkitTerminalSlot> &
  RecipeVariantProps<typeof postkitTerminalRecipe> &
  UnstyledProp;

export function PostkitTerminal({
  command,
  output,
  prompt = '$',
  title = 'Terminal',
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitTerminalProps) {
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

export type PostkitDiffProps = {
  readonly diff: string;
  readonly title?: string;
} & SharedRootProps<PostkitDiffSlot> &
  RecipeVariantProps<typeof postkitDiffRecipe> &
  UnstyledProp;

export function PostkitDiff({
  diff,
  title,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitDiffProps) {
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

export interface PostkitFileTreeItem {
  readonly path: string;
  readonly type?: 'file' | 'folder';
  readonly meta?: string;
}
export type PostkitFileTreeProps = {
  readonly items: string | readonly PostkitFileTreeItem[];
  readonly title?: string;
} & SharedRootProps<PostkitFileTreeSlot> &
  RecipeVariantProps<typeof postkitFileTreeRecipe> &
  UnstyledProp;

export function PostkitFileTree({
  items: value,
  title,
  rootProps,
  slotStyles,
  size,
  variant,
  unstyled,
}: PostkitFileTreeProps) {
  const items = parseJsonProp<PostkitFileTreeItem>(value, 'FileTree items');
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
        <Text
          className={recipe.classNameMap.title}
          css={[styles.title, slotStyles?.title]}
        >
          {title}
        </Text>
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

export type PostkitFileCardProps = {
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

export function PostkitFileCard({
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
}: PostkitFileCardProps) {
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
        <Text
          className={recipe.classNameMap.name}
          css={[styles.name, slotStyles?.name]}
        >
          {name}
        </Text>
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

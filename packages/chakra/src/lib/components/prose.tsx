'use client';

import {
  Blockquote,
  chakra,
  Code as ChakraCode,
  Heading,
  Image,
  Kbd,
  Link as ChakraLink,
  List,
  Mark,
  Separator,
  Table,
  type BoxProps,
  type BlockquoteContentProps,
  type ChakraComponent,
  type HeadingProps,
  type HTMLChakraProps,
  type ListItemProps,
  type ListRootProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import {
  createContext,
  createElement,
  isValidElement,
  type ComponentType,
  type ElementType,
  type ReactNode,
  useContext,
} from 'react';

import { CodeBlock } from './technical-content.js';
import { resolvePostkitFenceMetadata } from '../fence-metadata.js';
import {
  postkitProseListRhythm,
  postkitProseRecipe,
  postkitProseRhythm,
  type PostkitProseSlot,
} from '../recipes/prose.recipe.js';
import {
  postkitSlotClassName,
  usePostkitSlotRecipe,
} from '../recipes/types.js';
import { postkitRecipeKeys } from '../theme.js';
import {
  createPostkitLink,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from '../link.js';

function createPostkitProseElement<Element extends ElementType>(
  element: Element,
  slot: PostkitProseSlot,
): ChakraComponent<Element> {
  const StyledElement = chakra(element);
  const Component = StyledElement as ComponentType<
    Readonly<Record<string, unknown>>
  >;

  function PostkitProseElement(props: HTMLChakraProps<Element>) {
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();
    const { className, css, ...rest } = props;

    return createElement(Component, {
      ...rest,
      'data-postkit-prose-element': slot,
      className: postkitSlotClassName(recipe.classNameMap[slot], className),
      css: [styles[slot], css],
    });
  }

  PostkitProseElement.displayName = `Prose.${slot}`;
  return PostkitProseElement as ChakraComponent<Element>;
}

function createPostkitProsePrimitive<Element extends ElementType>(
  primitive: ComponentType<Readonly<Record<string, unknown>>>,
  slot: PostkitProseSlot,
): ChakraComponent<Element> {
  function PostkitProsePrimitive(props: HTMLChakraProps<Element>) {
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();
    const { className, css, ...rest } = props;

    return createElement(primitive, {
      ...rest,
      'data-postkit-prose-element': slot,
      className: postkitSlotClassName(recipe.classNameMap[slot], className),
      css: [styles[slot], css],
    });
  }

  PostkitProsePrimitive.displayName = `Prose.${slot}`;
  return PostkitProsePrimitive as ChakraComponent<Element>;
}

function createPostkitProseHeading<Element extends `h${1 | 2 | 3 | 4 | 5 | 6}`>(
  element: Element,
  size: HeadingProps['size'],
): ChakraComponent<Element> {
  function PostkitProseHeading({ className, css, ...props }: HeadingProps) {
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();

    return (
      <Heading
        {...props}
        as={element}
        size={size}
        data-postkit-prose-element={element}
        className={postkitSlotClassName(
          recipe.classNameMap[element],
          className,
        )}
        css={[styles[element], css]}
      />
    );
  }

  PostkitProseHeading.displayName = `Prose.${element}`;
  return PostkitProseHeading as ChakraComponent<Element>;
}

type PostkitOrderedListRootProps = Omit<
  ListRootProps,
  keyof HTMLChakraProps<'ol'>
> &
  HTMLChakraProps<'ol'> &
  UnstyledProp;

function createPostkitProseListRoot(
  element: 'ul',
): ComponentType<ListRootProps>;
function createPostkitProseListRoot(
  element: 'ol',
): ComponentType<PostkitOrderedListRootProps>;
function createPostkitProseListRoot(element: 'ul' | 'ol') {
  type ProseListRootProps = ListRootProps | PostkitOrderedListRootProps;

  function PostkitProseListRoot({
    children,
    className,
    css,
    unstyled,
    ...props
  }: ProseListRootProps) {
    const inheritedUnstyled = useContext(PostkitProseListUnstyledContext);
    const isUnstyled = unstyled ?? inheritedUnstyled;
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();

    return (
      <PostkitProseListUnstyledContext.Provider value={isUnstyled}>
        <List.Root
          {...(props as ListRootProps)}
          as={element}
          unstyled={isUnstyled}
          data-postkit-prose-element={element}
          className={postkitSlotClassName(
            recipe.classNameMap[element],
            className,
          )}
          css={[
            isUnstyled ? undefined : postkitProseListRhythm[element],
            isUnstyled ? undefined : styles[element],
            css,
          ]}
        >
          {children}
        </List.Root>
      </PostkitProseListUnstyledContext.Provider>
    );
  }

  PostkitProseListRoot.displayName = `Prose.${element}`;
  return PostkitProseListRoot;
}

const PostkitProseListUnstyledContext = createContext(false);

function PostkitProseBlockquote({
  children,
  className,
  css,
  unstyled,
  ...props
}: BlockquoteContentProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.prose,
    postkitProseRecipe,
  );
  const styles = recipe();

  return (
    <Blockquote.Root
      unstyled={unstyled}
      data-postkit-prose-element="blockquote"
      className={postkitSlotClassName(
        recipe.classNameMap.blockquote,
        className,
      )}
      css={[unstyled ? undefined : styles.blockquote, css]}
    >
      <Blockquote.Content {...props} unstyled={unstyled}>
        {children}
      </Blockquote.Content>
    </Blockquote.Root>
  );
}

PostkitProseBlockquote.displayName = 'Prose.blockquote';

function PostkitProseListItem({
  className,
  css,
  unstyled,
  ...props
}: ListItemProps) {
  const inheritedUnstyled = useContext(PostkitProseListUnstyledContext);
  const isUnstyled = unstyled ?? inheritedUnstyled;
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.prose,
    postkitProseRecipe,
  );
  const styles = recipe();

  return (
    <List.Item
      {...props}
      unstyled={isUnstyled}
      data-postkit-prose-element="li"
      className={postkitSlotClassName(recipe.classNameMap.li, className)}
      css={[
        isUnstyled ? undefined : postkitProseListRhythm.li,
        isUnstyled ? undefined : styles.li,
        css,
      ]}
    />
  );
}

PostkitProseListItem.displayName = 'Prose.li';

export type ProseProps = HTMLChakraProps<'div'> & UnstyledProp;

export function Prose({ className, css, unstyled, ...props }: ProseProps) {
  const recipe = usePostkitSlotRecipe(
    postkitRecipeKeys.prose,
    postkitProseRecipe,
  );
  const styles = recipe();

  return (
    <chakra.div
      data-postkit-component="Prose"
      data-postkit-prose=""
      {...props}
      className={postkitSlotClassName(recipe.classNameMap.root, className)}
      css={[unstyled ? undefined : postkitProseRhythm, styles.root, css]}
    />
  );
}

export function createPostkitProseLink(
  Link: PostkitLinkComponent,
): PostkitLinkComponent {
  function ProseLink({ className, ...props }: PostkitLinkProps) {
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();

    return (
      <ChakraLink
        asChild
        data-postkit-prose-element="a"
        className={postkitSlotClassName(recipe.classNameMap.a, className)}
        css={styles.a}
      >
        <Link {...props} />
      </ChakraLink>
    );
  }

  ProseLink.displayName = 'Prose.a';
  return ProseLink;
}

const PostkitProsePreElement = createPostkitProseElement('pre', 'pre');
const fencedCodeLanguagePattern = /(?:^|\s)language-([^\s]+)/;

interface FencedCodeElementProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly meta?: string;
  readonly metastring?: string;
  readonly 'data-meta'?: string;
  readonly 'data-filename'?: string;
  readonly 'data-title'?: string;
  readonly 'data-highlight-lines'?: string;
  readonly 'data-line-numbers'?: boolean | string;
  readonly 'data-max-height'?: number | string;
  readonly 'data-wrap'?: boolean | string;
}

export type ProsePreProps = HTMLChakraProps<'pre'> & {
  readonly 'data-meta'?: string;
  readonly 'data-filename'?: string;
  readonly 'data-title'?: string;
  readonly 'data-highlight-lines'?: string;
  readonly 'data-line-numbers'?: boolean | string;
  readonly 'data-max-height'?: number | string;
  readonly 'data-wrap'?: boolean | string;
};

export function ProsePre({
  children,
  'data-meta': meta,
  'data-filename': filename,
  'data-title': title,
  'data-highlight-lines': highlightLines,
  'data-line-numbers': lineNumbers,
  'data-max-height': maxHeight,
  'data-wrap': wrap,
  ...props
}: ProsePreProps) {
  if (isValidElement<FencedCodeElementProps>(children)) {
    const source = children.props.children;
    if (typeof source === 'string') {
      const language = children.props.className?.match(
        fencedCodeLanguagePattern,
      )?.[1];
      const metadata = resolvePostkitFenceMetadata(
        {
          filename,
          highlightLines,
          lineNumbers,
          maxHeight,
          meta,
          title,
          wrap,
        },
        {
          filename: children.props['data-filename'],
          highlightLines: children.props['data-highlight-lines'],
          lineNumbers: children.props['data-line-numbers'],
          maxHeight: children.props['data-max-height'],
          meta:
            children.props['data-meta'] ??
            children.props.metastring ??
            children.props.meta,
          title: children.props['data-title'],
          wrap: children.props['data-wrap'],
        },
      );

      return (
        <CodeBlock
          code={source}
          filename={metadata.filename}
          highlightLines={metadata.highlightLines}
          language={language}
          lineNumbers={metadata.lineNumbers}
          maxHeight={metadata.maxHeight}
          rootProps={props as BoxProps}
          wrap={metadata.wrap}
        />
      );
    }
  }

  return <PostkitProsePreElement {...props}>{children}</PostkitProsePreElement>;
}

export const postkitProseComponents = Object.freeze({
  wrapper: Prose,
  h1: createPostkitProseHeading('h1', { base: '3xl', md: '5xl' }),
  h2: createPostkitProseHeading('h2', { base: '2xl', md: '3xl' }),
  h3: createPostkitProseHeading('h3', { base: 'xl', md: '2xl' }),
  h4: createPostkitProseHeading('h4', 'xl'),
  h5: createPostkitProseHeading('h5', 'lg'),
  h6: createPostkitProseHeading('h6', 'md'),
  p: createPostkitProseElement('p', 'p'),
  a: createPostkitProseLink(createPostkitLink()),
  blockquote: PostkitProseBlockquote,
  ul: createPostkitProseListRoot('ul'),
  ol: createPostkitProseListRoot('ol'),
  li: PostkitProseListItem,
  hr: createPostkitProsePrimitive<'hr'>(
    Separator as ComponentType<Readonly<Record<string, unknown>>>,
    'hr',
  ),
  pre: ProsePre,
  code: createPostkitProsePrimitive<'code'>(
    ChakraCode as ComponentType<Readonly<Record<string, unknown>>>,
    'code',
  ),
  strong: createPostkitProseElement('strong', 'strong'),
  em: createPostkitProseElement('em', 'em'),
  del: createPostkitProseElement('del', 'del'),
  table: createPostkitProsePrimitive<'table'>(
    Table.Root as ComponentType<Readonly<Record<string, unknown>>>,
    'table',
  ),
  thead: createPostkitProsePrimitive<'thead'>(
    Table.Header as ComponentType<Readonly<Record<string, unknown>>>,
    'thead',
  ),
  tbody: createPostkitProsePrimitive<'tbody'>(
    Table.Body as ComponentType<Readonly<Record<string, unknown>>>,
    'tbody',
  ),
  tr: createPostkitProsePrimitive<'tr'>(
    Table.Row as ComponentType<Readonly<Record<string, unknown>>>,
    'tr',
  ),
  th: createPostkitProsePrimitive<'th'>(
    Table.ColumnHeader as ComponentType<Readonly<Record<string, unknown>>>,
    'th',
  ),
  td: createPostkitProsePrimitive<'td'>(
    Table.Cell as ComponentType<Readonly<Record<string, unknown>>>,
    'td',
  ),
  img: createPostkitProsePrimitive<'img'>(
    Image as ComponentType<Readonly<Record<string, unknown>>>,
    'img',
  ),
  figure: createPostkitProseElement('figure', 'figure'),
  figcaption: createPostkitProseElement('figcaption', 'figcaption'),
  sup: createPostkitProseElement('sup', 'sup'),
  sub: createPostkitProseElement('sub', 'sub'),
  section: createPostkitProseElement('section', 'section'),
  dl: createPostkitProseElement('dl', 'dl'),
  dt: createPostkitProseElement('dt', 'dt'),
  dd: createPostkitProseElement('dd', 'dd'),
  kbd: createPostkitProsePrimitive<'kbd'>(
    Kbd as ComponentType<Readonly<Record<string, unknown>>>,
    'kbd',
  ),
  mark: createPostkitProsePrimitive<'mark'>(
    Mark as ComponentType<Readonly<Record<string, unknown>>>,
    'mark',
  ),
  small: createPostkitProseElement('small', 'small'),
  details: createPostkitProseElement('details', 'details'),
  summary: createPostkitProseElement('summary', 'summary'),
  input: createPostkitProseElement('input', 'input'),
  br: createPostkitProseElement('br', 'br'),
});

export type ProseComponents = typeof postkitProseComponents;

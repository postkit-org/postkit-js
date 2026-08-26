'use client';

import {
  chakra,
  type BoxProps,
  type ChakraComponent,
  type HTMLChakraProps,
} from '@chakra-ui/react';
import {
  createElement,
  isValidElement,
  type ComponentType,
  type ElementType,
  type ReactNode,
} from 'react';

import { CodeBlock } from './technical-content.js';
import {
  postkitProseRecipe,
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

export type ProseProps = HTMLChakraProps<'div'>;

export function Prose({ className, css, ...props }: ProseProps) {
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
      css={[styles.root, css]}
    />
  );
}

export function createPostkitProseLink(
  Link: PostkitLinkComponent,
): PostkitLinkComponent {
  const StyledLink = chakra(Link);

  function ProseLink({ className, ...props }: PostkitLinkProps) {
    const recipe = usePostkitSlotRecipe(
      postkitRecipeKeys.prose,
      postkitProseRecipe,
    );
    const styles = recipe();

    return (
      <StyledLink
        {...props}
        data-postkit-prose-element="a"
        className={postkitSlotClassName(recipe.classNameMap.a, className)}
        css={styles.a}
      />
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
}

export function ProsePre({ children, ...props }: HTMLChakraProps<'pre'>) {
  if (isValidElement<FencedCodeElementProps>(children)) {
    const source = children.props.children;
    if (typeof source === 'string') {
      const language = children.props.className?.match(
        fencedCodeLanguagePattern,
      )?.[1];

      return (
        <CodeBlock
          code={source}
          language={language}
          rootProps={props as BoxProps}
        />
      );
    }
  }

  return <PostkitProsePreElement {...props}>{children}</PostkitProsePreElement>;
}

export const postkitProseComponents = Object.freeze({
  wrapper: Prose,
  h1: createPostkitProseElement('h1', 'h1'),
  h2: createPostkitProseElement('h2', 'h2'),
  h3: createPostkitProseElement('h3', 'h3'),
  h4: createPostkitProseElement('h4', 'h4'),
  h5: createPostkitProseElement('h5', 'h5'),
  h6: createPostkitProseElement('h6', 'h6'),
  p: createPostkitProseElement('p', 'p'),
  a: createPostkitProseLink(createPostkitLink()),
  blockquote: createPostkitProseElement('blockquote', 'blockquote'),
  ul: createPostkitProseElement('ul', 'ul'),
  ol: createPostkitProseElement('ol', 'ol'),
  li: createPostkitProseElement('li', 'li'),
  hr: createPostkitProseElement('hr', 'hr'),
  pre: ProsePre,
  code: createPostkitProseElement('code', 'code'),
  strong: createPostkitProseElement('strong', 'strong'),
  em: createPostkitProseElement('em', 'em'),
  del: createPostkitProseElement('del', 'del'),
  table: createPostkitProseElement('table', 'table'),
  thead: createPostkitProseElement('thead', 'thead'),
  tbody: createPostkitProseElement('tbody', 'tbody'),
  tr: createPostkitProseElement('tr', 'tr'),
  th: createPostkitProseElement('th', 'th'),
  td: createPostkitProseElement('td', 'td'),
  img: createPostkitProseElement('img', 'img'),
  figure: createPostkitProseElement('figure', 'figure'),
  figcaption: createPostkitProseElement('figcaption', 'figcaption'),
  sup: createPostkitProseElement('sup', 'sup'),
  sub: createPostkitProseElement('sub', 'sub'),
  section: createPostkitProseElement('section', 'section'),
  dl: createPostkitProseElement('dl', 'dl'),
  dt: createPostkitProseElement('dt', 'dt'),
  dd: createPostkitProseElement('dd', 'dd'),
  kbd: createPostkitProseElement('kbd', 'kbd'),
  mark: createPostkitProseElement('mark', 'mark'),
  small: createPostkitProseElement('small', 'small'),
  details: createPostkitProseElement('details', 'details'),
  summary: createPostkitProseElement('summary', 'summary'),
  input: createPostkitProseElement('input', 'input'),
  br: createPostkitProseElement('br', 'br'),
});

export type ProseComponents = typeof postkitProseComponents;

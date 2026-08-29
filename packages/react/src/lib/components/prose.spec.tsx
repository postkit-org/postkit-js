/**
 * @jest-environment jsdom
 */

import {
  type CodeBlockAdapter,
  createSystem,
  defaultConfig,
  defineRecipe,
  defineSlotRecipe,
} from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { createPostkitMdxComponents } from '../mdx-components.js';
import { PostkitProvider } from '../provider.js';
import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
  postkitRecipeKeys,
} from '../theme.js';
import { postkitProseComponents } from './prose.js';

globalThis.structuredClone ??= <T,>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);

describe('Postkit prose', () => {
  it('provides styled semantic components for Markdown and documentation HTML', () => {
    const expectedElements = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'a',
      'blockquote',
      'ul',
      'ol',
      'li',
      'hr',
      'pre',
      'code',
      'strong',
      'em',
      'del',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'img',
      'figure',
      'figcaption',
      'sup',
      'sub',
      'section',
      'dl',
      'dt',
      'dd',
      'kbd',
      'mark',
      'small',
      'details',
      'summary',
      'input',
      'br',
    ];

    expect(Object.keys(postkitProseComponents)).toEqual([
      'wrapper',
      ...expectedElements,
    ]);
  });

  it('applies prose recipe slots through the default MDX component map', () => {
    const components = createPostkitMdxComponents();
    const Wrapper = components.wrapper;
    const H1 = components.h1;
    const Paragraph = components.p;
    const Code = components.code;

    render(
      <PostkitProvider>
        <Wrapper data-testid="prose-root">
          <H1>Article title</H1>
          <Paragraph>
            A paragraph with <Code>inline code</Code>.
          </Paragraph>
        </Wrapper>
      </PostkitProvider>,
    );

    const root = screen.getByTestId('prose-root');
    const heading = screen.getByRole('heading', { level: 1 });

    expect(root.getAttribute('data-postkit-component')).toBe('Prose');
    expect(root.className).toContain('postkit-prose__root');
    expect(heading.getAttribute('data-postkit-prose-element')).toBe('h1');
    expect(heading.className).toContain('postkit-prose__h1');
    expect(screen.getByText('inline code').className).toContain(
      'postkit-prose__code',
    );
    expect(screen.getByText('inline code').className).toContain('chakra-code');
  });

  it('routes Markdown headings through the host Heading recipe', () => {
    const system = createSystem(defaultConfig, {
      theme: {
        recipes: {
          heading: defineRecipe({
            base: { fontWeight: 'normal' },
          }),
        },
      },
    });
    const Heading = createPostkitMdxComponents().h2;

    render(
      <PostkitProvider system={system} preset={postkitDefaultTheme}>
        <Heading>Host-owned heading</Heading>
      </PostkitProvider>,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('chakra-heading');
    expect(system.getRecipe('heading').base?.fontWeight).toBe('normal');
  });

  it('renders ordered, unordered, and nested Markdown lists semantically', () => {
    const components = createPostkitMdxComponents();
    const UnorderedList = components.ul;
    const OrderedList = components.ol;
    const ListItem = components.li;

    render(
      <PostkitProvider>
        <UnorderedList data-testid="unordered-list">
          <ListItem>
            First item
            <OrderedList data-testid="nested-ordered-list">
              <ListItem>Nested item</ListItem>
            </OrderedList>
          </ListItem>
          <ListItem>Second item</ListItem>
        </UnorderedList>
      </PostkitProvider>,
    );

    const unorderedList = screen.getByTestId('unordered-list');
    const orderedList = screen.getByTestId('nested-ordered-list');
    expect(unorderedList.tagName).toBe('UL');
    expect(orderedList.tagName).toBe('OL');
    expect(unorderedList.className).toContain('chakra-list__root');
    expect(orderedList.className).toContain('chakra-list__root');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(orderedList.parentElement?.tagName).toBe('LI');
  });

  it('routes Markdown lists through the host List recipe', () => {
    const system = createSystem(defaultConfig, {
      theme: {
        slotRecipes: {
          list: defineSlotRecipe({
            className: 'host-list',
            slots: ['root', 'item', 'indicator'],
            base: {
              root: { listStyleType: 'square' },
              item: { color: 'purple.500' },
            },
          }),
        },
      },
    });
    const components = createPostkitMdxComponents();
    const UnorderedList = components.ul;
    const ListItem = components.li;

    render(
      <PostkitProvider system={system}>
        <UnorderedList data-testid="host-list">
          <ListItem>Host-owned list</ListItem>
        </UnorderedList>
      </PostkitProvider>,
    );

    expect(screen.getByTestId('host-list').className).toContain(
      'host-list__root',
    );
    expect(screen.getByRole('listitem').className).toContain('host-list__item');
    expect(system.getSlotRecipe('list').base).toMatchObject({
      root: { listStyleType: 'square' },
      item: { color: 'purple.500' },
    });
  });

  it('lets Postkit theme and direct styles override list rhythm', () => {
    const theme = createPostkitTheme({
      prose: {
        base: {
          ul: { paddingInlineStart: '12' },
          li: { marginBlock: '3' },
        },
      },
    });
    const system = createPostkitSystem({ theme });
    const components = createPostkitMdxComponents();
    const UnorderedList = components.ul;
    const ListItem = components.li;

    render(
      <PostkitProvider system={system}>
        <UnorderedList css={{ paddingInlineStart: '16' }}>
          <ListItem>Custom rhythm</ListItem>
        </UnorderedList>
      </PostkitProvider>,
    );

    expect(system.getSlotRecipe(postkitRecipeKeys.prose).base).toMatchObject({
      ul: { paddingInlineStart: '12' },
      li: { marginBlock: '3' },
    });
    expect(screen.getByRole('list').className).toContain('chakra-list__root');
    expect(screen.getByRole('list').className).toMatch(/\bcss-/);
  });

  it('supports a completely unstyled list subtree', () => {
    const system = createSystem(defaultConfig, {
      theme: {
        slotRecipes: {
          list: defineSlotRecipe({
            className: 'host-list',
            slots: ['root', 'item', 'indicator'],
            base: {
              root: { listStyleType: 'square' },
              item: { marginBlock: '4' },
            },
          }),
        },
      },
    });
    const components = createPostkitMdxComponents();
    const UnorderedList = components.ul;
    const ListItem = components.li;

    render(
      <PostkitProvider system={system} preset={postkitDefaultTheme}>
        <UnorderedList unstyled>
          <ListItem>Bare item</ListItem>
        </UnorderedList>
      </PostkitProvider>,
    );

    expect(screen.getByRole('list').className).not.toMatch(/\bcss-/);
    expect(screen.getByRole('listitem').className).not.toMatch(/\bcss-/);
  });

  it('renders fenced Markdown code with CodeBlock', () => {
    const components = createPostkitMdxComponents();
    const Pre = components.pre;
    const { container } = render(
      <PostkitProvider>
        <Pre>
          <code className="language-tsx">{'const answer = 42;\n'}</code>
        </Pre>
      </PostkitProvider>,
    );

    const codeBlock = container.querySelector(
      '[data-postkit-component="CodeBlock"]',
    );
    expect(codeBlock).toBeTruthy();
    expect(codeBlock?.className).toContain('code-block__root');
    expect(screen.getByText('tsx')).toBeTruthy();
    expect(screen.getByText('const answer = 42;')).toBeTruthy();
  });

  it('maps safe fenced-code metadata over provider defaults', () => {
    const adapter: CodeBlockAdapter = {
      getHighlighter:
        () =>
        ({ code, meta }) => ({
          highlighted: true,
          code: code
            .split('\n')
            .map(
              (line, index) =>
                `<span data-line="${index + 1}"${
                  meta?.highlightLines?.includes(index + 1)
                    ? ' data-highlight'
                    : ''
                }>${line}</span>`,
            )
            .join('\n'),
        }),
    };
    const Pre = createPostkitMdxComponents().pre;
    const { container } = render(
      <PostkitProvider
        codeBlock={{ lineNumbers: false, wrap: false }}
        codeBlockAdapter={adapter}
      >
        <Pre>
          <code
            className="language-tsx"
            data-meta={
              'title="answer.tsx" lineNumbers wrap {2} maxHeight="24rem"'
            }
          >
            {'const answer = 42;\nconsole.log(answer);'}
          </code>
        </Pre>
      </PostkitProvider>,
    );

    const root = container.querySelector(
      '[data-postkit-component="CodeBlock"]',
    );
    expect(root?.hasAttribute('data-has-line-numbers')).toBe(true);
    expect(
      container.querySelector('code')?.hasAttribute('data-word-wrap'),
    ).toBe(true);
    expect(container.querySelector('[data-highlight]')?.textContent).toBe(
      'console.log(answer);',
    );
    expect(screen.getByText('answer.tsx')).toBeTruthy();
    expect(
      getComputedStyle(
        container.querySelector('.postkit-code-block__content') as Element,
      ).maxHeight,
    ).toBe('24rem');
  });

  it('lets explicit fenced-code attributes override metadata and provider values', () => {
    const Pre = createPostkitMdxComponents().pre;
    const { container } = render(
      <PostkitProvider codeBlock={{ lineNumbers: true, wrap: true }}>
        <Pre
          data-title="explicit.ts"
          data-line-numbers="false"
          data-wrap="false"
        >
          <code
            className="language-ts"
            data-meta={'title="metadata.ts" lineNumbers wrap'}
          >
            {'const answer = 42;'}
          </code>
        </Pre>
      </PostkitProvider>,
    );

    const root = container.querySelector(
      '[data-postkit-component="CodeBlock"]',
    );
    expect(root?.hasAttribute('data-has-line-numbers')).toBe(false);
    expect(
      container.querySelector('code')?.hasAttribute('data-word-wrap'),
    ).toBe(false);
    expect(screen.getByText('explicit.ts')).toBeTruthy();
    expect(screen.queryByText('metadata.ts')).toBeNull();
  });

  it('keeps framework links styled when adapting internal navigation', () => {
    function RouterLink({
      to,
      children,
      className,
    }: {
      readonly to: string;
      readonly children?: ReactNode;
      readonly className?: string;
    }) {
      return (
        <a data-router-destination={to} className={className}>
          {children}
        </a>
      );
    }

    const components = createPostkitMdxComponents({
      link: {
        adapter: {
          component: RouterLink,
          mapProps: ({ href, children, className }) => ({
            to: href,
            children,
            className,
          }),
        },
      },
    });
    const Link = components.a;

    render(
      <PostkitProvider>
        <Link href="/articles/hello">Hello</Link>
      </PostkitProvider>,
    );

    const link = screen.getByText('Hello');
    expect(link.getAttribute('data-router-destination')).toBe(
      '/articles/hello',
    );
    expect(link.className).toContain('postkit-prose__a');
    expect(link.className).toContain('chakra-link');
  });
});

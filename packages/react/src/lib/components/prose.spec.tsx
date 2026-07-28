/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { createPostkitMdxComponents } from '../mdx-components.js';
import { PostkitProvider } from '../provider.js';
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
  });
});

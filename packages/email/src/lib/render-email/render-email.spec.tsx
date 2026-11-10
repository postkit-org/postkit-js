import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Html, Body, Text } from '@chakra-email/core';
import { createPostkitDocument } from '@postkit/core';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { parseEmailSource } from './parse.js';
import { renderEmail } from './render-email.js';

const changelog = (file: string) =>
  readFileSync(
    fileURLToPath(
      new URL(`../../../../../libs/content/changelog/${file}`, import.meta.url),
    ),
    'utf8',
  ).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

const codes = (warnings: readonly { readonly code: string }[]) =>
  warnings.map((warning) => warning.code);

describe('renderEmail (03 §6.1)', () => {
  it('renders the 0.2.0 changelog entry with no warnings (03 §8 step 9)', async () => {
    const { html, text, warnings } = await renderEmail(
      changelog('2026-09-03-postkit-0-2-0.md'),
      { format: 'markdown', baseUrl: 'https://postkit.org' },
    );
    expect(warnings).toEqual([]);
    expect(html).toMatch(/^<!DOCTYPE html/);
    // The directive is the email Callout, not literal text.
    expect(html).toContain('data-postkit-component="Callout"');
    expect(html).toContain('data-postkit-tone="warning"');
    expect(html).not.toContain(':::postkit-callout');
    expect(html).toContain('<pre');
    expect(html).not.toContain('var(');
    expect(text).toContain('Review before upgrading');
    expect(text).toContain('- @postkit/core, with a versioned document model');
    expect(text).toContain(
      "import { Callout, type CalloutProps } from '@postkit/react';",
    );
  });

  it('maps components to email views, with props typed by their definitions', async () => {
    const { html, warnings } = await renderEmail(
      [
        '::postkit-steps{items=\'[{"title":"Install"},{"title":"Use"}]\'}',
        '',
        '::postkit-stat{value="42%" label="Faster"}',
        '',
        '::postkit-product-card{title="Kit" href="/kit" rating="4"}',
      ].join('\n'),
      { baseUrl: 'https://postkit.org' },
    );
    expect(warnings).toEqual([]);
    expect(html).toContain('data-postkit-component="Steps"');
    expect(html).toContain('Install');
    expect(html).toContain('★★★★☆');
    // Relative URLs resolve against baseUrl: mail clients have none.
    expect(html).toContain('href="https://postkit.org/kit"');
  });

  it('applies declared fallbacks and reports each one', async () => {
    const { html, text, warnings } = await renderEmail(
      [
        '<Poll question="Ship it?" options=\'[{"id":"y","label":"Yes"}]\' />',
        '',
        '<ShareActions url="https://postkit.org" />',
        '',
        '<CodeBlock code="npm i @postkit/email" language="sh" />',
        '',
        '<SocialPost href="https://bsky.app/profile/a/post/1" />',
      ].join('\n'),
      { format: 'mdx', url: 'https://postkit.org/notes/a' },
    );
    expect(warnings.map(({ code, component }) => [code, component])).toEqual([
      ['email-fallback', 'Poll'],
      ['email-fallback', 'ShareActions'],
      ['email-fallback', 'CodeBlock'],
      ['email-fallback', 'SocialPost'],
    ]);
    // link: the post on the web, or the component's own URL.
    expect(html).toMatch(
      /href="https:\/\/postkit.org\/notes\/a"[^>]*>Ship it\?/,
    );
    expect(html).toContain('href="https://bsky.app/profile/a/post/1"');
    // text: the static view, as email-safe prose.
    expect(html).toContain('data-postkit-email-fallback="text"');
    expect(html).toMatch(/<pre[^>]*>npm i @postkit\/email<\/pre>/);
    // omit: nothing at all, in either part.
    expect(html).not.toContain('Share this post');
    expect(text).not.toContain('Share this post');
    expect(text).toContain('Ship it? (https://postkit.org/notes/a)');
  });

  it('renders a link fallback as text when there is nowhere to link', async () => {
    const { html } = await renderEmail(
      '<Poll question="Ship it?" options=\'[{"id":"y","label":"Yes"}]\' />',
      { format: 'mdx' },
    );
    expect(html).toContain('data-postkit-email-fallback="text"');
    expect(html).toContain('Yes');
  });

  it('keeps nested content in a text fallback on the email path', async () => {
    const { html } = await renderEmail(
      [
        '<Disclosure summary="More">',
        '',
        '<Callout tone="tip">Nested.</Callout>',
        '',
        '</Disclosure>',
      ].join('\n'),
      { format: 'mdx' },
    );
    expect(html).toContain('More');
    expect(html).toContain('data-postkit-component="Callout"');
    expect(html).not.toContain('<details');
  });

  it('never throws on unknown components or MDX code', async () => {
    const { html, text, warnings } = await renderEmail(
      [
        "import { Chart } from './chart'",
        '',
        '{/* a note for maintainers */}',
        '',
        '<Mystery value={someVariable}>Kept content</Mystery>',
        '',
        '<Steps items={[{ title: "Literal", description: `data` }]} />',
        '',
        'Inline {1 + 1} and {"text"}.',
      ].join('\n'),
      { format: 'mdx' },
    );
    expect(codes(warnings)).toEqual([
      'mdx-esm',
      'mdx-expression',
      'mdx-expression',
      'unknown-component',
    ]);
    expect(html).toContain('Kept content');
    expect(html).toContain('Literal');
    expect(text).toContain('Inline and text.');
  });

  it('reports the site validation warnings, with their position', async () => {
    const { warnings } = await renderEmail(
      ':::postkit-callout{mood="happy"}\nBody.\n:::',
    );
    expect(warnings).toMatchObject([
      { code: 'unknown-prop', line: 1, column: 1 },
    ]);
  });

  it('writes footnotes as end notes: superscript numbers, no links', async () => {
    const { html, text, warnings } = await renderEmail(
      [
        'One[^a], two[^b], one again[^a], missing[^x].',
        '',
        '[^b]: Second.',
        '[^a]: First.',
        '[^z]: Unused.',
      ].join('\n'),
    );
    expect(warnings).toMatchObject([{ code: 'footnote', line: 5 }]);
    expect(html).toMatch(/One<sup[^>]*>1<\/sup>, two<sup[^>]*>2<\/sup>/);
    expect(html).not.toMatch(/<sup[^>]*><a/);
    expect(html).toContain('data-postkit-email="end-notes"');
    expect(html).toMatch(
      /<li[^>]*>First\.<\/li>[\s\S]*<li[^>]*>Second\.<\/li>/,
    );
    expect(html).not.toContain('Unused');
    expect(text).toContain('One[1], two[2], one again[1], missing[^x].');
    expect(text).toContain('Notes\n\n1. First.\n2. Second.');
  });

  it('renders documents, view overrides and a wrapper', async () => {
    function Layout({ children }: { readonly children?: ReactNode }) {
      return (
        <Html>
          <Body>
            <Text>Header</Text>
            {children}
          </Body>
        </Html>
      );
    }
    const document = createPostkitDocument([
      {
        type: 'component',
        name: 'Callout',
        props: { title: 'Hi' },
        children: [{ type: 'text', value: 'Body' }],
      },
      { type: 'component', name: 'SiteBadge', children: [] },
    ]);
    const { html, warnings } = await renderEmail(document, {
      wrapper: Layout,
      components: {
        Callout: ({ title }: { title: string }) => <Text>Custom {title}</Text>,
        SiteBadge: () => <Text>Badge</Text>,
      },
      theme: { colors: { fg: { DEFAULT: '#111111' } } },
    });
    expect(warnings).toEqual([]);
    expect(html).toContain('Header');
    expect(html).toContain('Custom Hi');
    expect(html).toContain('Badge');
  });

  it('takes prose overrides by element name, as an MDX map does', async () => {
    const { html } = await renderEmail('## Added\n\nSee [the docs](/docs).', {
      baseUrl: 'https://postkit.org',
      components: {
        h2: ({ children }: { children?: ReactNode }) => (
          <Text data-heading="custom">{children}</Text>
        ),
        a: ({ href, children }: { href?: string; children?: ReactNode }) => (
          <span data-href={href}>{children}</span>
        ),
      },
    });
    expect(html).toContain('data-heading="custom"');
    expect(html).toContain('data-href="https://postkit.org/docs"');
    expect(html).not.toContain('<h2');
  });

  it('parses a source into a document for hosts that pick parts of it', () => {
    const { document, warnings } = parseEmailSource(
      '---\ntitle: X\n---\n\n:::postkit-callout{tone="tip"}\nHi\n:::',
    );
    expect(warnings).toEqual([]);
    expect(document.children).toMatchObject([
      { type: 'component', name: 'Callout', props: { tone: 'tip' } },
    ]);
  });
});

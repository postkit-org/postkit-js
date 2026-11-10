// @vitest-environment node

import {
  footnoteDefinition,
  footnotesDefinition,
} from '@postkit/core/components';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { ComponentType } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';

import { article } from '../../kits/index.js';
import { createPostkit } from '../../lib/create-postkit.js';
import { createPostkitRemarkPlugins } from '../../lib/markdown-preset.js';
import { Footnote } from '../footnote/footnote.js';
import { Footnotes } from './footnotes.js';

const source = `Postkit keeps the article in plain text[^plain] and lets each renderer decide[^renderers].

Shared notes link back to each mark[^plain].

[^plain]: Markdown with directives, or MDX.
[^renderers]: Headless, Chakra, email or web components.
`;

function mdast(
  text: string,
  options: { mdx?: boolean; path?: string } = {},
): { tree: MdastRoot; file: VFile } {
  const processor = unified()
    .use(remarkParse)
    .use(options.mdx ? [remarkMdx] : [])
    .use(createPostkitRemarkPlugins());
  const file = new VFile({ value: text, path: options.path ?? 'post.md' });
  return {
    tree: processor.runSync(processor.parse(file), file) as MdastRoot,
    file,
  };
}

/** Markdown → React markup through remark-rehype, as react-markdown does. */
function renderMarkdown(
  text: string,
  components: Record<string, ComponentType<never>> = {
    Footnote: Footnote as ComponentType<never>,
    Footnotes: Footnotes as ComponentType<never>,
  },
): string {
  const processor = unified()
    .use(remarkParse)
    .use(createPostkitRemarkPlugins({ postkit: { output: 'hast' } }))
    .use(remarkRehype);
  const file = new VFile({ value: text, path: 'one-article.md' });
  const hast = processor.runSync(processor.parse(file), file) as HastRoot;
  return renderToStaticMarkup(
    toJsxRuntime(hast, {
      Fragment,
      jsx,
      jsxs,
      components: components as never,
      passKeys: true,
    }),
  );
}

describe('headless Footnote and Footnotes', () => {
  it('render the anatomy with the definitions', () => {
    expect(Footnote.definition).toBe(footnoteDefinition);
    expect(Footnotes.definition).toBe(footnotesDefinition);
    expect(
      renderToStaticMarkup(<Footnote index={2} scope="post" occurrence={2} />),
    ).toBe(
      '<span data-postkit-component="Footnote" data-postkit-part="root" data-size="md" data-variant="subtle" id="fnref-post-2-2" data-marker="superscript" data-placement="end">' +
        '<a data-postkit-part="marker" href="#fn-post-2" role="doc-noteref" aria-label="Note 2"><sup>2</sup></a></span>',
    );
    const list = renderToStaticMarkup(
      <Footnotes scope="post" title="References">
        <Footnote index={1} references={2}>
          <p>Shared.</p>
        </Footnote>
        <Footnote index={2}>
          <p>Single.</p>
        </Footnote>
      </Footnotes>,
    );
    expect(list).toContain(
      '<section data-postkit-component="Footnotes" data-postkit-part="root" data-size="md" data-variant="subtle" data-marker="superscript" data-placement="end">',
    );
    expect(list).toContain(
      '<h2 data-postkit-part="title" id="fn-post-title">References</h2>',
    );
    expect(list).toContain(
      '<li data-postkit-part="item" id="fn-post-1" tabindex="-1" data-footnote-index="1" data-footnote-references="2">',
    );
    expect(list).toContain(
      '<a href="#fnref-post-1-2" role="doc-backlink" aria-label="Back to reference 1b">b</a>',
    );
    expect(list).toContain(
      '<a data-postkit-part="backlink" href="#fnref-post-2" role="doc-backlink" aria-label="Back to reference 2">↩</a>',
    );
  });

  it('hide the title with title={false} and keep the list named', () => {
    const list = renderToStaticMarkup(
      <Footnotes title={false}>
        <Footnote index={1}>One.</Footnote>
      </Footnotes>,
    );
    expect(list).toContain('aria-label="Notes"');
    expect(list).not.toContain('data-postkit-part="title"');
    expect(renderToStaticMarkup(<Footnotes />)).toBe('');
  });

  it('copy the note beside the first reference when a placement shows it in place', () => {
    const markup = renderToStaticMarkup(
      <Footnote index={1} placement={{ base: 'inline', xl: 'side' }}>
        Note.
      </Footnote>,
    );
    expect(markup).toContain('data-placement="inline xl:side"');
    expect(markup).toContain(
      '<span data-postkit-component="Sidenote" data-postkit-part="root" data-size="md" data-variant="subtle" id="sn-1" hidden="" role="note" aria-label="Note 1">',
    );
    expect(
      renderToStaticMarkup(
        <Footnote index={1} occurrence={2} placement="side">
          Note.
        </Footnote>,
      ),
    ).not.toContain('Sidenote');
  });

  it('take marker, numbering and placement from the site’s Footnotes defaults', () => {
    const postkit = createPostkit({
      kits: [article],
      defaults: {
        Footnotes: {
          marker: 'bracket',
          numbering: 'symbol',
          placement: { base: 'inline', md: 'end', xl: 'side' },
        },
      },
    });
    const markup = renderToStaticMarkup(
      <postkit.Provider>
        <Footnote index={2}>Note.</Footnote>
      </postkit.Provider>,
    );
    expect(markup).toContain('data-marker="bracket"');
    expect(markup).toContain('>[†]</a>');
    expect(markup).toContain('data-placement="inline md:end xl:side"');
  });
});

describe('remarkPostkit footnotes', () => {
  it('turns GFM footnotes into Footnote references and one Footnotes list', () => {
    const { tree, file } = mdast(source, { mdx: true });
    const paragraph = tree.children[0] as { children: { name?: string }[] };
    const reference = paragraph.children.find(
      (child) => child.name === 'Footnote',
    ) as { attributes: { name: string; value: string }[]; children: unknown[] };
    expect(
      Object.fromEntries(
        reference.attributes.map(({ name, value }) => [name, value]),
      ),
    ).toEqual({ identifier: 'plain', index: '1', scope: 'post' });
    expect(reference.children).toEqual([
      expect.objectContaining({ type: 'text' }),
    ]);
    const list = tree.children.at(-1) as {
      name: string;
      children: { attributes: { name: string; value: string }[] }[];
    };
    expect(list.name).toBe('Footnotes');
    expect(
      list.children.map((note) =>
        Object.fromEntries(
          note.attributes.map(({ name, value }) => [name, value]),
        ),
      ),
    ).toEqual([
      { identifier: 'plain', index: '1', references: '2', scope: 'post' },
      { identifier: 'renderers', index: '2', references: '1', scope: 'post' },
    ]);
    expect(file.messages).toEqual([]);
  });

  it('places the list at ::footnotes and reads :footnote[…]', () => {
    const { tree } = mdast(
      'Inline:footnote[A note *in place*.] text.\n\n::footnotes{title="References" marker="pill"}\n\nAfter.',
    );
    expect(
      tree.children.map(
        (node) => (node as { name?: string }).name ?? node.type,
      ),
    ).toEqual(['paragraph', 'Footnotes', 'paragraph']);
    const reference = (
      tree.children[0] as unknown as {
        children: { attributes?: { name: string; value: string }[] }[];
      }
    ).children[1];
    expect(reference?.attributes).toContainEqual({
      type: 'mdxJsxAttribute',
      name: 'marker',
      value: 'pill',
    });
  });

  it('fails a reference with no definition, with the file and line', () => {
    expect(() => mdast('Text[^missing].\n', { path: 'notes/post.md' })).toThrow(
      /Footnote \[\^missing\] has no definition\. \(notes\/post\.md:1:5-1:15\)/,
    );
  });

  it('warns about a definition nobody references and leaves it out', () => {
    const { tree, file } = mdast('Text[^a].\n\n[^a]: Used.\n\n[^b]: Unused.\n');
    expect(file.messages.map(String)).toEqual([
      expect.stringContaining(
        'Footnote [^b] is defined but never referenced; it is left out.',
      ),
    ]);
    expect(JSON.stringify(tree)).not.toContain('Unused');
  });

  it('leaves GFM footnotes alone when Footnote is not enabled', () => {
    const processor = unified()
      .use(remarkParse)
      .use(
        createPostkitRemarkPlugins({
          postkit: { definitions: [] },
        }),
      );
    const tree = processor.runSync(processor.parse(source)) as MdastRoot;
    expect(JSON.stringify(tree)).toContain('"footnoteReference"');
  });

  it('writes the site’s defaults onto the list and its references', () => {
    const processor = unified()
      .use(remarkParse)
      .use(
        createPostkitRemarkPlugins({
          postkit: {
            footnotes: {
              scope: 'One Article',
              defaults: {
                placement: { base: 'inline', md: 'end', xl: 'side' },
                variant: 'plain',
              },
            },
          },
        }),
      );
    const tree = processor.runSync(
      processor.parse('A[^a].\n\n[^a]: Note.\n\n::footnotes{variant=outline}'),
    ) as MdastRoot;
    const json = JSON.stringify(tree);
    expect(json).toContain(
      '"name":"placement","value":"{\\"base\\":\\"inline\\",\\"md\\":\\"end\\",\\"xl\\":\\"side\\"}"',
    );
    expect(json).toContain('"name":"variant","value":"outline"');
    expect(json).toContain('"name":"scope","value":"one-article"');
  });

  it('renders end to end through remark-rehype', () => {
    const html = renderMarkdown(source);
    expect(html).toContain(
      '<a data-postkit-part="marker" href="#fn-one-article-1" role="doc-noteref" aria-label="Note 1"><sup>1</sup></a>',
    );
    expect(html).toContain('id="fnref-one-article-1-2"');
    expect(html).toContain('id="fn-one-article-2"');
    expect(html).not.toContain('data-footnotes');
  });
});

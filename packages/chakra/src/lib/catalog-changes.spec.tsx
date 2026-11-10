// @vitest-environment node

import type { Root as MdastRoot } from 'mdast';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';

import { Figure } from '../components/figure/figure.js';
import { Video } from '../components/video/video.js';
import { createPostkitRemarkPlugins } from './markdown-preset.js';
import { PostkitProvider } from './provider.js';
import { createPostkitSystem, postkitDefaultTheme } from './theme.js';

/*
 * 03 §7 catalog changes in the Markdown pipeline and the Chakra renderer:
 * the Callout `type` alias (D6), the Video captions warning (D20) and figure
 * numbering on `PostkitProvider`.
 */

function compile(
  source: string,
  {
    mdx = false,
    strict,
  }: { readonly mdx?: boolean; readonly strict?: boolean } = {},
) {
  const processor = unified().use(remarkParse);
  if (mdx) processor.use(remarkMdx);
  processor.use(
    createPostkitRemarkPlugins({
      postkit: strict === undefined ? {} : { strict },
    }),
  );
  const file = new VFile({
    path: mdx ? 'content/post.mdx' : 'content/post.md',
    value: source,
  });
  const tree = processor.runSync(processor.parse(file), file) as MdastRoot;
  return {
    tree,
    file,
    messages: file.messages.map((message) => message.reason),
  };
}

const captionsWarning =
  'Postkit Video: the "captions" prop is missing. Add a captions track (a WebVTT file), or mark the video decorative.';

describe('Callout type alias in directives (D6)', () => {
  it('maps type to tone', () => {
    const { tree, messages } = compile(
      ':::postkit-callout{type="warning"}\nCareful.\n:::',
    );
    expect(tree.children[0]).toMatchObject({
      name: 'Callout',
      attributes: [{ name: 'tone', value: 'warning' }],
    });
    expect(messages).toEqual([]);
  });

  it('validates the aliased value like tone', () => {
    expect(() =>
      compile(':::postkit-callout{type="danger"}\nCareful.\n:::'),
    ).toThrow(/Invalid Callout tone value "danger"/);
  });

  it('keeps tone when both are set, with a warning', () => {
    const { tree, messages } = compile(
      ':::postkit-callout{tone="tip" type="warning"}\nCareful.\n:::',
    );
    expect(tree.children[0]).toMatchObject({
      attributes: [{ name: 'tone', value: 'tip' }],
    });
    expect(messages).toEqual([
      expect.stringContaining(
        'Callout sets both "tone" and its alias "type"; "type" was ignored.',
      ),
    ]);
  });
});

describe('Video captions warning (D20)', () => {
  it.each([true, false])(
    'warns, and never fails, without captions (strict: %s)',
    (strict) => {
      const { file, messages } = compile(
        '::postkit-video{src="/demo.mp4" title="Demo"}',
        { strict },
      );
      expect(messages).toEqual([expect.stringContaining(captionsWarning)]);
      expect(file.messages[0]).toMatchObject({
        fatal: false,
        ruleId: 'recommended-prop',
        source: 'postkit',
        line: 1,
      });
    },
  );

  it('is silenced by captions or a bare decorative attribute', () => {
    expect(
      compile(
        '::postkit-video{src="/demo.mp4" title="Demo" captions="/demo.vtt"}',
      ).messages,
    ).toEqual([]);
    expect(
      compile('::postkit-video{src="/loop.mp4" title="Loop" decorative}')
        .messages,
    ).toEqual([]);
  });

  it('still warns for decorative="false"', () => {
    expect(
      compile('::postkit-video{src="/a.mp4" title="A" decorative="false"}')
        .messages,
    ).toHaveLength(1);
  });

  it('warns for an MDX <Video> without captions, decorative or tracks', () => {
    expect(
      compile('<Video src="/a.mp4" title="A" />', { mdx: true }).messages,
    ).toEqual([expect.stringContaining(captionsWarning)]);
    for (const source of [
      '<Video src="/a.mp4" title="A" captions="/a.vtt" />',
      '<Video src="/a.mp4" title="A" decorative />',
      '<Video src="/a.mp4" title="A" decorative={true} />',
      '<Video src="/a.mp4" title="A" tracks={[]} />',
      '<Video {...props} />',
    ]) {
      expect(compile(source, { mdx: true }).messages).toEqual([]);
    }
    expect(
      compile('<Video src="/a.mp4" title="A" decorative={false} />', {
        mdx: true,
      }).messages,
    ).toHaveLength(1);
  });
});

describe('Chakra renderer', () => {
  const system = createPostkitSystem({ preset: postkitDefaultTheme });

  it('numbers figures beneath PostkitProvider figures="numbered"', () => {
    const markup = renderToStaticMarkup(
      <PostkitProvider system={system} figures="numbered">
        <Figure src="/a.png" alt="A" caption="First." />
        <Video src="/v.mp4" title="V" captions="/v.vtt" duration="0:24" />
      </PostkitProvider>,
    );
    const labels = [
      ...markup.matchAll(/data-postkit-part="number"[^>]*>([^<]+)</g),
    ].map((match) => match[1]);
    expect(labels).toEqual(['Fig. 1', 'Fig. 2']);
    expect(markup).toMatch(
      /<track src="\/v.vtt" label="Captions" kind="captions" default=""\/>/,
    );
    expect(markup).toMatch(
      /<time[^>]*data-postkit-part="duration"[^>]*dateTime="PT24S"[^>]*>0:24<\/time>/,
    );
  });
});

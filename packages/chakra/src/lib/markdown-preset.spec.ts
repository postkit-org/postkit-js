import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Plugin } from 'unified';

import {
  createPostkitRemarkPlugins,
  createPostkitRemarkPreset,
} from './markdown-preset.js';

describe('Postkit Remark preset', () => {
  it('enables GFM footnotes and other common Markdown extensions by default', () => {
    const processor = unified().use(remarkParse);
    processor.use(createPostkitRemarkPlugins({ postkit: false }));
    processor.use(remarkRehype);

    const markdown = [
      'A footnote.[^note]',
      '',
      '[^note]: Supporting context.',
      '',
      '| Feature | Ready |',
      '| --- | --- |',
      '| Footnotes | Yes |',
      '',
      '- [x] Tested',
    ].join('\n');
    const tree = processor.runSync(processor.parse(markdown)) as HastRoot;
    const serialized = JSON.stringify(tree);

    expect(serialized).toContain('"dataFootnotes":true');
    expect(serialized).toContain('"tagName":"table"');
    expect(serialized).toContain('"className":["task-list-item"]');
  });

  it('parses and transforms Postkit directives with the base preset', () => {
    const processor = unified().use(remarkParse);
    processor.use(createPostkitRemarkPlugins());
    const tree = processor.runSync(
      processor.parse(
        [
          '---',
          'title: Demonstration',
          '---',
          '',
          '::postkit-video{src="/demo.mp4" title="Demonstration"}',
        ].join('\n'),
      ),
    ) as MdastRoot;

    expect(tree.children[0]).toMatchObject({
      type: 'yaml',
      value: 'title: Demonstration',
    });
    expect(tree.children[1]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'Video',
    });
  });

  it('supports ordered extensions, per-plugin options, replacement, and removal', () => {
    const before: Plugin = () => undefined;
    const after: Plugin = () => undefined;
    const replacement: Plugin = () => undefined;
    const preset = createPostkitRemarkPreset({
      before: [before],
      after: [after],
      gfm: { singleTilde: false },
      overrides: {
        directives: replacement,
        frontmatter: false,
      },
    });

    expect(preset.remarkPlugins[0]).toBe(before);
    expect(preset.remarkPlugins.at(-1)).toBe(after);
    expect(preset.remarkPlugins).toContain(replacement);
    expect(preset.capabilities).toEqual(
      new Set(['gfm', 'directives', 'postkit']),
    );

    const gfmRegistration = preset.remarkPlugins[1];
    expect(Array.isArray(gfmRegistration)).toBe(true);
    expect(gfmRegistration).toEqual([
      expect.any(Function),
      { singleTilde: false },
    ]);
  });
});

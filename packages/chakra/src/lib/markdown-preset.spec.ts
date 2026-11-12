import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Plugin } from 'unified';
import type { VFile } from 'vfile';

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

type PresetOptions = NonNullable<
  Parameters<typeof createPostkitRemarkPlugins>[0]
>;

interface TestNode {
  type: string;
  name?: string;
  value?: string;
  data?: Record<string, unknown>;
  children?: TestNode[];
}

function textOf(node: TestNode): string {
  return node.value ?? (node.children ?? []).map(textOf).join('');
}

function typesOf(node: TestNode): string[] {
  return [node.type, ...(node.children ?? []).flatMap(typesOf)];
}

function processorWith(options?: PresetOptions) {
  const processor = unified().use(remarkParse);
  processor.use(createPostkitRemarkPlugins(options));
  return processor;
}

function run(
  markdown: string,
  options?: PresetOptions,
  path = 'content/post.md',
): TestNode {
  const processor = processorWith(options);
  const file = { path, value: markdown };
  return processor.runSync(processor.parse(file), file) as TestNode;
}

describe('Postkit directives in prose', () => {
  it('keeps ratios, times, emoji shortcodes and URLs as literal text', () => {
    const markdown =
      'Contrast is 4.5:1, the call is at 10:30, :smile_cat: and :+1: stay, see https://example.com/a:b or localhost:3000.';
    const tree = run(markdown);

    expect(tree.children).toHaveLength(1);
    expect(textOf(tree)).toBe(markdown);
    expect(typesOf(tree).filter((type) => type.endsWith('Directive'))).toEqual(
      [],
    );
    // The literal halves are joined back into the surrounding text.
    expect(tree.children?.[0]?.children?.[0]).toMatchObject({
      type: 'text',
      value:
        'Contrast is 4.5:1, the call is at 10:30, :smile_cat: and :+1: stay, see ',
    });
  });

  it('keeps an unknown text directive label as Markdown', () => {
    const tree = run('An :abbr[*HTML*]{title="HyperText"} element.');

    expect(textOf(tree)).toBe('An :abbr[HTML]{title="HyperText"} element.');
    expect(typesOf(tree)).toContain('emphasis');
  });

  it('keeps unknown leaf and container directives without the prefix as text', () => {
    const tree = run(
      ['::foo{a=b}', '', ':::note', 'Body copy.', ':::'].join('\n'),
    );

    expect(tree.children?.map((child) => [child.type, textOf(child)])).toEqual([
      ['paragraph', '::foo{a=b}'],
      ['paragraph', ':::note'],
      ['paragraph', 'Body copy.'],
      ['paragraph', ':::'],
    ]);
  });

  it('still turns a known text directive into its component', () => {
    const tree = run(
      'Read :postkit-link-preview{href="https://example.com/article" presentation="inline"} first.',
    );

    expect(tree.children?.[0]?.children?.[1]).toMatchObject({
      type: 'mdxJsxTextElement',
      name: 'LinkPreview',
    });
  });

  it('fails an unknown postkit-* directive in strict mode with the file and line', () => {
    const markdown = ['# Title', '', ':::postkit-nope', 'Body', ':::'].join(
      '\n',
    );

    let error: unknown;
    try {
      run(markdown);
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      name: 'content/post.md:3:1-5:4',
      file: 'content/post.md',
      line: 3,
      column: 1,
      fatal: true,
      source: 'postkit',
      ruleId: 'unknown-directive',
    });
    expect((error as Error).message).toBe(
      'Unknown Postkit directive "postkit-nope". Check the name against the component catalog. (content/post.md:3:1-5:4)',
    );
  });

  it('fails an invalid enum value with the position, in either mode', () => {
    const markdown = [
      'Intro.',
      '',
      ':::postkit-callout{tone="tpi"}',
      'Body',
      ':::',
    ].join('\n');

    for (const strict of [true, false]) {
      expect(() => run(markdown, { postkit: { strict } })).toThrow(
        'Invalid Callout tone value "tpi". (content/post.md:3:1-5:4)',
      );
    }
  });

  it('fails JavaScript or malformed JSON in a JSON prop with the position', () => {
    expect(() =>
      run(`::postkit-tabs{items="[{label: 'npm'}]"}`, {}, 'docs/tabs.md'),
    ).toThrow(
      'Invalid Tabs items value: expected literal JSON data, not a JavaScript expression or malformed JSON. (docs/tabs.md:1:1-1:41)',
    );
  });

  it('reports the position alone when the file has no path', () => {
    const processor = processorWith();
    expect(() =>
      processor.runSync(processor.parse('::postkit-nope'), {
        value: '::postkit-nope',
      }),
    ).toThrow(
      'Unknown Postkit directive "postkit-nope". Check the name against the component catalog. (1:1-1:15)',
    );
  });

  it('warns instead of failing in non-strict mode and keeps the directive', async () => {
    const processor = processorWith({ postkit: { strict: false } });
    const source = {
      path: 'content/post.md',
      value: [
        ':::postkit-nope',
        'Body',
        ':::',
        '',
        '::postkit-audio{src="/a.mp3" title="Episode" futureProp="x"}',
      ].join('\n'),
    };
    const file = await new Promise<VFile>((resolve, reject) => {
      processor.run(processor.parse(source), source, (error, _tree, result) => {
        if (error || !result) reject(error);
        else resolve(result);
      });
    });

    expect(
      file.messages.map((message) => ({
        fatal: message.fatal,
        ruleId: message.ruleId,
        line: message.line,
        file: message.file,
      })),
    ).toEqual([
      {
        fatal: false,
        ruleId: 'unknown-directive',
        line: 1,
        file: 'content/post.md',
      },
      {
        fatal: false,
        ruleId: 'unknown-prop',
        line: 5,
        file: 'content/post.md',
      },
    ]);

    const tree = run(':::postkit-nope\nBody\n:::', {
      postkit: { strict: false },
    });
    expect(tree.children?.[0]).toMatchObject({
      type: 'containerDirective',
      name: 'postkit-nope',
    });
  });

  it('leaves directives handled by an earlier plugin alone', () => {
    const handleNote = () => (tree: TestNode) => {
      for (const node of tree.children ?? []) {
        if (node.type === 'containerDirective' && node.name === 'note') {
          node.data = { hName: 'aside' };
        }
      }
    };
    // Directive parsing first, then the host's handler, then Postkit.
    const processor = unified()
      .use(remarkParse)
      .use(createPostkitRemarkPlugins({ postkit: false }))
      .use(handleNote)
      .use(
        createPostkitRemarkPlugins({
          gfm: false,
          frontmatter: false,
          directives: false,
        }),
      );
    const source = ':::note\nBody\n:::';
    const result = processor.runSync(processor.parse(source), {
      value: source,
    }) as TestNode;

    expect(result.children?.[0]).toMatchObject({
      type: 'containerDirective',
      name: 'note',
    });
  });
});

describe('Postkit components in MDX', () => {
  function compileMdx(source: string, postkit?: PresetOptions['postkit']) {
    const processor = unified().use(remarkParse).use(remarkMdx);
    processor.use(createPostkitRemarkPlugins({ postkit }));
    const file = { path: 'content/note.mdx', value: source };
    return processor.runSync(processor.parse(file), file);
  }

  it('accepts Postkit components, intrinsic elements and the names a document binds', () => {
    expect(() =>
      compileMdx(
        [
          "import { Chart as Graph } from './chart';",
          'export const Local = () => null;',
          '',
          '<Callout tone="tip">Ratio 4.5:1.</Callout>',
          '',
          '<Graph />',
          '',
          '<Local />',
          '',
          '<div>Plain</div>',
        ].join('\n'),
      ),
    ).not.toThrow();
  });

  it('fails an unknown MDX component in strict mode with the file and line', () => {
    expect(() =>
      compileMdx(['Intro.', '', '<Calout tone="tip">Body</Calout>'].join('\n')),
    ).toThrow(
      "Unknown MDX component <Calout>: it isn't a Postkit component, imported by the document or listed in `components`. (content/note.mdx:3:1-3:33)",
    );
  });

  it('accepts host components listed in components', () => {
    expect(() =>
      compileMdx('<Showcase kind="mac" />', { components: ['Showcase'] }),
    ).not.toThrow();
  });
});

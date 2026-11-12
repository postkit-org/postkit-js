import { highlightSegments } from './highlight';
import { createSnippet, markdownToText, splitMarkdownSections } from './text';

describe('markdownToText', () => {
  it('keeps what a reader sees', () => {
    const source = [
      "import { Callout } from '@postkit/chakra';",
      '{/* TODO: a note for maintainers */}',
      'Use **bold** and a [link](/docs) with `code`.',
      '',
      ':::postkit-callout{tone="tip"}',
      'Inside the callout.',
      ':::',
      '',
      '```ts',
      'const hidden = true;',
      '```',
      '',
      '- A list item',
      '- Another',
      '',
      '| Prop | Type |',
      '| --- | --- |',
      '| tone | string |',
      '<KeyTakeaway',
      '  items=\'["a"]\'',
      '/>',
      '<Aside>',
      '  Beside the text.',
      '</Aside>',
    ].join('\n');

    expect(markdownToText(source).split('\n')).toEqual([
      'Use bold and a link with code.',
      'Inside the callout.',
      'A list item',
      'Another',
      'Prop · Type',
      'tone · string',
      'Beside the text.',
    ]);
  });
});

describe('splitMarkdownSections', () => {
  it('splits at h2s outside code fences', () => {
    const sections = splitMarkdownSections(
      'Intro.\n\n## First `one`\n\nA.\n\n```md\n## Not a heading\n```\n\n### Sub\n\n## Second\n\nB.',
    );
    expect(sections.map((section) => section.heading)).toEqual([
      null,
      'First one',
      'Second',
    ]);
    expect(sections[1].body).toContain('## Not a heading');
  });
});

describe('createSnippet', () => {
  const record = {
    title: 'Aside',
    description: 'A semantic article aside.',
    text: 'Asides sit in the margin. Pair with a callout for asides that sit in the margin.',
  };

  it('shows the description for a title match', () => {
    expect(createSnippet(record, 'aside')).toBe('A semantic article aside.');
  });

  it('shows the first sentence with the match', () => {
    expect(createSnippet(record, 'callout')).toBe(
      'Pair with a callout for asides that sit in the margin.',
    );
  });

  it('cuts long sentences around the match', () => {
    const long =
      `${'word '.repeat(60)}callout ${'more '.repeat(60)}`.trim() + '.';
    const snippet = createSnippet({ title: 'X', text: long }, 'callout', 80);
    expect(snippet?.startsWith('…')).toBe(true);
    expect(snippet?.endsWith('…')).toBe(true);
    expect(snippet).toContain('callout');
    expect(snippet?.length ?? 0).toBeLessThanOrEqual(82);
  });
});

describe('highlightSegments', () => {
  it('marks query words at word starts, case-insensitively', () => {
    expect(
      highlightSegments('Target Callout’s parts, recall', 'callout'),
    ).toEqual([
      { text: 'Target ', match: false },
      { text: 'Callout', match: true },
      { text: '’s parts, recall', match: false },
    ]);
  });

  it('marks a prefix as typed', () => {
    expect(highlightSegments('Callout', 'call')).toEqual([
      { text: 'Call', match: true },
      { text: 'out', match: false },
    ]);
  });

  it('leaves text alone for an empty query', () => {
    expect(highlightSegments('Callout', ' ')).toEqual([
      { text: 'Callout', match: false },
    ]);
  });
});

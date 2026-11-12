import { postkitPlainTextCodeBlockAdapter } from './code-block-adapter.js';

describe('postkitPlainTextCodeBlockAdapter', () => {
  it('escapes source while preserving Chakra line metadata', () => {
    const highlight = postkitPlainTextCodeBlockAdapter.getHighlighter(null);
    const result = highlight({
      code: '<script>\nalert("nope")',
      language: 'html',
      meta: {
        highlightLines: [2],
        showLineNumbers: true,
      },
    });

    expect(result.highlighted).toBe(true);
    expect(result.code).toContain('&lt;script&gt;');
    expect(result.code).not.toContain('<script>');
    expect(result.code).toContain('data-line="2" data-highlight=""');
  });
});

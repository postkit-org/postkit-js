// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { CodeBlock, postkitHighlightedLines } from './code-block.js';

describe('headless CodeBlock', () => {
  it('renders the copy control, plain lines and the anatomy', () => {
    const markup = renderToStaticMarkup(<CodeBlock code={'a\n<b>'} />);

    expect(markup).toContain(
      '<div data-postkit-component="CodeBlock" data-postkit-part="root" data-size="md" data-variant="subtle">',
    );
    expect(markup).toContain('aria-label="Copy code"');
    expect(markup).toContain('type="button"');
    expect(markup).toContain(
      '<span data-postkit-part="copyIndicator" aria-live="polite">Copy code</span>',
    );
    expect(markup).toContain(
      '<code data-postkit-part="codeText"><span data-line="1">a</span>\n<span data-line="2">&lt;b&gt;</span></code>',
    );
    expect(markup).not.toContain('data-postkit-part="title"');
  });

  it('shows the filename and language, and marks lines and options', () => {
    const markup = renderToStaticMarkup(
      <CodeBlock
        filename="a.ts"
        language="ts"
        highlightLines="2"
        lineNumbers="true"
        wrap
        colorScheme="light"
        maxHeight="10rem"
        classNames={{ title: 'title', filename: 'file', button: 'btn' }}
      >
        {'one\n\ntwo'}
      </CodeBlock>,
    );

    expect(markup).toContain('data-color-scheme="light"');
    expect(markup).toContain(
      '<div data-postkit-part="title" class="title"><span data-postkit-part="filename" class="file title">a.ts</span><span data-postkit-part="language">ts</span></div>',
    );
    expect(markup).toContain('data-postkit-part="copyTrigger" class="btn"');
    expect(markup).toContain(
      '<div data-postkit-part="content" style="max-height:10rem">',
    );
    expect(markup).toContain(
      '<pre data-postkit-part="code" tabindex="0" data-line-numbers="" data-word-wrap="">',
    );
    expect(markup).toContain(
      '<span data-line="2" data-highlight="" data-word-wrap=""> </span>',
    );
  });

  it('omits the copy action for empty source or copy="false"', () => {
    expect(renderToStaticMarkup(<CodeBlock code="  " />)).not.toContain(
      'button',
    );
    expect(
      renderToStaticMarkup(<CodeBlock code="x" copy="false" />),
    ).not.toContain('header');
  });

  it('keeps a visually hidden live region for tooltip feedback', () => {
    const markup = renderToStaticMarkup(
      <CodeBlock code="x" copyFeedback="tooltip" copyIcon="⧉" />,
    );
    expect(markup).toContain(
      '<span data-postkit-part="copyIndicator">⧉Copy code</span>',
    );
    expect(markup).toContain('aria-live="polite" aria-atomic="true"');
  });

  it('reads highlighted lines and ranges', () => {
    expect(postkitHighlightedLines('1, 3-4, x, 6-5')).toEqual([1, 3, 4]);
    expect(postkitHighlightedLines()).toEqual([]);
  });
});

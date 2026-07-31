import type { CodeBlockAdapter } from '@chakra-ui/react';

type PostkitCodeBlockHighlighterProps = Parameters<
  ReturnType<CodeBlockAdapter['getHighlighter']>
>[0];

function escapeCode(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function lineAttribute(
  enabled: boolean | undefined,
  name: string,
  value?: string,
): string | undefined {
  if (!enabled) return undefined;
  return value ? `${name}="${value}"` : `${name}=""`;
}

function renderPlainTextLines({
  code,
  meta,
}: PostkitCodeBlockHighlighterProps): string {
  return code
    .split('\n')
    .map((line, index) => {
      const lineNumber = index + 1;
      const attributes = [
        `data-line="${lineNumber}"`,
        lineAttribute(
          meta?.highlightLines?.includes(lineNumber),
          'data-highlight',
        ),
        lineAttribute(meta?.wordWrap, 'data-word-wrap'),
        lineAttribute(
          meta?.addedLineNumbers?.includes(lineNumber),
          'data-diff',
          'added',
        ),
        lineAttribute(
          meta?.removedLineNumbers?.includes(lineNumber),
          'data-diff',
          'removed',
        ),
        lineAttribute(
          meta?.focusedLineNumbers?.includes(lineNumber),
          'data-focused',
        ),
      ].filter(Boolean);

      return `<span ${attributes.join(' ')}>${escapeCode(line) || ' '}</span>`;
    })
    .join('\n');
}

/**
 * Dependency-free Chakra CodeBlock adapter used when a host does not provide a
 * syntax highlighter. It safely escapes source and preserves line metadata.
 */
export const postkitPlainTextCodeBlockAdapter: CodeBlockAdapter = {
  getHighlighter: () => (props) => ({
    code: renderPlainTextLines(props),
    highlighted: true,
  }),
};

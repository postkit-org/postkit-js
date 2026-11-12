import {
  codeBlockDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { Fragment, type CSSProperties, type ReactNode } from 'react';

import { useCodeCopy } from '../../hooks/use-code-copy.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import {
  postkitView,
  type PostkitPartGetter,
  type PostkitPartProps,
  type PostkitViewProps,
} from '../../lib/view.js';

export type CodeBlockSlot = PostkitSlotOf<typeof codeBlockDefinition>;

export type CodeBlockProps = Omit<
  PostkitViewProps<typeof codeBlockDefinition>,
  'code' | 'lineNumbers' | 'copy' | 'wrap'
> & {
  /** The literal source. A string `children` is used without it. */
  readonly code?: string;
  readonly children?: ReactNode;
  readonly lineNumbers?: boolean | string;
  readonly copy?: boolean | string;
  readonly wrap?: boolean | string;
  /** Visible content before copying. Defaults to "Copy code". */
  readonly copyLabel?: ReactNode;
  /** Copied-state content, shown inline or announced. Defaults to "Copied". */
  readonly copiedLabel?: ReactNode;
  readonly copyIcon?: ReactNode;
  readonly copiedIcon?: ReactNode;
  /** The copy button's accessible name. Defaults to "Copy code". */
  readonly copyAriaLabel?: string;
  /**
   * `inline` (the default) swaps the button's label for the copied label in a
   * polite live region; `tooltip` keeps the label and announces the copied
   * label from a visually hidden live region.
   */
  readonly copyFeedback?: 'inline' | 'tooltip';
};

/*
 * Part aliases. The definition keeps the names `@postkit/chakra`'s recipe has
 * always styled; each element carries one `data-postkit-part` (the first
 * name) and takes the `classNames` and `slotStyles` of both.
 */
const aliases = {
  filename: 'title',
  control: 'actions',
  copyTrigger: 'button',
  content: 'scroller',
  codeText: 'lineContent',
} as const satisfies Partial<Record<CodeBlockSlot, CodeBlockSlot>>;

function aliasedPart(
  part: PostkitPartGetter<CodeBlockSlot>,
  name: keyof typeof aliases,
  style?: CSSProperties,
): PostkitPartProps {
  const { className, style: aliasStyle } = part(aliases[name]);
  return mergePostkitPartProps(part(name, { style }), {
    className,
    style: aliasStyle,
  });
}

function enabled(value: boolean | string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return typeof value === 'boolean' ? value : value === 'true';
}

/** Line numbers from `"1, 3-5"`; at most 500 lines per range. */
export function postkitHighlightedLines(value?: string): readonly number[] {
  const lines = new Set<number>();
  for (const range of value?.split(',') ?? []) {
    const [startValue, endValue] = range.trim().split('-');
    const start = Number(startValue);
    const end = Number(endValue ?? startValue);
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    for (
      let line = Math.max(1, start);
      line <= Math.min(end, start + 500);
      line += 1
    ) {
      lines.add(line);
    }
  }
  return [...lines];
}

const visuallyHidden: CSSProperties = {
  border: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

function CopyControl({
  code,
  part,
  label,
  copiedLabel,
  icon,
  copiedIcon,
  ariaLabel,
  feedback,
}: {
  readonly code: string;
  readonly part: PostkitPartGetter<CodeBlockSlot>;
  readonly label: ReactNode;
  readonly copiedLabel: ReactNode;
  readonly icon: ReactNode;
  readonly copiedIcon: ReactNode;
  readonly ariaLabel: string;
  readonly feedback: 'inline' | 'tooltip';
}) {
  const api = useCodeCopy({ code });
  const inline = feedback === 'inline';
  return (
    <div {...aliasedPart(part, 'control')}>
      <button
        {...mergePostkitPartProps(
          api.getTriggerProps(),
          { 'aria-label': ariaLabel },
          aliasedPart(part, 'copyTrigger'),
        )}
      >
        <span
          {...part('copyIndicator')}
          aria-live={inline ? 'polite' : undefined}
        >
          {api.copied ? (
            inline ? (
              <>
                {copiedIcon}
                {copiedLabel}
              </>
            ) : (
              (copiedIcon ?? <span aria-hidden="true">✓</span>)
            )
          ) : (
            <>
              {icon}
              {label}
            </>
          )}
        </span>
      </button>
      {inline ? null : (
        <span aria-live="polite" aria-atomic="true" style={visuallyHidden}>
          {api.copied ? copiedLabel : null}
        </span>
      )}
    </div>
  );
}

/**
 * Source code with an optional filename, language and copy action: headless
 * markup over {@link useCodeCopy}. Lines render as plain text in
 * `<span data-line>` elements, with `data-highlight` on highlighted lines, as
 * Chakra's plain-text adapter renders them; the `line` and `lineNumber` slots
 * are styled through `[data-line]` (and its `::before`), not as parts.
 */
export const CodeBlock = postkitView<
  typeof codeBlockDefinition,
  CodeBlockProps
>(codeBlockDefinition, ({ props, part }) => {
  const { filename, language, colorScheme, maxHeight } = props;
  const source =
    props.code ?? (typeof props.children === 'string' ? props.children : '');
  const highlights = new Set(postkitHighlightedLines(props.highlightLines));
  const shouldNumber = enabled(props.lineNumbers, false);
  const shouldWrap = enabled(props.wrap, false);
  const shouldCopy = source.trim().length > 0 && enabled(props.copy, true);
  const lines = source.split('\n');

  return (
    <div {...part('root')} data-color-scheme={colorScheme}>
      {filename || language || shouldCopy ? (
        <header {...part('header')}>
          {filename || language ? (
            <div {...part('title')}>
              {filename ? (
                <span {...aliasedPart(part, 'filename')}>{filename}</span>
              ) : null}
              {language ? <span {...part('language')}>{language}</span> : null}
            </div>
          ) : null}
          {shouldCopy ? (
            <CopyControl
              code={source}
              part={part}
              label={props.copyLabel ?? 'Copy code'}
              copiedLabel={props.copiedLabel ?? 'Copied'}
              icon={props.copyIcon}
              copiedIcon={props.copiedIcon}
              ariaLabel={props.copyAriaLabel ?? 'Copy code'}
              feedback={props.copyFeedback ?? 'inline'}
            />
          ) : null}
        </header>
      ) : null}
      <div
        {...aliasedPart(part, 'content', maxHeight ? { maxHeight } : undefined)}
      >
        <pre
          {...part('code')}
          tabIndex={0}
          data-line-numbers={shouldNumber ? '' : undefined}
          data-word-wrap={shouldWrap ? '' : undefined}
        >
          <code {...aliasedPart(part, 'codeText')}>
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 ? '\n' : null}
                <span
                  data-line={index + 1}
                  data-highlight={highlights.has(index + 1) ? '' : undefined}
                  data-word-wrap={shouldWrap ? '' : undefined}
                >
                  {line || ' '}
                </span>
              </Fragment>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
});

import { diffDefinition, type PostkitSlotOf } from '@postkit/core/components';
import { useId } from 'react';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type DiffSlot = PostkitSlotOf<typeof diffDefinition>;
export type DiffProps = PostkitViewProps<typeof diffDefinition>;

/** One line of a unified diff, ready to render. */
export interface PostkitDiffLine {
  /** Also the line's `data-diff` attribute. */
  readonly kind: 'addition' | 'deletion' | 'context';
  /** `+`, `−` (a minus sign) or a space. */
  readonly marker: '+' | '−' | ' ';
  /** The line without its marker; a space when empty, so the line keeps its height. */
  readonly content: string;
}

/** Splits unified diff text into lines, dropping one trailing newline. */
export function postkitDiffLines(diff: string): PostkitDiffLine[] {
  return diff
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => {
      const kind = line.startsWith('+')
        ? 'addition'
        : line.startsWith('-')
          ? 'deletion'
          : 'context';
      return {
        kind,
        marker: kind === 'addition' ? '+' : kind === 'deletion' ? '−' : ' ',
        content: line.slice(kind === 'context' ? 0 : 1) || ' ',
      };
    });
}

/**
 * A semantic unified diff: headless markup only. Each line carries
 * `data-diff="addition" | "deletion" | "context"` for styling.
 */
export const Diff = postkitView<typeof diffDefinition, DiffProps>(
  diffDefinition,
  ({ props, part }) => {
    const titleId = `${useId()}-title`;
    const { title } = props;
    return (
      <div {...part('root')}>
        {title ? (
          <div {...part('header')}>
            <p {...part('title')} id={titleId}>
              {title}
            </p>
          </div>
        ) : null}
        {/* The code scrolls sideways on narrow screens, so keyboard users need to reach it. */}
        <pre
          {...part('code')}
          tabIndex={0}
          role="region"
          {...(title
            ? { 'aria-labelledby': titleId }
            : { 'aria-label': 'Diff' })}
        >
          <code>
            {postkitDiffLines(props.diff).map((line, index) => (
              <span {...part('line')} data-diff={line.kind} key={index}>
                <span {...part('marker')} aria-hidden="true">
                  {line.marker}
                </span>
                <span {...part('content')}>{line.content}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    );
  },
);

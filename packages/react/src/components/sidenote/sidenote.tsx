import {
  sidenoteDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type SidenoteSlot = PostkitSlotOf<typeof sidenoteDefinition>;

export type SidenoteProps = PostkitViewProps<typeof sidenoteDefinition> & {
  /** The note's mark, in the list's numbering. Defaults to its index. */
  readonly mark?: string;
};

/**
 * @internal A note beside its reference: what `Footnote` renders for the
 * `side`, `popover` and `inline` placements (03 §7.1). It starts hidden; the
 * footnotes behaviour shows it when its placement applies. It shares the
 * margin column with `Aside` (D14).
 */
export const Sidenote = postkitView<typeof sidenoteDefinition, SidenoteProps>(
  sidenoteDefinition,
  ({ props, part }) => {
    const mark = props.mark ?? String(props.index ?? '');
    return (
      <span {...part('root')} role="note" aria-label={`Note ${mark}`}>
        <span {...part('number')} aria-hidden="true">
          {mark}
        </span>
        <span {...part('content')}>{props.children}</span>
        <button
          type="button"
          data-postkit-sidenote-close=""
          aria-label={`Close note ${mark}`}
          hidden
        >
          ×
        </button>
      </span>
    );
  },
);

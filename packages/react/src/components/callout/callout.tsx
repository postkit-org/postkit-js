import {
  calloutDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { ReactNode } from 'react';

import {
  postkitView,
  type PostkitViewContext,
  type PostkitViewProps,
} from '../../lib/view.js';

/** The mark for each tone, shown when no `icon` is given. */
export const postkitCalloutMarks = Object.freeze({
  note: 'i',
  tip: '✓',
  important: '!',
  warning: '!',
  caution: '×',
} as const);

export type CalloutTone = keyof typeof postkitCalloutMarks;
export type CalloutSlot = PostkitSlotOf<typeof calloutDefinition>;

export type CalloutProps = PostkitViewProps<typeof calloutDefinition> & {
  /** Replaces the tone's mark. */
  readonly icon?: ReactNode;
  /**
   * An alias of `tone`, for content written with `type` (Prismark vaults,
   * D6). `tone` is canonical and wins when both are set.
   */
  readonly type?: CalloutTone;
};

/**
 * The Callout render, shared by `Callout` and `Aside` (same anatomy).
 *
 * @internal
 */
export function renderPostkitCallout({
  props,
  part,
}: Pick<
  PostkitViewContext<typeof calloutDefinition, CalloutProps>,
  'part' | 'props'
>) {
  const tone: CalloutTone = props.tone ?? 'note';
  return (
    <aside {...part('root')} data-postkit-tone={tone}>
      <span {...part('icon')} aria-hidden="true">
        {props.icon ?? postkitCalloutMarks[tone]}
      </span>
      <div {...part('content')}>
        {props.title ? <p {...part('title')}>{props.title}</p> : null}
        <div {...part('body')}>{props.children}</div>
      </div>
    </aside>
  );
}

/** A highlighted note, tip, warning, or caution: headless markup only. */
export const Callout = postkitView<typeof calloutDefinition, CalloutProps>(
  calloutDefinition,
  renderPostkitCallout,
);

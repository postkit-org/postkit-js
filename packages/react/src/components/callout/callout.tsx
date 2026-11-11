import {
  calloutDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { ReactNode } from 'react';

import {
  postkitView,
  type PostkitPartGetter,
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
 * What the shared Callout render takes: the view context, and `mark: false`
 * to leave out the tone mark (`Aside`, D14), whose anatomy has no `icon`.
 *
 * @internal
 */
export type PostkitCalloutRenderInput = Pick<
  PostkitViewContext<typeof calloutDefinition, CalloutProps>,
  'props'
> &
  (
    | {
        readonly part: PostkitViewContext<
          typeof calloutDefinition,
          CalloutProps
        >['part'];
        readonly mark?: true;
      }
    | {
        readonly part: PostkitPartGetter<Exclude<CalloutSlot, 'icon'>>;
        readonly mark: false;
      }
  );

/**
 * The Callout render, shared by `Callout` and `Aside` (the Callout anatomy;
 * Aside's leaves out the `icon` part).
 *
 * @internal
 */
export function renderPostkitCallout(input: PostkitCalloutRenderInput) {
  const { props, part } = input;
  const tone: CalloutTone = props.tone ?? 'note';
  return (
    <aside {...part('root')} data-postkit-tone={tone}>
      {input.mark === false ? null : (
        <span {...input.part('icon')} aria-hidden="true">
          {props.icon ?? postkitCalloutMarks[tone]}
        </span>
      )}
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

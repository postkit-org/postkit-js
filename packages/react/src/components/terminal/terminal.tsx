import {
  terminalDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type TerminalSlot = PostkitSlotOf<typeof terminalDefinition>;
export type TerminalProps = PostkitViewProps<typeof terminalDefinition>;

/** A terminal command and its optional output: headless markup only. */
export const Terminal = postkitView<typeof terminalDefinition, TerminalProps>(
  terminalDefinition,
  ({ props, part }) => (
    <div {...part('root')}>
      <div {...part('header')}>
        <div {...part('dots')} aria-hidden="true">
          ● ● ●
        </div>
        <p {...part('title')}>{props.title}</p>
        <span />
      </div>
      <div {...part('body')}>
        <span {...part('prompt')} aria-hidden="true">
          {props.prompt}
        </span>
        <code {...part('command')}>{props.command}</code>
        {props.output ? <samp {...part('output')}>{props.output}</samp> : null}
      </div>
    </div>
  ),
);

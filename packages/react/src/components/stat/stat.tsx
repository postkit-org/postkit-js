import { statDefinition, type PostkitSlotOf } from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type StatSlot = PostkitSlotOf<typeof statDefinition>;
export type StatProps = Omit<
  PostkitViewProps<typeof statDefinition>,
  'value'
> & {
  /** The displayed metric value. */
  readonly value: string | number;
};

/**
 * A prominent metric with context and trend: headless markup only.
 *
 * A `<dl>` needs each `<dt>` before its `<dd>`s, so the label (the term)
 * comes first in the markup and the value, trend and description describe
 * it. Styles that show the value first can use `order` on the value part.
 */
export const Stat = postkitView<typeof statDefinition, StatProps>(
  statDefinition,
  ({ props, part }) => (
    <dl {...part('root')}>
      <dt {...part('label')}>{props.label}</dt>
      <dd {...part('value')}>{props.value}</dd>
      {props.trend ? <dd {...part('trend')}>{props.trend}</dd> : null}
      {props.description ? (
        <dd {...part('description')}>{props.description}</dd>
      ) : null}
    </dl>
  ),
);

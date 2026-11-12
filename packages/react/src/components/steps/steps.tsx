import { stepsDefinition, type PostkitSlotOf } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitJsonItems } from '../../lib/json-items.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type StepsSlot = PostkitSlotOf<typeof stepsDefinition>;

export interface StepItem {
  readonly title: string;
  readonly description?: ReactNode;
}

export type StepsProps = Omit<
  PostkitViewProps<typeof stepsDefinition>,
  'items'
> & {
  /** The steps, or authored JSON text for them. */
  readonly items: string | readonly StepItem[];
};

/** An ordered sequence of titled instructions: headless markup only. */
export const Steps = postkitView<typeof stepsDefinition, StepsProps>(
  stepsDefinition,
  ({ props, part }) => {
    const items = postkitJsonItems<StepItem>(props.items, 'Steps items');
    return (
      <ol {...part('root')}>
        {items.map((item, index) => (
          <li {...part('item')} key={`${item.title}-${index}`}>
            <div {...part('marker')} aria-hidden="true">
              {index + 1}
            </div>
            <div {...part('content')}>
              <p {...part('title')}>{item.title}</p>
              {item.description ? (
                <div {...part('description')}>{item.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    );
  },
);

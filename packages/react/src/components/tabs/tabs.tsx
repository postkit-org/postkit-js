import { tabsDefinition, type PostkitSlotOf } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { useTabs } from '../../hooks/use-tabs.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type TabsSlot = PostkitSlotOf<typeof tabsDefinition>;

/** One tab: its label and panel content. `id` keeps the value stable. */
export interface TabItem {
  readonly id?: string;
  readonly label: string;
  readonly content: ReactNode;
}

export type TabsProps = Omit<
  PostkitViewProps<typeof tabsDefinition>,
  'items' | 'initialIndex'
> & {
  /** The tabs, or authored JSON text for them. */
  readonly items: string | readonly TabItem[];
  /** The tab selected first: a number, or a string from a directive. */
  readonly initialIndex?: number | string;
};

/**
 * Keyboard-operable switchable panels: headless markup over {@link useTabs}.
 * Arrow keys, Home and End move focus and select; focus wraps at the ends.
 */
export const Tabs = postkitView<typeof tabsDefinition, TabsProps>(
  tabsDefinition,
  ({ props, part }) => {
    const items = postkitJsonItems<TabItem>(props.items, 'Tabs items');
    const values = items.map((item, index) => item.id ?? String(index));
    const api = useTabs({ values, initialIndex: props.initialIndex });
    return (
      <div {...mergePostkitPartProps(api.getRootProps(), part('root'))}>
        <div
          {...mergePostkitPartProps(
            api.getListProps(),
            { 'aria-label': props.label },
            part('list'),
          )}
        >
          {items.map((item, index) => (
            <button
              {...mergePostkitPartProps(
                api.getTriggerProps({ value: values[index] ?? '' }),
                part('tab'),
              )}
              key={values[index]}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div {...part('panels')}>
          {items.map((item, index) => (
            <div
              {...mergePostkitPartProps(
                api.getContentProps({ value: values[index] ?? '' }),
                part('panel'),
              )}
              key={values[index]}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

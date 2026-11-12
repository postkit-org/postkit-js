import {
  keyTakeawayDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { parsePostkitJsonArray } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type KeyTakeawaySlot = PostkitSlotOf<typeof keyTakeawayDefinition>;
export type KeyTakeawayProps = Omit<
  PostkitViewProps<typeof keyTakeawayDefinition>,
  'items'
> & {
  /** The takeaway bullets, or their JSON array text. */
  readonly items?: string | readonly string[];
};

/** A highlighted summary or list of essential points: headless markup only. */
export const KeyTakeaway = postkitView<
  typeof keyTakeawayDefinition,
  KeyTakeawayProps
>(keyTakeawayDefinition, ({ props, part }) => {
  const items = parsePostkitJsonArray<string>(
    props.items ?? [],
    'KeyTakeaway items',
  );
  return (
    <aside {...part('root')}>
      {props.eyebrow ? <p {...part('eyebrow')}>{props.eyebrow}</p> : null}
      <p {...part('title')}>{props.title}</p>
      {props.children ? <div {...part('body')}>{props.children}</div> : null}
      {items.length ? (
        <ul {...part('list')}>
          {items.map((item, index) => (
            <li {...part('item')} key={`${item}-${index}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
});

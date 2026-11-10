import {
  relatedContentDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { parsePostkitJsonArray } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** One related article or resource. */
export interface RelatedContentItem {
  readonly title: string;
  readonly href: string;
  readonly description?: string;
  readonly meta?: string;
}

export type RelatedContentSlot = PostkitSlotOf<typeof relatedContentDefinition>;
export type RelatedContentProps = Omit<
  PostkitViewProps<typeof relatedContentDefinition>,
  'items'
> & {
  /** The related links, or their JSON array text. */
  readonly items: string | readonly RelatedContentItem[];
};

/** A semantic list of related articles or resources: headless markup only. */
export const RelatedContent = postkitView<
  typeof relatedContentDefinition,
  RelatedContentProps
>(relatedContentDefinition, ({ props, part }) => {
  const items = parsePostkitJsonArray<RelatedContentItem>(
    props.items,
    'RelatedContent items',
  );
  return (
    <aside {...part('root')}>
      <p {...part('title')}>{props.title}</p>
      <ul {...part('list')}>
        {items.map((item) => (
          <li {...part('item')} key={item.href}>
            <a {...part('link')} href={item.href}>
              <span {...part('itemTitle')}>{item.title}</span>
              {item.description ? (
                <span {...part('description')}>{item.description}</span>
              ) : null}
              {item.meta ? <span {...part('meta')}>{item.meta}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
});

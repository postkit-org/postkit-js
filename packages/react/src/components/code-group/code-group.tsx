import {
  codeGroupDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { useTabs } from '../../hooks/use-tabs.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { CodeBlock } from '../code-block/code-block.js';

export type CodeGroupSlot = PostkitSlotOf<typeof codeGroupDefinition>;

/** One labelled code example. */
export interface CodeGroupItem {
  readonly label: string;
  readonly code: string;
  readonly language?: string;
  readonly filename?: string;
}

export type CodeGroupProps = Omit<
  PostkitViewProps<typeof codeGroupDefinition>,
  'items' | 'initialIndex'
> & {
  /** The examples, or authored JSON text for them. */
  readonly items: string | readonly CodeGroupItem[];
  /** The example selected first: a number, or a string from a directive. */
  readonly initialIndex?: number | string;
};

/**
 * Alternative code examples as tabs, each panel a headless `CodeBlock`
 * (plain variant): headless markup over {@link useTabs}.
 */
export const CodeGroup = postkitView<
  typeof codeGroupDefinition,
  CodeGroupProps
>(codeGroupDefinition, ({ props, part }) => {
  const items = postkitJsonItems<CodeGroupItem>(props.items, 'CodeGroup items');
  const values = items.map((_, index) => String(index));
  const api = useTabs({ values, initialIndex: props.initialIndex });
  return (
    <div {...mergePostkitPartProps(api.getRootProps(), part('root'))}>
      <div
        {...mergePostkitPartProps(
          api.getListProps(),
          { 'aria-label': props.label },
          part('tabs'),
        )}
      >
        {items.map((item, index) => (
          <button
            {...mergePostkitPartProps(
              api.getTriggerProps({ value: String(index) }),
              part('tab'),
            )}
            key={`${item.label}-${index}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          {...mergePostkitPartProps(
            api.getContentProps({ value: String(index) }),
            part('panel'),
          )}
          key={`${item.label}-${index}`}
        >
          <CodeBlock
            code={item.code}
            language={item.language}
            filename={item.filename}
            variant="plain"
            size={props.size}
          />
        </div>
      ))}
    </div>
  );
});

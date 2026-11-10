import {
  fileTreeDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type FileTreeSlot = PostkitSlotOf<typeof fileTreeDefinition>;

export interface FileTreeItem {
  readonly path: string;
  readonly type?: 'file' | 'folder';
  readonly meta?: string;
}

export type FileTreeProps = Omit<
  PostkitViewProps<typeof fileTreeDefinition>,
  'items'
> & {
  /** The entries, or a JSON array of them (as authored in Markdown). */
  readonly items: string | readonly FileTreeItem[];
};

/**
 * The FileTree entries from an array or its JSON text. Throws a `TypeError`
 * when the text isn't a JSON array.
 */
export function postkitFileTreeItems(
  value: string | readonly FileTreeItem[],
): readonly FileTreeItem[] {
  if (typeof value !== 'string') return value;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TypeError('Postkit FileTree items must contain valid JSON.');
  }
  if (!Array.isArray(parsed)) {
    throw new TypeError('Postkit FileTree items must contain a JSON array.');
  }
  return parsed as readonly FileTreeItem[];
}

/** How deep an entry sits: `src/lib/a.ts` is 2. */
export function postkitFileTreeDepth(item: FileTreeItem): number {
  return Math.max(0, item.path.split('/').length - 1);
}

/**
 * A compact, semantic project tree: headless markup only. Each item's
 * indentation follows its depth as an inline style, since it is content,
 * not theme.
 */
export const FileTree = postkitView<typeof fileTreeDefinition, FileTreeProps>(
  fileTreeDefinition,
  ({ props, part }) => (
    <div {...part('root')}>
      {props.title ? <p {...part('title')}>{props.title}</p> : null}
      <ul {...part('list')}>
        {postkitFileTreeItems(props.items).map((item, index) => (
          <li
            {...part('item', {
              style: {
                paddingInlineStart: `${postkitFileTreeDepth(item) * 1.25}em`,
              },
            })}
            key={`${item.path}-${index}`}
          >
            <span {...part('icon')} aria-hidden="true">
              {item.type === 'folder' ? '▸' : '·'}
            </span>
            <span {...part('path')}>{item.path.split('/').at(-1)}</span>
            {item.meta ? <span {...part('meta')}>{item.meta}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  ),
);

import {
  fileCardDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type FileCardSlot = PostkitSlotOf<typeof fileCardDefinition>;

export type FileCardProps = Omit<
  PostkitViewProps<typeof fileCardDefinition>,
  'download'
> & {
  /** Whether the link requests a download. `"true"` and `"false"` are accepted. */
  readonly download?: boolean | string;
};

/**
 * The FileCard's icon text: the `fileType`, or the name's extension in
 * capitals, at most four characters.
 */
export function postkitFileCardMark(name: string, fileType?: string): string {
  return (fileType ?? name.split('.').at(-1)?.toUpperCase() ?? 'FILE').slice(
    0,
    4,
  );
}

/** A descriptive file link or download: headless markup only. */
export const FileCard = postkitView<typeof fileCardDefinition, FileCardProps>(
  fileCardDefinition,
  ({ props, part }) => {
    const { name, description, fileType, fileSize, actionLabel } = props;
    const download = props.download === true || props.download === 'true';
    return (
      <div {...part('root')}>
        <div {...part('icon')} aria-hidden="true">
          {postkitFileCardMark(name, fileType)}
        </div>
        <div {...part('content')}>
          <p {...part('name')}>{name}</p>
          {description ? <p {...part('description')}>{description}</p> : null}
          {fileType || fileSize ? (
            <p {...part('meta')}>
              {[fileType, fileSize].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
        <a
          {...part('action')}
          href={props.href}
          download={download ? '' : undefined}
        >
          {actionLabel ?? (download ? 'Download' : 'Open')}
        </a>
      </div>
    );
  },
);

import {
  audienceBoundaryDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type AudienceBoundarySlot = PostkitSlotOf<
  typeof audienceBoundaryDefinition
>;
export type AudienceBoundaryProps = Omit<
  PostkitViewProps<typeof audienceBoundaryDefinition>,
  'fallback' | 'showLabel'
> & {
  /** What an unauthorized viewer sees instead of the content. */
  readonly fallback?: ReactNode;
  /** Whether the viewer may see the content. The host decides; defaults to `true`. */
  readonly authorized?: boolean;
  /** Whether the audience label is visible. `"true"` is accepted. */
  readonly showLabel?: boolean | string;
};

/**
 * An authored audience marker with a host-controlled visibility boundary:
 * headless markup only. The root carries `data-postkit-audience`.
 */
export const AudienceBoundary = postkitView<
  typeof audienceBoundaryDefinition,
  AudienceBoundaryProps
>(audienceBoundaryDefinition, ({ props, part }) => {
  const { audience, showLabel } = props;
  const authorized = props.authorized === undefined ? true : props.authorized;
  return (
    <div data-postkit-audience={audience} {...part('root')}>
      {showLabel === true || showLabel === 'true' ? (
        <p {...part('label')}>Audience: {audience}</p>
      ) : null}
      {authorized ? (
        <div {...part('content')}>{props.children}</div>
      ) : (
        <div {...part('fallback')}>{props.fallback}</div>
      )}
    </div>
  );
});

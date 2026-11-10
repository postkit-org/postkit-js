import {
  postkitDefaultShareServiceIds,
  type ShareRequest,
} from '@postkit/core/behaviors';
import {
  shareActionsDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { useMemo } from 'react';

import { useShareActions } from '../../hooks/use-share-actions.js';
import { postkitJsonItems } from '../../lib/json-items.js';
import { mergePostkitPartProps } from '../../lib/merge-part.js';
import {
  postkitShareServiceRegistry,
  type PostkitShareService,
  type PostkitShareServiceRegistry,
} from '../../lib/share-services.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type { PostkitShareService, PostkitShareServiceRegistry, ShareRequest };
export type ShareActionsSlot = PostkitSlotOf<typeof shareActionsDefinition>;

export type ShareActionsProps = Omit<
  PostkitViewProps<typeof shareActionsDefinition>,
  'services'
> & {
  /** Service ids, or authored JSON text for them. Defaults to native, copy and email. */
  readonly services?: string | readonly string[];
  /** Labels, icons and share handlers, merged over Postkit's built-in services. */
  readonly socialServices?: PostkitShareServiceRegistry;
  /** Called after each share that didn't fail. */
  readonly onShare?: (service: string, request: ShareRequest) => void;
};

/**
 * Reader-initiated sharing, from `useShareActions`: headless markup only.
 * Each action is a button named "label: service" and carrying
 * `data-postkit-service`; outcomes are announced in the polite `status` part.
 */
export const ShareActions = postkitView<
  typeof shareActionsDefinition,
  ShareActionsProps
>(shareActionsDefinition, ({ props, part }) => {
  const { url, title, text, label, onShare, socialServices } = props;
  const serviceIds = postkitJsonItems<string>(
    props.services ?? postkitDefaultShareServiceIds,
    'ShareActions services',
  );
  const services = useMemo(
    () => postkitShareServiceRegistry(socialServices),
    [socialServices],
  );
  const api = useShareActions({
    url,
    title,
    text,
    label: label ?? '',
    services,
    onShare,
  });
  return (
    <aside {...part('root')}>
      <p {...part('label')}>{label}</p>
      <div {...part('actions')}>
        {serviceIds.map((serviceId) => {
          const icon = services[serviceId]?.icon;
          const serviceLabel = api.serviceLabel(serviceId);
          return (
            <button
              key={serviceId}
              data-postkit-service={serviceId}
              {...mergePostkitPartProps(
                api.getActionProps(serviceId),
                part('action'),
              )}
            >
              <span aria-hidden={icon ? undefined : true} {...part('icon')}>
                {icon ?? serviceLabel.slice(0, 1).toUpperCase()}
              </span>
              {serviceLabel}
            </button>
          );
        })}
      </div>
      <p {...mergePostkitPartProps(api.getStatusProps(), part('status'))}>
        {api.status}
      </p>
    </aside>
  );
});

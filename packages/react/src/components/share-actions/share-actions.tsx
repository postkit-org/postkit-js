import {
  postkitDefaultShareServiceIds,
  type ShareRequest,
} from '@postkit/core/behaviors';
import {
  shareActionsDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { useId, useMemo } from 'react';

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

/** A service's initial, for the icon part of a service without an icon. */
function serviceInitial(label: string): string {
  return label.slice(0, 1).toUpperCase();
}

/**
 * Reader-initiated sharing, from `useShareActions`: headless markup only.
 * The `actions` part is a group named by the `label` part. Each action is a
 * button named by its visible service label and carrying
 * `data-postkit-service`; outcomes are announced in the polite `status` part.
 *
 * A service without an icon gets its initial as `data-postkit-initial` on
 * the `icon` part, which `styles.css` draws with `::before`. Keeping it out
 * of the button's text lets the accessible name start with the visible
 * label (WCAG 2.5.3).
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
  const labelId = `${useId()}-label`;
  return (
    <aside {...part('root')}>
      <p {...part('label')} id={label ? labelId : undefined}>
        {label}
      </p>
      <div
        {...part('actions')}
        role="group"
        aria-labelledby={label ? labelId : undefined}
      >
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
              <span
                aria-hidden={icon ? undefined : true}
                data-postkit-initial={
                  icon ? undefined : serviceInitial(serviceLabel)
                }
                {...part('icon')}
              >
                {icon}
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

import {
  callToActionDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type CallToActionSlot = PostkitSlotOf<typeof callToActionDefinition>;

export type CallToActionProps = PostkitViewProps<typeof callToActionDefinition>;

/**
 * A focused callout with a heading, supporting copy and up to two action
 * links. An action renders only with both its label and its href. Children
 * replace the plain-text `description`. Headless markup only.
 */
export const CallToAction = postkitView<
  typeof callToActionDefinition,
  CallToActionProps
>(callToActionDefinition, ({ props, part }) => {
  const {
    title,
    eyebrow,
    description,
    children,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
  } = props;
  const primary = primaryLabel && primaryHref;
  const secondary = secondaryLabel && secondaryHref;

  return (
    <aside {...part('root')}>
      <div {...part('content')}>
        {eyebrow ? <p {...part('eyebrow')}>{eyebrow}</p> : null}
        <h2 {...part('title')}>{title}</h2>
        {description || children ? (
          <div {...part('body')}>{children ?? description}</div>
        ) : null}
      </div>
      {primary || secondary ? (
        <div {...part('actions')}>
          {primary ? (
            <a {...part('primaryAction')} href={primaryHref}>
              {primaryLabel}
            </a>
          ) : null}
          {secondary ? (
            <a {...part('secondaryAction')} href={secondaryHref}>
              {secondaryLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
});

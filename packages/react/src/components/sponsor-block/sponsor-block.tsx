import {
  sponsorBlockDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type SponsorBlockSlot = PostkitSlotOf<typeof sponsorBlockDefinition>;
export type SponsorBlockProps = PostkitViewProps<typeof sponsorBlockDefinition>;

/**
 * A clearly disclosed sponsor message and destination: headless markup only.
 * The logo's alt text falls back to the sponsor's name.
 */
export const SponsorBlock = postkitView<
  typeof sponsorBlockDefinition,
  SponsorBlockProps
>(sponsorBlockDefinition, ({ props, part }) => {
  const { name, message, href, logoSrc, logoAlt, disclosure } = props;
  return (
    <aside aria-label={`${disclosure} by ${name}`} {...part('root')}>
      <p {...part('disclosure')}>{disclosure}</p>
      {logoSrc ? (
        <img {...part('logo')} src={logoSrc} alt={logoAlt || name} />
      ) : null}
      <div {...part('content')}>
        <p {...part('name')}>{name}</p>
        {message ? <p {...part('message')}>{message}</p> : null}
        {href ? (
          <a {...part('action')} href={href} rel="sponsored">
            {props.actionLabel}
          </a>
        ) : null}
      </div>
    </aside>
  );
});

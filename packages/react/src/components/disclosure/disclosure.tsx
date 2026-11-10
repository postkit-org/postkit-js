import {
  disclosureDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';

export type DisclosureSlot = PostkitSlotOf<typeof disclosureDefinition>;

export type DisclosureProps = PostkitViewProps<typeof disclosureDefinition>;

/**
 * Expandable content on native `details` and `summary`: headless markup only.
 * The toggle works without client-side JavaScript.
 */
export const Disclosure = postkitView<
  typeof disclosureDefinition,
  DisclosureProps
>(disclosureDefinition, ({ props, part }) => (
  <details {...part('root')} open={props.open}>
    <summary {...part('summary')}>
      {props.summary}
      <span {...part('indicator')} aria-hidden="true">
        +
      </span>
    </summary>
    <div {...part('content')}>{props.children}</div>
  </details>
));

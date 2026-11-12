import { asideDefinition } from '@postkit/core/components';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { renderPostkitCallout } from '../callout/callout.js';

export type AsideProps = PostkitViewProps<typeof asideDefinition>;

/**
 * A semantic article aside, the authored sidenote (D14): the Callout
 * anatomy under its own name, without the tone mark in any placement or
 * size. `tone` still sets `data-tone` for styling.
 */
export const Aside = postkitView<typeof asideDefinition, AsideProps>(
  asideDefinition,
  ({ props, part }) => renderPostkitCallout({ props, part, mark: false }),
);

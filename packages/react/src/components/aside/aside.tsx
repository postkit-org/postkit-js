import { asideDefinition } from '@postkit/core/components';
import type { ReactNode } from 'react';

import { postkitView, type PostkitViewProps } from '../../lib/view.js';
import { renderPostkitCallout } from '../callout/callout.js';

export type AsideProps = PostkitViewProps<typeof asideDefinition> & {
  /** Replaces the tone's mark. */
  readonly icon?: ReactNode;
};

/** A semantic article aside: the Callout anatomy under its own name. */
export const Aside = postkitView<typeof asideDefinition, AsideProps>(
  asideDefinition,
  renderPostkitCallout,
);

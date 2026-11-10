'use client';

import { asideDefinition } from '@postkit/core/components';

import { postkitChakraView } from '../../lib/view.js';
import { postkitCalloutRecipe } from '../callout/callout.recipe.js';
import {
  renderPostkitChakraCallout,
  type CalloutProps,
} from '../callout/callout.js';

export type AsideProps = CalloutProps;

/**
 * A semantic article aside. It is the Callout view under its own definition,
 * styled by the Callout recipe (`postkitCallout`).
 */
export const Aside = postkitChakraView<typeof asideDefinition, AsideProps>(
  asideDefinition,
  postkitCalloutRecipe,
  renderPostkitChakraCallout,
  { recipeKey: 'postkitCallout' },
);

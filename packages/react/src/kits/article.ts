import {
  asideDefinition,
  audienceBoundaryDefinition,
  calloutDefinition,
  cardGridDefinition,
  disclosureDefinition,
  footnoteDefinition,
  footnotesDefinition,
  keyTakeawayDefinition,
  pullQuoteDefinition,
  stepsDefinition,
  tabsDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `article` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const article = definePostkitBuiltInKit('article', [
  asideDefinition,
  calloutDefinition,
  cardGridDefinition,
  disclosureDefinition,
  stepsDefinition,
  tabsDefinition,
  audienceBoundaryDefinition,
  keyTakeawayDefinition,
  pullQuoteDefinition,
  footnoteDefinition,
  footnotesDefinition,
]);

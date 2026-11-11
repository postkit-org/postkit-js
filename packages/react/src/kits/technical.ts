import {
  chartDefinition,
  codeBlockDefinition,
  codeGroupDefinition,
  comparisonDefinition,
  diffDefinition,
  fileCardDefinition,
  fileTreeDefinition,
  statDefinition,
  terminalDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `technical` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const technical = definePostkitBuiltInKit('technical', [
  codeBlockDefinition,
  codeGroupDefinition,
  diffDefinition,
  fileCardDefinition,
  fileTreeDefinition,
  terminalDefinition,
  comparisonDefinition,
  statDefinition,
  chartDefinition,
]);

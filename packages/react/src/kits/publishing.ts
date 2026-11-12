import {
  productCardDefinition,
  sponsorBlockDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `publishing` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const publishing = definePostkitBuiltInKit('publishing', [
  productCardDefinition,
  sponsorBlockDefinition,
]);

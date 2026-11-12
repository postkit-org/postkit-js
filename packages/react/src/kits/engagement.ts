import {
  callToActionDefinition,
  newsletterSignupDefinition,
  pollDefinition,
  shareActionsDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `engagement` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const engagement = definePostkitBuiltInKit('engagement', [
  pollDefinition,
  callToActionDefinition,
  newsletterSignupDefinition,
  shareActionsDefinition,
]);

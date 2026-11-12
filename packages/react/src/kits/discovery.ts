import {
  appearsOnDefinition,
  authorCardDefinition,
  linkPreviewDefinition,
  relatedContentDefinition,
  seriesNavigationDefinition,
  socialPostDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `discovery` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const discovery = definePostkitBuiltInKit('discovery', [
  relatedContentDefinition,
  seriesNavigationDefinition,
  appearsOnDefinition,
  authorCardDefinition,
  linkPreviewDefinition,
  socialPostDefinition,
]);

import {
  audioDefinition,
  carouselDefinition,
  deviceDefinition,
  figureDefinition,
  galleryDefinition,
  videoDefinition,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';

/**
 * The `media` kit: Postkit's built-in definitions for the category. It
 * imports only its own definitions, so a site ships just the kits it enables.
 */
export const media = definePostkitBuiltInKit('media', [
  galleryDefinition,
  audioDefinition,
  carouselDefinition,
  figureDefinition,
  videoDefinition,
  deviceDefinition,
]);

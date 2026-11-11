import { postkitBuiltInDefinitions } from '@postkit/core/components';
import { postkitLazyViews, type PostkitLazyView } from '@postkit/react';

import {
  postkitChakraViewLoaders,
  type PostkitChakraViewName,
} from './view-loaders.js';

/**
 * The Chakra views as lazy views (`postkitLazyView`), keyed by component
 * name like `postkitChakraViews`: each downloads its view the first time it
 * renders. They carry their definitions, so `createPostkit` gives them site
 * defaults and part overrides like the views themselves.
 *
 * Kept apart from `chakraLazy`, whose provider falls back to Chakra's
 * `defaultSystem`, so a host that renders these views beneath its own system
 * doesn't bundle Chakra's full theme.
 */
export const postkitChakraLazyViews: Readonly<
  Record<PostkitChakraViewName, PostkitLazyView>
> = postkitLazyViews(postkitChakraViewLoaders, postkitBuiltInDefinitions);

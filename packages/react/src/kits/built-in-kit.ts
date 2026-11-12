import {
  postkitBuiltInDefinitions,
  postkitKitCategories,
  type PostkitKitId,
} from '@postkit/core/components';

import { definePostkitBuiltInKit } from './built-in.js';
import type { PostkitKit } from './kit.js';

/**
 * One of Postkit's six built-in kits, from its catalog category. It reads
 * every built-in definition to find the category's; import the kit itself
 * (`article` from `@postkit/react/kits`) to bundle only its definitions.
 */
export function postkitBuiltInKit<const Id extends PostkitKitId>(
  id: Id,
): PostkitKit<Id> {
  const category = postkitKitCategories[id];
  return definePostkitBuiltInKit(
    id,
    Object.values(postkitBuiltInDefinitions).filter(
      (definition) => definition.category === category,
    ),
  );
}

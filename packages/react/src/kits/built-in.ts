import {
  postkitComponentCategories,
  postkitKitCategories,
  type AnyPostkitComponentDefinition,
  type PostkitKitId,
} from '@postkit/core/components';

import { definePostkitKit, type PostkitKit } from './kit.js';

/**
 * One of Postkit's six built-in kits, from the definitions its module imports
 * (every built-in definition in the kit's category, in catalog order). Each
 * kit module names its own definitions, so enabling one kit doesn't bundle
 * the others' definitions. A test checks each list against the catalog.
 *
 * @internal
 */
export function definePostkitBuiltInKit<const Id extends PostkitKitId>(
  id: Id,
  definitions: readonly AnyPostkitComponentDefinition[],
): PostkitKit<Id> {
  const category = postkitKitCategories[id];
  for (const definition of definitions) {
    if (definition.category !== category) {
      throw new TypeError(
        `Postkit kit "${id}" lists ${definition.name}, whose category is "${definition.category}".`,
      );
    }
  }
  return definePostkitKit({
    id,
    label: postkitComponentCategories[category],
    package: '@postkit/core',
    definitions,
  });
}

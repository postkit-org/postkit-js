/**
 * `@postkit/core/components`: framework-free component definitions, prop
 * builders, the anatomy (slots) and Postkit's built-in definitions.
 *
 * @module
 */
export {
  definePostkitComponent,
  postkitComponentCategories,
  type AnyPostkitComponentDefinition,
  type PostkitComponentCategoryId,
  type PostkitComponentChildren,
  type PostkitComponentDefinition,
  type PostkitComponentDefinitionInput,
  type PostkitComponentExampleDefinition,
  type PostkitComponentRuntime,
  type PostkitComponentStability,
  type PostkitPropNameOf,
  type PostkitPropsOf,
  type PostkitPropsOfProps,
  type PostkitRecipeKeyOf,
  type PostkitSlotOf,
  type PostkitThemeKeyOf,
  type PostkitThemeVariantOf,
} from './definition.js';
export {
  presentation,
  prop,
  type PostkitBooleanPropDefinition,
  type PostkitEnumPropDefinition,
  type PostkitEnumPropOptions,
  type PostkitJsonPropDefinition,
  type PostkitNumberPropDefinition,
  type PostkitPropDefinition,
  type PostkitPropDefinitionBase,
  type PostkitPropDefinitions,
  type PostkitPropKind,
  type PostkitPropOptions,
  type PostkitPropValueOf,
  type PostkitStringPropDefinition,
  type PostkitVariantPropOptions,
} from './props.js';
export * from './built-ins.js';

/**
 * `@postkit/nx`: an Nx plugin with a `component` generator
 * (`nx g @postkit/nx:component device`), sharing its templates with
 * `postkit new` from `@postkit/cli`.
 *
 * @module
 */
export {
  componentGenerator,
  type PostkitComponentGeneratorSchema,
  type PostkitGeneratorTree,
} from './generators/component/generator.js';

import type { AnyPostkitComponentDefinition } from '@postkit/core/components';

/**
 * A kit: a renderer-neutral list of component definitions that a site enables
 * together (03 §3.1, D2). Each renderer package supplies the views.
 */
export interface PostkitKit<Id extends string = string> {
  /** The kit id the manifest records, such as `article`. */
  readonly id: Id;
  /** A display label, such as `Article structure`. */
  readonly label: string;
  /** The package that defines the kit's components, for the manifest. */
  readonly package: string | null;
  /** The definitions, in catalog order. */
  readonly definitions: readonly AnyPostkitComponentDefinition[];
}

/** The input to {@link definePostkitKit}. */
export interface PostkitKitInput<Id extends string> {
  readonly id: Id;
  readonly label?: string;
  readonly package?: string | null;
  readonly definitions: readonly AnyPostkitComponentDefinition[];
}

/**
 * Defines a kit, such as a third-party package's set of components. Names
 * and directives must be unique within it.
 */
export function definePostkitKit<const Id extends string>(
  input: PostkitKitInput<Id>,
): PostkitKit<Id> {
  if (typeof input.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(input.id)) {
    throw new TypeError(
      `Postkit kit id "${String(input.id)}" must be lower-case kebab-case.`,
    );
  }
  const names = new Set<string>();
  const directives = new Set<string>();
  for (const definition of input.definitions) {
    if (names.has(definition.name)) {
      throw new TypeError(
        `Postkit kit "${input.id}" lists ${definition.name} twice.`,
      );
    }
    if (directives.has(definition.directive)) {
      throw new TypeError(
        `Postkit kit "${input.id}" repeats the directive "${definition.directive}".`,
      );
    }
    names.add(definition.name);
    directives.add(definition.directive);
  }
  return Object.freeze({
    id: input.id,
    label: input.label ?? input.id,
    package: input.package ?? null,
    definitions: Object.freeze([...input.definitions]),
  });
}

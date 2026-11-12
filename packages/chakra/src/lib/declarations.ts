import {
  postkitBuiltInDefinitions,
  presentation,
  type AnyPostkitComponentDefinition,
  type PostkitBuiltInComponentName,
  type PostkitPropDefinition,
  type PostkitPropDefinitions,
  type PostkitPropKind as CorePostkitPropKind,
} from '@postkit/core/components';
import type { PostkitRemarkPluginId } from './plugin-capabilities.js';

/*
 * The portable component and prop contract (declaration v7), built from the
 * framework-free definitions in `@postkit/core/components`. Change a component
 * in its `<name>.definition.ts`, not here.
 */

export const POSTKIT_DECLARATION_VERSION = 7 as const;

/** The name of a built-in Postkit component. */
export type PostkitComponentName = PostkitBuiltInComponentName;

export type PostkitPropKind = CorePostkitPropKind;

export interface PostkitPropDeclaration {
  readonly kind: PostkitPropKind;
  readonly required?: boolean;
  readonly values?: readonly string[];
  readonly description: string;
}

export interface PostkitComponentDeclaration {
  readonly name: PostkitComponentName;
  readonly directive: string;
  readonly description: string;
  readonly childMode: 'none' | 'mdx';
  readonly directiveRemarkPlugins: readonly PostkitRemarkPluginId[];
  readonly props: Readonly<Record<string, PostkitPropDeclaration>>;
}

export interface PostkitDeclarationManifest {
  readonly id: 'postkit.article';
  readonly version: typeof POSTKIT_DECLARATION_VERSION;
  readonly syntax: 'postkit-directive-v1';
  readonly components: Readonly<
    Record<PostkitComponentName, PostkitComponentDeclaration>
  >;
}

/** The declaration of one prop, typed from its definition. */
type PostkitPropDeclarationOf<Prop extends PostkitPropDefinition> = {
  kind: Prop['kind'];
} & (Prop extends { readonly required: true } ? { required: true } : unknown) &
  (Prop extends { readonly kind: 'enum' } ? { values: string[] } : unknown) & {
    description: string;
  };

type PostkitPropDeclarationsOf<Props extends PostkitPropDefinitions> = {
  [Name in keyof Props]: PostkitPropDeclarationOf<Props[Name]>;
};

/** A built-in declaration: the v7 contract plus its literal prop names. */
type PostkitBuiltInDeclaration<Name extends PostkitComponentName> =
  PostkitComponentDeclaration & {
    name: Name;
    childMode: (typeof postkitBuiltInDefinitions)[Name]['children'];
    directiveRemarkPlugins: ('directives' | 'postkit')[];
    props: PostkitPropDeclarationsOf<
      (typeof postkitBuiltInDefinitions)[Name]['props']
    >;
  };

const directiveRemarkPlugins = ['directives', 'postkit'] as const;

function propDeclaration(prop: PostkitPropDefinition): PostkitPropDeclaration {
  // Key order is part of the generated manifest: kind, values, required, description.
  return {
    kind: prop.kind,
    ...(prop.kind === 'enum' ? { values: [...prop.values] } : {}),
    ...(prop.required ? { required: true } : {}),
    description: prop.description,
  };
}

function propDeclarations(
  props: PostkitPropDefinitions,
): Record<string, PostkitPropDeclaration> {
  return Object.fromEntries(
    Object.entries(props).map(([name, prop]) => [name, propDeclaration(prop)]),
  );
}

/**
 * Converts a component definition into its v7 declaration. Every built-in
 * component uses the `directives` and `postkit` remark plugins.
 */
export function postkitDeclarationFromDefinition(
  definition: AnyPostkitComponentDefinition,
): PostkitComponentDeclaration {
  return {
    name: definition.name as PostkitComponentName,
    directive: definition.directive,
    description: definition.description,
    childMode: definition.children,
    directiveRemarkPlugins: [...directiveRemarkPlugins],
    props: propDeclarations(definition.props),
  };
}

export const postkitPresentationProps: Readonly<{
  size: { kind: 'enum'; values: string[]; description: string };
  variant: { kind: 'enum'; values: string[]; description: string };
}> = Object.freeze({
  size: {
    kind: 'enum',
    values: [...presentation.size.values],
    description: presentation.size.description,
  },
  variant: {
    kind: 'enum',
    values: [...presentation.variant.values],
    description: presentation.variant.description,
  },
});

export const postkitDeclarationManifest: Readonly<{
  id: 'postkit.article';
  version: typeof POSTKIT_DECLARATION_VERSION;
  syntax: 'postkit-directive-v1';
  components: {
    [Name in PostkitComponentName]: PostkitBuiltInDeclaration<Name>;
  };
}> = Object.freeze({
  id: 'postkit.article',
  version: POSTKIT_DECLARATION_VERSION,
  syntax: 'postkit-directive-v1',
  components: Object.fromEntries(
    Object.entries(postkitBuiltInDefinitions).map(([name, definition]) => [
      name,
      postkitDeclarationFromDefinition(definition),
    ]),
  ) as {
    [Name in PostkitComponentName]: PostkitBuiltInDeclaration<Name>;
  },
} satisfies PostkitDeclarationManifest);

export function postkitDeclarationFor(
  name: PostkitComponentName,
): PostkitComponentDeclaration {
  return postkitDeclarationManifest.components[name];
}

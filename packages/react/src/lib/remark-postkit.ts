import {
  postkitDeclarationManifest,
  type PostkitComponentDeclaration,
  type PostkitComponentName,
} from './declarations.js';

type DirectiveAttributeValue = string | null | undefined;

interface DirectiveData {
  hName?: string;
  hProperties?: Record<string, string | boolean>;
  [key: string]: unknown;
}

export interface PostkitDirectiveNode {
  type: string;
  name?: string;
  attributes?: Record<string, DirectiveAttributeValue> | PostkitDirectiveNode[];
  children?: PostkitDirectiveNode[];
  data?: DirectiveData;
  [key: string]: unknown;
}

export interface RemarkPostkitOptions {
  /**
   * `mdx` emits MDX JSX nodes. `hast` annotates directives for pipelines such
   * as react-markdown that turn `data.hName` into a registered component.
   */
  readonly output?: 'hast' | 'mdx';
  /**
   * Throw on invalid props by default so malformed authored content fails a
   * site build instead of silently changing behavior.
   */
  readonly strict?: boolean;
}

const componentByDirective = new Map<string, PostkitComponentDeclaration>(
  Object.values(postkitDeclarationManifest.components).flatMap(
    (declaration) => [
      [declaration.directive, declaration],
      [declaration.name.toLowerCase(), declaration],
    ],
  ),
);

function coerceHastValue(
  value: DirectiveAttributeValue,
  kind: string,
): string | boolean {
  if (kind === 'boolean') {
    return value === null || value === undefined || value === 'true';
  }

  return value ?? '';
}

function validateAttributes(
  declaration: PostkitComponentDeclaration,
  attributes: Record<string, DirectiveAttributeValue>,
  strict: boolean,
): Record<string, DirectiveAttributeValue> {
  const validated: Record<string, DirectiveAttributeValue> = {};

  for (const [name, value] of Object.entries(attributes)) {
    const prop = declaration.props[name];
    if (!prop) {
      if (strict) {
        throw new TypeError(
          `Unknown ${declaration.name} prop "${name}" in Postkit directive.`,
        );
      }
      continue;
    }

    if (
      prop.kind === 'enum' &&
      value !== null &&
      value !== undefined &&
      !prop.values?.includes(value)
    ) {
      throw new TypeError(
        `Invalid ${declaration.name} ${name} value "${value}".`,
      );
    }

    validated[name] = value;
  }

  for (const [name, prop] of Object.entries(declaration.props)) {
    if (
      prop.required &&
      (validated[name] === undefined || validated[name] === null)
    ) {
      throw new TypeError(
        `Postkit ${declaration.name} directive requires "${name}".`,
      );
    }
  }

  return validated;
}

function mdxAttributes(
  attributes: Record<string, DirectiveAttributeValue>,
): PostkitDirectiveNode[] {
  return Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value: value === null || value === undefined ? null : value,
  }));
}

function transformDirective(
  node: PostkitDirectiveNode,
  declaration: PostkitComponentDeclaration,
  options: Required<RemarkPostkitOptions>,
): void {
  const sourceAttributes =
    node.attributes && !Array.isArray(node.attributes) ? node.attributes : {};
  const attributes = validateAttributes(
    declaration,
    sourceAttributes,
    options.strict,
  );

  if (options.output === 'hast') {
    node.data = {
      ...node.data,
      hName: declaration.name,
      hProperties: Object.fromEntries(
        Object.entries(attributes).map(([name, value]) => [
          name,
          coerceHastValue(value, declaration.props[name]?.kind ?? 'string'),
        ]),
      ),
    };
    return;
  }

  node.type =
    node.type === 'textDirective' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement';
  node.name = declaration.name;
  node.attributes = mdxAttributes(attributes);
  node.children ??= [];
  delete node.data;
}

function visit(
  node: PostkitDirectiveNode,
  options: Required<RemarkPostkitOptions>,
): void {
  if (
    node.type === 'containerDirective' ||
    node.type === 'leafDirective' ||
    node.type === 'textDirective'
  ) {
    const declaration = node.name
      ? componentByDirective.get(node.name)
      : undefined;
    if (declaration) {
      transformDirective(node, declaration, options);
    }
  }

  node.children?.forEach((child) => visit(child, options));
}

/**
 * Remark-compatible transformer for Postkit directives. Pair it with a
 * directive parser (for example `remark-directive`) before this plugin.
 */
export function remarkPostkit(options: RemarkPostkitOptions = {}) {
  const resolved: Required<RemarkPostkitOptions> = {
    output: options.output ?? 'mdx',
    strict: options.strict ?? true,
  };

  return (tree: PostkitDirectiveNode): void => {
    visit(tree, resolved);
  };
}

export function isPostkitComponentName(
  value: string,
): value is PostkitComponentName {
  return Object.prototype.hasOwnProperty.call(
    postkitDeclarationManifest.components,
    value,
  );
}

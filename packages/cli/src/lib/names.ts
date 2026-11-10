/** A component name in the forms the CLI and its templates need. */
export interface PostkitComponentNames {
  /** `CodeSample`: the MDX name and the definition's `name`. */
  readonly pascal: string;
  /** `codeSample`: the start of `codeSampleDefinition`. */
  readonly camel: string;
  /** `code-sample`: the folder, the file names and the directive suffix. */
  readonly kebab: string;
}

/**
 * Normalizes `device`, `Device`, `code-sample` or `CodeSample` into its
 * PascalCase, camelCase and kebab-case forms.
 */
export function postkitComponentNames(input: string): PostkitComponentNames {
  const trimmed = input.trim();
  if (!/^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*$/.test(trimmed)) {
    throw new PostkitCliError(
      `"${input}" isn't a component name. Use kebab-case or PascalCase, such as device or CodeSample.`,
    );
  }
  const words = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split('-')
    .filter(Boolean);
  const pascal = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
  return {
    pascal,
    camel: pascal[0].toLowerCase() + pascal.slice(1),
    kebab: words.join('-'),
  };
}

/** An error the CLI reports as a message, without a stack trace. */
export class PostkitCliError extends Error {
  override readonly name = 'PostkitCliError';
}

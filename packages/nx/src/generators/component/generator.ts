import {
  postkitComponentNames,
  postkitComponentScaffold,
  postkitRegistrationSnippet,
  postkitRepoNextSteps,
  type PostkitScaffoldLayout,
} from '@postkit/cli';

/**
 * The part of Nx's `Tree` the generator uses. Nx passes its own tree, so
 * the plugin needs no `@nx/devkit` dependency of its own.
 */
export interface PostkitGeneratorTree {
  readonly root: string;
  exists(filePath: string): boolean;
  write(filePath: string, content: string): void;
}

/** Options for `nx g @postkit/nx:component` (see `schema.json`). */
export interface PostkitComponentGeneratorSchema {
  readonly name: string;
  /** Where the component folder goes, from the workspace root. */
  readonly directory?: string;
  readonly chakra?: boolean;
  readonly spec?: boolean;
  readonly category?: string;
  readonly directive?: string;
  readonly description?: string;
  readonly importExtension?: 'js' | 'none';
  /** `postkit` writes into this repo's core, react and chakra packages. */
  readonly layout?: PostkitScaffoldLayout;
  readonly force?: boolean;
}

function joinPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\.\//, '');
}

/**
 * `nx g @postkit/nx:component <name>`: writes the same files as
 * `postkit new <name>` (the templates come from `@postkit/cli`), or, with
 * `--layout=postkit`, a built-in component's folders in Postkit's own repo.
 * Returns a callback that prints how to register it.
 */
export function componentGenerator(
  tree: PostkitGeneratorTree,
  schema: PostkitComponentGeneratorSchema,
): () => void {
  const layout = schema.layout ?? 'site';
  const scaffold = postkitComponentScaffold({
    name: schema.name,
    chakra: schema.chakra,
    spec: schema.spec,
    category: schema.category,
    directive: schema.directive,
    description: schema.description,
    importExtension: schema.importExtension === 'js' ? '.js' : '',
    layout,
  });
  const directory =
    layout === 'postkit' ? '' : (schema.directory ?? 'src/postkit');
  for (const file of scaffold.files) {
    const path = joinPath(directory, file.path);
    if (tree.exists(path) && !schema.force) {
      throw new Error(`${path} already exists. Pass --force to overwrite it.`);
    }
    tree.write(path, file.content);
  }
  const { kebab } = postkitComponentNames(schema.name);
  return () => {
    process.stdout.write(
      layout === 'postkit'
        ? `\n${postkitRepoNextSteps(scaffold)}\n`
        : `\nRegister it with createPostkit({ components }), with paths relative to your config:\n\n${postkitRegistrationSnippet(
            scaffold,
            `./${joinPath(directory)}`,
            { chakra: schema.chakra },
          )}\n\nUse it as <${scaffold.name} /> in MDX or :::${scaffold.directive} in Markdown.\nImport ${kebab}.css from your global stylesheet for the headless view.\n`,
    );
  };
}

export default componentGenerator;

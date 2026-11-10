import {
  postkitComponentCategories,
  type PostkitComponentCategoryId,
} from '@postkit/core/components';

import { postkitComponentNames, PostkitCliError } from './names.js';

/**
 * Where a scaffold's files go:
 *
 * - `site` (the default): one folder, `<name>/`, for a site's own component;
 * - `postkit`: Postkit's own repo, one folder per package (03 §2.1):
 *   `packages/core/src/components/<name>/`, `packages/react/…` and
 *   `packages/chakra/…`, importing the packages' internals.
 */
export type PostkitScaffoldLayout = 'postkit' | 'site';

/** Options for {@link postkitComponentScaffold}. */
export interface PostkitComponentScaffoldOptions {
  /** The component name: `device`, `Device`, `code-sample`… */
  readonly name: string;
  /** Also write a Chakra view and slot recipe. */
  readonly chakra?: boolean;
  /** Also write a spec per view (Vitest and `react-dom/server`). */
  readonly spec?: boolean;
  /** The catalog category. Defaults to `article-structure`. */
  readonly category?: string;
  /** The Markdown directive. Defaults to `postkit-<kebab-name>`. */
  readonly directive?: string;
  /** The one-line description for the catalog and editors. */
  readonly description?: string;
  /**
   * The extension relative imports use: `''` (bundlers, the default) or
   * `'.js'` (Node's `nodenext` resolution). The `postkit` layout always
   * uses `.js`.
   */
  readonly importExtension?: '' | '.js';
  /** Defaults to `site`. */
  readonly layout?: PostkitScaffoldLayout;
}

/** One file of a scaffold, relative to where the scaffold is written. */
export interface PostkitScaffoldFile {
  readonly path: string;
  readonly content: string;
}

/** What {@link postkitComponentScaffold} returns. */
export interface PostkitComponentScaffold {
  /** The folder name, such as `device`. */
  readonly folder: string;
  readonly name: string;
  readonly directive: string;
  readonly definitionExport: string;
  readonly files: readonly PostkitScaffoldFile[];
}

function category(input: string | undefined): PostkitComponentCategoryId {
  const value = input ?? 'article-structure';
  if (!Object.hasOwn(postkitComponentCategories, value)) {
    throw new PostkitCliError(
      `Unknown category "${value}". Use one of ${Object.keys(postkitComponentCategories).join(', ')}.`,
    );
  }
  return value as PostkitComponentCategoryId;
}

function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * The files of a new component (03 §2.1, rung 8): a definition built with
 * `definePostkitComponent`, a headless view and its CSS, and optionally a
 * Chakra view, slot recipe and specs. `postkit new` and
 * `nx g @postkit/nx:component` both write exactly these files.
 */
export function postkitComponentScaffold(
  options: PostkitComponentScaffoldOptions,
): PostkitComponentScaffold {
  const { pascal, camel, kebab } = postkitComponentNames(options.name);
  const directive = options.directive ?? `postkit-${kebab}`;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(directive)) {
    throw new PostkitCliError(
      `The directive "${directive}" must be lower-case kebab-case.`,
    );
  }
  const repo = options.layout === 'postkit';
  const ext = repo ? '.js' : (options.importExtension ?? '');
  const definitionExport = `${camel}Definition`;
  const recipeExport = repo ? `postkit${pascal}Recipe` : `${camel}Recipe`;
  const description =
    options.description ?? `${pascal}: describe it in one line for editors.`;
  const folder = {
    core: repo ? `packages/core/src/components/${kebab}` : kebab,
    react: repo ? `packages/react/src/components/${kebab}` : kebab,
    chakra: repo ? `packages/chakra/src/components/${kebab}` : kebab,
  };
  const chakraView = repo ? `${kebab}.tsx` : `${kebab}.chakra.tsx`;
  const definitionImport = repo
    ? `import { ${definitionExport} } from '@postkit/core/components';`
    : `import { ${definitionExport} } from './${kebab}.definition${ext}';`;
  const files: PostkitScaffoldFile[] = [];
  const add = (where: keyof typeof folder, file: string, content: string) =>
    files.push({ path: `${folder[where]}/${file}`, content });

  add(
    'core',
    `${kebab}.definition.ts`,
    `${
      repo
        ? `import { definePostkitComponent } from '../definition.js';
import { presentation, prop } from '../props.js';`
        : `import {
  definePostkitComponent,
  presentation,
  prop,
} from '@postkit/core/components';`
    }

/**
 * The ${pascal} contract: its props, directive and anatomy. Views in every
 * renderer read it, and the manifest and directive validation come from it.
 */
export const ${definitionExport} = definePostkitComponent({
  name: '${pascal}',
  directive: '${directive}',
  category: '${category(options.category)}',
  description: ${quote(description)},
  children: 'mdx',
  runtime: 'static',
  stability: 'experimental',
  props: {
    ...presentation,
    title: prop.string('An optional heading.'),
  },
  slots: ['root', 'title', 'body'],
  example: {
    props: { title: '${pascal}' },
    children: 'Authored content.',
  },
});
`,
  );

  add(
    'react',
    `${kebab}.tsx`,
    `${
      repo
        ? `${definitionImport}

import { postkitView } from '../../lib/view.js';`
        : `import { postkitView } from '@postkit/react';

${definitionImport}`
    }

/**
 * ${pascal}'s headless view: the anatomy and its ARIA, no styles. Style it
 * with ${kebab}.css, part styles or \`classNames\`.
 */
export const ${pascal} = postkitView(${definitionExport}, ({ props, part }) => (
  <section {...part('root')}>
    {props.title ? <p {...part('title')}>{props.title}</p> : null}
    <div {...part('body')}>{props.children}</div>
  </section>
));
`,
  );

  add(
    'react',
    `${kebab}.css`,
    `/*
 * ${pascal}'s styles for the headless view. ${
   repo
     ? 'It is part of the styles.css baseline.'
     : 'Import this file from your global\n * stylesheet;'
 } it targets the anatomy attributes, not class names.
 */
[data-postkit-component='${pascal}'] {
  display: grid;
  gap: 0.5rem;
}

[data-postkit-component='${pascal}'][data-variant='outline'] {
  border: 1px solid var(--postkit-color-border, currentColor);
  border-radius: 0.5rem;
  padding: 1rem;
}

[data-postkit-component='${pascal}'][data-variant='subtle'] {
  background: var(--postkit-color-surface, rgb(0 0 0 / 4%));
  border-radius: 0.5rem;
  padding: 1rem;
}

[data-postkit-component='${pascal}'] [data-postkit-part='title'] {
  font-weight: 600;
  margin: 0;
}
`,
  );

  if (options.chakra) {
    add(
      'chakra',
      `${kebab}.recipe.ts`,
      `import { defineSlotRecipe } from '@chakra-ui/react';
${definitionImport}

/**
 * ${pascal}'s Chakra slot recipe, with slots from the definition's anatomy.${
   repo
     ? ''
     : `
 * Register it in your system as \`postkit${pascal}\` to theme it there; the
 * view falls back to it otherwise.`
 }
 */
export const ${recipeExport} = defineSlotRecipe({
  className: 'postkit-${kebab}',
  slots: ${definitionExport}.slots,
  base: {
    root: { display: 'grid', gap: '2' },
    title: { fontWeight: 'semibold' },
    body: {},
  },
  variants: {
    size: {
      sm: { root: { textStyle: 'sm' } },
      md: { root: { textStyle: 'md' } },
      lg: { root: { textStyle: 'lg' } },
    },
    variant: {
      outline: {
        root: {
          borderWidth: '1px',
          borderColor: 'border',
          borderRadius: 'md',
          padding: '4',
        },
      },
      subtle: {
        root: { background: 'bg.subtle', borderRadius: 'md', padding: '4' },
      },
      plain: {},
    },
  },
  defaultVariants: { size: 'md', variant: 'subtle' },
});
`,
    );
    add(
      'chakra',
      chakraView,
      `'use client';

import { Box, Text } from '@chakra-ui/react';
${
  repo
    ? `${definitionImport}

import { postkitChakraView } from '../../lib/view.js';`
    : `import { postkitChakraView } from '@postkit/chakra';

${definitionImport}`
}
import { ${recipeExport} } from './${kebab}.recipe${ext}';

/** ${pascal}'s Chakra view, styled by its slot recipe. */
export const ${pascal} = postkitChakraView(
  ${definitionExport},
  ${recipeExport},
  ({ props, part }) => (
    <Box as="section" {...part('root')}>
      {props.title ? <Text {...part('title')}>{props.title}</Text> : null}
      <Box {...part('body')}>{props.children}</Box>
    </Box>
  ),${repo ? '' : `\n  { fallback: 'recipe' },`}
);
`,
    );
  }

  if (options.spec) {
    add(
      'react',
      `${kebab}.spec.tsx`,
      `import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ${pascal} } from './${kebab}${ext}';

describe('${pascal}', () => {
  it('renders its anatomy', () => {
    const html = renderToStaticMarkup(
      <${pascal} title="Hello">Authored content.</${pascal}>,
    );
    expect(html).toContain('data-postkit-component="${pascal}"');
    expect(html).toContain('data-postkit-part="title"');
    expect(html).toContain('Authored content.');
  });
});
`,
    );
    if (options.chakra) {
      add(
        'chakra',
        repo ? `${kebab}.spec.tsx` : `${kebab}.chakra.spec.tsx`,
        `import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ${pascal} } from './${chakraView.replace(/\.tsx$/, '')}${ext}';

describe('${pascal} (Chakra)', () => {
  it('renders its anatomy with the recipe', () => {
    const html = renderToStaticMarkup(
      <ChakraProvider value={defaultSystem}>
        <${pascal} title="Hello">Authored content.</${pascal}>
      </ChakraProvider>,
    );
    expect(html).toContain('data-postkit-component="${pascal}"');
    expect(html).toContain('postkit-${kebab}__root');
  });
});
`,
      );
    }
  }

  return {
    folder: kebab,
    name: pascal,
    directive,
    definitionExport,
    files,
  };
}

/** The lines that register a scaffolded component with `createPostkit`. */
export function postkitRegistrationSnippet(
  scaffold: Pick<
    PostkitComponentScaffold,
    'definitionExport' | 'folder' | 'name'
  >,
  importBase: string,
  options: { readonly chakra?: boolean } = {},
): string {
  const base = importBase.replace(/\/$/, '');
  const view = options.chakra
    ? `${base}/${scaffold.folder}/${scaffold.folder}.chakra`
    : `${base}/${scaffold.folder}/${scaffold.folder}`;
  return `import { ${scaffold.name} } from '${view}';
import { ${scaffold.definitionExport} } from '${base}/${scaffold.folder}/${scaffold.folder}.definition';

export const postkit = createPostkit({
  // …your renderer and kits
  components: [{ definition: ${scaffold.definitionExport}, view: ${scaffold.name} }],
});`;
}

/** The steps after scaffolding a built-in in Postkit's own repo. */
export function postkitRepoNextSteps(
  scaffold: Pick<
    PostkitComponentScaffold,
    'definitionExport' | 'folder' | 'name'
  >,
): string {
  return `Next, in this repo:
- packages/core/src/components/built-ins.ts: add ${scaffold.definitionExport} to postkitBuiltInDefinitions
- packages/react: export ${scaffold.name} from src/index.ts and add it to src/lib/headless-views.ts
  (styles.css picks up ${scaffold.folder}.css from its folder)
- packages/chakra: export the view, and register postkit${scaffold.name}Recipe in src/lib/theme.ts
- npm run catalog:generate && npm run components:generate`;
}

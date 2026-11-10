// Build-time data for Home. Import from `getStaticProps` only: it reads the repo's package
// files and renders email HTML, neither of which belongs in the browser bundle.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { Body, Container, Head, Html } from '@chakra-email/core';
import {
  createPostkitDocument,
  parsePostkitMarkdown,
  type PostkitDocument,
} from '@postkit/chakra/document';
import { renderEmail } from '@postkit/email';
import { emailToneColors } from '@postkit/site-emails';
import type { ReactNode } from 'react';

import {
  componentCategoryGroups,
  componentEntries,
} from '../../lib/components';
import { authoringSources, rendererArticle } from './home-content';

export interface HomeStats {
  /** Every component in the manifest. */
  readonly components: number;
  /** Kits: the manifest's component categories. */
  readonly kits: number;
  /** Shipped renderer packages (see `countRendererPackages`). */
  readonly renderers: number;
  /** The licence of the packages, from `@postkit/chakra`'s package.json. */
  readonly licence: string;
  /** The current release line, `0.2`, from `@postkit/chakra`'s version. */
  readonly release: string;
}

interface PackageJson {
  readonly name?: string;
  readonly version?: string;
  readonly license?: string;
  readonly private?: boolean;
  readonly nx?: { readonly tags?: readonly string[] };
}

/**
 * The Nx layer tags a renderer package carries. `@postkit/chakra` is `layer:chakra` and
 * `@postkit/email` is `layer:renderer` (AGENTS.md: core and unfurl → renderers → adapters).
 * Adapters (`layer:adapter`: next, astro, the routers, shiki) and foundations (`core`,
 * `unfurl`) don't draw components, so they don't count.
 */
const RENDERER_LAYER_TAGS = new Set(['layer:renderer', 'layer:chakra']);

function readJson(file: string): PackageJson {
  return JSON.parse(readFileSync(file, 'utf8')) as PackageJson;
}

/** The workspace root: the nearest directory up from the build's cwd with `nx.json`. */
function findWorkspaceRoot(start = process.cwd()): string {
  let directory = start;
  while (!existsSync(path.join(directory, 'nx.json'))) {
    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new Error(`No nx.json above ${start}; can't count packages.`);
    }
    directory = parent;
  }
  return directory;
}

/**
 * "Renderers" on Home: the packages in `packages/*` that are published (`npm:public`, not
 * `private`) and tagged with a renderer layer. Today that's `@postkit/chakra` and
 * `@postkit/email`; the headless `@postkit/react` (03 step 7) counts as soon as it lands
 * with the same tag.
 */
export function countRendererPackages(root = findWorkspaceRoot()): number {
  const packagesDirectory = path.join(root, 'packages');
  return readdirSync(packagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDirectory, entry.name, 'package.json'))
    .filter((file) => existsSync(file))
    .map(readJson)
    .filter((pkg) => {
      const tags = pkg.nx?.tags ?? [];
      return (
        !pkg.private &&
        tags.includes('npm:public') &&
        tags.some((tag) => RENDERER_LAYER_TAGS.has(tag))
      );
    }).length;
}

export function getHomeStats(): HomeStats {
  const root = findWorkspaceRoot();
  const chakra = readJson(path.join(root, 'packages/chakra/package.json'));
  const [major = '0', minor = '0'] = (chakra.version ?? '0.0.0').split('.');

  return {
    components: componentEntries.length,
    kits: componentCategoryGroups.length,
    renderers: countRendererPackages(root),
    licence: chakra.license ?? 'MIT',
    release: `${major}.${minor}`,
  };
}

/** The Email tab's frame: a 600px column, as in an inbox. */
function EmailTabFrame({ children }: { readonly children?: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Body m={0} p={0}>
        <Container maxW="600px" px={4} py={4}>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

/**
 * The renderer panel's article through `@postkit/email`'s `renderEmail` (03 §6.1): the
 * article as a portable document, its Callout mapped to the email view. The page shows the
 * HTML in an `<iframe srcDoc>`. The package's light email theme supplies everything; the only
 * override is the site's own tones (`emailToneColors`, shared with the site's emails), so the
 * Callout matches the Chakra tab next to it.
 */
export async function renderEmailArticle(): Promise<string> {
  const { lead, callout } = rendererArticle;
  const { html } = await renderEmail(
    createPostkitDocument([
      { type: 'element', name: 'p', children: [{ type: 'text', value: lead }] },
      {
        type: 'component',
        name: 'Callout',
        props: { tone: callout.tone, title: callout.title },
        children: [{ type: 'text', value: callout.body }],
      },
    ]),
    {
      format: 'document',
      theme: { colors: emailToneColors },
      wrapper: EmailTabFrame,
    },
  );
  return html;
}

/**
 * The MDX source from "Writers keep their tools", parsed into a portable document at build
 * time (`@postkit/core`'s parser, MDX component syntax on, expressions still rejected). The
 * page renders it with `@postkit/chakra`'s `DocumentRenderer`, so the "Rendered" tile is the
 * result of that exact source.
 */
export function parseAuthoringExample(): PostkitDocument {
  return parsePostkitMarkdown(authoringSources.mdx, { mdx: true });
}

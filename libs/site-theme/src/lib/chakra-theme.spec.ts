import {
  createSystem,
  defaultConfig,
  type SystemConfig,
} from '@chakra-ui/react';
import {
  defaultThemeConfig,
  recipes as builtInRecipes,
  slotRecipes as builtInSlotRecipes,
} from '@chakra-ui/react/theme';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import chakraThemeJson from './chakra-theme.json' with { type: 'json' };
import { chakraRecipes, chakraSlotRecipes } from './chakra-theme';
import { siteConfig, siteSystem } from './theme';

const workspaceRoot = resolve(__dirname, '../../../..');
const require = createRequire(import.meta.url);
const chakraEsm = join(
  dirname(require.resolve('@chakra-ui/react/package.json')),
  'dist/esm',
);

/**
 * Everything that renders Chakra components on postkit.org: the site, its libraries, the
 * Postkit packages it renders with, and chakra-docs (installed, so its built output).
 */
const sourceRoots = [
  'apps/site/src',
  'libs',
  'packages/chakra/src',
  'packages/next/src',
  'packages/react/src',
  'packages/shiki/src',
].map((root) => join(workspaceRoot, root));
const chakraDocsRoot = join(workspaceRoot, 'node_modules/@chakra-docs');
const builtRoots = existsSync(chakraDocsRoot)
  ? readdirSync(chakraDocsRoot).map((name) =>
      join(chakraDocsRoot, name, 'dist'),
    )
  : [];

function files(root: string, test: (file: string) => boolean): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) return [];
    const path = join(root, name);
    if (statSync(path).isDirectory()) {
      return name === 'dist' && !root.includes('@chakra-docs')
        ? []
        : files(path, test);
    }
    return test(path) ? [path] : [];
  });
}

const isSource = (path: string) =>
  /\.(tsx?|jsx?|mjs)$/.test(path) &&
  !/\.d\.ts$/.test(path) &&
  !/\.(spec|test|stories|spec-support)\.[a-z]+$/.test(path);

/** Names a file imports from `@chakra-ui/react` (named imports, or `Namespace.Name`). */
function chakraImports(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(
    /import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]@chakra-ui\/react['"]/g,
  )) {
    if (match[1]) continue;
    for (const specifier of match[2].split(',')) {
      const name = specifier.trim().split(/\s+as\s+/)[0];
      if (name && !name.startsWith('type ')) names.push(name);
    }
  }
  for (const match of source.matchAll(
    /import\s+\*\s+as\s+(\w+)\s+from\s*['"]@chakra-ui\/react['"]/g,
  )) {
    for (const use of source.matchAll(
      new RegExp(`\\b${match[1]}\\s*\\.\\s*([A-Z]\\w*)`, 'g'),
    )) {
      names.push(use[1]);
    }
  }
  return names;
}

/** Each `@chakra-ui/react` export, mapped to the dist file that defines it. */
function chakraExportFiles(): Map<string, string> {
  const index = readFileSync(join(chakraEsm, 'index.js'), 'utf8');
  const exports = new Map<string, string>();
  for (const match of index.matchAll(
    /export\s*\{([^}]*)\}\s*from\s*'(\.\/components\/[^']+)'/g,
  )) {
    for (const specifier of match[1].split(',')) {
      const [name, alias] = specifier.trim().split(/\s+as\s+/);
      if (name) exports.set(alias ?? name, join(chakraEsm, match[2]));
    }
  }
  const namespaces = new Map<string, string>();
  for (const match of index.matchAll(
    /import \* as (\S+) from '(\.\/components\/[^']+)'/g,
  )) {
    namespaces.set(match[1], join(chakraEsm, match[2]));
  }
  for (const match of index.matchAll(/export \{ (\S+) as (\w+) \}/g)) {
    const file = namespaces.get(match[1]);
    if (file) exports.set(match[2], file);
  }
  return exports;
}

/** Recipe keys a Chakra component file reads, following its imports of other components. */
function recipeKeys(file: string, seen = new Set<string>()): Set<string> {
  const keys = new Set<string>();
  if (seen.has(file) || !existsSync(file)) return keys;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(
    /(?:createRecipeContext|createSlotRecipeContext|useRecipe|useSlotRecipe)\(\s*\{\s*key:\s*"(\w+)"/g,
  )) {
    keys.add(match[1]);
  }
  for (const match of source.matchAll(/from\s*'(\.{1,2}\/[^']+)'/g)) {
    const target = resolve(dirname(file), match[1]);
    if (!target.startsWith(join(chakraEsm, 'components'))) continue;
    for (const key of recipeKeys(target, seen)) keys.add(key);
  }
  return keys;
}

/** The built-in recipe keys something on the site can render, and who renders them. */
function renderedBuiltInRecipes(): Map<string, Set<string>> {
  const exportFiles = chakraExportFiles();
  const builtIn = new Set([
    ...Object.keys(builtInRecipes),
    ...Object.keys(builtInSlotRecipes),
  ]);
  const rendered = new Map<string, Set<string>>();
  const consumers = [
    ...sourceRoots.flatMap((root) => files(root, isSource)),
    ...builtRoots.flatMap((root) =>
      files(root, (path) => path.endsWith('.js')),
    ),
  ];
  for (const consumer of consumers) {
    for (const name of chakraImports(readFileSync(consumer, 'utf8'))) {
      const file = exportFiles.get(name);
      if (!file) continue;
      for (const key of recipeKeys(file)) {
        if (!builtIn.has(key)) continue;
        if (!rendered.has(key)) rendered.set(key, new Set());
        rendered
          .get(key)
          ?.add(`${name} (${consumer.slice(workspaceRoot.length + 1)})`);
      }
    }
  }
  return rendered;
}

/** A config without its recipes and slot recipes. */
function withoutRecipes({ theme, ...config }: SystemConfig) {
  return {
    ...config,
    theme: Object.fromEntries(
      Object.entries(theme ?? {}).filter(
        ([key]) => key !== 'recipes' && key !== 'slotRecipes',
      ),
    ),
  };
}

describe("the site's Chakra theme", () => {
  it('copies Chakra’s default theme, recipes aside, from the installed version', () => {
    // On failure, run `node libs/site-theme/scripts/generate-chakra-theme.mjs`.
    expect(chakraThemeJson).toEqual(
      JSON.parse(JSON.stringify(withoutRecipes(defaultThemeConfig))),
    );
  });

  it('registers exactly the built-in recipes the site, Postkit and chakra-docs render', () => {
    const rendered = renderedBuiltInRecipes();
    const registered = [
      ...Object.keys(chakraRecipes),
      ...Object.keys(chakraSlotRecipes),
    ].sort();
    expect(
      registered,
      `Rendered built-in recipes:\n${[...rendered]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, by]) => `  ${key}: ${[...by].slice(0, 3).join(', ')}`)
        .join('\n')}`,
    ).toEqual([...rendered.keys()].sort());
  });

  it('registers each recipe unchanged, as a recipe or a slot recipe like Chakra', () => {
    for (const [key, recipe] of Object.entries(chakraRecipes)) {
      expect(recipe).toBe(builtInRecipes[key as keyof typeof builtInRecipes]);
      expect(siteSystem.isRecipe(key)).toBe(true);
    }
    for (const [key, recipe] of Object.entries(chakraSlotRecipes)) {
      expect(recipe).toBe(
        builtInSlotRecipes[key as keyof typeof builtInSlotRecipes],
      );
      expect(siteSystem.isSlotRecipe(key)).toBe(true);
    }
  });

  it('matches a system built on Chakra’s full default config, recipes aside', () => {
    const full = createSystem(defaultConfig, siteConfig);
    expect(withoutRecipes(siteSystem._config)).toEqual(
      withoutRecipes(full._config),
    );
    expect(siteSystem.getTokenCss()).toEqual(full.getTokenCss());
    expect(siteSystem.getGlobalCss()).toEqual(full.getGlobalCss());
    expect(siteSystem.getPreflightCss()).toEqual(full.getPreflightCss());
  });
});

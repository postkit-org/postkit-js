import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const sourceRoot = resolve(__dirname, '..');

/** Chakra's full default theme: importing any of these keeps every built-in recipe. */
const fullTheme =
  /import\s*\{[^}]*\b(defaultSystem|defaultConfig|defaultThemeConfig|recipes|slotRecipes)\b[^}]*\}\s*from\s*'@chakra-ui\/react(\/theme|\/preset)?'/;

function resolveModule(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier);
  return [
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
    join(base, 'index.ts'),
  ].find((candidate) => existsSync(candidate));
}

/** Every module `entry` reaches through relative imports and re-exports. */
function closure(entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /(?:import|export)\b[^'";]*?from\s*'(\.{1,2}\/[^']+)'/g,
    )) {
      const target = resolveModule(file, match[1]);
      if (target) queue.push(target);
    }
  }
  return seen;
}

const views = readdirSync(join(sourceRoot, 'components'))
  .map((folder) => join(sourceRoot, 'components', folder))
  .filter((folder) => statSync(folder).isDirectory())
  .flatMap((folder) =>
    readdirSync(folder)
      .filter((name) => /\.tsx?$/.test(name) && !/\.spec\./.test(name))
      .map((name) => join(folder, name)),
  );

describe("Chakra's default system boundary", () => {
  // A host that passes its own system (PostkitHostProvider) and builds it without Chakra's
  // unused recipes must not get them back through Postkit. Only createPostkitSystem,
  // PostkitProvider and the renderers' providers, which fall back to defaultSystem, may
  // import it.
  it('keeps the views, lazy views, theme and PostkitHostProvider clear of Chakra’s full theme', () => {
    const reached = closure([
      join(sourceRoot, 'lib/provider.tsx'),
      join(sourceRoot, 'lib/theme.ts'),
      join(sourceRoot, 'lib/chakra-lazy-views.ts'),
      ...views,
    ]);
    const offenders = [...reached]
      .filter((file) => fullTheme.test(readFileSync(file, 'utf8')))
      .map((file) => relative(sourceRoot, file));
    expect(offenders).toEqual([]);
  });
});

import { isDeepStrictEqual } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

/*
 * Writes manifest v2 (03 §3.2) for Postkit's built-in components to
 * packages/chakra/component-manifest.json, with the generator in
 * @postkit/core/components that createPostkit().manifest() also uses.
 * `support` is computed from the views @postkit/react and @postkit/chakra
 * export. `--check` fails when the file is stale.
 */

const workspaceRoot = fileURLToPath(new URL('../', import.meta.url));
const outputPath = join(
  workspaceRoot,
  'packages',
  'chakra',
  'component-manifest.json',
);
const dist = (path) => new URL(`../packages/${path}`, import.meta.url);

const core = await import(dist('core/dist/components/index.js'));
const react = await import(dist('react/dist/index.js'));
const chakra = await import(dist('chakra/dist/index.js'));

const manifest = core.createPostkitComponentManifest(
  Object.values(core.postkitBuiltInDefinitions).map((definition) => ({
    definition,
    kit: core.postkitKitIdForCategory(definition.category),
    package: '@postkit/core',
  })),
  {
    renderers: {
      headless: Object.keys(react.postkitHeadlessViews),
      chakra: Object.keys(chakra.postkitChakraViews),
    },
  },
);

if (!core.isPostkitComponentManifestV2(manifest)) {
  throw new Error('The generated component manifest is not v2.');
}
if (
  !isDeepStrictEqual(
    JSON.parse(JSON.stringify(manifest)),
    JSON.parse(JSON.stringify(chakra.postkitComponentCatalog)),
  )
) {
  throw new Error(
    "@postkit/chakra's postkitComponentCatalog differs from the generated manifest.",
  );
}

const output = await format(JSON.stringify(manifest), { parser: 'json' });

if (process.argv.includes('--check')) {
  let existing;
  try {
    existing = readFileSync(outputPath, 'utf8');
  } catch {
    throw new Error(
      'The generated component manifest is missing. Run npm run catalog:generate.',
    );
  }
  if (existing !== output) {
    throw new Error(
      'The generated component manifest is stale. Run npm run catalog:generate.',
    );
  }
  process.stdout.write('Component manifest (v2) is current.\n');
} else {
  writeFileSync(outputPath, output);
  process.stdout.write(`Generated ${outputPath}\n`);
}
